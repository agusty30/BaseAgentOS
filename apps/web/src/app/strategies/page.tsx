'use client';

import { useState } from 'react';

const mockStrategies = [
  { id: '1', name: 'Daily ETH DCA', type: 'dca', status: 'active', amount: '$100/day', token: 'ETH', executions: 45, pnl: '+$320.50' },
  { id: '2', name: 'Portfolio Rebalance', type: 'rebalance', status: 'active', amount: '60/30/10', token: 'Mixed', executions: 12, pnl: '+$150.00' },
  { id: '3', name: 'ETH Stop Loss', type: 'stop-loss', status: 'paused', amount: '$2,800', token: 'ETH', executions: 0, pnl: '$0.00' },
];

const typeColors: Record<string, string> = {
  dca: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rebalance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'stop-loss': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'profit-target': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'recurring-buy': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

export default function StrategiesPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strategies</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
          New Strategy
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Strategy</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Strategy Name</label>
              <input type="text" placeholder="e.g., Daily ETH Buy" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="dca">Dollar Cost Averaging</option>
                <option value="recurring-buy">Recurring Buy</option>
                <option value="rebalance">Portfolio Rebalance</option>
                <option value="profit-target">Profit Target</option>
                <option value="stop-loss">Stop Loss</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Daily Spend</label>
              <input type="number" placeholder="1000" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Enable Autonomous Execution</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:text-white">Cancel</button>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Create Strategy</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockStrategies.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[s.type] || 'bg-slate-100'}`}>{s.type}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{s.status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-slate-900 dark:text-white">{s.amount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Executions</span><span className="text-slate-900 dark:text-white">{s.executions}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">P/L</span><span className={s.pnl.startsWith('+') ? 'text-green-600' : 'text-slate-900 dark:text-white'}>{s.pnl}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:text-white">{s.status === 'active' ? 'Pause' : 'Activate'}</button>
              <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-800 dark:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
