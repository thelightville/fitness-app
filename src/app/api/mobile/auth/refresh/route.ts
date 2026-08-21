import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshMobileSession } from '@/lib/mobile-auth';
import { checkRateLimit, clientRateLimitKey } from '@/lib/rate-limit';

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(clientRateLimitKey(req, 'mobile-refresh'), 60, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many refresh attempts' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const session = await refreshMobileSession(parsed.data.refreshToken);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  return NextResponse.json(session);
}