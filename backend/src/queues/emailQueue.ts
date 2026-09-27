import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export const emailQueue = new Queue('email-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});