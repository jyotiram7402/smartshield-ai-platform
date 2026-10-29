import { rng } from '@/lib/utils';
import { makeIpPool } from './geo';
import type { ActorKind, Attack, RawRequest, SiteId, UaClass } from './types';

const HUMAN_UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
];
const BOT_UAS: Record<Exclude<ActorKind, 'human'>, { ua: string; cls: UaClass }[]> = {
  flood: [{ ua: 'python-requests/2.32.3', cls: 'bot-known' }, { ua: 'Go-http-client/1.1', cls: 'bot-known' }, { ua: 'curl/8.9.1', cls: 'bot-known' }, { ua: 'Wget/1.21.4', cls: 'bot-known' }, { ua: '', cls: 'unknown' }],
  scraper: [{ ua: 'Scrapy/2.11.2 (+https://scrapy.org)', cls: 'bot-known' }, { ua: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)', cls: 'bot-known' }, { ua: 'python-requests/2.32.3', cls: 'bot-known' }, { ua: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/129.0.0.0', cls: 'bot-known' }],
  credstuff: [{ ua: 'okhttp/4.12.0', cls: 'bot-known' }, { ua: 'Java/17.0.9', cls: 'bot-known' }, { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', cls: 'human' }, { ua: 'python-requests/2.31.0', cls: 'bot-known' }],
  scanner: [{ ua: 'Mozilla/5.0 (compatible; Nmap Scripting Engine)', cls: 'bot-known' }, { ua: 'masscan/1.3', cls: 'bot-suspect' }, { ua: 'libwww-perl/6.72', cls: 'bot-suspect' }, { ua: 'curl/7.88.1', cls: 'bot-known' }],
  hoarder: [{ ua: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/129.0.0.0', cls: 'bot-known' }, { ua: 'okhttp/4.12.0', cls: 'bot-known' }, { ua: 'axios/1.7.7', cls: 'bot-known' }],
};

const SITE_PATHS: Record<SiteId, { get: string[]; post: string[] }> = {
  northbolt: { get: ['/', '/login', '/accounts', '/transfer', '/cards', '/loans', '/rates', '/branches', '/api/rates'], post: ['/login', '/transfer', '/support'] },
  tinyshop: { get: ['/', '/category/kitchen', '/category/decor', '/product/p8', '/product/p2', '/search?q=mug', '/cart', '/deals', '/api/products'], post: ['/cart/add', '/checkout'] },
  bloglite: { get: ['/', '/post/bots-now-half-of-web-traffic', '/post/ddos-attack-sizes', '/category/security', '/category/business', '/about', '/api/posts'], post: ['/subscribe', '/post/bots-now-half-of-web-traffic/comment'] },
  bookingmini: { get: ['/', '/search?city=Goa', '/search?city=Pune', '/hotel/h1', '/hotel/h6', '/deals', '/help', '/api/hotels'], post: ['/book', '/bookings'] },
};
const SCAN_PATHS = ['/wp-admin/', '/.env', '/admin', '/phpmyadmin/', '/.git/config', '/xmlrpc.php', '/wp-login.php', '/api/v1/users', '/config.json', '/backup.zip'];
const SITE_IDS: SiteId[] = ['northbolt', 'tinyshop', 'bloglite', 'bookingmini'];

let seq = 0;
const nextId = () => `req_${(++seq).toString(36).padStart(6, '0')}`;

interface HumanSession {
  ip: string;
  ua: string;
  siteId: SiteId;
  nextAt: number;
  pace: number; // ms between requests
  privacy: boolean; // privacy browser: no cookie/referrer, single language
  pendingChallenge: boolean;
  visited: number;
}

/** Background population of real visitors across the four sites. */
export class HumanPopulation {
  private r = rng(7);
  private pool = makeIpPool(11, 90, 'human');
  private sessions: HumanSession[] = [];
  private cursor = 0;

  constructor(private readonly target = 48) {}

  private spawn(now: number): HumanSession {
    const ip = this.pool[this.cursor++ % this.pool.length];
    const privacy = this.r() < 0.1;
    return {
      ip, ua: HUMAN_UAS[Math.floor(this.r() * HUMAN_UAS.length)], siteId: SITE_IDS[Math.floor(this.r() * SITE_IDS.length)],
      nextAt: now + this.r() * 8000, pace: 6000 + this.r() * 26000, privacy, pendingChallenge: false, visited: 0,
    };
  }

  /** Called by the simulation when a human got challenged: their browser solves it and retries. */
  markChallenged(ip: string) {
    const s = this.sessions.find((x) => x.ip === ip);
    if (s) s.pendingChallenge = true;
  }

  tick(now: number, multiplier = 1): RawRequest[] {
    while (this.sessions.length < this.target * multiplier) this.sessions.push(this.spawn(now));
    const out: RawRequest[] = [];
    for (let i = 0; i < this.sessions.length; i++) {
      const s = this.sessions[i];
      if (now < s.nextAt) continue;
      const paths = SITE_PATHS[s.siteId];
      const post = this.r() < 0.12;
      const path = post ? paths.post[Math.floor(this.r() * paths.post.length)] : paths.get[Math.floor(this.r() * paths.get.length)];
      out.push({
        id: nextId(), ts: now, ip: s.ip, ua: s.ua, uaClass: 'human', method: post ? 'POST' : 'GET', path, siteId: s.siteId, kind: 'human', route: 'shield',
        headers: { accept: true, acceptLanguage: s.privacy ? 1 : 2, acceptEncoding: true, referer: !s.privacy && s.visited > 0, cookie: s.privacy ? s.visited > 2 : true },
        contentLength: post ? 120 + Math.floor(this.r() * 400) : 0,
        challengeSolved: s.pendingChallenge,
      });
      s.pendingChallenge = false;
      s.visited++;
      s.nextAt = now + s.pace * (0.5 + this.r());
      // sessions end after a while and a new visitor replaces them
      if (s.visited > 6 + this.r() * 10) this.sessions[i] = this.spawn(now);
    }
    return out;
  }
}

/** IP pools per attack kind — botnets have finite, reused addresses. */
const POOLS: Record<Exclude<ActorKind, 'human'>, string[]> = {
  flood: makeIpPool(101, 40, 'bot'),
  scraper: makeIpPool(102, 8, 'bot'),
  credstuff: makeIpPool(103, 25, 'bot'),
  scanner: makeIpPool(104, 5, 'bot'),
  hoarder: makeIpPool(105, 12, 'bot'),
};
// requests per tick (250 ms) at intensity 100, per kind
const RATE_AT_100: Record<Exclude<ActorKind, 'human'>, number> = { flood: 40, scraper: 14, credstuff: 20, scanner: 8, hoarder: 12 };

export function resolveKind(kind: Attack['kind'], r: () => number): Exclude<ActorKind, 'human'> | 'human' {
  if (kind !== 'mixed') return kind;
  const x = r();
  return x < 0.35 ? 'flood' : x < 0.6 ? 'scraper' : x < 0.8 ? 'credstuff' : x < 0.9 ? 'scanner' : 'human';
}

/** Requests generated by one active attack this tick. */
export function attackRequests(attack: Attack, now: number, r: () => number): RawRequest[] {
  const out: RawRequest[] = [];
  const baseKind = attack.kind === 'mixed' ? 'flood' : attack.kind;
  const perTick = (RATE_AT_100[baseKind] * attack.intensity) / 100;
  const n = Math.floor(perTick) + (r() < perTick % 1 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const kind = resolveKind(attack.kind, r);
    if (kind === 'human') {
      out.push({
        id: nextId(), ts: now, ip: POOLS.scraper[Math.floor(r() * POOLS.scraper.length)], ua: HUMAN_UAS[Math.floor(r() * HUMAN_UAS.length)], uaClass: 'human', method: 'GET',
        path: SITE_PATHS[attack.siteId].get[Math.floor(r() * SITE_PATHS[attack.siteId].get.length)], siteId: attack.siteId, kind: 'human', route: attack.route,
        headers: { accept: true, acceptLanguage: 2, acceptEncoding: true, referer: true, cookie: true }, contentLength: 0, challengeSolved: false,
      });
      continue;
    }
    const pool = POOLS[kind];
    const ua = BOT_UAS[kind][Math.floor(r() * BOT_UAS[kind].length)];
    const paths = SITE_PATHS[attack.siteId];
    let method: 'GET' | 'POST' = 'GET';
    let path = '/';
    let contentLength = 0;
    if (kind === 'credstuff') { method = 'POST'; path = '/login'; contentLength = 48 + Math.floor(r() * 30); }
    else if (kind === 'hoarder') { method = r() < 0.7 ? 'POST' : 'GET'; path = method === 'POST' ? paths.post[0] : paths.get[3] || '/'; contentLength = method === 'POST' ? 20 : 0; }
    else if (kind === 'scanner') { path = SCAN_PATHS[Math.floor(r() * SCAN_PATHS.length)]; }
    else if (kind === 'scraper') { path = paths.get[Math.floor(r() * paths.get.length)]; }
    else { path = r() < 0.85 ? '/' : paths.get[Math.floor(r() * paths.get.length)]; }
    out.push({
      id: nextId(), ts: now, ip: pool[Math.floor(r() * pool.length)], ua: ua.ua, uaClass: ua.cls, method, path, siteId: attack.siteId, kind, route: attack.route,
      headers: { accept: kind === 'scraper' || kind === 'hoarder', acceptLanguage: kind === 'hoarder' ? 1 : 0, acceptEncoding: kind !== 'flood', referer: false, cookie: kind === 'hoarder' && r() < 0.5 },
      contentLength, challengeSolved: false,
    });
  }
  return out;
}

export const ATTACK_LIBRARY: { kind: Attack['kind']; name: string; description: string; defaultIntensity: number }[] = [
  { kind: 'flood', name: 'Volumetric flood (DDoS)', description: 'A botnet of 40 addresses hammers the home page with thousands of requests per minute to exhaust the origin.', defaultIntensity: 60 },
  { kind: 'credstuff', name: 'Credential stuffing', description: '25 addresses replay leaked username/password pairs against the login endpoint.', defaultIntensity: 50 },
  { kind: 'scraper', name: 'Content & price scraping', description: 'Headless crawlers walk every product, article and hotel page to harvest data.', defaultIntensity: 45 },
  { kind: 'scanner', name: 'Vulnerability scan', description: 'Probes for /wp-admin, /.env, /phpmyadmin and other weak spots.', defaultIntensity: 40 },
  { kind: 'hoarder', name: 'Inventory hoarding', description: 'Scripts add stock to carts and hold bookings so real customers cannot buy.', defaultIntensity: 45 },
  { kind: 'mixed', name: 'Mixed traffic', description: 'Floods, scrapers, credential stuffing and some genuine users together — measures false positives.', defaultIntensity: 55 },
];
