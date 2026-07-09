import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
    'text-xs font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-slate-100 text-slate-700',
          'dark:bg-slate-800 dark:text-slate-300',
        ].join(' '),
        success: [
          'bg-green-50 text-green-700',
          'dark:bg-green-950 dark:text-green-400',
        ].join(' '),
        warning: [
          'bg-amber-50 text-amber-700',
          'dark:bg-amber-950 dark:text-amber-400',
        ].join(' '),
        error: [
          'bg-red-50 text-red-700',
          'dark:bg-red-950 dark:text-red-400',
        ].join(' '),
        info: [
          'bg-blue-50 text-blue-700',
          'dark:bg-blue-950 dark:text-blue-400',
        ].join(' '),
        pending: [
          'bg-slate-50 text-slate-600',
          'dark:bg-slate-800/60 dark:text-slate-400',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const dotColorMap: Record<string, string> = {
  default: 'bg-slate-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  pending: 'bg-slate-400',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a small colored dot indicator before the text */
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
            dotColorMap[variant ?? 'default'],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
