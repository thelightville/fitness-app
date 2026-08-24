import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gyms = await prisma.gymLocation.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(gyms);
}