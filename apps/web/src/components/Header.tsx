'use client';

import { useAppStore } from '@/stores/app.store';

export function Header() {
  const { sidebarOpen, toggleSidebar, toggleCommandPalette } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ☰
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
        >
          <span>Search...</span>
          <kbd className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-400 dark:bg-slate-700 sm:inline">
            ⌘K
          </kbd>
        </button>

        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          🔔
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">
          U
        </div>
      </div>
    </header>
  );
}
