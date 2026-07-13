'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const TOKENS: Record<string, { symbol: string; name: string; addresses: Record<string, string>; decimals: number; coingeckoId: string }> = {
  ETH: { symbol: 'ETH', name: 'Ethereum', addresses: { 'base-mainnet': '0x0000000000000000000000000000000000000000', 'base-sepolia': '0x0000000000000000000000000000000000000000' }, decimals: 18, coingeckoId: 'ethereum' },
  USDC: { symbol: 'USDC', name: 'USD Coin', addresses: { 'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e' }, decimals: 6, coingeckoId: 'usd-coin' },
  WETH: { symbol: 'WETH', name: 'Wrapped Ether', addresses: { 'base-mainnet': '0x4200000000000000000000000000000000000006', 'base-sepolia': '0x4200000000000000000000000000000000000006' }, decimals: 18, coingeckoId: 'ethereum' },
  AERO: { symbol: 'AERO', name: 'Aerodrome', addresses: { 'base-mainnet': '0x940181a94A35A4569E4529A3CDfB74e38FD98631', 'base-sepolia': '0x940181a94A35A4569E4529A3CDfB74e38FD98631' }, decimals: 18, coingeckoId: 'aerodrome-finance' },
  cbBTC: { symbol: 'cbBTC', name: 'Coinbase BTC', addresses: { 'base-mainnet': '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 'base-sepolia': '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' }, decimals: 8, coingeckoId: 'bitcoin' },
};

const PROVIDERS = [
  { value: 'best', label: 'Best Price', desc: 'Compare Uniswap & Aerodrome' },
  { value: 'uniswap', label: 'Uniswap V3', desc: 'Concentrated liquidity AMM' },
  { value: 'aerodrome', label: 'Aerodrome', desc: 'Base native DEX' },
];

type MarketData = Record<string, { usd: number; usd_24h_change: number }>;

export default function TradingPage() {
  const { accessToken } = useAuthStore();
  const [mode, setMode] = useState<'manual' | 'agent'>('manual');
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
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [error, setError] = useState('');
  const [marketData, setMarketData] = useState<MarketData>({});
  const [marketLoading, setMarketLoading] = useState(true);

  // Agent mode state
  const [agentStrategy, setAgentStrategy] = useState('dca');
  const [agentToken, setAgentToken] = useState('WETH');
  const [agentAmount, setAgentAmount] = useState('');
  const [agentInterval, setAgentInterval] = useState('1h');
  const [agentRunning, setAgentRunning] = useState(false);
  const [strategies, setStrategies] = useState<any[]>([]);

  const fetchMarketData = useCallback(async () => {
    try {
      const ids = Object.values(TOKENS).map(t => t.coingeckoId).filter((v, i, a) => a.indexOf(v) === i).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch {} finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useEffect(() => {
    if (!accessToken) return;
    loadTrades();
    loadWallets();
    loadStrategies();
  }, [accessToken]);

  async function loadTrades() {
    try { setTrades(await api.getTradeHistory() || []); } catch { setTrades([]); }
  }
  async function loadWallets() {
    try {
      const data = await api.getWallets();
      setWallets(data || []);
      if (data?.length > 0 && !selectedWallet) {
        const def = data.find((w: any) => w.isDefault) || data[0];
        setSelectedWallet(def.id);
      }
    } catch { setWallets([]); }
  }
  async function loadStrategies() {
    try { setStrategies(await api.getStrategies() || []); } catch { setStrategies([]); }
  }

  function getTokenAddress(symbol: string): string {
    return TOKENS[symbol]?.addresses[network] || '';
  }

  function getPrice(symbol: string): number {
    const token = TOKENS[symbol];
    if (!token) return 0;
    return marketData[token.coingeckoId]?.usd || 0;
  }

  function get24hChange(symbol: string): number {
    const token = TOKENS[symbol];
    if (!token) return 0;
    return marketData[token.coingeckoId]?.usd_24h_change || 0;
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
        walletId: selectedWallet,
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

  async function handleCreateStrategy() {
    if (!agentAmount || !selectedWallet) return;
    setAgentRunning(true);
    setError('');
    try {
      await api.createStrategy({
        name: `Auto ${agentStrategy.toUpperCase()} ${agentToken}`,
        type: agentStrategy,
        tokenIn: 'USDC',
        tokenOut: agentToken,
        amountPerTrade: agentAmount,
        interval: agentInterval,
        walletId: selectedWallet,
        network,
        provider: 'best',
      });
      loadStrategies();
    } catch (err: any) {
      setError(err.message || 'Failed to create strategy');
    } finally {
      setAgentRunning(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trading</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Swap tokens on Base via Uniswap V3 & Aerodrome</p>
        </div>
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
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Live</span>
          </span>
        </div>
      </div>

      {/* Market Prices */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tokenKeys.map((key) => {
          const price = getPrice(key);
          const change = get24hChange(key);
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{key}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {marketLoading ? '—' : price > 0 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
              </p>
              <p className="text-[10px] text-slate-400">{TOKENS[key].name}</p>
            </div>
          );
        })}
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        <button
          onClick={() => setMode('manual')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Manual Swap
        </button>
        <button
          onClick={() => setMode('agent')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === 'agent' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Autonomous Agent
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Provider + Swap */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">DEX Provider</h3>
              <div className="space-y-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setProvider(p.value); setQuote(null); }}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      provider === p.value
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-400'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <span className={`text-sm font-medium ${provider === p.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{p.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                    </div>
                    {provider === p.value && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Swap</h2>
              {error && <p className="text-sm text-red-500 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}

              {wallets.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  <p>No wallets found.</p>
                  <p className="mt-1">Create a wallet first to start trading.</p>
                  <a href="/wallets" className="mt-3 inline-block text-blue-600 hover:underline text-xs">Go to Wallets →</a>
                </div>
              ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Wallet</label>
                  <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.address?.slice(0, 6)}...{w.address?.slice(-4)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">You Pay</label>
                  <div className="flex gap-2">
                    <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null); }} placeholder="0.00" className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    <select value={tokenIn} onChange={(e) => { setTokenIn(e.target.value); setQuote(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                      {tokenKeys.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {getPrice(tokenIn) > 0 && amount && (
                    <p className="mt-1 text-xs text-slate-400">≈ ${(parseFloat(amount || '0') * getPrice(tokenIn)).toFixed(2)} USD</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button onClick={() => { const tmp = tokenIn; setTokenIn(tokenOut); setTokenOut(tmp); setQuote(null); }} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M8 14l-3-3M8 14l3-3M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">You Receive</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={bestQuote?.amountOut || '—'} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
                    <select value={tokenOut} onChange={(e) => { setTokenOut(e.target.value); setQuote(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                      {tokenKeys.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Slippage</span>
                  <div className="flex gap-1">
                    {slippageOptions.map((s) => (
                      <button key={s.value} onClick={() => setSlippage(s.value)} className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${slippage === s.value ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {bestQuote && (
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50 space-y-1.5 border border-slate-100 dark:border-slate-600">
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
                  <button onClick={handleGetQuote} disabled={!amount || quoting || tokenIn === tokenOut || !selectedWallet} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {quoting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Getting Quote...
                      </span>
                    ) : 'Get Quote'}
                  </button>
                ) : (
                  <button onClick={handleSwap} disabled={executing} className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {executing ? 'Executing Swap...' : `Swap ${amount} ${tokenIn} → ${tokenOut}`}
                  </button>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Right Column - Trade History */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trade History</h2>
                <button onClick={loadTrades} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Refresh</button>
              </div>
              {trades.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
                  No trades yet. Execute your first swap to see history here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pair</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Provider</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount In</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount Out</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                            {t.tokenIn?.slice(0, 6)}.../{t.tokenOut?.slice(0, 6)}...
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{t.dexProvider}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">{t.amountIn}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">{t.amountOut || '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : t.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Agent Mode */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400"><path d="M12 8V4H8"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M4 12h4M16 12h4M12 16v4"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Agent Trading</h2>
                  <p className="text-xs text-slate-500">Configure autonomous trading strategies</p>
                </div>
              </div>

              {wallets.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  <p>Create a wallet to enable agent trading.</p>
                  <a href="/wallets" className="mt-2 inline-block text-blue-600 hover:underline text-xs">Go to Wallets →</a>
                </div>
              ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Strategy</label>
                  <select value={agentStrategy} onChange={(e) => setAgentStrategy(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <option value="dca">DCA (Dollar Cost Average)</option>
                    <option value="grid">Grid Trading</option>
                    <option value="momentum">Momentum</option>
                    <option value="rebalance">Portfolio Rebalance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Wallet</label>
                  <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.address?.slice(0, 6)}...{w.address?.slice(-4)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Buy Token</label>
                  <select value={agentToken} onChange={(e) => setAgentToken(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {tokenKeys.filter(t => t !== 'USDC').map((t) => <option key={t} value={t}>{t} — {TOKENS[t].name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Amount per Trade (USDC)</label>
                  <input type="number" value={agentAmount} onChange={(e) => setAgentAmount(e.target.value)} placeholder="10.00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Interval</label>
                  <select value={agentInterval} onChange={(e) => setAgentInterval(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <option value="5m">Every 5 minutes</option>
                    <option value="15m">Every 15 minutes</option>
                    <option value="1h">Every hour</option>
                    <option value="4h">Every 4 hours</option>
                    <option value="1d">Daily</option>
                  </select>
                </div>

                {error && <p className="text-sm text-red-500 rounded-lg bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}

                <button
                  onClick={handleCreateStrategy}
                  disabled={!agentAmount || !selectedWallet || agentRunning}
                  className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {agentRunning ? 'Creating Strategy...' : 'Create Strategy'}
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Active Strategies */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Strategies</h2>
                <button onClick={loadStrategies} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Refresh</button>
              </div>
              {strategies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="rounded-full bg-purple-50 dark:bg-purple-900/20 p-3 w-fit mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M12 8V4H8"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M4 12h4M16 12h4M12 16v4"/></svg>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No active strategies.</p>
                  <p className="text-xs text-slate-400 mt-1">Create a strategy to start autonomous trading.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {strategies.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.type?.toUpperCase()} — {s.amountPerTrade} USDC → {s.tokenOut} every {s.interval}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {s.status || 'pending'}
                        </span>
                        {s.status === 'active' ? (
                          <button onClick={async () => { await api.pauseStrategy(s.id); loadStrategies(); }} className="rounded px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                            Pause
                          </button>
                        ) : (
                          <button onClick={async () => { await api.activateStrategy(s.id); loadStrategies(); }} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                            Activate
                          </button>
                        )}
                        <button onClick={async () => { await api.deleteStrategy(s.id); loadStrategies(); }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
