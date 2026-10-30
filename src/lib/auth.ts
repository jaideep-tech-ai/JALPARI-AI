import { db } from '@/lib/db';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import type { SessionUser, Role } from '@/lib/types';

// ============ Password hashing (scrypt, server-only) ============

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

// ============ Sessions (httpOnly cookie + DB) ============

export const SESSION_COOKIE = 'jg_session';
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  };
}

export function toSessionUser(u: {
  id: string; email: string; name: string; role: string | null; roleStatus: string | null;
  emailVerified: boolean; onboarded: boolean; language: string; organization: string | null;
  regionState: string | null; regionCity: string | null; notificationsEnabled: boolean;
  mustChangePassword: boolean; isDemo: boolean;
}): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: (u.role as Role | null) ?? null,
    roleStatus: u.roleStatus,
    emailVerified: u.emailVerified,
    onboarded: u.onboarded,
    language: u.language,
    organization: u.organization,
    regionState: u.regionState,
    regionCity: u.regionCity,
    notificationsEnabled: u.notificationsEnabled,
    mustChangePassword: u.mustChangePassword,
    isDemo: u.isDemo,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

export async function destroySession(): Promise<void> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
}

// ============ Server-side authorization guards ============

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Authentication required');
  if (!user.emailVerified) throw new ApiError(403, 'Email not verified');
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.role || !roles.includes(user.role) || user.roleStatus !== 'APPROVED') {
    throw new ApiError(403, 'Insufficient permissions for this action');
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole('super_admin', 'org_admin');
}

// Privileged = anything beyond citizen; must be approved server-side
export function isApprovedPrivileged(user: SessionUser): boolean {
  return !!user.role && user.role !== 'citizen' && user.roleStatus === 'APPROVED';
}

export function isOperationalUser(user: SessionUser): boolean {
  // municipal + disaster can manage incidents/interventions
  return user.role === 'municipal' || user.role === 'disaster' || user.role === 'super_admin';
}

export function isFieldUser(user: SessionUser): boolean {
  return user.role === 'field' || user.role === 'infra' || user.role === 'super_admin';
}

// ============ Audit ============

export async function audit(
  actor: { id?: string | null; email?: string | null },
  action: string,
  detail?: string
) {
  await db.auditEvent.create({
    data: {
      actorId: actor.id ?? null,
      actorEmail: actor.email ?? null,
      action,
      detail: detail ?? null,
    },
  });
}

export function jsonError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error('[api]', err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}

// Simple in-memory rate limiter for sensitive endpoints
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count++;
  if (bucket.count > limit) {
    throw new ApiError(429, 'Too many requests. Please try again shortly.');
  }
}
