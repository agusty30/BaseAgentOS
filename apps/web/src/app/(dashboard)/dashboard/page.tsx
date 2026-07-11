'use client';

const mockMetrics = {
  treasuryValue: '$125,430.00',
  walletBalance: '2.4512 ETH',
  usdcBalance: '$98,200.00',
  openPositions: 4,
  completedTrades: 127,
  completedPayments: 89,
  portfolioPerformance: '+12.4%',
  pendingApprovals: 3,
  gasSpend: '$342.18',
  totalAutonomousPayments: 67,
  avgTransactionSize: '$1,420.00',
};

const agentHealth = [
  { name: 'Payment', status: 'healthy' },
  { name: 'Treasury', status: 'healthy' },
  { name: 'Trading', status: 'healthy' },
  { name: 'Portfolio', status: 'healthy' },
  { name: 'Risk', status: 'healthy' },
  { name: 'Notification', status: 'healthy' },
  { name: 'Analytics', status: 'degraded' },
  { name: 'Execution', status: 'healthy' },
];

const recentTx = [
  { id: '1', type: 'Payment', amount: '$500.00', to: '0xAbC...dEf', status: 'completed', time: '2m ago' },
  { id: '2', type: 'Swap', amount: '0.5 ETH → USDC', to: 'Uniswap', status: 'completed', time: '15m ago' },
  { id: '3', type: 'Payment', amount: '$1,200.00', to: '0x123...456', status: 'pending', time: '1h ago' },
  { id: '4', type: 'DCA Buy', amount: '$100.00', to: 'ETH', status: 'completed', time: '3h ago' },
];

function MetricCard({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          System Operational
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Treasury Value" value={mockMetrics.treasuryValue} change="+5.2%" />
        <MetricCard label="Wallet Balance" value={mockMetrics.walletBalance} />
        <MetricCard label="USDC Balance" value={mockMetrics.usdcBalance} />
        <MetricCard label="Portfolio Performance" value={mockMetrics.portfolioPerformance} change="+12.4%" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Open Positions" value={mockMetrics.openPositions.toString()} />
        <MetricCard label="Completed Trades" value={mockMetrics.completedTrades.toString()} />
        <MetricCard label="Completed Payments" value={mockMetrics.completedPayments.toString()} />
        <MetricCard label="Pending Approvals" value={mockMetrics.pendingApprovals.toString()} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agent Health</h2>
          <div className="grid grid-cols-2 gap-3">
            {agentHealth.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">{agent.name}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${agent.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'healthy' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tx.to}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.amount}</p>
                  <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>{tx.status} · {tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Autonomous Payments" value={mockMetrics.totalAutonomousPayments.toString()} />
        <MetricCard label="Avg Transaction Size" value={mockMetrics.avgTransactionSize} />
        <MetricCard label="Gas Spend" value={mockMetrics.gasSpend} />
      </div>
    </div>
  );
}
