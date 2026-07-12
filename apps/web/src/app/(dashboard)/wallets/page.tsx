'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Plus,
  Download,
  Shield,
  Bot,
  Star,
  Copy,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from '@baseagent/ui';
import type { WalletType } from '@baseagent/shared';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const walletTypeLabels: Record<WalletType, string> = {
  eoa: 'EOA',
  mpc: 'MPC',
  coinbase: 'Coinbase',
  walletconnect: 'WalletConnect',
};

const walletTypeBadgeVariant: Record<WalletType, 'default' | 'info' | 'success' | 'warning'> = {
  eoa: 'default',
  mpc: 'info',
  coinbase: 'success',
  walletconnect: 'warning',
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function WalletCardItem({ wallet, onSelect }: { wallet: any; onSelect: (w: any) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
        wallet.isTreasury && 'border-blue-200 dark:border-blue-900/50',
      )}
      onClick={() => onSelect(wallet)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn('rounded-lg p-2', wallet.isTreasury ? 'bg-blue-50 dark:bg-blue-950' : wallet.isAgent ? 'bg-purple-50 dark:bg-purple-950' : 'bg-slate-100 dark:bg-slate-800')}>
              {wallet.isAgent ? <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" /> : wallet.isTreasury ? <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{wallet.name}</CardTitle>
                {wallet.isDefault && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <code className="text-xs text-slate-400 dark:text-slate-500">{truncateAddress(wallet.address)}</code>
                <button onClick={handleCopy} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-green-500">Copied</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {wallet.isTreasury && <Badge variant="info" dot>Treasury</Badge>}
            {wallet.isAgent && <Badge variant="info" dot>Agent</Badge>}
            <Badge variant={walletTypeBadgeVariant[wallet.type as WalletType] || 'default'}>{walletTypeLabels[wallet.type as WalletType] || wallet.type}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400 dark:text-slate-500">Network: {wallet.network || 'base-sepolia'}</p>
      </CardContent>
      <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Created {new Date(wallet.createdAt).toLocaleDateString()}
          </span>
          <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3 w-3" />} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            Explorer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function CreateWalletDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [isTreasury, setIsTreasury] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      await api.createWallet({ name, isTreasury, isAgent });
      setName('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Create Wallet</h2>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Trading Operations" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isTreasury} onChange={(e) => setIsTreasury(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Treasury Wallet</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isAgent} onChange={(e) => setIsAgent(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Agent Wallet</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || loading} onClick={handleCreate}>{loading ? 'Creating...' : 'Create Wallet'}</Button>
        </div>
      </motion.div>
    </div>
  );
}

function ImportWalletDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [network, setNetwork] = useState('base-sepolia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleImport() {
    setLoading(true);
    setError('');
    try {
      await api.importWallet({ name, privateKey, network });
      setName('');
      setPrivateKey('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Import Wallet</h2>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My External Wallet" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Private Key</label>
            <input type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="0x..." className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Network</label>
            <div className="relative mt-1">
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <option value="base-sepolia">Base Sepolia (Testnet)</option>
                <option value="base-mainnet">Base Mainnet</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/50">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">Your key is encrypted with AES-256-GCM before storage. Never share your private key.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || !privateKey.trim() || loading} onClick={handleImport}>{loading ? 'Importing...' : 'Import Wallet'}</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WalletsPage() {
  const { accessToken } = useAuthStore();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    loadWallets();
  }, [accessToken]);

  async function loadWallets() {
    try {
      const data = await api.getWallets();
      setWallets(data || []);
    } catch {
      setWallets([]);
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

  return (
    <>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 p-6">
        <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
              <Wallet className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Wallets</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your wallets and view balances</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Create Wallet</Button>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Wallets</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{wallets.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Agent Wallets</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{wallets.filter(w => w.isAgent).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Default Wallet</p>
                <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{wallets.find(w => w.isDefault)?.name || 'None set'}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {wallets.length === 0 ? (
          <motion.div variants={fadeInUp} className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">No wallets yet</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create a new wallet or import an existing one to get started.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setImportOpen(true)}>Import Wallet</Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>Create Wallet</Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {wallets.map((wallet) => (
              <motion.div key={wallet.id} variants={fadeInUp}>
                <WalletCardItem wallet={wallet} onSelect={() => {}} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <CreateWalletDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadWallets} />
      <ImportWalletDialog open={importOpen} onClose={() => setImportOpen(false)} onCreated={loadWallets} />
    </>
  );
}
