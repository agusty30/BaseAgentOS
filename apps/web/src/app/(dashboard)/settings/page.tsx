'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from '@baseagent/ui';

interface AIProviderRow {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

const PRESETS = [
  { name: 'Anthropic', slug: 'anthropic', baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514' },
  { name: 'OpenAI', slug: 'openai', baseUrl: 'https://api.openai.com', defaultModel: 'gpt-4o' },
  { name: 'Google Gemini', slug: 'google', baseUrl: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-2.5-flash' },
  { name: 'OpenRouter', slug: 'openrouter', baseUrl: 'https://openrouter.ai/api', defaultModel: 'anthropic/claude-sonnet-4' },
  { name: 'Grok', slug: 'grok', baseUrl: 'https://api.x.ai', defaultModel: 'grok-3' },
  { name: 'DeepSeek', slug: 'deepseek', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
];

export default function SettingsPage() {
  const { network, setNetwork } = useAppStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'ai-providers', label: 'AI Providers' },
    { id: 'security', label: 'Security' },
    { id: 'network', label: 'Network' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'risk', label: 'Risk Limits' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
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

      {activeTab === 'ai-providers' && <AIProvidersTab />}

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

function AIProvidersTab() {
  const [providers, setProviders] = useState<AIProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ slug: string; success: boolean; latencyMs?: number; error?: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formDefault, setFormDefault] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await api.getAIProviders();
      setProviders(res.providers || []);
    } catch {
      // silently fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  function selectPreset(slug: string) {
    const preset = PRESETS.find((p) => p.slug === slug);
    if (preset) {
      setFormName(preset.name);
      setFormSlug(preset.slug);
      setFormBaseUrl(preset.baseUrl);
      setFormModel(preset.defaultModel);
    }
  }

  async function handleAdd() {
    setSaving(true);
    setFormError('');
    try {
      await api.addAIProvider({
        name: formName,
        slug: formSlug,
        baseUrl: formBaseUrl,
        apiKey: formApiKey,
        defaultModel: formModel,
        isDefault: formDefault,
      });
      setShowAddForm(false);
      setFormName(''); setFormSlug(''); setFormBaseUrl(''); setFormApiKey(''); setFormModel(''); setFormDefault(false);
      await fetchProviders();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(slug: string) {
    setTestingSlug(slug);
    setTestResult(null);
    try {
      const result = await api.testAIProvider(slug);
      setTestResult({ slug, ...result });
    } catch (err) {
      setTestResult({ slug, success: false, error: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTestingSlug(null);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete provider "${slug}"?`)) return;
    try {
      await api.deleteAIProvider(slug);
      await fetchProviders();
    } catch {
      // ignore
    }
  }

  async function handleSetDefault(slug: string) {
    try {
      await api.setDefaultAIProvider(slug);
      await fetchProviders();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand dark:border-slate-700 dark:border-t-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Providers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure AI providers for autonomous agent operations.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Provider'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Add AI Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => selectPreset(p.slug)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Provider Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Anthropic" />
              <Input label="Slug" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="e.g. anthropic" />
              <Input label="Base URL" value={formBaseUrl} onChange={(e) => setFormBaseUrl(e.target.value)} placeholder="https://api.anthropic.com" />
              <Input label="Default Model" value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="claude-sonnet-4-20250514" />
            </div>

            <Input label="API Key" type="password" value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} placeholder="sk-..." />

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={formDefault} onChange={(e) => setFormDefault(e.target.checked)} className="rounded" />
              Set as default provider
            </label>

            {formError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <Button variant="primary" onClick={handleAdd} loading={saving} className="w-full">
              Add Provider
            </Button>
          </CardContent>
        </Card>
      )}

      {providers.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-500 dark:text-slate-400">No AI providers configured yet.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add a provider to enable autonomous agent operations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                  {p.isDefault && <Badge variant="success">Default</Badge>}
                  <Badge variant={p.status === 'active' ? 'success' : 'warning'}>{p.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{p.baseUrl}</span>
                  <span>{p.defaultModel}</span>
                  <span>Key: {p.apiKey}</span>
                </div>
                {testResult && testResult.slug === p.slug && (
                  <div className={`mt-2 text-xs ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {testResult.success ? `Connected (${testResult.latencyMs}ms)` : `Failed: ${testResult.error}`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleTest(p.slug)}
                  disabled={testingSlug === p.slug}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  {testingSlug === p.slug ? 'Testing...' : 'Test'}
                </button>
                {!p.isDefault && (
                  <button
                    onClick={() => handleSetDefault(p.slug)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(p.slug)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
