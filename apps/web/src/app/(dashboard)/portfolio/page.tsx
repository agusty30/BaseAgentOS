'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function PortfolioPage() {
  const { accessToken } = useAuthStore();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    loadPortfolio();
  }, [accessToken]);

  async function loadPortfolio() {
    try {
      const [portfolioData, historyData] = await Promise.all([
        api.getPortfolio(),
        api.getPortfolioHistory(),
      ]);
      setPortfolio(portfolioData);
      setHistory(historyData || []);
    } catch {
      setPortfolio(null);
      setHistory([]);
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

  if (!portfolio || (!portfolio.totalValueUsd && history.length === 0)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No portfolio data yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create a wallet and make some trades to see your portfolio analytics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">${portfolio?.totalValueUsd || '0.00'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">USDC Balance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">${portfolio?.usdcBalance || '0.00'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">ETH Balance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{portfolio?.ethBalance || '0.00'} ETH</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Tokens</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{portfolio?.tokenHoldings?.length || 0}</p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Portfolio History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Total Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">USDC</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">ETH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h: any) => (
                  <tr key={h.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/50">
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">${h.totalValueUsd}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${h.usdcBalance}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{h.ethBalance} ETH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
