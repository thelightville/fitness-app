import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';

async function getDashboardData(userId: string, role: UserRole) {
  let where: any = {};

  if (role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) return null;
    where.clientId = client.id;
  } else if (role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) return null;
    where.trainerId = trainer.id;
  }

  const now = new Date();

  const [stats, upcoming, recent] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.appointment.findMany({
      where: {
        ...where,
        startsAt: { gte: now },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
      orderBy: { startsAt: 'asc' },
      take: 5,
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        trainer: { include: { user: { select: { name: true, email: true } } } },
        gymLocation: true,
      },
    }),
    prisma.appointment.findMany({
      where: { ...where, status: AppointmentStatus.COMPLETED },
      orderBy: { startsAt: 'desc' },
      take: 5,
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        trainer: { include: { user: { select: { name: true, email: true } } } },
        workoutLog: true,
      },
    }),
  ]);

  const total = stats.reduce((sum, s) => sum + s._count.status, 0);
  const completed = stats.find((s) => s.status === AppointmentStatus.COMPLETED)?._count.status || 0;
  const cancelled = stats.find((s) => s.status === AppointmentStatus.CANCELLED)?._count.status || 0;
  const noShow = stats.find((s) => s.status === AppointmentStatus.NO_SHOW)?._count.status || 0;

  return {
    total,
    completed,
    cancelled,
    noShow,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    upcoming,
    recent,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getDashboardData(session.user.id, session.user.role as UserRole);
  if (!data) redirect('/login');

  const isClient = session.user.role === UserRole.CLIENT;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Sessions</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.total}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-primary-600">{data.completed}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.completionRate}%</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">No-Shows</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{data.noShow}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link href="/dashboard/appointments" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {data.upcoming.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming appointments.</p>
            )}
            {data.upcoming.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(appt.startsAt), 'EEEE, MMMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isClient
                      ? `Trainer: ${appt.trainer.user.name || appt.trainer.user.email}`
                      : `Client: ${appt.client.user.name || appt.client.user.email}`}
                  </p>
                  <p className="text-sm text-gray-500">{appt.gymLocation.name}</p>
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Recent Completed Sessions</h2>
          <div className="mt-4 space-y-4">
            {data.recent.length === 0 && (
              <p className="text-sm text-gray-500">No completed sessions yet.</p>
            )}
            {data.recent.map((appt) => (
              <div key={appt.id} className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-900">
                  {format(new Date(appt.startsAt), 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  {isClient
                    ? `Trainer: ${appt.trainer.user.name || appt.trainer.user.email}`
                    : `Client: ${appt.client.user.name || appt.client.user.email}`}
                </p>
                {appt.workoutLog && (
                  <p className="text-sm text-gray-500">
                    {appt.workoutLog.workoutType} · {appt.workoutLog.durationMinutes} min
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
