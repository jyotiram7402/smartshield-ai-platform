'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import type { SiteId } from '@/lib/engine/types';
import { ensureSimulation, useSim } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface SiteTheme {
  primary: string; // bg class
  primaryText: string; // text class
  accent: string; // bg class for CTAs
  soft: string; // light tinted bg
  ring: string; // focus/border tint
}

function StatusGate({ siteId, brand, children }: { siteId: SiteId; brand: string; children: React.ReactNode }) {
  const params = useSearchParams();
  const via = params.get('via');
  const site = useSim((s) => s.sites.find((x) => x.id === siteId));
  useEffect(() => { ensureSimulation(); }, []);

  if (site?.status === 'down') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl font-black text-slate-300">503</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Service unavailable</h1>
        <p className="mt-2 max-w-md text-slate-500">{brand} is receiving more traffic than it can handle right now. Please try again in a moment.</p>
        <p className="mt-1 font-mono text-xs text-slate-400">origin overloaded · {site.rps} req/s against a capacity of {site.capacityRps} · Retry-After: 1</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />Retry</button>
        <Link href="/dashboard/sites" className="mt-3 text-xs text-slate-500 underline">Back to the SmartShield dashboard</Link>
      </div>
    );
  }
  return (
    <>
      {via === 'shield' && (
        <div className="bg-emerald-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" />Served through the SmartShield AI gateway (<span className="font-mono">/proxy/{siteId}/</span>) — this request was scored by four models and allowed{site ? ` · origin ${site.status.toUpperCase()} · ${site.latencyMs} ms` : ''}.
        </div>
      )}
      {via === 'direct' && (
        <div className="bg-red-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          <ShieldAlert className="mr-1.5 inline h-3.5 w-3.5" />Unprotected origin — you reached this site directly on its raw port; the gateway never saw this request{site ? ` · origin ${site.status.toUpperCase()} · load ${Math.round(site.load * 100)}%` : ''}.
        </div>
      )}
      {children}
    </>
  );
}

export function SiteShell({ siteId, brand, letter, tagline, theme, nav, cta, children }: { siteId: SiteId; brand: string; letter: string; tagline: string; theme: SiteTheme; nav: { label: string; href: string }[]; cta?: { label: string; href: string }; children: React.ReactNode }) {
  return (
    <div className="site-light min-h-screen bg-slate-50 font-sans text-slate-900">
      <Suspense fallback={null}>
        <StatusGate siteId={siteId} brand={brand}>
          <div className={cn('text-xs text-white/90', theme.primary)}>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-1.5"><span>{tagline}</span><Link href="/dashboard/sites" className="hidden underline-offset-2 hover:underline sm:inline">🛡 Protected by SmartShield AI</Link></div>
          </div>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
              <a href="#top" className="flex items-center gap-2.5 text-lg font-extrabold"><span className={cn('grid h-9 w-9 place-items-center rounded-lg text-white', theme.primary)}>{letter}</span>{brand}</a>
              <nav className="ml-auto hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">{nav.map((n) => <a key={n.href} href={n.href} className="hover:text-slate-900">{n.label}</a>)}</nav>
              {cta && <a href={cta.href} className={cn('rounded-lg px-4 py-2 text-sm font-semibold text-white', theme.primary)}>{cta.label}</a>}
            </div>
          </header>
          <main id="top">{children}</main>
          <footer className="mt-16 bg-slate-900 text-slate-300">
            <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-4">
              <div className="md:col-span-2"><div className="flex items-center gap-2 text-lg font-extrabold text-white"><span className={cn('grid h-8 w-8 place-items-center rounded-lg text-white', theme.primary)}>{letter}</span>{brand}</div><p className="mt-3 max-w-sm text-sm text-slate-400">{tagline}</p></div>
              <div><h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Company</h4>{['About us', 'Careers', 'Press', 'Contact'].map((l) => <a key={l} href="#top" className="block py-1 text-sm hover:text-white">{l}</a>)}</div>
              <div><h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Legal</h4>{['Privacy policy', 'Terms of use', 'Cookie policy', 'Security'].map((l) => <a key={l} href="#top" className="block py-1 text-sm hover:text-white">{l}</a>)}</div>
            </div>
            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-xs text-slate-400"><span>© {new Date().getFullYear()} {brand}. Fictional demo website.</span><Link href="/dashboard" className="font-semibold text-sky-300">🛡 Protected by SmartShield AI</Link></div>
            </div>
          </footer>
        </StatusGate>
      </Suspense>
    </div>
  );
}

export function Section({ id, title, subtitle, children, className }: { id?: string; title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('mx-auto max-w-6xl px-5 py-10', className)}>
      {title && <div className="mb-6"><h2 className="text-2xl font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>}
      {children}
    </section>
  );
}

export const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';
export const label = 'mb-1 block text-xs font-semibold text-slate-600';
