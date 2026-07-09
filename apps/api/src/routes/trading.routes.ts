import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { dexService } from '../services/dex.service.js';
import { riskService } from '../services/risk.service.js';
import { db } from '../db/index.js';
import { trades } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const quoteSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  slippageBps: z.number().int().min(1).max(500).default(50),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
  provider: z.enum(['uniswap', 'aerodrome', 'best']).default('best'),
});

const swapSchema = z.object({
  walletId: z.string().uuid(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  slippageBps: z.number().int().min(1).max(500).default(50),
  network: z.enum(['base-mainnet', 'base-sepolia']).default('base-sepolia'),
  provider: z.enum(['uniswap', 'aerodrome', 'best']).default('best'),
});

export async function tradingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.post('/quote', async (request) => {
    const body = quoteSchema.parse(request.body);
    if (body.provider === 'best') {
      const quotes = await Promise.allSettled([
        dexService.getQuote('uniswap', {
          tokenIn: body.tokenIn, tokenOut: body.tokenOut,
          amountIn: body.amountIn, slippageBps: body.slippageBps,
          recipient: '0x0000000000000000000000000000000000000000',
        }, body.network),
        dexService.getQuote('aerodrome', {
          tokenIn: body.tokenIn, tokenOut: body.tokenOut,
          amountIn: body.amountIn, slippageBps: body.slippageBps,
          recipient: '0x0000000000000000000000000000000000000000',
        }, body.network),
      ]);
      const results = quotes
        .filter((q): q is PromiseFulfilledResult<any> => q.status === 'fulfilled')
        .map(q => q.value);
      return { quotes: results, bestProvider: results.length > 0 ? results.sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut))[0] : null };
    }
    const quote = await dexService.getQuote(body.provider, {
      tokenIn: body.tokenIn, tokenOut: body.tokenOut,
      amountIn: body.amountIn, slippageBps: body.slippageBps,
      recipient: '0x0000000000000000000000000000000000000000',
    }, body.network);
    return { quotes: [quote], bestProvider: quote };
  });

  app.post('/swap', async (request) => {
    const body = swapSchema.parse(request.body);
    const risk = await riskService.assess({
      userId: request.user.id,
      type: 'trade',
      amountUsd: parseFloat(body.amountIn),
      tokenAddress: body.tokenOut,
      slippageBps: body.slippageBps,
      network: body.network,
    });
    if (!risk.approved) {
      return { error: 'Risk check failed', risk };
    }
    const [trade] = await db.insert(trades).values({
      id: uuidv4(),
      userId: request.user.id,
      walletId: body.walletId,
      dexProvider: body.provider,
      status: 'pending',
      side: 'buy',
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      amountOut: '0',
      priceImpact: '0',
      slippage: body.slippageBps.toString(),
      route: '',
      network: body.network,
      correlationId: uuidv4(),
    }).returning();
    return { trade, risk };
  });

  app.get('/history', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    return db.select().from(trades)
      .where(eq(trades.userId, request.user.id))
      .orderBy(desc(trades.createdAt))
      .limit(parseInt(limit || '50'))
      .offset(parseInt(offset || '0'));
  });
}
