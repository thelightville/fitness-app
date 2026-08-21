import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { issueMobileSession } from '@/lib/mobile-auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const session = await issueMobileSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json(session);
}