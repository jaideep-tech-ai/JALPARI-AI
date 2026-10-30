import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health — basic liveness + persistence check
export async function GET() {
  const checks: Record<string, string> = {};
  let ok = true;
  try {
    await db.user.count();
    checks.database = 'ok';
  } catch {
    checks.database = 'unavailable';
    ok = false;
  }
  checks.api = 'ok';
  return Response.json(
    {
      status: ok ? 'healthy' : 'degraded',
      app: 'JALGUARD preview',
      version: '0.9.0-demo',
      time: new Date().toISOString(),
      checks,
      note: 'Preview build with demonstration data unless labelled LIVE.',
    },
    { status: ok ? 200 : 503 }
  );
}
