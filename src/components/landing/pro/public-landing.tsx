'use client';

/**
 * PUBLIC LANDING — ReactBits Pro editorial rebuild of the marketing site.
 * Light-only. Photography hero with tabs, trust marquee, function tabs,
 * orbital Earth panel, WIRED role cards (tap a role → its own landing
 * page via one-tap demo sign-in), workflow tabs, benchmark, stories,
 * plans, FAQ, closing CTA with image helix.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Check, Droplets, Building2, Siren, HardHat, Radar,
  Crown, Map as MapIcon, Loader2, MousePointerClick,
} from 'lucide-react';
import { api } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import type { SessionUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProNav, type ProNavSection } from './pro-nav';
import { Reveal, DotField, CountUp, PillTabs, Marquee, Faq, ProFooter } from './pro-kit';
import { SectionHead, BenchRow, Stories } from './role-landing';
import { EarthScene } from '../earth-scene';

const DEMO_EMAIL: Record<string, string> = {
  citizen: 'citizen@jalguard.demo',
  municipal: 'officer@jalguard.demo',
  disaster: 'disaster@jalguard.demo',
  field: 'field@jalguard.demo',
  analyst: 'analyst@jalguard.demo',
  admin: 'admin@jalguard.demo',
};

const ROLES = [
  { key: 'citizen', accent: '#16A34A', icon: Droplets, email: DEMO_EMAIL.citizen },
  { key: 'municipal', accent: '#0F766E', icon: Building2, email: DEMO_EMAIL.municipal },
  { key: 'disaster', accent: '#DC2626', icon: Siren, email: DEMO_EMAIL.disaster },
  { key: 'field', accent: '#B45309', icon: HardHat, email: DEMO_EMAIL.field },
  { key: 'analyst', accent: '#0891B2', icon: Radar, email: DEMO_EMAIL.analyst },
  { key: 'admin', accent: '#7C3AED', icon: Crown, email: DEMO_EMAIL.admin },
] as const;

type RoleKey = (typeof ROLES)[number]['key'];

export function PublicLanding() {
  const tP = useTranslations('pro');
  const tLx = useTranslations('lx');
  const tPortal = useTranslations('portal');
  const { setUser, setAppPage, setView } = useAppStore();
  const reduced = useReducedMotion();

  const [heroTab, setHeroTab] = useState('0');
  const [fnTab, setFnTab] = useState('mon');
  const [wfTab, setWfTab] = useState('0');
  const [entering, setEntering] = useState<RoleKey | null>(null);
  const [err, setErr] = useState('');
  const orbitRef = useRef<HTMLDivElement>(null);
  const [orbitVisible, setOrbitVisible] = useState(false);

  // mount the WebGL globe only when the orbit panel approaches the viewport
  useEffect(() => {
    const el = orbitRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && setOrbitVisible(true),
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const heroImages = [
    { src: '/images/landing/monsoon-2.jpg', tag: tP('pubHeroTag1') },
    { src: '/images/landing/rescue-1.jpg', tag: tP('pubHeroTag2') },
    { src: '/images/landing/river-city-3.jpg', tag: tP('pubHeroTag3') },
  ];
  const hero = heroImages[Number(heroTab)];

  const sections: ProNavSection[] = [
    { id: 'product', label: tLx('benKicker') },
    { id: 'orbit', label: tP('orbitKicker') },
    { id: 'roles', label: tLx('ftKicker') },
    { id: 'loop', label: tP('wfKicker') },
    { id: 'plans', label: tP('planKicker') },
    { id: 'faq', label: tP('faqKicker') },
  ];

  const fnOn = fnTab === 'mon';
  const wfData = [0, 1, 2].map((k) => ({
    title: tP(`wf${k + 1}Title` as 'wf1Title'),
    body: tP(`wf${k + 1}Body` as 'wf1Body'),
    tab: tP(`wfTab${k + 1}` as 'wfTab1'),
    img: ['/images/landing/river-city-1.jpg', '/images/landing/flood-street-2.jpg', '/images/landing/rescue-3.jpg'][k],
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
      feats: [tP('plan2F1'), tP('plan2F2'), tP('plan2F3')], hot: true },
    { name: tP('plan3Name'), price: tP('plan3Price'), per: tP('plan3Per'), desc: tP('plan3Desc'),
      feats: [tP('plan3F1'), tP('plan3F2'), tP('plan3F3')], hot: false },
  ];

  const faqItems = [1, 2, 3, 4, 5].map((k) => ({
    q: tP(`faq${k}Q` as 'faq1Q'), a: tP(`faq${k}A` as 'faq1A'),
  }));

  /** one-tap demo sign-in → that role's own landing page */
  async function openRole(r: (typeof ROLES)[number]) {
    if (entering) return;
    setErr('');
    setEntering(r.key);
    try {
      await api('/api/auth', { body: { action: 'login', email: r.email, password: 'Demo#Pass1' } });
      const session = await api<{ user: SessionUser }>('/api/auth');
      setUser(session.user);
      setAppPage('portal');
      setView('app'); // portal renders the role's ReactBits landing page
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (e2) {
      setErr((e2 as Error).message);
      setEntering(null);
    }
  }

  return (
    <div className="pro-root min-h-screen">
      <ProNav sections={sections} ctaLabel={tLx('heroCta')} />

      {/* ================= HERO ================= */}
      <header className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <DotField density={30} color="rgba(22,33,29,0.10)" accent="rgba(18,137,126,0.5)" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--pro-line)] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[color:var(--pro-accent-ink)] shadow-[var(--pro-shadow)]">
                <span className="pro-live-dot" aria-hidden /> {tP('pubBadge')}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="pro-display mt-5 text-[2.7rem] leading-[1.03] md:text-[3.6rem]">
                {tLx('heroTitle1')}
                <span className="block text-[color:var(--pro-accent)]">{tLx('heroTitle2')}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="pro-lead mt-5 max-w-xl">{tLx('heroSub')}</p>
            </Reveal>
            <Reveal delay={0.24} className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setView('signup')} className="pro-btn pro-btn-accent">
                {tLx('heroCta')} <ArrowRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                className="pro-btn pro-btn-ghost"
              >
                <MousePointerClick className="size-4" aria-hidden /> {tLx('ftCta')}
              </button>
            </Reveal>
            <Reveal delay={0.32} className="mt-8 flex items-center gap-3 text-[12.5px] font-medium text-[color:var(--pro-muted)]">
              <span className="pro-live-dot" aria-hidden /> {tLx('heroNote')}
            </Reveal>
          </div>

          <Reveal delay={0.15} y={34}>
            <div className="relative">
              <PillTabs
                idBase="pub-hero"
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
              {/* floating sensor comment chip — Sparkdesign review bubble */}
              <div className="pro-card pro-float absolute -bottom-6 -left-4 hidden max-w-[250px] items-start gap-2.5 p-3.5 md:flex lg:-left-10">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--pro-sage-soft)] text-[color:var(--pro-accent-ink)]">
                  <Droplets className="size-3.5" aria-hidden />
                </span>
                <span className="text-[12px] font-medium leading-snug text-[color:var(--pro-muted)]">
                  {tLx('heroChipComment')}
                  <span className="mt-1 block text-[11px] font-semibold text-[color:var(--pro-ink)]">{tLx('heroChipWho')}</span>
                </span>
              </div>
              <div className="pro-card absolute -top-5 right-3 hidden items-center gap-2 p-3.5 md:flex">
                <span className="pro-live-dot" aria-hidden />
                <span className="text-[12px] font-semibold text-[color:var(--pro-ink)]">{tLx('heroChipOk')}</span>
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
      <section id="product" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('fnKicker')} title={tP('fnTitle')} />
          <Reveal delay={0.1} className="mt-7">
            <PillTabs
              idBase="pub-fn"
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
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--pro-sage-soft)] text-[color:var(--pro-accent-ink)]">
                        <Check className="size-3" aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

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
                          {k === 0 ? tLx('heroStat1') : k === 1 ? tP('benchCol3') : tP('heroStatC')}
                        </span>
                        <span className="pro-live-dot" aria-hidden />
                      </div>
                      <div className="pro-display mt-2 text-xl">
                        <CountUp value={k === 0 ? 1420 : k === 1 ? 31 : 94} suffix={k === 2 ? '%' : ''} />
                      </div>
                      <div className="mt-2.5 flex h-10 items-end gap-1" aria-hidden>
                        {[34, 58, 41, 72, 55, 88, 63, 47, 78, 52].map((h, j) => (
                          <span
                            key={j}
                            className="pro-bar w-full rounded-sm"
                            style={{ height: `${h}%`, background: k === 1 ? '#D9A08C66' : 'rgba(18,137,126,0.22)', animationDelay: `${j * 60}ms` }}
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

      {/* ================= ORBITAL PANEL ================= */}
      <section id="orbit" ref={orbitRef} className="scroll-mt-24 px-3 md:px-6">
        <Reveal>
          <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[2.5rem] bg-[#050508]">
            <div className="relative h-[460px] md:h-[560px]">
              {orbitVisible ? <EarthScene /> : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[12px] font-semibold tracking-[0.2em] text-white/30">LOADING ORBIT…</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-14">
                <div className="max-w-md px-6 text-center">
                  <span className="pro-eyebrow !text-cyan-300">{tP('orbitKicker')}</span>
                  <h2 className="pro-display mt-3 text-2xl text-white md:text-[2rem]">{tP('orbitTitle')}</h2>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-white/60">{tP('orbitBody')}</p>
                </div>
              </div>
              <span className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11.5px] font-semibold text-white/70 backdrop-blur">
                {tP('orbitHint')}
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= ROLE CARDS — WIRED ================= */}
      <section id="roles" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tLx('ftKicker')} title={tLx('ftTitle')} sub={tP('pubRoleLead')} />
          <Reveal delay={0.06}><p className="mt-2 flex items-center gap-2 text-[12.5px] font-medium text-[color:var(--pro-muted)]">
            <MousePointerClick className="size-4" aria-hidden /> {tP('pubRoleHint')}
          </p></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              const busy = entering === r.key;
              return (
                <Reveal key={r.key} delay={i * 0.05}>
                  <button
                    type="button"
                    onClick={() => openRole(r)}
                    disabled={entering !== null}
                    className="pro-card group flex w-full flex-col p-6 text-left disabled:cursor-wait"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: `${r.accent}14`, color: r.accent }}>
                        <Icon className="size-5.5" aria-hidden />
                      </span>
                      <ArrowUpRight className="size-5 text-[color:var(--pro-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--pro-ink)]" aria-hidden />
                    </div>
                    <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: r.accent }}>
                      {tPortal(`role.${r.key}` as 'role.citizen')}
                    </div>
                    <h3 className="pro-display mt-1.5 text-[1.3rem] leading-snug">
                      {tPortal(`${r.key}.title` as 'citizen.title')}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[color:var(--pro-muted)] line-clamp-3">
                      {tPortal(`${r.key}.sub` as 'citizen.sub')}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: r.accent }}>
                      {busy ? (
                        <><Loader2 className="size-4 animate-spin" aria-hidden /> {tLx('roleEntering')}</>
                      ) : (
                        <>{tP('rlKicker')} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></>
                      )}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
          {err && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {err}
            </p>
          )}
        </div>
      </section>

      {/* ================= WORKFLOW TABS ================= */}
      <section id="loop" className="pro-band scroll-mt-24 border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('wfKicker')} title={tP('wfTitle')} />
          <Reveal delay={0.1} className="mt-7">
            <PillTabs
              idBase="pub-wf"
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
                <span className="pro-display text-[13px] font-bold uppercase tracking-[0.2em] text-[color:var(--pro-accent-ink)]">
                  {String(Number(wfTab) + 1).padStart(2, '0')} — {wf.tab}
                </span>
                <h3 className="pro-display mt-3 text-2xl md:text-[1.8rem]">{wf.title}</h3>
                <p className="pro-lead mt-4">{wf.body}</p>
                <button type="button" onClick={() => setView('signup')} className="pro-btn pro-btn-primary mt-7">
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

      {/* ================= BENCHMARK ================= */}
      <section className="scroll-mt-24 py-16 md:py-24">
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
                accent="#12897E"
              />
            ))}
          </div>
          <Reveal delay={0.1} className="mt-10">
            <h3 className="pro-display text-xl md:text-2xl">{tP('benchTimelineTitle')}</h3>
          </Reveal>
          <div className="mt-6">
            {timeline.map((item, i) => (
              <Reveal key={item.when} delay={i * 0.05}>
                <div className="relative grid grid-cols-[112px_1fr] gap-4 border-l border-[color:var(--pro-line)] py-4 pl-6 md:grid-cols-[140px_1fr]">
                  <span
                    className="absolute -left-[5px] top-7 size-2.5 rounded-full bg-[color:var(--pro-accent)] ring-4 ring-[color:var(--pro-paper)]"
                    aria-hidden
                  />
                  <span className="pt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[color:var(--pro-accent-ink)]">{item.when}</span>
                  <span className="text-[14.5px] leading-relaxed text-[color:var(--pro-ink)]/85">{item.what}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}><p className="mt-4 text-[12px] italic text-[color:var(--pro-muted)]">{tP('benchNote')}</p></Reveal>
        </div>
      </section>

      {/* ================= STORIES ================= */}
      <section className="pro-band border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('storyKicker')} title={tP('storyTitle')} />
          <Reveal delay={0.1} className="mt-8"><Stories t={(k) => tP(k as 'story1')} /></Reveal>
        </div>
      </section>

      {/* ================= PLANS ================= */}
      <section id="plans" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <SectionHead kicker={tP('planKicker')} title={tP('planTitle')} sub={tP('planSub')} center />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.08}>
                <div className={cn('pro-card relative flex h-full flex-col p-7', plan.hot && 'border-2 !border-[color:var(--pro-accent)]')}>
                  {plan.hot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--pro-accent)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
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
                        <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--pro-accent)]" aria-hidden /> {f}
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
      <section id="faq" className="pro-band scroll-mt-24 border-y border-[color:var(--pro-line)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.4fr]">
          <SectionHead kicker={tP('faqKicker')} title={tP('faqTitle')} />
          <Reveal delay={0.08}><Faq items={faqItems} /></Reveal>
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-3 overflow-hidden rounded-[2.5rem] bg-[#0D1713] md:inset-6">
          <DotField density={34} color="rgba(255,255,255,0.14)" accent="rgba(18,137,126,0.6)" />
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
            <button type="button" onClick={() => setView('signup')} className="pro-btn pro-btn-accent">
              {tP('ctaBtn')} <ArrowRight className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              className="pro-btn h-[46px] border border-white/25 text-white hover:bg-white/10"
            >
              {tP('ctaBtn2')}
            </button>
          </Reveal>
          <Reveal delay={0.24} className="mt-14">
            <div className="flex items-end justify-center gap-4 md:gap-6" aria-hidden>
              {['/images/landing/monsoon-2.jpg', '/images/landing/river-city-3.jpg', '/images/landing/rescue-1.jpg'].map((src, i) => (
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
        note={tLx('heroSub')}
        columns={[
          {
            title: tLx('ftKicker'),
            links: ROLES.slice(0, 4).map((r) => ({
              label: tPortal(`role.${r.key}` as 'role.citizen'),
              onClick: () => openRole(r),
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
              { label: tLx('heroCta'), onClick: () => setView('signup') },
              { label: tP('heroCta2'), onClick: () => setView('publicMap') },
            ],
          },
        ]}
      />
    </div>
  );
}
