'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Siren, MapPin, Loader2, MessageSquareWarning, ShieldAlert, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SendState =
  | { phase: 'idle' }
  | { phase: 'locating' }
  | { phase: 'sending' }
  | {
      phase: 'done';
      results: { phone: string; status: string; error?: string | null }[];
      message: string;
      daysLeft?: number;
      live?: boolean;
    }
  | { phase: 'expired' }
  | { phase: 'error'; message: string };

interface DemoStatus {
  demoActive: boolean;
  live: boolean;
  daysLeft: number;
  note: string;
}

const CONTACTS_KEY = 'jg_sos_contacts';

export function SosButton() {
  const t = useTranslations('sos');
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<SendState>({ phase: 'idle' });
  const [demo, setDemo] = React.useState<DemoStatus | null>(null);
  const [contacts, setContacts] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [geo, setGeo] = React.useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [geoNote, setGeoNote] = React.useState<'pending' | 'ok' | 'denied' | 'idle'>('idle');

  // Load persisted contacts + demo status when opened
  React.useEffect(() => {
    if (!open) return;
    try {
      const saved = window.localStorage.getItem(CONTACTS_KEY);
      if (saved) setContacts(saved);
    } catch {
      /* private mode */
    }
    fetch('/api/sos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status: DemoStatus } | null) => d?.status && setDemo(d.status))
      .catch(() => {});
  }, [open]);

  const requestGeo = React.useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoNote('denied');
      return;
    }
    setGeoNote('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoNote('ok');
      },
      () => setGeoNote('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, []);

  // Reset per-open state
  React.useEffect(() => {
    if (open) {
      setState({ phase: 'idle' });
      requestGeo();
    } else {
      setGeo(null);
      setGeoNote('idle');
    }
  }, [open, requestGeo]);

  const preview = React.useMemo(() => {
    const where =
      place.trim() ||
      (geo ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : 'location unavailable');
    const maps = geo
      ? ` Map: https://maps.google.com/?q=${geo.lat.toFixed(5)},${geo.lng.toFixed(5)}`
      : '';
    return `SOS from JALGUARD demo. Location: ${where}.${maps}`;
  }, [place, geo]);

  async function send() {
    const list = contacts
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (list.length === 0) {
      setState({ phase: 'error', message: t('errorNoContacts') });
      return;
    }
    setState({ phase: 'sending' });
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: geo?.lat,
          lng: geo?.lng,
          accuracy: geo?.accuracy,
          placeLabel: place.trim() || undefined,
          contacts: list,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setState({ phase: 'expired' });
        return;
      }
      if (!res.ok) {
        setState({ phase: 'error', message: data.error ?? t('close') });
        return;
      }
      try {
        window.localStorage.setItem(CONTACTS_KEY, contacts);
      } catch {
        /* private mode */
      }
      setDemo((d) =>
        d
          ? { ...d, daysLeft: data.status?.daysLeft ?? d.daysLeft, live: data.status?.live ?? d.live }
          : d,
      );
      setState({
        phase: 'done',
        results: data.results ?? [],
        message: data.message ?? preview,
        daysLeft: data.status?.daysLeft,
        live: data.status?.live,
      });
    } catch {
      setState({ phase: 'error', message: 'Network error — please retry.' });
    }
  }

  const busy = state.phase === 'sending';
  const expired = state.phase === 'expired' || demo?.demoActive === false;

  return (
    <>
      {/* Floating trigger — 56px touch target, bottom-right, above everything */}
      <button
        type="button"
        aria-label={t('buttonLabel')}
        onClick={() => setOpen(true)}
        className="jg-sos-btn fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.55)] ring-1 ring-red-400/60 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:bottom-6 md:right-6"
      >
        <span className="jg-sos-pulse absolute inset-0 rounded-full bg-red-500/40" aria-hidden />
        <Siren className="relative h-6 w-6" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#07070c]/95 text-slate-100 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <Siren className="h-5 w-5 text-red-500" aria-hidden />
              {t('title')}
              {demo && (
                <span
                  className={cn(
                    'ml-auto rounded-full border px-2.5 py-1 font-mono text-xs',
                    demo.demoActive
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                      : 'border-red-400/40 bg-red-500/10 text-red-300',
                  )}
                >
                  {demo.demoActive ? t('daysLeft', { n: demo.daysLeft }) : t('resultDEMO_EXPIRED')}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">
              {t('subtitle')}
            </DialogDescription>
          </DialogHeader>

          {expired ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>{t('expired')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Demo honesty note */}
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 font-mono text-xs leading-relaxed text-slate-300">
                {demo?.note ?? t('demoNote')}
              </p>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="sos-place" className="text-sm text-slate-200">
                  {t('location')}
                </Label>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    geoNote === 'ok' && 'border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-300',
                    geoNote === 'denied' && 'border-amber-500/40 bg-amber-500/[0.07] text-amber-300',
                    (geoNote === 'pending' || geoNote === 'idle') &&
                      'border-slate-500/60 bg-white/[0.05] text-slate-300',
                  )}
                  role="status"
                >
                  {geoNote === 'pending' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 font-mono text-xs">
                    {geoNote === 'pending' && t('locating')}
                    {geoNote === 'ok' &&
                      geo &&
                      `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)} (±${Math.round(geo.accuracy ?? 0)}m)`}
                    {geoNote === 'denied' && t('locationDenied')}
                    {geoNote === 'idle' && '—'}
                  </span>
                </div>
                <Input
                  id="sos-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder={t('placePlaceholder')}
                  maxLength={120}
                  className="border-slate-500 bg-white/[0.06] text-slate-100 placeholder:text-slate-400 focus-visible:ring-cyan-400/60 dark:bg-white/[0.06]"
                />
              </div>

              {/* SMS preview */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-200">{t('messagePreview')}</Label>
                <div className="rounded-lg border border-cyan-400/25 bg-[#0d1420] p-3 font-mono text-xs leading-relaxed text-cyan-100/90">
                  {preview}
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-1.5">
                <Label htmlFor="sos-contacts" className="text-sm text-slate-200">
                  {t('contacts')}
                </Label>
                <Input
                  id="sos-contacts"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  placeholder={t('contactsPlaceholder')}
                  inputMode="tel"
                  className="border-slate-500 bg-white/[0.06] font-mono text-sm text-slate-100 placeholder:text-slate-400 focus-visible:ring-cyan-400/60 dark:bg-white/[0.06]"
                />
                <p className="text-xs text-slate-400">{t('contactsHint')}</p>
              </div>

              {/* Send */}
              {state.phase !== 'done' && (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={send}
                    className="h-12 w-full bg-red-600 text-base font-semibold text-white hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Siren className="mr-2 h-5 w-5" aria-hidden />
                        {t('send')}
                      </>
                    )}
                  </Button>
                  {state.phase === 'error' && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 text-sm text-red-300"
                    >
                      <MessageSquareWarning className="h-4 w-4" aria-hidden />
                      {state.message}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-slate-500">{t('consent')}</p>
                </>
              )}

              {/* Results */}
              {state.phase === 'done' && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 font-medium text-emerald-300">
                    <Siren className="h-4 w-4" aria-hidden />
                    {t('sentTitle')}
                  </p>
                  <ul className="space-y-1.5">
                    {state.results.map((r) => (
                      <li
                        key={r.phone}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                      >
                        <span className="font-mono text-sm text-slate-200">
                          {r.phone.replace(/\d(?=\d{2})/g, '•')}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 font-mono text-xs',
                            r.status === 'SENT' && 'bg-emerald-500/15 text-emerald-300',
                            r.status === 'SIMULATED' && 'bg-cyan-500/15 text-cyan-300',
                            r.status === 'FAILED' && 'bg-red-500/15 text-red-300',
                            r.status === 'DEMO_EXPIRED' && 'bg-amber-500/15 text-amber-300',
                          )}
                        >
                          {t(`result${r.status}` as Parameters<typeof t>[0])}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
