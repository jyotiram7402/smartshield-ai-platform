'use client';

import { create } from 'zustand';
import { Simulation } from '@/lib/engine/simulation';
import { DEFAULT_CONFIG } from '@/lib/engine/ensemble';
import { trackIncidents } from '@/lib/incidents';
import { createSync, type AttackCmd } from '@/lib/sync';
import type { AttackKind, Features, RawRequest, Route, ShieldConfig, SiteId, Snapshot, TrafficEvent } from '@/lib/engine/types';

let sim: Simulation | null = null;
function getSim() {
  if (!sim) sim = new Simulation();
  return sim;
}

// Attacks launched from another tab run here too (so the protected sites react in every
// tab) but are persisted as incidents only by the tab that launched them.
const remoteSites = new Set<SiteId>();
const remoteIds = new Set<string>();

// Commands from other tabs are applied straight to the engine (never re-broadcast).
const sync = createSync({
  onLaunch: (cmd: AttackCmd) => {
    const remaining = cmd.durationSec - (Date.now() - cmd.startedAt) / 1000;
    if (remaining < 2) return;
    remoteSites.add(cmd.siteId);
    const r = getSim().launchAttack({ siteId: cmd.siteId, kind: cmd.kind, route: cmd.route, intensity: cmd.intensity, durationSec: Math.max(5, Math.round(remaining)) });
    if (!r.ok) remoteSites.delete(cmd.siteId);
  },
  onStop: (siteId) => getSim().stopAttack(siteId),
  onConfig: (patch) => getSim().setConfig(patch),
  getState: () => ({
    attacks: getSim().snapshot().attacks.map((a) => ({ siteId: a.siteId, kind: a.kind, route: a.route, intensity: a.intensity, durationSec: a.durationSec, startedAt: a.startedAt })),
    config: getSim().getConfig(),
  }),
});

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
  scoreCustom: (req: RawRequest, overrides?: Partial<Features>) => TrafficEvent;
};

let unsubscribe: (() => void) | null = null;

export const useSim = create<Store>((set) => ({
  ...empty,
  connected: false,
  start: () => {
    const s = getSim();
    if (!unsubscribe) {
      unsubscribe = s.subscribe((snap) => {
        set({ ...snap, connected: true });
        for (const a of snap.attacks) {
          if (remoteSites.has(a.siteId) && !remoteIds.has(a.id)) { remoteIds.add(a.id); remoteSites.delete(a.siteId); }
        }
        for (const id of remoteIds) if (!snap.attacks.some((a) => a.id === id)) remoteIds.delete(id);
        trackIncidents(snap.attacks.filter((a) => !remoteIds.has(a.id)), (id) => snap.sites.find((x) => x.id === id)?.name || id, snap.config.enabled);
      });
    }
    s.start();
    sync.hello(); // catch up with attacks already running in other tabs
  },
  stop: () => getSim().stop(),
  setConfig: (patch) => { getSim().setConfig(patch); sync.config(patch); },
  launchAttack: (o) => {
    const r = getSim().launchAttack(o);
    if (r.ok) sync.launch({ ...o, startedAt: Date.now() });
    return r;
  },
  stopAttack: (id) => { getSim().stopAttack(id); sync.stop(id); },
  scoreCustom: (req, overrides) => getSim().scoreCustom(req, overrides),
}));

/** Keep the simulation alive across client-side navigation; start it once per page load. */
export function ensureSimulation() {
  const st = useSim.getState();
  if (!st.running) st.start();
}
