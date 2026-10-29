'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useSim } from '@/lib/store';

const COLORS = { human: '#a3e635', suspicious: '#f59e0b', bot: '#ef4444' };

export function ClassificationPie({ height = 200 }: { height?: number }) {
  const m = useSim((s) => s.metrics);
  const data = [
    { name: 'Human', value: m.human, key: 'human' },
    { name: 'Suspicious', value: m.suspicious, key: 'suspicious' },
    { name: 'Bot', value: m.bot, key: 'bot' },
  ];
  const total = m.human + m.suspicious + m.bot;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none" isAnimationActive={false}>
            {data.map((d) => <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">last 60 s</span>
      </div>
      <div className="mt-1 flex justify-center gap-4 text-xs">
        {data.map((d) => (
          <span key={d.key} className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.key as keyof typeof COLORS] }} />{d.name} <span className="font-mono text-foreground">{total ? Math.round((100 * d.value) / total) : 0}%</span></span>
        ))}
      </div>
    </div>
  );
}
