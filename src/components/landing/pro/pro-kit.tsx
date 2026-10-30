'use client';

/**
 * PRO KIT — shared primitives for the ReactBits Pro editorial landing system.
 * Light-only, Instrument Sans, reduced-motion disciplined.
 */

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered entrance                                  */
/* ------------------------------------------------------------------ */
export function Reveal({
  children, delay = 0, y = 26, className, once = true,
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string; once?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: 'blur(5px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* DotField — Imageworks-style pointer-reactive dot lattice            */
/* ------------------------------------------------------------------ */
export function DotField({
  className, density = 26, color = 'rgba(22,33,29,0.16)', accent = 'rgba(18,137,126,0.55)',
}: {
  className?: string; density?: number; color?: string; accent?: string;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0, h = 0, cols = 0, rows = 0;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / density) + 1;
      rows = Math.ceil(h / density) + 1;
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          const x = ix * density;
          const y = iy * density;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const near = Math.max(0, 1 - dist / 150);
          // gentle breathing wave + pointer swell
          const breathe = reduced ? 0 : Math.sin(t / 1400 + (ix + iy) * 0.7) * 0.35 + 0.65;
          const r = 1 + near * 2.1 + (reduced ? 0 : breathe * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = near > 0.05 ? accent : color;
          ctx.globalAlpha = 0.5 + near * 0.5;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
    };
    const onLeave = () => { pointer.tx = -9999; pointer.ty = -9999; };

    resize();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [density, color, accent]);

  return <canvas ref={ref} aria-hidden className={cn('pro-dotfield', className)} />;
}

/* ------------------------------------------------------------------ */
/* CountUp — reduced-motion-safe number entrance                       */
/* ------------------------------------------------------------------ */
export function CountUp({ value, className, suffix }: { value: number; className?: string; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [v, setV] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduced) { setV(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduced]);

  return <span ref={ref} className={className}>{v.toLocaleString()}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/* PillTabs — animated segmented switcher                              */
/* ------------------------------------------------------------------ */
export function PillTabs({
  tabs, active, onChange, idBase, className,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
  idBase: string;
  className?: string;
}) {
  return (
    <div className={cn('pro-tabs', className)} role="tablist" aria-label={idBase}>
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            data-on={on}
            className="pro-tab"
            onClick={() => onChange(tab.key)}
          >
            {on && (
              <motion.span
                layoutId={`pro-pill-${idBase}`}
                className="pro-tab-pill"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee — trust bar                                                 */
/* ------------------------------------------------------------------ */
export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="pro-marquee-mask py-1">
      <div className="pro-marquee items-center gap-10 pr-10">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-3 whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.08em] text-[color:var(--pro-muted)]"
          >
            <span className="size-1.5 rounded-full bg-[color:var(--pro-sage)]" aria-hidden />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Faq — hand-rolled accordion                                         */
/* ------------------------------------------------------------------ */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = React.useState<number>(0);
  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className="pro-faq-item" data-open={isOpen} key={i}>
            <button type="button" className="pro-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
              {item.q}
              <Plus className="pro-faq-icon size-5" aria-hidden />
            </button>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="pro-faq-a"
              >
                {item.a}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProFooter — link columns + rising brand                             */
/* ------------------------------------------------------------------ */
export function ProFooter({ columns, note }: {
  columns: { title: string; links: { label: string; onClick?: () => void }[] }[];
  note: string;
}) {
  const setView = useAppStore((s) => s.setView);
  return (
    <footer className="border-t border-[color:var(--pro-line)] bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <button type="button" className="flex items-center gap-2.5" onClick={() => setView('landing')}>
              { }
              <img src="/logo.svg" alt="JALGUARD" className="size-9" />
              <span className="text-[17px] font-bold tracking-[0.06em] text-[color:var(--pro-ink)]">
                JAL<span className="text-[color:var(--pro-accent)]">GUARD</span>
              </span>
            </button>
            <p className="pro-lead mt-4 max-w-[300px] text-[13.5px]">{note}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--pro-muted)]">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={l.onClick}
                      className="text-[13.5px] font-medium text-[color:var(--pro-ink)]/75 transition-colors hover:text-[color:var(--pro-accent)]"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pro-rise mt-12 select-none overflow-hidden" aria-hidden>
          <div className="pro-display bg-gradient-to-b from-[color:var(--pro-ink)]/10 to-[color:var(--pro-ink)]/[0.03] bg-clip-text text-center text-[15vw] font-bold leading-[0.85] text-transparent md:text-[10rem]">
            JALGUARD
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--pro-line)] pt-6 text-[12.5px] text-[color:var(--pro-muted)] md:flex-row">
          <span>© {new Date().getFullYear()} JALGUARD — Hydro Resilience OS</span>
          <span className="flex items-center gap-2">
            <span className="pro-live-dot" aria-hidden /> Demo environment · sample city registry
          </span>
        </div>
      </div>
    </footer>
  );
}
