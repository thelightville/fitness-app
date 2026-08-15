import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAppointmentIcs } from '@/lib/calendar';
import { UserRole } from '@prisma/client';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { user: { select: { name: true, email: true } } } },
      trainer: { include: { user: { select: { name: true, email: true } } } },
      gymLocation: true,
    },
  });

  if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const isOwner =
    (session.user.role === UserRole.CLIENT && appointment.client.user.email === session.user.email) ||
    (session.user.role === UserRole.TRAINER && appointment.trainer.user.email === session.user.email) ||
    session.user.role === UserRole.ADMIN;

  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ics = await generateAppointmentIcs(appointment);

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="appointment-${appointment.id}.ics"`,
    },
  });
}
