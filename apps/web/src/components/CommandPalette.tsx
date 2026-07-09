'use client';

import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';

const pages = [
  { name: 'Dashboard', href: '/' },
  { name: 'Wallets', href: '/wallets' },
  { name: 'Payments', href: '/payments' },
  { name: 'Trading', href: '/trading' },
  { name: 'Strategies', href: '/strategies' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Mission Control', href: '/mission-control' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, toggleCommandPalette } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={toggleCommandPalette} />
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command className="rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full border-b border-slate-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-700 dark:text-white"
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>
            <Command.Group heading="Pages" className="text-xs text-slate-500 px-2 py-1">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  onSelect={() => {
                    router.push(page.href);
                    toggleCommandPalette();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {page.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
