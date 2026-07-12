'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function TradingPage() {
  const { accessToken } = useAuthStore();
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadTrades();
  }, [accessToken]);

  async function loadTrades() {
    try {
      const data = await api.getTradeHistory();
      setTrades(data || []);
    } catch {
      setTrades([]);
    }
  }

  async function handleGetQuote() {
    if (!amount) return;
    setQuoting(true);
    setError('');
    setQuote(null);
    try {
      const data = await api.getQuote({ tokenIn, tokenOut, amountIn: amount, slippage });
      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get quote');
    } finally {
      setQuoting(false);
    }
  }

  async function handleSwap() {
    if (!quote) return;
    setExecuting(true);
    setError('');
    try {
      await api.executeSwap({ tokenIn, tokenOut, amountIn: amount, slippage });
      setQuote(null);
      setAmount('');
      loadTrades();
    } catch (err: any) {
      setError(err.message || 'Swap failed');
    } finally {
      setExecuting(false);
    }
  }

  const tokens = ['USDC', 'ETH', 'WETH', 'AERO', 'cbBTC'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trading</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Swap</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Pay</label>
                <div className="flex gap-2">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {tokens.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={() => { setTokenIn(tokenOut); setTokenOut(tokenIn); }} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">↕</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Receive</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={quote?.amountOut || '—'} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
                  <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {tokens.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Slippage</span>
                <div className="flex gap-1">
                  {['0.1', '0.5', '1.0'].map((s) => (
                    <button key={s} onClick={() => setSlippage(s)} className={`rounded px-2 py-1 text-xs ${slippage === s ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{s}%</button>
                  ))}
                </div>
              </div>

              {quote && (
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Price Impact</span><span className="text-slate-900 dark:text-white">{quote.priceImpact || '0.00'}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Route</span><span className="text-slate-900 dark:text-white">{quote.route || 'Direct'}</span></div>
                </div>
              )}

              {!quote ? (
                <button onClick={handleGetQuote} disabled={!amount || quoting} className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                  {quoting ? 'Getting Quote...' : 'Get Quote'}
                </button>
              ) : (
                <button onClick={handleSwap} disabled={executing} className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {executing ? 'Executing...' : 'Execute Swap'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Trade History</h2>
            {trades.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
                No trades yet. Execute your first swap to see history here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pair</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t: any) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/50">
                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">{t.tokenIn}/{t.tokenOut}</td>
                        <td className="px-3 py-2"><span className={`text-xs font-medium ${t.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>{t.side}</span></td>
                        <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">{t.amountIn}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{t.status}</span></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
