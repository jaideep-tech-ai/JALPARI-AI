'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api, timeAgo, formatINR } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SeverityBadge, StatusPill, PriorityBadge, SourceChip, DemoBanner } from '@/components/shared/widgets';
import { IncidentCreateDialog, IncidentDetailDialog, type Incident } from '@/components/app/incidents-view';
import { TaskDetailDialog, type Task } from '@/components/app/tasks-view';
import { toast } from '@/hooks/use-toast';
import { CITIES, type Severity, type RiskFactor } from '@/lib/types';
import {
  Droplets, AlertTriangle, ShieldCheck, HardHat, Users, Lightbulb, Database,
  Radio, Plus, MapPin, ChevronRight, ShieldQuestion, ClipboardCheck, RefreshCw, Loader2,
  Wrench, FileCheck2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const SEV_COLORS: Record<string, string> = { LOW: '#10B981', MODERATE: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444' };

interface Assessment {
  id: string; assetId: string | null; asset?: { name: string; code: string; category: string; city: string };
  city: string; score: number; severity: Severity; factors: string; confidence: number;
  source: string; isDemo: boolean; createdAt: string;
}
interface Rec { id: string; title: string; priority: string; status: string; estCostInr: number | null; asset?: { name: string; city: string } | null }
interface Analytics {
  totals: { incidents: number; openIncidents: number; assessments: number; pendingRecs: number; activeTasks: number; critical: number };
  trend: { date: string; score: number }[];
  byCategory: Record<string, number>;
  severityMix: Record<string, number>;
}

function useAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => {
    api<Analytics>('/api/analytics').then(setData).catch(() => {});
  }, []);
  return data;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Droplets; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${tone ?? 'border-emerald-500/25 bg-emerald-500/10'}`}>
          <Icon className={`size-5 ${tone ? '' : 'text-emerald-500'}`} />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-xl font-bold leading-none">{value}</div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({ data, title, demo }: { data: { date: string; score: number }[]; title: string; demo?: boolean }) {
  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
          {title}
          {demo && <Badge variant="outline" className="border-violet-500/40 text-[8px] text-violet-500">DEMO SERIES</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-3">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
            <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fill="url(#gRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============ Municipal / Operations dashboard ============
function MunicipalDashboard() {
  const t = useTranslations('app.municipal');
  const tSev = useTranslations('app.severity');
  const tCat = useTranslations('app.category');
  const tStatus = useTranslations('app.status');
  const analytics = useAnalytics();
  const region = useAppStore((s) => s.region);
  const setAppPage = useAppStore((s) => s.setAppPage);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [wxStatus, setWxStatus] = useState<string>('SIMULATED');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  async function load() {
    const a = await api<{ assessments: Assessment[] }>('/api/assessments').catch(() => ({ assessments: [] }));
    setAssessments(a.assessments);
    const r = await api<{ recommendations: Rec[] }>('/api/recommendations').catch(() => ({ recommendations: [] }));
    setRecs(r.recommendations);
    const tk = await api<{ tasks: Task[] }>('/api/tasks').catch(() => ({ tasks: [] }));
    setTasks(tk.tasks);
    const inc = await api<{ incidents: Incident[] }>('/api/incidents').catch(() => ({ incidents: [] }));
    setIncidents(inc.incidents);
    await fetch('/api/weather?lat=19.076&lon=72.8777&city=Mumbai').then((x) => x.json()).then((w) => setWxStatus(w.status)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function regenerate() {
    setRefreshing(true);
    try {
      const res = await api<{ generated: number }>('/api/assessments', { body: { city: region || undefined } });
      toast({ title: `Re-assessed ${res.generated} assets` });
      await load();
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }

  const cityAssessments = assessments.filter((a) => !region || a.city === region);
  const topRisk = [...cityAssessments].sort((x, y) => y.score - x.score).slice(0, 6);
  const pendingRecs = recs.filter((r) => r.status === 'PENDING');
  const openTasks = tasks.filter((tk) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(tk.status));
  const overdue = openTasks.filter((tk) => tk.dueAt && new Date(tk.dueAt) < new Date());
  const openIncidents = incidents.filter((i) => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(i.status));

  const sevMix = analytics ? Object.entries(analytics.severityMix).map(([k, v]) => ({ name: tSev(k as 'LOW'), value: v, color: SEV_COLORS[k] })) : [];
  const catData = analytics ? Object.entries(analytics.byCategory).map(([k, v]) => ({ name: tCat(k as 'WATERLOGGING'), count: v })) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{t('title')}{region ? ` · ${region}` : ''}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Radio className="size-3" /> Weather feed:
            <SourceChip status={wxStatus as 'LIVE'} />
            <span>· {timeAgo(new Date())}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={refreshing} onClick={regenerate}>
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Re-run assessments
          </Button>
          <Button size="sm" className="h-8 bg-emerald-500 text-xs font-semibold text-[#06251B] hover:bg-emerald-400" onClick={() => setAppPage('interventions')}>
            <Lightbulb className="size-3.5" /> {t('topRecs')} ({pendingRecs.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShieldQuestion} label="Critical assets" value={cityAssessments.filter((a) => a.severity === 'CRITICAL').length} tone="border-red-500/25 bg-red-500/10 text-red-500" />
        <StatCard icon={AlertTriangle} label={t('incidentRegister')} value={`${openIncidents.length} open`} tone="border-amber-500/25 bg-amber-500/10 text-amber-500" />
        <StatCard icon={HardHat} label={t('openTasks')} value={openTasks.length} tone="border-sky-500/25 bg-sky-500/10 text-sky-500" />
        <StatCard icon={ClipboardCheck} label={t('overdue')} value={overdue.length} tone="border-violet-500/25 bg-violet-500/10 text-violet-500" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TrendChart data={analytics?.trend ?? []} title={t('riskTrend')} demo />
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('hotspots')}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-2">
            <ScrollArea className="h-[180px]">
              <div className="divide-y px-2">
                {topRisk.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 shrink-0 font-mono text-sm font-bold" style={{ color: SEV_COLORS[a.severity] }}>{a.score}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium">{a.asset?.name ?? a.city}</div>
                      <div className="text-[10.5px] text-muted-foreground">{a.asset?.code ?? a.city} · confidence {a.confidence}%</div>
                    </div>
                    <SeverityBadge severity={a.severity} />
                  </div>
                ))}
                {topRisk.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No assessments yet — press Re-run assessments.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recommendations */}
        <Card className="py-4">
          <CardHeader className="flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('recommended')}</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAppPage('interventions')}>
              {t('topRecs')} <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pt-2">
            <ScrollArea className="h-56">
              <div className="space-y-2">
                {pendingRecs.slice(0, 6).map((r) => (
                  <div key={r.id} className="rounded-lg border bg-muted/30 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-semibold leading-snug">{r.title}</span>
                      <PriorityBadge priority={r.priority as 'MEDIUM'} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                      {r.asset && <span className="truncate">{r.asset.name}</span>}
                      <span className="ml-auto shrink-0">{formatINR(r.estCostInr)}</span>
                    </div>
                  </div>
                ))}
                {pendingRecs.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">All caught up.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Open tasks */}
        <Card className="py-4">
          <CardHeader className="flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('openTasks')}</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAppPage('tasks')}>
              {t('viewAll') ?? 'View'} <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pt-2">
            <ScrollArea className="h-56">
              <div className="space-y-2">
                {openTasks.slice(0, 6).map((tk) => (
                  <button key={tk.id} className="block w-full rounded-lg border bg-muted/30 p-2.5 text-left hover:border-emerald-500/40" onClick={() => setSelectedTask(tk)}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-[12px] font-semibold">{tk.title}</span>
                      <StatusPill status={tk.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                      {tk.assignedTo?.name ?? 'Unassigned'}
                      {tk.dueAt && new Date(tk.dueAt) < new Date() && <Badge className="border-red-500/40 text-[8px] text-red-500" variant="outline">{t('overdue')}</Badge>}
                    </div>
                  </button>
                ))}
                {openTasks.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No open tasks.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Incident register */}
        <Card className="py-4">
          <CardHeader className="flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('incidentRegister')}</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAppPage('incidents')}>
              {t('viewAll') ?? 'View'} <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pt-2">
            <ScrollArea className="h-56">
              <div className="space-y-2">
                {incidents.slice(0, 6).map((i) => (
                  <button key={i.id} className="block w-full rounded-lg border bg-muted/30 p-2.5 text-left hover:border-emerald-500/40" onClick={() => setSelectedIncident(i)}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-[12px] font-semibold">{i.title}</span>
                      <StatusPill status={i.status} />
                    </div>
                    <div className="mt-1 text-[10.5px] text-muted-foreground">{tCat(i.category as 'WATERLOGGING')} · {i.city} · {timeAgo(i.createdAt)}</div>
                  </button>
                ))}
                {incidents.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Register is empty.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('incidentsByCat')}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-2">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={catData} margin={{ top: 4, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="rgba(128,140,160,0.5)" interval={0} angle={-14} dy={8} />
                <YAxis tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" allowDecimals={false} />
                <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#38D9D6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('fieldStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center px-2 pt-2">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={sevMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={3} strokeWidth={0}>
                  {sevMix.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <DemoBanner>Counts aggregate the demo registry: {analytics?.totals.assessments ?? 0} assessments · {analytics?.totals.incidents ?? 0} incidents · trend series is demonstration data.</DemoBanner>

      <IncidentDetailDialog incident={selectedIncident} onClose={() => setSelectedIncident(null)} onChanged={load} />
      <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} onChanged={load} />
    </div>
  );
}

// ============ Citizen dashboard ============
function CitizenDashboard() {
  const t = useTranslations('app.citizen');
  const ti = useTranslations('app.incidents');
  const tStatus = useTranslations('app.status');
  const { user } = useAppStore();
  const [mine, setMine] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ incidents: Incident[] }>('/api/incidents?mine=1');
      setMine(r.incidents);
    } catch {
      setMine([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const advisories = [
    { title: 'Monsoon preparedness week', body: 'Labelled DEMO advisory: clear terrace drains, keep emergency kits ready and follow official channels.', tone: 'border-sky-500/30 bg-sky-500/5' },
    { title: 'High tide + rain expected', body: 'Labelled DEMO advisory: avoid coastal low-lying roads during 11:00–13:00 tomorrow.', tone: 'border-amber-500/30 bg-amber-500/5' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{t('title')}</h1>
          <p className="text-[12.5px] text-muted-foreground">{t('sub')}</p>
        </div>
        <Button size="sm" className="h-8 bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" /> {t('title')}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-[13px] font-semibold">{t('track')}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-2">
            {loading ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : mine.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Droplets className="size-7 text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground">{t('noReports')}</p>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-3.5" /> {t('title')}
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {mine.map((i) => (
                    <button key={i.id} className="block w-full rounded-lg border bg-muted/30 p-3 text-left hover:border-emerald-500/40" onClick={() => setSelected(i)}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold">{i.title}</span>
                        <StatusPill status={i.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MapPin className="size-3" /> {i.city} · {timeAgo(i.createdAt)}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-[13px] font-semibold">{t('advisories')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pt-2">
              {advisories.map((a) => (
                <div key={a.title} className={`rounded-lg border p-3 ${a.tone}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold">{a.title}</span>
                    <Badge variant="outline" className="border-violet-500/40 text-[8px] text-violet-500">DEMO</Badge>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-[13px] font-semibold">{t('safety')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-2">
              <ul className="space-y-1.5">
                {t('safetyTips').split('·').map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    {tip.trim()}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Signed in as {user?.name} · citizen access. Privileged dashboards require server-approved roles.
      </p>

      <IncidentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <IncidentDetailDialog incident={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}

// ============ Field dashboard ============
function FieldDashboard() {
  const t = useTranslations('app.field');
  const tt = useTranslations('app.tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Task | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ tasks: Task[] }>('/api/tasks?mine=1');
      setTasks(r.tasks);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const active = tasks.filter((tk) => ['ASSIGNED', 'IN_PROGRESS'].includes(tk.status));
  const submitted = tasks.filter((tk) => tk.status === 'SUBMITTED');
  const done = tasks.filter((tk) => ['APPROVED', 'DONE'].includes(tk.status));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={HardHat} label="Active" value={active.length} tone="border-sky-500/25 bg-sky-500/10 text-sky-500" />
        <StatCard icon={FileCheck2} label="Awaiting verification" value={submitted.length} tone="border-violet-500/25 bg-violet-500/10 text-violet-500" />
        <StatCard icon={ShieldCheck} label="Verified" value={done.length} tone="border-emerald-500/25 bg-emerald-500/10 text-emerald-500" />
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <HardHat className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('noTasks')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {[...active, ...submitted, ...done].map((tk) => (
            <button key={tk.id} onClick={() => setSelected(tk)} className="text-left">
              <Card className="jg-card-hover h-full py-4">
                <CardContent className="space-y-2 px-4">
                  <div className="text-[13.5px] font-semibold leading-snug">{tk.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill status={tk.status} />
                    <PriorityBadge priority={tk.priority as 'MEDIUM'} />
                    {tk.dueAt && <Badge variant="outline" className="text-[9px]">{t('dueLabel')}: {new Date(tk.dueAt).toLocaleDateString()}</Badge>}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {tt('evidenceCount', { n: JSON.parse(tk.evidence || '[]').length })}
                    {tk.isDemo && ' · DEMO'}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
      <TaskDetailDialog task={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}

// ============ Admin dashboard ============
function AdminDashboard() {
  const t = useTranslations('app.admin');
  const ta = useTranslations('app.nav');
  const setAppPage = useAppStore((s) => s.setAppPage);
  const [pending, setPending] = useState<{ id: string; requestedRole: string; user: { name: string; email: string }; createdAt: string; organization: string | null }[]>([]);
  const [users, setUsers] = useState<{ id: string; role: string | null; email: string; isDemo: boolean }[]>([]);
  const [sources, setSources] = useState<{ key: string; name: string; provider: string; status: string; notes: string | null }[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const u = await api<{ users: typeof users; pending: typeof pending }>('/api/admin?section=users').catch(() => ({ users: [], pending: [] }));
    setUsers(u.users);
    setPending(u.pending);
    const s = await api<{ sources: typeof sources }>('/api/admin?section=datasources').catch(() => ({ sources: [] }));
    setSources(s.sources);
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusyId(id);
    try {
      await api('/api/admin', { body: { action: 'decideRole', id, decision } });
      toast({ title: decision === 'approve' ? t('roleApproved') : t('roleRejected') });
      await load();
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label={t('users')} value={users.length} tone="border-sky-500/25 bg-sky-500/10 text-sky-500" />
        <StatCard icon={ShieldQuestion} label={t('roleRequests')} value={pending.length} tone="border-amber-500/25 bg-amber-500/10 text-amber-500" />
        <StatCard icon={Database} label={t('sourcesHealth')} value={sources.filter((s) => s.status !== 'UNAVAILABLE').length + '/' + sources.length} tone="border-emerald-500/25 bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={Radio} label={t('appHealth')} value="healthy" tone="border-emerald-500/25 bg-emerald-500/10 text-emerald-500" />
      </div>

      <Card className="py-4">
        <CardHeader className="flex-row items-center justify-between px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('roleRequests')}</CardTitle>
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAppPage('adminUsers')}>
            {ta('adminUsers')} <ChevronRight className="size-3" />
          </Button>
        </CardHeader>
        <CardContent className="px-4 pt-2">
          {pending.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">{t('noPending')}</div>
          ) : (
            <div className="space-y-2">
              {pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{p.user?.name ?? p.id}</div>
                    <div className="text-[11px] text-muted-foreground">{p.user?.email} → <span className="font-mono uppercase">{p.requestedRole}</span> · {timeAgo(p.createdAt)}</div>
                  </div>
                  <Button size="sm" className="h-7 bg-emerald-500 text-[11px] font-semibold text-[#06251B] hover:bg-emerald-400" disabled={busyId === p.id} onClick={() => decide(p.id, 'approve')}>
                    {t('approve')}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-red-500/40 text-[11px] text-red-500" disabled={busyId === p.id} onClick={() => decide(p.id, 'reject')}>
                    {t('reject')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('sourcesHealth')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-2">
          <div className="divide-y">
            {sources.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">{s.name} <span className="text-[10px] text-muted-foreground">· {s.provider}</span></div>
                  {s.notes && <div className="truncate text-[10.5px] text-muted-foreground">{s.notes}</div>}
                </div>
                <SourceChip status={s.status as 'LIVE'} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('bootstrap')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{t('bootstrapBody')}</p>
          <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">POST /api/bootstrap · requires BOOTSTRAP_ADMIN_KEY (server env only)</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Router ============
export function DashboardPage() {
  const { user } = useAppStore();
  const role = user?.role;
  if (!user) return null;
  if (role === 'citizen') return <CitizenDashboard />;
  if (role === 'field' || role === 'infra') return <FieldDashboard />;
  if (role === 'org_admin' || role === 'super_admin') return <AdminDashboard />;
  return <MunicipalDashboard />;
}
