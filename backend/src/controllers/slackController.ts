import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/db';

export const handleSlackWebhook = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Slack webhook active' });
};

export async function handleSlackOAuthCallback(req: Request, res: Response) {
  const { code, state } = req.query; // state contains userId

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
      },
    });

    if (response.data.ok) {
      await prisma.user.update({
        where: { id: state as string },
        data: {
          slackToken: response.data.access_token,
          slackWebhook: response.data.incoming_webhook?.url,
        },
      });

      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?slack=connected`);
    }

    return res.status(400).json({ error: 'Slack authentication failed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}