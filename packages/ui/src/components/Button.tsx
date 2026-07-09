import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-medium transition-colors',
    'duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'dark:focus-visible:ring-offset-neutral-900',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[#0052FF] text-white shadow-sm',
          'hover:bg-[#0042CC]',
          'focus-visible:ring-[#0052FF]',
          'dark:bg-[#336BFF] dark:hover:bg-[#0052FF]',
        ].join(' '),
        secondary: [
          'bg-slate-100 text-slate-900 shadow-sm',
          'hover:bg-slate-200',
          'focus-visible:ring-slate-400',
          'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        ].join(' '),
        outline: [
          'border border-slate-200 bg-transparent text-slate-900 shadow-sm',
          'hover:bg-slate-50',
          'focus-visible:ring-slate-400',
          'dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
        ].join(' '),
        ghost: [
          'bg-transparent text-slate-900',
          'hover:bg-slate-100',
          'focus-visible:ring-slate-400',
          'dark:text-slate-100 dark:hover:bg-slate-800',
        ].join(' '),
        destructive: [
          'bg-red-500 text-white shadow-sm',
          'hover:bg-red-600',
          'focus-visible:ring-red-500',
          'dark:bg-red-600 dark:hover:bg-red-700',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component via Radix Slot */
  asChild?: boolean;
  /** Show a loading spinner and disable the button */
  loading?: boolean;
  /** Icon element rendered before children */
  leftIcon?: React.ReactNode;
  /** Icon element rendered after children */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
