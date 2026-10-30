'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MapView } from '@/components/map/map-view';
import { LandingFooter } from './landing-footer';
import {
  ArrowRight, AlertTriangle, EyeOff, ShieldQuestion, BrainCircuit, Eye,
  Wrench, Building2, HardHat, Users, LineChart, BadgeCheck, Send, Globe, Sparkles,
  Radar, ListOrdered, Camera, RefreshCw, IndianRupee, TrendingUp, HelpCircle, ShieldCheck,
  Mail, MapPin, Clock, Activity,
} from 'lucide-react';

/* ---------------- shared building blocks ---------------- */

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Kicker({ children, idx }: { children: React.ReactNode; idx?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
      {idx && <span className="font-mono text-[11px] text-emerald-600/70 dark:text-emerald-400/50">{idx}</span>}
      <Sparkles className="size-3" />
      {children}
    </div>
  );
}

function SectionHead({ kicker, title, body, idx, dark }: { kicker: string; title: string; body?: string; idx?: string; dark?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Kicker idx={idx}>{kicker}</Kicker>
      <h2 className={`mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl ${dark ? 'text-white' : ''}`}>{title}</h2>
      {body && <p className={`mt-3 text-[15px] leading-relaxed ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>{body}</p>}
    </Reveal>
  );
}

/** card with mouse-tracked radial spotlight */
function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`jg-spot jg-card-hover h-full rounded-xl border bg-card ${className ?? ''}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- main ---------------- */

export function LandingSections() {
  const t = useTranslations('landing');
  const tHero = useTranslations('hero');
  const tAppInt = useTranslations('app.interventions');
  const setView = useAppStore((s) => s.setView);
  const reduce = useReducedMotion();
  const [contactSent, setContactSent] = useState(false);
  /* clearly visible fields on the dark card (WCAG 1.4.11 ≥3:1 border contrast) */
  const fieldCls = 'border-slate-500 bg-slate-50 dark:border-slate-400/80 dark:bg-white/[0.07]';

  const problems = [
    { icon: AlertTriangle, num: '01', title: t('problem1Title'), body: t('problem1Body'), tone: 'text-red-500 bg-red-500/10 border-red-500/20', bar: 'from-red-500/70' },
    { icon: EyeOff, num: '02', title: t('problem2Title'), body: t('problem2Body'), tone: 'text-amber-500 bg-amber-500/10 border-amber-500/20', bar: 'from-amber-500/70' },
    { icon: ShieldQuestion, num: '03', title: t('problem3Title'), body: t('problem3Body'), tone: 'text-sky-500 bg-sky-500/10 border-sky-500/20', bar: 'from-sky-500/70' },
  ];

  const workflow = [
    { k: 'wf1', c: 'bg-emerald-500', icon: Radar },
    { k: 'wf2', c: 'bg-teal-500', icon: Eye },
    { k: 'wf3', c: 'bg-sky-500', icon: ListOrdered },
    { k: 'wf4', c: 'bg-violet-500', icon: Wrench },
    { k: 'wf5', c: 'bg-amber-500', icon: Camera },
    { k: 'wf6', c: 'bg-rose-500', icon: RefreshCw },
  ];

  const solutions = [
    { icon: HardHat, kicker: t('fieldKicker'), title: t('fieldTitle'), body: t('fieldBody') },
    { icon: Users, kicker: t('citizenKicker'), title: t('citizenTitle'), body: t('citizenBody') },
    { icon: LineChart, kicker: t('analyticsKicker'), title: t('analyticsTitle'), body: t('analyticsBody') },
  ];

  const aiPoints = [t('aiPoint1'), t('aiPoint2'), t('aiPoint3'), t('aiPoint4')];

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') },
  ];

  const factors: Array<[string, number]> = [
    ['Forecast (next 48h)', 24], ['Rainfall (last 24h)', 28], ['Asset vulnerability', 15],
  ];

  return (
    <main className="flex flex-col">
      {/* 1. Intro pillars */}
      <section id="intro" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead idx="01" kicker={t('introKicker')} title={t('introTitle')} body={t('introBody')} />
          <Reveal delay={0.1} className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { icon: BrainCircuit, big: t('pillar1Big'), small: t('pillar1Small') },
              { icon: Wrench, big: t('pillar2Big'), small: t('pillar2Small') },
              { icon: BadgeCheck, big: t('pillar3Big'), small: t('pillar3Small') },
            ].map((c, i) => (
              <SpotlightCard key={i} className="p-5">
                <div className="flex items-center justify-between">
                  <c.icon className="size-6 text-emerald-500" />
                  <span className="jg-step-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mt-3 font-mono text-[13px] font-bold tracking-tight">{c.big}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.small}</div>
              </SpotlightCard>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 2. Interactive map preview */}
      <section id="riskmap" className="scroll-mt-20 border-y bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead idx="02" kicker={t('mapKicker')} title={t('mapTitle')} body={t('mapBody')} />
          <Reveal delay={0.1} className="mt-8">
            <div className="jg-corners relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card p-1.5 shadow-xl shadow-navy/10">
              <MapView authed={false} compactHeight />
            </div>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button className="jg-glow-btn font-semibold" onClick={() => setView('publicMap')}>
                {t('mapCta')}
                <ArrowRight className="size-4" />
              </Button>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Activity className="size-3.5 text-emerald-500" />
                {tHero('ticker')}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Problem */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead idx="03" kicker={t('problemKicker')} title={t('problemTitle')} />
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
            {problems.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <SpotlightCard className="overflow-hidden p-0">
                  <div className={`h-1 w-full bg-gradient-to-r ${p.bar} to-transparent`} aria-hidden />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`inline-flex size-11 items-center justify-center rounded-xl border ${p.tone}`}>
                        <p.icon className="size-5" />
                      </div>
                      <span className="jg-step-num">{p.num}</span>
                    </div>
                    <h3 className="mt-4 text-base font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Workflow loop */}
      <section id="workflow" className="relative scroll-mt-20 overflow-hidden bg-[#0B1220] py-16 text-white md:py-24">
        <div className="jg-aurora absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
              <span className="font-mono text-[11px] text-emerald-400/60">04</span>
              <Sparkles className="size-3" />
              {t('workflowKicker')}
            </div>
            <h2 className="mt-4 font-mono text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-[1.7rem]">
              {t('workflowTitle')}
            </h2>
          </Reveal>
          <div className="relative mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* connecting hairline (lg only, decorative) */}
            <div className="jg-hairline absolute -top-6 left-[16%] right-[16%] hidden opacity-40 lg:block" aria-hidden />
            {workflow.map((w, i) => (
              <Reveal key={w.k} delay={i * 0.06}>
                <div className="group relative h-full rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-8 items-center justify-center rounded-lg ${w.c}/15`}>
                        <w.icon className="size-4 text-white" />
                      </span>
                      <span className={`size-2 rounded-full ${w.c} jg-pulse-dot`} aria-hidden />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-3.5 text-sm leading-relaxed text-slate-300">{t(w.k as 'wf1')}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {/* loop-back cue — closing line, distinct from step 06 */}
          <Reveal delay={0.2} className="mt-8 flex justify-center">
            <div className="inline-flex max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
              <RefreshCw className="size-3.5 shrink-0 text-emerald-400" />
              {t('wfLoop')}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Intelligence — explainable gauge */}
      <section id="intelligence" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-2">
          <Reveal>
            <Kicker idx="05">{t('intelKicker')}</Kicker>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('intelTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('intelBody')}</p>
            <div className="jg-card-hover mt-6 rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                {/* circular gauge */}
                <div className="flex items-center gap-4">
                  <div className="relative size-24">
                    <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-muted" />
                      <motion.circle
                        cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
                        className="stroke-red-500"
                        strokeDasharray={2 * Math.PI * 45}
                        initial={reduce ? false : { strokeDashoffset: 2 * Math.PI * 45 }}
                        whileInView={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - 0.83) }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-2xl font-extrabold text-red-500">83</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">/100</div>
                    <span className="mt-1 inline-block rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">CRITICAL</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {factors.map(([label, w]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span className="font-mono">+{w}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-red-500"
                        initial={reduce ? false : { width: 0 }}
                        whileInView={{ width: `${(w / 28) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Illustrative example · confidence 82% · data freshness shown live in-product</div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-transparent to-[#38D9D6]/10 p-8">
              <div className="jg-orb -right-10 -top-10 size-40 bg-emerald-500/20" aria-hidden />
              <BrainCircuit className="size-10 text-emerald-500" />
              <ul className="mt-5 space-y-3">
                {[
                  'Rainfall intensity & accumulation',
                  '48-hour forecast conditions',
                  'Asset vulnerability & drainage capacity',
                  'Historical incidents near each asset',
                  'Citizen reports & field observations',
                ].map((s) => (
                  <li key={s} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Transparent rule engine v0.9 — labelled with source, confidence and limitations on every assessment.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. Interventions */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead idx="06" kicker={t('recKicker')} title={t('recTitle')} body={t('recBody')} />
          <Reveal delay={0.1} className="mx-auto mt-10 max-w-4xl">
            <div className="jg-corners overflow-hidden rounded-xl border bg-card shadow-lg">
              <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-red-500/10 via-transparent to-transparent px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Wrench className="size-4 text-red-500" />
                  <span className="text-sm font-semibold">Inspect primary drains before forecast peak</span>
                </div>
                <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">URGENT</span>
              </div>
              <div className="grid gap-x-6 gap-y-4 px-5 py-5 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div><span className="font-semibold">{t('why')}:</span> <span className="text-muted-foreground">88 mm/48h forecast with low drainage capacity.</span></div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div><span className="font-semibold">{t('resources')}:</span> <span className="text-muted-foreground">2-person crew, 1 vehicle</span></div>
                </div>
                <div className="flex items-start gap-2.5">
                  <IndianRupee className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div><span className="font-semibold">{t('estCost')}:</span> <span className="text-muted-foreground">₹8,000</span></div>
                </div>
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div><span className="font-semibold">{t('benefit')}:</span> <span className="text-muted-foreground">Prevents avoidable waterlogging</span></div>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <Camera className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div><span className="font-semibold">{t('verification')}:</span> <span className="text-muted-foreground">Geo-tagged before/after photos from the field app.</span></div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t bg-emerald-500/5 px-5 py-3 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {tAppInt('humanNote')}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Solutions — bento grid */}
      <section id="solutions" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead idx="07" kicker={t('muniKicker')} title={t('muniTitle')} body={t('muniBody')} />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* municipal — feature card with mini dashboard mock */}
            <Reveal className="md:col-span-2 lg:row-span-1">
              <SpotlightCard className="p-6">
                <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="inline-flex size-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                      <Building2 className="size-5 text-emerald-500" />
                    </div>
                    <div className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{t('muniKicker')}</div>
                    <h3 className="mt-1 text-base font-bold">{t('muniCardTitle')}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('muniCardBody')}</p>
                  </div>
                  {/* decorative mini dashboard */}
                  <div className="jg-glass hidden w-64 shrink-0 rounded-xl p-4 sm:block" aria-hidden>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-300">
                      <span>Risk</span>
                      <span className="rounded bg-red-500/15 px-1 py-0.5 font-mono text-[11px] font-bold text-red-400">3 CRITICAL</span>
                    </div>
                    <div className="mt-3 flex h-16 items-end gap-1.5">
                      {[38, 62, 45, 80, 55, 92, 70, 48, 84, 60].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/40 to-[#38D9D6]/80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {['Drain cleaning — Patna', 'Culvert check — Mumbai'].map((row, i) => (
                        <div key={row} className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5 text-[11px] text-slate-200">
                          <span className="truncate">{row}</span>
                          <span className={`ml-2 shrink-0 rounded px-1 py-0.5 text-[10.5px] font-bold ${i === 0 ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                            {i === 0 ? 'DUE' : 'OK'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
            {solutions.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <SpotlightCard className="p-6">
                  <div className="inline-flex size-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                    <s.icon className="size-5 text-emerald-500" />
                  </div>
                  <div className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{s.kicker}</div>
                  <h3 className="mt-1 text-base font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Responsible AI — terminal receipt */}
      <section id="responsible" className="relative scroll-mt-20 overflow-hidden bg-[#0B1220] py-16 text-white md:py-20">
        <div className="jg-grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-300">
                <span className="font-mono text-[11px] text-sky-400/60">08</span>
                <Globe className="size-3" />
                {t('aiKicker')}
              </div>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('aiTitle')}</h2>
              <ul className="mt-6 space-y-3.5">
                {aiPoints.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[14px] leading-relaxed text-slate-300">
                    <BadgeCheck className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0F1A] shadow-2xl shadow-black/50">
                {/* window chrome */}
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-red-500/70" aria-hidden />
                  <span className="size-2.5 rounded-full bg-amber-500/70" aria-hidden />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" aria-hidden />
                  <span className="ml-2 font-mono text-xs text-slate-400">jalguard — assessment receipt</span>
                </div>
                <div className="p-5 font-mono text-[12px] leading-relaxed">
                  <div className="text-emerald-400">{'// every assessment ships with its own receipt'}</div>
                  <div className="mt-3 text-slate-400">{'{'}</div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;score&quot;</span><span className="text-slate-400">: </span><span className="text-sky-300">83</span><span className="text-slate-400">, </span><span className="text-emerald-300">&quot;severity&quot;</span><span className="text-slate-400">: </span><span className="text-amber-300">&quot;CRITICAL&quot;</span><span className="text-slate-400">,</span></div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;source&quot;</span><span className="text-slate-400">: </span><span className="text-amber-300">&quot;rule-engine v0.9 + Open-Meteo (live)&quot;</span><span className="text-slate-400">,</span></div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;confidence&quot;</span><span className="text-slate-400">: </span><span className="text-sky-300">82</span><span className="text-slate-400">,</span></div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;factors&quot;</span><span className="text-slate-400">: [</span><span className="text-amber-300">&quot;forecast_48h +24&quot;</span><span className="text-slate-400">, </span><span className="text-amber-300">&quot;rainfall_24h +28&quot;</span><span className="text-slate-400">, …],</span></div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;dataFreshness&quot;</span><span className="text-slate-400">: </span><span className="text-amber-300">&quot;live weather ≤ 30 min&quot;</span><span className="text-slate-400">,</span></div>
                  <div className="pl-4"><span className="text-emerald-300">&quot;humanApprovalRequired&quot;</span><span className="text-slate-400">: </span><span className="text-sky-300">true</span></div>
                  <div className="text-slate-400">{'}'}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-emerald-400">$</span>
                    <span className="jg-caret inline-block h-3.5 w-2 bg-emerald-400/80" aria-hidden />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionHead idx="09" kicker={t('faqKicker')} title={t('faqTitle')} />
          <Reveal delay={0.1} className="mt-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger className="text-left text-[14.5px] font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* 10. Contact */}
      <section id="contact" className="scroll-mt-20 border-t bg-muted/30 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 md:px-6 lg:grid-cols-2">
          <Reveal>
            <Kicker idx="10">{t('contactKicker')}</Kicker>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('contactTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('contactBody')}</p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Mail, label: t('contactEmailTile'), value: t('contactEmailValue') },
                { icon: MapPin, label: t('contactRegionTile'), value: t('contactRegionValue') },
                { icon: Clock, label: t('contactHoursTile'), value: t('contactHoursValue') },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10">
                    <row.icon className="size-4 text-emerald-500" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{row.label}</div>
                    <div className="truncate text-sm font-medium">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {contactSent ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-700 dark:text-emerald-300">
                {t('contactSent')}
              </div>
            ) : (
              <form
                className="space-y-3 rounded-xl border bg-card p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSent(true);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name">{t('contactName')}</Label>
                    <Input id="c-name" required minLength={2} className={fieldCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">{t('contactEmail')}</Label>
                    <Input id="c-email" type="email" required className={fieldCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-org">{t('contactOrg')}</Label>
                  <Input id="c-org" className={fieldCls} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-msg">{t('contactMsg')}</Label>
                  <Textarea id="c-msg" rows={3} className={fieldCls} />
                </div>
                <Button type="submit" className="jg-glow-btn w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400">
                  <Send className="size-4" />
                  {t('contactSend')}
                </Button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <Reveal>
            <div className="jg-map-frame">
              <div className="jg-hero-bg relative overflow-hidden rounded-[calc(1.25rem-1px)] px-6 py-12 text-center text-white md:px-12 md:py-16">
                <div className="jg-aurora absolute inset-0 opacity-80" aria-hidden />
                <div className="jg-noise absolute inset-0" aria-hidden />
                <div className="jg-grid-lines absolute inset-0" aria-hidden />
                <h2 className="relative text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('ctaTitle')}</h2>
                <p className="relative mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-slate-300">{t('ctaBody')}</p>
                <Button
                  size="lg"
                  className="jg-glow-btn relative mt-7 h-11 bg-emerald-500 px-7 font-semibold text-[#06251B] hover:bg-emerald-400"
                  onClick={() => setView('signup')}
                >
                  {t('ctaButton')}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
