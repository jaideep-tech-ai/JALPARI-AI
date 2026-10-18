import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, hashPassword, generateSecureToken, audit, ApiError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/bootstrap — protected first-run administrator creation.
//
// Security model:
// - Requires BOOTSTRAP_ADMIN_KEY from the server environment (never shipped to the client).
// - The temporary password is generated server-side with a cryptographic RNG,
//   returned ONCE in this response, and flagged mustChangePassword.
// - Idempotent: if an approved super admin already exists, reruns are refused.
// - Disabled entirely when BOOTSTRAP_ADMIN_KEY is not configured.
export async function POST(req: NextRequest) {
  try {
    const key = process.env.BOOTSTRAP_ADMIN_KEY;
    if (!key) {
      throw new ApiError(403, 'Bootstrap is disabled: BOOTSTRAP_ADMIN_KEY is not configured on the server.');
    }
    const b = await req.json().catch(() => ({}));
    if (b.key !== key) throw new ApiError(403, 'Invalid bootstrap key');

    const existingAdmin = await db.user.findFirst({
      where: { role: 'super_admin', roleStatus: 'APPROVED' },
    });
    if (existingAdmin) {
      throw new ApiError(409, 'An approved super administrator already exists. Bootstrap is closed (safe to keep disabled).');
    }

    const email = (b.email ?? process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@jalguard.local').trim().toLowerCase();
    const name = (b.name ?? 'Platform Administrator').trim();
    const tempPassword = generateSecureToken(12); // 24 hex chars of entropy from a CSPRNG

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(tempPassword),
        role: 'super_admin',
        roleStatus: 'APPROVED',
        emailVerified: true,
        mustChangePassword: true,
      },
    });
    await audit({ id: user.id, email }, 'ADMIN_BOOTSTRAPPED', 'First super admin created via protected bootstrap');

    return Response.json({
      ok: true,
      email,
      temporaryPassword: tempPassword,
      warning: 'Store this password now — it is shown only once and must be changed at first login.',
    });
  } catch (err) {
    return jsonError(err);
  }
}
