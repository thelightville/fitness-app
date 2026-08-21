import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { createRemindersForAppointment } from '@/lib/reminders';
import { cancellableStatuses, getMobileAppointmentContext, mobileAppointmentInclude } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  cancellationReason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { status, cancellationReason } = parsed.data;
  if (status === AppointmentStatus.CONFIRMED && auth.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Only trainers can confirm appointments' }, { status: 403 });
  }
  if (status === AppointmentStatus.CANCELLED && !cancellableStatuses.includes(ctx.appointment.status)) {
    return NextResponse.json({ error: 'Only pending, confirmed, or rescheduled appointments can be cancelled' }, { status: 409 });
  }
  if (status === AppointmentStatus.NO_SHOW && auth.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Only trainers can mark no-shows' }, { status: 403 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status, ...(cancellationReason ? { cancellationReason } : {}) },
    include: mobileAppointmentInclude,
  });

  if (status === AppointmentStatus.CONFIRMED) {
    await createRemindersForAppointment(appointment.id);
  }

  await logAudit({
    actorId: auth.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: `mobile_status_changed_to_${status}`,
    appointmentId: appointment.id,
    metadata: { status, cancellationReason },
  });

  return NextResponse.json(appointment);
}