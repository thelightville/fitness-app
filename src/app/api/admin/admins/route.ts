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
  active: z.boolean().optional().default(true),
});

const resetSchema = z.object({
  userId: z.string().cuid(),
  password: z.string().min(8),
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

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(admins);
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

  const { name, email, phone, password, active } = parsed.data;

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
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'created',
    metadata: { name, email, role: UserRole.ADMIN, active },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { userId, password } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!target || target.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, updatedAt: new Date() },
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: userId,
    action: 'password_reset',
    metadata: { email: target.email },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (session!.user.id === userId) {
    return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!target || target.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: `${target.email}.inactive.${Date.now()}`, updatedAt: new Date() },
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: userId,
    action: 'deactivated',
    metadata: { email: target.email },
  });

  return NextResponse.json({ success: true });
}
