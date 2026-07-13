import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { paymentService } from '../services/payment.service.js';
import { riskService } from '../services/risk.service.js';
import * as walletService from '../services/wallet.service.js';

const createPaymentSchema = z.object({
  walletId: z.string().uuid().optional(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  token: z.string().default('USDC'),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
  type: z.enum(['one-time', 'scheduled', 'recurring', 'conditional', 'batch']).default('one-time'),
  scheduledAt: z.string().datetime().optional(),
  cronExpression: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
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

    let walletId = body.walletId;
    if (!walletId) {
      const userWallets = await walletService.getUserWallets(request.user.id);
      const defaultWallet = userWallets.find(w => w.isDefault) || userWallets.find(w => w.isTreasury) || userWallets[0];
      if (!defaultWallet) {
        throw new Error('No wallet available. Create a wallet first.');
      }
      walletId = defaultWallet.id;
    }

    const risk = await riskService.assess({
      userId: request.user.id,
      type: 'payment',
      amountUsd: parseFloat(body.amount),
      network: body.network,
    });
    if (!risk.approved) {
      return { error: 'Risk check failed', risk };
    }

    const metadata = {
      ...(body.metadata || {}),
      ...(body.name ? { name: body.name } : {}),
      ...(body.category ? { category: body.category } : {}),
    };

    return paymentService.create({
      walletId,
      recipient: body.recipient,
      amount: body.amount,
      token: body.token,
      network: body.network,
      type: body.type,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      userId: request.user.id,
    });
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
