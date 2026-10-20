'use client';

/**
 * HYDRO STAGE — left half of the cinematic auth split-screen.
 *
 * Layer 0: atmospheric light-blob mesh (Electric Cyan × Deep Emerald)
 * Layer 1: zero-gravity liquid-glass droplets (mouse-hover parallax physics)
 * Layer 2: floating 3D smartphone — glassmorphic screen rendering a glowing
 *          neon cyber-topographic flood-risk map with pulsing digital waves
 * Layer 3: <spline-viewer> embed slot — drop a published Spline scene URL
 *          into SPLINE_SCENE_URL and it overlays this stage automatically.
 *
 * Pure CSS-3D + one rAF loop: no WebGL payload, silky on high-end mobile.
 */

import { createElement, useEffect, useRef } from 'react';

// Paste a published Spline scene URL here (https://prod.spline.design/xxxx/scene.splinecode)
const SPLINE_SCENE_URL = '';

const DROPS = [
  { size: 118, x: 12, y: 12, depth: 26, dur: '9s', delay: '0s' },
  { size: 56, x: 74, y: 8, depth: 44, dur: '7.5s', delay: '.8s' },
  { size: 30, x: 86, y: 38, depth: 60, dur: '6.4s', delay: '1.6s' },
  { size: 74, x: 8, y: 62, depth: 38, dur: '8.2s', delay: '.4s' },
  { size: 40, x: 22, y: 82, depth: 52, dur: '7s', delay: '1.1s' },
  { size: 22, x: 64, y: 86, depth: 70, dur: '6s', delay: '2s' },
  { size: 15, x: 44, y: 6, depth: 78, dur: '5.6s', delay: '.2s' },
  { size: 48, x: 90, y: 68, depth: 34, dur: '8.8s', delay: '1.3s' },
];

export function HydroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const dropLayerRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // static stage — global reduced-motion CSS freezes keyframes

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      target.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
      target.current.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);

    // spring-smoothed parallax loop
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.055;
      pos.current.y += (target.current.y - pos.current.y) * 0.055;
      const { x, y } = pos.current;
      if (phoneRef.current) {
        phoneRef.current.style.transform = `rotateY(${x * 14}deg) rotateX(${y * -10}deg) translateZ(0)`;
      }
      if (dropLayerRef.current) {
        dropLayerRef.current.style.setProperty('--px', x.toFixed(4));
        dropLayerRef.current.style.setProperty('--py', y.toFixed(4));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      id="spline-3d-stage"
      className="relative hidden h-full w-full items-center justify-center overflow-hidden lg:flex"
      aria-hidden="true"
    >
      {/* atmosphere */}
      <div className="hc-mesh" />
      <div className="absolute inset-0 jg-grid-lines opacity-40" />

      {/* Layer 1 — zero-gravity droplets (depth-scaled mouse parallax) */}
      <div ref={dropLayerRef} className="absolute inset-0" style={{ ['--px' as string]: 0, ['--py' as string]: 0 }}>
        {DROPS.map((d, i) => (
          <div
            key={i}
            className="hc-drop"
            style={{
              width: d.size,
              height: d.size,
              left: `${d.x}%`,
              top: `${d.y}%`,
              animation: `hc-float-y ${d.dur} ease-in-out ${d.delay} infinite`,
              translate: `calc(var(--px, 0) * ${d.depth}px) calc(var(--py, 0) * ${d.depth}px)`,
            }}
          />
        ))}
      </div>

      {/* Layer 2 — floating smartphone */}
      <div className="hc-stage-3d relative z-10">
        <div ref={phoneRef} className="hc-phone relative">
          {/* chassis */}
          <div className="hc-phone-chassis relative h-[560px] w-[276px] p-[10px]">
            {/* side buttons */}
            <span className="absolute -right-[3px] top-[120px] h-16 w-[3px] rounded-r bg-gradient-to-b from-[#3A4656] to-[#141B28]" />
            <span className="absolute -left-[3px] top-[100px] h-10 w-[3px] rounded-l bg-gradient-to-b from-[#3A4656] to-[#141B28]" />
            <span className="absolute -left-[3px] top-[152px] h-10 w-[3px] rounded-l bg-gradient-to-b from-[#3A4656] to-[#141B28]" />

            {/* screen — neon cyber-topographic flood map */}
            <div className="hc-phone-screen relative h-full w-full overflow-hidden">
              <PhoneScreen />

              {/* scan sweep */}
              <div className="hc-screen-scan" />

              {/* notch */}
              <div className="absolute left-1/2 top-2.5 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/10" />
            </div>

            {/* floating glass read-outs (pop off the glass in 3D — outside the clipped screen) */}
            <div className="hc-chip absolute -left-16 top-24 z-20 rounded-2xl px-3.5 py-2.5" style={{ transform: 'translateZ(46px)' }}>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7DF6FF]">Flood risk</div>
              <div className="hc-num text-xl font-bold leading-none">87%</div>
            </div>
            <div className="hc-chip absolute -right-14 top-48 z-20 rounded-2xl px-3.5 py-2.5" style={{ transform: 'translateZ(58px)' }}>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7DF6FF]">24h rain</div>
              <div className="hc-num text-xl font-bold leading-none">142<span className="text-[11px]">mm</span></div>
            </div>
            <div className="hc-chip absolute -left-10 bottom-28 z-20 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ transform: 'translateZ(40px)' }}>
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10D9A0] opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-[#10D9A0]" />
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-[#C9F5EA]">LIVE · SENSOR GRID</span>
            </div>
          </div>

          {/* floor reflection */}
          <div className="absolute -bottom-16 left-1/2 h-10 w-[78%] -translate-x-1/2 rounded-[100%] bg-[#00F2FE]/12 blur-2xl" />
        </div>
      </div>

      {/* Layer 3 — Spline embed slot (overlays this stage once a URL is set) */}
      {SPLINE_SCENE_URL
        ? createElement('spline-viewer', {
            url: SPLINE_SCENE_URL,
            className: 'absolute inset-0 z-30 h-full w-full',
            'events-target': 'local',
          })
        : (
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-medium tracking-[0.18em] text-white/45">
            SPLINE READY — SET SPLINE_SCENE_URL TO EMBED 3D
          </span>
        </div>
      )}
    </div>
  );
}

/** The glowing neon cyber-topographic flood map rendered on the phone glass. */
function PhoneScreen() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 256 540" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="psGlow" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#00F2FE" stopOpacity="0.20" />
            <stop offset="0.55" stopColor="#0E4A66" stopOpacity="0.12" />
            <stop offset="1" stopColor="#04070D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="psLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00F2FE" />
            <stop offset="1" stopColor="#10D9A0" />
          </linearGradient>
        </defs>

        <rect width="256" height="540" fill="url(#psGlow)" />

        {/* cyber topographic contours */}
        <g fill="none" stroke="url(#psLine)" strokeWidth="1.1" opacity="0.55">
          <path className="hc-contour-line" d="M-20 120 C 40 84, 96 150, 148 112 S 250 70, 290 108" />
          <path className="hc-contour-line" style={{ animationDelay: '-1.2s' }} d="M-20 168 C 44 128, 100 196, 156 154 S 256 108, 292 150" />
          <path className="hc-contour-line" style={{ animationDelay: '-2.4s' }} d="M-20 216 C 48 174, 104 242, 162 198 S 260 148, 294 192" />
          <path className="hc-contour-line" style={{ animationDelay: '-3.6s' }} d="M-20 264 C 52 220, 108 288, 168 242 S 262 190, 296 234" />
          <path className="hc-contour-line" style={{ animationDelay: '-4.8s' }} d="M-20 312 C 56 266, 112 334, 174 286 S 264 232, 298 276" />
        </g>
        <g fill="none" stroke="#00F2FE" strokeWidth="0.7" opacity="0.28">
          <ellipse cx="128" cy="330" rx="150" ry="96" />
          <ellipse cx="128" cy="330" rx="110" ry="68" />
          <ellipse cx="128" cy="330" rx="72" ry="44" />
          <ellipse cx="128" cy="330" rx="36" ry="22" />
        </g>

        {/* flood polygon */}
        <path d="M60 356 L118 330 L196 344 L210 392 L150 418 L74 402 Z" fill="rgba(0,242,254,0.10)" stroke="#00F2FE" strokeWidth="1.2" opacity="0.85" />

        {/* pulsing digital waves */}
        <g fill="none" stroke="#10D9A0" strokeWidth="1.4" opacity="0.8">
          <path d="M30 470 q 14 -9 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0" />
          <path d="M30 486 q 14 -7 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0" opacity="0.55" />
          <path d="M30 502 q 14 -5 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0" opacity="0.3" />
        </g>

        {/* sensor pings */}
        <g>
          <circle className="hc-blink-dot" cx="96" cy="352" r="4" fill="#FF4D5E" />
          <circle className="hc-blink-dot" style={{ animationDelay: '.7s' }} cx="168" cy="360" r="4" fill="#FFB224" />
          <circle className="hc-blink-dot" style={{ animationDelay: '1.3s' }} cx="140" cy="392" r="4" fill="#10D9A0" />
          <circle className="hc-blink-dot" style={{ animationDelay: '1.9s' }} cx="70" cy="392" r="3.2" fill="#00F2FE" />
        </g>
      </svg>

      {/* screen chrome — status bar */}
      <div className="absolute inset-x-0 top-[38px] flex items-center justify-between px-5">
        <span className="font-mono text-[10px] font-semibold text-[#9FD8E8]/90">09:41</span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] tracking-[0.22em] text-[#7DF6FF]">JALGUARD</span>
          <span className="size-1.5 rounded-full bg-[#10D9A0] shadow-[0_0_8px_#10D9A0]" />
        </span>
      </div>

      {/* screen chrome — app header */}
      <div className="absolute inset-x-4 top-[64px] rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 backdrop-blur-md">
        <div className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#7DF6FF]/85">Chennai · Zone 04</div>
        <div className="mt-0.5 text-[13px] font-bold text-white">Hydro Intelligence</div>
        <div className="mt-1.5 flex gap-1">
          {[0.9, 0.55, 0.75, 0.4, 0.62].map((w, i) => (
            <span
              key={i}
              className="h-1 flex-1 origin-bottom rounded-full bg-gradient-to-r from-[#00F2FE] to-[#10D9A0]"
              style={{ animation: `hc-eq ${1.1 + i * 0.17}s ease-in-out ${i * 0.12}s infinite`, transform: `scaleY(${w})`, opacity: 0.85 }}
            />
          ))}
        </div>
      </div>

      {/* screen chrome — bottom tab bar */}
      <div className="absolute inset-x-5 bottom-6 flex items-center justify-around rounded-2xl border border-white/10 bg-black/45 px-2 py-2.5 backdrop-blur-md">
        {['#00F2FE', 'rgba(255,255,255,.35)', 'rgba(255,255,255,.35)', 'rgba(255,255,255,.35)'].map((c, i) => (
          <span key={i} className="size-1.5 rounded-full" style={{ background: c, boxShadow: i === 0 ? '0 0 10px #00F2FE' : 'none' }} />
        ))}
      </div>
    </div>
  );
}
