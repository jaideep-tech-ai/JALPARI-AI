import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireUser, isOperationalUser, audit } from '@/lib/auth';
import { assessRisk, recommendInterventions } from '@/lib/risk';
import { haversineKm } from '@/lib/geo';
import type { Severity } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/assessments?city= — public read (landing + map use it)
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const city = sp.get('city') ?? undefined;
    const assessments = await db.riskAssessment.findMany({
      where: city ? { city } : {},
      include: { asset: { select: { name: true, code: true, category: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    // dedupe by assetId: keep latest per asset
    const seen = new Set<string>();
    const latest = assessments.filter((a) => {
      if (!a.assetId) return true;
      if (seen.has(a.assetId)) return false;
      seen.add(a.assetId);
      return true;
    });
    return Response.json({ assessments: latest });
  } catch (err) {
    return jsonError(err);
  }
}

interface WeatherMeta {
  rain24: number;
  forecast48: number;
  live: boolean;
  label: string;
}

async function weatherFor(lat: number, lon: number): Promise<WeatherMeta> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=precipitation&past_days=1&forecast_days=2&timezone=Asia%2FKolkata`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) throw new Error('weather http ' + res.status);
    const data = (await res.json()) as {
      hourly?: { time: string[]; precipitation: number[] };
    };
    const times: string[] = data.hourly?.time ?? [];
    const precip: number[] = data.hourly?.precipitation ?? [];
    const now = Date.now();
    let rain24 = 0;
    let forecast48 = 0;
    times.forEach((t2, i) => {
      const ts = new Date(t2).getTime();
      const p = precip[i] ?? 0;
      if (ts <= now && ts > now - 24 * 3600_000) rain24 += p;
      if (ts > now && ts <= now + 48 * 3600_000) forecast48 += p;
    });
    return { rain24: Math.round(rain24 * 10) / 10, forecast48: Math.round(forecast48 * 10) / 10, live: true, label: 'Open-Meteo (live)' };
  } catch {
    // Deterministic demo fallback per location (clearly labelled downstream)
    const seed = Math.abs(Math.sin(lat * 31.7 + lon * 17.3)) * 1000;
    const monsoonFactor = (Date.now() / 86400000) % 365; // seasonal-ish variety
    const rain24 = Math.round(((seed % 38) * (monsoonFactor > 150 && monsoonFactor < 280 ? 1 : 0.25)) * 10) / 10;
    const forecast48 = Math.round(((seed % 55) * (monsoonFactor > 150 && monsoonFactor < 280 ? 1 : 0.2)) * 10) / 10;
    return { rain24, forecast48, live: false, label: 'Simulated weather (demo)' };
  }
}

// POST /api/assessments — regenerate assessments (per city or all)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!isOperationalUser(user) && user.role !== 'analyst') {
      // allow: read-only regeneration is not permitted for citizens
      return Response.json({ error: 'Insufficient permissions for this action' }, { status: 403 });
    }
    const b = await req.json().catch(() => ({}));
    const city = (b.city as string | undefined) ?? undefined;
    const assets = await db.asset.findMany({ where: city ? { city } : {} });

    const since14 = new Date(Date.now() - 14 * 86400000);
    const since7 = new Date(Date.now() - 7 * 86400000);
    const recentIncidents = await db.incident.findMany({ where: { createdAt: { gte: since14 } }, select: { lat: true, lon: true } });
    const recentReports = await db.incident.findMany({ where: { createdAt: { gte: since7 }, category: 'WATERLOGGING' }, select: { lat: true, lon: true } });

    let created = 0;
    for (const asset of assets) {
      const wx = await weatherFor(asset.lat, asset.lon);
      const inc = recentIncidents.filter((i) => haversineKm(i.lat, i.lon, asset.lat, asset.lon) < 2).length;
      const rep = recentReports.filter((i) => haversineKm(i.lat, i.lon, asset.lat, asset.lon) < 2).length;
      const daysSince = asset.lastInspectedAt
        ? Math.floor((Date.now() - asset.lastInspectedAt.getTime()) / 86400000)
        : 180;
      const output = assessRisk({
        rainfall24h: wx.rain24,
        forecast48h: wx.forecast48,
        hasLiveWeather: wx.live,
        vulnerability: asset.vulnerability,
        drainage: asset.drainageCapacity as 'LOW' | 'MODERATE' | 'HIGH',
        recentIncidents: inc,
        recentReports: rep,
        daysSinceInspection: daysSince,
      });
      const assessment = await db.riskAssessment.create({
        data: {
          assetId: asset.id,
          city: asset.city,
          lat: asset.lat,
          lon: asset.lon,
          score: output.score,
          severity: output.severity,
          factors: JSON.stringify(output.factors),
          confidence: output.confidence,
          horizon: output.horizon,
          source: wx.live ? 'JALGUARD rule engine v0.9 + Open-Meteo live' : 'JALGUARD rule engine v0.9 + simulated weather (demo)',
          dataFreshness: output.dataFreshness,
          isDemo: !wx.live,
        },
      });
      // Only generate recommendations when none pending for this asset
      const pending = await db.recommendation.findFirst({
        where: { assetId: asset.id, status: 'PENDING' },
      });
      if (!pending) {
        const templates = recommendInterventions(output, {
          rainfall24h: wx.rain24,
          forecast48h: wx.forecast48,
          hasLiveWeather: wx.live,
          vulnerability: asset.vulnerability,
          drainage: asset.drainageCapacity as 'LOW' | 'MODERATE' | 'HIGH',
          recentIncidents: inc,
          recentReports: rep,
          daysSinceInspection: daysSince,
        });
        for (const t of templates) {
          await db.recommendation.create({
            data: {
              assessmentId: assessment.id,
              assetId: asset.id,
              title: t.title,
              actionType: t.actionType,
              rationale: t.rationale,
              priority: t.priority,
              resources: t.resources,
              estCostInr: t.estCostInr,
              benefit: t.benefit,
              verificationMethod: t.verificationMethod,
              isDemo: !wx.live,
            },
          });
        }
      }
      created++;
    }
    await audit({ id: user.id, email: user.email }, 'ASSESSMENTS_GENERATED', `${created} assets${city ? ' in ' + city : ''}`);
    return Response.json({ ok: true, generated: created, weatherMode: wxLabel(assets.length > 0 ? await weatherFor(assets[0].lat, assets[0].lon) : null) });
  } catch (err) {
    return jsonError(err);
  }
}

function wxLabel(wx: WeatherMeta | null): string {
  return wx ? (wx.live ? 'LIVE' : 'SIMULATED') : 'UNKNOWN';
}

export function severityColor(sev: Severity): string {
  return { LOW: '#10B981', MODERATE: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444' }[sev];
}
