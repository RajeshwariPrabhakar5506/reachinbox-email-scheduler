import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { sendMail } from '../config/mailer'; // adjust path if needed

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

// Configurable limit via .env (default: 200 emails per sender per hour)
const MAX_EMAILS_PER_HOUR = Number(process.env.MAX_EMAILS_PER_HOUR) || 200;

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { to, subject, body, attachments, senderEmail } = job.data;
    const sender = senderEmail || 'default-sender';

    // Current hour key: e.g., "rate-limit:user@example.com:2026-09-27T17"
    const currentHourWindow = new Date().toISOString().slice(0, 13);
    const rateLimitKey = `rate-limit:${sender}:${currentHourWindow}`;

    // Increment Redis counter
    const currentCount = await redisConnection.incr(rateLimitKey);

    // Set expiration on first hit (3600 seconds = 1 hour)
    if (currentCount === 1) {
      await redisConnection.expire(rateLimitKey, 3600);
    }

    // Check if hourly limit exceeded
    if (currentCount > MAX_EMAILS_PER_HOUR) {
      console.warn(`[Rate Limit] Sender ${sender} hit max ${MAX_EMAILS_PER_HOUR}/hr. Rescheduling...`);

      // Calculate delay until the start of the next hour
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const delayMs = nextHour.getTime() - now.getTime();

      // Move job to delayed queue for next hour window
      await job.moveToDelayed(Date.now() + delayMs, job.token);
      throw new Error(`Rate limit exceeded for ${sender}. Job rescheduled for next hour.`);
    }

    // Process email sending via Ethereal
    console.log(`[Worker Processing] Sending to ${to} via sender ${sender}...`);
    const info = await sendMail(to, subject, body, attachments);
    return { status: 'SENT', messageId: info.messageId };
  },
  {
    connection: redisConnection,
    // 1. Configurable Worker Concurrency
    concurrency: 5,
    // 2. Minimum Delay Throttling (2-second minimum gap between sends)
    limiter: {
      max: 1,
      duration: 2000,
    },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Job ${job.id}] Completed successfully.`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] Failed: ${err.message}`);
});