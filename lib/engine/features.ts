import type { Features, RawRequest, UaClass } from './types';

const KNOWN_BOT = /(bot|spider|crawl|wget|curl|python-requests|axios|scrapy|httpclient|headless|semrush|ahrefs|go-http-client|okhttp|java\/|nmap|masscan)/i;
const SUSPECT_BOT = /(libwww|requests|perl|php\/|ruby)/i;

/** User-agent classification — the same rules the gateway applies. */
export function classifyUa(ua: string): UaClass {
  if (!ua) return 'unknown';
  if (KNOWN_BOT.test(ua)) return 'bot-known';
  if (SUSPECT_BOT.test(ua)) return 'bot-suspect';
  if (/Mozilla\/|Chrome\/|Safari\/|Firefox\//i.test(ua)) return 'human';
  return 'bot-suspect';
}

export interface SessionInfo {
  rate: number; // requests in the last 60 s
  sessionAgeMs: number;
  timestamps: number[]; // last 60 s
  paths: string[]; // aligned with timestamps
}

/** Per-IP session tracking — mirrors the gateway's feature extractor. */
export class SessionTracker {
  private sessions = new Map<string, { firstSeen: number; ts: number[]; paths: string[] }>();
  private lastPrune = 0;

  track(ip: string, now: number, path: string): SessionInfo {
    let s = this.sessions.get(ip);
    if (!s || now - (s.ts[s.ts.length - 1] ?? s.firstSeen) > 5 * 60_000) {
      s = { firstSeen: now, ts: [], paths: [] };
      this.sessions.set(ip, s);
    }
    s.ts.push(now);
    s.paths.push(path);
    while (s.ts.length && now - s.ts[0] > 60_000) {
      s.ts.shift();
      s.paths.shift();
    }
    if (now - this.lastPrune > 30_000) this.prune(now);
    return { rate: s.ts.length, sessionAgeMs: now - s.firstSeen, timestamps: s.ts, paths: s.paths };
  }

  /** Requests from this IP in the last 60 s (rate-limiter view, no side effects). */
  countLastMinute(ip: string, now: number) {
    const s = this.sessions.get(ip);
    if (!s) return 0;
    let n = 0;
    for (let i = s.ts.length - 1; i >= 0 && now - s.ts[i] <= 60_000; i--) n++;
    return n;
  }

  private prune(now: number) {
    this.lastPrune = now;
    for (const [ip, s] of this.sessions) {
      if (now - (s.ts[s.ts.length - 1] ?? s.firstSeen) > 5 * 60_000) this.sessions.delete(ip);
    }
  }

  get size() {
    return this.sessions.size;
  }
}

/** Header anomaly score 0..1 — same weights as the production pipeline. */
export function headerAnomaly(req: RawRequest): number {
  let s = 0;
  if (!req.ua) s += 0.4;
  if (!req.headers.accept) s += 0.2;
  if (!req.headers.acceptLanguage) s += 0.15;
  if (!req.headers.acceptEncoding) s += 0.1;
  if (!req.headers.referer && req.method !== 'GET') s += 0.05;
  if (/Mozilla/i.test(req.ua) && !req.headers.acceptLanguage) s += 0.1;
  return Math.min(1, Number(s.toFixed(3)));
}

export function extractFeatures(req: RawRequest, session: SessionInfo): Features {
  return {
    request_rate_per_min: session.rate,
    session_age_ms: session.sessionAgeMs,
    header_anomaly_score: headerAnomaly(req),
    ua_class: req.uaClass,
    has_cookie: req.headers.cookie,
    accept_lang_count: req.headers.acceptLanguage,
    referrer_present: req.headers.referer,
    method_class: req.method === 'GET' ? 'safe' : 'mutating',
    challenge_solved: req.challengeSolved,
    content_length: req.contentLength,
  };
}

export const FEATURE_LABELS: Record<keyof Features, string> = {
  request_rate_per_min: 'Request rate / min',
  session_age_ms: 'Session age',
  header_anomaly_score: 'Header anomaly',
  ua_class: 'User-agent class',
  has_cookie: 'Has cookie',
  accept_lang_count: 'Accept-Language count',
  referrer_present: 'Referrer present',
  method_class: 'Method class',
  challenge_solved: 'Challenge solved',
  content_length: 'Content length',
};
