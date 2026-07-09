'use client';

import { useState } from 'react';

const mockTokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: '2.4512' },
  { symbol: 'USDC', name: 'USD Coin', balance: '98,200.00' },
  { symbol: 'AERO', name: 'Aerodrome', balance: '1,500.00' },
];

export default function TradingPage() {
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [provider, setProvider] = useState('best');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trading</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Swap</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Pay</label>
                <div className="flex gap-2">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {mockTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={() => { setTokenIn(tokenOut); setTokenOut(tokenIn); }} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">↕</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">You Receive</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value="—" className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
                  <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    {mockTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="best">Best Price</option>
                  <option value="uniswap">Uniswap V3</option>
                  <option value="aerodrome">Aerodrome</option>
                </select>
              </div>

              <button className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover">
                Get Quote
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Trade History</h2>
            <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
              No trades yet. Execute your first swap to see history here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
