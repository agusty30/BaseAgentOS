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
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Send,
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

function formatBalance(val: string | number, decimals = 4): string {
  const num = parseFloat(String(val || '0'));
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
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

function WalletCardItem({ wallet, onSelect, onTransfer }: { wallet: any; onSelect: (w: any) => void; onTransfer: (w: any) => void }) {
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<{ eth: string; usdc: string } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [wallet.id]);

  async function fetchBalance() {
    setLoadingBalance(true);
    try {
      const data = await api.getWalletBalance(wallet.id, wallet.network || 'base-sepolia');
      setBalance({ eth: data.eth, usdc: data.usdc });
    } catch {
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const network = wallet.network || 'base-sepolia';
  const explorerBase = network === 'base-mainnet' ? 'https://basescan.org' : 'https://sepolia.basescan.org';

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
        <div className="space-y-2">
          {loadingBalance ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin" /> Loading balances...
            </div>
          ) : balance ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">ETH</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatBalance(balance.eth, 6)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">USDC</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatBalance(balance.usdc, 2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Unable to load balances</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">Network: {network === 'base-mainnet' ? 'Base Mainnet' : 'Base Sepolia'}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Created {new Date(wallet.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onTransfer(wallet); }}
              className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Send className="h-3 w-3" /> Send
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(wallet); }}
              className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> History
            </button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function TransactionHistory({ wallet, onClose }: { wallet: any; onClose: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [wallet.id]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const data = await api.getWalletTransactions(wallet.id);
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  const network = wallet.network || 'base-sepolia';
  const explorerBase = network === 'base-mainnet' ? 'https://basescan.org' : 'https://sepolia.basescan.org';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-xs text-slate-500 mt-0.5">{wallet.name} — {truncateAddress(wallet.address)}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No transactions found for this wallet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => {
              const isOutgoing = tx.from?.toLowerCase() === wallet.address?.toLowerCase();
              const ethValue = parseFloat(tx.value) / 1e18;
              const timestamp = new Date(parseInt(tx.timeStamp) * 1000);

              return (
                <div key={tx.hash} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={cn('rounded-full p-1.5', isOutgoing ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20')}>
                    {isOutgoing
                      ? <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                      : <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium', isOutgoing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                        {isOutgoing ? 'Sent' : 'Received'}
                      </span>
                      {tx.isError && <Badge variant="default">Failed</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {isOutgoing ? `To: ${truncateAddress(tx.to || '')}` : `From: ${truncateAddress(tx.from || '')}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {isOutgoing ? '-' : '+'}{ethValue > 0.0001 ? ethValue.toFixed(6) : '<0.0001'} ETH
                    </p>
                    <p className="text-[10px] text-slate-400">{timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <a
                    href={`${explorerBase}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-700"
                    title="View on Explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
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

function TransferDialog({ open, onClose, fromWallet, allWallets, onDone }: { open: boolean; onClose: () => void; fromWallet: any; allWallets: any[]; onDone: () => void }) {
  const [toType, setToType] = useState<'wallet' | 'address'>('wallet');
  const [toWalletId, setToWalletId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'ETH' | 'USDC'>('ETH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  const otherWallets = allWallets.filter(w => w.id !== fromWallet?.id);

  if (!open || !fromWallet) return null;

  async function handleTransfer() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const destAddress = toType === 'wallet'
        ? otherWallets.find(w => w.id === toWalletId)?.address
        : toAddress;
      if (!destAddress) {
        setError('Please select a destination');
        setLoading(false);
        return;
      }
      const res = await api.transferFromWallet(fromWallet.id, {
        toAddress: destAddress,
        amount,
        token,
      });
      setResult(res);
      onDone();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Transfer Funds</h2>
        <p className="text-xs text-slate-500 mb-4">From: {fromWallet.name} ({fromWallet.address?.slice(0, 6)}...{fromWallet.address?.slice(-4)})</p>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Transfer Successful!</p>
              <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
              <p className="mt-1 text-[10px] text-slate-400 font-mono break-all">{result.txHash}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-500 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Send to</label>
                <div className="mt-1 flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button onClick={() => setToType('wallet')} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${toType === 'wallet' ? 'bg-white shadow-sm dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'}`}>My Wallet</button>
                  <button onClick={() => setToType('address')} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${toType === 'address' ? 'bg-white shadow-sm dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'}`}>External Address</button>
                </div>
              </div>

              {toType === 'wallet' ? (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Destination Wallet</label>
                  {otherWallets.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">No other wallets available. Create another wallet first.</p>
                  ) : (
                    <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Select wallet...</option>
                      {otherWallets.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.isTreasury ? '(Treasury)' : w.isAgent ? '(Agent)' : ''} — {w.address?.slice(0, 6)}...{w.address?.slice(-4)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recipient Address</label>
                  <input type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="0x..." className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Token</label>
                  <select value={token} onChange={(e) => setToken(e.target.value as 'ETH' | 'USDC')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="any" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!amount || loading || (toType === 'wallet' ? !toWalletId : !toAddress)}
                onClick={handleTransfer}
              >
                {loading ? 'Sending...' : `Send ${token}`}
              </Button>
            </div>
          </>
        )}
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
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [transferWallet, setTransferWallet] = useState<any>(null);

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
                <WalletCardItem wallet={wallet} onSelect={setSelectedWallet} onTransfer={setTransferWallet} />
              </motion.div>
            ))}
          </div>
        )}

        {selectedWallet && (
          <TransactionHistory wallet={selectedWallet} onClose={() => setSelectedWallet(null)} />
        )}
      </motion.div>

      <CreateWalletDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadWallets} />
      <ImportWalletDialog open={importOpen} onClose={() => setImportOpen(false)} onCreated={loadWallets} />
      <TransferDialog open={!!transferWallet} onClose={() => setTransferWallet(null)} fromWallet={transferWallet} allWallets={wallets} onDone={loadWallets} />
    </>
  );
}
