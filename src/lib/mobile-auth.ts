import { createHash, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from './db';

const ACCESS_SESSION_TTL_MS = 15 * 60 * 1000;
const REFRESH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface MobileAuthContext {
  sessionId: string;
  user: MobileUser;
}

/** Creates a random opaque session credential for native mobile clients. */
function createSessionCredential() {
  return randomBytes(32).toString('base64url');
}

/** Stores only a hash of mobile session credentials server-side. */
function hashCredential(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function mobileUser(user: MobileUser): MobileUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Issues a short access session and longer refresh session for a mobile user. */
export async function issueMobileSession(user: MobileUser) {
  const accessToken = createSessionCredential();
  const refreshToken = createSessionCredential();
  const accessExpiresAt = new Date(Date.now() + ACCESS_SESSION_TTL_MS);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_SESSION_TTL_MS);

  await prisma.mobileSession.create({
    data: {
      userId: user.id,
      accessTokenHash: hashCredential(accessToken),
      refreshTokenHash: hashCredential(refreshToken),
      accessExpiresAt,
      refreshExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresAt: accessExpiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
    user: mobileUser(user),
  };
}

/** Resolves the bearer access session sent by the mobile app. */
export async function requireMobileAuth(req: NextRequest): Promise<MobileAuthContext | null> {
  const authorization = req.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const session = await prisma.mobileSession.findUnique({
    where: { accessTokenHash: hashCredential(match[1]) },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!session || session.revokedAt || session.accessExpiresAt <= new Date()) return null;
  return { sessionId: session.id, user: mobileUser(session.user) };
}

/** Rotates a refresh session and returns a new mobile session pair. */
export async function refreshMobileSession(refreshToken: string) {
  const existing = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: hashCredential(refreshToken) },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!existing || existing.revokedAt || existing.refreshExpiresAt <= new Date()) return null;

  await prisma.mobileSession.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueMobileSession(existing.user);
}

/** Revokes the access session currently used by the mobile app. */
export async function revokeMobileSession(sessionId: string) {
  await prisma.mobileSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}