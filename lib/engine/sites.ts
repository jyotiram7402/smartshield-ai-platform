import type { SiteId, SiteState } from './types';

export const SITE_DEFS: { id: SiteId; name: string; kind: string; description: string; capacityRps: number }[] = [
  { id: 'northbolt', name: 'NorthBolt Bank', kind: 'Banking', description: 'Retail internet-banking portal: accounts, transfers, cards and loans.', capacityRps: 25 },
  { id: 'tinyshop', name: 'TinyShop', kind: 'E-commerce', description: 'Online store with categories, product pages, cart and checkout.', capacityRps: 25 },
  { id: 'bloglite', name: 'BlogLite News', kind: 'News & media', description: 'Technology and business news magazine with comments and newsletter.', capacityRps: 25 },
  { id: 'bookingmini', name: 'BookingMini Hotels', kind: 'Travel booking', description: 'Hotel search, room selection and booking confirmation.', capacityRps: 25 },
];

const OVERLOAD_HOLD_MS = 1500;

/**
 * Origin capacity model — the same behaviour as the real demo sites: a token
 * bucket of CAPACITY_RPS requests/second (with a burst allowance); excess
 * requests are shed with HTTP 503 and the site reports "overloaded" (DOWN)
 * until OVERLOAD_HOLD_MS after the last shed request.
 */
export class OriginModel {
  state: SiteState;
  private tokens: number;
  private overloadedUntil = 0;
  private rpsEma = 0;
  private lastSample = 0;
  private secBucket = 0;

  constructor(def: (typeof SITE_DEFS)[number]) {
    this.state = { ...def, path: `/sites/${def.id}`, status: 'up', rps: 0, load: 0, served: 0, shed: 0, latencyMs: 42, lastError: null, history: [] };
    this.tokens = def.capacityRps * 2;
  }

  /** Apply the requests that reached this origin during one tick. Returns served/shed counts. */
  tick(reaching: number, now: number, tickMs: number) {
    const cap = this.state.capacityRps;
    this.tokens = Math.min(cap * 2, this.tokens + (cap * tickMs) / 1000);
    const served = Math.min(reaching, Math.floor(this.tokens));
    const shed = reaching - served;
    this.tokens -= served;
    if (shed > 0) this.overloadedUntil = now + OVERLOAD_HOLD_MS;
    this.state.served += served;
    this.state.shed += shed;
    this.secBucket += reaching;

    // once a second: sample rps, status, latency, history
    if (now - this.lastSample >= 1000) {
      const inst = (this.secBucket * 1000) / Math.max(1, now - this.lastSample || 1000);
      this.rpsEma = this.rpsEma * 0.5 + inst * 0.5;
      this.secBucket = 0;
      this.lastSample = now;
      const load = this.rpsEma / cap;
      const overloaded = now < this.overloadedUntil;
      const status: SiteState['status'] = overloaded ? 'down' : load > 0.7 ? 'degraded' : 'up';
      const latency = overloaded ? 3000 : Math.round(42 + 42 * Math.min(load, 1) ** 2 * 18 + (load > 0.7 ? 300 : 0));
      this.state.rps = Number(this.rpsEma.toFixed(1));
      this.state.load = Number(load.toFixed(2));
      this.state.status = status;
      this.state.latencyMs = latency;
      this.state.lastError = overloaded ? 'HTTP 503 — overloaded' : null;
      this.state.history.push({ ts: now, status, ms: latency });
      if (this.state.history.length > 30) this.state.history.shift();
    }
    return { served, shed };
  }
}
