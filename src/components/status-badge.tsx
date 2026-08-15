import { AppointmentStatus } from '@prisma/client';

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-purple-100 text-purple-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-primary-100 text-primary-800',
  NO_SHOW: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`badge ${statusStyles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
