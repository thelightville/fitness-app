import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshMobileSession } from '@/lib/mobile-auth';

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const session = await refreshMobileSession(parsed.data.refreshToken);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  return NextResponse.json(session);
}