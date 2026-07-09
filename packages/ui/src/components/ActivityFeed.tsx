import * as React from 'react';
import { cn } from '../lib/utils';

interface ActivityItem {
  id: string;
  type: 'payment' | 'trade' | 'strategy' | 'mission' | 'wallet' | 'system';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

const typeIcons: Record<string, string> = {
  payment: '$',
  trade: '~',
  strategy: '#',
  mission: '>',
  wallet: '@',
  system: '*',
};

const statusColors: Record<string, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

function ActivityFeed({ items, className }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-sm text-slate-500 dark:text-slate-400', className)}>
        No recent activity
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
            {typeIcons[item.type] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium text-slate-900 dark:text-white', item.status && statusColors[item.status])}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.description}</p>
            )}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{item.timestamp}</span>
        </div>
      ))}
    </div>
  );
}

export { ActivityFeed };
export type { ActivityItem };
