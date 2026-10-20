import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, rateLimit } from '@/lib/auth';
import {
  buildSosBody,
  demoStatus,
  normalisePhone,
  sendSms,
} from '@/lib/twilio';

export const dynamic = 'force-dynamic';

/** GET /api/sos — demo window status + recent (redacted) event count. */
export async function GET() {
  try {
    const first = await db.sosEvent.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const status = demoStatus(first?.createdAt ?? null);
    const recent = await db.sosEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        phone: true,
        placeLabel: true,
        status: true,
        providerSid: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      status,
      recent: recent.map((r) => ({
        ...r,
        phone: r.phone.replace(/\d(?=\d{2})/g, '•'),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST /api/sos — trigger an SOS blast to up to 5 contacts. */
export async function POST(req: NextRequest) {
  try {
    // Public demo endpoint — strictly rate-limited (5 per minute per IP).
    rateLimit('sos:' + (req.headers.get('x-forwarded-for') ?? 'local'), 5, 60_000);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { lat, lng, accuracy, placeLabel, extra, contacts } = body as {
      lat?: number;
      lng?: number;
      accuracy?: number;
      placeLabel?: string;
      extra?: string;
      contacts?: string[];
    };

    if (lat != null && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
      return NextResponse.json({ error: 'lat out of range' }, { status: 400 });
    }
    if (lng != null && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
      return NextResponse.json({ error: 'lng out of range' }, { status: 400 });
    }

    const first = await db.sosEvent.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const demo = demoStatus(first?.createdAt ?? null);
    if (!demo.demoActive) {
      return NextResponse.json(
        {
          error:
            'The 60-day Twilio demo window has ended. Configure permanent credentials (TWILIO_PERMANENT=1) to continue.',
          status: demo,
        },
        { status: 403 },
      );
    }

    const numbers = Array.from(
      new Set((contacts ?? []).map((c) => String(c).trim()).filter(Boolean)),
    )
      .slice(0, 5)
      .map((c) => ({ raw: c, phone: normalisePhone(c) }));

    if (numbers.length === 0) {
      return NextResponse.json(
        { error: 'At least one phone contact is required.' },
        { status: 400 },
      );
    }
    const invalid = numbers.filter((n) => !n.phone);
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid phone number(s): ${invalid.map((n) => n.raw).join(', ')}` },
        { status: 400 },
      );
    }
    const phones = numbers.flatMap((n) => (n.phone ? [n.phone] : []));

    const text = buildSosBody({ placeLabel, lat, lng, extra });
    const results: Array<{
      id: string;
      phone: string;
      status: string;
      sid: string | null;
      error: string | null;
      at: Date;
    }> = [];
    for (const phone of phones) {
      const res = await sendSms(phone, text);
      const saved = await db.sosEvent.create({
        data: {
          phone,
          message: text,
          lat: lat ?? null,
          lng: lng ?? null,
          accuracy: typeof accuracy === 'number' ? accuracy : null,
          placeLabel: placeLabel?.slice(0, 200) ?? null,
          status: res.status,
          providerSid: res.sid ?? null,
          error: res.error ?? null,
        },
      });
      results.push({
        id: saved.id,
        phone,
        status: res.status,
        sid: res.sid ?? null,
        error: res.error ?? null,
        at: saved.createdAt,
      });
    }

    return NextResponse.json(
      { ok: true, message: text, status: demo, results },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'Rate limit exceeded') {
      return NextResponse.json(
        { error: 'Too many SOS triggers. Wait a minute.' },
        { status: 429 },
      );
    }
    return jsonError(err);
  }
}
