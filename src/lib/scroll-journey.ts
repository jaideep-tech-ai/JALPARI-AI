'use client';

import { create } from 'zustand';

/**
 * Shared scroll-journey state for the WebGL Earth hero.
 * - progress: 0..1 scrubbed scroll progress across the journey wrapper
 * - visible: whether the journey wrapper is on screen (canvas mounts/unmounts)
 * - reduced: prefers-reduced-motion (freezes idle spin, twinkle, parallax)
 * - pointer: normalised pointer position [-1, 1] for parallax
 *
 * Consumed inside useFrame via getState() so per-frame updates never
 * trigger React re-renders.
 */
interface JourneyState {
  progress: number;
  visible: boolean;
  reduced: boolean;
  pointer: { x: number; y: number };
  setProgress: (p: number) => void;
  setVisible: (v: boolean) => void;
  setReduced: (r: boolean) => void;
  setPointer: (x: number, y: number) => void;
}

export const useJourney = create<JourneyState>((set) => ({
  progress: 0,
  visible: true,
  reduced: false,
  pointer: { x: 0, y: 0 },
  setProgress: (p) => set({ progress: Math.min(1, Math.max(0, p)) }),
  setVisible: (v) => set({ visible: v }),
  setReduced: (r) => set({ reduced: r }),
  setPointer: (x, y) => set({ pointer: { x, y } }),
}));
