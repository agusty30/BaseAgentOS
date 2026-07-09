'use client';

import { useAppStore } from '@/stores/app.store';

export function NetworkSwitcher() {
  const { network, setNetwork } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as 'base-mainnet' | 'base-sepolia')}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="base-sepolia">Base Sepolia</option>
        <option value="base-mainnet">Base Mainnet</option>
      </select>
      <div className={`h-2 w-2 rounded-full ${network === 'base-mainnet' ? 'bg-green-500' : 'bg-amber-500'}`} />
    </div>
  );
}
