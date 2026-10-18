'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LanguageToggle, ThemeToggle } from '@/components/shared/controls';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { api } from '@/lib/client-api';

export function LandingNav() {
  const t = useTranslations('nav');
  const tApp = useTranslations('app.nav');
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [open, setOpen] = useState(false);

  const links = [
    { label: t('platform'), href: '#intro' },
    { label: t('intelligence'), href: '#intelligence' },
    { label: t('riskMap'), href: '#riskmap' },
    { label: t('solutions'), href: '#solutions' },
    { label: t('howItWorks'), href: '#workflow' },
    { label: t('about'), href: '#responsible' },
  ];

  async function signOut() {
    await api('/api/auth', { body: { action: 'logout' } }).catch(() => {});
    setUser(null);
    setView('landing');
    window.location.hash = '';
  }

  function go(hash: string) {
    setOpen(false);
    if (useAppStore.getState().view !== 'landing') {
      setView('landing');
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[1300] border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-6">
        <button
          className="flex items-center gap-2"
          onClick={() => {
            setView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          { }
          <img src="/logo.svg" alt="JALGUARD logo" className="size-8" />
          <span className="text-lg font-extrabold tracking-tight text-white">
            JAL<span className="jg-gradient-text">GUARD</span>
          </span>
        </button>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center rounded-lg border border-white/10 bg-white/5 px-1 md:flex">
            <LanguageToggle className="text-slate-200 hover:bg-white/10 hover:text-white" />
          </div>
          <div className="hidden md:block">
            <ThemeToggle className="text-slate-200 hover:bg-white/10 hover:text-white" />
          </div>
          {user ? (
            <>
              <Button
                size="sm"
                className="h-8 bg-emerald-500 text-[13px] font-semibold text-[#06251B] hover:bg-emerald-400"
                onClick={() => setView('app')}
              >
                <LayoutDashboard className="size-3.5" />
                {tApp('dashboard')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-[13px] text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={signOut}
              >
                <LogOut className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="hidden h-8 text-[13px] text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"
                onClick={() => setView('signin')}
              >
                {t('signIn')}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-emerald-500 text-[13px] font-semibold text-[#06251B] hover:bg-emerald-400"
                onClick={() => setView('signup')}
              >
                {t('getStarted')}
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-slate-200 lg:hidden" aria-label={t('menu')}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/10 bg-[#0B1220] text-white">
              <SheetTitle className="text-white">JALGUARD</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile">
                {links.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => go(l.href)}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-white/10"
                  >
                    {l.label}
                  </button>
                ))}
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs text-slate-400">English / हिन्दी</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <Button className="mt-3 bg-emerald-500 font-semibold text-[#06251B]" onClick={() => { setOpen(false); setView('app'); }}>
                    <LayoutDashboard className="size-4" />
                    {tApp('dashboard')}
                  </Button>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => { setOpen(false); setView('signin'); }}>
                      {t('signIn')}
                    </Button>
                    <Button className="bg-emerald-500 font-semibold text-[#06251B]" onClick={() => { setOpen(false); setView('signup'); }}>
                      {t('getStarted')}
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
