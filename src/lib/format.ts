/**
 * NaN-safe formatting helpers.
 *
 * Root cause of the historic "Received NaN for the `children` attribute"
 * console error: raw numeric expressions (`{value}`, `{a - b}`, `{x.toFixed(n)}`)
 * rendered inside spans while data was loading / missing, producing the number
 * NaN as a React child. Every numeric render in the workspace goes through
 * these helpers, which guarantee a string (or a fallback dash) — NaN as a
 * child can never reach the DOM again.
 */

export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Format a number for display; never returns a bare NaN number child. */
export function num(v: number | null | undefined, fallback = '0'): string {
  if (!isNum(v)) return fallback;
  return String(Math.round(v));
}

/** Fixed decimals; falls back cleanly for null / undefined / NaN. */
export function fixed(v: number | null | undefined, digits = 1, fallback = '0'): string {
  if (!isNum(v)) return fallback;
  return v.toFixed(digits);
}

/** Safe coordinate pair, e.g. "19.076, 72.878". */
export function coords(lat: number | null | undefined, lon: number | null | undefined): string {
  if (!isNum(lat) || !isNum(lon)) return '—';
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

/** Safe percent, e.g. "87%". */
export function pct(v: number | null | undefined, fallback = '—'): string {
  if (!isNum(v)) return fallback;
  return `${Math.round(v)}%`;
}

/** Relative "age" label like Fixly's table (7h, 2d, just now). */
export function age(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '—';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Short clock+date like "Apr 25, 9:24 AM". */
export function shortDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
