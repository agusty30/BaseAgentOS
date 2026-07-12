'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function AnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    loadMetrics();
  }, [accessToken]);

  async function loadMetrics() {
    try {
      const data = await api.getTractionMetrics();
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No analytics data yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Analytics are computed from your execution history. Start trading and running strategies to see metrics.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Payments', value: String(metrics.totalPayments || 0) },
    { label: 'Total Trades', value: String(metrics.totalTrades || 0) },
    { label: 'Active Strategies', value: String(metrics.activeStrategies || 0) },
    { label: 'Total Missions', value: String(metrics.totalMissions || 0) },
    { label: 'Completed Missions', value: String(metrics.completedMissions || 0) },
    { label: 'Failed Missions', value: String(metrics.failedMissions || 0) },
    { label: 'Total Wallets', value: String(metrics.totalWallets || 0) },
    { label: 'Agent Executions', value: String(metrics.agentExecutions || 0) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Metrics computed from your execution history.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
