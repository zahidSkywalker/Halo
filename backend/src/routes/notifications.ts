import { Router } from 'express';
import Joi from 'joi';
import { NotificationService } from '../services/notificationService';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const markAsReadSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string().uuid()).required()
});

const updateSettingsSchema = Joi.object({
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  likeNotifications: Joi.boolean().optional(),
  commentNotifications: Joi.boolean().optional(),
  followNotifications: Joi.boolean().optional(),
  mentionNotifications: Joi.boolean().optional()
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
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
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: User's notifications
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, unreadOnly = false } = req.query;

  const notifications = await NotificationService.getNotifications(
    req.user!.id,
    parseInt(limit as string),
    parseInt(offset as string),
    unreadOnly === 'true'
  );
  
  res.json({
    success: true,
    data: notifications
  });
}));

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *       401:
 *         description: Unauthorized
 */
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const count = await NotificationService.getUnreadCount(req.user!.id);
  
  res.json({
    success: true,
    data: { count }
  });
}));

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/mark-read', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = markAsReadSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  await NotificationService.markAsRead(req.user!.id, value.notificationIds);
  
  res.json({
    success: true,
    message: 'Notifications marked as read'
  });
}));

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.post('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(req.user!.id);
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const settings = await NotificationService.getSettings(req.user!.id);
  
  res.json({
    success: true,
    data: settings
  });
}));

/**
 * @swagger
 * /api/notifications/settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               likeNotifications:
 *                 type: boolean
 *               commentNotifications:
 *                 type: boolean
 *               followNotifications:
 *                 type: boolean
 *               mentionNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = updateSettingsSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const settings = await NotificationService.updateSettings(req.user!.id, value);
  
  res.json({
    success: true,
    data: settings
  });
}));

export default router;