import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { haversineDistance } from '@/lib/geo';
import { logAudit } from '@/lib/audit';

const checkInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  manual: z.boolean().default(false),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { latitude, longitude, manual, reason } = parsed.data;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { user: { select: { id: true, name: true, email: true } } } },
      trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
      gymLocation: true,
    },
  });

  if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const isClient = session.user.role === UserRole.CLIENT && appointment.client.user.id === session.user.id;
  const isTrainerOrAdmin = session.user.role === UserRole.TRAINER || session.user.role === UserRole.ADMIN;

  if (!isClient && !isTrainerOrAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (manual && !isTrainerOrAdmin) {
    return NextResponse.json({ error: 'Only trainers or admins can manually check in a client' }, { status: 403 });
  }

  let distanceMeters = 0;
  let verified = false;

  if (manual) {
    verified = true;
    distanceMeters = -1;
  } else {
    distanceMeters = haversineDistance(
      latitude,
      longitude,
      appointment.gymLocation.latitude,
      appointment.gymLocation.longitude
    );
    verified = distanceMeters <= appointment.gymLocation.checkInRadiusMeters;
  }

  const checkIn = await prisma.appointmentCheckIn.create({
    data: {
      appointmentId: appointment.id,
      userId: session.user.id,
      latitude: manual ? appointment.gymLocation.latitude : latitude,
      longitude: manual ? appointment.gymLocation.longitude : longitude,
      distanceMeters,
      verified,
      deviceInfo: req.headers.get('user-agent') || undefined,
    },
  });

  if (verified) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CHECKED_IN },
    });
  }

  await logAudit({
    actorId: session.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: manual ? 'manual_check_in' : 'client_check_in',
    appointmentId: appointment.id,
    metadata: { verified, distanceMeters, manual, reason },
  });

  return NextResponse.json({ checkIn, verified, distanceMeters });
}
