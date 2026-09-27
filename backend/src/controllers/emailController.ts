import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { emailQueue } from '../queues/emailQueue';

/**
 * Schedule a new email job
 */
export const scheduleEmail = async (req: Request, res: Response) => {
  try {
    const { recipient, subject, body, senderEmail, scheduledAt, userId, userEmail, userName } = req.body;

    if (!recipient || !subject || !body || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields: recipient, subject, body, and scheduledAt are required.' });
    }

    const scheduledDate = new Date(scheduledAt);
    const delay = scheduledDate.getTime() - Date.now();

    const targetUserId = userId || 'user-123';
    const targetUserEmail = userEmail || senderEmail || 'prabhakarrajeshwari306@gmail.com';
    const targetUserName = userName || 'Rajeshwari P';

    // 1. Ensure user exists in PostgreSQL database
    await prisma.user.upsert({
      where: { id: targetUserId },
      update: {
        email: targetUserEmail,
        name: targetUserName,
      },
      create: {
        id: targetUserId,
        email: targetUserEmail,
        name: targetUserName,
      },
    });

    // 2. Create EmailSchedule record in database
    const email = await prisma.emailSchedule.create({
      data: {
        recipient,
        subject,
        body,
        senderEmail: targetUserEmail,
        scheduledAt: scheduledDate,
        status: 'SCHEDULED',
        userId: targetUserId,
      },
    });

    // 3. Add job to BullMQ queue (run immediately if scheduled time is in the past)
    const job = await emailQueue.add(
      'send-email',
      { emailId: email.id },
      { 
        delay: delay > 0 ? delay : 0,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    // 4. Update DB record with BullMQ Job ID
    if (job.id) {
      await prisma.emailSchedule.update({
        where: { id: email.id },
        data: { jobId: String(job.id) },
      });
    }

    return res.status(201).json({
      message: 'Email scheduled successfully',
      email,
    });
  } catch (error: any) {
    console.error('Error scheduling email:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get all SCHEDULED emails for a specific user
 */
export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'user-123';

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return res.status(200).json(emails);
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get all SENT emails for a specific user
 */
export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'user-123';

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId,
        status: 'SENT',
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return res.status(200).json(emails);
  } catch (error: any) {
    console.error('Error fetching sent emails:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Search scheduled or sent emails by recipient or subject query
 */
export const searchEmails = async (req: Request, res: Response) => {
  try {
    const { query, userId } = req.query;
    const targetUserId = (userId as string) || 'user-123';
    const searchQuery = (query as string) || '';

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId: targetUserId,
        OR: [
          { recipient: { contains: searchQuery, mode: 'insensitive' } },
          { subject: { contains: searchQuery, mode: 'insensitive' } },
          { body: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return res.status(200).json(emails);
  } catch (error: any) {
    console.error('Error searching emails:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};