import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { paymentService } from '../services/payment.service.js';
import { riskService } from '../services/risk.service.js';

const createPaymentSchema = z.object({
  walletId: z.string().uuid(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  token: z.string().default('USDC'),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
  type: z.enum(['one-time', 'scheduled', 'recurring', 'conditional', 'batch']).default('one-time'),
  scheduledAt: z.string().datetime().optional(),
  cronExpression: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const batchPaymentSchema = z.object({
  walletId: z.string().uuid(),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
  payments: z.array(z.object({
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: z.string(),
  })).min(1).max(100),
});

export async function paymentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/', async (request) => {
    const body = createPaymentSchema.parse(request.body);
    const risk = await riskService.assess({
      userId: request.user.id,
      type: 'payment',
      amountUsd: parseFloat(body.amount),
      network: body.network,
    });
    if (!risk.approved) {
      return { error: 'Risk check failed', risk };
    }
    return paymentService.create({ ...body, userId: request.user.id });
  });

  app.get('/', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    return paymentService.listByUser(request.user.id, parseInt(limit || '50'), parseInt(offset || '0'));
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return paymentService.getById(id);
  });

  app.post('/:id/execute', async (request) => {
    const { id } = request.params as { id: string };
    return paymentService.execute(id);
  });

  app.post('/:id/simulate', async (request) => {
    const { id } = request.params as { id: string };
    return paymentService.simulate(id);
  });

  app.post('/:id/approve', async (request) => {
    const { id } = request.params as { id: string };
    return paymentService.approve(id);
  });

  app.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    await paymentService.cancel(id);
    return reply.status(200).send({ message: 'Payment cancelled' });
  });

  app.post('/batch', async (request) => {
    const body = batchPaymentSchema.parse(request.body);
    return paymentService.createBatch({
      userId: request.user.id,
      walletId: body.walletId,
      network: body.network,
      payments: body.payments,
    });
  });
}
