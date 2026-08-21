import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireMobileAuth } from '@/lib/mobile-auth';

async function resolveClientId(userId: string, role: UserRole, requestedClientId: string | null) {
  if (role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({ where: { userId }, select: { id: true } });
    if (!client) return null;
    return client.id;
  }

  if (!requestedClientId) return null;
  if (role === UserRole.ADMIN) return requestedClientId;

  const trainer = await prisma.trainer.findUnique({ where: { userId }, select: { id: true } });
  if (!trainer) return null;

  const sharedAppointment = await prisma.appointment.findFirst({
    where: { clientId: requestedClientId, trainerId: trainer.id },
    select: { id: true },
  });

  return sharedAppointment ? requestedClientId : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = await resolveClientId(auth.user.id, auth.user.role, searchParams.get('clientId'));
  if (!clientId) return NextResponse.json({ error: 'Client profile not found or forbidden' }, { status: 404 });

  const [client, measurements, workoutLogs] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.measurement.findMany({ where: { clientId }, orderBy: { measuredAt: 'desc' }, take: 20 }),
    prisma.workoutLog.findMany({
      where: { appointment: { clientId } },
      orderBy: { completedAt: 'desc' },
      take: 20,
      include: {
        appointment: {
          include: {
            trainer: { include: { user: { select: { name: true, email: true } } } },
            gymLocation: true,
          },
        },
      },
    }),
  ]);

  if (!client) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

  return NextResponse.json({
    client: { id: client.id, name: client.user.name, email: client.user.email },
    latestMeasurement: measurements[0] ?? null,
    measurements,
    workoutLogs,
  });
}