import { rng } from '@/lib/utils';
import { countryForIp } from './geo';
import { SessionTracker, extractFeatures } from './features';
import { DEFAULT_CONFIG, evaluate, classify } from './ensemble';
import { HumanPopulation, attackRequests } from './traffic';
import { OriginModel, SITE_DEFS } from './sites';
import type { Alert, Attack, AttackKind, EngineInfo, IpProfile, Metrics, RawRequest, Route, ShieldConfig, SiteId, Snapshot, TimePoint, TrafficEvent } from './types';

const TICK_MS = 250;
const MAX_EVENTS = 300;
const MAX_IPS = 400;
const MAX_ALERTS = 40;
const MAX_POINTS = 120;

const MODEL_DEFS: EngineInfo['models'] = [
  { id: 'rf', name: 'Random Forest', file: 'rf_model.joblib', algorithm: 'scikit-learn RandomForestClassifier', params: '300 trees · max_depth 12 · class_weight balanced', trainedOn: '20,000 labelled sessions', version: '1.4.2', loaded: true, weight: 0.4 },
  { id: 'if', name: 'Isolation Forest', file: 'if_model.joblib', algorithm: 'scikit-learn IsolationForest', params: '200 estimators · contamination 0.08 · 256 samples', trainedOn: '14,100 human sessions', version: '1.2.0', loaded: true, weight: 0.2 },
  { id: 'ae', name: 'Autoencoder', file: 'autoencoder.keras', algorithm: 'Keras dense autoencoder 10-16-6-16-10', params: 'MSE loss · Adam · 40 epochs · threshold 0.35', trainedOn: '14,100 human sessions', version: '1.3.1', loaded: true, weight: 0.2 },
  { id: 'lstm', name: 'LSTM', file: 'lstm_model.keras', algorithm: 'Keras LSTM(64) → Dense(1, sigmoid)', params: 'sequence length 8 · dropout 0.2 · 30 epochs', trainedOn: '20,000 sequences', version: '1.1.0', loaded: true, weight: 0.2 },
];

type Listener = (s: Snapshot) => void;

export class Simulation {
  private cfg: ShieldConfig = { ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } };
  private r = rng(42);
  private tracker = new SessionTracker();
  private humans = new HumanPopulation();
  private origins = new Map<SiteId, OriginModel>(SITE_DEFS.map((d) => [d.id, new OriginModel(d)]));
  private ips = new Map<string, IpProfile>();
  private events: TrafficEvent[] = [];
  private attacks = new Map<SiteId, Attack>();
  private alerts: Alert[] = [];
  private timeseries: TimePoint[] = [];
  private secCounts = { allow: 0, challenge: 0, block: 0, rateLimited: 0, scoreSum: 0, n: 0 };
  private minute: { ts: number; action: string; cls: string; score: number; country: string }[] = [];
  private totals = { requests: 0, allowed: 0, challenged: 0, blocked: 0, rateLimited: 0 };
  private inferences = 0;
  private inferenceMs = 0;
  private siteStatus = new Map<SiteId, string>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private tick = 0;
  private lastSec = 0;
  private lastDecision: TrafficEvent | null = null;
  private startedAt = 0;
  private alertSeq = 0;

  // ---------------- lifecycle ----------------
  start() {
    if (this.timer) return;
    const now = Date.now();
    this.startedAt = this.startedAt || now;
    this.lastSec = now;
    this.timer = setInterval(() => this.step(), TICK_MS);
    this.pushAlert('info', 'Gateway online', 'Shield enabled · 4 models loaded · health checker probing 4 origins');
    this.emit();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit();
  }
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => { this.listeners.delete(fn); };
  }

  // ---------------- control plane ----------------
  getConfig() {
    return this.cfg;
  }
  setConfig(patch: Partial<ShieldConfig>) {
    const before = this.cfg.enabled;
    this.cfg = { ...this.cfg, ...patch, weights: { ...this.cfg.weights, ...(patch.weights || {}) } };
    if (this.cfg.challengeThreshold > this.cfg.blockThreshold) this.cfg.challengeThreshold = this.cfg.blockThreshold;
    if (before !== this.cfg.enabled) this.pushAlert(this.cfg.enabled ? 'info' : 'warn', this.cfg.enabled ? 'Shield enabled' : 'Shield DISABLED', this.cfg.enabled ? 'All /proxy traffic is scored and mitigated again.' : 'Requests are forwarded to origins without scoring.');
    this.emit();
  }
  launchAttack(opts: { siteId: SiteId; kind: AttackKind; route: Route; intensity: number; durationSec: number }): { ok: boolean; error?: string } {
    if (this.attacks.has(opts.siteId)) return { ok: false, error: 'An attack is already running against this site.' };
    const site = this.origins.get(opts.siteId)!.state;
    const attack: Attack = {
      id: `atk_${Date.now().toString(36)}`, siteId: opts.siteId, kind: opts.kind, route: opts.route,
      intensity: Math.max(1, Math.min(100, Math.round(opts.intensity || 50))), startedAt: Date.now(), durationSec: Math.max(5, Math.min(300, Math.round(opts.durationSec || 30))),
      stats: { sent: 0, allowed: 0, challenged: 0, blocked: 0, rateLimited: 0, served: 0, shed: 0 },
    };
    this.attacks.set(opts.siteId, attack);
    this.pushAlert('warn', `Attack launched: ${site.name}`, `${attack.kind.toUpperCase()} via ${attack.route.toUpperCase()} · intensity ${attack.intensity} · ${attack.durationSec}s`);
    this.emit();
    return { ok: true };
  }
  stopAttack(siteId: SiteId) {
    const a = this.attacks.get(siteId);
    if (!a) return;
    this.attacks.delete(siteId);
    this.pushAlert('info', `Attack stopped: ${this.origins.get(siteId)!.state.name}`, this.describeStats(a));
    this.emit();
  }
  /** Score an arbitrary request from the "Try the engine" form. */
  scoreCustom(req: RawRequest): TrafficEvent {
    const session = this.tracker.track(req.ip, req.ts, req.path);
    const f = extractFeatures(req, session);
    const d = evaluate(req, f, session, this.cfg);
    return { id: req.id, ts: req.ts, ip: req.ip, country: countryForIp(req.ip), ua: req.ua, uaClass: req.uaClass, method: req.method, path: req.path, siteId: req.siteId, route: 'shield', kind: req.kind, features: f, decision: d, reachedOrigin: d.action === 'allow', status: d.action === 'block' ? 403 : d.action === 'challenge' ? 202 : 200, latencyMs: 0 };
  }

  // ---------------- the tick ----------------
  private step() {
    const now = Date.now();
    this.tick++;
    const reaching = new Map<SiteId, number>();
    for (const id of this.origins.keys()) reaching.set(id, 0);

    // background humans (a bit more traffic when the shield is on, reflecting a healthy site)
    const batch: RawRequest[] = this.humans.tick(now);
    // attacks
    for (const [siteId, a] of this.attacks) {
      if (now - a.startedAt > a.durationSec * 1000) {
        this.attacks.delete(siteId);
        this.pushAlert('info', `Attack ended: ${this.origins.get(siteId)!.state.name}`, this.describeStats(a));
        continue;
      }
      batch.push(...attackRequests(a, now, this.r));
    }

    for (const req of batch) {
      const attack = req.kind !== 'human' || req.route === 'direct' ? this.attacks.get(req.siteId) : undefined;
      if (attack && attack.siteId === req.siteId && attack.route === req.route) attack.stats.sent++;

      if (req.route === 'direct') {
        // bypasses the gateway entirely: invisible to the dashboard, hits the origin
        reaching.set(req.siteId, (reaching.get(req.siteId) || 0) + 1);
        continue;
      }
      const ev = this.process(req, now);
      if (attack) {
        if (ev.decision.rateLimited) attack.stats.rateLimited++;
        else if (ev.decision.action === 'block') attack.stats.blocked++;
        else if (ev.decision.action === 'challenge') attack.stats.challenged++;
        else attack.stats.allowed++;
      }
      if (ev.reachedOrigin) reaching.set(req.siteId, (reaching.get(req.siteId) || 0) + 1);
    }

    // origins
    for (const [id, origin] of this.origins) {
      const before = origin.state.status;
      const res = origin.tick(reaching.get(id) || 0, now, TICK_MS);
      const a = this.attacks.get(id);
      if (a) { a.stats.served += res.served; a.stats.shed += res.shed; }
      const after = origin.state.status;
      if (before !== after && (after === 'down' || before === 'down')) {
        this.pushAlert(after === 'down' ? 'error' : 'info', `${origin.state.name} is ${after.toUpperCase()}`, after === 'down' ? 'Health probe returned HTTP 503 (overloaded) — origin is shedding load.' : 'Health probe healthy again — origin recovered.');
      }
    }

    // per-second aggregation
    if (now - this.lastSec >= 1000) {
      const n = this.secCounts.n;
      this.timeseries.push({ ts: now, allow: this.secCounts.allow, challenge: this.secCounts.challenge, block: this.secCounts.block, rateLimited: this.secCounts.rateLimited, rps: n, avgScore: n ? Number((this.secCounts.scoreSum / n).toFixed(3)) : 0 });
      if (this.timeseries.length > MAX_POINTS) this.timeseries.shift();
      this.secCounts = { allow: 0, challenge: 0, block: 0, rateLimited: 0, scoreSum: 0, n: 0 };
      this.lastSec = now;
      while (this.minute.length && now - this.minute[0].ts > 60_000) this.minute.shift();
    }
    // snapshots at 2 Hz keep React rendering cheap while the engine ticks at 4 Hz
    if (this.tick % 2 === 0) this.emit();
  }

  /** The gateway pipeline for one request: rate limit → features → AI → mitigate → log. */
  private process(req: RawRequest, now: number): TrafficEvent {
    const country = countryForIp(req.ip);
    const limited = this.cfg.enabled && this.tracker.countLastMinute(req.ip, now) >= this.cfg.perIpRpm;
    const session = this.tracker.track(req.ip, now, req.path);
    const f = extractFeatures(req, session);
    const d = evaluate(req, f, session, this.cfg);
    if (limited) { d.rateLimited = true; d.action = 'block'; d.explanations.unshift(`Per-IP rate limit exceeded (${this.cfg.perIpRpm}/min) — rejected before AI scoring (HTTP 429).`); }
    this.inferences++;
    const infMs = d.models.reduce((s, m) => s + m.latencyMs, 0);
    this.inferenceMs += infMs;
    const reached = d.action === 'allow';
    const status = limited ? 429 : d.action === 'block' ? 403 : d.action === 'challenge' ? 202 : 200;
    const ev: TrafficEvent = { id: req.id, ts: now, ip: req.ip, country, ua: req.ua, uaClass: req.uaClass, method: req.method, path: req.path, siteId: req.siteId, route: 'shield', kind: req.kind, features: f, decision: d, reachedOrigin: reached, status, latencyMs: Math.round(limited ? 1 : 6 + infMs + (reached ? 40 + this.r() * 30 : 0)) };

    if (d.action === 'challenge' && req.kind === 'human') this.humans.markChallenged(req.ip);

    // log + counters
    this.events.unshift(ev);
    if (this.events.length > MAX_EVENTS) this.events.pop();
    this.lastDecision = ev;
    this.totals.requests++;
    if (limited) { this.totals.rateLimited++; this.secCounts.rateLimited++; }
    else if (d.action === 'block') { this.totals.blocked++; this.secCounts.block++; }
    else if (d.action === 'challenge') { this.totals.challenged++; this.secCounts.challenge++; }
    else { this.totals.allowed++; this.secCounts.allow++; }
    this.secCounts.scoreSum += d.score;
    this.secCounts.n++;
    this.minute.push({ ts: now, action: limited ? 'rateLimited' : d.action, cls: d.classification, score: d.score, country: country.code });

    // ip profile
    let p = this.ips.get(req.ip);
    if (!p) {
      p = { ip: req.ip, country, ua: req.ua, uaClass: req.uaClass, firstSeen: now, lastSeen: now, requests: 0, allowed: 0, challenged: 0, blocked: 0, rateLimited: 0, avgScore: 0, maxScore: 0, lastAction: 'allow', lastPath: req.path, lastSite: req.siteId, kinds: {}, reputation: 'clean', recent: [] };
      this.ips.set(req.ip, p);
      if (this.ips.size > MAX_IPS) {
        let oldest: IpProfile | null = null;
        for (const x of this.ips.values()) if (!oldest || x.lastSeen < oldest.lastSeen) oldest = x;
        if (oldest) this.ips.delete(oldest.ip);
      }
    }
    p.lastSeen = now; p.requests++; p.ua = req.ua || p.ua; p.uaClass = req.uaClass; p.lastPath = req.path; p.lastSite = req.siteId;
    p.avgScore = Number((p.avgScore + (d.score - p.avgScore) / p.requests).toFixed(3));
    p.maxScore = Math.max(p.maxScore, d.score);
    if (limited) { p.rateLimited++; p.lastAction = 'rate-limited'; } else { p[d.action === 'allow' ? 'allowed' : d.action === 'block' ? 'blocked' : 'challenged']++; p.lastAction = d.action; }
    p.kinds[req.kind] = (p.kinds[req.kind] || 0) + 1;
    p.reputation = p.blocked + p.rateLimited >= 3 || p.maxScore >= 0.85 ? 'malicious' : p.challenged >= 2 || p.avgScore >= 0.45 ? 'watch' : 'clean';
    p.recent.unshift(ev);
    if (p.recent.length > 10) p.recent.pop();
    return ev;
  }

  // ---------------- snapshot ----------------
  private describeStats(a: Attack) {
    const s = a.stats;
    return a.route === 'direct'
      ? `${s.sent} requests sent straight at the origin · ${s.served} served · ${s.shed} failed (503)`
      : `${s.sent} requests · ${s.blocked} blocked · ${s.challenged} challenged · ${s.rateLimited} rate-limited · ${s.allowed} reached origin`;
  }
  private pushAlert(level: Alert['level'], title: string, detail?: string) {
    this.alerts.unshift({ id: `al_${++this.alertSeq}`, level, title, detail, ts: Date.now() });
    if (this.alerts.length > MAX_ALERTS) this.alerts.pop();
  }
  private metrics(): Metrics {
    const m = this.minute;
    const total = m.length;
    const count = (pred: (x: (typeof m)[number]) => boolean) => m.reduce((n, x) => n + (pred(x) ? 1 : 0), 0);
    const allowed = count((x) => x.action === 'allow'), blocked = count((x) => x.action === 'block'), challenged = count((x) => x.action === 'challenge'), rateLimited = count((x) => x.action === 'rateLimited');
    const human = count((x) => x.cls === 'human'), bot = count((x) => x.cls === 'bot'), suspicious = count((x) => x.cls === 'suspicious');
    const byCountry: Record<string, number> = {};
    for (const x of m) byCountry[x.country] = (byCountry[x.country] || 0) + 1;
    const last10 = this.timeseries.slice(-10);
    const rps = last10.length ? last10.reduce((s, p) => s + p.rps, 0) / last10.length : 0;
    return { total, rps: Number(rps.toFixed(1)), allowed, blocked, challenged, rateLimited, human, bot, suspicious, avgScore: total ? Number((m.reduce((s, x) => s + x.score, 0) / total).toFixed(3)) : 0, mitigationRate: total ? (blocked + challenged + rateLimited) / total : 0, botRate: total ? (bot + suspicious) / total : 0, byCountry };
  }
  private engineInfo(): EngineInfo {
    return { status: 'ok', runtime: 'Python 3.12.6', framework: 'FastAPI 0.115 · uvicorn', tensorflow: 'TensorFlow 2.16.1 (CPU)', featureCount: 10, uptimeSec: this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0, inferences: this.inferences, avgInferenceMs: this.inferences ? Number((this.inferenceMs / this.inferences).toFixed(1)) : 0, models: MODEL_DEFS.map((m) => ({ ...m, weight: this.cfg.weights[m.id] })) };
  }
  snapshot(): Snapshot {
    return {
      running: !!this.timer, tick: this.tick, startedAt: this.startedAt, config: this.cfg, metrics: this.metrics(), timeseries: this.timeseries.slice(), events: this.events.slice(0, MAX_EVENTS),
      ips: [...this.ips.values()].sort((a, b) => b.lastSeen - a.lastSeen), sites: [...this.origins.values()].map((o) => ({ ...o.state, history: o.state.history.slice() })),
      attacks: [...this.attacks.values()].map((a) => ({ ...a, stats: { ...a.stats } })), alerts: this.alerts.slice(), engine: this.engineInfo(), lastDecision: this.lastDecision, totals: { ...this.totals },
    };
  }
  private emit() {
    if (!this.listeners.size) return;
    const s = this.snapshot();
    for (const fn of this.listeners) fn(s);
  }
}

export { classify, DEFAULT_CONFIG };
