import { redis } from '../config/redis';

export async function checkAndIncrementHourlyLimit(
  senderEmail: string,
  maxPerHour: number
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  // Keyed by hour window + sender
  const currentHourWindow = new Date().toISOString().slice(0, 13);
  const key = `rate_limit:${senderEmail}:${currentHourWindow}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // Expire in 1 hour
  }

  const ttl = await redis.ttl(key);

  if (count > maxPerHour) {
    return { allowed: false, remaining: 0, resetInSeconds: ttl > 0 ? ttl : 60 };
  }

  return { allowed: true, remaining: maxPerHour - count, resetInSeconds: ttl };
}