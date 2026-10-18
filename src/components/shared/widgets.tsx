'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { Severity, Priority } from '@/lib/types';
import { Database, RefreshCw, Radio, WifiOff, Clock } from 'lucide-react';

// ============ Severity badge ============
const SEV_STYLES: Record<Severity, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  MODERATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
};

export function SeverityBadge({ severity, score, className }: { severity: Severity; score?: number; className?: string }) {
  const t = useTranslations('app.severity');
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide', SEV_STYLES[severity], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {t(severity)}
      {score !== undefined && <span className="font-mono opacity-80">· {score}</span>}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations('app.priority');
  const styles: Record<Priority, string> = {
    LOW: 'text-slate-500 border-slate-400/40 bg-slate-500/5',
    MEDIUM: 'text-sky-600 dark:text-sky-400 border-sky-500/40 bg-sky-500/10',
    HIGH: 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10',
    URGENT: 'text-red-600 dark:text-red-400 border-red-500/40 bg-red-500/10',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold', styles[priority])}>
      {t(priority)}
    </span>
  );
}

// ============ Data source status chip (LIVE / SIMULATED / …) ============
export function SourceChip({ status, className }: { status: 'LIVE' | 'SIMULATED' | 'STALE' | 'UNAVAILABLE' | 'DELAYED'; className?: string }) {
  const t = useTranslations('common');
  const map = {
    LIVE: { icon: Radio, cls: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10', label: t('live'), pulse: true },
    DELAYED: { icon: Clock, cls: 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10', label: t('delayed'), pulse: false },
    STALE: { icon: Clock, cls: 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10', label: t('stale'), pulse: false },
    SIMULATED: { icon: Database, cls: 'text-violet-600 dark:text-violet-400 border-violet-500/40 bg-violet-500/10', label: t('simulated'), pulse: false },
    UNAVAILABLE: { icon: WifiOff, cls: 'text-slate-500 border-slate-400/40 bg-slate-500/10', label: t('unavailable'), pulse: false },
  } as const;
  const M = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase font-mono', M.cls, className)}>
      <M.icon className={cn('size-3', M.pulse && 'animate-pulse')} />
      {M.label}
    </span>
  );
}

// ============ Demo data banner ============
export function DemoBanner({ children, className }: { children?: React.ReactNode; className?: string }) {
  const t = useTranslations('common');
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-700 dark:text-violet-300', className)}>
      <Database className="mt-0.5 size-3.5 shrink-0" />
      <span>{children ?? t('demoNote')}</span>
    </div>
  );
}

// ============ Status pill (incidents / tasks / recs) ============
export function StatusPill({ status }: { status: string }) {
  const t = useTranslations('app.status');
  const styles: Record<string, string> = {
    OPEN: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    ACKNOWLEDGED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    RESOLVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    CLOSED: 'bg-slate-500/10 text-slate-500 border-slate-400/30',
    REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    ASSIGNED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    SUBMITTED: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    DONE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-400/30',
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    CONVERTED: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium', styles[status] ?? 'bg-slate-500/10 text-slate-500 border-slate-400/30')}>
      {t(status)}
    </span>
  );
}

// ============ Refresh helper text ============
export function Freshness({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <RefreshCw className="size-3" />
      {label}
    </span>
  );
}
