import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gyms = await prisma.gymLocation.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(gyms);
}
