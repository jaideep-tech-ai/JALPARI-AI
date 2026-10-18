'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { api, timeAgo } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { SeverityBadge, StatusPill, DemoBanner } from '@/components/shared/widgets';
import { TaskCreateDialog } from './tasks-view';
import { toast } from '@/hooks/use-toast';
import { INCIDENT_CATEGORIES, CITIES, type Severity } from '@/lib/types';
import {
  Plus, MapPin, AlertTriangle, Loader2, Camera, MessageSquarePlus, ChevronRight, Droplets,
} from 'lucide-react';

const ClickableMiniMap = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

export interface Incident {
  id: string; title: string; category: string; description: string; severity: string;
  status: string; lat: number; lon: number; city: string; state: string | null;
  addressNote: string | null; hasPhoto: boolean; isDemo: boolean; createdAt: string;
  reporter?: { name: string; email: string } | null;
  reporterId?: string | null;
}
interface IncidentUpdate { id: string; authorName: string; message: string; newStatus: string | null; createdAt: string }

export function useIncidents(mine?: boolean) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ incidents: Incident[] }>(`/api/incidents${mine ? '?mine=1' : ''}`);
      setIncidents(r.incidents);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [mine]);
  useEffect(() => { refresh(); }, [refresh]);
  return { incidents, loading, refresh };
}

// ============ Create incident (with map location picker) ============
export function IncidentCreateDialog({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated?: () => void;
}) {
  const t = useTranslations('app.citizen');
  const ti = useTranslations('app.incidents');
  const tc = useTranslations('common');
  const tCat = useTranslations('app.category');
  const tSev = useTranslations('app.severity');
  const { user } = useAppStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('WATERLOGGING');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [city, setCity] = useState(user?.regionCity || 'Mumbai');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      const c = CITIES.find((x) => x.city === (user?.regionCity || 'Mumbai')) ?? CITIES[0];
      setCity(c.city);
      setLat(c.lat);
      setLon(c.lon);
    }
  }, [open, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!lat || !lon) { setErr('Select the location on the map'); return; }
    setBusy(true);
    try {
      await api('/api/incidents', {
        body: { title, description, category, severity, lat, lon, city, hasPhoto },
      });
      toast({ title: ti('created') });
      onClose();
      onCreated?.();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Droplets className="size-4 text-sky-400" /> {t('title')}
          </DialogTitle>
          <DialogDescription>{t('sub')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[62vh] pr-2">
          <form onSubmit={submit} className="space-y-3.5 pb-2">
            {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-500">{err}</div>}
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={4} className="h-9 text-[13px]" placeholder="e.g. Waterlogging near metro station" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{ti('filterCategory')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCat(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{ti('filterStatus')} / Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map((s) => <SelectItem key={s} value={s}>{tSev(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">City</Label>
              <Select
                value={city}
                onValueChange={(v) => {
                  setCity(v);
                  const c = CITIES.find((x) => x.city === v);
                  if (c) { setLat(c.lat); setLon(c.lon); }
                }}
              >
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location <span className="text-muted-foreground">({lat?.toFixed(4)}, {lon?.toFixed(4)})</span></Label>
              <div className="h-52 overflow-hidden rounded-xl border">
                <ClickableMiniMap
                  assessments={[]}
                  incidents={[]}
                  tasks={[]}
                  showRisk={false}
                  showIncidents={false}
                  showTasks={false}
                  minSeverity="LOW"
                  compact
                  theme="dark"
                  flyTarget={null}
                  pickPoint={{ lat: lat ?? 22, lon: lon ?? 80 }}
                  onPick={(la, lo) => { setLat(la); setLon(lo); }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Tap the map to drop the exact point. © OpenStreetMap contributors</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} rows={3} className="text-[13px]" placeholder="What is happening, since when, how deep is the water…" />
            </div>
            <label className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[12.5px]"><Camera className="size-3.5 text-sky-500" /> Attach a photo</span>
              <Switch checked={hasPhoto} onCheckedChange={setHasPhoto} />
            </label>
            <Button type="submit" disabled={busy} className="h-9 w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400">
              {busy && <Loader2 className="size-3.5 animate-spin" />} {t('title')}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">{tc('demoNote')} · {t('photoNote')}</p>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ Incident detail ============
export function IncidentDetailDialog({ incident, onClose, onChanged }: { incident: Incident | null; onClose: () => void; onChanged: () => void }) {
  const t = useTranslations('app.incidents');
  const tCat = useTranslations('app.category');
  const tStatus = useTranslations('app.status');
  const { user } = useAppStore();
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [message, setMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const isOp = ['municipal', 'disaster', 'super_admin'].includes(user?.role ?? '');

  useEffect(() => {
    if (incident) {
      setNewStatus(incident.status);
      // timeline is embedded via updates; fetch single incident list to get updates
      // (endpoint returns updates through the incidents list include)
      api<{ incidents: (Incident & { updates?: IncidentUpdate[] })[] }>('/api/incidents?limit=200')
        .then((r) => {
          const fresh = r.incidents.find((i) => i.id === incident.id);
          setUpdates(fresh?.updates ?? []);
        })
        .catch(() => setUpdates([]));
    }
  }, [incident]);

  if (!incident) return null;

  async function submitUpdate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/incidents', {
        method: 'PATCH',
        body: { id: incident.id, message, status: isOp && newStatus !== incident.status ? newStatus : undefined },
      });
      toast({ title: t('updated') });
      setMessage('');
      onChanged();
      onClose();
    } catch (e2) {
      toast({ title: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left text-base">{incident.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={incident.status} />
            <SeverityBadge severity={incident.severity as Severity} />
            <Badge variant="outline" className="text-[10px]">{tCat(incident.category as 'WATERLOGGING')}</Badge>
            {incident.isDemo && <Badge variant="outline" className="border-violet-500/40 text-[9px] text-violet-500">DEMO</Badge>}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[62vh] pr-2">
          <div className="space-y-4 pb-2">
            <p className="text-[13px] leading-relaxed text-muted-foreground">{incident.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-3" /> {incident.city} · {incident.lat.toFixed(3)}, {incident.lon.toFixed(3)}</span>
              <span className="text-right">{t('reporter')}: {incident.reporter?.name ?? t('anonymous')}</span>
              <span>{timeAgo(incident.createdAt)}</span>
              {incident.hasPhoto && <span className="flex items-center justify-end gap-1 text-sky-500"><Camera className="size-3" /> photo attached</span>}
            </div>

            {/* Timeline */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('timeline')}</div>
              <div className="space-y-2 border-l pl-3">
                {updates.map((u) => (
                  <div key={u.id} className="relative text-[12px]">
                    <span className="absolute -left-[17px] top-1.5 size-2 rounded-full bg-emerald-500" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.authorName}</span>
                      {u.newStatus && <StatusPill status={u.newStatus} />}
                      <span className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">{u.message}</div>
                  </div>
                ))}
                {updates.length === 0 && <div className="text-[12px] text-muted-foreground">—</div>}
              </div>
            </div>

            {/* Update form */}
            <form onSubmit={submitUpdate} className="space-y-2 rounded-xl border p-3">
              {isOp && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('editStatus')}</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => (
                        <SelectItem key={s} value={s}>{tStatus(s as 'OPEN')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('addUpdate')}</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="text-[13px]" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400" disabled={busy || (message.trim().length < 3 && !isOp)}>
                  <MessageSquarePlus className="size-3.5" /> {t('addUpdate')}
                </Button>
                {isOp && (
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setTaskOpen(true)}>
                    <Plus className="size-3.5" /> {t('assign')}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </ScrollArea>
        <TaskCreateDialog
          open={taskOpen}
          onClose={() => setTaskOpen(false)}
          preset={{
            title: `Respond: ${incident.title}`,
            description: `Intervention task created from incident "${incident.title}" (${incident.city}).`,
            priority: incident.severity === 'CRITICAL' ? 'URGENT' : incident.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            incidentId: incident.id,
            city: incident.city,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// ============ Incidents page ============
export function IncidentsView({ mine }: { mine?: boolean }) {
  const t = useTranslations('app.incidents');
  const tCat = useTranslations('app.category');
  const tStatus = useTranslations('app.status');
  const { incidents, loading, refresh } = useIncidents(mine);
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  const filtered = incidents.filter((i) =>
    (status === 'ALL' || i.status === status) && (category === 'ALL' || i.category === category)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">{mine ? t('title') : t('title')}</h1>
        <Button size="sm" className="h-8 bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" /> {t('new')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder={t('filterStatus')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => (
              <SelectItem key={s} value={s}>{tStatus(s as 'OPEN')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder={t('filterCategory')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {INCIDENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCat(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertTriangle className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No incidents match the filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <button key={i.id} onClick={() => setSelected(i)} className="block w-full text-left">
              <Card className="jg-card-hover py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                    <Droplets className="size-4 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{i.title}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span>{tCat(i.category as 'WATERLOGGING')}</span>·
                      <span>{i.city}</span>·
                      <span>{timeAgo(i.createdAt)}</span>
                      {i.isDemo && <Badge variant="outline" className="border-violet-500/40 px-1 py-0 text-[8px] text-violet-500">DEMO</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={i.status} />
                    <SeverityBadge severity={i.severity as Severity} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <IncidentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} />
      <IncidentDetailDialog incident={selected} onClose={() => setSelected(null)} onChanged={refresh} />
    </div>
  );
}
