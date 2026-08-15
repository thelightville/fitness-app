import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trainers = await prisma.trainer.findMany({
    where: { active: true },
    include: {
      user: { select: { name: true, email: true } },
      availability: true,
    },
  });

  return NextResponse.json(trainers);
}
