'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const TOKENS: Record<string, { symbol: string; name: string; addresses: Record<string, string>; decimals: number }> = {
  USDC: { symbol: 'USDC', name: 'USD Coin', addresses: { 'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e' }, decimals: 6 },
  WETH: { symbol: 'WETH', name: 'Wrapped Ether', addresses: { 'base-mainnet': '0x4200000000000000000000000000000000000006', 'base-sepolia': '0x4200000000000000000000000000000000000006' }, decimals: 18 },
  AERO: { symbol: 'AERO', name: 'Aerodrome', addresses: { 'base-mainnet': '0x940181a94A35A4569E4529A3CDfB74e38FD98631', 'base-sepolia': '0x940181a94A35A4569E4529A3CDfB74e38FD98631' }, decimals: 18 },
  cbBTC: { symbol: 'cbBTC', name: 'Coinbase BTC', addresses: { 'base-mainnet': '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 'base-sepolia': '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' }, decimals: 8 },
};

const PROVIDERS = [
  { value: 'best', label: 'Best Price', desc: 'Compare Uniswap & Aerodrome' },
  { value: 'uniswap', label: 'Uniswap V3', desc: 'Concentrated liquidity AMM' },
  { value: 'aerodrome', label: 'Aerodrome', desc: 'Base native DEX' },
];

export default function TradingPage() {
  const { accessToken } = useAuthStore();
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('WETH');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('50');
  const [network, setNetwork] = useState('base-sepolia');
  const [provider, setProvider] = useState('best');
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

  function getTokenAddress(symbol: string): string {
    return TOKENS[symbol]?.addresses[network] || '';
  }

  async function handleGetQuote() {
    if (!amount) return;
    setQuoting(true);
    setError('');
    setQuote(null);
    try {
      const data = await api.getQuote({
        tokenIn: getTokenAddress(tokenIn),
        tokenOut: getTokenAddress(tokenOut),
        amountIn: amount,
        slippageBps: parseInt(slippage),
        network,
        provider,
      });
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
      await api.executeSwap({
        tokenIn: getTokenAddress(tokenIn),
        tokenOut: getTokenAddress(tokenOut),
        amountIn: amount,
        slippageBps: parseInt(slippage),
        network,
        provider,
      });
      setQuote(null);
      setAmount('');
      loadTrades();
    } catch (err: any) {
      setError(err.message || 'Swap failed');
    } finally {
      setExecuting(false);
    }
  }

  const tokenKeys = Object.keys(TOKENS);
  const slippageOptions = [
    { value: '10', label: '0.1%' },
    { value: '50', label: '0.5%' },
    { value: '100', label: '1.0%' },
  ];

  const bestQuote = quote?.bestProvider || quote?.quotes?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trading</h1>
        <div className="flex items-center gap-2">
          <select
            value={network}
            onChange={(e) => { setNetwork(e.target.value); setQuote(null); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="base-sepolia">Base Sepolia</option>
            <option value="base-mainnet">Base Mainnet</option>
          </select>
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs dark:bg-slate-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-slate-600 dark:text-slate-300">Connected</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          {/* DEX Provider Selection */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">DEX Provider</h3>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setProvider(p.value); setQuote(null); }}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    provider === p.value
                      ? 'border-brand bg-brand/5 dark:bg-brand/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-medium ${provider === p.value ? 'text-brand' : 'text-slate-900 dark:text-white'}`}>{p.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                  {provider === p.value && (
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Swap</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Pay</label>
                <div className="flex gap-2">
                  <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null); }} placeholder="0.00" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <select value={tokenIn} onChange={(e) => { setTokenIn(e.target.value); setQuote(null); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {tokenKeys.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-mono truncate">{getTokenAddress(tokenIn)}</p>
              </div>

              <div className="flex justify-center">
                <button onClick={() => { const tmp = tokenIn; setTokenIn(tokenOut); setTokenOut(tmp); setQuote(null); }} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M8 14l-3-3M8 14l3-3M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Receive</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={bestQuote?.amountOut || '—'} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
                  <select value={tokenOut} onChange={(e) => { setTokenOut(e.target.value); setQuote(null); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {tokenKeys.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-mono truncate">{getTokenAddress(tokenOut)}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Slippage Tolerance</span>
                <div className="flex gap-1">
                  {slippageOptions.map((s) => (
                    <button key={s.value} onClick={() => setSlippage(s.value)} className={`rounded px-2 py-1 text-xs ${slippage === s.value ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{s.label}</button>
                  ))}
                </div>
              </div>

              {bestQuote && (
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Provider</span><span className="text-slate-900 dark:text-white font-medium">{bestQuote.provider || provider}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Price Impact</span><span className="text-slate-900 dark:text-white">{bestQuote.priceImpact || '< 0.01'}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Route</span><span className="text-slate-900 dark:text-white">{bestQuote.route || `${tokenIn} → ${tokenOut}`}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Est. Gas</span><span className="text-slate-900 dark:text-white">{bestQuote.gasEstimate || '~0.001'} ETH</span></div>
                  {quote?.quotes?.length > 1 && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-500 mb-1">All quotes:</p>
                      {quote.quotes.map((q: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-500">{q.provider}</span>
                          <span className="text-slate-900 dark:text-white">{q.amountOut} {tokenOut}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!quote ? (
                <button onClick={handleGetQuote} disabled={!amount || quoting || tokenIn === tokenOut} className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                  {quoting ? 'Getting Quote...' : 'Get Quote'}
                </button>
              ) : (
                <button onClick={handleSwap} disabled={executing} className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {executing ? 'Executing Swap...' : `Swap ${amount} ${tokenIn} → ${tokenOut}`}
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Provider</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount In</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount Out</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t: any) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/50">
                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white font-mono text-xs">
                          {t.tokenIn?.slice(0, 6)}.../{t.tokenOut?.slice(0, 6)}...
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{t.dexProvider}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">{t.amountIn}</td>
                        <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">{t.amountOut || '—'}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : t.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{t.status}</span></td>
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
