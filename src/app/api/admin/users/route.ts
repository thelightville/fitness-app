import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum([UserRole.CLIENT, UserRole.TRAINER, UserRole.ADMIN]),
  active: z.boolean().optional().default(true),
});

function requireAdmin(session: any) {
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, active: true } },
      trainer: { select: { id: true, active: true, specialties: true } },
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, phone, password, role, active } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    },
  });

  if (role === UserRole.CLIENT) {
    await prisma.client.create({ data: { userId: user.id, active } });
  } else if (role === UserRole.TRAINER) {
    await prisma.trainer.create({ data: { userId: user.id, active } });
  }

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'created',
    metadata: { name, email, role, active },
  });

  return NextResponse.json(user, { status: 201 });
}
