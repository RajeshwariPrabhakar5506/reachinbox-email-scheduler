import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthHandler = async (req: any, res: any) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Invalid Google token' });

    const { sub, email, name, picture } = payload;

    // Create or retrieve user from your DB using Prisma / Postgres
    const user = {
      id: sub,
      email,
      name,
      avatar: picture,
    };

    // Generate backend JWT token
    const appToken = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    return res.json({ token: appToken, user });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};