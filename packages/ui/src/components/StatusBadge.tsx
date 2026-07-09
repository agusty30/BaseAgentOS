import * as React from 'react';
import {
  Lightbulb,
  Clock,
  Loader2,
  AlertTriangle,
  FlaskConical,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
} from 'lucide-react';
import { Badge, type BadgeProps } from './Badge';
import { cn } from '../lib/utils';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

type MissionStatus =
  | 'planning'
  | 'queued'
  | 'running'
  | 'waiting_confirmation'
  | 'simulation'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

interface StatusConfig {
  variant: BadgeVariant;
  icon: React.ElementType;
  label: string;
  spinning?: boolean;
}

const statusMap: Record<MissionStatus, StatusConfig> = {
  planning: { variant: 'info', icon: Lightbulb, label: 'Planning' },
  queued: { variant: 'pending', icon: Clock, label: 'Queued' },
  running: { variant: 'info', icon: Loader2, label: 'Running', spinning: true },
  waiting_confirmation: {
    variant: 'warning',
    icon: AlertTriangle,
    label: 'Awaiting Confirmation',
  },
  simulation: { variant: 'info', icon: FlaskConical, label: 'Simulating' },
  executing: { variant: 'info', icon: Zap, label: 'Executing' },
  completed: { variant: 'success', icon: CheckCircle2, label: 'Completed' },
  failed: { variant: 'error', icon: XCircle, label: 'Failed' },
  retrying: { variant: 'warning', icon: RefreshCw, label: 'Retrying' },
  cancelled: { variant: 'default', icon: Ban, label: 'Cancelled' },
};

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: MissionStatus;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const config = statusMap[status];
    const Icon = config.icon;

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={cn('gap-1', className)}
        {...props}
      >
        <Icon
          className={cn('h-3.5 w-3.5', config.spinning && 'animate-spin')}
          aria-hidden="true"
        />
        {config.label}
      </Badge>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
