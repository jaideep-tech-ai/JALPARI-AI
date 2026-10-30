'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/client-api';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CITIES } from '@/lib/types';
import { LanguageToggle, ThemeToggle } from '@/components/shared/controls';
import { Loader2, Save, Sun, Moon, Laptop, Bell } from 'lucide-react';

export function SettingsView() {
  const t = useTranslations('app.settings');
  const { user, setUser, locale, setLocale, setRegion } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [regionState, setRegionState] = useState(user?.regionState ?? '');
  const [regionCity, setRegionCity] = useState(user?.regionCity ?? '');
  const [notif, setNotif] = useState(user?.notificationsEnabled ?? true);
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  if (!user) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: typeof user }>('/api/auth', {
        body: {
          action: 'updateProfile', name, organization,
          regionState, regionCity, notificationsEnabled: notif, language: locale,
        },
      });
      setUser(res.user);
      setRegion(regionCity || '');
      toast({ title: t('saved') });
    } catch (e2) {
      toast({ title: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdBusy(true);
    try {
      await api('/api/auth', { body: { action: 'changePassword', currentPassword, password: newPassword } });
      toast({ title: t('saved') });
      setCurrentPassword('');
      setNewPassword('');
    } catch (e2) {
      toast({ title: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setPwdBusy(false);
    }
  }

  const states = Array.from(new Set(CITIES.map((c) => c.state)));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('profile')} — name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{user.email}</Label>
                <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Organization" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('region')}</Label>
                <Select value={regionState} onValueChange={(v) => { setRegionState(v); setRegionCity(''); }}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Select value={regionCity} onValueChange={setRegionCity}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    {CITIES.filter((c) => !regionState || c.state === regionState).map((c) => (
                      <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-[12.5px]">{t('notifications')}</span>
                <Switch checked={notif} onCheckedChange={setNotif} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px]">{t('language')}</span>
                <LanguageToggle />
              </div>
              <Button type="submit" size="sm" className="ml-auto h-8 bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400" disabled={busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {t('saved') === 'Settings saved' ? 'Save changes' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('theme')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 px-4 pt-3">
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Laptop;
            return (
              <Button
                key={mode}
                size="sm"
                variant={theme === mode ? 'secondary' : 'outline'}
                className="h-8 text-xs"
                onClick={() => setTheme(mode)}
              >
                <Icon className="size-3.5" /> {mode === 'light' ? t('themeLight') : mode === 'dark' ? t('themeDark') : t('themeSystem')}
              </Button>
            );
          })}
          <span className="ml-2 text-[10.5px] text-muted-foreground">Preference persists after refresh.</span>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{t('security')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <form onSubmit={changePassword} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('currentPassword')}</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-9 text-[13px]" autoComplete="current-password" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('newPassword')}</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="h-9 text-[13px]" autoComplete="new-password" />
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs" disabled={pwdBusy}>
              {pwdBusy && <Loader2 className="size-3.5 animate-spin" />}
              {t('password')}
            </Button>
          </form>
          <Separator className="my-4" />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[9px] capitalize">{user.role}</Badge>
            <Badge variant="outline" className="text-[9px]">{user.roleStatus}</Badge>
            {user.isDemo && <Badge variant="outline" className="border-violet-500/40 text-[9px] text-violet-500">DEMO ACCOUNT</Badge>}
            <span>Sessions are httpOnly cookies; passwords are scrypt-hashed server-side.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HelpView() {
  const t = useTranslations('app.nav');
  const tf = useTranslations('landing');
  const steps = [
    ['PREDICT', 'Open the Risk Map or Dashboard to see current assessed risk per asset.'],
    ['UNDERSTAND', 'Every assessment lists contributing factors, confidence and data freshness.'],
    ['PRIORITIZE', 'Review Intervention recommendations; each explains why and what it costs.'],
    ['ACT', 'Accept a recommendation to create a work order assigned to a field operator.'],
    ['VERIFY', 'The field team submits notes and photo evidence; a supervisor verifies closure.'],
    ['LEARN', 'Analytics and the audit log track what happened and who approved it.'],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-bold">{t('help')}</h1>
      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">The JALGUARD loop</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <ol className="space-y-2.5">
            {steps.map(([k, v], i) => (
              <li key={k} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[10px] font-bold text-emerald-500">{i + 1}</span>
                <div>
                  <span className="font-mono text-[12px] font-bold">{k}</span>
                  <span className="ml-2 text-[12.5px] text-muted-foreground">{v}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">{tf('faqKicker')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 px-4 pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          <p><span className="font-semibold text-foreground">{tf('faq1Q')}</span> {tf('faq1A')}</p>
          <p><span className="font-semibold text-foreground">{tf('faq2Q')}</span> {tf('faq2A')}</p>
          <p><span className="font-semibold text-foreground">{tf('faq3Q')}</span> {tf('faq3A')}</p>
          <p><span className="font-semibold text-foreground">{tf('faq4Q')}</span> {tf('faq4A')}</p>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-[13px] font-semibold">Keyboard</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3 text-[12.5px] text-muted-foreground">
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> opens global search across assets, incidents and tasks.
        </CardContent>
      </Card>
    </div>
  );
}
