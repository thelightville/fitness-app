import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const availability = await prisma.trainerAvailability.findMany({
    where: { trainerId: params.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(availability);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.TRAINER) {
    return NextResponse.json({ error: 'Only trainers can set availability' }, { status: 403 });
  }

  const trainer = await prisma.trainer.findUnique({
    where: { userId: session.user.id },
  });

  if (!trainer || trainer.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { dayOfWeek, startTime, endTime } = body;

  const availability = await prisma.trainerAvailability.create({
    data: {
      trainerId: params.id,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  return NextResponse.json(availability, { status: 201 });
}
