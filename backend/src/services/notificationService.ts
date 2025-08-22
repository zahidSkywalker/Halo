import { Notification, NotificationType, NotificationSettings } from '../types';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    data: {
      actorId?: string;
      postId?: string;
      commentId?: string;
      message?: string;
    }
  ): Promise<Notification> {
    // In a real implementation, this would save to database
    // For now, we'll return a mock notification
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      actorId: data.actorId,
      postId: data.postId,
      commentId: data.commentId,
      message: data.message,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TODO: Save to database
    // await db.notifications.create(notification);

    return notification;
  }

  /**
   * Get user's notifications
   */
  static async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    // TODO: Implement database query
    // const notifications = await db.notifications.findMany({
    //   where: { userId, ...(unreadOnly && { isRead: false }) },
    //   orderBy: { createdAt: 'desc' },
    //   take: limit,
    //   skip: offset,
    //   include: { actor: true, post: true }
    // });

    // Mock data for now
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId,
        type: NotificationType.LIKE,
        actorId: 'user_123',
        postId: 'post_456',
        message: 'John Doe liked your post',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: '2',
        userId,
        type: NotificationType.COMMENT,
        actorId: 'user_789',
        postId: 'post_456',
        commentId: 'comment_123',
        message: 'Jane Smith commented on your post',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ];

    return mockNotifications.slice(offset, offset + limit);
  }

  /**
   * Get count of unread notifications
   */
  static async getUnreadCount(userId: string): Promise<number> {
    // TODO: Implement database query
    // const count = await db.notifications.count({
    //   where: { userId, isRead: false }
    // });

    // Mock data for now
    return 1;
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    // TODO: Implement database update
    // await db.notifications.updateMany({
    //   where: { id: { in: notificationIds }, userId },
    //   data: { isRead: true, updatedAt: new Date() }
    // });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    // TODO: Implement database update
    // await db.notifications.updateMany({
    //   where: { userId, isRead: false },
    //   data: { isRead: true, updatedAt: new Date() }
    // });
  }

  /**
   * Get notification settings
   */
  static async getSettings(userId: string): Promise<NotificationSettings> {
    // TODO: Implement database query
    // const settings = await db.notificationSettings.findUnique({
    //   where: { userId }
    // });

    // Default settings
    const defaultSettings: NotificationSettings = {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      followNotifications: true,
      mentionNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return defaultSettings;
  }

  /**
   * Update notification settings
   */
  static async updateSettings(
    userId: string,
    updates: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    // TODO: Implement database update
    // const settings = await db.notificationSettings.upsert({
    //   where: { userId },
    //   update: { ...updates, updatedAt: new Date() },
    //   create: { userId, ...updates, createdAt: new Date(), updatedAt: new Date() }
    // });

    // Mock update
    const currentSettings = await this.getSettings(userId);
    const updatedSettings: NotificationSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return updatedSettings;
  }

  /**
   * Create notification for post like
   */
  static async notifyPostLike(
    postAuthorId: string,
    actorId: string,
    postId: string
  ): Promise<void> {
    if (postAuthorId === actorId) return; // Don't notify self

    await this.createNotification(postAuthorId, NotificationType.LIKE, {
      actorId,
      postId,
      message: 'Someone liked your post'
    });
  }

  /**
   * Create notification for post comment
   */
  static async notifyPostComment(
    postAuthorId: string,
    actorId: string,
    postId: string,
    commentId: string
  ): Promise<void> {
    if (postAuthorId === actorId) return; // Don't notify self

    await this.createNotification(postAuthorId, NotificationType.COMMENT, {
      actorId,
      postId,
      commentId,
      message: 'Someone commented on your post'
    });
  }

  /**
   * Create notification for new follower
   */
  static async notifyNewFollower(
    followedUserId: string,
    followerId: string
  ): Promise<void> {
    if (followedUserId === followerId) return; // Don't notify self

    await this.createNotification(followedUserId, NotificationType.FOLLOW, {
      actorId: followerId,
      message: 'Someone started following you'
    });
  }

  /**
   * Create notification for mention
   */
  static async notifyMention(
    mentionedUserId: string,
    actorId: string,
    postId: string,
    commentId?: string
  ): Promise<void> {
    if (mentionedUserId === actorId) return; // Don't notify self

    await this.createNotification(mentionedUserId, NotificationType.MENTION, {
      actorId,
      postId,
      commentId,
      message: 'Someone mentioned you in a post'
    });
  }
}