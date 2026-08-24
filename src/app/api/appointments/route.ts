import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const createSchema = z.object({
  clientId: z.string().cuid().optional(),
  trainerId: z.string().cuid().optional(),
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
  if (!session?.user || (session.user.role !== UserRole.CLIENT && session.user.role !== UserRole.TRAINER)) {
    return NextResponse.json({ error: 'Only clients and trainers can book appointments' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { clientId: requestedClientId, trainerId: requestedTrainerId, gymLocationId, startsAt, endsAt } = parsed.data;
  const startsAtDate = new Date(startsAt);
  const endsAtDate = new Date(endsAt);

  if (endsAtDate <= startsAtDate) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
  }

  let clientId: string;
  let trainerId: string;

  if (session.user.role === UserRole.CLIENT) {
    if (!requestedTrainerId) {
      return NextResponse.json({ error: 'Trainer is required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
    if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    clientId = client.id;
    trainerId = requestedTrainerId;
  } else {
    if (!requestedClientId) {
      return NextResponse.json({ error: 'Client is required' }, { status: 400 });
    }

    const trainer = await prisma.trainer.findUnique({ where: { userId: session.user.id } });
    if (!trainer) return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
    clientId = requestedClientId;
    trainerId = trainer.id;
  }

  const [client, trainer, gym] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, active: true } }),
    prisma.trainer.findFirst({ where: { id: trainerId, active: true } }),
    prisma.gymLocation.findFirst({ where: { id: gymLocationId, active: true } }),
  ]);

  if (!client) return NextResponse.json({ error: 'Client not found or inactive' }, { status: 404 });
  if (!trainer) return NextResponse.json({ error: 'Trainer not found or inactive' }, { status: 404 });
  if (!gym) return NextResponse.json({ error: 'Gym not found or inactive' }, { status: 404 });

  const overlap = await prisma.appointment.findFirst({
    where: {
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      OR: [
        {
          trainerId,
          startsAt: { lt: endsAtDate },
          endsAt: { gt: startsAtDate },
        },
        {
          clientId,
          startsAt: { lt: endsAtDate },
          endsAt: { gt: startsAtDate },
        },
      ],
    },
  });

  if (overlap) {
    return NextResponse.json({ error: 'Selected time slot is not available for this trainer or client' }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      trainerId,
      gymLocationId,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      status: session.user.role === UserRole.TRAINER ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
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
    metadata: { startsAt, endsAt, trainerId, clientId, gymLocationId, createdByRole: session.user.role },
  });

  return NextResponse.json(appointment, { status: 201 });
}
