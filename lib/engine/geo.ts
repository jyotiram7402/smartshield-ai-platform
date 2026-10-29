import { hashStr, rng } from '@/lib/utils';
import type { Country } from './types';

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
];
export const UNKNOWN_COUNTRY: Country = { code: 'XX', name: 'Unknown', flag: '🏳️' };
const byCode = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

const HUMAN_WEIGHTS: [string, number][] = [
  ['IN', 30], ['US', 16], ['GB', 8], ['DE', 6], ['SG', 5], ['AU', 4], ['CA', 4], ['JP', 3], ['FR', 3], ['NL', 2], ['BR', 3], ['ID', 3], ['KR', 2], ['AE', 3],
];
const BOT_WEIGHTS: [string, number][] = [
  ['RU', 16], ['CN', 15], ['VN', 8], ['NG', 6], ['UA', 6], ['BR', 7], ['US', 12], ['NL', 8], ['IN', 6], ['ID', 5], ['DE', 4], ['SG', 3], ['TR', 4],
];

// First octets that are public and look like real ISP / hosting ranges.
const FIRST_OCTETS = [14, 23, 31, 37, 41, 45, 49, 59, 61, 64, 66, 72, 77, 80, 85, 91, 94, 101, 103, 106, 110, 115, 117, 122, 128, 134, 139, 143, 148, 152, 157, 162, 168, 176, 180, 185, 188, 193, 196, 200, 203, 206, 212, 217, 220];

const ipCountry = new Map<string, Country>();

function pickWeighted(r: () => number, weights: [string, number][]) {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [code, w] of weights) {
    x -= w;
    if (x <= 0) return byCode[code];
  }
  return byCode[weights[0][0]];
}

function randomIp(r: () => number) {
  const a = FIRST_OCTETS[Math.floor(r() * FIRST_OCTETS.length)];
  return `${a}.${1 + Math.floor(r() * 254)}.${Math.floor(r() * 256)}.${1 + Math.floor(r() * 253)}`;
}

/** Create a deterministic pool of public IPs, each bound to a country. */
export function makeIpPool(seed: number, n: number, kind: 'human' | 'bot'): string[] {
  const r = rng(seed);
  const out: string[] = [];
  const weights = kind === 'human' ? HUMAN_WEIGHTS : BOT_WEIGHTS;
  while (out.length < n) {
    const ip = randomIp(r);
    if (ipCountry.has(ip)) continue;
    ipCountry.set(ip, pickWeighted(r, weights));
    out.push(ip);
  }
  return out;
}

export function countryForIp(ip: string): Country {
  const known = ipCountry.get(ip);
  if (known) return known;
  return COUNTRIES[hashStr(ip) % COUNTRIES.length] || UNKNOWN_COUNTRY;
}
