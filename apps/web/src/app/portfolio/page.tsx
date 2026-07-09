'use client';

const mockPortfolio = {
  totalValue: '$127,650.00',
  usdcBalance: '$98,200.00',
  ethBalance: '2.4512 ETH ($8,450.00)',
  dailyChange: '+2.4%',
  weeklyChange: '+5.1%',
  monthlyChange: '+12.4%',
  realizedPl: '+$3,200.00',
  unrealizedPl: '+$1,450.00',
};

const holdings = [
  { token: 'USDC', amount: '98,200.00', value: '$98,200.00', allocation: '76.9%', change: '0%' },
  { token: 'ETH', amount: '2.4512', value: '$8,450.00', allocation: '6.6%', change: '+3.2%' },
  { token: 'AERO', amount: '1,500.00', value: '$4,500.00', allocation: '3.5%', change: '-1.8%' },
  { token: 'cbBTC', amount: '0.15', value: '$16,500.00', allocation: '12.9%', change: '+1.5%' },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{mockPortfolio.totalValue}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Daily Change</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{mockPortfolio.dailyChange}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Realized P/L</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{mockPortfolio.realizedPl}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Unrealized P/L</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{mockPortfolio.unrealizedPl}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Holdings</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Token</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Allocation</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">24h</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.token} className="border-b border-slate-100 last:border-0 dark:border-slate-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{h.token}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">{h.amount}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{h.value}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{h.allocation}</td>
                  <td className={`px-4 py-3 text-sm ${h.change.startsWith('+') ? 'text-green-600' : h.change.startsWith('-') ? 'text-red-600' : 'text-slate-500'}`}>{h.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Allocation</h2>
          <div className="space-y-3">
            {holdings.map((h) => (
              <div key={h.token}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{h.token}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{h.allocation}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-2 rounded-full bg-brand" style={{ width: h.allocation }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Weekly</span><span className="text-green-600">{mockPortfolio.weeklyChange}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly</span><span className="text-green-600">{mockPortfolio.monthlyChange}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
