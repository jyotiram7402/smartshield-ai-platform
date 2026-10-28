import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  int: (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n)),
  pct: (n: number, d = 1) => `${(n * 100).toFixed(d)}%`,
  ms: (n: number) => `${Math.round(n)} ms`,
  score: (n: number) => n.toFixed(3),
  time: (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour12: false }),
  inr: (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n),
};

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Small deterministic PRNG (mulberry32) so the showcase looks the same on every run. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const actionColor: Record<string, string> = {
  allow: 'text-cyber-lime',
  challenge: 'text-cyber-amber',
  block: 'text-cyber-red',
};
export const classColor: Record<string, string> = {
  human: 'text-cyber-lime',
  suspicious: 'text-cyber-amber',
  bot: 'text-cyber-red',
};
