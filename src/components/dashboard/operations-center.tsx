'use client';

/**
 * OPERATIONS CENTER — the workspace home, modelled on the user's reference
 * dashboard ("Operations Center / Needs Attention / Open Issues / Live map /
 * Recent reports") but tailored to JALGUARD's water-risk domain:
 *
 *   1. Header (title + date + data-source chip + quick actions)
 *   2. Needs Attention banner (overdue / unassigned / nearing due date)
 *   3. Five stat cards (honest counts, no fabricated trends)
 *   4. High-priority issues list + Live map
 *   5. Recent reports table (tabs: All / Open / In progress / Resolved)
 *
 * Fully responsive: 5-col stats → 2-col, two-pane → stacked, table → cards.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { api, timeAgo } from '@/lib/client-api';
import { num, age, coords, shortDateTime } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge, StatusPill, SourceChip, SeverityBadge } from '@/components/shared/widgets';
import { useTheme } from 'next-themes';
import { IncidentDetailDialog, type Incident } from '@/components/app/incidents-view';
import type { Task } from '@/components/app/tasks-view';
import { toast } from '@/hooks/use-toast';
import type { Severity } from '@/lib/types';
import {
  AlertTriangle, CalendarDays, ChevronRight, ClipboardList, Clock, Droplets, HardHat,
  Lightbulb, Loader2, MapPin, RefreshCw, ShieldAlert, Siren, UserPlus, Wrench,
} from 'lucide-react';
import { PageHeader, OpsCard, ViewAllLink, StatCard, LegendDot, incidentDot } from './ops-shared';
import { CitizenHome, FieldHome, AdminHome } from './role-homes';

const RiskMap = dynamic(() => import('@/components/map/risk-map'), { ssr: false });

interface Assessment {
  id: string; city: string; score: number; severity: Severity; confidence: number; createdAt: string;
  asset?: { name: string; code: string; city: string } | null;
}

const SEV_ICON_TONE: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-600 dark:text-red-400',
  HIGH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  MODERATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  LOW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

function SevIcon({ severity }: { severity: string }) {
  const cls = SEV_ICON_TONE[severity] ?? SEV_ICON_TONE.LOW;
  return (
    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
      <Droplets className="size-4" />
    </span>
  );
}

export function OperationsCenter() {
  const t = useTranslations('app.ops');
  const tCat = useTranslations('app.category');
  const tSev = useTranslations('app.severity');
  const { region, setAppPage, user } = useAppStore();
  const { resolvedTheme } = useTheme();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [wxStatus, setWxStatus] = useState<'LIVE' | 'SIMULATED' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [today, setToday] = useState('');
  const [tab, setTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    setToday(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
    (async () => {
      const [inc, tk, as, wx] = await Promise.all([
        api<{ incidents: Incident[] }>('/api/incidents').catch(() => ({ incidents: [] })),
        api<{ tasks: Task[] }>('/api/tasks').catch(() => ({ tasks: [] })),
        api<{ assessments: Assessment[] }>('/api/assessments').catch(() => ({ assessments: [] })),
        fetch('/api/weather?lat=19.076&lon=72.8777&city=Mumbai').then((r) => r.json()).catch(() => null),
      ]);
      setIncidents(inc.incidents);
      setTasks(tk.tasks);
      setAssessments(as.assessments);
      if (wx) setWxStatus(wx.status ?? 'SIMULATED');
      setLoading(false);
    })();
  }, []);

  async function rerun() {
    setRefreshing(true);
    try {
      const res = await api<{ generated: number }>('/api/assessments', { body: { city: region || undefined } });
      toast({ title: `Re-assessed ${res.generated} assets` });
      const as = await api<{ assessments: Assessment[] }>('/api/assessments');
      setAssessments(as.assessments);
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }

  // ---------- derived (region-filtered, all NaN-safe) ----------
  const inRegion = <T extends { city?: string | null }>(rows: T[]) => rows.filter((r) => !region || r.city === region);

  const openIncidents = useMemo(
    () => inRegion(incidents).filter((i) => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(i.status.toUpperCase())),
    [incidents, region]
  );
  const activeTasks = useMemo(
    () => inRegion(tasks).filter((tk) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(tk.status)),
    [tasks, region]
  );
  const overdueTasks = useMemo(
    () => activeTasks.filter((tk) => tk.dueAt && new Date(tk.dueAt).getTime() < Date.now()),
    [activeTasks]
  );
  const nearingTasks = useMemo(
    () => activeTasks.filter((tk) => {
      if (!tk.dueAt) return false;
      const due = new Date(tk.dueAt).getTime();
      return due >= Date.now() && due - Date.now() < 24 * 3600 * 1000;
    }),
    [activeTasks]
  );
  const unassignedTasks = useMemo(
    () => activeTasks.filter((tk) => !tk.assignedToId),
    [activeTasks]
  );
  const unassignedHigh = useMemo(
    () => unassignedTasks.filter((tk) => ['HIGH', 'URGENT'].includes(tk.priority.toUpperCase())),
    [unassignedTasks]
  );
  const criticalAssets = useMemo(
    () => inRegion(assessments).filter((a) => a.severity === 'CRITICAL').length,
    [assessments, region]
  );
  const highPriorityIncidents = useMemo(
    () => openIncidents
      .filter((i) => ['HIGH', 'CRITICAL'].includes(i.severity.toUpperCase()))
      .sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1) - (b.severity === 'CRITICAL' ? -1 : 1) || +new Date(b.createdAt) - +new Date(a.createdAt)),
    [openIncidents]
  );
  const resolvedCount = useMemo(
    () => inRegion(incidents).filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status.toUpperCase())).length,
    [incidents, region]
  );
  const progressCount = useMemo(
    () => inRegion(incidents).filter((i) => i.status.toUpperCase() === 'IN_PROGRESS').length,
    [incidents, region]
  );

  const attentionItems = [
    { n: overdueTasks.length, card: t('overdueCard', { n: num(overdueTasks.length) }), sub: t('overdueSub'), cta: t('resolveNow'), icon: Clock, go: 'tasks' as const, tone: 'bg-amber-500 hover:bg-amber-600' },
    { n: (unassignedHigh.length > 0 ? unassignedHigh : unassignedTasks).length, card: t('unassignedCard', { n: num(unassignedHigh.length > 0 ? unassignedHigh.length : unassignedTasks.length) }), sub: t('unassignedSub'), cta: t('assignNow'), icon: UserPlus, go: 'tasks' as const, tone: 'bg-amber-500 hover:bg-amber-600' },
    { n: nearingTasks.length, card: t('nearingCard', { n: num(nearingTasks.length) }), sub: t('nearingSub'), cta: t('reviewNow'), icon: Siren, go: 'incidents' as const, tone: 'bg-amber-500 hover:bg-amber-600' },
  ].filter((x) => x.n > 0);
  const attentionTotal = attentionItems.reduce((s, x) => s + x.n, 0);

  const recent = useMemo(() => {
    const rows = inRegion(incidents);
    const filtered = tab === 'ALL' ? rows
      : tab === 'OPEN' ? rows.filter((i) => ['OPEN', 'ACKNOWLEDGED'].includes(i.status.toUpperCase()))
      : tab === 'IN_PROGRESS' ? rows.filter((i) => i.status.toUpperCase() === 'IN_PROGRESS')
      : rows.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status.toUpperCase()));
    return [...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);
  }, [incidents, region, tab]);

  const canRerun = ['municipal', 'disaster', 'analyst', 'super_admin', 'org_admin'].includes(user?.role ?? '');

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      {/* ===== 1. header ===== */}
      <PageHeader
        title={t('centerTitle')}
        sub={t('centerSub')}
        right={
          <>
            {wxStatus && <SourceChip status={wxStatus} />}
            <span className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground sm:flex">
              <CalendarDays className="size-3.5" /> {today || '—'}
            </span>
            {canRerun && (
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={refreshing || loading} onClick={rerun}>
                {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {t('rerun')}
              </Button>
            )}
            {canRerun && (
              <Button size="sm" className="h-8 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500" onClick={() => setAppPage('interventions')}>
                <Lightbulb className="size-3.5" /> {t('recommendations')}
              </Button>
            )}
          </>
        }
      />

      {/* ===== 2. needs attention ===== */}
      {loading ? (
        <Skeleton className="h-36 rounded-xl" />
      ) : attentionTotal === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="size-4.5" />
          </span>
          <div>
            <div className="text-[14px] font-bold text-foreground">{t('allClear')}</div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t('allClearSub')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-foreground">{t('needsTitle')}</span>
                <Badge className="border-transparent bg-amber-500 text-[9.5px] font-bold tracking-wide text-white">{t('actionRequired')}</Badge>
              </div>
              <div className="text-[12.5px] text-muted-foreground">{t('itemsNeedAction', { n: num(attentionTotal) })}</div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {attentionItems.map((a) => (
              <div key={a.cta} className="rounded-lg border border-border/70 bg-card p-3.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <a.icon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-[13px] font-bold leading-tight text-foreground">{a.card}</span>
                </div>
                <p className="mt-1 pl-6 text-[11.5px] leading-relaxed text-muted-foreground">{a.sub}</p>
                <Button size="sm" className={`mt-2.5 h-7 text-[11.5px] font-semibold text-white ${a.tone}`} onClick={() => setAppPage(a.go)}>
                  {a.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 3. stat cards ===== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={ClipboardList} label={t('openIssues')} value={openIncidents.length} note={t('openIssuesNote')} tone="blue" loading={loading} />
        <StatCard icon={Clock} label={t('overdueLabel')} value={overdueTasks.length} note={t('overdueNote')} tone="red" loading={loading} />
        <StatCard icon={UserPlus} label={t('unassignedLabel')} value={unassignedTasks.length} note={t('unassignedNote')} tone="violet" loading={loading} />
        <StatCard icon={ShieldAlert} label={t('criticalAssets')} value={criticalAssets} note={t('criticalNote')} tone="orange" loading={loading} />
        <StatCard icon={HardHat} label={t('activeOrders')} value={activeTasks.length} note={t('activeNote')} tone="emerald" loading={loading} />
      </div>

      {/* ===== 4. high-priority issues + live map ===== */}
      <div className="grid gap-4 lg:grid-cols-5">
        <OpsCard
          title={t('highPriority')}
          chip={<Badge variant="outline" className="gap-1.5 border-red-500/40 text-[10px] font-bold text-red-600 dark:text-red-400"><span className="size-1.5 rounded-full bg-red-500" /> {tSev('HIGH')}</Badge>}
          action={<ViewAllLink onClick={() => setAppPage('incidents')} />}
          className="lg:col-span-3"
          bodyClassName="px-2"
        >
          {loading ? (
            <div className="space-y-2 px-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : highPriorityIncidents.length === 0 ? (
            <div className="px-2 py-8 text-center text-[12.5px] text-muted-foreground">{t('allClearSub')}</div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                {highPriorityIncidents.slice(0, 5).map((i) => (
                  <button key={i.id} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/50" onClick={() => setSelectedIncident(i)}>
                    <SevIcon severity={i.severity} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">{i.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="size-3 shrink-0" /> {i.city} · {coords(i.lat, i.lon)}
                      </span>
                    </span>
                    <span className="hidden shrink-0 sm:block"><PriorityBadge priority={i.severity === 'CRITICAL' ? 'URGENT' : 'HIGH'} /></span>
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-muted-foreground md:block">{age(i.createdAt)}</span>
                    <span className="shrink-0"><StatusPill status={i.status} /></span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                  </button>
                ))}
              </div>
              <div className="px-2 pt-2.5 text-[11px] text-muted-foreground">
                {t('showing', { n: num(Math.min(5, highPriorityIncidents.length)), m: num(highPriorityIncidents.length) })}
              </div>
            </>
          )}
        </OpsCard>

        <OpsCard
          title={t('liveMap')}
          action={<button onClick={() => setAppPage('map')} className="text-[12px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400">{t('viewFullMap')}</button>}
          className="lg:col-span-2"
          bodyClassName="px-3 pb-3"
        >
          <div className="h-64 overflow-hidden rounded-lg border border-border/60 md:h-72">
            <RiskMap
              assessments={[]}
              incidents={openIncidents as never}
              tasks={[]}
              showRisk={false}
              showIncidents
              showTasks={false}
              minSeverity="LOW"
              flyTarget={null}
              compact
              theme={(resolvedTheme === 'dark' ? 'dark' : 'light')}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <LegendDot color="#0EA5E9" label={t('legendOpen')} count={openIncidents.filter((i) => ['OPEN', 'ACKNOWLEDGED'].includes(i.status.toUpperCase())).length} />
            <LegendDot color="#F59E0B" label={t('legendProgress')} count={progressCount} />
            <LegendDot color="#10B981" label={t('legendResolved')} count={resolvedCount} />
          </div>
        </OpsCard>
      </div>

      {/* ===== 5. recent reports ===== */}
      <OpsCard
        title={t('recentReports')}
        action={<ViewAllLink onClick={() => setAppPage('incidents')} />}
        bodyClassName="px-0 pb-0"
      >
        {/* tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-4">
          {([
            ['ALL', t('tabAll'), incidents.length],
            ['OPEN', t('legendOpen'), openIncidents.filter((i) => ['OPEN', 'ACKNOWLEDGED'].includes(i.status.toUpperCase())).length],
            ['IN_PROGRESS', t('legendProgress'), progressCount],
            ['RESOLVED', t('legendResolved'), resolvedCount],
          ] as const).map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                tab === key ? 'bg-emerald-600 text-white' : 'border border-border/70 bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {label} {num(n)}
            </button>
          ))}
        </div>

        {/* desktop table */}
        <div className="mt-3 hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead>
              <tr className="border-y border-border/60 bg-muted/40 text-[10.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-semibold">{t('colIssue')}</th>
                <th className="px-3 py-2 font-semibold">{t('colCategory')}</th>
                <th className="px-3 py-2 font-semibold">{t('colStatus')}</th>
                <th className="px-3 py-2 font-semibold">{t('colPriority')}</th>
                <th className="px-3 py-2 font-semibold">{t('colReported')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('colAge')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6"><Skeleton className="h-16 w-full rounded-lg" /></td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('allClearSub')}</td></tr>
              ) : (
                recent.map((i) => (
                  <tr key={i.id} className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/40" onClick={() => setSelectedIncident(i)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${incidentDot(i.status)}1A`, color: incidentDot(i.status) }}>
                          <Wrench className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-foreground">{i.title}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{i.addressNote ?? `${i.city} · ${coords(i.lat, i.lon)}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{tCat(i.category as 'WATERLOGGING')}</td>
                    <td className="px-3 py-2.5"><StatusPill status={i.status} /></td>
                    <td className="px-3 py-2.5"><PriorityBadge priority={i.severity === 'CRITICAL' ? 'URGENT' : i.severity === 'HIGH' ? 'HIGH' : i.severity === 'MODERATE' ? 'MEDIUM' : 'LOW'} /></td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{shortDateTime(i.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{age(i.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="space-y-2 px-4 py-3 lg:hidden">
          {loading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : recent.length === 0 ? (
            <div className="py-6 text-center text-[12.5px] text-muted-foreground">{t('allClearSub')}</div>
          ) : (
            recent.map((i) => (
              <button key={i.id} className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left" onClick={() => setSelectedIncident(i)}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${incidentDot(i.status)}1A`, color: incidentDot(i.status) }}>
                  <Wrench className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">{i.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{tCat(i.category as 'WATERLOGGING')} · {i.city} · {timeAgo(i.createdAt)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill status={i.status} />
                  <PriorityBadge priority={i.severity === 'CRITICAL' ? 'URGENT' : i.severity === 'HIGH' ? 'HIGH' : i.severity === 'MODERATE' ? 'MEDIUM' : 'LOW'} />
                </span>
              </button>
            ))
          )}
        </div>
      </OpsCard>

      <IncidentDetailDialog incident={selectedIncident} onClose={() => setSelectedIncident(null)} onChanged={() => api<{ incidents: Incident[] }>('/api/incidents').then((r) => setIncidents(r.incidents)).catch(() => {})} />
    </div>
  );
}

// ============ Router (role → home) ============
export function DashboardPage() {
  const { user } = useAppStore();
  const role = user?.role;
  if (!user) return null;
  if (role === 'citizen') return <CitizenHome />;
  if (role === 'field' || role === 'infra') return <FieldHome />;
  if (role === 'org_admin' || role === 'super_admin') return <AdminHome />;
  return <OperationsCenter />;
}
