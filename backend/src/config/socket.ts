import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getRedisClient } from './redis';
// import { NotificationService } from '../services/notificationService';
// import { MessageService } from '../services/messageService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const setupSocketIO = (io: Server): void => {
  const redis = getRedisClient();

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      socket.user = decoded;
      
      // Store user connection in Redis
      await redis.hSet(`user:${decoded.userId}`, 'socketId', socket.id);
      await redis.hSet(`user:${decoded.userId}`, 'lastSeen', new Date().toISOString());
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle user typing in conversations
    socket.on('message:typing', async (data: { conversationId: string; isTyping: boolean }) => {
      try {
        socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
          userId: socket.userId,
          conversationId: data.conversationId,
          isTyping: data.isTyping
        });
      } catch (error) {
        console.error('Error handling typing event:', error);
      }
    });

    // Handle joining conversation rooms
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle post interactions
    socket.on('post:like', async (data: { postId: string; isLiked: boolean }) => {
      try {
        // Emit to post author and followers
        socket.to(`user:${socket.userId}`).emit('post:like', {
          postId: data.postId,
          userId: socket.userId,
          isLiked: data.isLiked
        });
      } catch (error) {
        console.error('Error handling post like:', error);
      }
    });

    // Handle comment interactions
    socket.on('post:comment', async (data: { postId: string; comment: any }) => {
      try {
        // Emit to post author and comment participants
        socket.to(`post:${data.postId}`).emit('post:comment', {
          postId: data.postId,
          comment: data.comment
        });
      } catch (error) {
        console.error('Error handling post comment:', error);
      }
    });

    // Handle follow/unfollow
    socket.on('user:follow', async (data: { followedId: string; isFollowing: boolean }) => {
      try {
        // Emit to the user being followed
        socket.to(`user:${data.followedId}`).emit('user:follow', {
          followerId: socket.userId,
          followedId: data.followedId,
          isFollowing: data.isFollowing
        });
      } catch (error) {
        console.error('Error handling follow event:', error);
      }
    });

    // Handle notification read
    socket.on('notification:read', async (notificationId: string) => {
      try {
        // Mark notification as read in database
        // await NotificationService.markAsRead(notificationId, socket.userId!);
        
        // Emit to user
        socket.emit('notification:read', { notificationId });
      } catch (error) {
        console.error('Error handling notification read:', error);
      }
    });

    // Handle message read
    socket.on('message:read', async (data: { messageId: string; conversationId: string }) => {
      try {
        // Mark message as read in database
        // await MessageService.markAsRead(data.messageId, socket.userId!);
        
        // Emit to conversation participants
        socket.to(`conversation:${data.conversationId}`).emit('message:read', {
          messageId: data.messageId,
          conversationId: data.conversationId,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        console.log(`User ${socket.userId} disconnected`);
        
        // Update last seen in Redis
        if (socket.userId) {
          await redis.hSet(`user:${socket.userId}`, 'lastSeen', new Date().toISOString());
          await redis.hDel(`user:${socket.userId}`, 'socketId');
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  // Export io instance for use in other parts of the application
  (global as any).io = io;
};

// Helper function to emit to specific users
export const emitToUser = (userId: string, event: string, data: any): void => {
  const io = (global as any).io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper function to emit to multiple users
export const emitToUsers = (userIds: string[], event: string, data: any): void => {
  const io = (global as any).io;
  if (io) {
    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit(event, data);
    });
  }
};

// Helper function to emit to conversation
export const emitToConversation = (conversationId: string, event: string, data: any): void => {
  const io = (global as any).io;
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

// Helper function to get user's socket ID
export const getUserSocketId = async (userId: string): Promise<string | null> => {
  const redis = getRedisClient();
  return await redis.hGet(`user:${userId}`, 'socketId');
};

// Helper function to check if user is online
export const isUserOnline = async (userId: string): Promise<boolean> => {
  const socketId = await getUserSocketId(userId);
  return socketId !== null;
};