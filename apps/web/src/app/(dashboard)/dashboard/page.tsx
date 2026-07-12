'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { accessToken, user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    loadData();
  }, [accessToken]);

  async function loadData() {
    try {
      const data = await api.getDashboardMetrics();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          System Operational
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Treasury Value" value={metrics?.treasuryBalance || '$0.00'} />
        <MetricCard label="Wallets" value={String(metrics?.totalWallets || 0)} />
        <MetricCard label="Active Strategies" value={String(metrics?.activeStrategies || 0)} />
        <MetricCard label="Total Trades" value={String(metrics?.totalTrades || 0)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/wallets" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
              <span className="text-2xl">👛</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Create Wallet</span>
            </a>
            <a href="/payments" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
              <span className="text-2xl">💸</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Payment</span>
            </a>
            <a href="/trading" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Trade</span>
            </a>
            <a href="/strategies" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
              <span className="text-2xl">📈</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Strategy</span>
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Getting Started</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">1</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">Create or import a wallet</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">2</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">Configure an AI provider in Settings</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">3</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">Set up your first trading strategy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
