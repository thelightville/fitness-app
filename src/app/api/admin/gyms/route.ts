import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const createSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  checkInRadiusMeters: z.number().min(10).max(2000).default(150),
  active: z.boolean().optional().default(true),
});

function requireAdmin(session: any) {
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const gyms = await prisma.gymLocation.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(gyms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const gym = await prisma.gymLocation.create({
    data: parsed.data,
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'gym',
    entityId: gym.id,
    action: 'created',
    metadata: { name: gym.name, address: gym.address },
  });

  return NextResponse.json(gym, { status: 201 });
}
