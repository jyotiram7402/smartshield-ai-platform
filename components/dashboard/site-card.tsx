'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, ExternalLink, Globe, Pause, ShieldCheck, ShieldOff, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ATTACK_LIBRARY } from '@/lib/engine/traffic';
import type { AttackKind, SiteState } from '@/lib/engine/types';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

const STATUS = {
  up: { label: 'UP', badge: 'success' as const, icon: CheckCircle2 },
  degraded: { label: 'SLOW', badge: 'warning' as const, icon: Activity },
  down: { label: 'DOWN', badge: 'destructive' as const, icon: XCircle },
};
const PORT: Record<string, number> = { northbolt: 4001, tinyshop: 4002, bloglite: 4003, bookingmini: 4004 };

export function SiteCard({ site }: { site: SiteState }) {
  const attack = useSim((s) => s.attacks.find((a) => a.siteId === site.id));
  const enabled = useSim((s) => s.config.enabled);
  const launch = useSim((s) => s.launchAttack);
  const stop = useSim((s) => s.stopAttack);
  const [kind, setKind] = useState<AttackKind>('flood');
  const [intensity, setIntensity] = useState(60);
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const st = STATUS[site.status];
  const Icon = st.icon;

  function go(route: 'direct' | 'shield') {
    const r = launch({ siteId: site.id, kind, route, intensity, durationSec: duration });
    setError(r.ok ? null : r.error || 'Could not start the attack.');
  }

  return (
    <Card className={cn('relative overflow-hidden', site.status === 'down' && 'border-cyber-red/50', site.status === 'degraded' && 'border-cyber-amber/40')}>
      <div className={cn('absolute inset-x-0 top-0 h-0.5', site.status === 'up' ? 'bg-cyber-lime/70' : site.status === 'degraded' ? 'bg-cyber-amber/70' : 'bg-cyber-red/80')} />
      {site.status === 'down' && <div aria-hidden className="pointer-events-none absolute inset-0 animate-pulse bg-cyber-red/[0.05]" />}
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-muted-foreground" />{site.name}</CardTitle>
          <CardDescription>{site.kind} · {site.description}</CardDescription>
        </div>
        <Badge variant={st.badge} className="gap-1"><Icon className="h-3 w-3" />{st.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <Stat label="Load" value={`${Math.round(site.load * 100)}%`} tone={site.load >= 1 ? 'text-cyber-red' : site.load > 0.7 ? 'text-cyber-amber' : ''} />
          <Stat label="Req/s" value={fmt.int(site.rps)} />
          <Stat label="Latency" value={site.status === 'down' ? 'timeout' : `${site.latencyMs} ms`} tone={site.status === 'down' ? 'text-cyber-red' : ''} />
          <Stat label="Shed (503)" value={fmt.int(site.shed)} tone={site.shed ? 'text-cyber-red' : ''} />
        </div>
        <Sparkline history={site.history} />
        {site.lastError && <p className="font-mono text-[11px] text-cyber-red">health probe: {site.lastError}</p>}

        <div className="grid gap-1.5 font-mono text-[11px]">
          <Link href={`${site.path}?via=direct`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40" title="Raw origin — bypasses the gateway"><ShieldOff className="h-3 w-3 text-cyber-red" /><span className="w-28 text-muted-foreground">Direct</span><span className="flex-1 truncate">origin:{PORT[site.id]}/</span><ExternalLink className="h-3 w-3 text-muted-foreground" /></Link>
          <Link href={`${site.path}?via=shield`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40" title="Through the SmartShield gateway"><ShieldCheck className="h-3 w-3 text-cyber-lime" /><span className="w-28 text-muted-foreground">Via SmartShield</span><span className="flex-1 truncate">gateway:5000/proxy/{site.id}/</span><ExternalLink className="h-3 w-3 text-muted-foreground" /></Link>
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Attack drill</span>
            {attack && <Badge variant="warning" className="animate-glow gap-1"><Zap className="h-3 w-3" />{attack.kind} · {attack.route} · {Math.max(0, Math.round(attack.durationSec - (Date.now() - attack.startedAt) / 1000))}s</Badge>}
          </div>
          {attack ? (
            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
              <Stat label="Sent" value={fmt.int(attack.stats.sent)} />
              {attack.route === 'shield' && <><Stat label="Blocked" value={fmt.int(attack.stats.blocked)} tone="text-cyber-red" /><Stat label="Challenged" value={fmt.int(attack.stats.challenged)} tone="text-cyber-amber" /><Stat label="Limited" value={fmt.int(attack.stats.rateLimited)} tone="text-cyber-violet" /><Stat label="Allowed" value={fmt.int(attack.stats.allowed)} tone="text-cyber-lime" /></>}
              <Stat label="Served" value={fmt.int(attack.stats.served)} />
              {attack.route === 'direct' && <Stat label="Failed 503" value={fmt.int(attack.stats.shed)} tone="text-cyber-red" />}
            </div>
          ) : (
            <>
              <select value={kind} onChange={(e) => setKind(e.target.value as AttackKind)} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                {ATTACK_LIBRARY.map((a) => <option key={a.kind} value={a.kind}>{a.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label><span className="text-muted-foreground">Intensity</span><input type="range" min={10} max={100} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="mt-1 w-full" /><span className="font-mono">{intensity}</span></label>
                <label><span className="text-muted-foreground">Duration</span><input type="range" min={10} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 w-full" /><span className="font-mono">{duration}s</span></label>
              </div>
            </>
          )}
          <div className="flex gap-2">
            {attack ? (
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => stop(site.id)}><Pause className="h-3 w-3" />Stop attack</Button>
            ) : (
              <>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => go('direct')} title="Bypass the gateway — the site falls over"><ShieldOff className="h-3 w-3" />Attack DIRECT</Button>
                <Button variant="neon" size="sm" className="flex-1" onClick={() => go('shield')} title="Through SmartShield"><ShieldCheck className="h-3 w-3" />Attack via SHIELD</Button>
              </>
            )}
          </div>
          {error && <p className="text-[11px] text-cyber-red">{error}</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {attack
              ? attack.route === 'direct' ? 'Traffic is hitting the raw origin port — the gateway never sees it.' : enabled ? 'Traffic is scored by the AI engine — bots are blocked or challenged before reaching the origin.' : 'Shield is OFF — the gateway is forwarding everything.'
              : <><strong className="text-cyber-red">DIRECT</strong> bypasses the gateway. <strong className="text-cyber-lime">SHIELD</strong> goes through SmartShield — switch it off in the top bar to see why protection matters.</>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded border border-border/40 bg-muted/20 px-1.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('font-mono text-sm', tone)}>{value}</div>
    </div>
  );
}

function Sparkline({ history }: { history: SiteState['history'] }) {
  if (history.length < 2) return <div className="h-8 rounded bg-muted/30" />;
  const max = Math.max(...history.map((h) => h.ms), 300);
  return (
    <div className="flex h-8 items-end gap-px">
      {history.map((h, i) => (
        <div key={i} className={cn('flex-1 rounded-sm', h.status === 'down' ? 'bg-cyber-red' : h.status === 'degraded' ? 'bg-cyber-amber' : 'bg-primary/60')} style={{ height: `${Math.max(6, (h.ms / max) * 100)}%` }} title={`${h.ms} ms · ${h.status}`} />
      ))}
    </div>
  );
}
