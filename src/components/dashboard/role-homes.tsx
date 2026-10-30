'use client';

/**
 * ROLE HOMES — Citizen / Field / Admin home pages in the same calm
 * "Operations Center" visual language (white cards, tinted icon tiles,
 * honest numbers). All numeric children use NaN-safe format helpers.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, timeAgo } from '@/lib/client-api';
import { num } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge, StatusPill, SourceChip } from '@/components/shared/widgets';
import { IncidentCreateDialog, IncidentDetailDialog, type Incident } from '@/components/app/incidents-view';
import { TaskDetailDialog, type Task } from '@/components/app/tasks-view';
import { toast } from '@/hooks/use-toast';
import { incidentDot } from './ops-shared';
import { PageHeader, OpsCard, StatCard } from './ops-shared';
import {
  CheckCircle2, ChevronRight, ClipboardCheck, FileCheck2, HardHat, MapPin, Plus,
  ShieldCheck, ShieldAlert, ShieldQuestion, Users, Wrench, XCircle, Loader2, Database, Radio, Megaphone,
} from 'lucide-react';

// ============ Citizen home ============
export function CitizenHome() {
  const t = useTranslations('app.ops');
  const tc = useTranslations('app.citizen');
  const tCat = useTranslations('app.category');
  const { user } = useAppStore();
  const [mine, setMine] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  const advisories = [
    { title: 'Monsoon preparedness week', body: 'Clear terrace drains, keep emergency kits ready and follow official channels.' },
    { title: 'High tide + rain expected', body: 'Avoid coastal low-lying roads during 11:00–13:00 tomorrow.' },
  ];

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

  const open = mine.filter((i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status.toUpperCase())).length;
  const resolved = mine.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status.toUpperCase())).length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title={t('welcome', { name: (user?.name ?? 'friend').split(' ')[0] })}
        sub={t('citizenSub')}
        right={
          <Button className="h-9 bg-emerald-600 font-semibold text-white hover:bg-emerald-500" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> {t('reportIssue')}
          </Button>
        }
      />

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Megaphone className="size-4.5" />
          </span>
          <div>
            <div className="text-[13.5px] font-bold">{t('reportIssue')}</div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t('reportSub')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={FileCheck2} label={t('myReportsLabel')} value={mine.length} note={tc('track')} tone="blue" loading={loading} />
        <StatCard icon={ShieldAlert} label={t('openIssues')} value={open} note={t('openIssuesNote')} tone="amber" loading={loading} />
        <StatCard icon={CheckCircle2} label={t('legendResolved')} value={resolved} note={tc('track')} tone="emerald" loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title={t('myReports')}>
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : mine.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Wrench className="size-7 text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">{tc('noReports')}</p>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" /> {t('reportIssue')}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {mine.slice(0, 6).map((i) => (
                <button key={i.id} className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left hover:bg-muted/50" onClick={() => setSelected(i)}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${incidentDot(i.status)}1A`, color: incidentDot(i.status) }}>
                    <Wrench className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{i.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" /> {tCat(i.category as 'WATERLOGGING')} · {i.city} · {timeAgo(i.createdAt)}
                    </span>
                  </span>
                  <StatusPill status={i.status} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </OpsCard>

        <div className="space-y-4">
          <OpsCard title={t('advisories')}>
            <div className="space-y-2">
              {advisories.map((a) => (
                <div key={a.title} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-bold">{a.title}</span>
                    <Badge variant="outline" className="border-violet-500/40 text-[8.5px] text-violet-500">DEMO</Badge>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </div>
          </OpsCard>
          <OpsCard title={t('safety')}>
            <ul className="space-y-1.5">
              {tc('safetyTips').split('·').map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  {tip.trim()}
                </li>
              ))}
            </ul>
          </OpsCard>
        </div>
      </div>

      <IncidentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <IncidentDetailDialog incident={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}

// ============ Field home ============
export function FieldHome() {
  const t = useTranslations('app.ops');
  const tf = useTranslations('app.field');
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
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader title={t('fieldTitle')} sub={t('fieldSub')} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={HardHat} label={t('active')} value={active.length} note={t('activeNote')} tone="blue" loading={loading} />
        <StatCard icon={ClipboardCheck} label={t('awaiting')} value={submitted.length} note={t('awaitingNote')} tone="violet" loading={loading} />
        <StatCard icon={ShieldCheck} label={t('verified')} value={done.length} note={t('legendResolved')} tone="emerald" loading={loading} />
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card p-10 text-center shadow-sm">
          <HardHat className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">{tf('noTasks')}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...active, ...submitted, ...done].map((tk) => (
            <button key={tk.id} onClick={() => setSelected(tk)} className="rounded-xl border border-border/70 bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md">
              <div className="text-[13.5px] font-semibold leading-snug">{tk.title}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusPill status={tk.status} />
                <PriorityBadge priority={tk.priority as 'MEDIUM'} />
                {tk.dueAt && <Badge variant="outline" className="text-[9px]">{tf('dueLabel')}: {new Date(tk.dueAt).toLocaleDateString()}</Badge>}
              </div>
              <div className="mt-2 text-[10.5px] text-muted-foreground">
                {tt('evidenceCount', { n: num(JSON.parse(tk.evidence || '[]').length) })}
                {tk.isDemo && ' · DEMO'}
              </div>
            </button>
          ))}
        </div>
      )}
      <TaskDetailDialog task={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}

// ============ Admin home ============
interface PendingReq { id: string; requestedRole: string; user: { name: string; email: string }; createdAt: string; organization: string | null }

export function AdminHome() {
  const t = useTranslations('app.ops');
  const ta = useTranslations('app.admin');
  const setAppPage = useAppStore((s) => s.setAppPage);
  const [pending, setPending] = useState<PendingReq[]>([]);
  const [users, setUsers] = useState<{ id: string; role: string | null; email: string; isDemo: boolean }[]>([]);
  const [sources, setSources] = useState<{ key: string; name: string; provider: string; status: string; notes: string | null }[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const u = await api<{ users: typeof users; pending: PendingReq[] }>('/api/admin?section=users').catch(() => ({ users: [], pending: [] }));
    setUsers(u.users);
    setPending(u.pending);
    const s = await api<{ sources: typeof sources }>('/api/admin?section=datasources').catch(() => ({ sources: [] }));
    setSources(s.sources);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusyId(id);
    try {
      await api('/api/admin', { body: { action: 'decideRole', id, decision } });
      toast({ title: decision === 'approve' ? ta('roleApproved') : ta('roleRejected') });
      await load();
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader title={t('adminTitle')} sub={t('adminSub')} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Users} label={t('users')} value={users.length} note="registered accounts" tone="blue" loading={loading} />
        <StatCard icon={ShieldQuestion} label={t('roleRequests')} value={pending.length} note={t('unassignedNote')} tone="amber" loading={loading} />
        <StatCard icon={Database} label={t('sourcesHealth')} value={sources.filter((s) => s.status !== 'UNAVAILABLE').length} note={`${num(sources.length)} total`} tone="emerald" loading={loading} />
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Radio className="size-4.5 animate-pulse" />
          </div>
          <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('appHealth')}</div>
          <div className="mt-1 flex items-center gap-2 text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500" /> healthy
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title={t('roleRequests')} action={<button onClick={() => setAppPage('adminUsers')} className="text-[12px] font-semibold text-sky-600 hover:underline dark:text-sky-400">{t('viewAll')}</button>}>
          {pending.length === 0 ? (
            <div className="py-6 text-center text-[12.5px] text-muted-foreground">{ta('noPending')}</div>
          ) : (
            <div className="space-y-2">
              {pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{p.user?.name ?? p.id}</div>
                    <div className="text-[11px] text-muted-foreground">{p.user?.email} → <span className="font-mono uppercase">{p.requestedRole}</span> · {timeAgo(p.createdAt)}</div>
                  </div>
                  <Button size="sm" className="h-7 bg-emerald-600 text-[11px] font-semibold text-white hover:bg-emerald-500" disabled={busyId === p.id} onClick={() => decide(p.id, 'approve')}>
                    {busyId === p.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />} {ta('approve')}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-red-500/40 text-[11px] text-red-500" disabled={busyId === p.id} onClick={() => decide(p.id, 'reject')}>
                    <XCircle className="size-3.5" /> {ta('reject')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </OpsCard>

        <OpsCard title={t('sourcesHealth')} action={<button onClick={() => setAppPage('dataSources')} className="text-[12px] font-semibold text-sky-600 hover:underline dark:text-sky-400">{t('viewAll')}</button>}>
          <div className="divide-y divide-border/60">
            {sources.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">{s.name} <span className="text-[10px] text-muted-foreground">· {s.provider}</span></div>
                  {s.notes && <div className="truncate text-[10.5px] text-muted-foreground">{s.notes}</div>}
                </div>
                <SourceChip status={s.status as 'LIVE'} />
              </div>
            ))}
            {sources.length === 0 && <div className="py-6 text-center text-[12.5px] text-muted-foreground">—</div>}
          </div>
        </OpsCard>
      </div>
    </div>
  );
}
