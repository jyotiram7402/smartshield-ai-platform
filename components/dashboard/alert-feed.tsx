'use client';

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

export function AlertFeed({ limit = 8 }: { limit?: number }) {
  const alerts = useSim((s) => s.alerts);
  const rows = alerts.slice(0, limit);
  if (!rows.length) return <p className="text-xs text-muted-foreground">No alerts yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((a) => {
        const Icon = a.level === 'error' ? ShieldAlert : a.level === 'warn' ? AlertTriangle : Info;
        const tone = a.level === 'error' ? 'text-cyber-red border-cyber-red/30 bg-cyber-red/5' : a.level === 'warn' ? 'text-cyber-amber border-cyber-amber/30 bg-cyber-amber/5' : 'text-primary border-border bg-muted/20';
        return (
          <li key={a.id} className={cn('flex gap-2.5 rounded-lg border p-2.5 text-xs animate-fade-in', tone)}>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold text-foreground">{a.title}</span><span className="shrink-0 font-mono text-[10px] text-muted-foreground">{fmt.time(a.ts)}</span></div>
              {a.detail && <p className="mt-0.5 text-muted-foreground">{a.detail}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
