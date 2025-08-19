import { getDatabase } from '../config/database';
import { Post, CreatePostData, FeedPost, Media, MediaType } from '../../../shared/types';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError } from '../middleware/errorHandler';
import { UserService } from './userService';

const database = getDatabase();

export class PostService {
  // Create a new post
  static async createPost(authorId: string, postData: CreatePostData): Promise<Post> {
    const { content, media, hashtags, mentions } = postData;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Post content cannot be empty');
    }

    if (content.length > 1000) {
      throw new ValidationError('Post content cannot exceed 1000 characters');
    }

    // Start transaction
    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Create post
      const postResult = await client.query(
        `INSERT INTO posts (content, author_id)
         VALUES ($1, $2)
         RETURNING *`,
        [content.trim(), authorId]
      );

      const post = postResult.rows[0];
      const postId = post.id;

      // Process hashtags
      if (hashtags && hashtags.length > 0) {
        await this.processHashtags(client, postId, hashtags);
      }

      // Process mentions
      if (mentions && mentions.length > 0) {
        await this.processMentions(client, postId, mentions);
      }

      // Process media
      if (media && media.length > 0) {
        await this.processMedia(client, postId, media);
      }

      await client.query('COMMIT');

      // Return complete post with author
      return await this.getPostById(postId, authorId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get post by ID
  static async getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    const result = await database.query(
      `SELECT p.*, 
              u.id as author_id, u.username, u.display_name, u.profile_picture, u.is_verified,
              CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
              CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
       FROM posts p
       INNER JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $2
       LEFT JOIN bookmarks b ON b.post_id = p.id AND b.user_id = $2
       WHERE p.id = $1 AND p.is_deleted = false AND u.is_active = true`,
      [postId, currentUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const post = result.rows[0];
    const media = await this.getPostMedia(postId);
    const hashtags = await this.getPostHashtags(postId);
    const mentions = await this.getPostMentions(postId);

    return this.mapPostFromDB(post, media, hashtags, mentions);
  }

  // Get user's feed
  static async getUserFeed(userId: string, limit: number = 20, cursor?: string): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
    let query = `
      SELECT p.*, 
             u.id as author_id, u.username, u.display_name, u.profile_picture, u.is_verified,
             CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
             CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      LEFT JOIN follows f ON f.followed_id = p.author_id
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
      LEFT JOIN bookmarks b ON b.post_id = p.id AND b.user_id = $1
      WHERE p.is_deleted = false 
        AND u.is_active = true
        AND (f.follower_id = $1 OR p.author_id = $1)
    `;

    const params = [userId];
    let paramCount = 2;

    if (cursor) {
      query += ` AND p.created_at < $${paramCount}`;
      params.push(cursor);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount}`;
    params.push((limit + 1).toString()); // Get one extra to check if there are more

    const result = await database.query(query, params);
    const posts = result.rows;

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      nextCursor = posts[limit - 1].created_at;
      posts.pop(); // Remove the extra post
    }

    const feedPosts: FeedPost[] = [];
    for (const post of posts) {
      const media = await this.getPostMedia(post.id);
      const hashtags = await this.getPostHashtags(post.id);
      const mentions = await this.getPostMentions(post.id);

      feedPosts.push({
        ...this.mapPostFromDB(post, media, hashtags, mentions),
        isRepost: false // TODO: Implement repost functionality
      });
    }

    return { posts: feedPosts, nextCursor };
  }

  // Get user's posts
  static async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const result = await database.query(
      `SELECT p.*, 
              u.id as author_id, u.username, u.display_name, u.profile_picture, u.is_verified,
              CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
              CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
       FROM posts p
       INNER JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
       LEFT JOIN bookmarks b ON b.post_id = p.id AND b.user_id = $1
       WHERE p.author_id = $1 AND p.is_deleted = false AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const posts: Post[] = [];
    for (const post of result.rows) {
      const media = await this.getPostMedia(post.id);
      const hashtags = await this.getPostHashtags(post.id);
      const mentions = await this.getPostMentions(post.id);

      posts.push(this.mapPostFromDB(post, media, hashtags, mentions));
    }

    return posts;
  }

  // Update post
  static async updatePost(postId: string, userId: string, updates: { content?: string }): Promise<Post> {
    // Check if user owns the post
    const post = await this.getPostById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId !== userId) {
      throw new AuthorizationError('Cannot edit another user\'s post');
    }

    const { content } = updates;

    if (content !== undefined) {
      if (content.trim().length === 0) {
        throw new ValidationError('Post content cannot be empty');
      }

      if (content.length > 1000) {
        throw new ValidationError('Post content cannot exceed 1000 characters');
      }
    }

    const result = await database.query(
      `UPDATE posts 
       SET content = COALESCE($1, content), is_edited = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND author_id = $3
       RETURNING *`,
      [content?.trim(), postId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Post not found');
    }

    return await this.getPostById(postId, userId) as Post;
  }

  // Delete post (soft delete)
  static async deletePost(postId: string, userId: string): Promise<void> {
    // Check if user owns the post
    const post = await this.getPostById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId !== userId) {
      throw new AuthorizationError('Cannot delete another user\'s post');
    }

    const result = await database.query(
      'UPDATE posts SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND author_id = $2',
      [postId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Post not found');
    }
  }

  // Like a post
  static async likePost(postId: string, userId: string): Promise<void> {
    try {
      await database.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [userId, postId]
      );
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('Post already liked');
      }
      throw error;
    }
  }

  // Unlike a post
  static async unlikePost(postId: string, userId: string): Promise<void> {
    const result = await database.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Like not found');
    }
  }

  // Bookmark a post
  static async bookmarkPost(postId: string, userId: string): Promise<void> {
    try {
      await database.query(
        'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)',
        [userId, postId]
      );
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('Post already bookmarked');
      }
      throw error;
    }
  }

  // Remove bookmark
  static async removeBookmark(postId: string, userId: string): Promise<void> {
    const result = await database.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Bookmark not found');
    }
  }

  // Get bookmarked posts
  static async getBookmarkedPosts(userId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const result = await database.query(
      `SELECT p.*, 
              u.id as author_id, u.username, u.display_name, u.profile_picture, u.is_verified,
              CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
              CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
       FROM posts p
       INNER JOIN users u ON p.author_id = u.id
       INNER JOIN bookmarks bm ON bm.post_id = p.id
       LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
       LEFT JOIN bookmarks b ON b.post_id = p.id AND b.user_id = $1
       WHERE bm.user_id = $1 AND p.is_deleted = false AND u.is_active = true
       ORDER BY bm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const posts: Post[] = [];
    for (const post of result.rows) {
      const media = await this.getPostMedia(post.id);
      const hashtags = await this.getPostHashtags(post.id);
      const mentions = await this.getPostMentions(post.id);

      posts.push(this.mapPostFromDB(post, media, hashtags, mentions));
    }

    return posts;
  }

  // Search posts
  static async searchPosts(query: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const result = await database.query(
      `SELECT DISTINCT p.*, 
              u.id as author_id, u.username, u.display_name, u.profile_picture, u.is_verified
       FROM posts p
       INNER JOIN users u ON p.author_id = u.id
       LEFT JOIN post_hashtags ph ON ph.post_id = p.id
       LEFT JOIN hashtags h ON h.id = ph.hashtag_id
       WHERE (p.content ILIKE $1 OR h.name ILIKE $1)
         AND p.is_deleted = false AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );

    const posts: Post[] = [];
    for (const post of result.rows) {
      const media = await this.getPostMedia(post.id);
      const hashtags = await this.getPostHashtags(post.id);
      const mentions = await this.getPostMentions(post.id);

      posts.push(this.mapPostFromDB(post, media, hashtags, mentions));
    }

    return posts;
  }

  // Helper methods
  private static async processHashtags(client: any, postId: string, hashtags: string[]): Promise<void> {
    for (const hashtagName of hashtags) {
      const cleanHashtag = hashtagName.replace('#', '').toLowerCase();
      
      // Insert or get hashtag
      let hashtagResult = await client.query(
        'SELECT id FROM hashtags WHERE name = $1',
        [cleanHashtag]
      );

      let hashtagId: string;
      if (hashtagResult.rows.length === 0) {
        const newHashtagResult = await client.query(
          'INSERT INTO hashtags (name) VALUES ($1) RETURNING id',
          [cleanHashtag]
        );
        hashtagId = newHashtagResult.rows[0].id;
      } else {
        hashtagId = hashtagResult.rows[0].id;
      }

      // Link hashtag to post
      await client.query(
        'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2)',
        [postId, hashtagId]
      );
    }
  }

  private static async processMentions(client: any, postId: string, mentions: string[]): Promise<void> {
    // TODO: Implement mention processing
    // This would involve finding users by username and creating notifications
  }

  private static async processMedia(client: any, postId: string, media: File[]): Promise<void> {
    // TODO: Implement media processing
    // This would involve uploading files to S3 and creating media records
  }

  private static async getPostMedia(postId: string): Promise<Media[]> {
    const result = await database.query(
      `SELECT m.* FROM media m
       INNER JOIN post_media pm ON pm.media_id = m.id
       WHERE pm.post_id = $1
       ORDER BY pm.order_index`,
      [postId]
    );

    return result.rows.map(row => ({
      id: row.id,
      url: row.url,
      type: row.type as MediaType,
      altText: row.alt_text,
      width: row.width,
      height: row.height
    }));
  }

  private static async getPostHashtags(postId: string): Promise<string[]> {
    const result = await database.query(
      `SELECT h.name FROM hashtags h
       INNER JOIN post_hashtags ph ON ph.hashtag_id = h.id
       WHERE ph.post_id = $1`,
      [postId]
    );

    return result.rows.map(row => row.name);
  }

  private static async getPostMentions(postId: string): Promise<string[]> {
    // TODO: Implement mention retrieval
    return [];
  }

  private static mapPostFromDB(dbPost: any, media: Media[], hashtags: string[], mentions: string[]): Post {
    return {
      id: dbPost.id,
      content: dbPost.content,
      authorId: dbPost.author_id,
      author: {
        id: dbPost.author_id,
        username: dbPost.username,
        displayName: dbPost.display_name,
        profilePicture: dbPost.profile_picture,
        isVerified: dbPost.is_verified,
        email: '', // Not included in post queries for security
        bio: '',
        coverPhoto: '',
        isPrivate: false,
        location: '',
        website: '',
        birthDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      },
      media,
      hashtags,
      mentions,
      likesCount: parseInt(dbPost.likes_count) || 0,
      commentsCount: parseInt(dbPost.comments_count) || 0,
      sharesCount: parseInt(dbPost.shares_count) || 0,
      isLiked: dbPost.is_liked || false,
      isBookmarked: dbPost.is_bookmarked || false,
      isEdited: dbPost.is_edited || false,
      createdAt: dbPost.created_at,
      updatedAt: dbPost.updated_at
    };
  }
}