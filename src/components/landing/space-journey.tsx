'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  BrainCircuit,
  BadgeCheck,
  ChevronDown,
  Map as MapIcon,
  RadioTower,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EarthScene } from '@/components/landing/earth-scene';
import { useJourney } from '@/lib/scroll-journey';
import { useAppStore } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

const PILLAR_ICONS = [BrainCircuit, Wrench, BadgeCheck];

export function SpaceJourney() {
  const tHero = useTranslations('hero');
  const tL = useTranslations('landing');
  const tJ = useTranslations('journey');
  const setView = useAppStore((s) => s.setView);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const s1Ref = React.useRef<HTMLDivElement>(null);
  const s2Ref = React.useRef<HTMLDivElement>(null);
  const s3Ref = React.useRef<HTMLDivElement>(null);
  const hintRef = React.useRef<HTMLDivElement>(null);

  const visible = useJourney((s) => s.visible);
  const setVisible = useJourney((s) => s.setVisible);
  const setProgress = useJourney((s) => s.setProgress);
  const setPointer = useJourney((s) => s.setPointer);

  const stats = [
    { label: tHero('statAssets'), value: 25 },
    { label: tHero('statCities'), value: 12 },
    { label: tHero('statSignals'), value: 4 },
  ];
  const pillars = [
    { big: tL('pillar1Big'), small: tL('pillar1Small') },
    { big: tL('pillar2Big'), small: tL('pillar2Small') },
    { big: tL('pillar3Big'), small: tL('pillar3Small') },
  ];

  /* ScrollTrigger choreography ------------------------------------- */
  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    useJourney.getState().setReduced(reduced);

    // Overlay timeline — total duration 1 == wrapper progress
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? true : 0.6,
        onUpdate: (self) => setProgress(self.progress),
        onToggle: (self) => setVisible(self.isActive),
      },
    });
    tl.fromTo(
      s2Ref.current,
      { opacity: 0, y: 70 },
      { opacity: 1, y: 0, duration: 0.12 },
      0.38,
    )
      .to(s2Ref.current, { opacity: 0, y: -50, duration: 0.1 }, 0.6)
      .fromTo(
        s3Ref.current,
        { opacity: 0, y: 70 },
        { opacity: 1, y: 0, duration: 0.12 },
        0.72,
      )
      .to(s1Ref.current, { opacity: 0, y: -50, duration: 0.12 }, 0.28)
      .to(hintRef.current, { opacity: 0, duration: 0.06 }, 0.05)
      // Pad the timeline to duration 1.0 so tween positions equal scroll progress
      .to({}, { duration: 0.16 }, 0.84);

    // Refresh after the WebGL textures/fonts settle
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      clearTimeout(t);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [setProgress, setVisible]);

  /* Pointer parallax ------------------------------------------------ */
  React.useEffect(() => {
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setPointer(
          (e.clientX / window.innerWidth) * 2 - 1,
          -((e.clientY / window.innerHeight) * 2 - 1),
        );
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [setPointer]);

  return (
    <section
      id="journey"
      ref={wrapRef}
      aria-label="JALGUARD platform introduction"
      className="relative h-[400vh] bg-[#050508]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Deep-space gradient backdrop */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 70% 20%, rgba(30,64,175,0.16), transparent 60%), linear-gradient(180deg, #030303 0%, #0d0d11 100%)',
          }}
        />

        {/* WebGL Earth — mounted only while the journey is on screen */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ display: visible ? 'block' : 'none' }}
        >
          {visible ? <EarthScene /> : null}
        </div>

        {/* ---- Overlay S1: hero text -------------------------------- */}
        <div
          ref={s1Ref}
          className="pointer-events-none absolute inset-0 z-10 flex items-center"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-5 md:px-10">
            <div className="max-w-xl max-md:mt-28 max-md:mx-auto max-md:text-center">
              <span className="jg-glass inline-flex items-center gap-2 rounded-full border-white/10 px-3.5 py-1.5 font-mono text-xs text-cyan-200/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                {tHero('badge')}
              </span>
              <h1 className="font-display mt-5 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-white md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                  {tHero('title1')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-[#5ea2ff] to-[#1e40af] bg-clip-text text-transparent">
                  {tHero('title2')}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base">
                {tHero('subtitle')}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3 max-md:justify-center">
                <Button
                  size="lg"
                  className="jg-sos-glow h-11 bg-cyan-400 px-6 font-semibold text-[#02171a] hover:bg-cyan-300"
                  onClick={() =>
                    document.querySelector('#riskmap')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  <MapIcon className="size-4" />
                  {tHero('ctaExplore')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 border-white/20 bg-white/5 px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setView('signup')}
                >
                  {tHero('ctaStart')}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-3 max-md:mx-auto">
                {stats.map((s) => (
                  <div key={s.label} className="jg-glass rounded-xl px-3 py-3 text-center">
                    <dt className="text-[11px] leading-snug text-slate-400 md:text-xs">
                      {s.label}
                    </dt>
                    <dd className="font-display mt-1 text-xl font-bold text-white md:text-2xl">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* ---- Overlay S2: floating glass pillars -------------------- */}
        <div
          ref={s2Ref}
          className="pointer-events-none absolute inset-0 z-10 flex items-center opacity-0"
          style={{ opacity: 0 }}
        >
          <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
            <div className="ml-auto w-full max-w-md space-y-4 max-md:mx-auto max-md:max-w-sm max-md:pt-24">
              {pillars.map((p, i) => {
                const Icon = PILLAR_ICONS[i];
                return (
                  <div
                    key={p.big}
                    className="jg-glass pointer-events-auto rounded-2xl border-white/10 p-5 shadow-[0_8px_40px_rgba(2,8,20,0.55)] backdrop-blur-2xl"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
                        <Icon className="h-5 w-5 text-cyan-300" aria-hidden />
                      </span>
                      <div>
                        <p className="font-display text-base font-bold tracking-tight text-white md:text-lg">
                          {p.big}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-300">{p.small}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Overlay S3: connectivity data panel (right of the cornered Earth) --- */}
        <div
          ref={s3Ref}
          className="pointer-events-none absolute inset-0 z-10 flex items-end md:items-center"
          style={{ opacity: 0 }}
        >
          <div className="mx-auto w-full max-w-7xl px-5 pb-24 md:px-10 md:pb-0">
            <div className="max-w-lg max-md:mx-auto md:ml-auto md:mr-0">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-300/90">
                <RadioTower className="h-4 w-4" aria-hidden />
                JALGUARD registry
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {tJ('s3Title')}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300">{tJ('s3Body')}</p>
              <ul className="mt-5 space-y-2.5">
                {(['s3Item1', 's3Item2', 's3Item3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                    {tJ(k)}
                  </li>
                ))}
              </ul>
              <div className="pointer-events-auto mt-6">
                <Button
                  size="lg"
                  className="h-11 bg-cyan-400 px-6 font-semibold text-[#02171a] hover:bg-cyan-300"
                  onClick={() =>
                    document.querySelector('#riskmap')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  <MapIcon className="size-4" />
                  {tJ('s3Cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center"
        >
          <p className="flex flex-col items-center gap-1 font-mono text-[11px] tracking-[0.22em] text-slate-400">
            {tJ('scrollHint').toUpperCase()}
            <ChevronDown className="jg-caret-bounce h-4 w-4 text-cyan-300" aria-hidden />
          </p>
        </div>
      </div>
    </section>
  );
}
