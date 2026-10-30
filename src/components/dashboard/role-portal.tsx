'use client';

/**
 * ROLE PORTAL — every role lands on its own cinematic, interactive
 * welcome page after sign-in. Accent identity, motif pattern, headline,
 * live stat trio and quick-action bento are all role-specific:
 *
 *   Citizen → Mint "Neighborhood Shield"      Municipal → Hydro Emerald "City Ops"
 *   Disaster → Critical Red "Crisis Command"  Field/Infra → Amber "Field Ops"
 *   Analyst → Electric Cyan "Signal Lab"      Org/Super Admin → Violet "Sovereign Console"
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { api } from '@/lib/client-api';
import { useAppStore, roleCanSee, type AppPage } from '@/lib/store';
import { cn } from '@/lib/utils';
import { SourceChip } from '@/components/shared/widgets';
import type { Role } from '@/lib/types';
import {
  Droplets, Building2, Siren, HardHat, Radar, Crown, ArrowRight, Map as MapIcon,
  AlertTriangle, BarChart3, Lightbulb, Users, Database, ScrollText, LayoutDashboard, Radio,
} from 'lucide-react';

type PortalKey = 'citizen' | 'municipal' | 'disaster' | 'field' | 'analyst' | 'admin';

type MotifKind = 'drops' | 'grid' | 'rays' | 'topo' | 'radar' | 'shield';

const PORTALS: Record<PortalKey, {
  accent: string; icon: typeof Droplets; motif: MotifKind;
}> = {
  citizen: { accent: '#4ADE80', icon: Droplets, motif: 'drops' },
  municipal: { accent: '#10D9A0', icon: Building2, motif: 'grid' },
  disaster: { accent: '#FF4D5E', icon: Siren, motif: 'rays' },
  field: { accent: '#FFB224', icon: HardHat, motif: 'topo' },
  analyst: { accent: '#00F2FE', icon: Radar, motif: 'radar' },
  admin: { accent: '#A78BFA', icon: Crown, motif: 'shield' },
};

function mapRole(role: Role | null): PortalKey {
  switch (role) {
    case 'citizen': return 'citizen';
    case 'municipal': return 'municipal';
    case 'disaster': return 'disaster';
    case 'field':
    case 'infra': return 'field';
    case 'analyst': return 'analyst';
    default: return 'admin'; // org_admin / super_admin
  }
}

const ACTIONS: Record<PortalKey, { page: AppPage; icon: typeof LayoutDashboard }[]> = {
  citizen: [
    { page: 'incidents', icon: AlertTriangle },
    { page: 'map', icon: MapIcon },
    { page: 'dashboard', icon: LayoutDashboard },
  ],
  municipal: [
    { page: 'dashboard', icon: LayoutDashboard },
    { page: 'map', icon: MapIcon },
    { page: 'analytics', icon: BarChart3 },
    { page: 'interventions', icon: Lightbulb },
  ],
  disaster: [
    { page: 'incidents', icon: AlertTriangle },
    { page: 'tasks', icon: HardHat },
    { page: 'map', icon: MapIcon },
    { page: 'dashboard', icon: LayoutDashboard },
  ],
  field: [
    { page: 'tasks', icon: HardHat },
    { page: 'map', icon: MapIcon },
    { page: 'incidents', icon: AlertTriangle },
    { page: 'dashboard', icon: LayoutDashboard },
  ],
  analyst: [
    { page: 'analytics', icon: BarChart3 },
    { page: 'map', icon: MapIcon },
    { page: 'interventions', icon: Lightbulb },
    { page: 'dashboard', icon: LayoutDashboard },
  ],
  admin: [
    { page: 'adminUsers', icon: Users },
    { page: 'dataSources', icon: Database },
    { page: 'audit', icon: ScrollText },
    { page: 'dashboard', icon: LayoutDashboard },
  ],
};

interface Totals { incidents: number; openIncidents: number; assessments: number; pendingRecs: number; activeTasks: number; critical: number }

/** reduced-motion-safe count-up */
function useCountUp(target: number, dur = 950) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const t0 = performance.now();
    const d = reduced ? 1 : dur;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / d);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

function Stat({ value, label, accent }: { value: number; label: string; accent: string }) {
  const v = useCountUp(value);
  return (
    <div className="hc-morph hc-morph-hover rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3.5">
      <div className="font-display text-[28px] font-bold leading-none tracking-tight" style={{ color: accent, textShadow: `0 0 22px ${accent}55` }}>
        {v}
      </div>
      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    </div>
  );
}

/** role-identity background motif (pure SVG, accent-tinted) */
function Motif({ kind, accent }: { kind: MotifKind; accent: string }) {
  const stroke = `${accent}2E`;
  const fill = `${accent}14`;
  switch (kind) {
    case 'drops':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          {[88, 66, 44, 24].map((r, i) => (
            <circle key={r} cx="150" cy="80" r={r} fill="none" stroke={stroke} strokeWidth="1.2" strokeDasharray={i % 2 ? '4 7' : undefined} />
          ))}
          <path d="M150 44c10 16 30 34 30 48a30 30 0 1 1-60 0c0-14 20-32 30-48Z" fill={fill} stroke={stroke} />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={120 + i * 18} y={26 + i * 10} width="26" height={160 - i * 22} rx="4" fill={i % 2 ? fill : 'none'} stroke={stroke} />
          ))}
        </svg>
      );
    case 'rays':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          {[0, 45, 90, 135].map((a) => (
            <line key={a} x1="150" y1="90" x2={150 + 78 * Math.cos((a * Math.PI) / 180)} y2={90 + 78 * Math.sin((a * Math.PI) / 180)} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          ))}
          <circle cx="150" cy="90" r="26" fill={fill} stroke={stroke} />
          <circle cx="150" cy="90" r="8" fill={accent} opacity="0.75" />
        </svg>
      );
    case 'topo':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M96 ${40 + i * 26} C 130 ${24 + i * 26}, 160 ${60 + i * 26}, 214 ${44 + i * 26}`} fill="none" stroke={stroke} strokeWidth="1.4" strokeDasharray={i % 2 ? '5 6' : undefined} />
          ))}
          <circle cx="168" cy="98" r="10" fill={fill} stroke={stroke} />
        </svg>
      );
    case 'radar':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          {[76, 54, 32, 12].map((r) => (
            <circle key={r} cx="150" cy="86" r={r} fill="none" stroke={stroke} strokeWidth="1.1" />
          ))}
          <line x1="150" y1="10" x2="150" y2="162" stroke={stroke} />
          <line x1="74" y1="86" x2="226" y2="86" stroke={stroke} />
          <path d="M150 86 L150 22 A64 64 0 0 1 205 55 Z" fill={fill} />
          <circle cx="178" cy="52" r="4" fill={accent} />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 220 220" className="absolute -right-8 -top-8 size-64 opacity-80">
          <path d="M150 22 208 46v46c0 40-24 66-58 84-34-18-58-44-58-84V46l58-24Z" fill="none" stroke={stroke} strokeWidth="1.6" />
          <path d="M150 52 182 66v28c0 24-14 40-32 52-18-12-32-28-32-52V66l32-14Z" fill={fill} stroke={stroke} />
        </svg>
      );
  }
}

export function RolePortal() {
  const t = useTranslations('portal');
  const tNav = useTranslations('app.nav');
  const setAppPage = useAppStore((s) => s.setAppPage);
  const user = useAppStore((s) => s.user);
  const region = useAppStore((s) => s.region);

  const key = mapRole(user?.role ?? null);
  const cfg = PORTALS[key];
  const Icon = cfg.icon;

  const [totals, setTotals] = useState<Totals | null>(null);
  const [wxStatus, setWxStatus] = useState<'LIVE' | 'SIMULATED'>('SIMULATED');
  const [today, setToday] = useState('');

  useEffect(() => {
    api<{ totals: Totals }>('/api/analytics').then((r) => setTotals(r.totals)).catch(() => {});
    fetch('/api/weather?lat=13.0827&lon=80.2707&city=Chennai')
      .then((r) => r.json())
      .then((w) => setWxStatus(w.status === 'LIVE' ? 'LIVE' : 'SIMULATED'))
      .catch(() => {});
    const id = window.setTimeout(
      () => setToday(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })),
      0
    );
    return () => window.clearTimeout(id);
  }, []);

  const resolved = totals ? Math.max(0, totals.incidents - totals.openIncidents) : 0;
  const stats: { val: number; label: string }[] = {
    citizen: [
      { val: totals?.openIncidents ?? 0, label: t('statOpen') },
      { val: totals?.incidents ?? 0, label: t('statReports') },
      { val: resolved, label: t('statResolved') },
    ],
    municipal: [
      { val: totals?.activeTasks ?? 0, label: t('statTasks') },
      { val: totals?.pendingRecs ?? 0, label: t('statRecs') },
      { val: totals?.incidents ?? 0, label: t('statIncidents') },
    ],
    disaster: [
      { val: totals?.critical ?? 0, label: t('statCritical') },
      { val: totals?.openIncidents ?? 0, label: t('statOpen') },
      { val: totals?.activeTasks ?? 0, label: t('statTasks') },
    ],
    field: [
      { val: totals?.activeTasks ?? 0, label: t('statTasks') },
      { val: totals?.openIncidents ?? 0, label: t('statOpen') },
      { val: totals?.critical ?? 0, label: t('statCritical') },
    ],
    analyst: [
      { val: totals?.assessments ?? 0, label: t('statAssess') },
      { val: totals?.pendingRecs ?? 0, label: t('statRecs') },
      { val: totals?.incidents ?? 0, label: t('statIncidents') },
    ],
    admin: [
      { val: totals?.incidents ?? 0, label: t('statIncidents') },
      { val: totals?.assessments ?? 0, label: t('statAssess') },
      { val: totals?.activeTasks ?? 0, label: t('statTasks') },
    ],
  }[key];

  const actions = ACTIONS[key].filter((a) => roleCanSee(user?.role ?? null, a.page));

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      className="space-y-5"
    >
      {/* ===== hero ===== */}
      <section
        className="hc-bento hc-morph relative overflow-hidden p-7 md:p-10"
        style={{ ['--pa' as string]: cfg.accent }}
      >
        <Motif kind={cfg.motif} accent={cfg.accent} />
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full blur-3xl"
          style={{ background: `${cfg.accent}1C` }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: cfg.accent, border: `1px solid ${cfg.accent}45`, background: `${cfg.accent}12` }}
            >
              <span className="size-1.5 rounded-full hc-blink-dot" style={{ background: cfg.accent, animation: 'hc-blink 2.1s ease-in-out infinite' }} />
              {t('kicker')} · {t(`role.${key}`)}
            </span>
            <SourceChip status={wxStatus} />
          </div>

          <h1 className="mt-5 max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight md:text-[42px]">
            {t(`${key}.title`)}
          </h1>
          <span className="mt-3 block h-[3px] w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${cfg.accent}, transparent)`, boxShadow: `0 0 14px ${cfg.accent}80` }} />
          <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground md:text-[14.5px]">
            {t(`${key}.sub`)}
          </p>

          {/* live stat trio */}
          <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((s) => (
              <Stat key={s.label} value={s.val} label={s.label} accent={cfg.accent} />
            ))}
          </div>

          {/* meta chips + CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAppPage('dashboard')}
              className="hc-cta flex h-11 items-center gap-2 px-6 text-[13.5px]"
            >
              {t('enter')}
              <ArrowRight className="size-4" />
            </button>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] text-muted-foreground">
              <Radio className="size-3" style={{ color: cfg.accent }} />
              {today || '—'}
            </span>
            {region && (
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] text-muted-foreground">
                {region}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== role quick actions ===== */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <Icon className="size-3.5" style={{ color: cfg.accent }} />
          {t('quick')}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {actions.map((a, i) => (
            <motion.button
              key={a.page}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              onClick={() => setAppPage(a.page)}
              className="hc-bento hc-morph hc-morph-hover group relative overflow-hidden p-5 text-left"
              style={{ ['--pa' as string]: cfg.accent }}
            >
              <span
                className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `${cfg.accent}30` }}
              />
              <span
                className="mb-4 flex size-10 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                style={{ background: `${cfg.accent}14`, border: `1px solid ${cfg.accent}38` }}
              >
                <a.icon className="size-4.5" style={{ color: cfg.accent }} />
              </span>
              <span className="block text-[13.5px] font-bold">{tNav(a.page === 'map' ? 'riskMap' : a.page)}</span>
              <span className="mt-3 flex items-center gap-1 text-[11px] font-semibold" style={{ color: cfg.accent }}>
                {t('open')}
                <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
