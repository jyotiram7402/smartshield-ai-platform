'use client';

import { create } from 'zustand';
import { Simulation } from '@/lib/engine/simulation';
import { DEFAULT_CONFIG } from '@/lib/engine/ensemble';
import type { AttackKind, RawRequest, Route, ShieldConfig, SiteId, Snapshot, TrafficEvent } from '@/lib/engine/types';

let sim: Simulation | null = null;
function getSim() {
  if (!sim) sim = new Simulation();
  return sim;
}

const empty: Snapshot = {
  running: false, tick: 0, startedAt: 0, config: DEFAULT_CONFIG,
  metrics: { total: 0, rps: 0, allowed: 0, blocked: 0, challenged: 0, rateLimited: 0, human: 0, bot: 0, suspicious: 0, avgScore: 0, mitigationRate: 0, botRate: 0, byCountry: {} },
  timeseries: [], events: [], ips: [], sites: [], attacks: [], alerts: [],
  engine: { status: 'ok', runtime: '', framework: '', tensorflow: '', featureCount: 10, uptimeSec: 0, inferences: 0, avgInferenceMs: 0, models: [] },
  lastDecision: null, totals: { requests: 0, allowed: 0, challenged: 0, blocked: 0, rateLimited: 0 },
};

type Store = Snapshot & {
  connected: boolean;
  start: () => void;
  stop: () => void;
  setConfig: (patch: Partial<ShieldConfig>) => void;
  launchAttack: (o: { siteId: SiteId; kind: AttackKind; route: Route; intensity: number; durationSec: number }) => { ok: boolean; error?: string };
  stopAttack: (siteId: SiteId) => void;
  scoreCustom: (req: RawRequest) => TrafficEvent;
};

let unsubscribe: (() => void) | null = null;

export const useSim = create<Store>((set) => ({
  ...empty,
  connected: false,
  start: () => {
    const s = getSim();
    if (!unsubscribe) unsubscribe = s.subscribe((snap) => set({ ...snap, connected: true }));
    s.start();
  },
  stop: () => getSim().stop(),
  setConfig: (patch) => getSim().setConfig(patch),
  launchAttack: (o) => getSim().launchAttack(o),
  stopAttack: (id) => getSim().stopAttack(id),
  scoreCustom: (req) => getSim().scoreCustom(req),
}));

/** Keep the simulation alive across client-side navigation; start it once per page load. */
export function ensureSimulation() {
  const st = useSim.getState();
  if (!st.running) st.start();
}
