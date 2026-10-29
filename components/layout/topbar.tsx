'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ExternalLink, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

const TITLES: Record<string, [string, string]> = {
  '/dashboard': ['Overview', 'Live view of everything passing through the gateway'],
  '/dashboard/traffic': ['Traffic & IP intelligence', 'Every address the gateway has seen, scored and classified'],
  '/dashboard/engine': ['AI engine', 'Feature extraction, the four models and how a verdict is reached'],
  '/dashboard/sites': ['Protected sites', 'Origin health and attack drills'],
  '/dashboard/simulator': ['Attack simulator', 'Launch controlled attacks and watch the shield respond'],
  '/dashboard/logs': ['Request log', 'Every decision, with its feature vector and model breakdown'],
  '/dashboard/settings': ['Settings', 'Shield policy, thresholds and model weights'],
};

export function Topbar() {
  const pathname = usePathname();
  const [title, sub] = TITLES[pathname] || ['Dashboard', ''];
  const connected = useSim((s) => s.connected);
  const enabled = useSim((s) => s.config.enabled);
  const rps = useSim((s) => s.metrics.rps);
  const setConfig = useSim((s) => s.setConfig);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
        {sub && <p className="hidden truncate text-xs text-muted-foreground md:block">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-muted-foreground sm:inline-flex"><Activity className="h-3 w-3 text-primary" />{fmt.int(rps)} req/s</span>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold', connected ? 'border-cyber-lime/40 bg-cyber-lime/10 text-cyber-lime' : 'border-border text-muted-foreground')}>
          <Radio className={cn('h-3 w-3', connected && 'animate-pulse')} />{connected ? 'Gateway online' : 'Connecting…'}
        </span>
        <label className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1">
          <span className={cn('font-semibold', enabled ? 'text-cyber-lime' : 'text-cyber-red')}>Shield {enabled ? 'ON' : 'OFF'}</span>
          <Switch checked={enabled} onCheckedChange={(v) => setConfig({ enabled: v })} label="Toggle shield" />
        </label>
        <Link href="/" className="hidden text-muted-foreground hover:text-foreground lg:inline-flex" title="Back to site"><ExternalLink className="h-4 w-4" /></Link>
      </div>
    </header>
  );
}
