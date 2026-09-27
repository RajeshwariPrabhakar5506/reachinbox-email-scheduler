import axios from 'axios';
import { prisma } from '../config/db';

export async function sendSlackNotification(userId: string, message: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || (!user.slackWebhook && !user.slackToken)) {
    // If not connected, gracefully bypass without throwing an error
    return;
  }

  try {
    if (user.slackWebhook) {
      await axios.post(user.slackWebhook, { text: message });
    } else if (user.slackToken) {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel: '#general', text: message },
        { headers: { Authorization: `Bearer ${user.slackToken}` } }
      );
    }
  } catch (error) {
    console.error('Slack Notification Error:', error);
  }
}