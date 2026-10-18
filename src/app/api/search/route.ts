import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/search?q= — global search across assets, incidents, tasks
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
    if (q.length < 2) return Response.json({ assets: [], incidents: [], tasks: [] });
    const [assets, incidents, tasks] = await Promise.all([
      db.asset.findMany({
        where: { OR: [{ name: { contains: q } }, { code: { contains: q } }, { city: { contains: q } }] },
        select: { id: true, name: true, code: true, city: true },
        take: 6,
      }),
      db.incident.findMany({
        where: {
          OR: [{ title: { contains: q } }, { city: { contains: q } }],
          // citizens only search their own reports in global search
          ...(user.role === 'citizen' ? { reporterId: user.id } : {}),
        },
        select: { id: true, title: true, city: true, status: true },
        take: 6,
      }),
      db.assignedTask.findMany({
        where: {
          OR: [{ title: { contains: q } }],
          ...(user.role === 'field' || user.role === 'infra' ? { assignedToId: user.id } : {}),
        },
        select: { id: true, title: true, status: true, city: true },
        take: 6,
      }),
    ]);
    return Response.json({ assets, incidents, tasks });
  } catch (err) {
    return jsonError(err);
  }
}
