import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Simple in-memory cache (per server instance)
interface CacheEntry {
  at: number;
  data: unknown;
}
const cache = new Map<string, CacheEntry>();
const TTL = 10 * 60 * 1000; // 10 minutes

function demoWeather(lat: number, lon: number, city: string) {
  // Deterministic labelled-demo weather when Open-Meteo is unreachable
  const seed = Math.abs(Math.sin(lat * 31.7 + lon * 17.3) * 1000);
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const monsoon = dayOfYear > 150 && dayOfYear < 280;
  const base = monsoon ? 12 : 2;
  const hourly = Array.from({ length: 48 }, (_, i) => ({
    time: new Date(Date.now() + i * 3600_000).toISOString().slice(0, 16),
    precip: Math.round((((seed + i * 7) % 100) / 100) * base * 10) / 10,
  }));
  const daily = [0, 1].map((d) => {
    const day = hourly.slice(d * 24, d * 24 + 24);
    return {
      date: new Date(Date.now() + d * 86400000).toISOString().slice(0, 10),
      rainSum: Math.round(day.reduce((s, h) => s + h.precip, 0) * 10) / 10,
      rainMax: Math.round(Math.max(...day.map((h) => h.precip), 0) * 10) / 10,
    };
  });
  return {
    status: 'SIMULATED',
    source: 'Simulated feed (Open-Meteo unreachable) — DEMO DATA',
    fetchedAt: new Date().toISOString(),
    location: city,
    lat,
    lon,
    current: {
      temperature: Math.round((24 + (seed % 8)) * 10) / 10,
      humidity: Math.round(55 + (seed % 35)),
      precipitation: hourly[0].precip,
      weatherCode: monsoon ? 63 : 1,
      windSpeed: Math.round(8 + (seed % 15)),
    },
    hourly,
    daily,
    note: 'Simulated values for demonstration only — not real observations.',
  };
}

function updateSourceStatus(live: boolean) {
  db.dataSource
    .upsert({
      where: { key: 'weather' },
      create: {
        key: 'weather',
        name: 'Weather & forecast',
        provider: 'Open-Meteo',
        status: live ? 'LIVE' : 'SIMULATED',
        lastSuccessAt: live ? new Date() : null,
        notes: live
          ? 'Free non-commercial API terms apply for this preview.'
          : 'Open-Meteo unreachable from sandbox; deterministic simulated fallback shown as DEMO.',
        sortOrder: 1,
      },
      update: {
        status: live ? 'LIVE' : 'SIMULATED',
        lastSuccessAt: live ? new Date() : undefined,
      },
    })
    .catch(() => {});
}

// GET /api/weather?lat=&lon=&city=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get('lat') ?? 19.076);
  const lon = Number(sp.get('lon') ?? 72.8777);
  const city = sp.get('city') ?? 'Mumbai';
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
  }
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    return Response.json(hit.data);
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&hourly=precipitation&past_days=1&forecast_days=2&timezone=Asia%2FKolkata`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
    const raw = (await res.json()) as {
      current?: Record<string, number>;
      hourly?: { time: string[]; precipitation: number[] };
    };
    const times: string[] = raw.hourly?.time ?? [];
    const precip: number[] = raw.hourly?.precipitation ?? [];
    const now = Date.now();
    const hourly = times
      .map((t, i) => ({ time: t, precip: precip[i] ?? 0 }))
      .filter((h) => {
        const ts = new Date(h.time).getTime();
        return ts > now - 24 * 3600_000 && ts <= now + 48 * 3600_000;
      });
    const daily = [0, 1].map((d) => {
      const day = hourly.slice(d * 24, d * 24 + 24);
      return {
        date: new Date(Date.now() + d * 86400000).toISOString().slice(0, 10),
        rainSum: Math.round(day.reduce((s, h) => s + h.precip, 0) * 10) / 10,
        rainMax: Math.round(Math.max(...day.map((h) => h.precip), 0) * 10) / 10,
      };
    });
    const data = {
      status: 'LIVE',
      source: 'Open-Meteo (live)',
      fetchedAt: new Date().toISOString(),
      location: city,
      lat,
      lon,
      current: {
        temperature: raw.current?.temperature_2m ?? 0,
        humidity: raw.current?.relative_humidity_2m ?? 0,
        precipitation: raw.current?.precipitation ?? 0,
        weatherCode: raw.current?.weather_code ?? 0,
        windSpeed: raw.current?.wind_speed_10m ?? 0,
      },
      hourly,
      daily,
      note: 'Live weather from Open-Meteo. Not an official flood forecast.',
    };
    cache.set(key, { at: Date.now(), data });
    updateSourceStatus(true);
    return Response.json(data);
  } catch {
    const data = demoWeather(lat, lon, city);
    cache.set(key, { at: Date.now(), data });
    updateSourceStatus(false);
    return Response.json(data);
  }
}
