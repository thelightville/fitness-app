import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (![UserRole.CLIENT, UserRole.TRAINER, UserRole.ADMIN].includes(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (session.user.role === UserRole.CLIENT) {
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(client ? [client] : []);
  }

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { user: { name: 'asc' } },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(clients);
}