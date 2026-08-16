import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
  }

  const measurements = await prisma.measurement.findMany({
    where: { clientId: client.id },
    orderBy: { measuredAt: 'desc' },
  });

  return NextResponse.json(measurements);
}
