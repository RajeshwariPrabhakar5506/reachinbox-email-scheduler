import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queues/emailQueue'; // Ensure this points to your BullMQ queue instance

const app = express();

// Set up Bull Board Express Adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

// Mount the live dashboard route
app.use('/admin/queues', serverAdapter.getRouter());


// Your existing express routes and app.listen logic remain here...