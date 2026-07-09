import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label rendered above the input */
  label?: string;
  /** Error message rendered below the input (replaces helperText) */
  error?: string;
  /** Helper text rendered below the input */
  helperText?: string;
  /** Icon element rendered inside the input on the left */
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'text-slate-900 placeholder:text-slate-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500',
              leftIcon && 'pl-10',
              error
                ? 'border-red-500 focus:ring-red-500/30 dark:border-red-500'
                : 'border-slate-200 focus:border-[#0052FF] focus:ring-[#0052FF]/30 dark:border-slate-800 dark:focus:border-[#336BFF] dark:focus:ring-[#336BFF]/30',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
