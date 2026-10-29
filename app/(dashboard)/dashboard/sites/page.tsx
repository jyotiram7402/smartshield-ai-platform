'use client';

import { ShieldCheck, ShieldOff, ToggleLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteCard } from '@/components/dashboard/site-card';
import { useSim } from '@/lib/store';

export default function SitesPage() {
  const sites = useSim((s) => s.sites);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {sites.map((s) => <SiteCard key={s.id} site={s} />)}
      </div>

      <Card>
        <CardHeader><CardTitle>How to run the demo</CardTitle><CardDescription>Three steps that show why the shield matters — each origin is a separate process with a capacity of 25 req/s</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            [ShieldOff, '1 · Attack DIRECT', 'Traffic bypasses the gateway and hits the raw origin port. The first request the origin cannot serve flips it to DOWN: the card turns red and real visitors get "Service unavailable" (open the Direct link in another tab to watch it). Stop the attack and it is back within about a second.', 'text-cyber-red'],
            [ToggleLeft, '2 · Shield OFF, attack via SHIELD', 'Switch the shield off in the top bar and send the same attack through the gateway. A plain reverse proxy forwards everything — the site still goes down.', 'text-cyber-amber'],
            [ShieldCheck, '3 · Shield ON, attack via SHIELD', 'Switch the shield back on. The AI engine scores every request; bots are blocked, challenged or rate-limited before the origin — the card stays green and the traffic chart fills with red and amber.', 'text-cyber-lime'],
          ].map(([Icon, t, d, tone]) => {
            const I = Icon as unknown as typeof ShieldCheck;
            return (
              <div key={String(t)} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${tone}`}><I className="h-4 w-4" />{String(t)}</div>
                <p className="text-xs text-muted-foreground">{String(d)}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
