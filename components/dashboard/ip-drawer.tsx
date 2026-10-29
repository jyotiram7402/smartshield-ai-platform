'use client';

import { Badge } from '@/components/ui/badge';
import { Sheet } from '@/components/ui/sheet';
import type { IpProfile } from '@/lib/engine/types';
import { cn, fmt } from '@/lib/utils';
import { ModelBreakdown } from './model-breakdown';
import { ActionBadge } from './live-log';

export function reputationBadge(r: IpProfile['reputation']) {
  return r === 'malicious' ? <Badge variant="destructive">malicious</Badge> : r === 'watch' ? <Badge variant="warning">watch</Badge> : <Badge variant="success">clean</Badge>;
}

export function IpDrawer({ profile, onClose }: { profile: IpProfile | null; onClose: () => void }) {
  return (
    <Sheet open={!!profile} onClose={onClose} title={profile ? <span className="font-mono">{profile.country.flag} {profile.ip}</span> : ''} description={profile ? `${profile.country.name} · first seen ${fmt.time(profile.firstSeen)} · last seen ${fmt.time(profile.lastSeen)}` : ''}>
      {profile && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {reputationBadge(profile.reputation)}
            <Badge variant={profile.uaClass === 'human' ? 'success' : profile.uaClass === 'unknown' ? 'secondary' : 'destructive'}>{profile.uaClass}</Badge>
            {Object.entries(profile.kinds).map(([k, n]) => <Badge key={k} variant="outline">{k} ×{n}</Badge>)}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
            {[['Requests', profile.requests, ''], ['Allowed', profile.allowed, 'text-cyber-lime'], ['Challenged', profile.challenged, 'text-cyber-amber'], ['Blocked', profile.blocked, 'text-cyber-red'], ['Limited', profile.rateLimited, 'text-cyber-violet'], ['Max risk', profile.maxScore.toFixed(2), profile.maxScore >= 0.85 ? 'text-cyber-red' : '']].map(([l, v, t]) => (
              <div key={String(l)} className="rounded border border-border/50 bg-muted/20 px-2 py-1.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div><div className={cn('font-mono text-sm', String(t))}>{String(v)}</div></div>
            ))}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">User-Agent</div>
            <div className="mt-0.5 break-all font-mono">{profile.ua || '(empty)'}</div>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">Last request</div>
            <div className="mt-0.5 font-mono">{profile.lastPath} · {profile.lastSite}</div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent requests</div>
            <ul className="divide-y divide-border/50 rounded-lg border border-border/60 font-mono text-[11px]">
              {profile.recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 px-2 py-1.5"><span className="truncate text-muted-foreground">{fmt.time(e.ts)} {e.method} {e.path}</span><span className="flex items-center gap-2"><span>{e.decision.score.toFixed(2)}</span><ActionBadge e={e} /></span></li>
              ))}
            </ul>
          </div>
          {profile.recent[0] && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest decision explained</div>
              <ModelBreakdown event={profile.recent[0]} />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
