'use client';

import { useState } from 'react';
import { Crosshair, Play, ShieldCheck, ShieldOff, Square, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrafficChart } from '@/components/charts/traffic-chart';
import { AlertFeed } from '@/components/dashboard/alert-feed';
import { IncidentHistory } from '@/components/dashboard/incident-history';
import { ATTACK_LIBRARY } from '@/lib/engine/traffic';
import type { AttackKind, Route, SiteId } from '@/lib/engine/types';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

export default function SimulatorPage() {
  const sites = useSim((s) => s.sites);
  const attacks = useSim((s) => s.attacks);
  const enabled = useSim((s) => s.config.enabled);
  const launch = useSim((s) => s.launchAttack);
  const stop = useSim((s) => s.stopAttack);
  const setConfig = useSim((s) => s.setConfig);

  const [siteId, setSiteId] = useState<SiteId>('northbolt');
  const [kind, setKind] = useState<AttackKind>('flood');
  const [route, setRoute] = useState<Route>('shield');
  const [intensity, setIntensity] = useState(60);
  const [duration, setDuration] = useState(45);
  const [error, setError] = useState<string | null>(null);

  const active = attacks.find((a) => a.siteId === siteId);
  const lib = ATTACK_LIBRARY.find((a) => a.kind === kind)!;

  function go(o?: { siteId?: SiteId; kind?: AttackKind; route?: Route; intensity?: number; durationSec?: number; shield?: boolean }) {
    if (o?.shield !== undefined) setConfig({ enabled: o.shield });
    const r = launch({ siteId: o?.siteId ?? siteId, kind: o?.kind ?? kind, route: o?.route ?? route, intensity: o?.intensity ?? intensity, durationSec: o?.durationSec ?? duration });
    setError(r.ok ? null : r.error || 'Could not start the attack.');
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Launch an attack</CardTitle><CardDescription>The simulator runs from the gateway host and targets the chosen route</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Target site</p>
              <div className="flex flex-wrap gap-2">
                {sites.map((s) => (
                  <button key={s.id} type="button" onClick={() => setSiteId(s.id)} className={cn('inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors', siteId === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/40')}>
                    <span className={cn('h-2 w-2 rounded-full', s.status === 'up' ? 'bg-cyber-lime' : s.status === 'degraded' ? 'bg-cyber-amber' : 'bg-cyber-red')} />{s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attack type</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {ATTACK_LIBRARY.map((a) => (
                  <button key={a.kind} type="button" onClick={() => { setKind(a.kind); setIntensity(a.defaultIntensity); }} className={cn('rounded-lg border p-3 text-left transition-colors', kind === a.kind ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-muted/40')}>
                    <div className="text-xs font-semibold">{a.name}</div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{a.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Route</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRoute('direct')} className={cn('flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs', route === 'direct' ? 'border-cyber-red bg-cyber-red/10 text-cyber-red' : 'border-border/60 text-muted-foreground')}><ShieldOff className="h-3.5 w-3.5" />DIRECT — bypass the gateway</button>
                <button type="button" onClick={() => setRoute('shield')} className={cn('flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs', route === 'shield' ? 'border-cyber-lime bg-cyber-lime/10 text-cyber-lime' : 'border-border/60 text-muted-foreground')}><ShieldCheck className="h-3.5 w-3.5" />SHIELD — through SmartShield ({enabled ? 'ON' : 'OFF'})</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <label className="block"><span className="text-muted-foreground">Intensity</span><div className="mt-1 flex items-center gap-2"><input type="range" min={10} max={100} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="flex-1" /><span className="w-10 text-right font-mono">{intensity}</span></div></label>
              <label className="block"><span className="text-muted-foreground">Duration (s)</span><div className="mt-1 flex items-center gap-2"><input type="range" min={10} max={300} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="flex-1" /><span className="w-10 text-right font-mono">{duration}</span></div></label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {active ? (
                <Button variant="destructive" onClick={() => stop(siteId)}><Square className="h-4 w-4" />Stop attack on {sites.find((s) => s.id === siteId)?.name}</Button>
              ) : (
                <Button variant="neon" onClick={() => go()}><Play className="h-4 w-4" />Start {lib.name.toLowerCase()}</Button>
              )}
              {error && <span className="text-xs text-cyber-red">{error}</span>}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">One-click demo scenarios</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => go({ siteId: 'northbolt', kind: 'flood', route: 'direct', intensity: 60, durationSec: 30 })}><ShieldOff className="h-3.5 w-3.5 text-cyber-red" />Flood NorthBolt DIRECT (goes down)</Button>
                <Button size="sm" variant="outline" onClick={() => go({ siteId: 'northbolt', kind: 'flood', route: 'shield', intensity: 60, durationSec: 30, shield: true })}><ShieldCheck className="h-3.5 w-3.5 text-cyber-lime" />Same flood via SHIELD (stays up)</Button>
                <Button size="sm" variant="outline" onClick={() => go({ siteId: 'tinyshop', kind: 'credstuff', route: 'shield', intensity: 50, durationSec: 30, shield: true })}><Crosshair className="h-3.5 w-3.5 text-cyber-amber" />Credential stuffing via SHIELD</Button>
                <Button size="sm" variant="outline" onClick={() => go({ siteId: 'bloglite', kind: 'mixed', route: 'shield', intensity: 55, durationSec: 45, shield: true })}><Zap className="h-3.5 w-3.5 text-cyber-violet" />Mixed traffic (false-positive check)</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active attacks</CardTitle><CardDescription>Live outcome of every running drill</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {!attacks.length && <p className="text-xs text-muted-foreground">No attack running. Launch one to see the shield respond.</p>}
            {attacks.map((a) => {
              const site = sites.find((s) => s.id === a.siteId);
              const elapsed = Math.min(a.durationSec, (Date.now() - a.startedAt) / 1000);
              const st = a.stats;
              const mit = st.sent ? (st.blocked + st.challenged + st.rateLimited) / st.sent : 0;
              return (
                <div key={a.id} className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{site?.name}</span>
                    <Badge variant={a.route === 'direct' ? 'destructive' : 'success'}>{a.kind} · {a.route}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2"><Progress value={(100 * elapsed) / a.durationSec} /><span className="w-12 text-right font-mono text-muted-foreground">{Math.round(elapsed)}/{a.durationSec}s</span></div>
                  {a.route === 'shield' ? (
                    <>
                      <div className="mt-3 text-center"><div className={cn('font-mono text-3xl font-bold', mit > 0.8 ? 'text-cyber-lime' : mit > 0.4 ? 'text-cyber-amber' : 'text-cyber-red')}>{fmt.pct(mit, 0)}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">mitigated before the origin</div></div>
                      <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                        {[['Sent', st.sent, ''], ['Blocked', st.blocked, 'text-cyber-red'], ['Chall.', st.challenged, 'text-cyber-amber'], ['429', st.rateLimited, 'text-cyber-violet'], ['Allowed', st.allowed, 'text-cyber-lime']].map(([l, v, t]) => (
                          <div key={String(l)}><div className="text-[10px] text-muted-foreground">{l}</div><div className={cn('font-mono', String(t))}>{fmt.int(Number(v))}</div></div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                      {[['Sent', st.sent, ''], ['Served', st.served, 'text-cyber-lime'], ['Failed 503', st.shed, 'text-cyber-red']].map(([l, v, t]) => (
                        <div key={String(l)}><div className="text-[10px] text-muted-foreground">{l}</div><div className={cn('font-mono', String(t))}>{fmt.int(Number(v))}</div></div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between"><span className={cn('font-semibold', site?.status === 'down' ? 'text-cyber-red' : site?.status === 'degraded' ? 'text-cyber-amber' : 'text-cyber-lime')}>origin {site?.status.toUpperCase()}</span><Button size="sm" variant="ghost" onClick={() => stop(a.siteId)}><Square className="h-3 w-3" />Stop</Button></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Gateway decisions</CardTitle><CardDescription>Watch the chart fill with blocks and challenges when an attack runs through the shield</CardDescription></CardHeader><CardContent><TrafficChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Alerts</CardTitle></CardHeader><CardContent><AlertFeed limit={6} /></CardContent></Card>
      </div>

      <IncidentHistory />
    </>
  );
}
