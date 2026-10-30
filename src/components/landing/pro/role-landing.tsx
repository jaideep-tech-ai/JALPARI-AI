'use client';

/**
 * ROLE LANDING — the ReactBits Pro editorial landing page every role
 * sees after signing in (replaces the old RolePortal card grid).
 *
 * Structure (Sparkdesign photography + Imageworks motion):
 *   ProNav → Hero (photo tabs) → Trust marquee → Live pulse → Function tabs
 *   → Workflow tabs → Modules grid + preview → Benchmark + timeline
 *   → Stories (auto-rotate) → Plans → FAQ → Closing CTA (dot field + helix)
 *   → ProFooter
 *
 * Light-only. Instrument Sans. reduced-motion disciplined. EN/हिन्दी.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Droplets, Building2, Siren, HardHat, Radar, Crown, ArrowRight, ArrowUpRight,
  Map as MapIcon, AlertTriangle, BarChart3, Lightbulb, Users, Database, ScrollText,
  LayoutDashboard, Check, Sparkles, Quote, type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/client-api';
import { useAppStore, roleCanSee, type AppPage } from '@/lib/store';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProNav, type ProNavSection } from './pro-nav';
import { Reveal, DotField, CountUp, PillTabs, Marquee, Faq, ProFooter } from './pro-kit';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type PortalKey = 'citizen' | 'municipal' | 'disaster' | 'field' | 'analyst' | 'admin';

interface Totals {
  incidents: number; openIncidents: number; assessments: number;
  pendingRecs: number; activeTasks: number; critical: number;
}

/* ------------------------------------------------------------------ */
/* Role configuration                                                  */
/* ------------------------------------------------------------------ */
const ROLE_CFG: Record<PortalKey, {
  accent: string; icon: LucideIcon; imgs: [string, string, string];
}> = {
  citizen:   { accent: '#16A34A', icon: Droplets,  imgs: ['/images/landing/monsoon-3.jpg',     '/images/landing/rescue-2.jpg',      '/images/landing/river-city-1.jpg'] },
  municipal: { accent: '#0F766E', icon: Building2, imgs: ['/images/landing/river-city-1.jpg',  '/images/landing/flood-street-1.jpg','/images/landing/river-city-2.jpg'] },
  disaster:  { accent: '#DC2626', icon: Siren,     imgs: ['/images/landing/flood-street-2.jpg','/images/landing/rescue-1.jpg',      '/images/landing/monsoon-2.jpg'] },
  field:     { accent: '#B45309', icon: HardHat,   imgs: ['/images/landing/rescue-3.jpg',      '/images/landing/flood-street-4.jpg','/images/landing/monsoon-4.jpg'] },
  analyst:   { accent: '#0891B2', icon: Radar,     imgs: ['/images/landing/river-city-3.jpg',  '/images/landing/river-city-4.jpg',  '/images/landing/flood-street-5.jpg'] },
  admin:     { accent: '#7C3AED', icon: Crown,     imgs: ['/images/landing/river-city-2.jpg',  '/images/landing/river-city-1.jpg',  '/images/landing/rescue-4.jpg'] },
};

function mapRole(role: Role | null): PortalKey {
  switch (role) {
    case 'citizen': return 'citizen';
    case 'municipal': return 'municipal';
    case 'disaster': return 'disaster';
    case 'field':
    case 'infra': return 'field';
    case 'analyst': return 'analyst';
    default: return 'admin';
  }
}

/* module catalogue: page → { icon, group } */
const MODULE_META: Record<AppPage, { icon: LucideIcon; group: 'map' | 'data' | 'action' | 'gov' }> = {
  portal:        { icon: Sparkles,        group: 'data' },
  dashboard:     { icon: LayoutDashboard, group: 'data' },
  bento:         { icon: LayoutDashboard, group: 'data' },
  map:           { icon: MapIcon,         group: 'map' },
  incidents:     { icon: AlertTriangle,   group: 'map' },
  interventions: { icon: Lightbulb,       group: 'action' },
  tasks:         { icon: HardHat,         group: 'action' },
  analytics:     { icon: BarChart3,       group: 'data' },
  adminUsers:    { icon: Users,           group: 'gov' },
  dataSources:   { icon: Database,        group: 'gov' },
  audit:         { icon: ScrollText,      group: 'gov' },
  settings:      { icon: Users,           group: 'gov' },
  help:          { icon: Users,           group: 'gov' },
};

const ROLE_MODULES: Record<PortalKey, AppPage[]> = {
  citizen:   ['incidents', 'map', 'dashboard'],
  municipal: ['dashboard', 'map', 'analytics', 'interventions', 'incidents'],
  disaster:  ['incidents', 'tasks', 'map', 'dashboard'],
  field:     ['tasks', 'map', 'incidents', 'dashboard'],
  analyst:   ['analytics', 'map', 'interventions', 'dashboard'],
  admin:     ['adminUsers', 'dataSources', 'audit', 'dashboard'],
};

const GROUPS = ['all', 'map', 'data', 'action', 'gov'] as const;
type GroupKey = (typeof GROUPS)[number];

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */
export function SectionHead({ kicker, title, sub, center }: {
  kicker: string; title: string; sub?: string; center?: boolean;
}) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <span className="pro-eyebrow">{kicker}</span>
      <h2 className="pro-display mt-4 text-3xl md:text-[2.6rem]">{title}</h2>
      {sub && <p className="pro-lead mt-4">{sub}</p>}
    </Reveal>
  );
}

/* animated paired bars — Imageworks baseline pattern */
export function BenchRow({ label, unit, before, after, delay, accent }: {
  label: string; unit: string; before: number; after: number; delay: number; accent: string;
}) {
  const reduced = useReducedMotion();
  // guard: i18n or API drift must never render "NaN" into the DOM
  const b = Number.isFinite(before) ? before : 0;
  const a = Number.isFinite(after) ? after : 0;
  const max = Math.max(b, a) || 1;
  return (
    <Reveal delay={delay}>
      <div className="pro-card-flat p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[14.5px] font-semibold text-[color:var(--pro-ink)]">{label}</div>
          <div className="text-[11.5px] font-medium text-[color:var(--pro-muted)]">{unit}</div>
        </div>
        <div className="mt-5 space-y-3.5">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-[color:var(--pro-muted)]">
              <span className="uppercase tracking-[0.1em]">Reactive</span>
              <span className="font-mono text-[13px] font-semibold text-[color:var(--pro-ink)]">{b}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[color:var(--pro-paper-2)]">
              <motion.div
                className="h-full rounded-full bg-[#9AA7A0]"
                initial={reduced ? false : { width: 0 }}
                whileInView={{ width: `${(b / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-[color:var(--pro-muted)]">
              <span className="uppercase tracking-[0.1em] text-[color:var(--pro-accent-ink)]">With JALGUARD</span>
              <span className="font-mono text-[13px] font-semibold" style={{ color: accent }}>{a}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[color:var(--pro-paper-2)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={reduced ? false : { width: 0 }}
                whileInView={{ width: `${(a / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: delay + 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* auto-rotating stories — Imageworks client-tab pattern */
export function Stories({ t }: { t: (k: string) => string }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const n = 3;
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % n), 5200);
    return () => window.clearInterval(id);
  }, [reduced]);
  const stories = [0, 1, 2].map((k) => ({
    quote: t(`story${k + 1}`), who: t(`story${k + 1}Who`), where: t(`story${k + 1}Where`),
  }));
  const s = stories[i];
  return (
    <div className="pro-card-flat relative overflow-hidden p-7 md:p-10">
      <Quote className="absolute -top-3 right-6 size-24 text-[color:var(--pro-sage)]/15" aria-hidden />
      <AnimatePresence mode="wait">
        <motion.figure
          key={i}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <blockquote className="pro-display max-w-3xl text-xl font-semibold leading-snug text-[color:var(--pro-ink)] md:text-[1.7rem]">
            “{s.quote}”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[color:var(--pro-sage-soft)] text-[color:var(--pro-accent-ink)]">
              <Users className="size-4.5" aria-hidden />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-[color:var(--pro-ink)]">{s.who}</span>
              <span className="block text-[12.5px] text-[color:var(--pro-muted)]">{s.where}</span>
            </span>
          </figcaption>
        </motion.figure>
      </AnimatePresence>
      <div className="mt-7 flex gap-2">
        {stories.map((_, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Story ${k + 1}`}
            onClick={() => setI(k)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              k === i ? 'w-9 bg-[color:var(--pro-accent)]' : 'w-4 bg-[color:var(--pro-line-strong)] hover:bg-[color:var(--pro-muted)]',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export function RoleLanding() {
  const tP = useTranslations('pro');
  const tPortal = useTranslations('portal');
  const tNav = useTranslations('app.nav');
  const { user, setAppPage, setView, region } = useAppStore();
  const key = mapRole(user?.role ?? null);
  const cfg = ROLE_CFG[key];
  const RoleIcon = cfg.icon;

  const [totals, setTotals] = useState<Totals | null>(null);
  const [heroTab, setHeroTab] = useState('0');
  const [fnTab, setFnTab] = useState('mon');
  const [wfTab, setWfTab] = useState('0');
  const [group, setGroup] = useState<GroupKey>('all');
  const [preview, setPreview] = useState<AppPage | null>(null);
  const reduced = useReducedMotion();
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ totals: Totals }>('/api/analytics').then((r) => setTotals(r.totals)).catch(() => {});
  }, []);

  const modules = useMemo(
    () => ROLE_MODULES[key].filter((p) => roleCanSee(user?.role ?? null, p)),
    [key, user?.role],
  );
  const filtered = group === 'all' ? modules : modules.filter((p) => MODULE_META[p].group === group);

  const readiness = totals ? Math.min(98, Math.max(62, 100 - totals.critical * 3)) : 0;
  const signals = totals ? totals.incidents + totals.assessments + totals.activeTasks : 0;

  const sections: ProNavSection[] = [
    { id: 'functions', label: tP('fnKicker') },
    { id: 'workflow', label: tP('wfKicker') },
    { id: 'modules', label: tP('modKicker') },
    { id: 'benchmark', label: tP('benchKicker') },
    { id: 'plans', label: tP('planKicker') },
    { id: 'faq', label: tP('faqKicker') },
  ];

  const heroImages = cfg.imgs.map((src, i) => ({ src, tag: tP(`rlHeroTag${i + 1}` as 'rlHeroTag1') }));
  const hero = heroImages[Number(heroTab)];
  const fnOn = fnTab === 'mon';
  const wfData = [0, 1, 2].map((k) => ({
    title: tP(`wf${k + 1}Title` as 'wf1Title'),
    body: tP(`wf${k + 1}Body` as 'wf1Body'),
    tab: tP(`wfTab${k + 1}` as 'wfTab1'),
    img: cfg.imgs[k],
    imgTag: tP(`wfImgTag${k + 1}` as 'wfImgTag1'),
  }));
  const wf = wfData[Number(wfTab)];

  const bench = [
    { label: tP('benchCol1'), unit: tP('benchUnit1'), before: tP('benchBefore1' as 'benchBefore1'), after: tP('benchAfter1' as 'benchAfter1') },
    { label: tP('benchCol2'), unit: tP('benchUnit2'), before: tP('benchBefore2' as 'benchBefore2'), after: tP('benchAfter2' as 'benchAfter2') },
    { label: tP('benchCol3'), unit: tP('benchUnit3'), before: tP('benchBefore3' as 'benchBefore3'), after: tP('benchAfter3' as 'benchAfter3') },
    { label: tP('benchCol4'), unit: tP('benchUnit4'), before: tP('benchBefore4' as 'benchBefore4'), after: tP('benchAfter4' as 'benchAfter4') },
  ];
  const timeline = tP.raw('benchTimeline') as { when: string; what: string }[];

  const plans = [
    { name: tP('plan1Name'), price: tP('plan1Price'), per: tP('plan1Per'), desc: tP('plan1Desc'),
      feats: [tP('plan1F1'), tP('plan1F2'), tP('plan1F3')], hot: false },
    { name: tP('plan2Name'), price: tP('plan2Price'), per: tP('plan2Per'), desc: tP('plan2Desc'),
      feats: [tP('plan2F1'), tP('plan2F2'), tP('plan2F3')], hot: key !== 'citizen' && key !== 'admin' },
    { name: tP('plan3Name'), price: tP('plan3Price'), per: tP('plan3Per'), desc: tP('plan3Desc'),
      feats: [tP('plan3F1'), tP('plan3F2'), tP('plan3F3')], hot: key === 'admin' },
  ];

  const faqItems = [1, 2, 3, 4, 5].map((k) => ({
    q: tP(`faq${k}Q` as 'faq1Q'), a: tP(`faq${k}A` as 'faq1A'),
  }));

  const pageTitle = (p: AppPage) => tNav(p === 'map' ? 'riskMap' : p as 'dashboard');

  function openModule(p: AppPage) {
    setAppPage(p);
    setView('app');
  }

  const PreviewIcon = preview ? MODULE_META[preview].icon : Sparkles;

  return (
    <div className="pro-root min-h-screen" style={{ ['--pro-accent' as string]: cfg.accent }}>
      <ProNav sections={sections} ctaLabel={tP('workspace')} />

      {/* ================= HERO ================= */}
      <header className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <DotField density={30} color="rgba(22,33,29,0.10)" accent={`${cfg.accent}66`} />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--pro-line)] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[color:var(--pro-muted)] shadow-[var(--pro-shadow)]">
                <span className="pro-live-dot" aria-hidden />
                {tPortal(`role.${key}` as 'role.citizen')} · {tP('heroLive')}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="pro-display mt-5 text-[2.6rem] leading-[1.04] md:text-[3.4rem]">
                {tPortal(`${key}.title` as 'citizen.title')}
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="pro-lead mt-5 max-w-xl">{tPortal(`${key}.sub` as 'citizen.sub')}</p>
            </Reveal>
            <Reveal delay={0.24} className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => openModule('dashboard')} className="pro-btn pro-btn-accent">
                {tP('heroCta')} <ArrowRight className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => openModule('map')} className="pro-btn pro-btn-ghost">
                <MapIcon className="size-4" aria-hidden /> {tP('heroCta2')}
              </button>
              {region && (
                <span className="rounded-full border border-[color:var(--pro-line)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[color:var(--pro-muted)]">
                  {region}
                </span>
              )}
            </Reveal>
            <Reveal delay={0.32} className="mt-9 grid max-w-md grid-cols-3 gap-5">
              {[
                { v: signals, label: tP('heroStatA') },
                { v: 12, label: tP('heroStatB') },
                { v: readiness, label: tP('heroStatC'), suffix: '%' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="pro-display text-[1.65rem]" style={{ color: cfg.accent }}>
                    <CountUp value={s.v} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pro-muted)]">{s.label}</div>
                </div>
              ))}
            </Reveal>
          </div>

          {/* photography stack with 3 tabs — Sparkdesign signature */}
          <Reveal delay={0.15} y={34}>
            <div className="relative">
              <PillTabs
                idBase="role-hero"
                className="relative z-10 mb-4"
                tabs={heroImages.map((h, i) => ({ key: String(i), label: h.tag }))}
                active={heroTab}
                onChange={setHeroTab}
              />
              <div className="pro-img aspect-[4/3] w-full">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={hero.src}
                    src={hero.src}
                    alt={hero.tag}
                    initial={reduced ? false : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <span className="pro-img-tag"><span className="pro-live-dot" aria-hidden /> {hero.tag}</span>
              </div>
              {/* floating companion tile + sensor chip */}
              <div className="pro-img pro-float absolute -bottom-8 -left-4 hidden w-40 aspect-square md:block lg:-left-10 lg:w-48">
                <img src={cfg.imgs[1]} alt="" />
              </div>
              <div className="pro-card absolute -top-5 right-3 hidden max-w-[240px] items-start gap-2.5 p-3.5 md:flex">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${cfg.accent}14`, color: cfg.accent }}>
                  <RoleIcon className="size-3.5" aria-hidden />
                </span>
                <span className="text-[12px] font-medium leading-snug text-[color:var(--pro-muted)]">
                  <CountUp value={totals?.openIncidents ?? 0} className="font-semibold text-[color:var(--pro-ink)]" /> {tPortal('statOpen')} · {tP('pulseKicker')}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      {/* ================= TRUST MARQUEE ================= */}
      <section className="border-y border-[color:var(--pro-line)] bg-white py-5">
        <Marquee items={[tP('trust1'), tP('trust2'), tP('trust3'), tP('trust4'), tP('trust5'), tP('trust6'), tP('trust7'), tP('trust8')]} />
      </section>

      {/* ================= FUNCTION TABS ================= */}
      <section id="functions" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('fnKicker')} title={tP('fnTitle')} />
          <Reveal delay={0.1} className="mt-7">
            <PillTabs
              idBase="role-fn"
              tabs={[{ key: 'mon', label: tP('fnTab1') }, { key: 'act', label: tP('fnTab2') }]}
              active={fnTab}
              onChange={setFnTab}
            />
          </Reveal>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
            <AnimatePresence mode="wait">
              <motion.div
                key={fnTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="pro-display text-2xl md:text-[1.8rem]">{fnOn ? tP('fnMonTitle') : tP('fnActTitle')}</h3>
                <p className="pro-lead mt-4">{fnOn ? tP('fnMonBody') : tP('fnActBody')}</p>
                <ul className="mt-6 space-y-3">
                  {(fnOn ? [tP('fnMonA'), tP('fnMonB'), tP('fnMonC')] : [tP('fnActA'), tP('fnActB'), tP('fnActC')]).map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14.5px] font-medium text-[color:var(--pro-ink)]/85">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: `${cfg.accent}18`, color: cfg.accent }}>
                        <Check className="size-3" aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* console mock preview */}
            <Reveal delay={0.12}>
              <div className="pro-card-flat overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[color:var(--pro-line)] bg-[color:var(--pro-paper)] px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-[#E8E4DC]" aria-hidden />
                  <span className="size-2.5 rounded-full bg-[#E8E4DC]" aria-hidden />
                  <span className="size-2.5 rounded-full bg-[#E8E4DC]" aria-hidden />
                  <span className="ml-2 text-[11.5px] font-semibold text-[color:var(--pro-muted)]">{tP('fnPreviewTag')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 p-4">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="rounded-xl border border-[color:var(--pro-line)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--pro-muted)]">
                          {k === 0 ? tP('heroStatA') : k === 1 ? tP('benchCol3') : tP('heroStatC')}
                        </span>
                        <span className="pro-live-dot" aria-hidden />
                      </div>
                      <div className="pro-display mt-2 text-xl" style={{ color: k === 1 ? '#B45309' : cfg.accent }}>
                        <CountUp value={k === 0 ? signals : k === 1 ? (totals?.critical ?? 0) : readiness} suffix={k === 2 ? '%' : ''} />
                      </div>
                      <div className="mt-2.5 flex h-10 items-end gap-1" aria-hidden>
                        {[34, 58, 41, 72, 55, 88, 63, 47, 78, 52].map((h, j) => (
                          <span
                            key={j}
                            className="pro-bar w-full rounded-sm"
                            style={{ height: `${h}%`, background: k === 1 ? '#D9A08C66' : `${cfg.accent}33`, animationDelay: `${j * 60}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                  {(fnOn ? [tP('fnMonA'), tP('fnMonB')] : [tP('fnActA'), tP('fnActB')]).map((f, k) => (
                    <div key={k} className="flex items-center gap-2.5 rounded-xl bg-[color:var(--pro-paper)] px-3.5 py-3 text-[12.5px] font-medium text-[color:var(--pro-ink)]/80">
                      <span className="pro-live-dot shrink-0" aria-hidden /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW TABS ================= */}
      <section id="workflow" className="pro-band scroll-mt-24 border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('wfKicker')} title={tP('wfTitle')} />
          <Reveal delay={0.1} className="mt-7">
            <PillTabs
              idBase="role-wf"
              tabs={wfData.map((w, i) => ({ key: String(i), label: w.tab }))}
              active={wfTab}
              onChange={setWfTab}
            />
          </Reveal>
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={wfTab}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="pro-display text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: cfg.accent }}>
                  {String(Number(wfTab) + 1).padStart(2, '0')} — {wf.tab}
                </span>
                <h3 className="pro-display mt-3 text-2xl md:text-[1.8rem]">{wf.title}</h3>
                <p className="pro-lead mt-4">{wf.body}</p>
                <button type="button" onClick={() => openModule('bento')} className="pro-btn pro-btn-primary mt-7">
                  {tP('wfCta')} <ArrowUpRight className="size-4" aria-hidden />
                </button>
              </motion.div>
            </AnimatePresence>
            <Reveal delay={0.1}>
              <div className="pro-img aspect-[16/10] w-full">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={wf.img}
                    src={wf.img}
                    alt={wf.imgTag}
                    initial={reduced ? false : { opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <span className="pro-img-tag">{wf.imgTag}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= MODULES GRID ================= */}
      <section id="modules" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('modKicker')} title={tP('modTitle')} sub={tP('modSub')} />
          <Reveal delay={0.08} className="mt-7">
            <PillTabs
              idBase="role-mods"
              tabs={GROUPS.map((g) => ({ key: g, label: g === 'all' ? tP('modAll') : tP(`grp${g[0].toUpperCase()}${g.slice(1)}` as 'grpMap') }))}
              active={group}
              onChange={(k) => setGroup(k as GroupKey)}
            />
          </Reveal>
          <motion.div layout className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => {
                const meta = MODULE_META[p];
                const Icon = meta.icon;
                return (
                  <motion.article
                    layout
                    key={p}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="pro-card group flex flex-col p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-2xl" style={{ background: `${cfg.accent}12`, color: cfg.accent }}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="rounded-full border border-[color:var(--pro-line)] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--pro-muted)]">
                        {tP(`grp${meta.group[0].toUpperCase()}${meta.group.slice(1)}` as 'grpMap')}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[16.5px] font-bold text-[color:var(--pro-ink)]">{pageTitle(p)}</h3>
                    <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-[color:var(--pro-muted)]">{tP(`mod${p[0].toUpperCase()}${p.slice(1)}` as 'modMap')}</p>
                    <div className="mt-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openModule(p)}
                        className="pro-btn pro-btn-primary h-9 flex-1 text-[12.5px]"
                      >
                        {tP('modOpen')} <ArrowRight className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreview(p)}
                        className="pro-btn pro-btn-ghost h-9 px-3.5 text-[12.5px]"
                      >
                        {tP('modPreview')}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ================= BENCHMARK + TIMELINE ================= */}
      <section id="benchmark" className="pro-band scroll-mt-24 border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('benchKicker')} title={tP('benchTitle')} sub={tP('benchSub')} />
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {bench.map((b, i) => (
              <BenchRow
                key={b.label}
                label={b.label}
                unit={b.unit}
                before={Number(b.before)}
                after={Number(b.after)}
                delay={i * 0.06}
                accent={cfg.accent}
              />
            ))}
          </div>
          <Reveal delay={0.1} className="mt-10">
            <h3 className="pro-display text-xl md:text-2xl">{tP('benchTimelineTitle')}</h3>
          </Reveal>
          <div className="relative mt-6 space-y-0">
            {timeline.map((item, i) => (
              <Reveal key={item.when} delay={i * 0.05}>
                <div className="relative grid grid-cols-[112px_1fr] gap-4 border-l border-[color:var(--pro-line)] py-4 pl-6 md:grid-cols-[140px_1fr]">
                  <span
                    className="absolute -left-[5px] top-7 size-2.5 rounded-full ring-4 ring-[color:var(--pro-paper)]"
                    style={{ background: cfg.accent }}
                    aria-hidden
                  />
                  <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[color:var(--pro-accent-ink)] pt-1">{item.when}</span>
                  <span className="text-[14.5px] leading-relaxed text-[color:var(--pro-ink)]/85">{item.what}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}><p className="mt-4 text-[12px] italic text-[color:var(--pro-muted)]">{tP('benchNote')}</p></Reveal>
        </div>
      </section>

      {/* ================= STORIES ================= */}
      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('storyKicker')} title={tP('storyTitle')} />
          <Reveal delay={0.1} className="mt-8"><Stories t={(k) => tP(k as 'story1')} /></Reveal>
        </div>
      </section>

      {/* ================= PLANS ================= */}
      <section id="plans" className="pro-band scroll-mt-24 border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('planKicker')} title={tP('planTitle')} sub={tP('planSub')} center />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.08}>
                <div
                  className={cn(
                    'pro-card relative flex h-full flex-col p-7',
                    plan.hot && 'border-2',
                  )}
                  style={plan.hot ? { borderColor: cfg.accent } : undefined}
                >
                  {plan.hot && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white"
                      style={{ background: cfg.accent }}
                    >
                      {tP('plan2Tag')}
                    </span>
                  )}
                  <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-[color:var(--pro-muted)]">{plan.name}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="pro-display text-[2.2rem]">{plan.price}</span>
                    <span className="text-[12.5px] text-[color:var(--pro-muted)]">/ {plan.per}</span>
                  </div>
                  <p className="pro-lead mt-3 text-[14px]">{plan.desc}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.feats.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] font-medium text-[color:var(--pro-ink)]/85">
                        <Check className="mt-0.5 size-4 shrink-0" style={{ color: cfg.accent }} aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className={cn('pro-btn mt-7 w-full', plan.hot ? 'pro-btn-accent' : 'pro-btn-ghost')}
                  >
                    {tP('planCta')}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.4fr]">
          <SectionHead kicker={tP('faqKicker')} title={tP('faqTitle')} />
          <Reveal delay={0.08}><Faq items={faqItems} /></Reveal>
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section ref={ctaRef} className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 rounded-[2.5rem] mx-3 md:mx-6 overflow-hidden bg-[#0D1713]">
          <DotField density={34} color="rgba(255,255,255,0.14)" accent={`${cfg.accent}99`} />
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_110%,rgba(0,0,0,0.55),transparent)]" aria-hidden />
        </div>
        <div className="relative mx-auto w-full max-w-4xl px-5 text-center md:px-8">
          <Reveal>
            <h2 className="pro-display text-3xl text-white md:text-[3rem]">{tP('ctaTitle')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="pro-lead mx-auto mt-5 max-w-xl text-white/70">{tP('ctaSub')}</p>
          </Reveal>
          <Reveal delay={0.18} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => openModule('bento')} className="pro-btn pro-btn-accent">
              {tP('heroCta')} <ArrowRight className="size-4" aria-hidden />
            </button>
            <button type="button" onClick={() => openModule('map')} className="pro-btn h-[46px] border border-white/25 text-white hover:bg-white/10">
              <MapIcon className="size-4" aria-hidden /> {tP('heroCta2')}
            </button>
          </Reveal>
          {/* image helix — Imageworks closing signature */}
          <Reveal delay={0.24} className="mt-14">
            <div className="flex items-end justify-center gap-4 md:gap-6" aria-hidden>
              {cfg.imgs.map((src, i) => (
                <motion.div
                  key={src}
                  className="pro-helix-item w-32 md:w-52"
                  initial={reduced ? false : { opacity: 0, y: 40, rotate: i === 1 ? 0 : i === 0 ? -4 : 4 }}
                  whileInView={{ opacity: 1, y: 0, rotate: i === 1 ? 0 : i === 0 ? -4 : 4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
                >
                  { }
                  <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
                </motion.div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.3} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[tP('ctaTag1'), tP('ctaTag2'), tP('ctaTag3')].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white/85 backdrop-blur">
                {tag}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <ProFooter
        note={tPortal(`${key}.sub` as 'citizen.sub')}
        columns={[
          {
            title: tP('modKicker'),
            links: modules.slice(0, 4).map((p) => ({
              label: pageTitle(p),
              onClick: () => openModule(p),
            })),
          },
          {
            title: tP('planKicker'),
            links: [
              { label: tP('plan1Name'), onClick: () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: tP('plan2Name'), onClick: () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: tP('plan3Name'), onClick: () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) },
            ],
          },
          {
            title: tP('faqKicker'),
            links: [
              { label: tP('faq1Q'), onClick: () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: tP('ctaBtn2'), onClick: () => setView('signup') },
              { label: tP('rlBack'), onClick: () => setView('landing') },
            ],
          },
        ]}
      />

      {/* module preview dialog */}
      <Dialog open={preview !== null} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="sm:max-w-md">
          {preview && (
            <>
              <DialogHeader>
                <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: `${cfg.accent}12`, color: cfg.accent }}>
                  <PreviewIcon className="size-6" aria-hidden />
                </span>
                <DialogTitle className="mt-3 text-left">
                  {pageTitle(preview)}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {tP(`mod${preview[0].toUpperCase()}${preview.slice(1)}` as 'modMap')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2.5">
                <Button onClick={() => { openModule(preview); }} className="flex-1" style={{ background: cfg.accent }}>
                  {tP('modOpen')} <ArrowRight className="size-4" aria-hidden />
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>{tP('modPreview')}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
