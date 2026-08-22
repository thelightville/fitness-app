import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMobileAppointmentContext } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
      workoutLog: true,
      checkIns: { orderBy: { checkedInAt: 'desc' } },
    },
  });

  return NextResponse.json(appointment);
}