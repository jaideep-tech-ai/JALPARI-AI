'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((s) => s.locale);

  // Keep <html lang> in sync for Devanagari line-height + a11y
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
