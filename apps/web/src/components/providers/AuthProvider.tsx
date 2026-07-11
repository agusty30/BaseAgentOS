'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const REFRESH_INTERVAL_MS = 780_000; // 13 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [initializing, setInitializing] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await refreshToken();
      if (!cancelled) {
        setInitializing(false);
      }
    }

    init();

    intervalRef.current = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshToken]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052FF] dark:border-slate-700 dark:border-t-[#336BFF]" />
      </div>
    );
  }

  return <>{children}</>;
}
