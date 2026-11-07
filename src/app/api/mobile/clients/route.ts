import { assignedClient } from '@/lib/trainer-access';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (auth.user.role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId: auth.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(client ? [client] : []);
  }

  if (!['TRAINER', 'ADMIN'].includes(auth.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    where: auth.user.role === 'TRAINER' ? assignedClient(auth.user.id) : { active: true },
    orderBy: { user: { name: 'asc' } },
    select: { id: true, user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(clients);
}