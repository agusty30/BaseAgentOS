import { db } from '../db/index.js';
import { strategies, strategyExecutions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { StrategyType, StrategyStatus, NetworkId } from '@baseagent/shared';

interface CreateStrategyParams {
  userId: string;
  walletId: string;
  name: string;
  type: StrategyType;
  config: Record<string, unknown>;
  autonomousExecution: boolean;
  maxDailySpend: string;
  maxPositionSize: string;
  network: NetworkId;
}

export class StrategyService {
  async create(params: CreateStrategyParams) {
    const [strategy] = await db.insert(strategies).values({
      id: uuidv4(),
      ...params,
      status: 'draft',
    }).returning();
    return strategy;
  }

  async getById(id: string) {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || null;
  }

  async listByUser(userId: string) {
    return db.select().from(strategies)
      .where(eq(strategies.userId, userId))
      .orderBy(desc(strategies.createdAt));
  }

  async updateStatus(id: string, status: StrategyStatus) {
    const [updated] = await db.update(strategies)
      .set({ status, updatedAt: new Date() })
      .where(eq(strategies.id, id)).returning();
    return updated;
  }

  async update(id: string, data: Partial<CreateStrategyParams>) {
    const [updated] = await db.update(strategies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(strategies.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    await db.delete(strategies).where(eq(strategies.id, id));
  }

  async logExecution(strategyId: string, tradeId: string | null, status: string, result?: Record<string, unknown>, error?: string) {
    const [execution] = await db.insert(strategyExecutions).values({
      id: uuidv4(),
      strategyId,
      tradeId,
      status,
      result,
      error,
      executedAt: new Date(),
    }).returning();
    return execution;
  }

  async getExecutions(strategyId: string, limit = 50) {
    return db.select().from(strategyExecutions)
      .where(eq(strategyExecutions.strategyId, strategyId))
      .orderBy(desc(strategyExecutions.createdAt))
      .limit(limit);
  }

  evaluateDCA(config: Record<string, unknown>) {
    const amount = parseFloat(config.amountPerBuy as string || '0');
    const token = config.token as string || 'USDC';
    const frequency = config.frequency as string || 'daily';
    return { amount, token, frequency, shouldExecute: amount > 0 };
  }

  evaluateRebalance(config: Record<string, unknown>, currentAllocations: Record<string, number>) {
    const targets = config.targetAllocations as Record<string, number> || {};
    const threshold = parseFloat(config.threshold as string || '5');
    const trades: Array<{ token: string; action: 'buy' | 'sell'; amount: number }> = [];

    for (const [token, target] of Object.entries(targets)) {
      const current = currentAllocations[token] || 0;
      const diff = current - target;
      if (Math.abs(diff) > threshold) {
        trades.push({
          token,
          action: diff > 0 ? 'sell' : 'buy',
          amount: Math.abs(diff),
        });
      }
    }

    return { trades, needsRebalance: trades.length > 0 };
  }
}

export const strategyService = new StrategyService();
