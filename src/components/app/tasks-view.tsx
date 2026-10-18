'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { api, timeAgo, formatINR } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge, StatusPill, DemoBanner } from '@/components/shared/widgets';
import { toast } from '@/hooks/use-toast';
import { CITIES, TASK_TYPES } from '@/lib/types';
import {
  HardHat, Plus, MapPin, Navigation, StickyNote, Camera, Send, CheckCircle2,
  XCircle, Clock, ChevronRight, Loader2,
} from 'lucide-react';

const MiniMap = dynamic(() => import('@/components/map/risk-map'), { ssr: false });

export interface Task {
  id: string; title: string; description: string; type: string; priority: string; status: string;
  assetId: string | null; incidentId: string | null; assignedToId: string | null;
  city: string | null; dueAt: string | null; evidence: string; completionNote: string | null;
  verifiedAt: string | null; verificationNote: string | null; isDemo: boolean; createdAt: string;
  asset?: { name: string; code: string; city: string } | null;
  assignedTo?: { name: string; email: string } | null;
  incident?: { title: string; id: string } | null;
}

export interface EvidenceEntry { note: string; hasPhoto: boolean; at: string; author: string }

export function useTasks(mine?: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ tasks: Task[] }>(`/api/tasks${mine ? '?mine=1' : ''}`);
      setTasks(r.tasks);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [mine]);
  useEffect(() => { refresh(); }, [refresh]);
  return { tasks, loading, refresh };
}

// ============ Task detail (field user actions + supervisor verification) ============
export function TaskDetailDialog({ task, onClose, onChanged }: { task: Task | null; onClose: () => void; onChanged: () => void }) {
  const t = useTranslations('app.field');
  const tt = useTranslations('app.tasks');
  const tc = useTranslations('common');
  const tType = useTranslations('app.taskType');
  const tStatus = useTranslations('app.status');
  const { user } = useAppStore();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [vNote, setVNote] = useState('');

  if (!task) return null;
  const evidence: EvidenceEntry[] = JSON.parse(task.evidence || '[]');
  const isAssignee = task.assignedToId === user?.id;
  const isOp = ['municipal', 'disaster', 'super_admin'].includes(user?.role ?? '');

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    try {
      await api('/api/tasks', { method: 'PATCH', body: { id: task.id, action, ...extra } });
      toast({ title: tt('updated') });
      setNote('');
      onChanged();
      onClose();
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-left text-base">
            <HardHat className="size-4 text-amber-500" />
            {task.title}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={task.status} />
            <PriorityBadge priority={task.priority as 'LOW'} />
            <span>{tType(task.type as 'DRAIN_INSPECTION')}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4 pb-2">
            <p className="text-[13px] leading-relaxed text-muted-foreground">{task.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {task.asset && (
                <div className="rounded-lg border bg-muted/40 p-2.5">
                  <div className="font-semibold">{task.asset.name}</div>
                  <div className="text-muted-foreground">{task.asset.code} · {task.asset.city}</div>
                </div>
              )}
              <div className="rounded-lg border bg-muted/40 p-2.5">
                <div className="flex items-center gap-1 font-semibold"><Clock className="size-3" /> {t('dueLabel')}</div>
                <div className="text-muted-foreground">{task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'}</div>
              </div>
            </div>
            {task.assignedTo && (
              <div className="text-[12px] text-muted-foreground">
                Assigned to: <span className="font-medium text-foreground">{task.assignedTo.name}</span>
              </div>
            )}
            {task.city && (
              <a
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-500 hover:underline"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation className="size-3.5" /> {t('directions')}
              </a>
            )}

            {/* Evidence timeline */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('evidence')} · {tt('evidenceCount', { n: evidence.length })}
              </div>
              <div className="space-y-2">
                {evidence.map((ev, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-2.5 text-[12px]">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-medium">{ev.author}</span>
                      <span>{timeAgo(ev.at)}</span>
                    </div>
                    <div className="mt-1 flex items-start gap-1.5">
                      {ev.hasPhoto && <Camera className="mt-0.5 size-3.5 shrink-0 text-sky-500" />}
                      <span className="leading-relaxed">{ev.note}</span>
                    </div>
                  </div>
                ))}
                {evidence.length === 0 && <div className="text-[12px] text-muted-foreground">{tc('notFound')}</div>}
              </div>
            </div>

            {task.completionNote && (
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 text-[12px]">
                <div className="font-semibold">{t('submitForApproval')}:</div>
                <div className="mt-0.5 text-muted-foreground">{task.completionNote}</div>
              </div>
            )}

            {/* Field actions */}
            {isAssignee && ['ASSIGNED', 'IN_PROGRESS'].includes(task.status) && (
              <div className="space-y-2 rounded-xl border p-3">
                <div className="flex gap-2">
                  {task.status === 'ASSIGNED' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act('start')}>
                      {t('progress')}
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('addNote')}</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-[13px]" placeholder="…" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => act('note', { note })}>
                      <StickyNote className="size-3.5" /> {t('addNote')}
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => act('evidence', { note, hasPhoto: true })}>
                      <Camera className="size-3.5" /> {t('addEvidence')}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t('addEvidence')} — {tc('demoNote')}</p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400"
                  disabled={busy || note.trim().length < 5}
                  onClick={() => act('submit', { note })}
                >
                  <Send className="size-3.5" /> {t('submitForApproval')}
                </Button>
              </div>
            )}
            {isAssignee && task.status === 'SUBMITTED' && (
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[12px] text-violet-600 dark:text-violet-300">
                {t('submitted')}
              </div>
            )}

            {/* Supervisor verification */}
            {isOp && task.status === 'SUBMITTED' && (
              <div className="space-y-2 rounded-xl border border-emerald-500/30 p-3">
                <Label className="text-xs">{tt('approveClosure')}</Label>
                <Input value={vNote} onChange={(e) => setVNote(e.target.value)} placeholder="Verification note (optional)" className="h-8 text-[12px]" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-emerald-500 text-[#06251B] hover:bg-emerald-400" disabled={busy} onClick={() => act('verify', { note: vNote })}>
                    <CheckCircle2 className="size-3.5" /> {tt('approveClosure')}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-red-500/40 text-red-500" disabled={busy} onClick={() => act('reject', { note: vNote })}>
                    <XCircle className="size-3.5" /> {tt('rejectClosure')}
                  </Button>
                </div>
              </div>
            )}
            {task.verificationNote && task.status === 'IN_PROGRESS' && task.verifiedAt && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-500">
                {tt('reopened')}: {task.verificationNote}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ Create task dialog (operational users) ============
export function TaskCreateDialog({
  open, onClose, preset, onCreated,
}: {
  open: boolean; onClose: () => void;
  preset?: { title?: string; description?: string; type?: string; priority?: string; assetId?: string | null; incidentId?: string | null; city?: string | null; recommendationId?: string | null };
  onCreated?: () => void;
}) {
  const t = useTranslations('app.tasks');
  const tType = useTranslations('app.taskType');
  const tPri = useTranslations('app.priority');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('FIELD_INSPECTION');
  const [priority, setPriority] = useState('MEDIUM');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && preset) {
      setTitle(preset.title ?? '');
      setDescription(preset.description ?? '');
      setType(preset.type ?? 'FIELD_INSPECTION');
      setPriority(preset.priority ?? 'MEDIUM');
    }
  }, [open, preset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/tasks', {
        body: {
          title, description, type, priority,
          assetId: preset?.assetId ?? null,
          incidentId: preset?.incidentId ?? null,
          recommendationId: preset?.recommendationId ?? null,
          city: preset?.city ?? null,
          dueAt: due ? new Date(due).toISOString() : null,
        },
      });
      toast({ title: t('created') });
      onClose();
      onCreated?.();
    } catch (e2) {
      toast({ title: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4 text-emerald-500" /> {t('title')}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Auto-assigns the approved field operator with the fewest open tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={4} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{tType(tt)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{tPri('MEDIUM')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => <SelectItem key={p} value={p}>{tPri(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Due date</Label>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <Button type="submit" disabled={busy} className="h-9 w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400">
            {busy && <Loader2 className="size-3.5 animate-spin" />} {t('created')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Field tasks page ============
export function TasksView({ mine }: { mine?: boolean }) {
  const t = useTranslations('app.field');
  const tt = useTranslations('app.tasks');
  const tType = useTranslations('app.taskType');
  const tStatus = useTranslations('app.status');
  const { tasks, loading, refresh } = useTasks(mine);
  const [selected, setSelected] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = tasks
    .filter((tk) => statusFilter === 'ALL' || tk.status === statusFilter)
    .sort((a, b) => {
      const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{t('title')}</h1>
          <p className="text-[12.5px] text-muted-foreground">{t('priorityOrder')}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tStatus('PENDING') === 'Pending' ? 'All statuses' : 'All statuses'}</SelectItem>
            {['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DONE', 'CANCELLED'].map((s) => (
              <SelectItem key={s} value={s}>{tStatus(s as 'ASSIGNED')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DemoBanner>Work orders in this preview are demonstration records (DEMO tag on each).</DemoBanner>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <HardHat className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('noTasks')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((tk) => (
            <button key={tk.id} onClick={() => setSelected(tk)} className="text-left">
              <Card className="jg-card-hover h-full py-4 transition-shadow">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-semibold leading-snug">{tk.title}</div>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill status={tk.status} />
                    <PriorityBadge priority={tk.priority as 'MEDIUM'} />
                    <Badge variant="outline" className="text-[10px]">{tType(tk.type as 'FIELD_INSPECTION')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {tk.asset && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {tk.asset.name}</span>}
                    {tk.dueAt && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {new Date(tk.dueAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">
                    {tt('evidenceCount', { n: JSON.parse(tk.evidence || '[]').length })}
                    {tk.isDemo && ' · DEMO'}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <TaskDetailDialog task={selected} onClose={() => setSelected(null)} onChanged={refresh} />
    </div>
  );
}
