'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

interface Incident {
  id: number; site_id: string; site_name: string; kind: string; route: string; intensity: number; duration_sec: number; started_at: string;
  sent: number; allowed: number; challenged: number; blocked: number; rate_limited: number; served: number; shed: number; shield_enabled: boolean;
}

/** Attack drills persisted to Supabase through /api/incidents (read-only view). */
export function IncidentHistory() {
  const attackCount = useSim((s) => s.attacks.length);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const prev = useRef(attackCount);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/incidents', { cache: 'no-store' });
      const j = await r.json();
      setPersisted(!!j.persisted);
      setRows(Array.isArray(j.incidents) ? j.incidents : []);
    } catch {
      setPersisted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // a drill just ended → its incident was posted; refresh shortly after
  useEffect(() => {
    if (attackCount < prev.current) {
      const t = setTimeout(load, 1500);
      prev.current = attackCount;
      return () => clearTimeout(t);
    }
    prev.current = attackCount;
  }, [attackCount, load]);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" />Incident history</CardTitle>
          <CardDescription>Finished attack drills are recorded as incidents in Supabase (Postgres) via <span className="font-mono">/api/incidents</span></CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {persisted === null ? <Badge variant="secondary">checking…</Badge> : persisted ? <Badge variant="success">Supabase connected</Badge> : <Badge variant="warning">not configured</Badge>}
          <Button size="sm" variant="ghost" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {persisted === false && (
          <p className="text-xs text-muted-foreground">Set <span className="font-mono">SUPABASE_URL</span> and <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> (see the README) to keep a permanent incident log. Drills are still fully visible live above.</p>
        )}
        {persisted && !rows.length && <p className="text-xs text-muted-foreground">No incidents recorded yet — run an attack drill and stop it (or let it finish).</p>}
        {rows.length > 0 && (
          <Table>
            <THead><tr><TH>Started</TH><TH>Site</TH><TH>Attack</TH><TH>Route</TH><TH className="text-right">Intensity</TH><TH className="text-right">Sent</TH><TH>Outcome</TH><TH className="text-right">Mitigated</TH><TH>Shield</TH></tr></THead>
            <TBody>
              {rows.map((r) => {
                const mit = r.route === 'shield' ? (r.blocked + r.challenged + r.rate_limited) / Math.max(1, r.sent) : 0;
                return (
                  <TR key={r.id}>
                    <TD className="font-mono text-xs text-muted-foreground">{new Date(r.started_at).toLocaleString('en-IN', { hour12: false })}</TD>
                    <TD className="text-xs">{r.site_name}</TD>
                    <TD className="text-xs">{r.kind}</TD>
                    <TD><Badge variant={r.route === 'direct' ? 'destructive' : 'success'}>{r.route}</Badge></TD>
                    <TD className="text-right font-mono text-xs">{r.intensity}</TD>
                    <TD className="text-right font-mono text-xs">{fmt.int(r.sent)}</TD>
                    <TD className="font-mono text-[11px]">{r.route === 'shield' ? <><span className="text-cyber-red">{r.blocked} blk</span> · <span className="text-cyber-amber">{r.challenged} chl</span> · <span className="text-cyber-violet">{r.rate_limited} 429</span> · <span className="text-cyber-lime">{r.allowed} ok</span></> : <><span className="text-cyber-lime">{r.served} served</span> · <span className="text-cyber-red">{r.shed} failed 503</span></>}</TD>
                    <TD className={cn('text-right font-mono text-xs', r.route === 'direct' ? 'text-muted-foreground' : mit > 0.8 ? 'text-cyber-lime' : 'text-cyber-amber')}>{r.route === 'direct' ? '— (bypassed)' : fmt.pct(mit, 0)}</TD>
                    <TD className="text-xs">{r.shield_enabled ? 'ON' : 'OFF'}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
