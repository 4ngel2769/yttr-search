import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisConnected: boolean;
};

let isRedisConnected = false;

function getRedisClient() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set, rate limiting will use in-memory fallback');
    return null;
  }
  
  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('Redis connection failed after 3 attempts, using in-memory fallback');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });
    
    client.on('connect', () => {
      isRedisConnected = true;
      console.log('✓ Redis connected successfully');
    });

    client.on('error', (err) => {
      isRedisConnected = false;
      // Suppress noisy error logs - just warn once
      if (!globalForRedis.redisConnected) {
        console.warn('Redis unavailable, using in-memory rate limiting');
        globalForRedis.redisConnected = true; // Flag to prevent repeated warnings
      }
    });

    client.on('close', () => {
      isRedisConnected = false;
    });
    
    // Attempt connection in background
    client.connect().catch(() => {
      isRedisConnected = false;
    });
    
    return client;
  } catch (error) {
    console.warn('Failed to create Redis client, using in-memory fallback');
    return null;
  }
}

export const redis = globalForRedis.redis ?? getRedisClient();
export function isRedisAvailable(): boolean {
  return isRedisConnected && redis !== null;
}

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}

// In-memory fallback for development without Redis
const inMemoryStore = new Map<string, { count: number; windowStart: number }>();

/**
 * Rate limiter with Redis backend (or in-memory fallback)
 */
export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 24 * 60 * 60 * 1000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async check(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Only use Redis if it's actually connected
    if (isRedisAvailable()) {
      return this.checkWithRedis(identifier, now, windowStart);
    }
    return this.checkInMemory(identifier, now, windowStart);
  }

  private async checkWithRedis(
    identifier: string,
    now: number,
    windowStart: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      // Remove old entries
      await redis!.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in current window
      const count = await redis!.zcard(key);
      
      if (count >= this.maxRequests) {
        const oldestEntry = await redis!.zrange(key, 0, 0, 'WITHSCORES');
        const resetAt = oldestEntry.length > 1 
          ? new Date(parseFloat(oldestEntry[1]) + this.windowMs)
          : new Date(now + this.windowMs);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt,
        };
      }

      // Add new request
      await redis!.zadd(key, now, `${now}:${Math.random()}`);
      await redis!.expire(key, Math.ceil(this.windowMs / 1000));

      return {
        allowed: true,
        remaining: this.maxRequests - count - 1,
        resetAt: new Date(now + this.windowMs),
      };
    } catch (error) {
      // If Redis fails, fall back to in-memory for this request
      return this.checkInMemory(identifier, now, windowStart);
    }
  }

  private checkInMemory(
    identifier: string,
    now: number,
    windowStart: number
  ): { allowed: boolean; remaining: number; resetAt: Date } {
    const record = inMemoryStore.get(identifier);

    if (!record || record.windowStart < windowStart) {
      inMemoryStore.set(identifier, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: new Date(now + this.windowMs),
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.windowStart + this.windowMs),
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: new Date(record.windowStart + this.windowMs),
    };
  }

  setMaxRequests(max: number) {
    this.maxRequests = max;
  }

  // Check remaining requests without incrementing the counter
  async peek(identifier: string): Promise<{
    remaining: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Only use Redis if it's actually connected
    if (isRedisAvailable()) {
      return this.peekWithRedis(identifier, now, windowStart);
    }
    return this.peekInMemory(identifier, now, windowStart);
  }

  private async peekWithRedis(
    identifier: string,
    now: number,
    windowStart: number
  ): Promise<{ remaining: number; resetAt: Date }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      // Remove old entries
      await redis!.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in current window
      const count = await redis!.zcard(key);
      
      const oldestEntry = await redis!.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldestEntry.length > 1 
        ? new Date(parseFloat(oldestEntry[1]) + this.windowMs)
        : new Date(now + this.windowMs);

      return {
        remaining: Math.max(0, this.maxRequests - count),
        resetAt,
      };
    } catch (error) {
      return this.peekInMemory(identifier, now, windowStart);
    }
  }

  private peekInMemory(
    identifier: string,
    now: number,
    windowStart: number
  ): { remaining: number; resetAt: Date } {
    const record = inMemoryStore.get(identifier);

    if (!record || record.windowStart < windowStart) {
      return {
        remaining: this.maxRequests,
        resetAt: new Date(now + this.windowMs),
      };
    }

    return {
      remaining: Math.max(0, this.maxRequests - record.count),
      resetAt: new Date(record.windowStart + this.windowMs),
    };
  }
}

// Pre-configured rate limiters
export const searchRateLimiter = new RateLimiter(24 * 60 * 60 * 1000); // 24 hours
export const anonymousSearchRateLimiter = new RateLimiter(24 * 60 * 60 * 1000, 10); // 24 hours, 10 requests for anon
export const apiRateLimiter = new RateLimiter(60 * 1000, 10); // 1 minute, 10 requests

export default redis;
