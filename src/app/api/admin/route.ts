import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireAdmin, audit, ApiError } from '@/lib/auth';
import { ROLE_KEYS, type Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/admin?section=users|roleRequests|audit|datasources
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const section = req.nextUrl.searchParams.get('section') ?? 'users';
    switch (section) {
      case 'users': {
        const users = await db.user.findMany({
          select: {
            id: true, name: true, email: true, role: true, roleStatus: true,
            emailVerified: true, organization: true, regionState: true, regionCity: true,
            isDemo: true, mustChangePassword: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 300,
        });
        const pending = await db.roleRequest.findMany({
          where: { status: 'PENDING' },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return Response.json({ users, pending });
      }
      case 'audit': {
        const events = await db.auditEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 200,
        });
        return Response.json({ events });
      }
      case 'datasources': {
        const sources = await db.dataSource.findMany({ orderBy: { sortOrder: 'asc' } });
        return Response.json({
          sources: [
            {
              key: 'maps_tiles',
              name: 'Map tiles',
              provider: 'OpenStreetMap',
              status: 'LIVE',
              lastSuccessAt: new Date().toISOString(),
              notes: 'Standard OSM tiles with attribution.',
              sortOrder: 0,
            },
            ...sources,
            {
              key: 'geocoding',
              name: 'Geocoding search',
              provider: 'OpenStreetMap Nominatim',
              status: 'LIVE',
              lastSuccessAt: new Date().toISOString(),
              notes: 'Light usage with local gazetteer fallback.',
              sortOrder: 9,
            },
          ],
        });
      }
      default:
        throw new ApiError(400, 'Unknown admin section');
    }
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/admin — approve/reject role requests
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const b = await req.json();
    if (b.action === 'decideRole') {
      const id = b.id as string;
      const decision = b.decision as 'approve' | 'reject';
      const request = await db.roleRequest.findUnique({ where: { id }, include: { user: true } });
      if (!request) throw new ApiError(404, 'Role request not found');
      if (request.status !== 'PENDING') throw new ApiError(400, 'Request already decided');
      const role = request.requestedRole as Role;
      if (!ROLE_KEYS.includes(role)) throw new ApiError(400, 'Unknown role in request');

      if (decision === 'approve') {
        await db.$transaction([
          db.roleRequest.update({
            where: { id },
            data: { status: 'APPROVED', reviewedBy: admin.email, reviewedAt: new Date(), reviewNote: b.note ?? null },
          }),
          db.user.update({
            where: { id: request.userId },
            data: { role, roleStatus: 'APPROVED' },
          }),
          db.notification.create({
            data: {
              userId: request.userId,
              title: 'Role request approved',
              body: `Your ${role} role is now active. Permissions are enforced server-side.`,
              type: 'ROLE',
            },
          }),
        ]);
        await audit({ id: admin.id, email: admin.email }, 'ROLE_APPROVED', `${request.user.email} → ${role}`);
        return Response.json({ ok: true, status: 'APPROVED' });
      }
      await db.$transaction([
        db.roleRequest.update({
          where: { id },
          data: { status: 'REJECTED', reviewedBy: admin.email, reviewedAt: new Date(), reviewNote: b.note ?? null },
        }),
        db.notification.create({
          data: {
            userId: request.userId,
            title: 'Role request not approved',
            body: b.note ?? 'Your recent role request was not approved. Contact your administrator for details.',
            type: 'ROLE',
          },
        }),
      ]);
      await audit({ id: admin.id, email: admin.email }, 'ROLE_REJECTED', `${request.user.email} → ${role}`);
      return Response.json({ ok: true, status: 'REJECTED' });
    }
    throw new ApiError(400, 'Unknown admin action');
  } catch (err) {
    return jsonError(err);
  }
}
