import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let where: any = {};

  if (session.user.role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    where.clientId = client.id;
  } else if (session.user.role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({ where: { userId: session.user.id } });
    if (!trainer) return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    where.trainerId = trainer.id;
  }

  const [total, completed, cancelled, noShow, upcoming, workoutBreakdown, trainerUtilization] =
    await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
      prisma.appointment.count({
        where: { ...where, status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] }, startsAt: { gte: now } },
      }),
      prisma.workoutLog.groupBy({
        by: ['workoutType'],
        where: {
          appointment: where,
        },
        _count: { workoutType: true },
      }),
      session.user.role === UserRole.ADMIN
        ? prisma.appointment.groupBy({
            by: ['trainerId'],
            where: { startsAt: { gte: monthStart, lte: monthEnd } },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  let trainerUtilizationData: any[] = [];
  if (session.user.role === UserRole.ADMIN && trainerUtilization.length > 0) {
    const trainers = await prisma.trainer.findMany({
      where: { id: { in: trainerUtilization.map((t) => t.trainerId) } },
      include: { user: { select: { name: true } } },
    });
    const completedByTrainer = await prisma.appointment.groupBy({
      by: ['trainerId'],
      where: { status: AppointmentStatus.COMPLETED, startsAt: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
    });

    trainerUtilizationData = trainerUtilization.map((t) => ({
      trainerId: t.trainerId,
      trainerName: trainers.find((tr) => tr.id === t.trainerId)?.user.name || 'Unknown',
      totalSessions: t._count.id,
      completedSessions:
        completedByTrainer.find((c) => c.trainerId === t.trainerId)?._count.id || 0,
    }));
  }

  return NextResponse.json({
    stats: {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      upcomingAppointments: upcoming,
      completionRate,
      noShowRate,
    },
    workoutBreakdown: workoutBreakdown.map((w) => ({
      type: w.workoutType,
      count: w._count.workoutType,
    })),
    trainerUtilization: trainerUtilizationData,
  });
}
