'use client';

/**
 * APP SHELL — Fixly-style workspace chrome.
 *
 * Left sidebar: logo + product tagline, three calm section groups
 * (WORKSPACE / OPERATIONS / MANAGEMENT), Settings + Help, and a bottom user
 * card with the profile menu. Mobile: hamburger drawer with the same content.
 * Topbar: search, region, data freshness, language, theme, notifications.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore, roleCanSee, type AppPage } from '@/lib/store';
import { api, timeAgo } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { LanguageToggle, ThemeToggle } from '@/components/shared/controls';
import { SourceChip } from '@/components/shared/widgets';
import {
  LayoutDashboard, Map as MapIcon, AlertTriangle, Lightbulb, HardHat, BarChart3,
  Users, Database, ScrollText, Settings, HelpCircle, Bell, Search,
  LogOut, Menu, Droplets, Radio, CircleAlert, ChevronDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/types';

type NavSection = 'workspace' | 'operations' | 'management';
const NAV: { section: NavSection; label: string; page: AppPage; icon: typeof LayoutDashboard }[] = [
  { section: 'workspace', label: 'overview', page: 'dashboard', icon: LayoutDashboard },
  { section: 'operations', label: 'riskMap', page: 'map', icon: MapIcon },
  { section: 'operations', label: 'reports', page: 'incidents', icon: AlertTriangle },
  { section: 'operations', label: 'workOrders', page: 'tasks', icon: HardHat },
  { section: 'operations', label: 'interventions', page: 'interventions', icon: Lightbulb },
  { section: 'management', label: 'analytics', page: 'analytics', icon: BarChart3 },
  { section: 'management', label: 'adminUsers', page: 'adminUsers', icon: Users },
  { section: 'management', label: 'dataSources', page: 'dataSources', icon: Database },
  { section: 'management', label: 'audit', page: 'audit', icon: ScrollText },
];

const SECTION_KEY: Record<NavSection, string> = { workspace: 'groupWorkspace', operations: 'groupOperations', management: 'groupManagement' };

interface Notification { id: string; title: string; body: string; type: string; read: boolean; createdAt: string }

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('app.nav');
  const to = useTranslations('app.ops');
  const ts = useTranslations('app.shell');
  const tCommon = useTranslations('nav');
  const { user, appPage, setAppPage, setView, setUser, sidebarOpen, toggleSidebar, region, setRegion } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wxStatus, setWxStatus] = useState<'LIVE' | 'SIMULATED' | null>(null);
  const [dbOk, setDbOk] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = user?.role ?? null;
  const visibleNav = NAV.filter((n) => roleCanSee(role, n.page));

  useEffect(() => {
    api<{ notifications: Notification[] }>('/api/notifications').then((r) => setNotifications(r.notifications)).catch(() => {});
    fetch('/api/health').then((r) => r.json()).then((h) => setDbOk(h.checks?.database === 'ok')).catch(() => setDbOk(false));
    fetch('/api/weather?lat=19.076&lon=72.8777&city=Mumbai')
      .then((r) => r.json())
      .then((w) => setWxStatus(w.status))
      .catch(() => setWxStatus('SIMULATED'));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    await api('/api/notifications', { method: 'PATCH', body: { all: true } }).catch(() => {});
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  }

  async function signOut() {
    await api('/api/auth', { body: { action: 'logout' } }).catch(() => {});
    setUser(null);
    setView('landing');
  }

  const sections: NavSection[] = ['workspace', 'operations', 'management'];
  const navByPage = Object.fromEntries(NAV.map((n) => [n.page, n])) as Record<AppPage, (typeof NAV)[number]>;

  const roleLabel = (r: string | null | undefined) => {
    if (!r) return '—';
    const map: Record<string, string> = {
      citizen: 'Citizen', municipal: 'Municipal Officer', disaster: 'Disaster Management',
      field: 'Field Operations', infra: 'Infrastructure', analyst: 'Data Analyst',
      org_admin: 'Administrator', super_admin: 'Super Admin',
    };
    return map[r] ?? r;
  };

  function NavButton({ page, onNavigate }: { page: AppPage; onNavigate?: () => void }) {
    const n = navByPage[page];
    if (!n) return null;
    const Icon = n.icon;
    const active = appPage === page;
    return (
      <button
        onClick={() => { setAppPage(page); onNavigate?.(); }}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          active
            ? 'bg-sky-500/10 font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className={cn('size-4 shrink-0', active && 'text-sky-600 dark:text-sky-400')} />
        <span className="truncate">{n.label === 'overview' ? to('overview') : n.label === 'reports' ? to('reports') : n.label === 'workOrders' ? to('workOrders') : t(n.label as 'dashboard')}</span>
      </button>
    );
  }

  function userCard() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback className="bg-sky-600 text-[11px] font-bold text-white">
                {(user?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-foreground">{user?.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{roleLabel(user?.role)}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-60">
          <DropdownMenuLabel>
            <div className="text-[13px] font-semibold">{user?.name}</div>
            <div className="truncate text-[11px] font-normal text-muted-foreground">{user?.email}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {user?.isDemo && <Badge variant="outline" className="border-violet-500/40 text-[9px] text-violet-500">DEMO ACCOUNT</Badge>}
              <Badge variant="outline" className="text-[9px] capitalize">{roleLabel(user?.role)}</Badge>
              {user?.roleStatus === 'PENDING' && (
                <Badge variant="outline" className="border-amber-500/40 text-[9px] text-amber-500">{ts('roleBadgePending')}</Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAppPage('settings')}>
            <Settings className="size-3.5" /> {t('settings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAppPage('help')}>
            <HelpCircle className="size-3.5" /> {t('help')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500">
            <LogOut className="size-3.5" /> {tCommon('signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function sidebarContent(onNavigate?: () => void) {
    return (
      <div className="flex h-full flex-col">
        {/* brand */}
        <button
          className="flex items-center gap-2.5 px-4 pb-2 pt-4 text-left"
          onClick={() => { setView('landing'); setAppPage('dashboard'); }}
        >
          <img src="/logo.svg" alt="JALGUARD" className="size-8 shrink-0" />
          <span className="min-w-0">
            <span className="block text-[15px] font-extrabold leading-tight tracking-tight text-foreground">
              JALGUARD
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">{to('brandSub')}</span>
          </span>
        </button>

        <ScrollArea className="flex-1 px-3 pb-3">
          {sections.map((sec) => {
            const pages = visibleNav.filter((n) => n.section === sec).map((n) => n.page);
            if (pages.length === 0) return null;
            return (
              <div key={sec} className="mb-2">
                <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {to(SECTION_KEY[sec] as 'groupWorkspace')}
                </div>
                <div className="space-y-0.5">
                  {pages.map((p) => <NavButton key={p} page={p} onNavigate={onNavigate} />)}
                </div>
              </div>
            );
          })}
        </ScrollArea>

        <Separator />
        <div className="space-y-0.5 p-3 pb-1.5">
          <button
            onClick={() => { setAppPage('settings'); onNavigate?.(); }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
              appPage === 'settings' ? 'bg-sky-500/10 font-semibold text-sky-700 dark:text-sky-300' : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <Settings className="size-4" /> {t('settings')}
          </button>
          <button
            onClick={() => { setAppPage('help'); onNavigate?.(); }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
              appPage === 'help' ? 'bg-sky-500/10 font-semibold text-sky-700 dark:text-sky-300' : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <HelpCircle className="size-4" /> {t('help')}
          </button>
        </div>
        <div className="border-t border-border/60 p-2">{userCard()}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-border/70 bg-sidebar transition-all duration-300 md:block',
          sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
        )}
      >
        {sidebarContent()}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[1400] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border/70 bg-sidebar shadow-xl">
            <button
              className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            {sidebarContent(() => setMobileNavOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-[1200] border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 md:px-5">
            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
              <Menu className="size-4.5" />
            </Button>
            {/* mobile brand */}
            <button className="flex items-center gap-2 md:hidden" onClick={() => setAppPage('dashboard')}>
              <img src="/logo.svg" alt="JALGUARD" className="size-7" />
              <span className="text-sm font-extrabold tracking-tight">JALGUARD</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              className="ml-1 h-8 w-9 justify-start gap-2 px-2 text-muted-foreground md:ml-0 md:w-64"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-3.5" />
              <span className="hidden truncate text-xs md:inline">{ts('searchPlaceholder')}</span>
              <kbd className="ml-auto hidden rounded border bg-muted px-1 font-mono text-[9px] md:inline">⌘K</kbd>
            </Button>

            {/* Region selector */}
            <div className="hidden lg:block">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-8 rounded-md border bg-transparent px-2 text-xs text-foreground"
                aria-label={ts('region')}
              >
                <option value="">{ts('allRegions')}</option>
                {['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Kochi', 'Guwahati', 'Patna'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Data freshness */}
              <div className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] text-muted-foreground xl:flex">
                <Radio className={cn('size-3', wxStatus === 'LIVE' ? 'animate-pulse text-emerald-500' : 'text-violet-400')} />
                {ts('dataFreshness')}
                {wxStatus && <SourceChip status={wxStatus} />}
                {!dbOk && <CircleAlert className="size-3.5 text-red-500" />}
              </div>
              <LanguageToggle />
              <ThemeToggle />

              {/* Notifications */}
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative size-8" aria-label={ts('notifications')}>
                    <Bell className="size-4" />
                    {unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold">{ts('notifications')}</span>
                    {unread > 0 && (
                      <button className="text-[11px] text-emerald-500 hover:underline" onClick={markAllRead}>
                        {ts('markAllRead')}
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">{ts('noNotifications')}</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={cn('px-3 py-2.5', !n.read && 'bg-emerald-500/5')}>
                          <div className="text-[12.5px] font-semibold leading-tight">{n.title}</div>
                          <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{n.body}</div>
                          <div className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile-only profile shortcut */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Profile menu">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-sky-600 text-[10px] font-bold text-white">
                          {(user?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="text-[13px] font-semibold">{user?.name}</div>
                      <div className="truncate text-[11px] font-normal text-muted-foreground">{roleLabel(user?.role)}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAppPage('settings')}>
                      <Settings className="size-3.5" /> {t('settings')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500">
                      <LogOut className="size-3.5" /> {tCommon('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 md:p-5">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}

function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const ts = useTranslations('app.shell');
  const setAppPage = useAppStore((s) => s.setAppPage);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ assets: { id: string; name: string; code: string; city: string }[]; incidents: { id: string; title: string; city: string }[]; tasks: { id: string; title: string }[] }>({ assets: [], incidents: [], tasks: [] });

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length < 2) {
        setResults({ assets: [], incidents: [], tasks: [] });
        return;
      }
      api<typeof results>(`/api/search?q=${encodeURIComponent(q)}`).then(setResults).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={ts('searchPlaceholder')} value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>—</CommandEmpty>
        {results.assets.length > 0 && (
          <CommandGroup heading="Assets">
            {results.assets.map((a) => (
              <CommandItem key={a.id} onSelect={() => { setAppPage('map'); setOpen(false); }}>
                <Droplets className="size-3.5" /> {a.name} · {a.code} · {a.city}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.incidents.length > 0 && (
          <CommandGroup heading="Incidents">
            {results.incidents.map((i) => (
              <CommandItem key={i.id} onSelect={() => { setAppPage('incidents'); setOpen(false); }}>
                <AlertTriangle className="size-3.5" /> {i.title} · {i.city}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((tk) => (
              <CommandItem key={tk.id} onSelect={() => { setAppPage('tasks'); setOpen(false); }}>
                <HardHat className="size-3.5" /> {tk.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
