import express from 'express';
import cors from 'cors';
import multer from 'multer'; // <-- 1. Import multer
import { register, login } from './controllers/authController';
import { 
  scheduleEmail, 
  getScheduledEmails, 
  getSentEmails, 
  searchEmails 
} from './controllers/emailController';
import { processStuckEmails } from './workers/emailWorker';

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // <-- 2. Configure multer memory storage

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Email Scheduler Routes (Add upload.array('attachments') here so FormData fields populate)
app.post('/api/emails/schedule', upload.array('attachments'), scheduleEmail);
app.get('/api/emails/scheduled', getScheduledEmails);
app.get('/api/emails/sent', getSentEmails);
app.get('/api/emails/search', searchEmails);

const PORT = 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Backend running on http://127.0.0.1:${PORT}`);
  await processStuckEmails();
});