import { NextRequest } from 'next/server';
import { CITIES } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  type: string;
  source: string;
}

const cache = new Map<string, { at: number; data: GeoResult[] }>();

// GET /api/geocode?q= — Nominatim (India-bounded) with local-city fallback
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return Response.json({ results: [] });
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return Response.json({ results: hit.data });

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
      `&countrycodes=in&format=json&limit=5&addressdetails=0`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'JALGUARD-Preview/1.0 (decision-support preview; contact: demo@jalguard.local)',
      },
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!res.ok) throw new Error('nominatim http ' + res.status);
    const arr = (await res.json()) as { display_name: string; lat: string; lon: string; type: string }[];
    const results: GeoResult[] = arr.map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      source: 'OpenStreetMap Nominatim',
    }));
    cache.set(key, { at: Date.now(), data: results });
    return Response.json({ results });
  } catch {
    // Fallback: local city list (clearly marked source)
    const results: GeoResult[] = CITIES.filter((c) =>
      c.city.toLowerCase().includes(key) || c.state.toLowerCase().includes(key)
    ).map((c) => ({
      name: `${c.city}, ${c.state}`,
      lat: c.lat,
      lon: c.lon,
      type: 'city',
      source: 'Local demo gazetteer (Nominatim unreachable)',
    }));
    return Response.json({ results, fallback: true });
  }
}
