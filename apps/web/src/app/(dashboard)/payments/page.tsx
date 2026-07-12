'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function PaymentsPage() {
  const { accessToken } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ recipient: '', amount: '', token: 'USDC', type: 'one-time' as string });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadPayments();
  }, [accessToken]);

  async function loadPayments() {
    try {
      const data = await api.getPayments();
      setPayments(data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      await api.createPayment({
        recipient: formData.recipient,
        amount: formData.amount,
        token: formData.token,
        type: formData.type,
        network: 'base-sepolia',
      });
      setFormData({ recipient: '', amount: '', token: 'USDC', type: 'one-time' });
      setShowForm(false);
      loadPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
          New Payment
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Payment</h2>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recipient Address</label>
              <input type="text" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} placeholder="0x..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (USDC)</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="one-time">One-time</option>
                <option value="scheduled">Scheduled</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:text-white">Cancel</button>
            <button onClick={handleCreate} disabled={submitting || !formData.recipient || !formData.amount} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Payment'}
            </button>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No payments yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create your first payment to send USDC on Base network.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">{p.recipient ? `${p.recipient.slice(0, 6)}...${p.recipient.slice(-4)}` : '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{p.amount} {p.token}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">{p.type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : p.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
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
