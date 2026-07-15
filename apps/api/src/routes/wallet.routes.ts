import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import * as walletService from '../services/wallet.service.js';
import { NETWORKS, type NetworkId } from '@baseagent/shared';

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
    let wallet = await walletService.createEOAWallet(
      request.user.id,
      body.name,
      body.network,
    );
    if (body.isAgent) {
      wallet = await walletService.setAgentWallet(wallet.id, request.user.id);
    }
    if (body.isTreasury) {
      wallet = await walletService.setTreasuryWallet(wallet.id, request.user.id);
    }
    // Auto-set as default if it's the user's first wallet
    const allWallets = await walletService.getUserWallets(request.user.id);
    const hasDefault = allWallets.some(w => w.isDefault);
    if (!hasDefault) {
      wallet = await walletService.setDefaultWallet(wallet.id, request.user.id);
    }
    return wallet;
  });

  app.post('/import', async (request) => {
    const body = importWalletSchema.parse(request.body);
    return walletService.importWallet(
      request.user.id,
      body.name,
      body.privateKey,
      body.network,
    );
  });

  app.get('/', async (request) => {
    return walletService.getUserWallets(request.user.id);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.getWalletById(id, request.user.id);
  });

  app.get('/:id/balance', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.getWalletBalance(id, request.user.id);
  });

  app.get('/:id/transactions', async (request) => {
    const { id } = request.params as { id: string };
    const wallet = await walletService.getWalletById(id, request.user.id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const network = (wallet.network || 'base-sepolia') as NetworkId;
    const config = NETWORKS[network];
    const explorerApi = network === 'base-mainnet'
      ? 'https://api.basescan.org/api'
      : 'https://api-sepolia.basescan.org/api';

    try {
      const res = await fetch(
        `${explorerApi}?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc`
      );
      const data = await res.json();
      const txs = (data.result || []).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        timeStamp: tx.timeStamp,
        isError: tx.isError === '1',
        functionName: tx.functionName || '',
        explorerUrl: `${config.explorerUrl}/tx/${tx.hash}`,
      }));
      return { transactions: txs, network, explorerUrl: config.explorerUrl };
    } catch {
      return { transactions: [], network, explorerUrl: config.explorerUrl };
    }
  });

  app.post('/:id/transfer', async (request) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      toAddress: z.string().min(42).max(42),
      amount: z.string().min(1),
      token: z.enum(['ETH', 'USDC']),
    }).parse(request.body);

    if (body.token === 'ETH') {
      return walletService.transferETH(id, request.user.id, body.toAddress, body.amount);
    }
    return walletService.transferUSDC(id, request.user.id, body.toAddress, body.amount);
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = z.object({ name: z.string().min(1).max(100) }).parse(request.body);
    return walletService.updateWallet(id, request.user.id, { name: body.name });
  });

  app.post('/:id/set-default', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.setDefaultWallet(id, request.user.id);
  });

  app.post('/:id/set-treasury', async (request) => {
    const { id } = request.params as { id: string };
    return walletService.setTreasuryWallet(id, request.user.id);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await walletService.deleteWallet(id, request.user.id);
    return reply.status(204).send();
  });
}
