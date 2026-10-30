'use client';

/**
 * PRO NAV — floating pill navigation (Imageworks pattern):
 * shrinks on scroll, tracks the active section, mobile sheet menu,
 * language switch + auth-aware actions built in.
 */

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, ArrowLeft, Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/client-api';
import { cn } from '@/lib/utils';

export interface ProNavSection { id: string; label: string }

export function ProNav({ sections, ctaLabel }: { sections: ProNavSection[]; ctaLabel: string }) {
  const { view, user, setView, setUser, setAppPage } = useAppStore();
  const tP = useTranslations('pro');
  const tNav = useTranslations('nav');
  const [shrunk, setShrunk] = React.useState(false);
  const [active, setActive] = React.useState<string>('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  React.useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // active-section tracking
  React.useEffect(() => {
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        if (visible.size) {
          const top = [...visible.entries()].sort((a, b) => b[1] - a[1])[0][0];
          setActive(top);
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  function go(id: string) {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function signOut() {
    try { await api('/api/auth', { body: { action: 'logout' } }); } catch { /* noop */ }
    setUser(null);
    setMenuOpen(false);
    setView('landing');
  }

  function openWorkspace() {
    setMenuOpen(false);
    setAppPage('dashboard'); // straight into the ops console; sidebar "Portal" returns to the role landing
    setView('app');
  }

  // Smart back for role landing pages: signed-in users return to the
  // workspace console, guests fall back to the public landing.
  function goBack() {
    setMenuOpen(false);
    if (user) {
      setAppPage('dashboard');
      setView('app');
    } else {
      setView('landing');
    }
  }

  return (
    <>
      <div className="pro-nav-wrap">
        <nav className="pro-nav" data-shrunk={shrunk} aria-label="Primary">
          {view !== 'landing' && (
            <button
              type="button"
              onClick={goBack}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--pro-line)] bg-white px-2.5 text-[12.5px] font-semibold text-[color:var(--pro-ink)] transition-colors hover:bg-[color:var(--pro-paper-2)] sm:px-3"
              aria-label={tP('back')}
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">{tP('back')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); if (view !== 'landing') setView('landing'); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex shrink-0 items-center gap-2 pl-1 pr-2"
          >
            { }
            <img src="/logo.svg" alt="JALGUARD" className="size-8" />
            <span className="hidden text-[15px] font-bold tracking-[0.05em] text-[color:var(--pro-ink)] sm:block">
              JAL<span className="text-[color:var(--pro-accent)]">GUARD</span>
            </span>
          </button>

          <div className="mx-auto hidden items-center lg:flex">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="pro-nav-link"
                data-active={active === s.id}
                onClick={() => go(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
              className="hidden h-9 items-center rounded-full border border-[color:var(--pro-line)] bg-white px-3 text-[12.5px] font-semibold text-[color:var(--pro-ink)] transition-colors hover:bg-[color:var(--pro-paper-2)] md:flex"
              aria-label="Switch language English / हिन्दी"
            >
              {locale === 'en' ? 'EN / हिन्दी' : 'हिन्दी / EN'}
            </button>

            {user ? (
              <>
                <button type="button" onClick={openWorkspace} className="pro-btn pro-btn-primary h-9 hidden px-4 text-[13px] md:inline-flex">
                  <LayoutDashboard className="size-4" aria-hidden /> {ctaLabel}
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="hidden size-9 items-center justify-center rounded-full border border-[color:var(--pro-line)] text-[color:var(--pro-muted)] transition-colors hover:text-[color:var(--pro-ink)] md:flex"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" aria-hidden />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setView('publicMap'); }}
                  className="hidden h-9 items-center gap-1.5 rounded-full border border-[color:var(--pro-line)] bg-white px-3 text-[12.5px] font-semibold text-[color:var(--pro-ink)] transition-colors hover:bg-[color:var(--pro-paper-2)] md:inline-flex"
                >
                  <MapIcon className="size-3.5" aria-hidden /> {tNav('riskMap')}
                </button>
                <button type="button" onClick={() => setView('signin')} className="pro-btn pro-btn-ghost h-9 hidden px-4 text-[13px] sm:inline-flex">
                  Sign in
                </button>
                <button type="button" onClick={() => setView('signup')} className="pro-btn pro-btn-primary h-9 px-4 text-[13px]">
                  Get started
                </button>
              </>
            )}

            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-[color:var(--pro-line)] text-[color:var(--pro-ink)] lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="size-4.5" aria-hidden /> : <Menu className="size-4.5" aria-hidden />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pro-mobile-menu lg:hidden"
          >
            <div className="grid gap-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-[color:var(--pro-ink)] transition-colors',
                    active === s.id ? 'bg-[color:var(--pro-sage-soft)]' : 'hover:bg-[color:var(--pro-paper-2)]',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-[color:var(--pro-line)] p-2">
              {view !== 'landing' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex size-11 items-center justify-center rounded-2xl border border-[color:var(--pro-line)] text-[color:var(--pro-ink)]"
                  aria-label={tP('back')}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
                className="flex-1 rounded-2xl border border-[color:var(--pro-line)] px-4 py-2.5 text-[13.5px] font-semibold"
              >
                {locale === 'en' ? 'हिन्दी' : 'English'}
              </button>
              {user ? (
                <button type="button" onClick={openWorkspace} className="pro-btn pro-btn-primary h-11 flex-1 text-[13.5px]">
                  {ctaLabel}
                </button>
              ) : (
                <button type="button" onClick={() => { setMenuOpen(false); setView('signin'); }} className="pro-btn pro-btn-accent h-11 flex-1 text-[13.5px]">
                  Sign in
                </button>
              )}
              {user && (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex size-11 items-center justify-center rounded-2xl border border-[color:var(--pro-line)] text-[color:var(--pro-muted)]"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
