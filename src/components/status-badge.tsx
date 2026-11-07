import { AppointmentStatus } from '@prisma/client';
import {
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  MapPinCheck,
  Trophy,
  UserX,
  HelpCircle,
} from 'lucide-react';

const statusConfig: Record<AppointmentStatus, { style: string; icon: typeof HelpCircle; label: string }> = {
  PENDING: {
    style: 'bg-flame-100 text-flame-600 ring-flame-300 dark:bg-flame-500/15 dark:text-flame-300 dark:ring-flame-300/20',
    icon: Clock,
    label: 'Pending',
  },
  CONFIRMED: {
    style: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-400/15 dark:text-cyan-200 dark:ring-cyan-300/20',
    icon: CheckCircle2,
    label: 'Confirmed',
  },
  CANCELLED: {
    style: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10',
    icon: XCircle,
    label: 'Cancelled',
  },
  RESCHEDULED: {
    style: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-400/15 dark:text-orange-200 dark:ring-orange-300/20',
    icon: CalendarClock,
    label: 'Rescheduled',
  },
  CHECKED_IN: {
    style: 'bg-primary-100 text-ink-900 ring-primary-200 dark:bg-primary-300 dark:text-ink-900 dark:ring-primary-200',
    icon: MapPinCheck,
    label: 'Checked In',
  },
  COMPLETED: {
    style: 'bg-primary-100 text-ink-900 ring-primary-200 dark:bg-primary-300 dark:text-ink-900 dark:ring-primary-200',
    icon: Trophy,
    label: 'Completed',
  },
  NO_SHOW: {
    style: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    icon: UserX,
    label: 'No Show',
  },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  return (
    <span className={`badge ring-1 ${config.style}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
