import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays, CheckCircle2, TrendingUp, UserX, Clock, MapPin } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${session.user.name || session.user.email}`}
        action={
          <Link href="/dashboard/appointments" className="btn-secondary">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Manage appointments
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sessions"
          value={data.total}
          icon={CalendarDays}
          color="slate"
        />
        <StatCard
          label="Completed"
          value={data.completed}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="No-Shows"
          value={data.noShow}
          icon={UserX}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Upcoming Appointments
            </h2>
            <Link href="/dashboard/appointments" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.upcoming.length === 0 && (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Your schedule is clear. Book a new session to get started."
              />
            )}
            {data.upcoming.map((appt) => (
              <Link
                key={appt.id}
                href={`/dashboard/appointments/${appt.id}`}
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary-900 dark:hover:bg-primary-900/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-400">
                    {format(new Date(appt.startsAt), 'EEEE, MMMM d, yyyy h:mm a')}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                    {isClient
                      ? `Trainer: ${appt.trainer.user.name || appt.trainer.user.email}`
                      : `Client: ${appt.client.user.name || appt.client.user.email}`}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {appt.gymLocation.name}
                  </p>
                </div>
                <StatusBadge status={appt.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Recent Completed Sessions
          </h2>
          <div className="mt-4 space-y-3">
            {data.recent.length === 0 && (
              <EmptyState
                icon={CheckCircle2}
                title="No completed sessions yet"
                description="Completed sessions will appear here once trainers log workouts."
              />
            )}
            {data.recent.map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {format(new Date(appt.startsAt), 'MMMM d, yyyy')}
                </p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  {isClient
                    ? `Trainer: ${appt.trainer.user.name || appt.trainer.user.email}`
                    : `Client: ${appt.client.user.name || appt.client.user.email}`}
                </p>
                {appt.workoutLog && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
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
