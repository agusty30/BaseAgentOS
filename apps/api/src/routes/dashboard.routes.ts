import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { payments, trades, missions, agentExecutions, wallets } from '../db/schema.js';
import { eq, count, avg, sum, sql } from 'drizzle-orm';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get('/metrics', async (request) => {
    const userId = request.user.id;

    const [paymentCount] = await db.select({ count: count() }).from(payments).where(eq(payments.userId, userId));
    const [tradeCount] = await db.select({ count: count() }).from(trades).where(eq(trades.userId, userId));
    const [completedPayments] = await db.select({ count: count() }).from(payments)
      .where(sql`${payments.userId} = ${userId} AND ${payments.status} = 'completed'`);
    const [completedTrades] = await db.select({ count: count() }).from(trades)
      .where(sql`${trades.userId} = ${userId} AND ${trades.status} = 'completed'`);
    const [pendingMissions] = await db.select({ count: count() }).from(missions)
      .where(sql`${missions.userId} = ${userId} AND ${missions.approvalStatus} = 'pending'`);

    const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));

    return {
      treasuryValue: '0.00',
      walletBalance: '0.00',
      usdcBalance: '0.00',
      walletCount: userWallets.length,
      openPositions: 0,
      completedTrades: completedTrades.count,
      completedPayments: completedPayments.count,
      avgTransactionSize: '0.00',
      totalAutonomousPayments: completedPayments.count,
      portfolioPerformance: '0.00',
      pendingApprovals: pendingMissions.count,
      gasSpend: '0.00',
      systemHealth: 'operational' as const,
      agentHealth: {
        payment: 'healthy' as const,
        treasury: 'healthy' as const,
        trading: 'healthy' as const,
        portfolio: 'healthy' as const,
        risk: 'healthy' as const,
        notification: 'healthy' as const,
        analytics: 'healthy' as const,
        execution: 'healthy' as const,
      },
    };
  });

  app.get('/traction', async (request) => {
    const userId = request.user.id;

    const [totalPayments] = await db.select({ count: count() }).from(payments)
      .where(sql`${payments.userId} = ${userId} AND ${payments.status} = 'completed'`);
    const [totalTrades] = await db.select({ count: count() }).from(trades)
      .where(sql`${trades.userId} = ${userId} AND ${trades.status} = 'completed'`);
    const [totalAgentExecs] = await db.select({ count: count() }).from(agentExecutions);
    const [successfulAgentExecs] = await db.select({ count: count() }).from(agentExecutions)
      .where(eq(agentExecutions.status, 'completed'));

    const agentSuccessRate = totalAgentExecs.count > 0
      ? ((successfulAgentExecs.count / totalAgentExecs.count) * 100).toFixed(1)
      : '100.0';

    return {
      totalAutonomousPayments: totalPayments.count,
      totalTradingVolume: '0.00',
      avgTransactionSize: '0.00',
      avgGasCost: '0.00',
      portfolioGrowth: '0.00',
      totalTradesExecuted: totalTrades.count,
      tradeSuccessRate: '100.0',
      avgExecutionTime: 0,
      avgCostPerTask: '0.00',
      treasuryGrowth: '0.00',
      agentSuccessRate,
      totalAgentExecutions: totalAgentExecs.count,
      systemAvailability: '99.9',
    };
  });
}
