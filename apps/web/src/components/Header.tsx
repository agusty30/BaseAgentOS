'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { api } from '@/lib/api';

export function Header() {
  const router = useRouter();
  const { toggleSidebar, toggleCommandPalette } = useAppStore();
  const { user, isAuthenticated, accessToken, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  async function loadNotifications() {
    try {
      const data = await api.getNotifications(20);
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: any) => !n.readAt).length);
    } catch {
      setNotifications([]);
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

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

        <ConnectWalletButton />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">{unreadCount} new</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.readAt && markAsRead(n.id)}
                      className={`px-4 py-3 border-b border-slate-100 last:border-0 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.readAt ? 'bg-brand/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-white truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {isAuthenticated && user && (
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              )}
              <button
                onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
