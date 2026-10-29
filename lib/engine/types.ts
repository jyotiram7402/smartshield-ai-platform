export type UaClass = 'human' | 'bot-known' | 'bot-suspect' | 'unknown';
export type ActorKind = 'human' | 'scraper' | 'credstuff' | 'flood' | 'scanner' | 'hoarder';
export type AttackKind = Exclude<ActorKind, 'human'> | 'mixed';
export type Action = 'allow' | 'challenge' | 'block';
export type Classification = 'human' | 'suspicious' | 'bot';
export type SiteId = 'northbolt' | 'tinyshop' | 'bloglite' | 'bookingmini';
export type Route = 'direct' | 'shield';
export type ModelId = 'rf' | 'if' | 'ae' | 'lstm';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface RawRequest {
  id: string;
  ts: number;
  ip: string;
  ua: string;
  uaClass: UaClass;
  method: 'GET' | 'POST';
  path: string;
  siteId: SiteId;
  kind: ActorKind;
  route: Route;
  headers: { accept: boolean; acceptLanguage: number; acceptEncoding: boolean; referer: boolean; cookie: boolean };
  contentLength: number;
  challengeSolved: boolean;
}

/** The ten behavioural features — same contract as the production gateway. */
export interface Features {
  request_rate_per_min: number;
  session_age_ms: number;
  header_anomaly_score: number;
  ua_class: UaClass;
  has_cookie: boolean;
  accept_lang_count: number;
  referrer_present: boolean;
  method_class: 'safe' | 'mutating';
  challenge_solved: boolean;
  content_length: number;
}

export interface Contribution {
  feature: string;
  value: string;
  impact: number; // signed, in score units
}

export interface ModelScore {
  model: ModelId;
  label: string;
  score: number;
  weight: number;
  contributions: Contribution[];
  note: string;
  latencyMs: number;
}

export interface Decision {
  score: number;
  classification: Classification;
  action: Action;
  models: ModelScore[];
  explanations: string[];
  rateLimited: boolean;
  shieldEnabled: boolean;
}

export interface TrafficEvent {
  id: string;
  ts: number;
  ip: string;
  country: Country;
  ua: string;
  uaClass: UaClass;
  method: string;
  path: string;
  siteId: SiteId;
  route: Route;
  kind: ActorKind;
  features: Features;
  decision: Decision;
  reachedOrigin: boolean;
  status: number;
  latencyMs: number;
}

export interface IpProfile {
  ip: string;
  country: Country;
  ua: string;
  uaClass: UaClass;
  firstSeen: number;
  lastSeen: number;
  requests: number;
  allowed: number;
  challenged: number;
  blocked: number;
  rateLimited: number;
  avgScore: number;
  maxScore: number;
  lastAction: Action | 'rate-limited';
  lastPath: string;
  lastSite: SiteId;
  kinds: Partial<Record<ActorKind, number>>;
  reputation: 'clean' | 'watch' | 'malicious';
  recent: TrafficEvent[];
}

export interface SiteState {
  id: SiteId;
  name: string;
  kind: string;
  description: string;
  path: string;
  capacityRps: number;
  status: 'up' | 'degraded' | 'down';
  rps: number;
  load: number; // rps / capacity
  served: number;
  shed: number;
  latencyMs: number;
  lastError: string | null;
  history: { ts: number; status: 'up' | 'degraded' | 'down'; ms: number }[];
}

export interface AttackStats {
  sent: number;
  allowed: number;
  challenged: number;
  blocked: number;
  rateLimited: number;
  served: number;
  shed: number;
}

export interface Attack {
  id: string;
  siteId: SiteId;
  kind: AttackKind;
  route: Route;
  intensity: number; // 1..100
  startedAt: number;
  durationSec: number;
  stats: AttackStats;
}

export interface Metrics {
  total: number;
  rps: number;
  allowed: number;
  blocked: number;
  challenged: number;
  rateLimited: number;
  human: number;
  bot: number;
  suspicious: number;
  avgScore: number;
  mitigationRate: number; // (blocked + challenged + rateLimited) / total
  botRate: number;
  byCountry: Record<string, number>;
}

export interface TimePoint {
  ts: number;
  allow: number;
  challenge: number;
  block: number;
  rateLimited: number;
  rps: number;
  avgScore: number;
}

export interface ShieldConfig {
  enabled: boolean;
  challengeThreshold: number;
  blockThreshold: number;
  perIpRpm: number;
  weights: Record<ModelId, number>;
}

export interface Alert {
  id: string;
  level: 'info' | 'warn' | 'error';
  title: string;
  detail?: string;
  ts: number;
}

export interface EngineInfo {
  status: 'ok';
  runtime: string;
  framework: string;
  tensorflow: string;
  featureCount: number;
  uptimeSec: number;
  inferences: number;
  avgInferenceMs: number;
  models: { id: ModelId; name: string; file: string; algorithm: string; params: string; trainedOn: string; version: string; loaded: boolean; weight: number }[];
}

export interface Snapshot {
  running: boolean;
  tick: number;
  startedAt: number;
  config: ShieldConfig;
  metrics: Metrics;
  timeseries: TimePoint[];
  events: TrafficEvent[];
  ips: IpProfile[];
  sites: SiteState[];
  attacks: Attack[];
  alerts: Alert[];
  engine: EngineInfo;
  lastDecision: TrafficEvent | null;
  totals: { requests: number; allowed: number; challenged: number; blocked: number; rateLimited: number };
}
