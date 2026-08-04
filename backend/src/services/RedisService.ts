import redis from "../config/redis";

class RedisService {
  private prefix: string;

  constructor(prefix: string = "invoicefin") {
    this.prefix = prefix;
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await redis.setex(this.key(key), ttlSeconds, value);
    } else {
      await redis.set(this.key(key), value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await redis.get(this.key(key));
  }

  async del(key: string): Promise<void> {
    await redis.del(this.key(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(this.key(key));
    return result === 1;
  }

  async setObject(key: string, obj: Record<string, any>, ttlSeconds?: number): Promise<void> {
    await redis.set(this.key(key), JSON.stringify(obj), "EX", ttlSeconds || 3600);
  }

  async getObject<T = any>(key: string): Promise<T | null> {
    const data = await redis.get(this.key(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async increment(key: string): Promise<number> {
    return await redis.incr(this.key(key));
  }

  async decrement(key: string): Promise<number> {
    return await redis.decr(this.key(key));
  }

  async setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redis.setex(this.key(key), ttlSeconds, value);
  }

  async getKeys(pattern: string): Promise<string[]> {
    return await redis.keys(this.key(pattern));
  }

  async flushPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(this.key(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cacheService = new RedisService("cache");
export const sessionService = new RedisService("session");
export const otpService = new RedisService("otp");
export default RedisService;
