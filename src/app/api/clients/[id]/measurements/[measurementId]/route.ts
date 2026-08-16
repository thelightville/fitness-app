import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; measurementId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: clientId, measurementId } = params;

  const measurement = await prisma.measurement.findFirst({
    where: { id: measurementId, clientId },
  });

  if (!measurement) {
    return NextResponse.json({ error: 'Measurement not found' }, { status: 404 });
  }

  await prisma.measurement.delete({ where: { id: measurementId } });

  await logAudit({
    actorId: session.user.id,
    entityType: 'measurement',
    entityId: measurementId,
    action: 'deleted',
    metadata: { clientId },
  });

  return NextResponse.json({ success: true });
}
