import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { prisma } from '../config/db';
import { emailQueue } from '../queues/emailQueue';

// 1. Transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Google 16-character App Password
  },
});

// 2. Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// 3. Define Worker
export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { emailId } = job.data;
    console.log(`\n[Worker] Processing email ID: ${emailId}`);

    const emailRecord = await prisma.emailSchedule.findUnique({
      where: { id: emailId },
    });

    if (!emailRecord) {
      console.log(`[Worker] Record ${emailId} not found.`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${emailRecord.senderEmail}" <${process.env.SMTP_USER}>`,
        to: emailRecord.recipient,
        subject: emailRecord.subject,
        text: emailRecord.body,
        html: `<p>${emailRecord.body.replace(/\n/g, '<br>')}</p>`,
      });

      console.log(`[Worker] Email sent! MessageID: ${info.messageId}`);

      await prisma.emailSchedule.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (err: any) {
      console.error(`[Worker] Failed to send email: ${err.message}`);

      await prisma.emailSchedule.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });

      throw err;
    }
  },
  { connection: redisOptions }
);

emailWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

// 4. Function to auto-drain and send any stuck scheduled emails
export const processStuckEmails = async () => {
  try {
    const overdue = await prisma.emailSchedule.findMany({
      where: {
        status: 'SCHEDULED',
      },
    });

    console.log(`[Worker Sync] Found ${overdue.length} scheduled email(s) waiting in DB.`);

    for (const email of overdue) {
      console.log(`[Worker Sync] Queueing overdue email ID: ${email.id}`);
      await emailQueue.add(
        'send-email',
        { emailId: email.id },
        { delay: 0 } // Run immediately
      );
    }
  } catch (err) {
    console.error('[Worker Sync Error]:', err);
  }
};