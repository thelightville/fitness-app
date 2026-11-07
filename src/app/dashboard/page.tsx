import { assignedClient } from '@/lib/trainer-access';
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
import TrainerProgressForm from '@/components/dashboard/trainer-progress-form';
import { CalendarDays, CheckCircle2, TrendingUp, UserX, Clock, MapPin, ArrowRight, Dumbbell } from 'lucide-react';

type TrainerProgressSession = {
  id: string;
  clientId: string;
  client: { user: { name: string | null; email: string } };
};

async function loadTrainerClientProgress(trainerUserId: string, sessions: TrainerProgressSession[]) {
  const clients = new Map<string, { clientId: string; appointmentId: string; name: string }>();
  for (const session of sessions.slice(0, 5)) {
    if (typeof session.clientId !== 'string' || !session.clientId || typeof session.id !== 'string' || !session.id) continue;
    if (!clients.has(session.clientId)) {
      clients.set(session.clientId, {
        clientId: session.clientId,
        appointmentId: session.id,
        name: session.client?.user?.name || session.client?.user?.email || 'Client',
      });
    }
  }
  return Promise.all(Array.from(clients.values()).map(async (client) => {
    try {
      const measurement = await prisma.measurement.findFirst({
        where: {
          clientId: client.clientId,
          client: assignedClient(trainerUserId),
        },
        orderBy: { measuredAt: 'desc' },
        select: { measuredAt: true, weightKg: true, bodyFatPct: true, waistCm: true },
      });
      return { ...client, measurement, unavailable: false };
    } catch {
      return { ...client, measurement: null, unavailable: true };
    }
  }));
}

function renderTrainerProgress(progress: Awaited<ReturnType<typeof loadTrainerClientProgress>>) {
  const metric = (value: number | null | undefined, unit: string) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value} ${unit}` : 'Not recorded';
  const recordedAt = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'MMM d, yyyy');
  };
  return (
    <section className="card" aria-labelledby="trainer-progress-heading">
      <h2 id="trainer-progress-heading" className="section-title">Recent client progress</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Latest measurements for clients in your five most recent listed sessions.
      </p>
      {progress.length === 0 && <p className="mt-4 text-sm">No clients in your recent sessions.</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {progress.map((client) => (
          <article key={client.clientId} className="rounded-xl border border-brand-line p-4 dark:border-white/10">
            <h3 className="font-semibold">{client.name}</h3>
            {client.unavailable ? (
              <p className="mt-2 text-sm" role="status">Progress is temporarily unavailable. Your session details are still available.</p>
            ) : client.measurement ? (
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <dt>Last recorded</dt><dd>{recordedAt(client.measurement.measuredAt)}</dd>
                <dt>Weight</dt><dd>{metric(client.measurement.weightKg, 'kg')}</dd>
                <dt>Body fat</dt><dd>{metric(client.measurement.bodyFatPct, '%')}</dd>
                <dt>Waist</dt><dd>{metric(client.measurement.waistCm, 'cm')}</dd>
              </dl>
            ) : <p className="mt-2 text-sm">No measurements recorded.</p>}
            <Link href={`/dashboard/appointments/${encodeURIComponent(client.appointmentId)}`}
              className="mt-3 inline-flex text-sm font-semibold text-flame-600 dark:text-flame-300">
              Open session
            </Link>
            <TrainerProgressForm clientId={client.clientId} />
          </article>
        ))}
      </div>
    </section>
  );
}

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
    where.client = assignedClient(userId);
  }

  const [stats, dashboardAppointments, recent] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.appointment.findMany({
      where: {
        ...where,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
      orderBy: { startsAt: 'desc' },
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

  const trainerClientProgress = role === UserRole.TRAINER
    ? await loadTrainerClientProgress(userId, dashboardAppointments)
    : [];

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
    dashboardAppointments,
    recent,
    trainerClientProgress,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getDashboardData(session.user.id, session.user.role as UserRole);
  if (!data) redirect('/login');

  const isClient = session.user.role === UserRole.CLIENT;
  const isTrainer = session.user.role === UserRole.TRAINER;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={isTrainer ? 'Trainer dashboard' : 'Dashboard'}
        subtitle={isTrainer
          ? `Welcome back, ${session.user.name || session.user.email}. Manage your training sessions and appointments.`
          : `Welcome back, ${session.user.name || session.user.email}`}
        action={
          <Link href="/dashboard/appointments" className="btn-secondary">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {isTrainer ? 'Manage training sessions' : 'Manage appointments'}
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
          color="flame"
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
              {isTrainer ? 'Your training sessions' : 'Appointments'}
            </h2>
            <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm font-black text-flame-600 hover:text-flame-500 dark:text-flame-300">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.dashboardAppointments.length === 0 && (
              <EmptyState
                icon={CalendarDays}
                title="No appointments found"
                description="Appointments assigned to you will appear here."
              />
            )}
            {data.dashboardAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/dashboard/appointments/${appt.id}`}
                className="group flex items-center justify-between rounded-xl border border-brand-line bg-brand-paper/70 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-300/40 dark:hover:bg-primary-300/10"
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
                className="rounded-xl border border-brand-line bg-brand-paper/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
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
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-black text-ink-900 ring-1 ring-primary-200 dark:bg-primary-300 dark:text-ink-900">
                    <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                    {appt.workoutLog.workoutType} Â· {appt.workoutLog.durationMinutes} min
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {isTrainer && renderTrainerProgress(data.trainerClientProgress)}
    </div>
  );
}
