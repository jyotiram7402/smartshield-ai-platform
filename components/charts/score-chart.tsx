'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSim } from '@/lib/store';
import { fmt } from '@/lib/utils';

export function ScoreChart({ height = 220 }: { height?: number }) {
  const series = useSim((s) => s.timeseries);
  const cfg = useSim((s) => s.config);
  const data = series.map((p) => ({ t: fmt.time(p.ts), score: p.avgScore, rps: p.rps }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval={Math.max(0, Math.floor(data.length / 6) - 1)} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
          <ReferenceLine y={cfg.blockThreshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `block ${cfg.blockThreshold}`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          <ReferenceLine y={cfg.challengeThreshold} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `challenge ${cfg.challengeThreshold}`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
          <Line type="monotone" dataKey="score" name="Avg AI risk" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
