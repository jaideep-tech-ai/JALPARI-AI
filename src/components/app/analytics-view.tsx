'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DemoBanner } from '@/components/shared/widgets';
import { useAppStore } from '@/lib/store';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { Droplets, CloudRain } from 'lucide-react';

const SEV_COLORS: Record<string, string> = { LOW: '#10B981', MODERATE: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444' };
const FUNNEL_COLORS: Record<string, string> = { PENDING: '#F59E0B', ACCEPTED: '#10B981', CONVERTED: '#38D9D6', REJECTED: '#EF4444', COMPLETED: '#10B981' };

interface Analytics {
  totals: Record<string, number>;
  trend: { date: string; score: number }[];
  byCategory: Record<string, number>;
  severityMix: Record<string, number>;
  interventionFunnel: Record<string, number>;
  taskStatus: Record<string, number>;
  note: string;
}
interface Weather {
  status: string; location: string; daily: { date: string; rainSum: number; rainMax: number }[];
}

export function AnalyticsView() {
  const t = useTranslations('app.analytics');
  const tCat = useTranslations('app.category');
  const tSev = useTranslations('app.severity');
  const tStatus = useTranslations('app.status');
  const tTaskType = useTranslations('app.taskType');
  const region = useAppStore((s) => s.region);
  const [data, setData] = useState<Analytics | null>(null);
  const [wx, setWx] = useState<Weather | null>(null);

  useEffect(() => {
    api<Analytics>('/api/analytics').then(setData).catch(() => {});
    const c = region || 'Mumbai';
    const city = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Kochi', 'Guwahati', 'Patna'].includes(c)
      ? c : 'Mumbai';
    fetch(`/api/weather?lat=${city === 'Delhi' ? 28.61 : 19.076}&lon=${city === 'Delhi' ? 77.21 : 72.8777}&city=${city}`)
      .then((r) => r.json())
      .then(setWx)
      .catch(() => {});
  }, [region]);

  const sevData = data ? Object.entries(data.severityMix).map(([k, v]) => ({ name: tSev(k as 'LOW'), value: v, color: SEV_COLORS[k] })) : [];
  const catData = data ? Object.entries(data.byCategory).map(([k, v]) => ({ name: tCat(k as 'WATERLOGGING'), count: v })) : [];
  const funnel = data ? Object.entries(data.interventionFunnel).map(([k, v]) => ({ name: tStatus(k as 'PENDING'), value: v, color: FUNNEL_COLORS[k] ?? '#8CA3BF' })) : [];
  const rainData = wx?.daily?.map((d) => ({ date: d.date.slice(5), rain: d.rainSum })) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{t('title')}{region ? ` · ${region}` : ''}</h1>

      {!data ? (
        <div className="grid gap-3 lg:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
                  {t('riskTrend')}
                  <Badge variant="outline" className="border-violet-500/40 text-[8px] text-violet-500">DEMO SERIES</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-3">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.trend} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
                    <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
                  <CloudRain className="size-3.5 text-sky-400" /> {t('rainfall')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-3">
                {rainData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={rainData} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
                      <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="rain" fill="#38D9D6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-[200px] w-full" />
                )}
                {wx && (
                  <div className="px-2 pt-1 text-[10px] text-muted-foreground">
                    {wx.location} · source status: <span className="font-mono font-bold">{wx.status}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-[13px] font-semibold">{t('severityMix')}</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={sevData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                      {sevData.map((s) => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-[13px] font-semibold">{t('incidentsByCat')}</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 18, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} stroke="rgba(128,140,160,0.5)" />
                    <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="py-4 lg:col-span-2">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-[13px] font-semibold">{t('interventionStatus')}</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={funnel} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,140,160,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="rgba(128,140,160,0.5)" allowDecimals={false} />
                    <RTooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {funnel.map((f) => <Cell key={f.name} fill={f.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <DemoBanner>{t('note')}</DemoBanner>
        </>
      )}
    </div>
  );
}
