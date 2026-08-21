import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { issueMobileSession } from '@/lib/mobile-auth';
import { checkRateLimit, clientRateLimitKey } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(clientRateLimitKey(req, 'mobile-login'), 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many sign-in attempts' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.password) {
    await logAudit({ entityType: 'mobile_auth', entityId: parsed.data.email, action: 'failed_login', metadata: { reason: 'unknown_user' } });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    await logAudit({ actorId: user.id, entityType: 'mobile_auth', entityId: user.id, action: 'failed_login', metadata: { reason: 'bad_password' } });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const session = await issueMobileSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json(session);
}