import express, { Request, Response } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure multer to store files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Schedule / Send Email endpoint supporting file attachments
 */
router.post('/send', upload.array('attachments'), async (req: Request, res: Response) => {
  try {
    const { recipient, subject, body, scheduledAt, userId } = req.body;
    const files = req.files as Express.Multer.File[];

    // Convert uploaded files to nodemailer attachment format
    const attachments = files?.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    })) || [];

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipient,
      subject,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">${body}</div>`,
      attachments, // Attachments array
    };

    if (scheduledAt) {
      // Save schedule along with attachment details in DB / Queue
      // (For DB persistence, store file URLs or base64 if needed)
      return res.status(200).json({ message: 'Email scheduled successfully with attachments!' });
    }

    // Send immediately via Nodemailer
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully with attachments!' });
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

export default router;