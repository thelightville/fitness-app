import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  checkInRadiusMeters: z.number().min(10).max(2000).optional(),
  active: z.boolean().optional(),
});

function requireAdmin(session: any) {
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.gymLocation.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
  }

  const gym = await prisma.gymLocation.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'gym',
    entityId: gym.id,
    action: 'updated',
    metadata: parsed.data,
  });

  return NextResponse.json(gym);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const existing = await prisma.gymLocation.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
  }

  const appointmentCount = await prisma.appointment.count({ where: { gymLocationId: params.id } });
  if (appointmentCount > 0) {
    await prisma.gymLocation.update({
      where: { id: params.id },
      data: { active: false },
    });

    await logAudit({
      actorId: session!.user.id,
      entityType: 'gym',
      entityId: params.id,
      action: 'deactivated',
      metadata: { reason: 'has_linked_appointments' },
    });

    return NextResponse.json({ deactivated: true, message: 'Gym has linked appointments and was deactivated' });
  }

  await prisma.gymLocation.delete({ where: { id: params.id } });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'gym',
    entityId: params.id,
    action: 'deleted',
  });

  return NextResponse.json({ deleted: true });
}
