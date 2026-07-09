import { db } from '../db/index.js';
import { portfolioSnapshots } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { walletService } from './wallet.service.js';
import type { TokenBalance } from '@baseagent/shared';

export class PortfolioService {
  async getLatestSnapshot(userId: string) {
    const [snapshot] = await db.select().from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.userId, userId))
      .orderBy(desc(portfolioSnapshots.createdAt))
      .limit(1);
    return snapshot || null;
  }

  async getHistory(userId: string, limit = 30) {
    return db.select().from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.userId, userId))
      .orderBy(desc(portfolioSnapshots.createdAt))
      .limit(limit);
  }

  async createSnapshot(userId: string, network: string) {
    const wallets = await walletService.listByUser(userId);
    let totalValueUsd = 0;
    let totalUsdc = 0;
    let totalEth = 0;
    const allTokens: TokenBalance[] = [];

    for (const wallet of wallets) {
      try {
        const balance = await walletService.getBalance(wallet.id, network as 'base-mainnet' | 'base-sepolia');
        const ethVal = parseFloat(balance.eth);
        const usdcVal = parseFloat(balance.usdc);
        totalEth += ethVal;
        totalUsdc += usdcVal;
        totalValueUsd += usdcVal;
        allTokens.push(...balance.tokens);
      } catch {
        continue;
      }
    }

    const [snapshot] = await db.insert(portfolioSnapshots).values({
      id: uuidv4(),
      userId,
      totalValueUsd: totalValueUsd.toString(),
      usdcBalance: totalUsdc.toString(),
      ethBalance: totalEth.toString(),
      tokenHoldings: allTokens,
    }).returning();

    return snapshot;
  }

  async getPerformance(userId: string) {
    const snapshots = await this.getHistory(userId, 30);
    if (snapshots.length < 2) {
      return { dailyChange: '0', weeklyChange: '0', monthlyChange: '0', realizedPl: '0', unrealizedPl: '0' };
    }

    const current = parseFloat(snapshots[0].totalValueUsd);
    const dayAgo = snapshots.length > 1 ? parseFloat(snapshots[1].totalValueUsd) : current;
    const weekAgo = snapshots.length > 7 ? parseFloat(snapshots[7].totalValueUsd) : dayAgo;
    const monthAgo = snapshots.length > 30 ? parseFloat(snapshots[29].totalValueUsd) : weekAgo;

    return {
      dailyChange: dayAgo > 0 ? (((current - dayAgo) / dayAgo) * 100).toFixed(2) : '0',
      weeklyChange: weekAgo > 0 ? (((current - weekAgo) / weekAgo) * 100).toFixed(2) : '0',
      monthlyChange: monthAgo > 0 ? (((current - monthAgo) / monthAgo) * 100).toFixed(2) : '0',
      realizedPl: '0',
      unrealizedPl: (current - dayAgo).toFixed(2),
    };
  }
}

export const portfolioService = new PortfolioService();
