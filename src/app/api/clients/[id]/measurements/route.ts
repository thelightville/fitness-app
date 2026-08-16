import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const measurementSchema = z.object({
  weightKg: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  waistCm: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  armsCm: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  measuredAt: z.string().datetime().optional(),
});

async function canAccessClient(session: any, clientId: string) {
  if (!session?.user) return false;
  if (session.user.role === UserRole.ADMIN) return true;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });
  if (!client) return false;

  if (session.user.role === UserRole.CLIENT && client.userId === session.user.id) {
    return true;
  }

  if (session.user.role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!trainer) return false;

    const sharedAppointment = await prisma.appointment.findFirst({
      where: { clientId, trainerId: trainer.id },
      select: { id: true },
    });
    return !!sharedAppointment;
  }

  return false;
}

async function canManageClient(session: any, clientId: string) {
  if (!session?.user) return false;
  if (session.user.role === UserRole.ADMIN) return true;

  if (session.user.role === UserRole.TRAINER) {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!trainer) return false;

    const sharedAppointment = await prisma.appointment.findFirst({
      where: { clientId, trainerId: trainer.id },
      select: { id: true },
    });
    return !!sharedAppointment;
  }

  return false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const clientId = params.id;

  if (!(await canAccessClient(session, clientId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const measurements = await prisma.measurement.findMany({
    where: { clientId },
    orderBy: { measuredAt: 'desc' },
  });

  return NextResponse.json(measurements);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const clientId = params.id;

  if (!(await canManageClient(session, clientId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = measurementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const measurement = await prisma.measurement.create({
    data: {
      clientId,
      weightKg: parsed.data.weightKg,
      bodyFatPct: parsed.data.bodyFatPct,
      waistCm: parsed.data.waistCm,
      chestCm: parsed.data.chestCm,
      armsCm: parsed.data.armsCm,
      notes: parsed.data.notes,
      measuredAt: parsed.data.measuredAt
        ? new Date(parsed.data.measuredAt)
        : new Date(),
    },
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'measurement',
    entityId: measurement.id,
    action: 'created',
    metadata: { clientId, fields: Object.keys(parsed.data) },
  });

  return NextResponse.json(measurement, { status: 201 });
}
