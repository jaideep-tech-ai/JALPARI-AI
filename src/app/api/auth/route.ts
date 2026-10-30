import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword, verifyPassword, generateSecureToken, createSession, destroySession,
  getSessionUser, toSessionUser, sessionCookieOptions, ApiError, jsonError,
  requireUser, audit, rateLimit,
} from '@/lib/auth';
import { ROLE_KEYS, PRIVILEGED_ROLES, type Role } from '@/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/auth → current session user
export async function GET() {
  try {
    const user = await getSessionUser();
    return Response.json({ user });
  } catch (err) {
    return jsonError(err);
  }
}

interface Payload {
  action: string;
  email?: string;
  password?: string;
  name?: string;
  token?: string;
  role?: string;
  language?: string;
  organization?: string;
  regionState?: string;
  regionCity?: string;
  notificationsEnabled?: boolean;
  currentPassword?: string;
  requestedRole?: string;
  note?: string;
}

function pwdProblem(pwd: string): string | null {
  if (!pwd || pwd.length < 8) return 'At least 8 characters';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    const action = body.action;
    const ip = req.headers.get('x-forwarded-for') ?? 'local';

    switch (action) {
      // ---------------- SIGNUP ----------------
      case 'signup': {
        rateLimit(`signup:${ip}`, 8, 60_000);
        const email = (body.email ?? '').trim().toLowerCase();
        const name = (body.name ?? '').trim();
        if (name.length < 2) throw new ApiError(400, 'Name must be at least 2 characters');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address');
        const pErr = pwdProblem(body.password ?? '');
        if (pErr) throw new ApiError(400, pErr);
        const exists = await db.user.findUnique({ where: { email } });
        if (exists) throw new ApiError(409, 'An account with this email already exists');
        const verifyToken = generateSecureToken(16);
        const user = await db.user.create({
          data: {
            email,
            name,
            passwordHash: hashPassword(body.password!),
            language: body.language === 'hi' ? 'hi' : 'en',
            organization: body.organization?.trim() || null,
            verifyToken,
            isDemo: false,
          },
        });
        await audit({ id: user.id, email }, 'USER_SIGNUP', `Signup from ${ip}`);
        return Response.json({
          ok: true,
          email,
          // Demo: no email provider configured in this preview, so the token is
          // returned for the labelled demo verification step instead of emailing it.
          demoVerifyToken: verifyToken,
          demoNote: 'Email delivery is not configured in this preview.',
        });
      }

      // ---------------- EMAIL VERIFY (demo-labelled) ----------------
      case 'verify': {
        rateLimit(`verify:${ip}`, 20, 60_000);
        const email = (body.email ?? '').trim().toLowerCase();
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.verifyToken || user.verifyToken !== body.token) {
          throw new ApiError(400, 'This link or token is invalid or has expired');
        }
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: true, verifyToken: null },
        });
        const token = await createSession(user.id);
        const store = await cookies();
        store.set('jg_session', token, sessionCookieOptions());
        const fresh = await db.user.findUnique({ where: { email } });
        return Response.json({ ok: true, user: fresh ? toSessionUser(fresh) : null });
      }

      // ---------------- SELF-VERIFY for a signed-in, unverified user ----------------
      // Demo-labelled path used when no email provider is configured: the user
      // holds a valid session (password proven) but cannot receive mail.
      case 'verifySelf': {
        rateLimit(`verifySelf:${ip}`, 10, 60_000);
        const su = await getSessionUser();
        if (!su) throw new ApiError(401, 'Authentication required');
        if (!su.emailVerified) {
          await db.user.update({
            where: { id: su.id },
            data: { emailVerified: true, verifyToken: null },
          });
          await audit({ id: su.id, email: su.email }, 'EMAIL_VERIFIED_DEMO', 'Self-verify (no mail provider in preview)');
        }
        const fresh = await db.user.findUnique({ where: { id: su.id } });
        return Response.json({ ok: true, user: fresh ? toSessionUser(fresh) : null });
      }

      // ---------------- LOGIN ----------------
      case 'login': {
        rateLimit(`login:${ip}`, 15, 60_000);
        const email = (body.email ?? '').trim().toLowerCase();
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !verifyPassword(body.password ?? '', user.passwordHash)) {
          throw new ApiError(401, 'Invalid email or password');
        }
        const token = await createSession(user.id);
        const store = await cookies();
        store.set('jg_session', token, sessionCookieOptions());
        return Response.json({ ok: true, user: toSessionUser(user) });
      }

      // ---------------- LOGOUT ----------------
      case 'logout': {
        await destroySession();
        const store = await cookies();
        store.set('jg_session', '', { ...sessionCookieOptions(), maxAge: 0 });
        return Response.json({ ok: true });
      }

      // ---------------- FORGOT PASSWORD ----------------
      case 'forgot': {
        rateLimit(`forgot:${ip}`, 5, 60_000);
        const email = (body.email ?? '').trim().toLowerCase();
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          // Do not leak account existence
          return Response.json({ ok: true });
        }
        const token = generateSecureToken(16);
        await db.user.update({
          where: { id: user.id },
          data: { resetToken: token, resetTokenExp: new Date(Date.now() + 3600_000) },
        });
        return Response.json({
          ok: true,
          // Demo: reset token surfaced in-app because email delivery is not configured.
          demoResetToken: token,
          demoNote: 'Email delivery is not configured in this preview.',
        });
      }

      // ---------------- RESET PASSWORD ----------------
      case 'reset': {
        rateLimit(`reset:${ip}`, 10, 60_000);
        const email = (body.email ?? '').trim().toLowerCase();
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.resetToken || user.resetToken !== body.token) {
          throw new ApiError(400, 'This link or token is invalid or has expired');
        }
        if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
          throw new ApiError(400, 'This link or token is invalid or has expired');
        }
        const pErr = pwdProblem(body.password ?? '');
        if (pErr) throw new ApiError(400, pErr);
        await db.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashPassword(body.password!),
            resetToken: null,
            resetTokenExp: null,
          },
        });
        await audit({ id: user.id, email: user.email }, 'PASSWORD_RESET');
        return Response.json({ ok: true });
      }

      // ---------------- CHANGE PASSWORD (incl. forced first-login change) ----------------
      case 'changePassword': {
        const session = await requireUser();
        const dbUser = await db.user.findUnique({ where: { id: session.id } });
        if (!dbUser) throw new ApiError(404, 'User not found');
        if (!verifyPassword(body.currentPassword ?? '', dbUser.passwordHash)) {
          throw new ApiError(400, 'Current password is incorrect');
        }
        const pErr = pwdProblem(body.password ?? '');
        if (pErr) throw new ApiError(400, pErr);
        await db.user.update({
          where: { id: session.id },
          data: { passwordHash: hashPassword(body.password!), mustChangePassword: false },
        });
        await audit({ id: session.id, email: session.email }, 'PASSWORD_CHANGE');
        return Response.json({ ok: true });
      }

      // ---------------- ROLE SELECTION / REQUEST ----------------
      case 'selectRole': {
        const session = await requireUser();
        const role = body.requestedRole as Role;
        if (!ROLE_KEYS.includes(role)) throw new ApiError(400, 'Unknown role');
        if (role === 'citizen') {
          // Non-privileged: granted immediately
          const updated = await db.user.update({
            where: { id: session.id },
            data: { role: 'citizen', roleStatus: 'APPROVED' },
          });
          await audit({ id: session.id, email: session.email }, 'ROLE_GRANTED', 'citizen');
          return Response.json({ ok: true, granted: true, user: toSessionUser(updated) });
        }
        // Privileged: server-side request only — never auto-granted
        if (!PRIVILEGED_ROLES.includes(role)) throw new ApiError(400, 'Unknown role');
        const dup = await db.roleRequest.findFirst({
          where: { userId: session.id, status: 'PENDING', requestedRole: role },
        });
        if (!dup) {
          await db.roleRequest.create({
            data: {
              userId: session.id,
              requestedRole: role,
              organization: session.organization,
              note: body.note ?? null,
            },
          });
          await audit({ id: session.id, email: session.email }, 'ROLE_REQUESTED', role);
        }
        // Provisional citizen access meanwhile (clearly non-privileged)
        let updated = await db.user.findUnique({ where: { id: session.id } });
        if (updated && !updated.role) {
          updated = await db.user.update({
            where: { id: session.id },
            data: { role: 'citizen', roleStatus: 'APPROVED' },
          });
        }
        return Response.json({
          ok: true,
          granted: false,
          pendingRole: role,
          user: updated ? toSessionUser(updated) : session,
        });
      }

      // ---------------- ONBOARDING ----------------
      case 'onboarding': {
        const session = await requireUser();
        const updated = await db.user.update({
          where: { id: session.id },
          data: {
            language: body.language === 'hi' ? 'hi' : 'en',
            organization: body.organization ?? session.organization,
            regionState: body.regionState ?? session.regionState,
            regionCity: body.regionCity ?? session.regionCity,
            notificationsEnabled: body.notificationsEnabled ?? true,
            onboarded: true,
          },
        });
        return Response.json({ ok: true, user: toSessionUser(updated) });
      }

      // ---------------- PROFILE UPDATE (settings) ----------------
      case 'updateProfile': {
        const session = await requireUser();
        const updated = await db.user.update({
          where: { id: session.id },
          data: {
            name: body.name?.trim() || session.name,
            language: body.language === 'hi' ? 'hi' : body.language === 'en' ? 'en' : session.language,
            organization: body.organization ?? session.organization,
            regionState: body.regionState ?? session.regionState,
            regionCity: body.regionCity ?? session.regionCity,
            notificationsEnabled: body.notificationsEnabled ?? session.notificationsEnabled,
          },
        });
        return Response.json({ ok: true, user: toSessionUser(updated) });
      }

      default:
        throw new ApiError(400, 'Unknown auth action');
    }
  } catch (err) {
    return jsonError(err);
  }
}
