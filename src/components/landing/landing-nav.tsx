'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LanguageToggle, ThemeToggle } from '@/components/shared/controls';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { api } from '@/lib/client-api';
import { cn } from '@/lib/utils';

const SECTION_IDS = ['intro', 'intelligence', 'riskmap', 'solutions', 'workflow', 'responsible'] as const;

export function LandingNav() {
  const t = useTranslations('nav');
  const tApp = useTranslations('app.nav');
  const tCommon = useTranslations('common');
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const links = [
    { id: 'intro', label: t('platform') },
    { id: 'intelligence', label: t('intelligence') },
    { id: 'riskmap', label: t('riskMap') },
    { id: 'solutions', label: t('solutions') },
    { id: 'workflow', label: t('howItWorks') },
    { id: 'responsible', label: t('about') },
  ];

  // Scroll-aware glass + scrollspy (only meaningful while on the landing view)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (useAppStore.getState().view !== 'landing') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  async function signOut() {
    await api('/api/auth', { body: { action: 'logout' } }).catch(() => {});
    setUser(null);
    setView('landing');
    window.location.hash = '';
  }

  function go(id: string) {
    setOpen(false);
    const hash = `#${id}`;
    if (useAppStore.getState().view !== 'landing') {
      setView('landing');
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[1300] border-b transition-all duration-300',
        scrolled
          ? 'border-white/[0.05] bg-[#050508]/70 shadow-lg shadow-black/30 backdrop-blur-[16px]'
          : 'border-white/[0.05] bg-[rgba(5,5,8,0.4)] backdrop-blur-[16px]',
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-6">
        <button
          className="flex items-center gap-2"
          onClick={() => {
            setView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.svg" alt="JALGUARD logo" className="size-8" />
          <span className="text-lg font-extrabold tracking-tight text-white">
            JAL<span className="jg-gradient-text">GUARD</span>
          </span>
        </button>

        {/* Environment honesty pill */}
        <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-300 md:inline-flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          {tCommon('demo')}
        </span>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              aria-current={active === l.id ? 'true' : undefined}
              className={cn(
                'relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                active === l.id ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              {l.label}
              <span
                className={cn(
                  'absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-gradient-to-r from-emerald-400 to-[#38D9D6] transition-opacity duration-300',
                  active === l.id ? 'opacity-100' : 'opacity-0',
                )}
              />
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
                className="jg-glow-btn h-8 bg-emerald-500 text-[13px] font-semibold text-[#06251B] hover:bg-emerald-400"
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
                className="jg-glow-btn h-8 bg-emerald-500 text-[13px] font-semibold text-[#06251B] hover:bg-emerald-400"
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
                    key={l.id}
                    onClick={() => go(l.id)}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-white/10',
                      active === l.id ? 'bg-white/5 text-emerald-300' : 'text-slate-200',
                    )}
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
