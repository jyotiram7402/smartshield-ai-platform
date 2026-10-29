'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Brain, Gauge, ShieldBan, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet } from '@/components/ui/sheet';
import { StatCard } from '@/components/dashboard/stat-card';
import { TrafficChart } from '@/components/charts/traffic-chart';
import { ScoreChart } from '@/components/charts/score-chart';
import { ClassificationPie } from '@/components/charts/classification-pie';
import { CountryList } from '@/components/dashboard/country-list';
import { LiveLog } from '@/components/dashboard/live-log';
import { AlertFeed } from '@/components/dashboard/alert-feed';
import { ModelBreakdown } from '@/components/dashboard/model-breakdown';
import { useSim } from '@/lib/store';
import type { TrafficEvent } from '@/lib/engine/types';
import { cn, fmt } from '@/lib/utils';

export default function OverviewPage() {
  const m = useSim((s) => s.metrics);
  const sites = useSim((s) => s.sites);
  const [selected, setSelected] = useState<TrafficEvent | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Activity} label="Requests / min" value={fmt.int(m.total)} sub={`${fmt.int(m.rps)} req/s`} />
        <StatCard icon={ShieldBan} label="Blocked" value={fmt.int(m.blocked)} sub="last 60 s · HTTP 403" tone="text-cyber-red" />
        <StatCard icon={ShieldQuestion} label="Challenged" value={fmt.int(m.challenged)} sub="JS proof-of-work · 202" tone="text-cyber-amber" />
        <StatCard icon={Gauge} label="Rate-limited" value={fmt.int(m.rateLimited)} sub="per-IP bucket · 429" tone="text-cyber-violet" />
        <StatCard icon={ShieldCheck} label="Mitigation rate" value={fmt.pct(m.mitigationRate)} sub="stopped before the origin" tone="text-cyber-lime" />
        <StatCard icon={Brain} label="Avg AI risk" value={m.avgScore.toFixed(2)} sub={`${fmt.pct(m.botRate, 0)} bot pressure`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {sites.map((s) => (
          <Link key={s.id} href="/dashboard/sites" className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs', s.status === 'up' ? 'border-cyber-lime/40 text-cyber-lime' : s.status === 'degraded' ? 'border-cyber-amber/40 text-cyber-amber' : 'border-cyber-red/50 text-cyber-red')}>
            <span className={cn('h-2 w-2 rounded-full', s.status === 'up' ? 'bg-cyber-lime' : s.status === 'degraded' ? 'bg-cyber-amber' : 'bg-cyber-red animate-pulse')} />
            {s.name} · {s.status.toUpperCase()} · {s.latencyMs} ms
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Traffic decisions</CardTitle><CardDescription>Requests per second by outcome — allowed, challenged, blocked, rate-limited</CardDescription></CardHeader>
          <CardContent><TrafficChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Classification</CardTitle><CardDescription>Human · suspicious · bot (last 60 s)</CardDescription></CardHeader>
          <CardContent><ClassificationPie /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Average AI risk score</CardTitle><CardDescription>Fused ensemble score per second against the challenge and block thresholds</CardDescription></CardHeader>
          <CardContent><ScoreChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Traffic by country</CardTitle><CardDescription>GeoIP of scored requests (last 60 s)</CardDescription></CardHeader>
          <CardContent><CountryList /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Live request stream</CardTitle><CardDescription>Click any request to see its feature vector and the four model scores</CardDescription></CardHeader>
          <CardContent><LiveLog limit={16} onSelect={setSelected} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Alerts</CardTitle><CardDescription>Attacks, origin health and policy changes</CardDescription></CardHeader>
          <CardContent><AlertFeed /></CardContent>
        </Card>
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Decision trace" description="How the gateway reached this verdict">
        {selected && <ModelBreakdown event={selected} />}
      </Sheet>
    </>
  );
}
