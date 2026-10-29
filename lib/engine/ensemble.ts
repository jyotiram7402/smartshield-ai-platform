import type { Decision, Features, RawRequest, ShieldConfig, ModelScore, Classification, Action } from './types';
import type { SessionInfo } from './features';
import { scoreAE, scoreIF, scoreLSTM, scoreRF } from './models';
import { FEATURE_LABELS } from './features';

export const DEFAULT_CONFIG: ShieldConfig = {
  enabled: true,
  challengeThreshold: 0.55,
  blockThreshold: 0.85,
  perIpRpm: 120,
  weights: { rf: 0.4, if: 0.2, ae: 0.2, lstm: 0.2 },
};

export function classify(score: number): Classification {
  return score >= 0.7 ? 'bot' : score >= 0.4 ? 'suspicious' : 'human';
}

export function decideAction(score: number, cfg: ShieldConfig): Action {
  if (!cfg.enabled) return 'allow';
  if (score >= cfg.blockThreshold) return 'block';
  if (score >= cfg.challengeThreshold) return 'challenge';
  return 'allow';
}

function fuse(models: ModelScore[], cfg: ShieldConfig) {
  const total = models.reduce((s, m) => s + (cfg.weights[m.model] ?? 0), 0) || 1;
  let score = 0;
  for (const m of models) {
    m.weight = Number(((cfg.weights[m.model] ?? 0) / total).toFixed(3));
    score += m.score * m.weight;
  }
  return Number(score.toFixed(4));
}

/** Human-readable value of a feature for the explanation (falls back to the model's own rendering). */
function featureValue(f: Features, feature: string, fallback: string) {
  const raw = (f as unknown as Record<string, unknown>)[feature];
  if (raw === undefined) return fallback;
  if (feature === 'session_age_ms') return `${(Number(raw) / 1000).toFixed(1)} s`;
  if (feature === 'content_length') return `${raw} B`;
  if (typeof raw === 'boolean') return raw ? 'yes' : 'no';
  if (typeof raw === 'number') return Number.isInteger(raw) ? String(raw) : raw.toFixed(2);
  return String(raw);
}

function explain(f: Features, models: ModelScore[], score: number, action: Action, cfg: ShieldConfig): string[] {
  const out: string[] = [];
  // Each model reports its contributions in its own score units; weight them into
  // fused-score units and merge the same feature across models, so "+0.37" means
  // "this feature accounts for 0.37 of the final risk score".
  const byFeature = new Map<string, { value: string; impact: number; models: string[] }>();
  for (const m of models) {
    for (const x of m.contributions) {
      if (x.impact <= 0) continue;
      const cur = byFeature.get(x.feature) || { value: featureValue(f, x.feature, x.value), impact: 0, models: [] };
      cur.impact += x.impact * m.weight;
      cur.models.push(m.label);
      byFeature.set(x.feature, cur);
    }
  }
  const top = [...byFeature.entries()].filter(([, x]) => x.impact >= 0.04).sort((a, b) => b[1].impact - a[1].impact).slice(0, 3);
  for (const [feature, t] of top) {
    const label = (FEATURE_LABELS as Record<string, string>)[feature] || feature.replace(/_/g, ' ');
    out.push(`${label} = ${t.value} raised risk by +${t.impact.toFixed(2)} (${t.models.join(', ')}).`);
  }
  if (f.challenge_solved) out.push('A valid challenge token lowered risk by 0.30 — this client proved it runs JavaScript.');
  const strongest = [...models].sort((a, b) => b.score - a.score)[0];
  out.push(`Ensemble score ${score.toFixed(3)} — ${strongest.label} was the most confident model (${strongest.score.toFixed(2)}).`);
  if (!cfg.enabled) out.push('Shield is OFF — request forwarded without mitigation.');
  else if (action === 'block') out.push(`Score ≥ block threshold ${cfg.blockThreshold} → request blocked (HTTP 403).`);
  else if (action === 'challenge') out.push(`Score ≥ challenge threshold ${cfg.challengeThreshold} → JavaScript proof-of-work challenge issued (HTTP 202).`);
  else out.push(`Score < ${cfg.challengeThreshold} → request allowed and proxied to the origin.`);
  return out;
}

/** Run the four models, fuse them and decide — the "AI engine" + mitigator of the gateway. */
export function evaluate(req: RawRequest, f: Features, session: SessionInfo, cfg: ShieldConfig): Decision {
  const models = [scoreRF(f, req), scoreIF(f, req), scoreAE(f, req), scoreLSTM(session, req)];
  const score = fuse(models, cfg);
  const action = decideAction(score, cfg);
  return { score, classification: classify(score), action, models, explanations: explain(f, models, score, action, cfg), rateLimited: false, shieldEnabled: cfg.enabled };
}
