import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { createRemindersForAppointment } from '@/lib/reminders';
import { cancellableStatuses, getMobileAppointmentContext, mobileAppointmentInclude } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  cancellationReason: z.string().optional(),
  rescheduleReason: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const editableScheduleStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.RESCHEDULED,
];

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { cancellationReason, rescheduleReason, startsAt, endsAt } = parsed.data;
  const status = parsed.data.status ?? ctx.appointment.status;
  const hasScheduleChange = Boolean(startsAt || endsAt);

  if (status === AppointmentStatus.CONFIRMED && ctx.appointment.status !== AppointmentStatus.CONFIRMED && auth.user.role === 'CLIENT') {
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
  if (status === AppointmentStatus.NO_SHOW && auth.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Only trainers can mark no-shows' }, { status: 403 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status,
      ...(cancellationReason ? { cancellationReason } : {}),
      ...(rescheduleReason ? { rescheduleReason } : {}),
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
    },
    include: mobileAppointmentInclude,
  });

  if (status === AppointmentStatus.CONFIRMED) {
    await createRemindersForAppointment(appointment.id);
  }

  await logAudit({
    actorId: auth.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: hasScheduleChange ? 'mobile_appointment_schedule_edited' : `mobile_status_changed_to_${status}`,
    appointmentId: appointment.id,
    metadata: { status, cancellationReason, rescheduleReason, startsAt, endsAt },
  });

  return NextResponse.json(appointment);
}