import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function getRedisClient() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set, rate limiting will use in-memory fallback');
    return null;
  }
  
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

export const redis = globalForRedis.redis ?? getRedisClient();

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

    if (redis) {
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
      console.error('Redis rate limit error:', error);
      // Fail open - allow request if Redis fails
      return { allowed: true, remaining: this.maxRequests, resetAt: new Date(now + this.windowMs) };
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
}

// Pre-configured rate limiters
export const searchRateLimiter = new RateLimiter(24 * 60 * 60 * 1000); // 24 hours
export const apiRateLimiter = new RateLimiter(60 * 1000, 10); // 1 minute, 10 requests

export default redis;
