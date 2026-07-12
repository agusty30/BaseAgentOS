'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const typeColors: Record<string, string> = {
  dca: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rebalance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'stop-loss': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'profit-target': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'recurring-buy': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'recurring-sell': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function StrategiesPage() {
  const { accessToken } = useAuthStore();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'dca', maxDailySpend: '', autonomous: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadStrategies();
  }, [accessToken]);

  async function loadStrategies() {
    try {
      const data = await api.getStrategies();
      setStrategies(data || []);
    } catch {
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      await api.createStrategy({
        name: formData.name,
        type: formData.type,
        config: {},
        autonomousExecution: formData.autonomous,
        maxDailySpend: formData.maxDailySpend || undefined,
      });
      setFormData({ name: '', type: 'dca', maxDailySpend: '', autonomous: false });
      setShowCreate(false);
      loadStrategies();
    } catch (err: any) {
      setError(err.message || 'Failed to create strategy');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(id: string) {
    try { await api.activateStrategy(id); loadStrategies(); } catch {}
  }

  async function handlePause(id: string) {
    try { await api.pauseStrategy(id); loadStrategies(); } catch {}
  }

  async function handleDelete(id: string) {
    try { await api.deleteStrategy(id); loadStrategies(); } catch {}
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strategies</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
          New Strategy
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Strategy</h2>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Strategy Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Daily ETH Buy" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="dca">Dollar Cost Averaging</option>
                <option value="recurring-buy">Recurring Buy</option>
                <option value="recurring-sell">Recurring Sell</option>
                <option value="rebalance">Portfolio Rebalance</option>
                <option value="profit-target">Profit Target</option>
                <option value="stop-loss">Stop Loss</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Daily Spend (USDC)</label>
              <input type="number" value={formData.maxDailySpend} onChange={(e) => setFormData({ ...formData, maxDailySpend: e.target.value })} placeholder="1000" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.autonomous} onChange={(e) => setFormData({ ...formData, autonomous: e.target.checked })} className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Enable Autonomous Execution</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:text-white">Cancel</button>
            <button onClick={handleCreate} disabled={!formData.name || submitting} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Strategy'}
            </button>
          </div>
        </div>
      )}

      {strategies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No strategies yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create a DCA, rebalance, or stop-loss strategy to automate your trading.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[s.type] || 'bg-slate-100 dark:bg-slate-700'}`}>{s.type}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{s.status}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-slate-900 dark:text-white">{s.network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Autonomous</span><span className="text-slate-900 dark:text-white">{s.autonomousExecution ? 'Yes' : 'No'}</span></div>
                {s.maxDailySpend && <div className="flex justify-between"><span className="text-slate-500">Max Daily</span><span className="text-slate-900 dark:text-white">${s.maxDailySpend}</span></div>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => s.status === 'active' ? handlePause(s.id) : handleActivate(s.id)} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:text-white">
                  {s.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-800 dark:text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
