import * as React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, variant = 'text', width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className,
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export { Skeleton };
