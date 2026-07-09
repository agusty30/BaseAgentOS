import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { strategyService } from '../services/strategy.service.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const strategyQueue = new Queue('strategies', { connection });

const worker = new Worker('strategies', async (job) => {
  const { strategyId, action } = job.data;

  const strategy = await strategyService.getById(strategyId);
  if (!strategy || strategy.status !== 'active') return;

  switch (action) {
    case 'evaluate': {
      if (strategy.type === 'dca' || strategy.type === 'recurring-buy') {
        const evaluation = strategyService.evaluateDCA(strategy.config as Record<string, unknown>);
        if (evaluation.shouldExecute) {
          await strategyService.logExecution(strategyId, null, 'completed', evaluation);
        }
      } else if (strategy.type === 'rebalance') {
        const evaluation = strategyService.evaluateRebalance(
          strategy.config as Record<string, unknown>,
          {},
        );
        if (evaluation.needsRebalance) {
          await strategyService.logExecution(strategyId, null, 'completed', evaluation);
        }
      }
      break;
    }
    default:
      throw new Error(`Unknown strategy action: ${action}`);
  }
}, {
  connection,
  concurrency: 3,
});

worker.on('completed', (job) => {
  console.log(`Strategy job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Strategy job ${job?.id} failed:`, err.message);
});

export { worker as strategyWorker };
