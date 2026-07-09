'use client';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CommandPalette } from '@/components/CommandPalette';
import { useAppStore } from '@/stores/app.store';
import { useEffect } from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <>
      <Sidebar />
      <div className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
      <CommandPalette />
    </>
  );
}
