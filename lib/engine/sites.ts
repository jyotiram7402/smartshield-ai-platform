import type { SiteId, SiteState } from './types';

export const SITE_DEFS: { id: SiteId; name: string; kind: string; description: string; capacityRps: number }[] = [
  { id: 'northbolt', name: 'NorthBolt Bank', kind: 'Banking', description: 'Retail internet-banking portal: accounts, transfers, cards and loans.', capacityRps: 25 },
  { id: 'tinyshop', name: 'TinyShop', kind: 'E-commerce', description: 'Online store with categories, product pages, cart and checkout.', capacityRps: 25 },
  { id: 'bloglite', name: 'BlogLite News', kind: 'News & media', description: 'Technology and business news magazine with comments and newsletter.', capacityRps: 25 },
  { id: 'bookingmini', name: 'BookingMini Hotels', kind: 'Travel booking', description: 'Hotel search, room selection and booking confirmation.', capacityRps: 25 },
];

/** The origin stays DOWN until this long after the last shed request. */
const OVERLOAD_HOLD_MS = 750;
/** The token bucket holds this many seconds of capacity as burst allowance. */
const BURST_FACTOR = 1.5;
/** Request rate is measured over a sliding window of this length. */
const WINDOW_MS = 1000;
/** Status/latency history point interval. */
const HISTORY_MS = 1000;

/**
 * Origin capacity model — the same behaviour as the real demo sites: a token
 * bucket of CAPACITY_RPS requests/second (with a burst allowance); excess
 * requests are shed with HTTP 503 and the site reports "overloaded" (DOWN).
 *
 * Status is re-evaluated on every tick, so the first shed request flips the
 * origin to DOWN immediately and it recovers OVERLOAD_HOLD_MS after the flood
 * ends; the displayed rps/load is a one-second sliding average.
 */
export class OriginModel {
  state: SiteState;
  private tokens: number;
  private overloadedUntil = 0;
  private window: { ts: number; n: number }[] = [];
  private lastHistory = 0;

  constructor(def: (typeof SITE_DEFS)[number]) {
    this.state = { ...def, path: `/sites/${def.id}`, status: 'up', rps: 0, load: 0, served: 0, shed: 0, latencyMs: 42, lastError: null, history: [] };
    this.tokens = def.capacityRps * BURST_FACTOR;
  }

  /** Apply the requests that reached this origin during one tick. Returns served/shed counts. */
  tick(reaching: number, now: number, tickMs: number) {
    const cap = this.state.capacityRps;
    this.tokens = Math.min(cap * BURST_FACTOR, this.tokens + (cap * tickMs) / 1000);
    const served = Math.min(reaching, Math.floor(this.tokens));
    const shed = reaching - served;
    this.tokens -= served;
    if (shed > 0) this.overloadedUntil = now + OVERLOAD_HOLD_MS;
    this.state.served += served;
    this.state.shed += shed;

    // request rate: sliding one-second window, refreshed every tick
    this.window.push({ ts: now, n: reaching });
    while (this.window.length > 1 && now - this.window[0].ts >= WINDOW_MS) this.window.shift();
    const span = Math.max(tickMs, now - this.window[0].ts + tickMs);
    const rps = (this.window.reduce((s, w) => s + w.n, 0) * 1000) / span;

    // status: evaluated every tick → DOWN on the first shed request, UP shortly after the last
    const load = rps / cap;
    const overloaded = now < this.overloadedUntil;
    const status: SiteState['status'] = overloaded ? 'down' : load > 0.7 ? 'degraded' : 'up';
    const latency = overloaded ? 3000 : Math.round(42 + 42 * Math.min(load, 1) ** 2 * 18 + (load > 0.7 ? 300 : 0));
    this.state.rps = Number(rps.toFixed(1));
    this.state.load = Number(load.toFixed(2));
    this.state.status = status;
    this.state.latencyMs = latency;
    this.state.lastError = overloaded ? 'HTTP 503 — overloaded' : null;

    if (now - this.lastHistory >= HISTORY_MS) {
      this.lastHistory = now;
      this.state.history.push({ ts: now, status, ms: latency });
      if (this.state.history.length > 30) this.state.history.shift();
    }
    return { served, shed };
  }
}
