'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { api, timeAgo } from '@/lib/client-api';
import { coords } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { CITIES, SEVERITY_COLORS, type Severity, type RiskFactor } from '@/lib/types';
import { SeverityBadge, SourceChip, StatusPill, DemoBanner } from '@/components/shared/widgets';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Map as MapIcon, List, Droplets, Wind, Thermometer, MapPin, Crosshair, ShieldCheck } from 'lucide-react';

const RiskMap = dynamic(() => import('@/components/map/risk-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/40">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

interface Assessment {
  id: string; assetId: string | null; asset?: { name: string; code: string; category: string; city: string };
  city: string; lat: number; lon: number; score: number; severity: Severity;
  factors: string; confidence: number; horizon: string; source: string; dataFreshness: string;
  isDemo: boolean; createdAt: string;
}
interface Incident {
  id: string; title: string; category: string; severity: Severity; status: string; lat: number; lon: number; city: string; isDemo: boolean;
}
interface Task {
  id: string; title: string; status: string; priority: string; city: string | null; isDemo: boolean;
  asset?: { name: string; code: string; city: string } | null;
  assetId: string | null;
}
interface Asset {
  id: string; code: string; name: string; category: string; lat: number; lon: number; city: string;
  district: string | null; state: string; vulnerability: number; drainageCapacity: string;
  notes: string | null; lastInspectedAt: string | null; isDemo: boolean;
}
interface Weather {
  status: string; source: string; fetchedAt: string; location: string;
  current: { temperature: number; humidity: number; precipitation: number; windSpeed: number };
  daily: { date: string; rainSum: number }[];
  note: string;
}

const SEVERITY_ORDER: Record<string, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };

export function MapView({ authed, compactHeight }: { authed: boolean; compactHeight?: boolean }) {
  const t = useTranslations('app.map');
  const tc = useTranslations('common');
  const tAsset = useTranslations('app.assetCategory');
  const tSev = useTranslations('app.severity');
  const tShell = useTranslations('app.shell');
  const { resolvedTheme } = useTheme();
  const region = useAppStore((s) => s.region);
  const setRegion = useAppStore((s) => s.setRegion);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRisk, setShowRisk] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [minSeverity, setMinSeverity] = useState<Severity>('LOW');
  const [listMode, setListMode] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number; zoom?: number; key: number } | null>(null);
  const [query, setQuery] = useState('');
  const [geoResults, setGeoResults] = useState<{ name: string; lat: number; lon: number; source: string }[]>([]);
  const [geoOpen, setGeoOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const a = await api<{ assessments: Assessment[] }>('/api/assessments');
      setAssessments(a.assessments);
      const ast = await api<{ assets: Asset[] }>('/api/assets');
      setAssets(ast.assets);
    } catch {
      /* public data unavailable */
    }
    if (authed) {
      try {
        const i = await api<{ incidents: Incident[] }>('/api/incidents');
        setIncidents(i.incidents);
        const tk = await api<{ tasks: Task[] }>('/api/tasks');
        setTasks(tk.tasks.filter((t) => !['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)));
      } catch {
        setIncidents([]);
      }
    }
    setLoading(false);
  }, [authed]);

  // Manual refresh (event-handler context): spinner + reload
  const reload = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Initial data fetch — setState only fires inside async callbacks after awaits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const weatherCity = region || 'Mumbai';
  useEffect(() => {
    const c = CITIES.find((x) => x.city === weatherCity) ?? CITIES[0];
    api<Weather>(`/api/weather?lat=${c.lat}&lon=${c.lon}&city=${c.city}`)
      .then(setWeather)
      .catch(() => setWeather(null));
  }, [weatherCity]);

  const regionAssessments = useMemo(
    () => assessments.filter((a) => !region || a.city === region),
    [assessments, region]
  );

  const selected = useMemo(() => {
    if (!selectedAssetId) return null;
    const asset = assets.find((a) => a.id === selectedAssetId);
    const assessment = regionAssessments.find((a) => a.assetId === selectedAssetId);
    const assetTasks = tasks.filter((tk) => tk.assetId === selectedAssetId);
    const assetIncidents = incidents.filter((i) => i.city === asset?.city);
    return { asset, assessment, tasks: assetTasks, incidents: assetIncidents };
  }, [selectedAssetId, assets, regionAssessments, tasks, incidents]);

  const factors: RiskFactor[] = useMemo(() => {
    if (!selected?.assessment) return [];
    try { return JSON.parse(selected.assessment.factors); } catch { return []; }
  }, [selected]);

  const filteredForMap = useMemo(() => {
    const min = SEVERITY_ORDER[minSeverity];
    return {
      assessments: regionAssessments.filter((a) => SEVERITY_ORDER[a.severity] >= min),
      incidents: incidents.filter((i) => (!region || i.city === region) && SEVERITY_ORDER[i.severity] >= min),
      tasks: tasks.filter((tk) => !region || tk.city === region),
    };
  }, [regionAssessments, incidents, tasks, region, minSeverity]);

  async function runSearch() {
    if (query.trim().length < 2) return;
    try {
      const res = await api<{ results: { name: string; lat: number; lon: number; source: string }[] }>(
        `/api/geocode?q=${encodeURIComponent(query)}`
      );
      setGeoResults(res.results.slice(0, 5));
      setGeoOpen(true);
    } catch { /* ignore */ }
  }

  const topList = useMemo(
    () => [...regionAssessments].sort((a, b) => b.score - a.score).slice(0, 40),
    [regionAssessments]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder={t('searchPlaceholder')}
            className="pl-8"
          />
          {geoOpen && geoResults.length > 0 && (
            <div className="absolute z-[1200] mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
              {geoResults.map((r, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                  onClick={() => {
                    setFlyTarget({ lat: r.lat, lon: r.lon, zoom: 10, key: Date.now() });
                    setGeoOpen(false);
                  }}
                >
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1">{r.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px] uppercase text-muted-foreground">
                    {r.source.includes('Local') ? 'local' : 'osm'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Select value={region || 'ALL'} onValueChange={(v) => setRegion(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-40">
            <Crosshair className="mr-1 size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tShell('allRegions')}</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minSeverity} onValueChange={(v) => setMinSeverity(v as Severity)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('severity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">{tc('all')} · {t('severity')}</SelectItem>
            <SelectItem value="MODERATE">{tSev('MODERATE')}+</SelectItem>
            <SelectItem value="HIGH">{tSev('HIGH')}+</SelectItem>
            <SelectItem value="CRITICAL">{tSev('CRITICAL')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex overflow-hidden rounded-lg border">
          <Button
            variant={!listMode ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setListMode(false)}
          >
            <MapIcon className="size-4" /> {t('mapView')}
          </Button>
          <Button
            variant={listMode ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setListMode(true)}
          >
            <List className="size-4" /> {t('list')}
          </Button>
        </div>
      </div>

      <div className={`grid gap-3 ${compactHeight ? 'lg:grid-cols-[1fr_300px]' : 'lg:grid-cols-[1fr_340px]'}`}>
        {/* Map / list area */}
        <div className={`relative overflow-hidden rounded-xl border ${compactHeight ? 'h-[380px]' : 'h-[420px] md:h-[560px]'}`}>
          {listMode ? (
            <ScrollArea className="h-full bg-card">
              <div className="divide-y">
                {topList.map((a) => (
                  <button
                    key={a.id}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                    onClick={() => {
                      setSelectedAssetId(a.assetId);
                      setListMode(false);
                      setFlyTarget({ lat: a.lat, lon: a.lon, zoom: 11, key: Date.now() });
                    }}
                  >
                    <span className="w-10 shrink-0 font-mono text-sm font-bold" style={{ color: SEVERITY_COLORS[a.severity] }}>
                      {a.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.asset?.name ?? a.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.asset ? `${a.asset.code} · ${tAsset(a.asset.category)}` : a.city}
                      </div>
                    </div>
                    <SeverityBadge severity={a.severity} />
                  </button>
                ))}
                {topList.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">{tc('notFound')}</div>
                )}
              </div>
            </ScrollArea>
          ) : loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <>
              <RiskMap
                assessments={filteredForMap.assessments.map((a) => ({
                  id: a.id, assetId: a.assetId, assetName: a.asset?.name ?? a.city,
                  city: a.city, lat: a.lat, lon: a.lon, score: a.score,
                  severity: a.severity, confidence: a.confidence, isDemo: a.isDemo,
                }))}
                incidents={filteredForMap.incidents.map((i) => ({
                  id: i.id, title: i.title, category: i.category, severity: i.severity,
                  status: i.status, lat: i.lat, lon: i.lon, city: i.city, isDemo: i.isDemo,
                }))}
                tasks={filteredForMap.tasks.map((tk) => ({
                  id: tk.id, title: tk.title, status: tk.status, priority: tk.priority,
                  lat: tk.asset?.city ? (assets.find((a) => a.id === tk.assetId)?.lat ?? 22) : 22,
                  lon: tk.asset?.city ? (assets.find((a) => a.id === tk.assetId)?.lon ?? 80) : 80,
                  city: tk.city, isDemo: tk.isDemo,
                }))}
                showRisk={showRisk}
                showIncidents={showIncidents}
                showTasks={showTasks}
                minSeverity={minSeverity}
                flyTarget={flyTarget}
                onSelectAsset={setSelectedAssetId}
                theme={(resolvedTheme as 'light' | 'dark') ?? 'dark'}
              />
              {/* Legend */}
              <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('legend')}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as Severity[]).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: SEVERITY_COLORS[s] }} />
                      {tSev(s)}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5">
                    <Droplets className="size-3 text-sky-400" /> {t('layerIncidents')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px] bg-[#38D9D6]" /> {t('layerTasks')}
                  </span>
                </div>
              </div>
              {!authed && (
                <div className="absolute top-3 left-3 z-[1000] rounded-md border bg-card/95 px-2.5 py-1 text-[11px] font-medium shadow-sm">
                  <ShieldCheck className="mr-1 inline size-3.5 text-emerald-500" />
                  {t('publicMode')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3">
          {/* Weather strip */}
          <Card className="py-3">
            <CardContent className="px-4">
              {weather ? (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{weather.location}</span>
                    <SourceChip status={weather.status as 'LIVE' | 'SIMULATED'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/60 px-1 py-2">
                      <Thermometer className="mx-auto size-4 text-muted-foreground" />
                      <div className="mt-1 font-mono text-sm font-bold">{Math.round(weather.current.temperature)}°C</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-1 py-2">
                      <Droplets className="mx-auto size-4 text-sky-400" />
                      <div className="mt-1 font-mono text-sm font-bold">{weather.daily?.[0]?.rainSum ?? 0}<span className="text-[10px] font-normal">mm</span></div>
                      <div className="text-[9px] text-muted-foreground">24h rain</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-1 py-2">
                      <Wind className="mx-auto size-4 text-muted-foreground" />
                      <div className="mt-1 font-mono text-sm font-bold">{Math.round(weather.current.windSpeed)}<span className="text-[10px] font-normal">km/h</span></div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                    {tc('lastUpdated')}: {timeAgo(weather.fetchedAt)} · {weather.source}
                  </div>
                </>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>

          {/* Layers */}
          <Card className="py-3">
            <CardContent className="space-y-2.5 px-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('layers')}</div>
              <label className="flex items-center justify-between text-sm">
                {t('layerRisk')}
                <Switch checked={showRisk} onCheckedChange={setShowRisk} />
              </label>
              <label className="flex items-center justify-between text-sm">
                {t('layerIncidents')}
                <Switch checked={showIncidents} onCheckedChange={setShowIncidents} />
              </label>
              <label className="flex items-center justify-between text-sm">
                {t('layerTasks')}
                <Switch checked={showTasks} onCheckedChange={setShowTasks} />
              </label>
            </CardContent>
          </Card>

          {/* Selected asset detail */}
          <Card className="min-h-40 flex-1 py-3">
            <CardContent className="px-4">
              {selected?.asset && selected.assessment ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold leading-tight">{selected.asset.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{selected.asset.code} · {selected.asset.city}</div>
                    </div>
                    <SeverityBadge severity={selected.assessment.severity} score={selected.assessment.score} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{tAsset(selected.asset.category)}</span>
                    <span className="text-right font-mono">{coords(selected.asset.lat, selected.asset.lon)}</span>
                    <span>{t('confidence')}: {selected.assessment.confidence}%</span>
                    <span className="text-right">{tc('lastUpdated')}: {timeAgo(selected.assessment.createdAt)}</span>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('contributingFactors')}</div>
                    <div className="space-y-1.5">
                      {factors.filter((f) => f.weight > 0).slice(0, 4).map((f) => (
                        <div key={f.key}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>{f.label}</span>
                            <span className="font-mono">+{f.weight}</span>
                          </div>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, f.weight * 3.2)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selected.tasks.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('taskStatus')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.tasks.slice(0, 3).map((tk) => (
                          <span key={tk.id} className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-[11px]">
                            {tk.title.length > 26 ? tk.title.slice(0, 26) + '…' : tk.title}
                            <StatusPill status={tk.status} />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <DemoBanner className="text-[10px]">
                    {selected.assessment.source}
                  </DemoBanner>
                </div>
              ) : (
                <div className="flex h-full min-h-32 items-center justify-center text-center text-sm text-muted-foreground">
                  {t('noSelection')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

