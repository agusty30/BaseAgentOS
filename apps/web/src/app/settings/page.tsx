'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';

export default function SettingsPage() {
  const { network, setNetwork } = useAppStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'network', label: 'Network' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'risk', label: 'Risk Limits' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeTab === tab.id ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label><input type="text" defaultValue="Admin" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" defaultValue="admin@baseagent.os" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Save Changes</button>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Network Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Active Network</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value as any)} className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="base-sepolia">Base Sepolia (Testnet)</option>
              <option value="base-mainnet">Base Mainnet</option>
            </select>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400">Switching to Mainnet uses real funds. Ensure all parameters are verified.</p>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label><input type="password" className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label><input type="password" className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700" /></div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Update Password</button>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Limits</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Trade Size (USD)</label><input type="number" defaultValue="10000" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Daily Volume (USD)</label><input type="number" defaultValue="100000" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Slippage (bps)</label><input type="number" defaultValue="500" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Emergency Stop — Halt All Activity</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
          {['Payment completed', 'Trade executed', 'Strategy triggered', 'Risk alert', 'Agent failure'].map((pref) => (
            <label key={pref} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{pref}</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
