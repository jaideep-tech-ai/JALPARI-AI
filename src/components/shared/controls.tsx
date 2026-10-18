'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const user = useAppStore((s) => s.user);

  function toggle() {
    const next = locale === 'en' ? 'hi' : 'en';
    setLocale(next);
    // persist to profile when signed in (best-effort)
    if (user) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfile', language: next }),
      }).catch(() => {});
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn('h-8 gap-1.5 px-2 font-semibold', className)}
      aria-label="Switch language English / हिन्दी"
    >
      <Languages className="size-4" />
      <span className={cn('text-xs', locale === 'en' ? 'text-foreground' : 'text-muted-foreground')}>EN</span>
      <span className="text-[10px] text-muted-foreground">/</span>
      <span className={cn('text-xs', locale === 'hi' ? 'text-foreground' : 'text-muted-foreground')}>हिन्दी</span>
    </Button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('app.settings');
  // CSS-driven icon swap avoids hydration-timing state entirely
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn('size-8', className)}
      aria-label={t('theme')}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
