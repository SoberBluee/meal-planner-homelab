import Redis from "ioredis";
import { logAction } from "@/lib/logger";

export const CACHE_KEYS = {
  meals: "mealplanner:meals",
  ingredients: "mealplanner:ingredients",
  essentials: "mealplanner:essentials",
} as const;

let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const host = process.env.REDIS_HOST;
  if (!host) {
    return null;
  }

  redisInstance = new Redis({
    host,
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
  });

  redisInstance.on("error", (error) => {
    logAction(
      {
        action: "redis.error",
        outcome: "failure",
        summary: "Redis connection error",
        message: error.message,
      },
      "warn",
    );
  });

  return redisInstance;
}

function ttlSeconds(): number {
  const ttl = Number(process.env.REDIS_TTL_SECONDS || 300);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
}

export async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (!redis) {
    return loader();
  }

  try {
    const hit = await redis.get(key);
    if (hit !== null) {
      return JSON.parse(hit) as T;
    }
  } catch (error) {
    logAction(
      {
        action: "redis.cache_miss_fallback",
        outcome: "failure",
        summary: `Redis get failed for ${key}, loading from MySQL`,
        cacheKey: key,
        message: (error as Error).message,
      },
      "warn",
    );
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds());
  } catch (error) {
    logAction(
      {
        action: "redis.cache_set_failed",
        outcome: "failure",
        summary: `Redis set failed for ${key}`,
        cacheKey: key,
        message: (error as Error).message,
      },
      "warn",
    );
  }

  return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    logAction(
      {
        action: "redis.invalidate_failed",
        outcome: "failure",
        summary: `Redis del failed for ${keys.join(", ")}`,
        cacheKeys: keys,
        message: (error as Error).message,
      },
      "warn",
    );
  }
}
