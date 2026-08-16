import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const createSchema = z.object({
  trainerId: z.string().cuid(),
  gymLocationId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as AppointmentStatus | null;
  const limit = Number(searchParams.get('limit')) || 50;

  const where: any = {};

  if (session.user.role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    where.clientId = client.id;
  } else if (session.user.role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({ where: { userId: session.user.id } });
    if (!trainer) return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    where.trainerId = trainer.id;
  }

  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    take: limit,
    orderBy: { startsAt: 'desc' },
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
      workoutLog: true,
      checkIns: { orderBy: { checkedInAt: 'desc' }, take: 1 },
    },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CLIENT) {
    return NextResponse.json({ error: 'Only clients can book appointments' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { trainerId, gymLocationId, startsAt, endsAt } = parsed.data;

  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

  // Check for overlapping appointments with the same trainer
  const overlap = await prisma.appointment.findFirst({
    where: {
      trainerId,
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      OR: [
        { startsAt: { lt: new Date(endsAt) }, endsAt: { gt: new Date(startsAt) } },
      ],
    },
  });

  if (overlap) {
    return NextResponse.json({ error: 'Selected time slot is not available' }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId: client.id,
      trainerId,
      gymLocationId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      status: AppointmentStatus.PENDING,
    },
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
    },
  });

  await logAudit({
    actorId: session.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'created',
    appointmentId: appointment.id,
    metadata: { startsAt, endsAt, trainerId, gymLocationId },
  });

  return NextResponse.json(appointment, { status: 201 });
}
