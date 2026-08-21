import { AppointmentStatus, UserRole } from '@prisma/client';
import { prisma } from './db';
import type { MobileUser } from './mobile-auth';

export const mobileAppointmentInclude = {
  client: { include: { user: { select: { name: true, email: true } } } },
  trainer: { include: { user: { select: { name: true, email: true } } } },
  gymLocation: true,
  workoutLog: true,
  checkIns: { orderBy: { checkedInAt: 'desc' as const }, take: 1 },
};

/** Builds the Prisma appointment filter for the current mobile user's role. */
export async function getMobileAppointmentWhere(user: MobileUser) {
  const where: any = {};

  if (user.role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({ where: { userId: user.id } });
    if (!client) return null;
    where.clientId = client.id;
  } else if (user.role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({ where: { userId: user.id } });
    if (!trainer) return null;
    where.trainerId = trainer.id;
  }

  return where;
}

/** Checks whether the current mobile user can access the appointment. */
export async function getMobileAppointmentContext(id: string, user: MobileUser) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { id: true } } } },
      trainer: { include: { user: { select: { id: true } } } },
    },
  });

  if (!appointment) return { error: 'Appointment not found', status: 404 as const };

  const isOwner =
    (user.role === UserRole.CLIENT && appointment.client.user.id === user.id) ||
    (user.role === UserRole.TRAINER && appointment.trainer.user.id === user.id) ||
    user.role === UserRole.ADMIN;

  if (!isOwner) return { error: 'Forbidden', status: 403 as const };
  return { appointment };
}

export const cancellableStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.RESCHEDULED,
];