import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error('Redis disconnection error:', error);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value);
    } catch (error) {
      console.error('Redis HSET error:', error);
      throw error;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      throw error;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      throw error;
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hDel(key, field);
    } catch (error) {
      console.error('Redis HDEL error:', error);
      throw error;
    }
  }

  async lPush(key: string, value: string): Promise<number> {
    try {
      return await this.client.lPush(key, value);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      throw error;
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      console.error('Redis RPOP error:', error);
      throw error;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      throw error;
    }
  }

  async sAdd(key: string, member: string): Promise<number> {
    try {
      return await this.client.sAdd(key, member);
    } catch (error) {
      console.error('Redis SADD error:', error);
      throw error;
    }
  }

  async sRem(key: string, member: string): Promise<number> {
    try {
      return await this.client.sRem(key, member);
    } catch (error) {
      console.error('Redis SREM error:', error);
      throw error;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      throw error;
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      return await this.client.sIsMember(key, member);
    } catch (error) {
      console.error('Redis SISMEMBER error:', error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      console.error('Redis PING error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }
    console.log('Redis connection established');
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClient => redisClient;

export default redisClient;