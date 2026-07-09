import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as walletService from '../services/wallet.service.js';

const createWalletSchema = z.object({
  name: z.string().min(1).max(100),
  isTreasury: z.boolean().optional().default(false),
  isAgent: z.boolean().optional().default(false),
  network: z.enum(['base-mainnet', 'base-sepolia']).optional().default('base-sepolia'),
});

const importWalletSchema = z.object({
  name: z.string().min(1).max(100),
  privateKey: z.string().min(64).max(66),
  network: z.enum(['base-mainnet', 'base-sepolia']).optional().default('base-sepolia'),
});

export async function walletRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/', async (request) => {
    const body = createWalletSchema.parse(request.body);
    return walletService.create({
      userId: request.user.id,
      name: body.name,
      isTreasury: body.isTreasury,
      isAgent: body.isAgent,
      network: body.network,
    });
  });

  app.post('/import', async (request) => {
    const body = importWalletSchema.parse(request.body);
    return walletService.importWallet({
      userId: request.user.id,
      name: body.name,
      privateKey: body.privateKey,
      network: body.network,
    });
  });

  app.get('/', async (request) => {
    return walletService.listByUser(request.user.id);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.getById(id);
  });

  app.get('/:id/balance', async (request) => {
    const { id } = request.params as { id: string };
    const { network } = request.query as { network?: string };
    return walletService.getBalance(id, (network || 'base-sepolia') as 'base-mainnet' | 'base-sepolia');
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = z.object({ name: z.string().min(1).max(100) }).parse(request.body);
    return walletService.rename(id, body.name);
  });

  app.post('/:id/set-default', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.setDefault(request.user.id, id);
  });

  app.post('/:id/set-treasury', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.setTreasury(request.user.id, id);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await walletService.delete(id);
    return reply.status(204).send();
  });
}
