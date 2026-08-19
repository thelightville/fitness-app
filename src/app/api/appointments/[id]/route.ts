import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { createRemindersForAppointment } from '@/lib/reminders';

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  cancellationReason: z.string().optional(),
  rescheduleReason: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const cancellableStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.RESCHEDULED,
];

async function getAppointmentContext(id: string, userId: string, role: UserRole) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { id: true, name: true, email: true } } } },
      trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!appointment) return { error: 'Appointment not found', status: 404 };

  const isOwner =
    (role === UserRole.CLIENT && appointment.client.user.id === userId) ||
    (role === UserRole.TRAINER && appointment.trainer.user.id === userId) ||
    role === UserRole.ADMIN;

  if (!isOwner) return { error: 'Forbidden', status: 403 };

  return { appointment };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getAppointmentContext(params.id, session.user.id, session.user.role as UserRole);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
      workoutLog: true,
      checkIns: { orderBy: { checkedInAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  return NextResponse.json(appointment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getAppointmentContext(params.id, session.user.id, session.user.role as UserRole);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { status, cancellationReason, rescheduleReason, startsAt, endsAt } = parsed.data;

  // Role-based status restrictions
  if (status === AppointmentStatus.CONFIRMED && session.user.role === UserRole.CLIENT) {
    return NextResponse.json({ error: 'Only trainers can confirm appointments' }, { status: 403 });
  }

  if (status === AppointmentStatus.CANCELLED && !cancellableStatuses.includes(ctx.appointment.status)) {
    return NextResponse.json({ error: 'Only pending, confirmed, or rescheduled appointments can be cancelled' }, { status: 409 });
  }

  if (status === AppointmentStatus.NO_SHOW && session.user.role === UserRole.CLIENT) {
    return NextResponse.json({ error: 'Only trainers can mark no-shows' }, { status: 403 });
  }

  const data: any = { status };
  if (cancellationReason) data.cancellationReason = cancellationReason;
  if (rescheduleReason) data.rescheduleReason = rescheduleReason;
  if (startsAt) data.startsAt = new Date(startsAt);
  if (endsAt) data.endsAt = new Date(endsAt);

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data,
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
    },
  });
  if (status === AppointmentStatus.CONFIRMED) {
    await createRemindersForAppointment(appointment.id);
  }

  await logAudit({
    actorId: session.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: `status_changed_to_${status}`,
    appointmentId: appointment.id,
    metadata: { status, cancellationReason, rescheduleReason, startsAt, endsAt },
  });

  return NextResponse.json(appointment);
}
