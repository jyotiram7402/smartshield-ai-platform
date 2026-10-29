'use client';

import { useMemo, useState } from 'react';
import { Globe2, Search, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatCard } from '@/components/dashboard/stat-card';
import { IpDrawer, reputationBadge } from '@/components/dashboard/ip-drawer';
import { CountryList } from '@/components/dashboard/country-list';
import { useSim } from '@/lib/store';
import type { IpProfile } from '@/lib/engine/types';
import { cn, fmt } from '@/lib/utils';

type Rep = 'all' | 'clean' | 'watch' | 'malicious';

export default function TrafficPage() {
  const ips = useSim((s) => s.ips);
  const [q, setQ] = useState('');
  const [rep, setRep] = useState<Rep>('all');
  const [sort, setSort] = useState<'requests' | 'lastSeen' | 'maxScore'>('requests');
  const [selected, setSelected] = useState<IpProfile | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ips
      .filter((p) => (rep === 'all' || p.reputation === rep) && (!term || p.ip.includes(term) || p.country.name.toLowerCase().includes(term) || p.ua.toLowerCase().includes(term)))
      .sort((a, b) => (sort === 'requests' ? b.requests - a.requests : sort === 'maxScore' ? b.maxScore - a.maxScore : b.lastSeen - a.lastSeen))
      .slice(0, 120);
  }, [ips, q, rep, sort]);

  const malicious = ips.filter((p) => p.reputation === 'malicious').length;
  const watch = ips.filter((p) => p.reputation === 'watch').length;
  const countries = new Set(ips.map((p) => p.country.code)).size;
  const live = selected ? ips.find((p) => p.ip === selected.ip) || selected : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} label="Unique IPs" value={fmt.int(ips.length)} sub="seen by the gateway" />
        <StatCard icon={ShieldAlert} label="Malicious" value={fmt.int(malicious)} sub="blocked ≥3× or risk ≥ 0.85" tone="text-cyber-red" />
        <StatCard icon={ShieldCheck} label="Watch-listed" value={fmt.int(watch)} sub="challenged or elevated risk" tone="text-cyber-amber" />
        <StatCard icon={Globe2} label="Countries" value={fmt.int(countries)} sub="GeoIP resolution" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>IP intelligence</CardTitle><CardDescription>Every address scored by the gateway — click a row for its full history and decision trace</CardDescription></div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="relative"><Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IP, country, user-agent" className="h-8 w-56 rounded-md border border-border bg-background pl-7 pr-2 text-xs" /></label>
              <select value={rep} onChange={(e) => setRep(e.target.value as Rep)} className="h-8 rounded-md border border-border bg-background px-2 text-xs"><option value="all">All reputations</option><option value="malicious">Malicious</option><option value="watch">Watch</option><option value="clean">Clean</option></select>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-8 rounded-md border border-border bg-background px-2 text-xs"><option value="requests">Most requests</option><option value="maxScore">Highest risk</option><option value="lastSeen">Most recent</option></select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead><tr><TH>Address</TH><TH>Country</TH><TH>UA class</TH><TH className="text-right">Requests</TH><TH>Outcomes</TH><TH className="text-right">Avg risk</TH><TH className="text-right">Max</TH><TH>Reputation</TH><TH>Last seen</TH></tr></THead>
              <TBody>
                {rows.map((p) => {
                  const tot = Math.max(1, p.requests);
                  return (
                    <TR key={p.ip} onClick={() => setSelected(p)} className="cursor-pointer">
                      <TD className="font-mono text-xs">{p.ip}</TD>
                      <TD className="text-xs"><span className="mr-1">{p.country.flag}</span>{p.country.name}</TD>
                      <TD><Badge variant={p.uaClass === 'human' ? 'success' : p.uaClass === 'unknown' ? 'secondary' : 'destructive'}>{p.uaClass}</Badge></TD>
                      <TD className="text-right font-mono text-xs">{fmt.int(p.requests)}</TD>
                      <TD>
                        <div className="flex h-2 w-28 overflow-hidden rounded-full bg-muted" title={`${p.allowed} allowed · ${p.challenged} challenged · ${p.blocked} blocked · ${p.rateLimited} rate-limited`}>
                          <div className="bg-cyber-lime" style={{ width: `${(100 * p.allowed) / tot}%` }} /><div className="bg-cyber-amber" style={{ width: `${(100 * p.challenged) / tot}%` }} /><div className="bg-cyber-red" style={{ width: `${(100 * p.blocked) / tot}%` }} /><div className="bg-cyber-violet" style={{ width: `${(100 * p.rateLimited) / tot}%` }} />
                        </div>
                      </TD>
                      <TD className={cn('text-right font-mono text-xs', p.avgScore >= 0.85 ? 'text-cyber-red' : p.avgScore >= 0.55 ? 'text-cyber-amber' : 'text-cyber-lime')}>{p.avgScore.toFixed(2)}</TD>
                      <TD className="text-right font-mono text-xs">{p.maxScore.toFixed(2)}</TD>
                      <TD>{reputationBadge(p.reputation)}</TD>
                      <TD className="font-mono text-xs text-muted-foreground">{fmt.time(p.lastSeen)}</TD>
                    </TR>
                  );
                })}
                {!rows.length && <TR><TD colSpan={9} className="py-6 text-center text-xs text-muted-foreground">No addresses match.</TD></TR>}
              </TBody>
            </Table>
            <p className="mt-2 text-[11px] text-muted-foreground">Showing {rows.length} of {ips.length} addresses · outcomes bar: <span className="text-cyber-lime">allowed</span> / <span className="text-cyber-amber">challenged</span> / <span className="text-cyber-red">blocked</span> / <span className="text-cyber-violet">rate-limited</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top countries</CardTitle><CardDescription>Scored requests, last 60 s</CardDescription></CardHeader>
          <CardContent><CountryList limit={10} /></CardContent>
        </Card>
      </div>

      <IpDrawer profile={live} onClose={() => setSelected(null)} />
    </>
  );
}
