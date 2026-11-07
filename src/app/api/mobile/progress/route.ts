import { trainerCanAccessClient } from '@/lib/trainer-access';
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

  return await trainerCanAccessClient(userId, requestedClientId) ? requestedClientId : null;
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
      where: { appointment: { clientId, ...(auth.user.role === UserRole.TRAINER ? { trainer: { userId: auth.user.id } } : {}) } },
      orderBy: { completedAt: 'desc' },
      take: 20,
      include: {
        workoutExercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true, sets: { orderBy: { setIndex: 'asc' } } },
        },
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