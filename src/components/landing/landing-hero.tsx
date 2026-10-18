'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { SourceChip } from '@/components/shared/widgets';
import { ArrowRight, Map as MapIcon, Droplets, Zap, ShieldCheck } from 'lucide-react';

const RiskMap = dynamic(() => import('@/components/map/risk-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />,
});

interface Assessment {
  id: string; assetId: string | null; asset?: { name: string }; city: string;
  lat: number; lon: number; score: number; severity: string; isDemo: boolean; confidence: number;
}

export function LandingHero() {
  const t = useTranslations('hero');
  const setView = useAppStore((s) => s.setView);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [top, setTop] = useState<Assessment | null>(null);

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

  const rainNext48 = 52; // demonstration figure shown alongside DEMO tag
  const stats = [
    { value: `${assessments.length || '25'}`, label: t('statAssets') },
    { value: '12', label: t('statCities') },
    { value: '7', label: t('statSignals') },
  ];

  return (
    <section className="jg-hero-bg relative overflow-hidden pt-14">
      <div className="jg-grid-lines absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-300">
            <ShieldCheck className="size-3.5" />
            {t('badge')}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-[3.4rem]">
            {t('title1')}
            <br />
            <span className="jg-gradient-text">{t('title2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base">
            {t('subtitle')}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-emerald-500 px-6 font-semibold text-[#06251B] shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
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
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <dt className="order-2 mt-1 block text-[11px] leading-tight text-slate-400">{s.label}</dt>
                <dd className="font-mono text-2xl font-bold text-white">{s.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Live map composition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 sm:h-[420px] lg:h-[480px]">
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
            {/* Rainfall panel */}
            <div className="absolute left-3 top-3 z-[1100] w-40 rounded-xl border border-white/10 bg-[#0B1220]/90 p-3 shadow-lg backdrop-blur">
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
              <div className="absolute bottom-3 right-3 z-[1100] w-56 rounded-xl border border-white/10 bg-[#0B1220]/90 p-3 shadow-lg backdrop-blur">
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
        </motion.div>
      </div>
    </section>
  );
}
