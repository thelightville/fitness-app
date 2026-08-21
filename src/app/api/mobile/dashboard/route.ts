import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getMobileAppointmentWhere, mobileAppointmentInclude } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where = await getMobileAppointmentWhere(auth.user);
  if (!where) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const now = new Date();
  const [total, completed, cancelled, noShow, upcoming, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
    prisma.appointment.count({ where: { ...where, status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED] }, startsAt: { gte: now } } }),
    prisma.appointment.findMany({
      where: { ...where, status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] } },
      orderBy: { startsAt: 'desc' },
      take: 5,
      include: mobileAppointmentInclude,
    }),
  ]);

  return NextResponse.json({
    user: auth.user,
    stats: {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      upcomingAppointments: upcoming,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
    },
    appointments,
  });
}