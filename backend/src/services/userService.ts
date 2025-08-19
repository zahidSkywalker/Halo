import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';
import { User, UserProfile, UserRole } from '../../../shared/types';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler';

const database = getDatabase();

export class UserService {
  // Create a new user
  static async createUser(userData: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    bio?: string;
  }): Promise<User> {
    const { email, username, displayName, password, bio } = userData;

    // Check if email already exists
    const existingEmail = await database.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      throw new ConflictError('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await database.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existingUsername.rows.length > 0) {
      throw new ConflictError('Username already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await database.query(
      `INSERT INTO users (email, username, display_name, password_hash, bio, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [email, username, displayName, passwordHash, bio, UserRole.USER, true]
    );

    const user = result.rows[0];
    return this.mapUserFromDB(user);
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    const result = await database.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapUserFromDB(result.rows[0]);
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await database.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapUserFromDB(result.rows[0]);
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<User | null> {
    const result = await database.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapUserFromDB(result.rows[0]);
  }

  // Get user profile with relationship status
  static async getUserProfile(userId: string, currentUserId?: string): Promise<UserProfile | null> {
    const result = await database.query(
      `SELECT u.*, 
              CASE WHEN f1.follower_id IS NOT NULL THEN true ELSE false END as is_following,
              CASE WHEN f2.followed_id IS NOT NULL THEN true ELSE false END as is_followed_by
       FROM users u
       LEFT JOIN follows f1 ON f1.follower_id = $2 AND f1.followed_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id = u.id AND f2.followed_id = $2
       WHERE u.id = $1 AND u.is_active = true`,
      [userId, currentUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      ...this.mapUserFromDB(user),
      isFollowing: user.is_following,
      isFollowedBy: user.is_followed_by
    };
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    updates: {
      displayName?: string;
      bio?: string;
      location?: string;
      website?: string;
      isPrivate?: boolean;
      profilePicture?: string;
      coverPhoto?: string;
    }
  ): Promise<User> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(userId);
    const result = await database.query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND is_active = true
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapUserFromDB(result.rows[0]);
  }

  // Follow a user
  static async followUser(followerId: string, followedId: string): Promise<void> {
    if (followerId === followedId) {
      throw new ValidationError('Cannot follow yourself');
    }

    try {
      await database.query(
        'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)',
        [followerId, followedId]
      );
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('Already following this user');
      }
      throw error;
    }
  }

  // Unfollow a user
  static async unfollowUser(followerId: string, followedId: string): Promise<void> {
    const result = await database.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2',
      [followerId, followedId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Follow relationship not found');
    }
  }

  // Get followers
  static async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    const result = await database.query(
      `SELECT u.* FROM users u
       INNER JOIN follows f ON f.follower_id = u.id
       WHERE f.followed_id = $1 AND u.is_active = true
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(user => this.mapUserFromDB(user));
  }

  // Get following
  static async getFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    const result = await database.query(
      `SELECT u.* FROM users u
       INNER JOIN follows f ON f.followed_id = u.id
       WHERE f.follower_id = $1 AND u.is_active = true
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(user => this.mapUserFromDB(user));
  }

  // Search users
  static async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    const result = await database.query(
      `SELECT * FROM users 
       WHERE (username ILIKE $1 OR display_name ILIKE $1 OR bio ILIKE $1)
       AND is_active = true
       ORDER BY 
         CASE WHEN username ILIKE $1 THEN 1
              WHEN display_name ILIKE $1 THEN 2
              ELSE 3 END,
         created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );

    return result.rows.map(user => this.mapUserFromDB(user));
  }

  // Verify password
  static async verifyPassword(userId: string, password: string): Promise<boolean> {
    const result = await database.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return bcrypt.compare(password, result.rows[0].password_hash);
  }

  // Update password
  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const result = await database.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Delete user (soft delete)
  static async deleteUser(userId: string): Promise<void> {
    const result = await database.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Update last login
  static async updateLastLogin(userId: string): Promise<void> {
    await database.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Helper method to map database user to User type
  private static mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      displayName: dbUser.display_name,
      bio: dbUser.bio,
      profilePicture: dbUser.profile_picture,
      coverPhoto: dbUser.cover_photo,
      isVerified: dbUser.is_verified,
      isPrivate: dbUser.is_private,
      location: dbUser.location,
      website: dbUser.website,
      birthDate: dbUser.birth_date,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      followersCount: dbUser.followers_count || 0,
      followingCount: dbUser.following_count || 0,
      postsCount: dbUser.posts_count || 0
    };
  }

  // Helper method to convert camelCase to snake_case
  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}