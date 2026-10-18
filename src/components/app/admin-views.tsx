'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, timeAgo } from '@/lib/client-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SourceChip, StatusPill } from '@/components/shared/widgets';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldX, Users, ScrollText, Database, Search, Loader2 } from 'lucide-react';

interface UserRow {
  id: string; name: string; email: string; role: string | null; roleStatus: string | null;
  emailVerified: boolean; organization: string | null; regionState: string | null;
  regionCity: string | null; isDemo: boolean; mustChangePassword: boolean; createdAt: string;
}
interface PendingRow {
  id: string; requestedRole: string; organization: string | null; createdAt: string;
  user: { name: string; email: string };
}
interface AuditRow { id: string; actorEmail: string | null; action: string; detail: string | null; createdAt: string }
interface SourceRow { key: string; name: string; provider: string; status: string; notes: string | null; lastSuccessAt?: string | null }

// ============ Users & role requests ============
export function AdminUsersView() {
  const t = useTranslations('app.admin');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ users: UserRow[]; pending: PendingRow[] }>('/api/admin?section=users');
      setUsers(r.users);
      setPending(r.pending);
    } catch {
      setUsers([]);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

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

  const filtered = users.filter(
    (u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('roleRequests')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-2">
          {pending.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">{t('noPending')}</div>
          ) : (
            <div className="space-y-2">
              {pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{p.user?.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.user?.email} → <span className="font-mono uppercase">{p.requestedRole}</span>
                      {p.organization ? ` · ${p.organization}` : ''} · {timeAgo(p.createdAt)}
                    </div>
                  </div>
                  <Button size="sm" className="h-7 bg-emerald-500 text-[11px] font-semibold text-[#06251B] hover:bg-emerald-400" disabled={busyId === p.id} onClick={() => decide(p.id, 'approve')}>
                    {busyId === p.id ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                    {t('approve')}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-red-500/40 text-[11px] text-red-500" disabled={busyId === p.id} onClick={() => decide(p.id, 'reject')}>
                    <ShieldX className="size-3.5" /> {t('reject')}
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            Approval updates the user role server-side (enforced on every API route) and writes an audit event.
          </p>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="flex-row items-center justify-between px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('users')}</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="h-8 pl-8 text-xs" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-2">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {filtered.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-medium">
                        {u.name}
                        {u.isDemo && <Badge variant="outline" className="border-violet-500/40 text-[8px] text-violet-500">DEMO</Badge>}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{u.email}{u.organization ? ` · ${u.organization}` : ''}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] capitalize">{u.role ?? '—'}</Badge>
                    {u.roleStatus && <StatusPill status={u.roleStatus} />}
                    <span className="w-16 text-right text-[10px] text-muted-foreground">{u.emailVerified ? 'verified' : 'unverified'}</span>
                  </div>
                ))}
                {filtered.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No matches.</div>}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Audit log ============
export function AuditView() {
  const t = useTranslations('app.admin');
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ events: AuditRow[] }>('/api/admin?section=audit')
      .then((r) => setEvents(r.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('auditLog')}</h1>
      <Card className="py-4">
        <CardContent className="px-4">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <ScrollText className="size-7 opacity-40" />
              <span className="text-sm">No audit events yet.</span>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <div className="divide-y">
                {events.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5">
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{e.action}</span>
                    <span className="text-[11.5px] text-muted-foreground">{e.actorEmail ?? 'system'}</span>
                    {e.detail && <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground/80">{e.detail}</span>}
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/70">{timeAgo(e.createdAt)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Data sources ============
export function DataSourcesView() {
  const t = useTranslations('app.admin');
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ sources: SourceRow[] }>('/api/admin?section=datasources')
      .then((r) => setSources(r.sources))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('sourcesHealth')}</h1>
      <Card className="py-4">
        <CardContent className="px-4">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (
            <div className="divide-y">
              {sources.map((s) => (
                <div key={s.key} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Database className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.provider}{s.notes ? ` — ${s.notes}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <SourceChip status={s.status as 'LIVE'} />
                    {s.lastSuccessAt && (
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(s.lastSuccessAt)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
            Weather status is set by the server-side feed (Open-Meteo). SIMULATED means the live provider was unreachable and a
            deterministic demo fallback was served — never presented as real observations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
