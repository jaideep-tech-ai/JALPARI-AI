'use client';

import { NextIntlClientProvider } from 'next-intl';
import { en } from './en';
import { hi } from './hi';
import { useAppStore } from '@/lib/store';

const DICTS: Record<string, Record<string, unknown>> = { en, hi };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((s) => s.locale);
  const messages = (DICTS[locale] ?? en) as Record<string, unknown>;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={() => {}}
      getMessageFallback={(_ns, key) => key}
      timeZone="Asia/Kolkata"
    >
      {children}
    </NextIntlClientProvider>
  );
}

export type { Messages } from './en';
