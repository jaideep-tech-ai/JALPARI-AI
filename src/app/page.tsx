'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore, roleCanSee } from '@/lib/store';
import { api } from '@/lib/client-api';
import { LandingNav } from '@/components/landing/landing-nav';
import { SpaceJourney } from '@/components/landing/space-journey';
import { SosButton } from '@/components/landing/sos-button';
import { LandingSections } from '@/components/landing/landing-sections';
import {
  SignInScreen, SignUpScreen, ForgotScreen, ResetScreen,
  VerifyScreen, RoleSelectScreen, OnboardingScreen, ChangePasswordGate,
} from '@/components/auth/auth-screens';
import { AppShell } from '@/components/app/app-shell';
import { DashboardPage } from '@/components/dashboard/dashboards';
import { BentoDashboard } from '@/components/dashboard/bento-dashboard';
import { RolePortal } from '@/components/dashboard/role-portal';
import { MapView } from '@/components/map/map-view';
import { IncidentsView } from '@/components/app/incidents-view';
import { InterventionsView } from '@/components/app/interventions-view';
import { TasksView } from '@/components/app/tasks-view';
import { AnalyticsView } from '@/components/app/analytics-view';
import { AdminUsersView, AuditView, DataSourcesView } from '@/components/app/admin-views';
import { SettingsView, HelpView } from '@/components/app/settings-view';
import { Skeleton } from '@/components/ui/skeleton';
import { LandingFooter } from '@/components/landing/landing-footer';
import { Loader2 } from 'lucide-react';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        { }
        <img src="/logo.svg" alt="JALGUARD" className="size-12 animate-pulse" />
        <Loader2 className="size-5 animate-spin text-emerald-500" />
      </div>
    </div>
  );
}

export default function Home() {
  const tNav = useTranslations('nav');
  const tMap = useTranslations('app.map');
  const {
    view, appPage, user, authChecked, setView, setUser, setAuthChecked, setAppPage,
  } = useAppStore();

  // Hydrate session once on load; signed-in users go straight to the app
  useEffect(() => {
    api<{ user: typeof user }>('/api/auth')
      .then((r) => {
        if (r.user) {
          setUser(r.user);
          const s = useAppStore.getState();
          if (r.user.mustChangePassword) {
            s.setView('app'); // app shell gates on ChangePasswordGate
          } else if (!r.user.emailVerified) {
            s.setView('verify');
          } else if (r.user.role === null) {
            s.setView('roleSelect');
          } else if (!r.user.onboarded) {
            s.setView('onboarding');
          } else {
            s.setView('app');
          }
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, [setUser, setAuthChecked]);

  if (!authChecked) return <FullPageLoader />;

  // ---------- Auth / marketing views ----------
  if (view === 'signin') return <SignInScreen />;
  if (view === 'signup') return <SignUpScreen />;
  if (view === 'forgot') return <ForgotScreen />;
  if (view === 'reset') return <ResetScreen />;
  if (view === 'verify') return <VerifyScreen />;
  if (view === 'roleSelect') return user ? <RoleSelectScreen /> : <SignInScreen />;
  if (view === 'onboarding') return user ? <OnboardingScreen /> : <SignInScreen />;

  // ---------- Public risk map ----------
  if (view === 'publicMap') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <LandingNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-20 md:px-6">
          <h1 className="mb-1 text-lg font-bold">{tMap('title')}</h1>
          <p className="mb-4 text-[12.5px] text-muted-foreground">{tMap('publicMode')} · {tMap('noSelection')}</p>
          <MapView authed={false} />
        </main>
        <LandingFooter />
      </div>
    );
  }

  // ---------- Authenticated app ----------
  if (view === 'app') {
    if (!user) return <SignInScreen />;
    // Forced first-login password change (bootstrap admin)
    if (user.mustChangePassword) return <ChangePasswordGate />;
    const page = roleCanSee(user.role, appPage) ? appPage : 'dashboard';
    return (
      <AppShell>
        {page === 'portal' && <RolePortal />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'bento' && <BentoDashboard />}
        {page === 'map' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">{tMap('title')}</h1>
            <MapView authed />
          </div>
        )}
        {page === 'incidents' && <IncidentsView mine={user.role === 'citizen'} />}
        {page === 'interventions' && <InterventionsView />}
        {page === 'tasks' && <TasksView mine={user.role === 'field' || user.role === 'infra'} />}
        {page === 'analytics' && <AnalyticsView />}
        {page === 'adminUsers' && <AdminUsersView />}
        {page === 'dataSources' && <DataSourcesView />}
        {page === 'audit' && <AuditView />}
        {page === 'settings' && <SettingsView />}
        {page === 'help' && <HelpView />}
      </AppShell>
    );
  }

  // ---------- Landing (default) ----------
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <SpaceJourney />
      <LandingSections />
      <SosButton />
    </div>
  );
}
