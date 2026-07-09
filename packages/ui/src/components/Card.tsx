import * as React from 'react';
import { cn } from '../lib/utils';

// ── Card Root ───────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Apply glassmorphism effect (backdrop-blur + translucent bg) */
  glass?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
        glass && [
          'border-white/20 bg-white/60 backdrop-blur-xl',
          'dark:border-slate-700/40 dark:bg-slate-900/60',
        ],
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ── Card Header ─────────────────────────────────────────────────────────────

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// ── Card Title ──────────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

// ── Card Description ────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// ── Card Content ────────────────────────────────────────────────────────────

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// ── Card Footer ─────────────────────────────────────────────────────────────

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
