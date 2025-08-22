import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from './errorHandler';

// Simple in-memory rate limiter (works without Redis)
class MemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private points: number;
  private duration: number;
  private blockDuration: number;

  constructor(points: number, duration: number, blockDuration: number) {
    this.points = points;
    this.duration = duration;
    this.blockDuration = blockDuration;
  }

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // First request or reset time passed
      this.store.set(key, {
        count: 1,
        resetTime: now + this.duration * 1000
      });
      return;
    }

    if (record.count >= this.points) {
      // Rate limit exceeded
      const error: any = new Error('Rate limit exceeded');
      error.msBeforeNext = record.resetTime - now;
      throw error;
    }

    // Increment count
    record.count++;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Create rate limiters
const generalLimiter = new MemoryRateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
  60 * 15 // 15 minutes
);

const authLimiter = new MemoryRateLimiter(5, 60 * 15, 60 * 60); // 5 attempts, 15 min window, 1 hour block
const uploadLimiter = new MemoryRateLimiter(10, 60 * 60, 60 * 30); // 10 uploads, 1 hour window, 30 min block
const searchLimiter = new MemoryRateLimiter(30, 60 * 5, 60 * 10); // 30 searches, 5 min window, 10 min block

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

    const userLimiter = new MemoryRateLimiter(1000, 60 * 60, 60 * 30); // 1000 requests, 1 hour, 30 min block
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
const getLimiterByType = (type: string): MemoryRateLimiter => {
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