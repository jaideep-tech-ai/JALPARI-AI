'use client';

import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { Separator } from '@/components/ui/separator';
import { SourceChip } from '@/components/shared/widgets';
import { ShieldCheck } from 'lucide-react';

export function LandingFooter() {
  const t = useTranslations('landing');
  const setView = useAppStore((s) => s.setView);

  const cols = [
    {
      title: t('footerProduct'),
      links: [
        { label: t('mapCta'), action: () => setView('publicMap') },
        { label: t('introKicker'), action: () => document.querySelector('#intro')?.scrollIntoView({ behavior: 'smooth' }) },
        { label: t('faqKicker'), action: () => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) },
      ],
    },
    {
      title: t('footerCompany'),
      links: [
        { label: t('contactTitle'), action: () => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) },
        { label: t('aiKicker'), action: () => document.querySelector('#responsible')?.scrollIntoView({ behavior: 'smooth' }) },
      ],
    },
    {
      title: t('footerLegal'),
      links: [
        { label: t('footerPrivacy'), action: () => {} },
        { label: t('footerTerms'), action: () => {} },
        { label: t('footerAccess'), action: () => {} },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t bg-[#0B1220] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="JALGUARD logo" className="size-8" />
              <span className="text-lg font-extrabold tracking-tight text-white">
                JAL<span className="jg-gradient-text">GUARD</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-400">{t('footerTagline')}</p>
            {/* honest status row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SourceChip status="LIVE" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300" />
              <SourceChip status="SIMULATED" className="border-violet-500/30 bg-violet-500/10 text-violet-300" />
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-500/70" />
              {t('footerAttribution')}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <button className="text-[13px] text-slate-300 transition-colors hover:text-emerald-400" onClick={l.action}>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8 bg-white/10" />
        <p className="text-center text-[11.5px] leading-relaxed text-slate-500">{t('footerRights')}</p>
      </div>
    </footer>
  );
}
