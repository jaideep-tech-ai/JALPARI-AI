import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, jsonError, requireUser, isOperationalUser, audit } from '@/lib/auth';
import { INCIDENT_CATEGORIES } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

// GET /api/incidents?city=&status=&mine=1&limit=
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const city = sp.get('city') ?? undefined;
    const status = sp.get('status') ?? undefined;
    const mine = sp.get('mine') === '1';
    const limit = Math.min(200, Number(sp.get('limit') ?? 100));
    const incidents = await db.incident.findMany({
      where: {
        ...(city ? { city } : {}),
        ...(status ? { status } : {}),
        ...(mine ? { reporterId: user.id } : {}),
      },
      include: {
        reporter: { select: { name: true, email: true } },
        updates: { orderBy: { createdAt: 'asc' as const } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return Response.json({ incidents });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/incidents — any verified user can report
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    const title = (b.title ?? '').trim();
    const description = (b.description ?? '').trim();
    const category = b.category as string;
    const lat = Number(b.lat);
    const lon = Number(b.lon);
    if (title.length < 4) throw new ApiError(400, 'Title must be at least 4 characters');
    if (description.length < 10) throw new ApiError(400, 'Description must be at least 10 characters');
    if (!(INCIDENT_CATEGORIES as readonly string[]).includes(category)) throw new ApiError(400, 'Invalid category');
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < 6 || lat > 37 || lon < 68 || lon > 98) {
      throw new ApiError(400, 'Pick a valid location within India');
    }
    const incident = await db.incident.create({
      data: {
        title,
        description,
        category,
        severity: SEVERITIES.includes(b.severity) ? b.severity : 'MODERATE',
        lat,
        lon,
        city: (b.city ?? 'Unknown').toString(),
        state: b.state ?? null,
        addressNote: (b.addressNote ?? '').toString().slice(0, 300) || null,
        hasPhoto: Boolean(b.hasPhoto),
        reporterId: user.id,
      },
    });
    await db.incidentUpdate.create({
      data: { incidentId: incident.id, authorName: user.name, message: 'Incident reported.', newStatus: 'OPEN' },
    });
    await audit({ id: user.id, email: user.email }, 'INCIDENT_CREATED', `${incident.id} ${incident.city}`);
    return Response.json({ ok: true, incident });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/incidents — status updates + timeline notes (operational roles)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    const id = b.id as string;
    if (!id) throw new ApiError(400, 'Missing incident id');
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');

    const op = isOperationalUser(user);
    const isReporter = incident.reporterId === user.id;
    if (!op && !isReporter) throw new ApiError(403, 'Insufficient permissions for this action');

    const newStatus = b.status as string | undefined;
    const message = (b.message ?? '').toString().trim();
    if (newStatus && !op) throw new ApiError(403, 'Only authorized officers can change incident status');
    if (newStatus && !STATUSES.includes(newStatus)) throw new ApiError(400, 'Invalid status');

    const updated = await db.incident.update({
      where: { id },
      data: newStatus ? { status: newStatus } : {},
    });
    if (message || newStatus) {
      await db.incidentUpdate.create({
        data: {
          incidentId: id,
          authorName: user.name,
          message: message || `Status changed to ${newStatus}.`,
          newStatus: newStatus ?? null,
        },
      });
    }
    // Notify the reporter about official status changes
    if (op && newStatus && incident.reporterId && incident.reporterId !== user.id) {
      await db.notification.create({
        data: {
          userId: incident.reporterId,
          title: `Incident update: ${incident.title}`,
          body: `Status changed to ${newStatus}.`,
          type: 'STATUS',
        },
      });
    }
    if (op) await audit({ id: user.id, email: user.email }, 'INCIDENT_UPDATED', `${id} → ${newStatus ?? 'note'}`);
    return Response.json({ ok: true, incident: updated });
  } catch (err) {
    return jsonError(err);
  }
}
