'use client';

/**
 * BENTO DASHBOARD — role-adaptive 3D bento-grid system.
 *
 * - Master control switch morphs the widget field between
 *   Citizen / Responder / Administrator views (600ms fluid curve).
 * - Left: interactive 3D hydro-terrain viewport (drag to orbit) with a
 *   liquid water grid that rises and shifts cyan → warning red as risk
 *   intensifies. `<spline-viewer>` slot overlays it when a scene URL is set.
 * - Every widget card uses the strict Hydro-Core glass token:
 *   rgba(14,22,38,.55) · blur 20 · border 7% · radius 20.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { api, timeAgo } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { SourceChip } from '@/components/shared/widgets';
import { IncidentCreateDialog, type Incident } from '@/components/app/incidents-view';
import type { Task } from '@/components/app/tasks-view';
import {
  Users, Siren, Building2, Droplets, Radio, ShieldAlert, Radar, MapPin, BatteryMedium,
  Navigation, Waves, Wind, Gauge, Droplet, TrendingUp, ChevronRight, Move3d, PhoneCall, Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
} from 'recharts';

interface Analytics {
  totals: { incidents: number; openIncidents: number; assessments: number; pendingRecs: number; activeTasks: number; critical: number };
  trend: { date: string; score: number }[];
}

type BentoView = 'citizen' | 'responder' | 'admin';

const STATUS_TAG: Record<string, string> = {
  OPEN: '#00F2FE',
  ACKNOWLEDGED: '#A78BFA',
  IN_PROGRESS: '#FFB224',
  ASSIGNED: '#FFB224',
  SUBMITTED: '#4CC3FF',
  RESOLVED: '#10D9A0',
  VERIFIED: '#10D9A0',
};

function tagColor(status: string): string {
  return STATUS_TAG[(status || '').toUpperCase()] ?? '#00F2FE';
}

/** deterministic pseudo-telemetry from an id (demo-labelled chips) */
function hashNum(id: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = Math.abs(h) % 100;
  return min + Math.round((n / 100) * (max - min));
}

// ============ 3D HYDRO TERRAIN VIEWPORT ============
function HydroTerrain({ critical, rainMm }: { critical: number; rainMm: number }) {
  const t = useTranslations('bento');
  const planeRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ on: boolean; x: number; y: number; rx: number; rz: number }>({ on: false, x: 0, y: 0, rx: 56, rz: -18 });
  const [rot, setRot] = useState({ rx: 56, rz: -18 });
  const [intensity, setIntensity] = useState(30);

  // derive initial intensity from live data
  useEffect(() => {
    setIntensity(Math.min(96, Math.round(critical * 11 + rainMm * 0.5 + 18)));
  }, [critical, rainMm]);

  useEffect(() => {
    const el = planeRef.current?.parentElement; // scene container
    if (!el) return;
    const down = (e: PointerEvent) => {
      drag.current = { on: true, x: e.clientX, y: e.clientY, rx: rot.rx, rz: rot.rz };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      setRot({
        rx: Math.max(26, Math.min(78, drag.current.rx - dy * 0.22)),
        rz: Math.max(-48, Math.min(48, drag.current.rz + dx * 0.22)),
      });
    };
    const up = () => { drag.current.on = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [rot.rx, rot.rz]);

  const hot = intensity >= 55;
  const waterZ = 4 + (intensity / 100) * 26;
  const levels = ['CALM', 'RAIN', 'FLOOD'] as const;
  const levelVal = { CALM: 18, RAIN: 52, FLOOD: 92 } as const;

  return (
    <div className="hc-bento hc-morph relative overflow-hidden p-4" data-testid="spline-dashboard-viewport">
      {/* spline embed slot — set SPLINE_DASHBOARD_SCENE_URL to overlay */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Radar className="size-3.5 text-[var(--hc-accent)]" />
          {t('terrainTitle')}
        </span>
        <SourceChip status={hot ? 'SIMULATED' : 'LIVE'} />
      </div>

      <div className="hc-terrain-scene relative h-[300px] cursor-grab touch-none select-none active:cursor-grabbing" style={{ ['--hc-accent' as string]: hot ? '#FF4D5E' : undefined }}>
        <div
          ref={planeRef}
          className="hc-terrain-plane absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) rotateX(${rot.rx}deg) rotateZ(${rot.rz}deg)` }}
        >
          {/* terrain slab */}
          <div
            className="absolute inset-0 rounded-[22px] border border-white/10"
            style={{
              background: `
                radial-gradient(120px 90px at 26% 30%, rgba(16,217,160,0.16), transparent 70%),
                radial-gradient(150px 110px at 74% 66%, rgba(0,242,254,0.13), transparent 70%),
                radial-gradient(90px 70px at 60% 22%, rgba(167,139,250,0.10), transparent 70%),
                linear-gradient(145deg, rgba(14,22,38,0.9), rgba(6,10,19,0.95))`,
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.55), 0 30px 60px -18px rgba(0,0,0,0.7)',
            }}
          >
            {/* street grid */}
            <div
              className="absolute inset-0 rounded-[22px] opacity-35"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                borderRadius: 'inherit',
                maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 95%)',
              }}
            />
            {/* river channel */}
            <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full opacity-70">
              <path d="M-8 210 C 60 196, 96 236, 150 218 S 246 178, 310 196" fill="none" stroke="rgba(0,242,254,0.5)" strokeWidth="7" strokeLinecap="round" />
              <path d="M-8 210 C 60 196, 96 236, 150 218 S 246 178, 310 196" fill="none" stroke="rgba(0,242,254,0.22)" strokeWidth="16" strokeLinecap="round" />
            </svg>

            {/* liquid water layer — rises & shifts colour with intensity */}
            <div
              className={cn('hc-water-layer absolute inset-1 rounded-[18px]', hot && 'hc-water-hot')}
              style={{ transform: `translateZ(${waterZ}px)`, opacity: 0.34 + (intensity / 100) * 0.4 }}
            />

            {/* vertical beacons (hotspots) */}
            {[
              { x: '24%', y: '30%', h: 34 + intensity * 0.3, c: hot ? '#FF4D5E' : '#00F2FE' },
              { x: '68%', y: '58%', h: 22 + intensity * 0.22, c: hot ? '#FFB224' : '#10D9A0' },
              { x: '46%', y: '74%', h: 16 + intensity * 0.16, c: '#A78BFA' },
            ].map((b, i) => (
              <div key={i} className="absolute" style={{ left: b.x, top: b.y, transform: `translateZ(${waterZ + 2}px)`, transformStyle: 'preserve-3d' }}>
                <div className="hc-beacon relative w-[3px]" style={{ height: b.h, transform: 'rotateX(-90deg)', transformOrigin: 'bottom center' }}>
                  <span className="absolute -top-[5px] left-1/2 size-[9px] -translate-x-1/2 rounded-full hc-blink-dot" style={{ background: b.c, boxShadow: `0 0 14px ${b.c}` }} />
                </div>
              </div>
            ))}
          </div>

          {/* ground glow */}
          <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] blur-2xl"
            style={{ background: hot ? 'rgba(255,77,94,0.16)' : 'rgba(0,242,254,0.14)', transform: `translate(-50%,-50%) rotateX(90deg) translateZ(-90px)` }} />
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/35 px-2 py-1 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/70">
            <Move3d className="size-3" /> {t('dragHint')}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md">
          <span className={cn('font-mono text-[13px] font-bold', hot ? 'text-[#FF4D5E]' : 'hc-num')}>{intensity}%</span>
        </div>
      </div>

      {/* water-level control */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {levels.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setIntensity(levelVal[lv])}
            className={cn(
              'hc-focusable rounded-lg border px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-all duration-300',
              Math.abs(intensity - levelVal[lv]) < 12
                ? 'border-[var(--hc-accent)]/60 bg-[var(--hc-accent)]/10 text-[var(--hc-accent)]'
                : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
            )}
          >
            {t(`level.${lv.toLowerCase()}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ SHARED BENTO PIECES ============
function BentoCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('hc-bento hc-morph hc-morph-hover p-5', className)}>{children}</div>;
}

function CardHead({ icon: Icon, title, accent, right }: { icon: typeof Droplets; title: string; accent?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${accent ?? 'var(--hc-accent)'} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${accent ?? 'var(--hc-accent)'} 30%, transparent)` }}>
          <Icon className="size-3.5" style={{ color: accent ?? 'var(--hc-accent)' }} />
        </span>
        {title}
      </span>
      {right}
    </div>
  );
}

// ============ MAIN ============
export function BentoDashboard() {
  const t = useTranslations('bento');
  const tStatus = useTranslations('app.status');
  const setAppPage = useAppStore((s) => s.setAppPage);
  const user = useAppStore((s) => s.user);

  const initialView: BentoView =
    user?.role === 'citizen' ? 'citizen'
      : user?.role && ['field', 'infra', 'disaster'].includes(user.role) ? 'responder'
        : 'admin';

  const [view, setView] = useState<BentoView>(initialView);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [wx, setWx] = useState<{ precipitation: number; windSpeed: number; humidity: number; status: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    api<{ incidents: Incident[] }>('/api/incidents').then((r) => setIncidents(r.incidents)).catch(() => {});
    api<{ tasks: Task[] }>('/api/tasks').then((r) => setTasks(r.tasks)).catch(() => {});
    api<Analytics>('/api/analytics').then(setAnalytics).catch(() => {});
    fetch('/api/weather?lat=13.0827&lon=80.2707&city=Chennai')
      .then((r) => r.json())
      .then((w) => setWx({ precipitation: w.current?.precipitation ?? 0, windSpeed: w.current?.windSpeed ?? 0, humidity: w.current?.humidity ?? 0, status: w.status ?? 'SIMULATED' }))
      .catch(() => {});
  }, []);

  const openIncidents = useMemo(() => incidents.filter((i) => !['RESOLVED'].includes(i.status.toUpperCase())), [incidents]);
  const mine = useMemo(() => {
    if (!user) return incidents.slice(0, 4);
    const own = incidents.filter((i) => i.reporterId === user.id);
    return (own.length > 0 ? own : incidents).slice(0, 4); // demo fallback keeps the grid alive
  }, [incidents, user]);
  const queue = useMemo(
    () => openIncidents
      .filter((i) => ['HIGH', 'CRITICAL'].includes(i.severity.toUpperCase()))
      .sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1) - (b.severity === 'CRITICAL' ? -1 : 1))
      .slice(0, 5),
    [openIncidents]
  );
  const dispatches = useMemo(() => tasks.filter((tk) => tk.status !== 'VERIFIED').slice(0, 4), [tasks]);
  const forecast = useMemo(() => {
    const trend = analytics?.trend ?? [];
    return trend.slice(-10).map((p, i) => ({ h: `-${trend.length - i}d`, v: p.score }));
  }, [analytics]);

  const views: { key: BentoView; icon: typeof Users; label: string }[] = [
    { key: 'citizen', icon: Users, label: t('viewCitizen') },
    { key: 'responder', icon: Siren, label: t('viewResponder') },
    { key: 'admin', icon: Building2, label: t('viewAdmin') },
  ];

  return (
    <div className="space-y-5">
      {/* master control header */}
      <div className="hc-bento hc-morph flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{t('sub')}</p>
        </div>
        <div className="flex items-center gap-2">
          <SourceChip status={wx?.status === 'LIVE' ? 'LIVE' : 'SIMULATED'} />
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={cn(
                  'hc-morph flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold',
                  view === v.key
                    ? 'bg-gradient-to-r from-[#00F2FE] to-[#059669] text-[#04121A] shadow-[0_0_18px_rgba(0,242,254,0.35)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <v.icon className="size-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        {/* 3D centerpiece */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <HydroTerrain critical={analytics?.totals.critical ?? 0} rainMm={wx?.precipitation ?? 0} />
        </div>

        {/* role bento field */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.99 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="space-y-5"
          >
            {view === 'citizen' && (
              <>
                <BentoCard className="relative overflow-hidden">
                  <div className="pointer-events-none absolute -right-10 -top-14 size-44 rounded-full bg-[#10D9A0]/15 blur-3xl" />
                  <CardHead icon={Radio} title={t('quickReport')} accent="#10D9A0" />
                  <p className="mb-4 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">{t('quickReportSub')}</p>
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="hc-focusable flex items-center gap-3 rounded-2xl border border-[#10D9A0]/40 bg-[#10D9A0]/10 px-5 py-4 text-left transition-transform duration-300 hover:scale-[1.015]"
                    style={{ animation: 'hc-pulse-green 2.4s cubic-bezier(0.4,0,0.6,1) infinite' }}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#10D9A0] text-[#04121A] shadow-[0_0_24px_rgba(16,217,160,0.5)]">
                      <Droplet className="size-5" />
                    </span>
                    <span>
                      <span className="block text-[14px] font-bold text-foreground">{t('quickReportCta')}</span>
                      <span className="block text-[11.5px] text-muted-foreground">{t('quickReportMeta')}</span>
                    </span>
                    <ChevronRight className="ml-auto size-4 text-[#10D9A0]" />
                  </button>
                </BentoCard>

                <BentoCard>
                  <CardHead icon={ShieldAlert} title={t('myIncidents')} accent="#A78BFA" right={<button onClick={() => setAppPage('incidents')} className="text-[11px] font-semibold text-[var(--hc-accent)] hover:underline">{t('seeAll')}</button>} />
                  <div className="space-y-2">
                    {mine.length === 0 && <p className="py-3 text-center text-[12px] text-muted-foreground">{t('empty')}</p>}
                    {mine.map((inc) => (
                      <button key={inc.id} onClick={() => setAppPage('incidents')} className="hc-morph group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-left hover:border-white/15">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-semibold">{inc.title}</span>
                          <span className="block text-[10.5px] text-muted-foreground">{inc.city} · {timeAgo(inc.createdAt)}</span>
                        </span>
                        <span className="hc-tag shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ ['--tag' as string]: tagColor(inc.status) }}>
                          {tStatus(inc.status.toUpperCase())}
                        </span>
                      </button>
                    ))}
                  </div>
                </BentoCard>

                <BentoCard>
                  <CardHead icon={Megaphone} title={t('advisories')} accent="#FFB224" />
                  <ul className="space-y-2.5">
                    {(['a1', 'a2', 'a3'] as const).map((k) => (
                      <li key={k} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#FFB224] shadow-[0_0_8px_#FFB224]" />
                        {t(`adv.${k}`)}
                      </li>
                    ))}
                  </ul>
                </BentoCard>
              </>
            )}

            {view === 'responder' && (
              <>
                <BentoCard className={cn(queue.length > 0 && '[animation:hc-breathe-red_2.6s_ease-in-out_infinite]')}>
                  <CardHead icon={Siren} title={t('queue')} accent="#FF4D5E" right={<span className="hc-tag rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ ['--tag' as string]: '#FF4D5E' }}>{queue.length} {t('live')}</span>} />
                  <div className="space-y-2">
                    {queue.length === 0 && <p className="py-3 text-center text-[12px] text-muted-foreground">{t('empty')}</p>}
                    {queue.map((inc, idx) => (
                      <button key={inc.id} onClick={() => setAppPage('incidents')} className={cn(
                        'hc-morph flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left',
                        idx === 0 ? 'border-[#FF4D5E]/40 bg-[#FF4D5E]/[0.06]' : 'border-white/[0.06] bg-white/[0.03] hover:border-white/15'
                      )}>
                        <PhoneCall className={cn('size-3.5 shrink-0', idx === 0 ? 'text-[#FF4D5E]' : 'text-muted-foreground')} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-semibold">{inc.title}</span>
                          <span className="block text-[10.5px] text-muted-foreground">{inc.city} · {timeAgo(inc.createdAt)}</span>
                        </span>
                        <span className="hc-tag shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ ['--tag' as string]: inc.severity.toUpperCase() === 'CRITICAL' ? '#FF4D5E' : '#FFB224' }}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </BentoCard>

                <BentoCard>
                  <CardHead icon={Navigation} title={t('dispatches')} accent="#FFB224" right={<button onClick={() => setAppPage('tasks')} className="text-[11px] font-semibold text-[var(--hc-accent)] hover:underline">{t('seeAll')}</button>} />
                  <div className="space-y-2">
                    {dispatches.length === 0 && <p className="py-3 text-center text-[12px] text-muted-foreground">{t('empty')}</p>}
                    {dispatches.map((tk) => {
                      const batt = 55 + hashNum(tk.id, 0, 44);
                      return (
                        <button key={tk.id} onClick={() => setAppPage('tasks')} className="hc-morph flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-left hover:border-white/15">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold">{tk.title}</span>
                            <span className="block truncate text-[10.5px] text-muted-foreground">{tk.assignedTo?.name ?? '—'} · {tk.city ?? '—'}</span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                            <span className="hc-tag rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ ['--tag' as string]: '#4CC3FF' }}>
                              <BatteryMedium className="mr-0.5 inline size-3" />{batt}%
                            </span>
                            <span className="hc-tag rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ ['--tag' as string]: '#10D9A0' }}>
                              <Navigation className="mr-0.5 inline size-3" />GPS
                            </span>
                          </span>
                          <span className="hc-tag shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ ['--tag' as string]: tagColor(tk.status) }}>
                            {tStatus(tk.status.toUpperCase())}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2.5 text-[10px] text-muted-foreground">{t('telemetryNote')}</p>
                </BentoCard>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  {[
                    { icon: Droplets, label: t('mRain'), val: `${(wx?.precipitation ?? 0).toFixed(1)}`, unit: 'mm' },
                    { icon: Wind, label: t('mWind'), val: `${Math.round(wx?.windSpeed ?? 0)}`, unit: 'km/h' },
                    { icon: Gauge, label: t('mHumidity'), val: `${Math.round(wx?.humidity ?? 0)}`, unit: '%' },
                    { icon: Waves, label: t('mFlow'), val: `${(1.2 + (wx?.precipitation ?? 0) * 0.14).toFixed(1)}`, unit: 'm³/s' },
                  ].map((m) => (
                    <BentoCard key={m.label} className="p-4">
                      <m.icon className="mb-2 size-4 text-[var(--hc-accent)]" />
                      <div className="hc-num text-[22px] font-bold leading-none">
                        {m.val}<span className="ml-0.5 text-[10px] text-muted-foreground">{m.unit}</span>
                      </div>
                      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{m.label}</div>
                    </BentoCard>
                  ))}
                </div>
              </>
            )}

            {view === 'admin' && (
              <>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                  {[
                    { label: t('kIncidents'), val: analytics?.totals.incidents ?? 0 },
                    { label: t('kOpen'), val: analytics?.totals.openIncidents ?? 0 },
                    { label: t('kCritical'), val: analytics?.totals.critical ?? 0 },
                    { label: t('kTasks'), val: analytics?.totals.activeTasks ?? 0 },
                  ].map((k) => (
                    <BentoCard key={k.label} className="p-4">
                      <div className="font-display text-[30px] font-bold leading-none tracking-tight">{k.val}</div>
                      <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
                    </BentoCard>
                  ))}
                </div>

                <BentoCard>
                  <CardHead icon={TrendingUp} title={t('forecast')} accent="#00F2FE" right={<span className="hc-tag rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ ['--tag' as string]: '#A78BFA' }}>DEMO</span>} />
                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecast} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="hcGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#00F2FE" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.14)" />
                        <XAxis dataKey="h" tick={{ fontSize: 10, fill: 'rgba(140,160,185,0.8)' }} stroke="rgba(128,140,160,0.4)" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(140,160,185,0.8)' }} stroke="rgba(128,140,160,0.4)" />
                        <RTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                        <Area type="monotone" dataKey="v" stroke="#00F2FE" strokeWidth={2.4} fill="url(#hcGlow)"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.6))' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-muted-foreground">{t('forecastNote')}</p>
                </BentoCard>

                <BentoCard>
                  <CardHead icon={Building2} title={t('audit')} accent="#A78BFA" right={<button onClick={() => setAppPage('incidents')} className="text-[11px] font-semibold text-[var(--hc-accent)] hover:underline">{t('seeAll')}</button>} />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.07] text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          <th className="pb-2 pr-3">{t('colDistrict')}</th>
                          <th className="pb-2 pr-3 text-right">{t('colIncidents')}</th>
                          <th className="pb-2 pr-3 text-right">{t('colCritical')}</th>
                          <th className="pb-2 text-right">{t('colOpen')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          incidents.reduce<Record<string, { n: number; crit: number; open: number }>>((acc, i) => {
                            const c = acc[i.city] ?? { n: 0, crit: 0, open: 0 };
                            c.n++;
                            if (i.severity.toUpperCase() === 'CRITICAL') c.crit++;
                            if (!['RESOLVED'].includes(i.status.toUpperCase())) c.open++;
                            acc[i.city] = c;
                            return acc;
                          }, {})
                        ).slice(0, 7).map(([city, s]) => (
                          <tr key={city} className="hc-morph border-b border-white/[0.04] text-[12.5px] last:border-0 hover:bg-white/[0.03]">
                            <td className="py-2 pr-3 font-semibold">{city}</td>
                            <td className="py-2 pr-3 text-right font-mono text-muted-foreground">{s.n}</td>
                            <td className="py-2 pr-3 text-right font-mono" style={{ color: s.crit ? '#FF4D5E' : 'var(--muted-foreground)' }}>{s.crit}</td>
                            <td className="py-2 text-right font-mono" style={{ color: s.open ? '#FFB224' : 'var(--muted-foreground)' }}>{s.open}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BentoCard>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <IncidentCreateDialog open={reportOpen} onClose={() => setReportOpen(false)} onCreated={() => api<{ incidents: Incident[] }>('/api/incidents').then((r) => setIncidents(r.incidents)).catch(() => {})} />
    </div>
  );
}
