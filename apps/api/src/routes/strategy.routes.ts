import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { strategyService } from '../services/strategy.service.js';

const createStrategySchema = z.object({
  walletId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['dca', 'recurring-buy', 'recurring-sell', 'rebalance', 'profit-target', 'stop-loss']),
  config: z.record(z.unknown()),
  autonomousExecution: z.boolean().default(false),
  maxDailySpend: z.string().default('1000'),
  maxPositionSize: z.string().default('5000'),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
});

export async function strategyRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/', async (request) => {
    const body = createStrategySchema.parse(request.body);
    return strategyService.create({ ...body, userId: request.user.id });
  });

  app.get('/', async (request) => {
    return strategyService.listByUser(request.user.id);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return strategyService.getById(id);
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      name: z.string().optional(),
      config: z.record(z.unknown()).optional(),
      maxDailySpend: z.string().optional(),
      maxPositionSize: z.string().optional(),
      autonomousExecution: z.boolean().optional(),
    }).parse(request.body);
    return strategyService.update(id, body);
  });

  app.post('/:id/activate', async (request) => {
    const { id } = request.params as { id: string };
    return strategyService.updateStatus(id, 'active');
  });

  app.post('/:id/pause', async (request) => {
    const { id } = request.params as { id: string };
    return strategyService.updateStatus(id, 'paused');
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await strategyService.delete(id);
    return reply.status(204).send();
  });

  app.get('/:id/executions', async (request) => {
    const { id } = request.params as { id: string };
    return strategyService.getExecutions(id);
  });
}
