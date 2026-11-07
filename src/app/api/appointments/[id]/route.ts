import { trainerCanAccessClient } from '@/lib/trainer-access';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { createRemindersForAppointment } from '@/lib/reminders';

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
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

const editableScheduleStatuses: AppointmentStatus[] = [
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
    (role === UserRole.TRAINER && appointment.trainer.user.id === userId
      && await trainerCanAccessClient(userId, appointment.clientId)) ||
    role === UserRole.ADMIN;

  if (!isOwner) return { error: 'Forbidden', status: 403 };

  return { appointment };
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      workoutLog: {
        include: {
          workoutExercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: true, sets: { orderBy: { setIndex: 'asc' } } },
          },
        },
      },
      checkIns: { orderBy: { checkedInAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  return NextResponse.json(appointment);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getAppointmentContext(params.id, session.user.id, session.user.role as UserRole);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { cancellationReason, rescheduleReason, startsAt, endsAt } = parsed.data;
  const status = parsed.data.status ?? ctx.appointment.status;
  const hasScheduleChange = Boolean(startsAt || endsAt);

  // Role-based status restrictions
  if (status === AppointmentStatus.CONFIRMED && ctx.appointment.status !== AppointmentStatus.CONFIRMED && session.user.role === UserRole.CLIENT) {
    return NextResponse.json({ error: 'Only trainers can confirm appointments' }, { status: 403 });
  }

  if (hasScheduleChange && !editableScheduleStatuses.includes(ctx.appointment.status)) {
    return NextResponse.json({ error: 'Only pending, confirmed, or rescheduled appointments can be edited' }, { status: 409 });
  }

  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
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
      workoutLog: {
        include: {
          workoutExercises: {
            orderBy: { orderIndex: 'asc' },
            include: { exercise: true, sets: { orderBy: { setIndex: 'asc' } } },
          },
        },
      },
      checkIns: { orderBy: { checkedInAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (status === AppointmentStatus.CONFIRMED) {
    await createRemindersForAppointment(appointment.id);
  }

  await logAudit({
    actorId: session.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: hasScheduleChange ? 'appointment_schedule_edited' : `status_changed_to_${status}`,
    appointmentId: appointment.id,
    metadata: { status, cancellationReason, rescheduleReason, startsAt, endsAt },
  });

  return NextResponse.json(appointment);
}
