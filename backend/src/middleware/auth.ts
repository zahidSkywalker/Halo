import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { getRedisClient } from '../config/redis';
// import { UserRole } from '../../shared/types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified: boolean;
    role: string;
  };
}

const redis = getRedisClient();

// Verify JWT token
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user still exists and is active
    const userExists = await redis.get(`user:${decoded.userId}:active`);
    if (!userExists) {
      throw new AuthenticationError('User account is inactive or deleted');
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      displayName: decoded.displayName,
      profilePicture: decoded.profilePicture,
      isVerified: decoded.isVerified,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user still exists and is active
    const userExists = await redis.get(`user:${decoded.userId}:active`);
    if (!userExists) {
      return next();
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      displayName: decoded.displayName,
      profilePicture: decoded.profilePicture,
      isVerified: decoded.isVerified,
      role: decoded.role
    };

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Require specific role
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};

// Require admin role
export const requireAdmin = requireRole(['admin']);

// Require moderator or admin role
export const requireModerator = requireRole(['moderator', 'admin']);

// Require verified user
export const requireVerified = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!req.user.isVerified) {
    throw new AuthorizationError('Account verification required');
  }

  next();
};

// Check if user owns the resource or is admin
export const requireOwnership = (resourceUserId: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied');
    }

    next();
  };
};

// Check if user can access private profile
export const canAccessProfile = (profileUserId: string, isPrivate: boolean) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      if (isPrivate) {
        throw new AuthenticationError('Authentication required to view private profile');
      }
      return next();
    }

    // Users can always see their own profile
    if (req.user.id === profileUserId) {
      return next();
    }

    // Admins can see all profiles
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if following (for private profiles)
    if (isPrivate) {
      // This would need to be implemented with actual follow relationship check
      // For now, we'll throw an error
      throw new AuthorizationError('Cannot access private profile');
    }

    next();
  };
};

// Generate new access token
export const generateAccessToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// Generate refresh token
export const generateRefreshToken = (user: any): string => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );
};

// Blacklist token (for logout)
export const blacklistToken = async (token: string, expiresIn: number): Promise<void> => {
  await redis.set(`blacklist:${token}`, 'true', expiresIn);
};

// Get user from token without verification (for internal use)
export const getUserFromToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};