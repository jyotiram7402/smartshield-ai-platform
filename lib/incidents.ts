import type { Attack } from '@/lib/engine/types';

const seen = new Map<string, Attack>();

/**
 * Watches the attack list between snapshots; when a drill disappears (ended or
 * stopped) its final stats are posted to /api/incidents. Fire-and-forget: the
 * route is a no-op unless Supabase is configured, and failures are ignored.
 */
export function trackIncidents(attacks: Attack[], siteName: (id: string) => string, shieldEnabled: boolean) {
  const live = new Set(attacks.map((a) => a.id));
  for (const [id, a] of seen) {
    if (live.has(id)) continue;
    seen.delete(id);
    if (typeof window === 'undefined') continue;
    fetch('/api/incidents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteId: a.siteId, siteName: siteName(a.siteId), kind: a.kind, route: a.route, intensity: a.intensity, durationSec: a.durationSec, startedAt: a.startedAt, stats: a.stats, shieldEnabled }),
      keepalive: true,
    }).catch(() => { /* ignore */ });
  }
  for (const a of attacks) seen.set(a.id, a);
}
