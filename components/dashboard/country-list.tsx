'use client';

import { useSim } from '@/lib/store';
import { COUNTRIES, UNKNOWN_COUNTRY } from '@/lib/engine/geo';

const byCode = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function CountryList({ limit = 8 }: { limit?: number }) {
  const byCountry = useSim((s) => s.metrics.byCountry);
  const rows = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = rows[0]?.[1] || 1;
  if (!rows.length) return <p className="text-xs text-muted-foreground">Waiting for traffic…</p>;
  return (
    <ul className="space-y-2">
      {rows.map(([code, n]) => {
        const c = byCode[code] || UNKNOWN_COUNTRY;
        return (
          <li key={code} className="text-xs">
            <div className="mb-1 flex items-center justify-between"><span><span className="mr-1.5">{c.flag}</span>{c.name}</span><span className="font-mono text-muted-foreground">{n}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-cyber-teal to-cyber-lime" style={{ width: `${(100 * n) / max}%` }} /></div>
          </li>
        );
      })}
    </ul>
  );
}
