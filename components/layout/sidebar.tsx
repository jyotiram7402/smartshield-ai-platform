'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Crosshair, Globe2, LayoutDashboard, ScrollText, Server, Settings, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSim } from '@/lib/store';

export const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/traffic', label: 'Traffic & IPs', icon: Globe2 },
  { href: '/dashboard/engine', label: 'AI Engine', icon: Brain },
  { href: '/dashboard/sites', label: 'Protected Sites', icon: Server },
  { href: '/dashboard/simulator', label: 'Attack Simulator', icon: Crosshair },
  { href: '/dashboard/logs', label: 'Request Log', icon: ScrollText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const enabled = useSim((s) => s.config.enabled);
  const attacks = useSim((s) => s.attacks.length);
  const engine = useSim((s) => s.engine);

  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/70 bg-background/80 backdrop-blur md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyber-teal to-cyber-lime text-background"><ShieldCheck className="h-5 w-5" /></span>
        <span>SmartShield <span className="text-gradient">AI</span></span>
      </Link>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', isActive(pathname, href) ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
            <Icon className="h-4 w-4" />
            {label}
            {href === '/dashboard/simulator' && attacks > 0 && <span className="ml-auto rounded-full bg-cyber-amber/20 px-1.5 text-[10px] font-bold text-cyber-amber">{attacks} live</span>}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t border-border/70 p-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-between"><span>Shield</span><span className={cn('font-semibold', enabled ? 'text-cyber-lime' : 'text-cyber-red')}>{enabled ? 'ON' : 'OFF'}</span></div>
        <div className="flex items-center justify-between"><span>AI engine</span><span className="font-semibold text-cyber-lime">{engine.models.filter((m) => m.loaded).length}/4 models</span></div>
        <div className="flex items-center justify-between"><span>Inference</span><span className="font-mono">{engine.avgInferenceMs} ms</span></div>
        <div className="pt-1 text-[10px]">Gateway :5000 · AI engine :8000 · v1.4.2</div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background/95 py-1.5 backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cn('flex flex-col items-center gap-0.5 px-1 text-[10px]', isActive(pathname, href) ? 'text-primary' : 'text-muted-foreground')}>
          <Icon className="h-4 w-4" />
          <span className="truncate">{label.split(' ')[0]}</span>
        </Link>
      ))}
    </nav>
  );
}
