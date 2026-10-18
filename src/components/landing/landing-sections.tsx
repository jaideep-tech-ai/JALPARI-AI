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
  ArrowRight, AlertTriangle, EyeOff, ShieldQuestion, BrainCircuit,
  Wrench, Building2, HardHat, Users, LineChart, BadgeCheck, Send, Globe, Sparkles,
} from 'lucide-react';

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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
      <Sparkles className="size-3" />
      {children}
    </div>
  );
}

function SectionHead({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{title}</h2>
      {body && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{body}</p>}
    </Reveal>
  );
}

export function LandingSections() {
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const setView = useAppStore((s) => s.setView);
  const [contactSent, setContactSent] = useState(false);

  const problems = [
    { icon: AlertTriangle, title: t('problem1Title'), body: t('problem1Body'), tone: 'text-red-500 bg-red-500/10 border-red-500/20' },
    { icon: EyeOff, title: t('problem2Title'), body: t('problem2Body'), tone: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { icon: ShieldQuestion, title: t('problem3Title'), body: t('problem3Body'), tone: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  ];

  const workflow = [
    { k: 'wf1', c: 'bg-emerald-500' }, { k: 'wf2', c: 'bg-teal-500' }, { k: 'wf3', c: 'bg-sky-500' },
    { k: 'wf4', c: 'bg-violet-500' }, { k: 'wf5', c: 'bg-amber-500' }, { k: 'wf6', c: 'bg-rose-500' },
  ];

  const solutions = [
    { icon: Building2, kicker: t('muniKicker'), title: t('muniTitle'), body: t('muniBody') },
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

  return (
    <main className="flex flex-col">
      {/* 1. Intro */}
      <section id="intro" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker={t('introKicker')} title={t('introTitle')} body={t('introBody')} />
          <Reveal delay={0.1} className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { icon: BrainCircuit, big: 'PREDICT → UNDERSTAND', small: 'Explainable risk scores from transparent rules' },
              { icon: Wrench, big: 'PRIORITIZE → ACT', small: 'Costed recommendations become supervised field tasks' },
              { icon: BadgeCheck, big: 'VERIFY → LEARN', small: 'Photo evidence closes every intervention loop' },
            ].map((c, i) => (
              <div key={i} className="jg-card-hover rounded-xl border bg-card p-5">
                <c.icon className="size-6 text-emerald-500" />
                <div className="mt-3 font-mono text-[13px] font-bold tracking-tight">{c.big}</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.small}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 2. Interactive map preview */}
      <section id="riskmap" className="scroll-mt-20 border-y bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker={t('mapKicker')} title={t('mapTitle')} body={t('mapBody')} />
          <Reveal delay={0.1} className="mt-8">
            <MapView authed={false} compactHeight />
            <div className="mt-4 text-center">
              <Button variant="outline" className="font-semibold" onClick={() => setView('publicMap')}>
                {t('mapCta')}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Problem */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker={t('problemKicker')} title={t('problemTitle')} />
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
            {problems.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="jg-card-hover h-full rounded-xl border bg-card p-6">
                  <div className={`inline-flex size-11 items-center justify-center rounded-xl border ${p.tone}`}>
                    <p.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{p.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Workflow */}
      <section id="workflow" className="scroll-mt-20 border-y bg-[#0B1220] py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>{t('workflowKicker')}</Kicker>
            <h2 className="mt-4 font-mono text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-[1.7rem]">
              {t('workflowTitle')}
            </h2>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map((w, i) => (
              <Reveal key={w.k} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-emerald-500/40">
                  <div className="flex items-center gap-2.5">
                    <span className={`size-2.5 rounded-full ${w.c}`} />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Step {i + 1}
                    </span>
                  </div>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-300">{t(w.k as 'wf1')}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Intelligence */}
      <section id="intelligence" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-2">
          <Reveal>
            <Kicker>{t('intelKicker')}</Kicker>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('intelTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('intelBody')}</p>
            <div className="mt-6 rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-extrabold text-red-500">83<span className="text-sm text-muted-foreground">/100</span></span>
                <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-500">CRITICAL</span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ['Forecast (next 48h)', 24], ['Rainfall (last 24h)', 28], ['Asset vulnerability', 15],
                ].map(([label, w]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{label}</span>
                      <span className="font-mono">+{w}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-red-500" style={{ width: `${((w as number) / 28) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground">Illustrative example · confidence 82% · data freshness shown live in-product</div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 p-8">
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
              <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
                Transparent rule engine v0.9 — labelled with source, confidence and limitations on every assessment.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. Interventions */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker={t('recKicker')} title={t('recTitle')} body={t('recBody')} />
          <Reveal delay={0.1} className="mx-auto mt-10 max-w-4xl">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="text-sm font-semibold">Inspect primary drains before forecast peak</span>
                <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">URGENT</span>
              </div>
              <div className="grid gap-x-6 gap-y-3 px-5 py-4 text-[13px] sm:grid-cols-2">
                <div><span className="font-semibold">{t('why')}:</span> <span className="text-muted-foreground">88 mm/48h forecast with low drainage capacity.</span></div>
                <div><span className="font-semibold">{t('resources')}:</span> <span className="text-muted-foreground">2-person crew, 1 vehicle</span></div>
                <div><span className="font-semibold">{t('estCost')}:</span> <span className="text-muted-foreground">₹8,000</span></div>
                <div><span className="font-semibold">{t('benefit')}:</span> <span className="text-muted-foreground">Prevents avoidable waterlogging</span></div>
                <div className="sm:col-span-2"><span className="font-semibold">{t('verification')}:</span> <span className="text-muted-foreground">Geo-tagged before/after photos from the field app.</span></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Solutions: municipal / field / citizen / analytics */}
      <section id="solutions" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead kicker={t('muniKicker')} title={t('muniTitle')} body={t('muniBody')} />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {solutions.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="jg-card-hover flex h-full gap-4 rounded-xl border bg-card p-6">
                  <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                    <s.icon className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{s.kicker}</div>
                    <h3 className="mt-1 text-base font-bold">{s.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Responsible AI */}
      <section id="responsible" className="scroll-mt-20 border-y bg-[#0B1220] py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-300">
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 font-mono text-[12px] leading-relaxed text-slate-300">
                <div className="text-emerald-400">{'// every assessment ships with its own receipt'}</div>
                <div className="mt-3">{'{'}</div>
                <div className="pl-4">&quot;score&quot;: 83, &quot;severity&quot;: &quot;CRITICAL&quot;,</div>
                <div className="pl-4">&quot;source&quot;: &quot;rule-engine v0.9 + Open-Meteo (live)&quot;,</div>
                <div className="pl-4">&quot;confidence&quot;: 82,</div>
                <div className="pl-4">&quot;factors&quot;: [&quot;forecast_48h +24&quot;, &quot;rainfall_24h +28&quot;, …],</div>
                <div className="pl-4">&quot;dataFreshness&quot;: &quot;live weather ≤ 30 min&quot;,</div>
                <div className="pl-4">&quot;humanApprovalRequired&quot;: true</div>
                <div>{'}'}</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionHead kicker={t('faqKicker')} title={t('faqTitle')} />
          <Reveal delay={0.1} className="mt-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger className="text-left text-[14.5px] font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
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
            <Kicker>{t('contactKicker')}</Kicker>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('contactTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('contactBody')}</p>
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
                    <Input id="c-name" required minLength={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">{t('contactEmail')}</Label>
                    <Input id="c-email" type="email" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-org">{t('contactOrg')}</Label>
                  <Input id="c-org" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-msg">{t('contactMsg')}</Label>
                  <Textarea id="c-msg" rows={3} />
                </div>
                <Button type="submit" className="w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400">
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
            <div className="jg-hero-bg relative overflow-hidden rounded-2xl px-6 py-12 text-center text-white md:px-12 md:py-16">
              <div className="jg-grid-lines absolute inset-0" aria-hidden />
              <h2 className="relative text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{t('ctaTitle')}</h2>
              <p className="relative mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-slate-300">{t('ctaBody')}</p>
              <Button
                size="lg"
                className="relative mt-7 h-11 bg-emerald-500 px-7 font-semibold text-[#06251B] shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                onClick={() => setView('signup')}
              >
                {t('ctaButton')}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
