'use client';

import { useState } from 'react';
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
  Search,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from '@baseagent/ui';
import type { Wallet as WalletT, WalletType, WalletBalance } from '@baseagent/shared';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface WalletWithBalance extends WalletT {
  balance: WalletBalance;
}

const MOCK_WALLETS: WalletWithBalance[] = [
  {
    id: 'w-001',
    userId: 'u-001',
    name: 'Treasury',
    address: '0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12',
    type: 'eoa',
    isDefault: true,
    isTreasury: true,
    isAgent: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-06-30T08:00:00Z',
    balance: {
      eth: '12.4821',
      usdc: '892450.00',
      tokens: [
        {
          address: '0xUsdc',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '892450000000',
          valueUsd: '892450.00',
        },
        {
          address: '0xWeth',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          balance: '12482100000000000000',
          valueUsd: '48,033.65',
        },
      ],
    },
  },
  {
    id: 'w-002',
    userId: 'u-001',
    name: 'Operations',
    address: '0x2b3C4d5E6f7890AbCdEf1234567890AbCdEf1234',
    type: 'eoa',
    isDefault: false,
    isTreasury: false,
    isAgent: false,
    createdAt: '2026-02-20T14:30:00Z',
    updatedAt: '2026-06-29T16:45:00Z',
    balance: {
      eth: '3.2150',
      usdc: '125,840.00',
      tokens: [
        {
          address: '0xUsdc',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '125840000000',
          valueUsd: '125840.00',
        },
        {
          address: '0xWeth',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          balance: '3215000000000000000',
          valueUsd: '12,375.33',
        },
      ],
    },
  },
  {
    id: 'w-003',
    userId: 'u-001',
    name: 'Trading Bot',
    address: '0x3c4D5e6F7890aBcDeF1234567890AbCdEf123456',
    type: 'eoa',
    isDefault: false,
    isTreasury: false,
    isAgent: true,
    createdAt: '2026-03-10T09:15:00Z',
    updatedAt: '2026-06-30T07:30:00Z',
    balance: {
      eth: '8.7340',
      usdc: '247,120.00',
      tokens: [
        {
          address: '0xUsdc',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '247120000000',
          valueUsd: '247120.00',
        },
        {
          address: '0xWeth',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          balance: '8734000000000000000',
          valueUsd: '33,599.04',
        },
        {
          address: '0xAero',
          symbol: 'AERO',
          name: 'Aerodrome',
          decimals: 18,
          balance: '15420000000000000000000',
          valueUsd: '8,214.66',
        },
      ],
    },
  },
  {
    id: 'w-004',
    userId: 'u-001',
    name: 'DeFi Vault',
    address: '0x4d5E6f7890AbCdEf1234567890AbCdEf12345678',
    type: 'mpc',
    isDefault: false,
    isTreasury: false,
    isAgent: false,
    createdAt: '2026-04-05T11:00:00Z',
    updatedAt: '2026-06-28T20:00:00Z',
    balance: {
      eth: '22.1580',
      usdc: '510,200.00',
      tokens: [
        {
          address: '0xUsdc',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '510200000000',
          valueUsd: '510200.00',
        },
        {
          address: '0xWeth',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          balance: '22158000000000000000',
          valueUsd: '85,267.62',
        },
      ],
    },
  },
  {
    id: 'w-005',
    userId: 'u-001',
    name: 'External',
    address: '0x5e6F7890aBcDeF1234567890AbCdEf1234567890',
    type: 'walletconnect',
    isDefault: false,
    isTreasury: false,
    isAgent: false,
    createdAt: '2026-05-18T16:45:00Z',
    updatedAt: '2026-06-27T12:00:00Z',
    balance: {
      eth: '1.0500',
      usdc: '15,340.00',
      tokens: [
        {
          address: '0xUsdc',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '15340000000',
          valueUsd: '15340.00',
        },
        {
          address: '0xWeth',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          balance: '1050000000000000000',
          valueUsd: '4,040.25',
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function parseUsd(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTotalBalance(wallet: WalletWithBalance): number {
  let total = 0;
  for (const token of wallet.balance.tokens) {
    total += parseUsd(token.valueUsd);
  }
  return total;
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

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ---------------------------------------------------------------------------
// Wallet Card Component
// ---------------------------------------------------------------------------

function WalletCardItem({
  wallet,
  onSelect,
}: {
  wallet: WalletWithBalance;
  onSelect: (wallet: WalletWithBalance) => void;
}) {
  const [copied, setCopied] = useState(false);
  const totalBalance = getTotalBalance(wallet);

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
            <div
              className={cn(
                'rounded-lg p-2',
                wallet.isTreasury
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : wallet.isAgent
                    ? 'bg-purple-50 dark:bg-purple-950'
                    : 'bg-slate-100 dark:bg-slate-800',
              )}
            >
              {wallet.isAgent ? (
                <Bot
                  className={cn(
                    'h-5 w-5',
                    'text-purple-600 dark:text-purple-400',
                  )}
                />
              ) : wallet.isTreasury ? (
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{wallet.name}</CardTitle>
                {wallet.isDefault && (
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <code className="text-xs text-slate-400 dark:text-slate-500">
                  {truncateAddress(wallet.address)}
                </code>
                <button
                  onClick={handleCopy}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && (
                  <span className="text-[10px] text-green-500">Copied</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {wallet.isTreasury && (
              <Badge variant="info" dot>
                Treasury
              </Badge>
            )}
            {wallet.isAgent && (
              <Badge variant="info" dot>
                Agent
              </Badge>
            )}
            <Badge variant={walletTypeBadgeVariant[wallet.type]}>
              {walletTypeLabels[wallet.type]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Balance */}
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {formatUsd(totalBalance)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Total balance
          </p>
        </div>

        {/* Token Breakdown */}
        <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                E
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">ETH</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                {wallet.balance.eth}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                $
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">USDC</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                ${wallet.balance.usdc}
              </p>
            </div>
          </div>
          {wallet.balance.tokens
            .filter((t) => t.symbol !== 'USDC' && t.symbol !== 'WETH')
            .map((token) => (
              <div key={token.address} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {token.symbol.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {token.symbol}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    ${token.valueUsd}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
      <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Updated {new Date(wallet.updatedAt).toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ExternalLink className="h-3 w-3" />}
            onClick={(e) => e.stopPropagation()}
          >
            Explorer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Create Wallet Dialog
// ---------------------------------------------------------------------------

function CreateWalletDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('eoa');
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl',
          'dark:border-slate-800 dark:bg-slate-950',
        )}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Create Wallet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure a new wallet for your operations
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Wallet Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="cw-name"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Wallet Name
            </label>
            <input
              id="cw-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Trading Operations"
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
                'placeholder:text-slate-400',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                'dark:placeholder:text-slate-500 dark:focus:border-blue-400',
              )}
            />
          </div>

          {/* Wallet Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="cw-type"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Wallet Type
            </label>
            <div className="relative">
              <select
                id="cw-type"
                value={type}
                onChange={(e) => setType(e.target.value as WalletType)}
                className={cn(
                  'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm',
                  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                  'dark:focus:border-blue-400',
                )}
              >
                <option value="eoa">EOA (Externally Owned Account)</option>
                <option value="mpc">MPC (Multi-Party Computation)</option>
                <option value="coinbase">Coinbase Managed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {type === 'eoa' && 'Standard wallet with a private key you control.'}
              {type === 'mpc' && 'Multi-party computation wallet with distributed key management.'}
              {type === 'coinbase' && 'Managed wallet through Coinbase infrastructure.'}
            </p>
          </div>

          {/* Set as Default */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Set as Default
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Use this wallet for default operations
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isDefault}
              onClick={() => setIsDefault(!isDefault)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                isDefault ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  isDefault ? 'translate-x-5' : 'translate-x-0.5',
                  'mt-0.5',
                )}
              />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="cw-description"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="cw-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this wallet..."
              rows={3}
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none',
                'placeholder:text-slate-400',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                'dark:placeholder:text-slate-500 dark:focus:border-blue-400',
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={onClose}
          >
            Create Wallet
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import Wallet Dialog
// ---------------------------------------------------------------------------

function ImportWalletDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [network, setNetwork] = useState<'base-mainnet' | 'base-sepolia'>('base-sepolia');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl',
          'dark:border-slate-800 dark:bg-slate-950',
        )}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Import Wallet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Import an existing wallet using a private key or mnemonic phrase
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Wallet Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="iw-name"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Wallet Name
            </label>
            <input
              id="iw-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My External Wallet"
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
                'placeholder:text-slate-400',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                'dark:placeholder:text-slate-500 dark:focus:border-blue-400',
              )}
            />
          </div>

          {/* Private Key / Mnemonic */}
          <div className="space-y-1.5">
            <label
              htmlFor="iw-secret"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Private Key or Mnemonic
            </label>
            <input
              id="iw-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter private key or 12/24-word mnemonic phrase"
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono',
                'placeholder:text-slate-400 placeholder:font-sans',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                'dark:placeholder:text-slate-500 dark:focus:border-blue-400',
              )}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your key is encrypted locally and never transmitted in plaintext.
            </p>
          </div>

          {/* Network */}
          <div className="space-y-1.5">
            <label
              htmlFor="iw-network"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Network
            </label>
            <div className="relative">
              <select
                id="iw-network"
                value={network}
                onChange={(e) =>
                  setNetwork(e.target.value as 'base-mainnet' | 'base-sepolia')
                }
                className={cn(
                  'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm',
                  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                  'dark:focus:border-blue-400',
                )}
              >
                <option value="base-sepolia">Base Sepolia (Testnet)</option>
                <option value="base-mainnet">Base Mainnet</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Security Notice */}
          <div
            className={cn(
              'flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3',
              'dark:border-amber-900/50 dark:bg-amber-950/50',
            )}
          >
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Ensure you are on a secure device. Imported wallets grant full control
              of the associated address. Never share your private key.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim() || !secret.trim()}
            onClick={onClose}
          >
            Import Wallet
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallets Page
// ---------------------------------------------------------------------------

export default function WalletsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletWithBalance | null>(null);

  // Computed summary
  const totalBalance = MOCK_WALLETS.reduce(
    (sum, w) => sum + getTotalBalance(w),
    0,
  );
  const walletCount = MOCK_WALLETS.length;
  const defaultWallet = MOCK_WALLETS.find((w) => w.isDefault);

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6 p-6"
      >
        {/* Page Header */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
              <Wallet className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Wallets
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your wallets and view balances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setImportOpen(true)}
            >
              Import Wallet
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create Wallet
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Balance
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {formatUsd(totalBalance)}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Across all wallets
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Wallets
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {walletCount}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="info" dot>
                    {MOCK_WALLETS.filter((w) => w.isAgent).length} agent
                  </Badge>
                  <Badge variant="default" dot>
                    {MOCK_WALLETS.filter((w) => w.type === 'mpc').length} MPC
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Default Wallet
                </p>
                {defaultWallet ? (
                  <>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {defaultWallet.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <code className="text-xs text-slate-400 dark:text-slate-500">
                        {truncateAddress(defaultWallet.address)}
                      </code>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No default set</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Wallet Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MOCK_WALLETS.map((wallet) => (
            <motion.div key={wallet.id} variants={fadeInUp}>
              <WalletCardItem
                wallet={wallet}
                onSelect={setSelectedWallet}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Dialogs */}
      <CreateWalletDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ImportWalletDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
