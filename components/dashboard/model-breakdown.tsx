'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FEATURE_LABELS } from '@/lib/engine/features';
import type { Features, TrafficEvent } from '@/lib/engine/types';
import { cn } from '@/lib/utils';
import { ActionBadge } from './live-log';

const MODEL_TONE: Record<string, string> = { rf: 'bg-cyber-teal', if: 'bg-cyber-violet', ae: 'bg-cyber-blue', lstm: 'bg-cyber-amber' };

function featureValue(k: keyof Features, v: Features[keyof Features]) {
  if (k === 'session_age_ms') return `${(Number(v) / 1000).toFixed(1)} s`;
  if (k === 'content_length') return `${v} B`;
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

/** Full explainability view for one request: features → per-model scores → fused verdict. */
export function ModelBreakdown({ event, compact = false }: { event: TrafficEvent; compact?: boolean }) {
  const d = event.decision;
  const f = event.features;
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono">{event.country.flag} {event.ip}</span>
        <span className="text-muted-foreground">{event.method} {event.path} · {event.siteId}</span>
        <ActionBadge e={event} />
        <Badge variant={d.classification === 'bot' ? 'destructive' : d.classification === 'suspicious' ? 'warning' : 'success'}>{d.classification}</Badge>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold uppercase tracking-wider text-muted-foreground">Fused risk score</span><span className={cn('font-mono text-lg font-bold', d.score >= 0.85 ? 'text-cyber-red' : d.score >= 0.55 ? 'text-cyber-amber' : 'text-cyber-lime')}>{d.score.toFixed(3)}</span></div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyber-lime via-cyber-amber to-cyber-red" style={{ width: `${d.score * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {d.models.map((m) => (
          <div key={m.model} className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold">{m.label}</span><span className="font-mono text-muted-foreground">w {m.weight.toFixed(2)} · {m.latencyMs} ms</span></div>
            <div className="mt-1.5 flex items-center gap-2"><Progress value={m.score * 100} barClassName={MODEL_TONE[m.model]} /><span className="w-12 text-right font-mono text-xs">{m.score.toFixed(3)}</span></div>
            <p className="mt-1 text-[11px] text-muted-foreground">{m.note}</p>
            {!compact && m.contributions.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-[11px]">
                {m.contributions.filter((c) => Math.abs(c.impact) >= 0.02).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 4).map((c) => (
                  <li key={c.feature} className="flex justify-between gap-2"><span className="truncate text-muted-foreground">{(FEATURE_LABELS as Record<string, string>)[c.feature] || c.feature} = {c.value}</span><span className={cn('font-mono', c.impact > 0 ? 'text-cyber-red' : 'text-cyber-lime')}>{c.impact > 0 ? '+' : ''}{c.impact.toFixed(2)}</span></li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {!compact && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature vector (10)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-[11px]">
            {(Object.keys(FEATURE_LABELS) as (keyof Features)[]).map((k) => (
              <div key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{FEATURE_LABELS[k]}</span><span className="font-mono">{featureValue(k, f[k])}</span></div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why</div>
        <ul className="space-y-1 text-xs">
          {d.explanations.map((x, i) => <li key={i} className="flex gap-2"><span className="text-primary">▸</span><span>{x}</span></li>)}
        </ul>
      </div>
    </div>
  );
}
