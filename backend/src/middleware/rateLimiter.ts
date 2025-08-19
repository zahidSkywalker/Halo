import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedisClient } from '../config/redis';
import { RateLimitError } from './errorHandler';

const redis = getRedisClient();

// General rate limiter
const generalLimiter = new RateLimiterRedis({
  storeClient: redis.rateLimiterClient,
  keyPrefix: 'general',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // Convert to seconds
  blockDuration: 60 * 15, // Block for 15 minutes
});

// Auth rate limiter (more strict)
const authLimiter = new RateLimiterRedis({
  storeClient: redis.rateLimiterClient,
  keyPrefix: 'auth',
  points: 5, // 5 attempts
  duration: 60 * 15, // 15 minutes
  blockDuration: 60 * 60, // Block for 1 hour
});

// Upload rate limiter
const uploadLimiter = new RateLimiterRedis({
  storeClient: redis.rateLimiterClient,
  keyPrefix: 'upload',
  points: 10, // 10 uploads
  duration: 60 * 60, // 1 hour
  blockDuration: 60 * 30, // Block for 30 minutes
});

// Search rate limiter
const searchLimiter = new RateLimiterRedis({
  storeClient: redis.rateLimiterClient,
  keyPrefix: 'search',
  points: 30, // 30 searches
  duration: 60 * 5, // 5 minutes
  blockDuration: 60 * 10, // Block for 10 minutes
});

// Get client IP
const getClientIP = (req: Request): string => {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  ) as string;
};

// General rate limiter middleware
export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    await generalLimiter.consume(clientIP);
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      next(new RateLimitError('Rate limit exceeded'));
    } else {
      const retryAfter = Math.round(error.msBeforeNext / 1000) || 60;
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_ERROR',
          status: 429,
          retryAfter
        }
      });
    }
  }
};

// Auth rate limiter middleware
export const authRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    await authLimiter.consume(clientIP);
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      next(new RateLimitError('Too many authentication attempts'));
    } else {
      const retryAfter = Math.round(error.msBeforeNext / 1000) || 3600;
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many authentication attempts. Please try again later.',
          code: 'AUTH_RATE_LIMIT_ERROR',
          status: 429,
          retryAfter
        }
      });
    }
  }
};

// Upload rate limiter middleware
export const uploadRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    await uploadLimiter.consume(clientIP);
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      next(new RateLimitError('Upload rate limit exceeded'));
    } else {
      const retryAfter = Math.round(error.msBeforeNext / 1000) || 1800;
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          message: 'Upload rate limit exceeded. Please try again later.',
          code: 'UPLOAD_RATE_LIMIT_ERROR',
          status: 429,
          retryAfter
        }
      });
    }
  }
};

// Search rate limiter middleware
export const searchRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    await searchLimiter.consume(clientIP);
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      next(new RateLimitError('Search rate limit exceeded'));
    } else {
      const retryAfter = Math.round(error.msBeforeNext / 1000) || 600;
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          message: 'Search rate limit exceeded. Please try again later.',
          code: 'SEARCH_RATE_LIMIT_ERROR',
          status: 429,
          retryAfter
        }
      });
    }
  }
};

// User-specific rate limiter
export const userRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    const userLimiter = new RateLimiterRedis({
      storeClient: redis.rateLimiterClient,
      keyPrefix: `user:${userId}`,
      points: 1000, // 1000 requests
      duration: 60 * 60, // 1 hour
      blockDuration: 60 * 30, // Block for 30 minutes
    });

    await userLimiter.consume(userId);
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      next(new RateLimitError('User rate limit exceeded'));
    } else {
      const retryAfter = Math.round(error.msBeforeNext / 1000) || 1800;
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          message: 'User rate limit exceeded. Please try again later.',
          code: 'USER_RATE_LIMIT_ERROR',
          status: 429,
          retryAfter
        }
      });
    }
  }
};

// Reset rate limit for a specific IP (admin function)
export const resetRateLimit = async (identifier: string, type: 'general' | 'auth' | 'upload' | 'search' | 'user'): Promise<void> => {
  try {
    const limiter = getLimiterByType(type);
    await limiter.delete(identifier);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    throw error;
  }
};

// Get limiter by type
const getLimiterByType = (type: string): RateLimiterRedis => {
  switch (type) {
    case 'auth':
      return authLimiter;
    case 'upload':
      return uploadLimiter;
    case 'search':
      return searchLimiter;
    default:
      return generalLimiter;
  }
};