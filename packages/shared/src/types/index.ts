export type NetworkId = 'base-mainnet' | 'base-sepolia';

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  usdc: string;
  weth: string;
  uniswapRouter: string;
  aerodromeRouter: string;
  aerodromeSlipstreamRouter: string;
}

export type WalletType = 'eoa' | 'walletconnect' | 'coinbase' | 'mpc';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  address: string;
  type: WalletType;
  isDefault: boolean;
  isTreasury: boolean;
  isAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  eth: string;
  usdc: string;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  valueUsd: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'simulated' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type PaymentType = 'one-time' | 'scheduled' | 'recurring' | 'conditional' | 'batch';

export interface Payment {
  id: string;
  userId: string;
  walletId: string;
  type: PaymentType;
  status: PaymentStatus;
  recipient: string;
  amount: string;
  token: string;
  network: NetworkId;
  txHash?: string;
  gasUsed?: string;
  gasCost?: string;
  scheduledAt?: string;
  executedAt?: string;
  error?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSchedule {
  id: string;
  paymentId: string;
  cronExpression: string;
  nextRunAt: string;
  lastRunAt?: string;
  isActive: boolean;
}

export type TradeStatus = 'pending' | 'quoting' | 'simulated' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type TradeSide = 'buy' | 'sell';

export interface Trade {
  id: string;
  userId: string;
  walletId: string;
  dexProvider: string;
  status: TradeStatus;
  side: TradeSide;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: string;
  slippage: string;
  route: string;
  txHash?: string;
  gasUsed?: string;
  gasCost?: string;
  network: NetworkId;
  executedAt?: string;
  error?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export type StrategyType = 'dca' | 'recurring-buy' | 'recurring-sell' | 'rebalance' | 'profit-target' | 'stop-loss';
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';

export interface Strategy {
  id: string;
  userId: string;
  walletId: string;
  name: string;
  type: StrategyType;
  status: StrategyStatus;
  config: Record<string, unknown>;
  autonomousExecution: boolean;
  maxDailySpend: string;
  maxPositionSize: string;
  network: NetworkId;
  createdAt: string;
  updatedAt: string;
}

export type MissionStatus =
  | 'planning'
  | 'queued'
  | 'running'
  | 'waiting_confirmation'
  | 'simulation'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export interface Mission {
  id: string;
  userId: string;
  agentType: AgentType;
  status: MissionStatus;
  title: string;
  description: string;
  walletId?: string;
  network: NetworkId;
  txHash?: string;
  gasUsed?: string;
  gasCost?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  correlationId: string;
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionStep {
  id: string;
  missionId: string;
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export type AgentType =
  | 'payment'
  | 'treasury'
  | 'trading'
  | 'portfolio'
  | 'risk'
  | 'notification'
  | 'analytics'
  | 'execution';

export interface AgentExecution {
  id: string;
  agentType: AgentType;
  missionId: string;
  status: 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  retryCount: number;
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValueUsd: string;
  usdcBalance: string;
  ethBalance: string;
  tokenHoldings: TokenBalance[];
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  correlationId: string;
  createdAt: string;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
  recipient: string;
}

export interface SwapQuote {
  provider: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: string;
  route: string[];
  gasEstimate: string;
  validUntil: number;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: string;
  gasCost: string;
  blockNumber: number;
  explorerUrl: string;
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  blockers: string[];
  approved: boolean;
}

export interface DashboardMetrics {
  treasuryValue: string;
  walletBalance: string;
  usdcBalance: string;
  openPositions: number;
  completedTrades: number;
  completedPayments: number;
  avgTransactionSize: string;
  totalAutonomousPayments: number;
  portfolioPerformance: string;
  agentHealth: Record<AgentType, 'healthy' | 'degraded' | 'down'>;
  pendingApprovals: number;
  gasSpend: string;
  systemHealth: 'operational' | 'degraded' | 'down';
}

export interface TractionMetrics {
  totalAutonomousPayments: number;
  totalTradingVolume: string;
  avgTransactionSize: string;
  avgGasCost: string;
  portfolioGrowth: string;
  totalTradesExecuted: number;
  tradeSuccessRate: string;
  avgExecutionTime: number;
  avgCostPerTask: string;
  treasuryGrowth: string;
  agentSuccessRate: string;
  totalAgentExecutions: number;
  systemAvailability: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
