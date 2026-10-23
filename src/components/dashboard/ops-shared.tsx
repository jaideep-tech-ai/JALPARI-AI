'use client';

/**
 * OPS SHARED — Fixly-style "Operations Center" primitives.
 * Light, calm, user-friendly: white cards, soft borders, tinted icon tiles,
 * uppercase micro-labels, bold tabular numbers. Dark mode is handled by the
 * existing design tokens, so both themes stay consistent.
 * All numeric children flow through @/lib/format helpers — a NaN number can
 * never be rendered as a React child again.
 */

import { useTranslations } from 'next-intl';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/** Page header: bold title + muted subtitle, optional right-side actions. */
export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** White rounded card with a small header row: title left, action right. */
export function OpsCard({ title, chip, action, children, className, bodyClassName }: {
  title: string;
  chip?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-border/70 bg-card shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 pb-1 pt-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h2>
          {chip}
        </div>
        {action}
      </header>
      <div className={cn('px-4 pb-4 pt-2', bodyClassName)}>{children}</div>
    </section>
  );
}

/** "View all" text link used in card headers. */
export function ViewAllLink({ onClick }: { onClick: () => void }) {
  const t = useTranslations('app.ops');
  return (
    <button onClick={onClick} className="text-[12px] font-semibold text-sky-600 hover:underline dark:text-sky-400">
      {t('viewAll')}
    </button>
  );
}

/**
 * Stat card (Fixly style): tinted icon tile, uppercase label, big number,
 * honest context note underneath (no fabricated trends).
 */
export function StatCard({ icon: Icon, label, value, note, tone = 'blue', loading }: {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  tone?: 'blue' | 'red' | 'violet' | 'orange' | 'emerald' | 'amber';
  loading?: boolean;
}) {
  const tones: Record<string, string> = {
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className={cn('flex size-9 items-center justify-center rounded-lg', tones[tone])}>
        <Icon className="size-4.5" />
      </div>
      <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[24px] font-bold leading-none tabular-nums text-foreground">
        {loading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-muted" /> : num(value)}
      </div>
      <div className="mt-1.5 truncate text-[11.5px] text-muted-foreground">{note}</div>
    </div>
  );
}

/** Small legend chip with a colored dot, used under the live map. */
export function LegendDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {num(count)} {label}
    </span>
  );
}

/** Status dot color for incidents (mirrors StatusPill hues). */
export function incidentDot(status: string): string {
  const s = status.toUpperCase();
  if (s === 'RESOLVED' || s === 'CLOSED') return '#10B981';
  if (s === 'IN_PROGRESS') return '#F59E0B';
  if (s === 'REJECTED') return '#EF4444';
  return '#0EA5E9'; // OPEN / ACKNOWLEDGED
}
