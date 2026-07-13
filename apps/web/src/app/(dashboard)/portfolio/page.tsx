'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

function fmt(value: string | number | undefined, decimals = 2): string {
  const num = parseFloat(String(value || '0'));
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}

export default function PortfolioPage() {
  const { accessToken } = useAuthStore();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [walletBalances, setWalletBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    loadPortfolio();
  }, [accessToken]);

  async function loadPortfolio() {
    try {
      const [portfolioData, historyData, walletsData] = await Promise.all([
        api.getPortfolio().catch(() => null),
        api.getPortfolioHistory().catch(() => []),
        api.getWallets().catch(() => []),
      ]);
      setPortfolio(portfolioData);
      setHistory(historyData || []);

      // Fetch balances for each wallet
      if (walletsData && walletsData.length > 0) {
        const balances = await Promise.allSettled(
          walletsData.map(async (w: any) => {
            const bal = await api.getWalletBalance(w.id, w.network || 'base-sepolia');
            return { ...w, balance: bal };
          })
        );
        const resolved = balances
          .filter((b): b is PromiseFulfilledResult<any> => b.status === 'fulfilled')
          .map(b => b.value);
        setWalletBalances(resolved);
      }
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

  // Calculate totals from wallet balances
  const totalEth = walletBalances.reduce((sum, w) => sum + parseFloat(w.balance?.eth || '0'), 0);
  const totalUsdc = walletBalances.reduce((sum, w) => sum + parseFloat(w.balance?.usdc || '0'), 0);
  const hasData = walletBalances.length > 0 || (portfolio && parseFloat(portfolio.totalValueUsd || '0') > 0);

  if (!hasData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No portfolio data yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create a wallet and fund it to see your portfolio analytics here.
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Value (USDC)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">${fmt(totalUsdc)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">USDC Balance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">${fmt(totalUsdc)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">ETH Balance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{fmt(totalEth, 6)} ETH</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Wallets</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{walletBalances.length}</p>
        </div>
      </div>

      {/* Per-wallet breakdown */}
      {walletBalances.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Wallet Breakdown</h2>
          <div className="space-y-3">
            {walletBalances.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{w.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{w.address?.slice(0, 6)}...{w.address?.slice(-4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{fmt(w.balance?.eth, 6)} ETH</p>
                  <p className="text-xs text-slate-500">${fmt(w.balance?.usdc)} USDC</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">${fmt(h.totalValueUsd)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${fmt(h.usdcBalance)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{fmt(h.ethBalance, 6)} ETH</td>
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
