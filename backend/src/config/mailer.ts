import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export const getTransporter = async () => {
  if (transporter) return transporter;

  // Generate a free test account on Ethereal Email dynamically
  const testAccount = await nodemailer.createTestAccount();

  console.log('--- Ethereal SMTP Credentials ---');
  console.log(`User: ${testAccount.user}`);
  console.log(`Pass: ${testAccount.pass}`);
  console.log('---------------------------------');

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
};

export const sendMail = async (to: string, subject: string, body: string, attachments?: any[]) => {
  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: '"ReachInbox Scheduler" <no-reply@reachinbox.ai>',
    to,
    subject,
    html: body,
    attachments,
  });

  console.log(`[Email Sent] Message ID: ${info.messageId}`);
  // Log the Ethereal web preview URL (crucial for your demo video!)
  console.log(`[Ethereal Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);

  return info;
};