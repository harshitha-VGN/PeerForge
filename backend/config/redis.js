import Redis from "ioredis";

export const isRedisConfigured = () => {
  return Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim());
};

export const createRedisClient = (overrides = {}) => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop trying to reconnect if server is unreachable
      }
      return Math.min(times * 300, 2000);
    },
    ...overrides,
  });
};

export const checkRedisHealth = async () => {
  if (!isRedisConfigured()) {
    return false;
  }
  let testClient = null;
  try {
    testClient = createRedisClient({ connectTimeout: 3000 });
    if (!testClient) return false;

    const pong = await Promise.race([
      testClient.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis ping timeout")), 3000)
      ),
    ]);

    testClient.disconnect();
    return pong === "PONG";
  } catch (err) {
    console.warn("[Redis] Health check failed, falling back to MongoDB:", err.message);
    if (testClient) {
      try {
        testClient.disconnect();
      } catch (e) {
        // ignore
      }
    }
    return false;
  }
};
