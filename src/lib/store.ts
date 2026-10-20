'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/lib/types';

export type View =
  | 'landing'
  | 'signin'
  | 'signup'
  | 'forgot'
  | 'reset'
  | 'verify'
  | 'roleSelect'
  | 'onboarding'
  | 'publicMap'
  | 'app';

export type AppPage =
  | 'portal'
  | 'dashboard'
  | 'bento'
  | 'map'
  | 'incidents'
  | 'interventions'
  | 'tasks'
  | 'analytics'
  | 'adminUsers'
  | 'dataSources'
  | 'audit'
  | 'settings'
  | 'help';

interface AppState {
  view: View;
  appPage: AppPage;
  locale: 'en' | 'hi';
  region: string; // '' = all regions
  user: SessionUser | null;
  authChecked: boolean;
  sidebarOpen: boolean;
  pendingEmail: string;
  pendingToken: string;
  pendingRole: string | null;
  setView: (v: View) => void;
  setAppPage: (p: AppPage) => void;
  setLocale: (l: 'en' | 'hi') => void;
  setRegion: (r: string) => void;
  setUser: (u: SessionUser | null) => void;
  setAuthChecked: (v: boolean) => void;
  toggleSidebar: () => void;
  setPending: (p: { email?: string; token?: string; role?: string | null }) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'landing',
      appPage: 'dashboard',
      locale: 'en',
      region: '',
      user: null,
      authChecked: false,
      sidebarOpen: true,
      pendingEmail: '',
      pendingToken: '',
      pendingRole: null,
      setView: (v) => set({ view: v }),
      setAppPage: (p) => set({ appPage: p }),
      setLocale: (l) => set({ locale: l }),
      setRegion: (r) => set({ region: r }),
      setUser: (u) => set({ user: u }),
      setAuthChecked: (v) => set({ authChecked: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setPending: (p) =>
        set((s) => ({
          pendingEmail: p.email !== undefined ? p.email : s.pendingEmail,
          pendingToken: p.token !== undefined ? p.token : s.pendingToken,
          pendingRole: p.role !== undefined ? p.role : s.pendingRole,
        })),
      reset: () => set({ view: 'landing', appPage: 'dashboard', user: null }),
    }),
    {
      name: 'jg-prefs',
      partialize: (s) => ({ locale: s.locale, region: s.region, sidebarOpen: s.sidebarOpen }),
    }
  )
);

// ---- helpers for role-based navigation visibility ----
export function roleCanSee(
  role: SessionUser['role'],
  page: AppPage
): boolean {
  if (!role) return page === 'map';
  switch (page) {
    case 'portal':
    case 'dashboard':
    case 'bento':
    case 'map':
    case 'settings':
    case 'help':
      return true;
    case 'incidents':
      return true; // all authenticated users can view/submit incidents
    case 'interventions':
    case 'analytics':
      return ['municipal', 'disaster', 'analyst', 'org_admin', 'super_admin'].includes(role);
    case 'tasks':
      return ['field', 'infra', 'municipal', 'disaster', 'super_admin'].includes(role);
    case 'adminUsers':
    case 'dataSources':
    case 'audit':
      return ['org_admin', 'super_admin'].includes(role);
    default:
      return false;
  }
}
