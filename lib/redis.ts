import Redis from "ioredis";

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
    console.warn("[redis]", error.message);
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
    console.warn(`[redis] get ${key} failed, falling back to MySQL:`, (error as Error).message);
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds());
  } catch (error) {
    console.warn(`[redis] set ${key} failed:`, (error as Error).message);
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
    console.warn(`[redis] del ${keys.join(", ")} failed:`, (error as Error).message);
  }
}
