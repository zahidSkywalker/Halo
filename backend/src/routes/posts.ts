import { Router } from 'express';
import Joi from 'joi';
import { PostService } from '../services/postService';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  hashtags: Joi.array().items(Joi.string()).optional(),
  mentions: Joi.array().items(Joi.string()).optional(),
  media: Joi.array().items(Joi.object({
    type: Joi.string().valid('image', 'video').required(),
    url: Joi.string().uri().required(),
    thumbnail: Joi.string().uri().optional()
  })).optional()
});

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
});

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(500).required()
});

const likeSchema = Joi.object({
  postId: Joi.string().uuid().required()
});

const shareSchema = Joi.object({
  postId: Joi.string().uuid().required(),
  content: Joi.string().max(500).optional()
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = createPostSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const post = await PostService.createPost(req.user!.id, value);
  
  res.status(201).json({
    success: true,
    data: post
  });
}));

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get user's feed
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: User's feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeedPost'
 *                     nextCursor:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/feed', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 20, cursor } = req.query;

  const feed = await PostService.getUserFeed(
    req.user!.id,
    parseInt(limit as string),
    cursor as string
  );
  
  res.json({
    success: true,
    data: feed
  });
}));

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a specific post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:postId', optionalAuth, asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user?.id;

  const post = await PostService.getPostById(postId, currentUserId);
  if (!post) {
    throw new ValidationError('Post not found');
  }
  
  res.json({
    success: true,
    data: post
  });
}));

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot edit another user's post
 *       404:
 *         description: Post not found
 */
router.put('/:postId', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { error, value } = updatePostSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const post = await PostService.updatePost(postId, req.user!.id, value);
  
  res.json({
    success: true,
    data: post
  });
}));

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot delete another user's post
 *       404:
 *         description: Post not found
 */
router.delete('/:postId', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  await PostService.deletePost(postId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/like', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await PostService.toggleLike(req.user!.id, postId);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/unlike:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found or not liked
 */
router.delete('/:postId/unlike', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  await PostService.unlikePost(postId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Post unliked successfully'
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   post:
 *     summary: Bookmark a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post bookmarked successfully
 *       400:
 *         description: Post already bookmarked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/bookmark', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  await PostService.bookmarkPost(postId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Post bookmarked successfully'
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   delete:
 *     summary: Remove bookmark from a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found or not bookmarked
 */
router.delete('/:postId/bookmark', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  await PostService.removeBookmark(postId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Bookmark removed successfully'
  });
}));

/**
 * @swagger
 * /api/posts/bookmarks:
 *   get:
 *     summary: Get user's bookmarked posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: User's bookmarked posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 */
router.get('/bookmarks', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const posts = await PostService.getBookmarkedPosts(
    req.user!.id,
    parseInt(limit as string),
    parseInt(offset as string)
  );
  
  res.json({
    success: true,
    data: posts
  });
}));

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: Search posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       400:
 *         description: Search query required
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;

  if (!q || typeof q !== 'string') {
    throw new ValidationError('Search query is required');
  }

  const posts = await PostService.searchPosts(q, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: posts
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/comments', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { error, value } = commentSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const comment = await PostService.addComment(req.user!.id, postId, value.content);
  
  res.status(201).json({
    success: true,
    data: comment
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Post comments
 *       404:
 *         description: Post not found
 */
router.get('/:postId/comments', asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const comments = await PostService.getComments(
    postId,
    parseInt(limit as string),
    parseInt(offset as string)
  );
  
  res.json({
    success: true,
    data: comments
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/share:
 *   post:
 *     summary: Share a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Post shared successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/share', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { error, value } = shareSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const sharedPost = await PostService.sharePost(req.user!.id, postId, value.content);
  
  res.status(201).json({
    success: true,
    data: sharedPost
  });
}));

/**
 * @swagger
 * /api/posts/{postId}/media:
 *   post:
 *     summary: Upload media for a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/media', authenticateToken, asyncHandler(async (req, res) => {
  const { postId } = req.params;
  
  // Note: This is a placeholder. In production, you'd use multer or similar
  // to handle file uploads and integrate with cloud storage (AWS S3, etc.)
  
  res.json({
    success: true,
    message: 'Media upload endpoint - implement with file upload middleware'
  });
}));

// Get trending topics
router.get('/trending', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Get trending hashtags based on post count
    const trendingTopics = await PostService.getTrendingTopics();
    
    res.json({
      success: true,
      data: trendingTopics
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending topics'
    });
  }
}));

export default router;