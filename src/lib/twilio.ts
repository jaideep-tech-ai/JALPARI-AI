// Twilio SOS integration — 60-day demonstration window.
//
// Honest-demo rules (mirrors the platform's labelling ethos):
// - If TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are set,
//   messages are sent through Twilio's REST API and status is "SENT".
// - If they are NOT set, the platform runs in SIMULATED mode: the exact SMS
//   payload is built, validated and logged, but no network call is made and
//   status is "SIMULATED". The UI labels this clearly.
// - The demo window lasts 60 days from TWILIO_DEMO_START (or the first SOS
//   event). After expiry, sends are refused with status "DEMO_EXPIRED" unless
//   TWILIO_PERMANENT=1 is set (i.e. real paid credentials were configured).

export const DEMO_WINDOW_DAYS = 60;

export interface TwilioConfig {
  configured: boolean;
  permanent: boolean;
}

export function twilioConfig(): TwilioConfig {
  const configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
  return { configured, permanent: process.env.TWILIO_PERMANENT === '1' };
}

/** Start of the 60-day demo window. */
export function demoWindowStart(firstEventAt?: Date | null): Date {
  const fromEnv = process.env.TWILIO_DEMO_START
    ? new Date(process.env.TWILIO_DEMO_START)
    : null;
  if (fromEnv && !Number.isNaN(fromEnv.getTime())) return fromEnv;
  if (firstEventAt && !Number.isNaN(firstEventAt.getTime())) return firstEventAt;
  return new Date();
}

export interface DemoStatus {
  demoActive: boolean;
  permanent: boolean;
  live: boolean; // real Twilio credentials present
  daysLeft: number;
  startedAt: string;
  endsAt: string;
  note: string;
}

export function demoStatus(firstEventAt?: Date | null): DemoStatus {
  const cfg = twilioConfig();
  const start = demoWindowStart(firstEventAt);
  const endsAt = new Date(start.getTime() + DEMO_WINDOW_DAYS * 86400_000);
  const msLeft = endsAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400_000));
  const demoActive = cfg.permanent || msLeft > 0;
  return {
    demoActive,
    permanent: cfg.permanent,
    live: cfg.configured,
    daysLeft: cfg.permanent ? DEMO_WINDOW_DAYS : daysLeft,
    startedAt: start.toISOString(),
    endsAt: endsAt.toISOString(),
    note: cfg.configured
      ? 'Live Twilio credentials detected — SMS will be sent for real.'
      : 'Demo mode: no Twilio credentials set — SMS payloads are simulated and logged, never sent.',
  };
}

export interface SendResult {
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'DEMO_EXPIRED';
  sid?: string;
  error?: string;
}

/** Normalise Indian numbers to +E.164 (10-digit → +91). */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.replace(/[\s()-]/g, '');
  // Indian 10-digit mobile (most common demo case) — must run first
  if (/^[6-9]\d{9}$/.test(trimmed)) return `+91${trimmed}`;
  // 91-prefixed Indian number without +
  if (/^91[6-9]\d{9}$/.test(trimmed)) return `+${trimmed}`;
  // Explicit international +E.164
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  return null;
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const cfg = twilioConfig();
  const status = demoStatus();
  if (!status.demoActive) {
    return { status: 'DEMO_EXPIRED', error: '60-day Twilio demo window has ended.' };
  }
  if (!cfg.configured) {
    // Simulated send — labelled, logged, never networked.
    return { status: 'SIMULATED', sid: `SIM${Date.now().toString(36).toUpperCase()}` };
  }
  try {
    // Lazy import keeps cold starts light and avoids loading the SDK in demo mode.
    const twilioModule = await import('twilio');
    const client = twilioModule.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
    const msg = await client.messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER!,
      body,
    });
    return { status: 'SENT', sid: msg.sid };
  } catch (err) {
    return {
      status: 'FAILED',
      error: err instanceof Error ? err.message : 'Twilio send failed',
    };
  }
}

export function buildSosBody(opts: {
  placeLabel?: string | null;
  lat?: number | null;
  lng?: number | null;
  extra?: string | null;
}): string {
  const where =
    opts.placeLabel ||
    (opts.lat != null && opts.lng != null
      ? `${opts.lat.toFixed(4)}, ${opts.lng.toFixed(4)}`
      : 'location unavailable');
  const maps =
    opts.lat != null && opts.lng != null
      ? ` Map: https://maps.google.com/?q=${opts.lat.toFixed(5)},${opts.lng.toFixed(5)}`
      : '';
  const extra = opts.extra ? ` Note: ${opts.extra}.` : '';
  return `SOS from JALGUARD demo. Location: ${where}.${extra}${maps}`;
}
