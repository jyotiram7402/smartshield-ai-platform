'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSim } from '@/lib/store';
import { fmt } from '@/lib/utils';

const TOOLTIP = { background: '#0b1220', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 };

export function TrafficChart({ height = 240 }: { height?: number }) {
  const series = useSim((s) => s.timeseries);
  const data = series.map((p) => ({ t: fmt.time(p.ts), Allowed: p.allow, Challenged: p.challenge, Blocked: p.block, 'Rate-limited': p.rateLimited }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {[['a', '#a3e635'], ['c', '#f59e0b'], ['b', '#ef4444'], ['r', '#8b5cf6']].map(([id, col]) => (
              <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity={0.5} /><stop offset="100%" stopColor={col} stopOpacity={0.05} /></linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval={Math.max(0, Math.floor(data.length / 6) - 1)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP} labelStyle={{ color: '#94a3b8' }} />
          <Area type="monotone" dataKey="Allowed" stackId="1" stroke="#a3e635" fill="url(#g-a)" isAnimationActive={false} />
          <Area type="monotone" dataKey="Challenged" stackId="1" stroke="#f59e0b" fill="url(#g-c)" isAnimationActive={false} />
          <Area type="monotone" dataKey="Blocked" stackId="1" stroke="#ef4444" fill="url(#g-b)" isAnimationActive={false} />
          <Area type="monotone" dataKey="Rate-limited" stackId="1" stroke="#8b5cf6" fill="url(#g-r)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
