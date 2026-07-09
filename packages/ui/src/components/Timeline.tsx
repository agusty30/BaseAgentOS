import * as React from 'react';
import { cn } from '../lib/utils';

type TimelineStatus = 'completed' | 'running' | 'pending' | 'failed' | 'skipped';

interface TimelineItemProps {
  title: string;
  description?: string;
  status: TimelineStatus;
  timestamp?: string;
  duration?: string;
  children?: React.ReactNode;
}

const statusStyles: Record<TimelineStatus, { dot: string; line: string }> = {
  completed: { dot: 'bg-green-500', line: 'bg-green-200 dark:bg-green-900' },
  running: { dot: 'bg-amber-500 animate-pulse', line: 'bg-amber-200 dark:bg-amber-900' },
  pending: { dot: 'bg-slate-300 dark:bg-slate-600', line: 'bg-slate-200 dark:bg-slate-700' },
  failed: { dot: 'bg-red-500', line: 'bg-red-200 dark:bg-red-900' },
  skipped: { dot: 'bg-slate-400', line: 'bg-slate-200 dark:bg-slate-700' },
};

function TimelineItem({ title, description, status, timestamp, duration, children }: TimelineItemProps) {
  const styles = statusStyles[status];
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-3 rounded-full mt-1.5 shrink-0', styles.dot)} />
        <div className={cn('w-0.5 flex-1 mt-1', styles.line)} />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {duration && <span>{duration}</span>}
            {timestamp && <span>{timestamp}</span>}
          </div>
        </div>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

function Timeline({ children, className }: TimelineProps) {
  return <div className={cn('relative', className)}>{children}</div>;
}

export { Timeline, TimelineItem };
export type { TimelineStatus };
