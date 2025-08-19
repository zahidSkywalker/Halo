import { Router } from 'express';
import Joi from 'joi';
import { UserService } from '../services/userService';
import { PostService } from '../services/postService';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(1).max(100).optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),
  isPrivate: Joi.boolean().optional(),
  profilePicture: Joi.string().uri().optional(),
  coverPhoto: Joi.string().uri().optional()
});

const followUserSchema = Joi.object({
  userId: Joi.string().uuid().required()
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.user!.id);
  
  res.json({
    success: true,
    data: user
  });
}));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               website:
 *                 type: string
 *                 format: uri
 *               isPrivate:
 *                 type: boolean
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *               coverPhoto:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const user = await UserService.updateUserProfile(req.user!.id, value);
  
  res.json({
    success: true,
    data: user
  });
}));

/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     summary: Get user profile by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 */
router.get('/:username', optionalAuth, asyncHandler(async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id;

  const user = await UserService.getUserByUsername(username);
  if (!user) {
    throw new ValidationError('User not found');
  }

  const profile = await UserService.getUserProfile(user.id, currentUserId);
  
  res.json({
    success: true,
    data: profile
  });
}));

/**
 * @swagger
 * /api/users/{username}/posts:
 *   get:
 *     summary: Get user posts
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
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
 *         description: User posts
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
 *       404:
 *         description: User not found
 */
router.get('/:username/posts', optionalAuth, asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const user = await UserService.getUserByUsername(username);
  if (!user) {
    throw new ValidationError('User not found');
  }

  const posts = await PostService.getUserPosts(user.id, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: posts
  });
}));

/**
 * @swagger
 * /api/users/{username}/followers:
 *   get:
 *     summary: Get user followers
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
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
 *         description: User followers
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
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:username/followers', optionalAuth, asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const user = await UserService.getUserByUsername(username);
  if (!user) {
    throw new ValidationError('User not found');
  }

  const followers = await UserService.getFollowers(user.id, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: followers
  });
}));

/**
 * @swagger
 * /api/users/{username}/following:
 *   get:
 *     summary: Get users that this user follows
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Users being followed
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
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:username/following', optionalAuth, asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const user = await UserService.getUserByUsername(username);
  if (!user) {
    throw new ValidationError('User not found');
  }

  const following = await UserService.getFollowing(user.id, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: following
  });
}));

/**
 * @swagger
 * /api/users/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User followed successfully
 *       400:
 *         description: Cannot follow yourself or already following
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/follow/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await UserService.followUser(req.user!.id, userId);
  
  res.json({
    success: true,
    message: 'User followed successfully'
  });
}));

/**
 * @swagger
 * /api/users/unfollow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or not following
 */
router.delete('/unfollow/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await UserService.unfollowUser(req.user!.id, userId);
  
  res.json({
    success: true,
    message: 'User unfollowed successfully'
  });
}));

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
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
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Search query required
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;

  if (!q || typeof q !== 'string') {
    throw new ValidationError('Search query is required');
  }

  const users = await UserService.searchUsers(q, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: users
  });
}));

export default router;