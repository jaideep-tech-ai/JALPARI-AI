import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/notifications
export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return Response.json({ notifications });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/notifications — mark one/all as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json().catch(() => ({}));
    if (b.all) {
      await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    } else if (b.id) {
      await db.notification.updateMany({ where: { id: b.id, userId: user.id }, data: { read: true } });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
