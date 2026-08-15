import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.enum([UserRole.CLIENT, UserRole.TRAINER, UserRole.ADMIN]).optional(),
  active: z.boolean().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  goals: z.string().optional(),
});

function requireAdmin(session: any) {
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, phone, password, role, active, bio, specialties, goals } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    include: { client: true, trainer: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
  }

  const data: any = { name, email, phone };
  if (password) data.password = await bcrypt.hash(password, 12);
  if (role) data.role = role;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    include: { client: true, trainer: true },
  });

  if (active !== undefined) {
    if (user.client) {
      await prisma.client.update({ where: { id: user.client.id }, data: { active } });
    }
    if (user.trainer) {
      await prisma.trainer.update({ where: { id: user.trainer.id }, data: { active } });
    }
  }

  if (user.trainer && (bio !== undefined || specialties !== undefined)) {
    await prisma.trainer.update({
      where: { id: user.trainer.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(specialties !== undefined && { specialties }),
      },
    });
  }

  if (user.client && goals !== undefined) {
    await prisma.client.update({
      where: { id: user.client.id },
      data: { goals },
    });
  }

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'updated',
    metadata: { name, email, role, active },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  if (session!.user.id === params.id) {
    return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    include: { client: true, trainer: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (existing.client) {
    await prisma.client.update({ where: { id: existing.client.id }, data: { active: false } });
  }
  if (existing.trainer) {
    await prisma.trainer.update({ where: { id: existing.trainer.id }, data: { active: false } });
  }

  await prisma.user.update({ where: { id: params.id }, data: { email: `${existing.email}.inactive.${Date.now()}` } });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: params.id,
    action: 'deactivated',
  });

  return NextResponse.json({ success: true });
}
