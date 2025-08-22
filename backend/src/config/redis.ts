import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: 2000, // 2 second timeout
        commandTimeout: 1000, // 1 second command timeout
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('error', (err) => {
      console.warn('Redis Client Error (non-critical):', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        // Add timeout to prevent hanging
        const connectionPromise = this.client.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
        });
        
        await Promise.race([connectionPromise, timeoutPromise]);
      }
    } catch (error) {
      console.warn('Redis connection failed (continuing without Redis):', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.warn('Redis disconnection error:', error);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping SET operation');
        return;
      }
      
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.warn('Redis SET error (non-critical):', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping GET operation');
        return null;
      }
      
      return await this.client.get(key);
    } catch (error) {
      console.warn('Redis GET error (non-critical):', error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping DEL operation');
        return 0;
      }
      
      return await this.client.del(key);
    } catch (error) {
      console.warn('Redis DEL error (non-critical):', error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping EXISTS operation');
        return 0;
      }
      
      return await this.client.exists(key);
    } catch (error) {
      console.warn('Redis EXISTS error (non-critical):', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping EXPIRE operation');
        return false;
      }
      
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.warn('Redis EXPIRE error (non-critical):', error);
      return false;
    }
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping HSET operation');
        return 0;
      }
      
      return await this.client.hSet(key, field, value);
    } catch (error) {
      console.warn('Redis HSET error (non-critical):', error);
      return 0;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping HGET operation');
        return null;
      }
      
      return await this.client.hGet(key, field);
    } catch (error) {
      console.warn('Redis HGET error (non-critical):', error);
      return null;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping HGETALL operation');
        return {};
      }
      
      return await this.client.hGetAll(key);
    } catch (error) {
      console.warn('Redis HGETALL error (non-critical):', error);
      return {};
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping HDEL operation');
        return 0;
      }
      
      return await this.client.hDel(key, field);
    } catch (error) {
      console.warn('Redis HDEL error (non-critical):', error);
      return 0;
    }
  }

  async lPush(key: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping LPUSH operation');
        return 0;
      }
      
      return await this.client.lPush(key, value);
    } catch (error) {
      console.warn('Redis LPUSH error (non-critical):', error);
      return 0;
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping RPOP operation');
        return null;
      }
      
      return await this.client.rPop(key);
    } catch (error) {
      console.warn('Redis RPOP error (non-critical):', error);
      return null;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping LRANGE operation');
        return [];
      }
      
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      console.warn('Redis LRANGE error (non-critical):', error);
      return [];
    }
  }

  async sAdd(key: string, member: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping SADD operation');
        return 0;
      }
      
      return await this.client.sAdd(key, member);
    } catch (error) {
      console.warn('Redis SADD error (non-critical):', error);
      return 0;
    }
  }

  async sRem(key: string, member: string): Promise<number> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping SREM operation');
        return 0;
      }
      
      return await this.client.sRem(key, member);
    } catch (error) {
      console.warn('Redis SREM error (non-critical):', error);
      return 0;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping SMEMBERS operation');
        return [];
      }
      
      return await this.client.sMembers(key);
    } catch (error) {
      console.warn('Redis SMEMBERS error (non-critical):', error);
      return [];
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping SISMEMBER operation');
        return false;
      }
      
      return await this.client.sIsMember(key, member);
    } catch (error) {
      console.warn('Redis SISMEMBER error (non-critical):', error);
      return false;
    }
  }

  async ping(): Promise<string> {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping PING operation');
        return 'PONG';
      }
      
      return await this.client.ping();
    } catch (error) {
      console.warn('Redis PING error (non-critical):', error);
      return 'PONG';
    }
  }

  // Get client for rate limiter
  get rateLimiterClient(): any {
    return this.client;
  }

  // Check connection status
  get connected(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connection attempt completed');
  } catch (error) {
    console.warn('Redis connection failed (continuing without Redis):', error);
  }
};

export const getRedisClient = (): RedisClient => redisClient;

export default redisClient;