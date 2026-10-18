import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/assets?city=&q= — public read (map + landing)
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const city = sp.get('city') ?? undefined;
    const q = sp.get('q') ?? undefined;
    const assets = await db.asset.findMany({
      where: {
        ...(city ? { city } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { city: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { code: 'asc' },
      take: 300,
    });
    return Response.json({ assets });
  } catch (err) {
    return jsonError(err);
  }
}
