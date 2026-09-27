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

    const targetUserEmail = userEmail || senderEmail || 'prabhakarrajeshwari306@gmail.com';
    const targetUserName = userName || 'Rajeshwari P';
    const fallbackUserId = userId || 'user-123';

    // 1. Ensure user exists in PostgreSQL database by looking up / upserting via email
    // This guarantees we get the exact primary key id that PostgreSQL recognizes.
    const dbUser = await prisma.user.upsert({
      where: { email: targetUserEmail },
      update: {
        name: targetUserName,
      },
      create: {
        id: fallbackUserId,
        email: targetUserEmail,
        name: targetUserName,
      },
    });

    // 2. Create EmailSchedule record in database using the reliable dbUser.id
    const email = await prisma.emailSchedule.create({
      data: {
        recipient,
        subject,
        body,
        senderEmail: targetUserEmail,
        scheduledAt: scheduledDate,
        status: 'SCHEDULED',
        userId: dbUser.id, // Always matches the database user primary key!
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
    const rawUserId = (req.query.userId as string) || 'user-123';

    // Look up user by id or email to ensure we fetch records accurately even if frontend ID differs slightly
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawUserId },
          { email: 'prabhakarrajeshwari306@gmail.com' }
        ]
      }
    });

    const targetId = userRecord ? userRecord.id : rawUserId;

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId: targetId,
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
    const rawUserId = (req.query.userId as string) || 'user-123';

    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawUserId },
          { email: 'prabhakarrajeshwari306@gmail.com' }
        ]
      }
    });

    const targetId = userRecord ? userRecord.id : rawUserId;

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId: targetId,
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
    const rawUserId = (userId as string) || 'user-123';
    const searchQuery = (query as string) || '';

    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawUserId },
          { email: 'prabhakarrajeshwari306@gmail.com' }
        ]
      }
    });

    const targetId = userRecord ? userRecord.id : rawUserId;

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId: targetId,
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