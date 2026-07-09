import * as React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './Badge';

interface WalletCardProps {
  name: string;
  address: string;
  type: 'eoa' | 'walletconnect' | 'coinbase' | 'mpc';
  balance?: { eth: string; usdc: string };
  isDefault?: boolean;
  isTreasury?: boolean;
  isAgent?: boolean;
  network?: string;
  onCopy?: () => void;
  onClick?: () => void;
  className?: string;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const typeLabels: Record<string, string> = {
  eoa: 'EOA',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase',
  mpc: 'MPC',
};

function WalletCard({
  name, address, type, balance, isDefault, isTreasury, isAgent, network, onCopy, onClick, className,
}: WalletCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800',
        onClick && 'cursor-pointer hover:border-brand/50',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {truncateAddress(address)}
            </code>
            {onCopy && (
              <button
                onClick={(e) => { e.stopPropagation(); onCopy(); }}
                className="text-xs text-brand hover:text-brand-hover"
              >
                Copy
              </button>
            )}
          </div>
        </div>
        <Badge variant={type === 'eoa' ? 'default' : 'info'}>{typeLabels[type]}</Badge>
      </div>

      {balance && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">ETH</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">
              {parseFloat(balance.eth).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">USDC</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">
              ${parseFloat(balance.usdc).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3">
        {isDefault && <Badge variant="success">Default</Badge>}
        {isTreasury && <Badge variant="warning">Treasury</Badge>}
        {isAgent && <Badge variant="info">Agent</Badge>}
        {network && (
          <Badge variant="default">
            {network === 'base-mainnet' ? 'Mainnet' : 'Sepolia'}
          </Badge>
        )}
      </div>
    </div>
  );
}

export { WalletCard };
