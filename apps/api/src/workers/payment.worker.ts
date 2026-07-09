import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { paymentService } from '../services/payment.service.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const paymentQueue = new Queue('payments', { connection });

const worker = new Worker('payments', async (job) => {
  const { paymentId, action } = job.data;

  switch (action) {
    case 'execute':
      await paymentService.execute(paymentId);
      break;
    case 'simulate':
      await paymentService.simulate(paymentId);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}, {
  connection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 60000,
  },
});

worker.on('completed', (job) => {
  console.log(`Payment job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Payment job ${job?.id} failed:`, err.message);
});

export { worker as paymentWorker };
