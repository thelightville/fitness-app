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
    style: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
    label: 'Pending',
  },
  CONFIRMED: {
    style: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: CheckCircle2,
    label: 'Confirmed',
  },
  CANCELLED: {
    style: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: XCircle,
    label: 'Cancelled',
  },
  RESCHEDULED: {
    style: 'bg-purple-50 text-purple-700 ring-purple-200',
    icon: CalendarClock,
    label: 'Rescheduled',
  },
  CHECKED_IN: {
    style: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: MapPinCheck,
    label: 'Checked In',
  },
  COMPLETED: {
    style: 'bg-primary-50 text-primary-700 ring-primary-200',
    icon: Trophy,
    label: 'Completed',
  },
  NO_SHOW: {
    style: 'bg-red-50 text-red-700 ring-red-200',
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
