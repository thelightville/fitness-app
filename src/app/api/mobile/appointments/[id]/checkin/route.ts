import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { haversineDistance } from '@/lib/geo';
import { getMobileAppointmentContext } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

const checkInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  manual: z.boolean().default(false),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { gymLocation: true },
  });
  if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const { latitude, longitude, manual, reason } = parsed.data;
  if (manual && auth.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Only trainers or admins can manually check in a client' }, { status: 403 });
  }

  const distanceMeters = manual
    ? -1
    : haversineDistance(latitude, longitude, appointment.gymLocation.latitude, appointment.gymLocation.longitude);
  const verified = manual || distanceMeters <= appointment.gymLocation.checkInRadiusMeters;

  const checkIn = await prisma.appointmentCheckIn.create({
    data: {
      appointmentId: appointment.id,
      userId: auth.user.id,
      latitude: manual ? appointment.gymLocation.latitude : latitude,
      longitude: manual ? appointment.gymLocation.longitude : longitude,
      distanceMeters,
      verified,
      deviceInfo: req.headers.get('user-agent') || undefined,
    },
  });

  if (verified) {
    await prisma.appointment.update({ where: { id: appointment.id }, data: { status: AppointmentStatus.CHECKED_IN } });
  }

  await logAudit({
    actorId: auth.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: manual ? 'mobile_manual_check_in' : 'mobile_check_in',
    appointmentId: appointment.id,
    metadata: { verified, distanceMeters, manual, reason },
  });

  return NextResponse.json({ checkIn, verified, distanceMeters });
}