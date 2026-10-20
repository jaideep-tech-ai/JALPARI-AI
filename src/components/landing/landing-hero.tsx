'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { SourceChip } from '@/components/shared/widgets';
import { ArrowRight, Map as MapIcon, Droplets, Zap, ShieldCheck, ChevronDown } from 'lucide-react';

const RiskMap = dynamic(() => import('@/components/map/risk-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />,
});

interface Assessment {
  id: string; assetId: string | null; asset?: { name: string }; city: string;
  lat: number; lon: number; score: number; severity: string; isDemo: boolean; confidence: number;
}

/** eased count-up that respects prefers-reduced-motion */
function useCountUp(target: number, duration = 1300) {
  const [v, setV] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    let raf = 0;
    const dur = reduce ? 0 : duration;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return v;
}

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Patna', 'Ahmedabad', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow', 'Kochi'];

export function LandingHero() {
  const t = useTranslations('hero');
  const setView = useAppStore((s) => s.setView);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [top, setTop] = useState<Assessment | null>(null);
  const statsRef = useRef<HTMLDListElement | null>(null);

  useEffect(() => {
    fetch('/api/assessments')
      .then((r) => r.json())
      .then((d) => {
        const list: Assessment[] = d.assessments ?? [];
        setAssessments(list);
        setTop(list.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').sort((x, y) => y.score - x.score)[0] ?? null);
      })
      .catch(() => {});
  }, []);

  const nAssets = useCountUp(assessments.length || 25);
  const nCities = useCountUp(12, 900);
  const nSignals = useCountUp(7, 800);

  const rainNext48 = 52; // demonstration figure shown alongside DEMO tag
  const stats = [
    { value: nAssets, label: t('statAssets') },
    { value: nCities, label: t('statCities') },
    { value: nSignals, label: t('statSignals') },
  ];

  return (
    <section className="jg-hero-bg relative overflow-hidden pt-14">
      {/* atmosphere layers */}
      <div className="jg-aurora absolute inset-0" aria-hidden />
      <div className="jg-orb left-[-8%] top-[16%] size-[26rem] bg-emerald-500/20" aria-hidden />
      <div className="jg-orb jg-float right-[-4%] top-[38%] size-80 bg-[#38D9D6]/15" aria-hidden />
      <div className="jg-noise absolute inset-0" aria-hidden />
      <div className="jg-grid-lines absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-20 lg:pt-16">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="jg-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <ShieldCheck className="size-3.5" />
            {t('badge')}
          </div>
          <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-white text-balance sm:text-5xl lg:text-[3.9rem]">
            {t('title1')}
            <br />
            <span className="jg-gradient-text drop-shadow-[0_0_28px_rgba(16,185,129,0.35)]">{t('title2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base">
            {t('subtitle')}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="jg-glow-btn h-11 bg-emerald-500 px-6 font-semibold text-[#06251B] hover:bg-emerald-400"
              onClick={() => document.querySelector('#riskmap')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MapIcon className="size-4" />
              {t('ctaExplore')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 border-white/20 bg-white/5 px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
              onClick={() => setView('signup')}
            >
              {t('ctaStart')}
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <dl ref={statsRef} className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="jg-glass rounded-xl px-3 py-3">
                <dt className="order-2 mt-1 block text-[11px] leading-tight text-slate-400">{s.label}</dt>
                <dd className="font-mono text-2xl font-bold tabular-nums text-white">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* city ticker */}
          <div className="mt-8 max-w-md overflow-hidden">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Droplets className="size-3 text-[#38D9D6]" />
              {t('ticker')}
            </div>
            <div className="jg-marquee" aria-hidden>
              <div className="jg-marquee-inner">
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex shrink-0 items-center gap-6 pr-6">
                    {CITIES.map((c) => (
                      <span key={`${copy}-${c}`} className="flex items-center gap-6 whitespace-nowrap text-[12.5px] font-medium text-slate-400">
                        {c}
                        <span className="size-1 rounded-full bg-emerald-500/50" />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live map composition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="jg-map-frame">
            <div className="relative h-[360px] overflow-hidden bg-[#0E1930] shadow-2xl shadow-black/50 sm:h-[420px] lg:h-[480px]">
              <RiskMap
                assessments={assessments.map((a) => ({
                  id: a.id, assetId: a.assetId, assetName: a.asset?.name ?? a.city,
                  city: a.city, lat: a.lat, lon: a.lon, score: a.score,
                  severity: a.severity, confidence: a.confidence, isDemo: a.isDemo,
                }))}
                incidents={[]}
                tasks={[]}
                showRisk
                showIncidents={false}
                showTasks={false}
                minSeverity="LOW"
                flyTarget={null}
                compact
                theme="dark"
              />
              {/* scan sweep */}
              <div className="jg-scan" aria-hidden />

              {/* Rainfall panel */}
              <div className="jg-glass jg-float absolute left-3 top-3 z-[1100] w-40 rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <Droplets className="size-3 text-sky-400" />
                  {t('panelRain')}
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">{rainNext48}<span className="text-xs font-normal text-slate-400"> mm</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[58%] rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
                </div>
                <div className="mt-1.5 text-[9px] text-slate-500">Mumbai · demonstration figure</div>
              </div>

              {/* Recommendation preview */}
              {top && (
                <div className="jg-glass jg-float-delay absolute bottom-3 right-3 z-[1100] w-56 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Zap className="size-3 text-emerald-400" />
                    {t('panelRec')}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-white">
                    {top.asset?.name ?? top.city}: inspect primary drains before forecast peak
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400">
                      {top.score}/100
                    </span>
                    <SourceChip status={top.isDemo ? 'SIMULATED' : 'LIVE'} />
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-[1100] rounded-md border border-white/10 bg-[#0B1220]/90 px-2 py-1 text-[9px] font-medium text-slate-400 backdrop-blur">
                {t('demoTag')} · © OpenStreetMap contributors
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* decorative scroll cue (purely decorative — aria-hidden) */}
      <div className="relative hidden justify-center pb-6 lg:flex" aria-hidden>
        <div className="jg-float flex flex-col items-center gap-1 text-slate-500">
          <span className="h-8 w-px bg-gradient-to-b from-transparent via-emerald-400/60 to-transparent" />
          <ChevronDown className="size-4" />
        </div>
      </div>
    </section>
  );
}
