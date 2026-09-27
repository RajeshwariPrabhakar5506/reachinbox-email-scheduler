import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { emailQueue } from '../queues/emailQueue';
import { indexEmailToElasticsearch } from '../services/searchService';

export async function scheduleEmails(req: Request, res: Response) {
  try {
    const { userId, recipients, subject, body, senderEmail, startTime, delayBetweenSendsMs, maxPerHour } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is required' });
    }

    const createdSchedules = [];
    const baseStartTime = new Date(startTime).getTime();

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      // Stagger initial execution timing based on per-email delay
      const scheduledAt = new Date(baseStartTime + i * (delayBetweenSendsMs || 0));

      const record = await prisma.emailSchedule.create({
        data: {
          userId,
          recipient,
          subject,
          body,
          senderEmail,
          scheduledAt,
          status: 'SCHEDULED',
        },
      });

      const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

      // Add delayed job to BullMQ queue
      const job = await emailQueue.add(
        'send-email',
        {
          emailScheduleId: record.id,
          recipient,
          subject,
          body,
          senderEmail,
          userId,
          maxPerHour: maxPerHour || 200,
          delayBetweenSendsMs: delayBetweenSendsMs || 2000,
        },
        {
          delay: delayMs,
          jobId: record.id, // Idempotency key prevents duplicates
        }
      );

      await prisma.emailSchedule.update({
        where: { id: record.id },
        data: { jobId: job.id },
      });

      await indexEmailToElasticsearch(record);
      createdSchedules.push(record);
    }

    return res.json({ message: 'Emails scheduled successfully', count: createdSchedules.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getScheduledEmails(req: Request, res: Response) {
  const { userId } = req.query;
  const emails = await prisma.emailSchedule.findMany({
    where: {
      userId: userId as string,
      status: { in: ['SCHEDULED', 'DELAYED_RATE_LIMIT'] },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  return res.json(emails);
}

export async function getSentEmails(req: Request, res: Response) {
  const { userId } = req.query;
  const emails = await prisma.emailSchedule.findMany({
    where: {
      userId: userId as string,
      status: { in: ['SENT', 'FAILED'] },
    },
    orderBy: { sentAt: 'desc' },
  });
  return res.json(emails);
}