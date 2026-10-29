import { clamp, hashStr } from '@/lib/utils';
import type { Contribution, Features, ModelScore, RawRequest } from './types';
import type { SessionInfo } from './features';

const c = (feature: string, value: string | number | boolean, impact: number): Contribution => ({ feature, value: String(value), impact: Number(impact.toFixed(3)) });
const jitter = (key: string, amp: number) => ((hashStr(key) % 1000) / 1000 - 0.5) * 2 * amp;
const lat = (key: string, base: number, spread: number) => Number((base + ((hashStr(key + 'l') % 100) / 100) * spread).toFixed(1));

/** Random Forest — supervised bot/human classifier over the tabular features. */
export function scoreRF(f: Features, req: RawRequest): ModelScore {
  const base: Record<string, number> = { 'bot-known': 0.62, 'bot-suspect': 0.42, unknown: 0.3, human: 0.08 };
  const contributions: Contribution[] = [];
  let s = base[f.ua_class];
  contributions.push(c('ua_class', f.ua_class, s));

  const rate = clamp(f.request_rate_per_min / 300, 0, 0.3);
  s += rate; contributions.push(c('request_rate_per_min', f.request_rate_per_min, rate));

  const anomaly = f.header_anomaly_score * 0.25;
  s += anomaly; contributions.push(c('header_anomaly_score', f.header_anomaly_score, anomaly));

  const cookie = f.has_cookie ? -0.04 : 0.05;
  s += cookie; contributions.push(c('has_cookie', f.has_cookie, cookie));

  const lang = f.accept_lang_count ? -0.02 : 0.05;
  s += lang; contributions.push(c('accept_lang_count', f.accept_lang_count, lang));

  const ref = f.referrer_present ? -0.02 : 0.02;
  s += ref; contributions.push(c('referrer_present', f.referrer_present, ref));

  const method = f.method_class === 'mutating' && f.content_length < 24 ? 0.06 : 0;
  if (method) contributions.push(c('method_class', `${f.method_class} (${f.content_length} B)`, method));
  s += method;

  const fresh = f.session_age_ms < 2000 && f.request_rate_per_min > 20 ? 0.05 : 0;
  if (fresh) contributions.push(c('session_age_ms', f.session_age_ms, fresh));
  s += fresh;

  const solved = f.challenge_solved ? -0.3 : 0;
  if (solved) contributions.push(c('challenge_solved', true, solved));
  s += solved;

  s += jitter(req.id + 'rf', 0.02);
  s = clamp(s, 0.01, 0.99);
  return { model: 'rf', label: 'Random Forest', score: s, weight: 0, contributions, note: `${Math.round(s * 300)}/300 trees voted bot`, latencyMs: lat(req.id + 'rf', 1.2, 1.4) };
}

/** Isolation Forest — unsupervised outlier detection; short average path length = anomaly. */
export function scoreIF(f: Features, req: RawRequest): ModelScore {
  const contributions: Contribution[] = [];
  const rateZ = Math.max(0, (f.request_rate_per_min - 3) / 6);
  const rateTerm = 0.22 * Math.min(rateZ, 6);
  contributions.push(c('request_rate_per_min', f.request_rate_per_min, rateTerm));
  const headerTerm = 1.4 * f.header_anomaly_score;
  contributions.push(c('header_anomaly_score', f.header_anomaly_score, headerTerm));
  const uaTerm = f.ua_class === 'human' ? 0 : f.ua_class === 'unknown' ? 0.3 : 0.6;
  contributions.push(c('ua_class', f.ua_class, uaTerm));
  const lenTerm = f.content_length > 4000 ? 0.4 : 0;
  if (lenTerm) contributions.push(c('content_length', f.content_length, lenTerm));
  const raw = rateTerm + headerTerm + uaTerm + lenTerm;
  let s = 1 - Math.exp(-raw);
  s = clamp(s + jitter(req.id + 'if', 0.03), 0.02, 0.98);
  // express the terms in score units so the contributions add up to the score
  const k = raw > 0 ? s / raw : 0;
  for (const x of contributions) x.impact = Number((x.impact * k).toFixed(3));
  return { model: 'if', label: 'Isolation Forest', score: s, weight: 0, contributions, note: `avg path length ${(8 - s * 6).toFixed(1)} (256 samples)`, latencyMs: lat(req.id + 'if', 0.8, 0.9) };
}

/** Autoencoder — reconstruction error against the learned profile of normal traffic. */
export function scoreAE(f: Features, req: RawRequest): ModelScore {
  // normal (human) profile: low rate, no header anomalies, human UA, cookie, language, referrer, GET, small body
  const x = [clamp(f.request_rate_per_min / 60, 0, 1), f.header_anomaly_score, f.ua_class === 'human' ? 0 : 1, f.has_cookie ? 0 : 1, f.accept_lang_count ? 0 : 1, f.referrer_present ? 0 : 1, f.method_class === 'safe' ? 0 : 0.3, clamp(f.content_length / 8000, 0, 1)];
  const mu = [0.06, 0.04, 0, 0.1, 0.05, 0.3, 0.05, 0.02];
  const w = [1.6, 2.2, 2.4, 0.8, 0.9, 0.3, 0.6, 1.0];
  const names = ['request_rate_per_min', 'header_anomaly_score', 'ua_class', 'has_cookie', 'accept_lang_count', 'referrer_present', 'method_class', 'content_length'];
  const contributions: Contribution[] = [];
  let err = 0;
  for (let i = 0; i < x.length; i++) {
    const e = w[i] * (x[i] - mu[i]) ** 2;
    err += e;
    if (e > 0.02) contributions.push(c(names[i], x[i].toFixed(2), e));
  }
  let s = 1 - Math.exp(-err * 1.1);
  s = clamp(s + jitter(req.id + 'ae', 0.03), 0.02, 0.98);
  // express the per-feature errors in score units so the contributions add up to the score
  const k = err > 0 ? s / err : 0;
  for (const x of contributions) x.impact = Number((x.impact * k).toFixed(3));
  return { model: 'ae', label: 'Autoencoder', score: s, weight: 0, contributions, note: `reconstruction error ${err.toFixed(3)} (threshold 0.35)`, latencyMs: lat(req.id + 'ae', 2.4, 2.2) };
}

/** LSTM — sequence model over the client's recent requests (timing, regularity, repetition). */
export function scoreLSTM(session: SessionInfo, req: RawRequest): ModelScore {
  const ts = session.timestamps;
  const contributions: Contribution[] = [];
  if (ts.length < 4) {
    const s = clamp(0.12 + jitter(req.id + 'ls', 0.02), 0.05, 0.3);
    return { model: 'lstm', label: 'LSTM', score: s, weight: 0, contributions: [c('sequence_length', ts.length, 0)], note: `insufficient sequence (${ts.length}/4) — prior only`, latencyMs: lat(req.id + 'ls', 3.1, 2.6) };
  }
  const seq = ts.slice(-8);
  const intervals: number[] = [];
  for (let i = 1; i < seq.length; i++) intervals.push(seq[i] - seq[i - 1]);
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const sd = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length);
  const cv = mean > 0 ? sd / mean : 0;
  const burst = clamp(1 - mean / 2500, 0, 1); // sub-second gaps → 1
  const regularity = clamp(1 - cv, 0, 1); // machine-like evenly spaced requests → 1
  const paths = session.paths.slice(-8);
  const repetition = 1 - new Set(paths).size / paths.length;
  const bTerm = 0.5 * burst, rTerm = 0.3 * regularity, pTerm = 0.2 * repetition;
  contributions.push(c('mean_interval_ms', Math.round(mean), bTerm));
  contributions.push(c('interval_regularity', regularity.toFixed(2), rTerm));
  contributions.push(c('path_repetition', repetition.toFixed(2), pTerm));
  let s = bTerm + rTerm + pTerm;
  s = clamp(s + jitter(req.id + 'ls', 0.03), 0.03, 0.98);
  return { model: 'lstm', label: 'LSTM', score: s, weight: 0, contributions, note: `${seq.length}-step sequence · mean gap ${Math.round(mean)} ms`, latencyMs: lat(req.id + 'ls', 3.1, 2.6) };
}
