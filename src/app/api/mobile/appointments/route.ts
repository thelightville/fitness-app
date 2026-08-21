import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getMobileAppointmentWhere, mobileAppointmentInclude } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

const createSchema = z.object({
  trainerId: z.string().cuid(),
  gymLocationId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where = await getMobileAppointmentWhere(auth.user);
  if (!where) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit')) || 50;
  const status = searchParams.get('status') as AppointmentStatus | null;
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    take: limit,
    orderBy: { startsAt: 'desc' },
    include: mobileAppointmentInclude,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'CLIENT') return NextResponse.json({ error: 'Only clients can book appointments' }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { userId: auth.user.id } });
  if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

  const { trainerId, gymLocationId, startsAt, endsAt } = parsed.data;
  const overlap = await prisma.appointment.findFirst({
    where: {
      trainerId,
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      OR: [{ startsAt: { lt: new Date(endsAt) }, endsAt: { gt: new Date(startsAt) } }],
    },
  });

  if (overlap) return NextResponse.json({ error: 'Selected time slot is not available' }, { status: 409 });

  const appointment = await prisma.appointment.create({
    data: { clientId: client.id, trainerId, gymLocationId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), status: AppointmentStatus.PENDING },
    include: mobileAppointmentInclude,
  });

  await logAudit({
    actorId: auth.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'mobile_created',
    appointmentId: appointment.id,
    metadata: { startsAt, endsAt, trainerId, gymLocationId },
  });

  return NextResponse.json(appointment, { status: 201 });
}