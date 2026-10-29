'use client';

import { Badge } from '@/components/ui/badge';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';
import type { TrafficEvent } from '@/lib/engine/types';

export function ActionBadge({ e }: { e: TrafficEvent }) {
  if (e.decision.rateLimited) return <Badge variant="violet">429 limit</Badge>;
  if (e.decision.action === 'block') return <Badge variant="destructive">403 block</Badge>;
  if (e.decision.action === 'challenge') return <Badge variant="warning">202 challenge</Badge>;
  return <Badge variant="success">200 allow</Badge>;
}

export function LiveLog({ limit = 14, onSelect }: { limit?: number; onSelect?: (e: TrafficEvent) => void }) {
  const events = useSim((s) => s.events);
  const rows = events.slice(0, limit);
  if (!rows.length) return <p className="text-xs text-muted-foreground">Waiting for the first request…</p>;
  return (
    <ul className="divide-y divide-border/50 font-mono text-[11px]">
      {rows.map((e) => (
        <li key={e.id} onClick={() => onSelect?.(e)} className={cn('grid cursor-pointer grid-cols-[52px_1fr_auto] items-center gap-2 py-1.5 hover:bg-muted/40', 'animate-fade-in')}>
          <span className="text-muted-foreground">{fmt.time(e.ts)}</span>
          <span className="truncate">
            <span className="mr-1">{e.country.flag}</span>
            <span className="text-foreground">{e.ip}</span>
            <span className="text-muted-foreground"> {e.method} {e.path}</span>
            <span className="text-muted-foreground"> · {e.siteId}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className={cn('tabular-nums', e.decision.score >= 0.85 ? 'text-cyber-red' : e.decision.score >= 0.55 ? 'text-cyber-amber' : 'text-cyber-lime')}>{e.decision.score.toFixed(2)}</span>
            <ActionBadge e={e} />
          </span>
        </li>
      ))}
    </ul>
  );
}
