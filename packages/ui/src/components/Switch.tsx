import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-brand data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
            'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
          )}
        />
      </SwitchPrimitive.Root>
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    </div>
  ),
);
Switch.displayName = 'Switch';

export { Switch };
