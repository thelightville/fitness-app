import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma, UserRole } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.enum([UserRole.CLIENT, UserRole.TRAINER, UserRole.ADMIN]).optional(),
  active: z.boolean().optional(),
  trainerApproved: z.boolean().optional(),
  trainerClientIds: z.array(z.string().min(1)).max(500).optional(),
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

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true, createdAt: true,
      client: { select: { id: true, active: true, goals: true } },
      trainer: { select: { id: true, active: true, approvedAt: true, bio: true, specialties: true, clients: { select: { id: true } } } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, phone, password, role, active, bio, specialties, goals, trainerApproved, trainerClientIds } = parsed.data;

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

  if ((trainerApproved !== undefined || trainerClientIds !== undefined) &&
      (!existing.trainer || existing.role !== UserRole.TRAINER || (role && role !== UserRole.TRAINER))) {
    return NextResponse.json({ error: 'Trainer access can only be set on trainer accounts' }, { status: 400 });
  }
  const clientIds = trainerClientIds === undefined ? undefined : [...new Set(trainerClientIds)];
  if (clientIds && await prisma.client.count({ where: { id: { in: clientIds }, user: { role: UserRole.CLIENT } } }) !== clientIds.length) {
    return NextResponse.json({ error: 'One or more client assignments are invalid' }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = { name, email, phone, role };
  if (password) data.password = await bcrypt.hash(password, 12);
  if (existing.trainer) {
    data.trainer = { update: {
      active, bio, specialties,
      approvedAt: active === false || trainerApproved === false ? null
        : trainerApproved === true ? existing.trainer.approvedAt ?? new Date() : undefined,
      ...(clientIds && { clients: { set: clientIds.map((id) => ({ id })) } }),
    } };
  }
  if (existing.client) data.client = { update: { active, goals } };
  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  await logAudit({
    actorId: session!.user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'updated',
    metadata: { name, email, role, active, trainerApproved, trainerClientIds: clientIds },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
    await prisma.trainer.update({ where: { id: existing.trainer.id }, data: { active: false, approvedAt: null } });
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
