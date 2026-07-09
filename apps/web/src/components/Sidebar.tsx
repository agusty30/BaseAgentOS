'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '◈' },
  { name: 'Wallets', href: '/wallets', icon: '◇' },
  { name: 'Payments', href: '/payments', icon: '$' },
  { name: 'Trading', href: '/trading', icon: '⇄' },
  { name: 'Strategies', href: '/strategies', icon: '◆' },
  { name: 'Portfolio', href: '/portfolio', icon: '◐' },
  { name: 'Mission Control', href: '/mission-control', icon: '▶' },
  { name: 'Analytics', href: '/analytics', icon: '◫' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useAppStore();

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-900',
      sidebarOpen ? 'w-64' : 'w-16',
    )}>
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm font-bold">
          B
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-slate-900 dark:text-white">BaseAgent OS</span>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navigation.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand dark:bg-brand/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
              )}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
