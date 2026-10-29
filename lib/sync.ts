'use client';

import type { AttackKind, Route, ShieldConfig, SiteId } from '@/lib/engine/types';

/**
 * Cross-tab synchronisation over BroadcastChannel (same browser, same origin).
 *
 * Every tab runs its own copy of the simulation; what is shared are the
 * *commands* — launch/stop attack and shield configuration — so a protected
 * site opened in a second tab goes down and recovers in lock-step with the
 * dashboard. A tab that opens later says "hello" and existing tabs reply with
 * the attacks currently running, so it catches up immediately.
 */
export interface AttackCmd {
  siteId: SiteId;
  kind: AttackKind;
  route: Route;
  intensity: number;
  durationSec: number;
  startedAt: number;
}

type Msg =
  | { type: 'hello'; from: string }
  | { type: 'state'; from: string; attacks: AttackCmd[]; config: ShieldConfig }
  | { type: 'launch'; from: string; cmd: AttackCmd }
  | { type: 'stop'; from: string; siteId: SiteId }
  | { type: 'config'; from: string; patch: Partial<ShieldConfig> };

export interface SyncHandlers {
  onLaunch: (cmd: AttackCmd) => void;
  onStop: (siteId: SiteId) => void;
  onConfig: (patch: Partial<ShieldConfig>) => void;
  getState: () => { attacks: AttackCmd[]; config: ShieldConfig };
}

export interface Sync {
  launch: (cmd: AttackCmd) => void;
  stop: (siteId: SiteId) => void;
  config: (patch: Partial<ShieldConfig>) => void;
  hello: () => void;
}

const noop: Sync = { launch: () => {}, stop: () => {}, config: () => {}, hello: () => {} };

export function createSync(h: SyncHandlers): Sync {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return noop;
  const id = Math.random().toString(36).slice(2);
  const ch = new BroadcastChannel('smartshield-sim');
  const post = (m: Msg) => { try { ch.postMessage(m); } catch { /* ignore */ } };

  ch.onmessage = (ev: MessageEvent<Msg>) => {
    const m = ev.data;
    if (!m || m.from === id) return;
    switch (m.type) {
      case 'hello': post({ type: 'state', from: id, ...h.getState() }); break;
      case 'state': for (const a of m.attacks) h.onLaunch(a); h.onConfig(m.config); break;
      case 'launch': h.onLaunch(m.cmd); break;
      case 'stop': h.onStop(m.siteId); break;
      case 'config': h.onConfig(m.patch); break;
    }
  };

  return {
    launch: (cmd) => post({ type: 'launch', from: id, cmd }),
    stop: (siteId) => post({ type: 'stop', from: id, siteId }),
    config: (patch) => post({ type: 'config', from: id, patch }),
    hello: () => post({ type: 'hello', from: id }),
  };
}
