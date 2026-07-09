import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  numeric,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ──────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'operator', 'viewer']);

export const walletTypeEnum = pgEnum('wallet_type', ['eoa', 'walletconnect', 'coinbase', 'mpc']);

export const paymentTypeEnum = pgEnum('payment_type', [
  'one-time',
  'scheduled',
  'recurring',
  'conditional',
  'batch',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'approved',
  'simulated',
  'executing',
  'completed',
  'failed',
  'cancelled',
]);

export const tradeStatusEnum = pgEnum('trade_status', [
  'pending',
  'quoting',
  'simulated',
  'approved',
  'executing',
  'completed',
  'failed',
  'cancelled',
]);

export const tradeSideEnum = pgEnum('trade_side', ['buy', 'sell']);

export const strategyTypeEnum = pgEnum('strategy_type', [
  'dca',
  'recurring-buy',
  'recurring-sell',
  'rebalance',
  'profit-target',
  'stop-loss',
]);

export const strategyStatusEnum = pgEnum('strategy_status', [
  'draft',
  'active',
  'paused',
  'completed',
  'failed',
]);

export const missionStatusEnum = pgEnum('mission_status', [
  'planning',
  'queued',
  'running',
  'waiting_confirmation',
  'simulation',
  'executing',
  'completed',
  'failed',
  'retrying',
  'cancelled',
]);

export const missionStepStatusEnum = pgEnum('mission_step_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);

export const agentTypeEnum = pgEnum('agent_type', [
  'payment',
  'treasury',
  'trading',
  'portfolio',
  'risk',
  'notification',
  'analytics',
  'execution',
]);

export const agentExecutionStatusEnum = pgEnum('agent_execution_status', [
  'running',
  'completed',
  'failed',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'not_required',
  'pending',
  'approved',
  'rejected',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'success',
  'warning',
  'error',
]);

// ─── Tables ─────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('viewer').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
  ],
);

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    type: walletTypeEnum('type').notNull(),
    encryptedPrivateKey: text('encrypted_private_key'),
    isDefault: boolean('is_default').default(false).notNull(),
    isTreasury: boolean('is_treasury').default(false).notNull(),
    isAgent: boolean('is_agent').default(false).notNull(),
    network: text('network').default('base-sepolia').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('wallets_user_id_idx').on(table.userId),
    index('wallets_address_idx').on(table.address),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    txHash: varchar('tx_hash', { length: 66 }),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    network: text('network').notNull(),
    from: varchar('from_address', { length: 42 }).notNull(),
    to: varchar('to_address', { length: 42 }).notNull(),
    value: numeric('value', { precision: 78, scale: 18 }).notNull(),
    gasUsed: numeric('gas_used', { precision: 78, scale: 0 }),
    gasCost: numeric('gas_cost', { precision: 78, scale: 18 }),
    blockNumber: integer('block_number'),
    data: jsonb('data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_wallet_id_idx').on(table.walletId),
    index('transactions_tx_hash_idx').on(table.txHash),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    type: paymentTypeEnum('type').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    recipient: varchar('recipient', { length: 42 }).notNull(),
    amount: numeric('amount', { precision: 78, scale: 18 }).notNull(),
    token: varchar('token', { length: 42 }).notNull(),
    network: text('network').notNull(),
    txHash: varchar('tx_hash', { length: 66 }),
    gasUsed: numeric('gas_used', { precision: 78, scale: 0 }),
    gasCost: numeric('gas_cost', { precision: 78, scale: 18 }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    error: text('error'),
    correlationId: uuid('correlation_id').defaultRandom().notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_user_id_idx').on(table.userId),
    index('payments_wallet_id_idx').on(table.walletId),
    index('payments_status_idx').on(table.status),
    index('payments_correlation_id_idx').on(table.correlationId),
  ],
);

export const paymentSchedules = pgTable(
  'payment_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payment_schedules_payment_id_idx').on(table.paymentId),
    index('payment_schedules_next_run_at_idx').on(table.nextRunAt),
  ],
);

export const trades = pgTable(
  'trades',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    dexProvider: varchar('dex_provider', { length: 50 }).notNull(),
    status: tradeStatusEnum('status').default('pending').notNull(),
    side: tradeSideEnum('side').notNull(),
    tokenIn: varchar('token_in', { length: 42 }).notNull(),
    tokenOut: varchar('token_out', { length: 42 }).notNull(),
    amountIn: numeric('amount_in', { precision: 78, scale: 18 }).notNull(),
    amountOut: numeric('amount_out', { precision: 78, scale: 18 }),
    priceImpact: numeric('price_impact', { precision: 10, scale: 6 }),
    slippage: numeric('slippage', { precision: 10, scale: 6 }),
    route: text('route'),
    txHash: varchar('tx_hash', { length: 66 }),
    gasUsed: numeric('gas_used', { precision: 78, scale: 0 }),
    gasCost: numeric('gas_cost', { precision: 78, scale: 18 }),
    network: text('network').notNull(),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    error: text('error'),
    correlationId: uuid('correlation_id').defaultRandom().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('trades_user_id_idx').on(table.userId),
    index('trades_wallet_id_idx').on(table.walletId),
    index('trades_status_idx').on(table.status),
    index('trades_correlation_id_idx').on(table.correlationId),
  ],
);

export const strategies = pgTable(
  'strategies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: strategyTypeEnum('type').notNull(),
    status: strategyStatusEnum('status').default('draft').notNull(),
    config: jsonb('config').notNull().default({}),
    autonomousExecution: boolean('autonomous_execution').default(false).notNull(),
    maxDailySpend: numeric('max_daily_spend', { precision: 78, scale: 18 }),
    maxPositionSize: numeric('max_position_size', { precision: 78, scale: 18 }),
    network: text('network').default('base-sepolia').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('strategies_user_id_idx').on(table.userId),
    index('strategies_status_idx').on(table.status),
  ],
);

export const strategyExecutions = pgTable(
  'strategy_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    strategyId: uuid('strategy_id')
      .notNull()
      .references(() => strategies.id, { onDelete: 'cascade' }),
    tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull(),
    result: jsonb('result'),
    error: text('error'),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('strategy_executions_strategy_id_idx').on(table.strategyId),
  ],
);

export const portfolioSnapshots = pgTable(
  'portfolio_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalValueUsd: numeric('total_value_usd', { precision: 78, scale: 18 }).notNull(),
    usdcBalance: numeric('usdc_balance', { precision: 78, scale: 18 }).notNull(),
    ethBalance: numeric('eth_balance', { precision: 78, scale: 18 }).notNull(),
    tokenHoldings: jsonb('token_holdings').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('portfolio_snapshots_user_id_idx').on(table.userId),
    index('portfolio_snapshots_created_at_idx').on(table.createdAt),
  ],
);

export const missions = pgTable(
  'missions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentType: agentTypeEnum('agent_type').notNull(),
    status: missionStatusEnum('status').default('planning').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    walletId: uuid('wallet_id').references(() => wallets.id, { onDelete: 'set null' }),
    network: text('network').default('base-sepolia').notNull(),
    txHash: varchar('tx_hash', { length: 66 }),
    gasUsed: numeric('gas_used', { precision: 78, scale: 0 }),
    gasCost: numeric('gas_cost', { precision: 78, scale: 18 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    duration: integer('duration'),
    correlationId: uuid('correlation_id').defaultRandom().notNull(),
    approvalStatus: approvalStatusEnum('approval_status').default('not_required').notNull(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('missions_user_id_idx').on(table.userId),
    index('missions_status_idx').on(table.status),
    index('missions_correlation_id_idx').on(table.correlationId),
  ],
);

export const missionSteps = pgTable(
  'mission_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    missionId: uuid('mission_id')
      .notNull()
      .references(() => missions.id, { onDelete: 'cascade' }),
    step: integer('step').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    status: missionStepStatusEnum('status').default('pending').notNull(),
    input: jsonb('input'),
    output: jsonb('output'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    duration: integer('duration'),
  },
  (table) => [
    index('mission_steps_mission_id_idx').on(table.missionId),
  ],
);

export const agentExecutions = pgTable(
  'agent_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type').notNull(),
    missionId: uuid('mission_id')
      .notNull()
      .references(() => missions.id, { onDelete: 'cascade' }),
    status: agentExecutionStatusEnum('status').default('running').notNull(),
    input: jsonb('input').notNull().default({}),
    output: jsonb('output'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    duration: integer('duration'),
    retryCount: integer('retry_count').default(0).notNull(),
  },
  (table) => [
    index('agent_executions_mission_id_idx').on(table.missionId),
    index('agent_executions_agent_type_idx').on(table.agentType),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }),
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    correlationId: uuid('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_resource_idx').on(table.resource),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').default('info').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    message: text('message').notNull(),
    read: boolean('read').default(false).notNull(),
    actionUrl: text('action_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_read_idx').on(table.read),
  ],
);

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 255 }).notNull(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('settings_user_id_key_idx').on(table.userId, table.key),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  transactions: many(transactions),
  payments: many(payments),
  trades: many(trades),
  strategies: many(strategies),
  missions: many(missions),
  portfolioSnapshots: many(portfolioSnapshots),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  settings: many(settings),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(transactions),
  payments: many(payments),
  trades: many(trades),
  strategies: many(strategies),
  missions: many(missions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [payments.walletId], references: [wallets.id] }),
  schedules: many(paymentSchedules),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ one }) => ({
  payment: one(payments, { fields: [paymentSchedules.paymentId], references: [payments.id] }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [trades.walletId], references: [wallets.id] }),
}));

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
  user: one(users, { fields: [strategies.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [strategies.walletId], references: [wallets.id] }),
  executions: many(strategyExecutions),
}));

export const strategyExecutionsRelations = relations(strategyExecutions, ({ one }) => ({
  strategy: one(strategies, { fields: [strategyExecutions.strategyId], references: [strategies.id] }),
  trade: one(trades, { fields: [strategyExecutions.tradeId], references: [trades.id] }),
}));

export const portfolioSnapshotsRelations = relations(portfolioSnapshots, ({ one }) => ({
  user: one(users, { fields: [portfolioSnapshots.userId], references: [users.id] }),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  user: one(users, { fields: [missions.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [missions.walletId], references: [wallets.id] }),
  steps: many(missionSteps),
  agentExecutions: many(agentExecutions),
}));

export const missionStepsRelations = relations(missionSteps, ({ one }) => ({
  mission: one(missions, { fields: [missionSteps.missionId], references: [missions.id] }),
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ one }) => ({
  mission: one(missions, { fields: [agentExecutions.missionId], references: [missions.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));
