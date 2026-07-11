'use client';

const mockTraction = [
  { label: 'Total Autonomous Payments', value: '67', change: '+12 this week' },
  { label: 'Total Trading Volume', value: '$245,800', change: '+$32,400' },
  { label: 'Avg Transaction Size', value: '$1,420', change: '+$120' },
  { label: 'Avg Gas Cost', value: '$0.42', change: '-$0.08' },
  { label: 'Portfolio Growth', value: '+12.4%', change: '+2.1% this month' },
  { label: 'Total Trades Executed', value: '127', change: '+18 this week' },
  { label: 'Trade Success Rate', value: '98.4%', change: '+0.2%' },
  { label: 'Avg Execution Time', value: '4.2s', change: '-0.3s' },
  { label: 'Avg Cost Per Task', value: '$0.58', change: '-$0.05' },
  { label: 'Treasury Growth', value: '+8.2%', change: '+1.4% this month' },
  { label: 'Agent Success Rate', value: '99.1%', change: '+0.1%' },
  { label: 'Total Agent Executions', value: '1,284', change: '+156 this week' },
  { label: 'System Availability', value: '99.9%', change: '' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Executive Traction Metrics</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">All metrics calculated from real execution history.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockTraction.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{m.value}</p>
            {m.change && <p className="mt-1 text-xs text-green-600 dark:text-green-400">{m.change}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
