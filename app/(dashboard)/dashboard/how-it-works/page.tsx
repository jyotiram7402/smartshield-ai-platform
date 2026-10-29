'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Bot, Brain, Cpu, Fingerprint, Gauge, Layers, Radar, Server, ShieldBan, ShieldCheck, ShieldQuestion, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ActionBadge } from '@/components/dashboard/live-log';
import { reputationBadge } from '@/components/dashboard/ip-drawer';
import { FEATURE_LABELS } from '@/lib/engine/features';
import type { Features, RawRequest, TrafficEvent } from '@/lib/engine/types';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

const HUMAN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const BOT_UA = 'python-requests/2.32.3';
type Scorer = (req: RawRequest, overrides?: Partial<Features>) => TrafficEvent;
let run = 0;

/**
 * Score two short sessions with the live engine and return the last decision of each:
 * a visitor browsing the shop for a minute, and a script hammering the home page.
 * Fresh IPs per run so repeated visits do not pile up in the session tracker.
 */
function buildExamples(score: Scorer) {
  const n = run++ % 200;
  const base = Date.now();
  const humanIp = `203.0.113.${10 + n}`;
  const botIp = `185.220.101.${7 + n}`;
  const mk = (over: Partial<RawRequest>): RawRequest => ({
    id: 'ex', ts: base, ip: humanIp, ua: HUMAN_UA, uaClass: 'human', method: 'GET', path: '/', siteId: 'tinyshop', kind: 'human', route: 'shield',
    headers: { accept: true, acceptLanguage: 2, acceptEncoding: true, referer: true, cookie: true }, contentLength: 0, challengeSolved: false, ...over,
  });
  // five pages with irregular pauses over the last minute
  const pages: [number, string][] = [[-58_000, '/'], [-36_000, '/category/shoes'], [-30_000, '/product/p8'], [-11_000, '/product/p8/reviews'], [0, '/cart']];
  let human!: TrafficEvent;
  pages.forEach(([dt, path], i) => {
    human = score(mk({ id: `ex_h${n}_${i}`, ts: base + dt, path, headers: { accept: true, acceptLanguage: 2, acceptEncoding: true, referer: i > 0, cookie: true } }));
  });
  // eight hits on the same URL 120 ms apart, no browser headers, 240 requests in the last minute
  let bot!: TrafficEvent;
  for (let i = 0; i < 8; i++) {
    bot = score(mk({ id: `ex_b${n}_${i}`, ts: base - (7 - i) * 120, ip: botIp, ua: BOT_UA, uaClass: 'bot-known', kind: 'flood', headers: { accept: false, acceptLanguage: 0, acceptEncoding: false, referer: false, cookie: false } }), { request_rate_per_min: 240 });
  }
  return { human, bot };
}

function val(k: keyof Features, v: Features[keyof Features]) {
  if (k === 'session_age_ms') return `${(Number(v) / 1000).toFixed(1)} s`;
  if (k === 'content_length') return `${v} B`;
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

const MODELS = [
  { icon: Layers, name: 'Random Forest · 40%', text: 'Supervised classifier trained on labelled sessions. Weighs the user-agent class heaviest, then request rate, header anomalies, cookies and language headers; a valid challenge token lowers risk by 0.30.' },
  { icon: Radar, name: 'Isolation Forest · 20%', text: 'Unsupervised outlier detector trained on human sessions only. It needs no examples of attacks, so it catches bots that have never been seen before: unusual rates, odd headers, oversized payloads.' },
  { icon: Brain, name: 'Autoencoder · 20%', text: 'Learns to reconstruct normal traffic. A scripted client with no cookie, no language header and a non-browser agent reconstructs badly: high error, high risk.' },
  { icon: Activity, name: 'LSTM · 20%', text: 'Reads the client’s last eight requests as a sequence. Sub-second gaps, machine-like regularity and the same path over and over are the signature of automation, which no single request reveals.' },
];

const VERDICTS = [
  { icon: ShieldCheck, name: 'Allow · HTTP 200', tone: 'text-cyber-lime', text: 'Score below the challenge threshold. The request is proxied to the real site with its score attached as a header; the visitor notices nothing.' },
  { icon: ShieldQuestion, name: 'Challenge · HTTP 202', tone: 'text-cyber-amber', text: 'Borderline score. The gateway returns a small JavaScript proof-of-work page; a real browser solves it in under a second and retries with a signed token (valid 10 min, bound to the IP). Scripts without a JavaScript engine never get past it.' },
  { icon: ShieldBan, name: 'Block · HTTP 403', tone: 'text-cyber-red', text: 'Score at or above the block threshold. Rejected immediately, the explanation is logged, and the origin never sees it.' },
  { icon: Gauge, name: 'Rate-limited · HTTP 429', tone: 'text-cyber-violet', text: 'More than the per-IP budget in a minute. Rejected before any model runs: the cheapest defence against floods.' },
];

const FAQ = [
  ['Can a bot just pretend to be Chrome?', 'It can copy the user-agent string, but it also has to send a browser’s full header set, keep cookies and language headers, browse at a human pace with human-like gaps, and solve the JavaScript challenge. Each of those is a separate feature; faking all of them at hundreds of requests per second is exactly what the ensemble is trained to notice.'],
  ['Why not block everything suspicious?', 'Because that would turn away real customers. Anything in the grey zone is challenged instead of blocked, so a genuine visitor on a privacy browser still gets through. That is why the measured false-positive rate is 2.06%.'],
  ['Why does the direct site go down during an attack?', 'Traffic sent straight to the origin port bypasses the gateway entirely. The site can serve about 25 requests per second; beyond that it sheds load with 503s and its health check reports overloaded. The same attack through SmartShield is stopped at the gateway, so the site stays up.'],
  ['How are bot IP addresses found?', 'Every request is scored on its own behaviour, so a bot is caught on its very first request regardless of its address. Each verdict is then added to that address’s reputation: repeated blocks or rate-limits mark it malicious, and from then on it is rejected before the origin and its rate limit is tightened.'],
];

export default function HowItWorksPage() {
  const m = useSim((s) => s.metrics);
  const events = useSim((s) => s.events);
  const ips = useSim((s) => s.ips);
  const engine = useSim((s) => s.engine);
  const cfg = useSim((s) => s.config);
  const scoreCustom = useSim((s) => s.scoreCustom);
  const [ex, setEx] = useState<ReturnType<typeof buildExamples> | null>(null);

  // scored on the client only (the server has no live engine state)
  useEffect(() => { setEx(buildExamples(scoreCustom)); }, [scoreCustom, cfg]);

  const stopped = m.rateLimited + m.blocked + m.challenged;
  const pct = (n: number) => (m.total ? Math.round((100 * n) / m.total) : 0);
  const rep = { clean: ips.filter((p) => p.reputation === 'clean').length, watch: ips.filter((p) => p.reputation === 'watch').length, malicious: ips.filter((p) => p.reputation === 'malicious').length };
  const worst = ips.filter((p) => p.reputation !== 'clean').sort((a, b) => b.blocked + b.rateLimited - (a.blocked + a.rateLimited)).slice(0, 6);
  const recentBlocks = events.filter((e) => e.decision.action === 'block' || e.decision.rateLimited).slice(0, 5);

  const STAGES = [
    { icon: Gauge, name: 'Incoming', live: `${fmt.int(m.total)} req / min`, text: 'Every request to a protected site enters the gateway at /proxy/<site>/.' },
    { icon: ShieldBan, name: 'Rate limiter', live: `${fmt.int(m.rateLimited)} stopped (429)`, text: `Per-IP token bucket, ${cfg.perIpRpm} req/min. Crude floods never reach the models.` },
    { icon: Fingerprint, name: 'Feature extraction', live: '10 signals / request', text: 'Rate, session age, header anomalies, UA class, cookie, language, referrer, method, challenge token, payload size.' },
    { icon: Cpu, name: 'AI ensemble', live: `4 models · ${engine.avgInferenceMs} ms`, text: 'Random Forest, Isolation Forest, Autoencoder and LSTM each score the request; a weighted fusion gives one risk score from 0 to 1.' },
    { icon: ShieldCheck, name: 'Verdict', live: `${fmt.int(m.allowed)} allow · ${fmt.int(m.challenged)} challenge · ${fmt.int(m.blocked)} block`, text: `Allow below ${cfg.challengeThreshold} · challenge below ${cfg.blockThreshold} · block at ${cfg.blockThreshold} and above.` },
    { icon: Server, name: 'Origin', live: `${fmt.int(m.allowed)} genuine requests served`, text: 'Only allowed requests are proxied to the real site. Bots never touch it.' },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>From request to verdict in about {Math.max(6, Math.round(6 + engine.avgInferenceMs))} ms</CardTitle>
          <CardDescription>The six stages every request goes through, with live counts from the last 60 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {STAGES.map(({ icon: Icon, name, live, text }, i) => (
              <li key={name} className={cn('relative rounded-xl border p-3', i === 3 ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-muted/20')}>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg', i === 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}><Icon className="h-4 w-4" /></span>
                  {i + 1}. {name}
                </div>
                <div className="font-mono text-[11px] text-primary">{live}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{text}</p>
                {i < STAGES.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground xl:block" />}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>A genuine visitor and a scripted bot, scored by the live engine</CardTitle>
            <CardDescription>Same ten features, same four models. The differences in the feature vector are what the models learn to recognise.</CardDescription>
          </CardHeader>
          <CardContent>
            {!ex ? (
              <p className="text-xs text-muted-foreground">Scoring the example requests…</p>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-[1.1fr_1fr_1fr] gap-2 text-xs">
                  <div />
                  <div className="rounded-lg border border-cyber-lime/30 bg-cyber-lime/5 p-2">
                    <div className="flex items-center gap-1.5 font-semibold text-cyber-lime"><UserCheck className="h-3.5 w-3.5" />Genuine visitor</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">Chrome 130 · {ex.human.ip} · GET {ex.human.path}</div>
                  </div>
                  <div className="rounded-lg border border-cyber-red/30 bg-cyber-red/5 p-2">
                    <div className="flex items-center gap-1.5 font-semibold text-cyber-red"><Bot className="h-3.5 w-3.5" />Scripted bot</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{BOT_UA} · {ex.bot.ip} · GET {ex.bot.path}</div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60 text-xs">
                  {(Object.keys(FEATURE_LABELS) as (keyof Features)[]).map((k) => {
                    const a = val(k, ex.human.features[k]);
                    const b = val(k, ex.bot.features[k]);
                    const diff = a !== b;
                    return (
                      <div key={k} className={cn('grid grid-cols-[1.1fr_1fr_1fr] gap-2 border-b border-border/40 px-2 py-1.5 last:border-0', diff && 'bg-muted/30')}>
                        <span className="text-muted-foreground">{FEATURE_LABELS[k]}</span>
                        <span className="font-mono">{a}</span>
                        <span className={cn('font-mono', diff && 'text-cyber-red')}>{b}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-border/60 text-xs">
                  {ex.human.decision.models.map((hm, i) => {
                    const bm = ex.bot.decision.models[i];
                    return (
                      <div key={hm.model} className="grid grid-cols-[1.1fr_1fr_1fr] items-center gap-2 border-b border-border/40 px-2 py-1.5 last:border-0">
                        <span className="text-muted-foreground">{hm.label} <span className="font-mono">w {hm.weight.toFixed(2)}</span></span>
                        <span className="flex items-center gap-2"><Progress value={hm.score * 100} barClassName="bg-cyber-lime" /><span className="w-10 font-mono">{hm.score.toFixed(2)}</span></span>
                        <span className="flex items-center gap-2"><Progress value={bm.score * 100} barClassName="bg-cyber-red" /><span className="w-10 font-mono">{bm.score.toFixed(2)}</span></span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[1.1fr_1fr_1fr] items-center gap-2 bg-muted/30 px-2 py-2 font-semibold">
                    <span>Fused risk and verdict</span>
                    <span className="flex items-center gap-2"><span className="font-mono text-cyber-lime">{ex.human.decision.score.toFixed(3)}</span><ActionBadge e={ex.human} /></span>
                    <span className="flex items-center gap-2"><span className="font-mono text-cyber-red">{ex.bot.decision.score.toFixed(3)}</span><ActionBadge e={ex.bot} /></span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {ex.bot.decision.explanations.slice(0, 3).map((x, i) => <li key={i} className="flex gap-2"><span className="text-cyber-red">▸</span><span>{x}</span></li>)}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live funnel (last 60 s)</CardTitle>
            <CardDescription>What the gateway stops and what reaches the sites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              { label: 'Incoming requests', n: m.total, bar: 'bg-primary' },
              { label: 'Stopped by the rate limiter (429)', n: m.rateLimited, bar: 'bg-cyber-violet' },
              { label: 'Blocked by the AI (403)', n: m.blocked, bar: 'bg-cyber-red' },
              { label: 'Challenged (202)', n: m.challenged, bar: 'bg-cyber-amber' },
              { label: 'Allowed and served by the origin', n: m.allowed, bar: 'bg-cyber-lime' },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between"><span>{r.label}</span><span className="font-mono">{fmt.int(r.n)} · {pct(r.n)}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', r.bar)} style={{ width: `${pct(r.n)}%` }} /></div>
              </div>
            ))}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-center">
              <div className="font-mono text-3xl font-bold text-cyber-lime">{pct(stopped)}%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">of traffic stopped before the origin</div>
            </div>
            <p className="text-[11px] text-muted-foreground">Genuine visitors score low and are allowed. Borderline cases get a JavaScript challenge that a real browser solves automatically. Clear bots are blocked. Measured false-positive rate: 2.06%.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How bot IP addresses are identified</CardTitle>
            <CardDescription>Every request is judged on its behaviour; the address then earns a reputation from the verdicts it keeps collecting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ label: 'clean', n: rep.clean, tone: 'text-cyber-lime' }, { label: 'watch', n: rep.watch, tone: 'text-cyber-amber' }, { label: 'malicious', n: rep.malicious, tone: 'text-cyber-red' }].map((r) => (
                <div key={r.label} className="rounded-lg border border-border/60 bg-muted/20 p-2">
                  <div className={cn('font-mono text-2xl font-bold', r.tone)}>{r.n}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label} IPs</div>
                </div>
              ))}
            </div>
            <ol className="space-y-1.5">
              <li className="flex gap-2"><Badge variant="success">clean</Badge><span>Low scores, allowed through. Most visitors never leave this state.</span></li>
              <li className="flex gap-2"><Badge variant="warning">watch</Badge><span>Challenged twice, or an average risk above 0.45. The gateway keeps challenging until the client proves it runs a real browser.</span></li>
              <li className="flex gap-2"><Badge variant="destructive">malicious</Badge><span>Three or more blocks or rate-limits, or any request scoring 0.85 and above. Further requests are rejected before the origin and the per-IP limit tightens.</span></li>
            </ol>
            {recentBlocks.length > 0 && (
              <div>
                <div className="mb-1 font-semibold">Latest bots stopped</div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  {recentBlocks.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 border-b border-border/40 px-2 py-1.5 last:border-0">
                      <span className="min-w-0 truncate font-mono">{e.country.flag} {e.ip} <span className="text-muted-foreground">· {e.ua.split(' ')[0]} · {e.decision.explanations[0] || e.path}</span></span>
                      <span className="flex shrink-0 items-center gap-2"><span className="font-mono text-cyber-red">{e.decision.score.toFixed(2)}</span><ActionBadge e={e} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {worst.length > 0 && (
              <div>
                <div className="mb-1 font-semibold">Addresses with a reputation</div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  {worst.map((p) => (
                    <div key={p.ip} className="flex items-center justify-between gap-2 border-b border-border/40 px-2 py-1.5 last:border-0">
                      <span className="min-w-0 truncate font-mono">{p.country.flag} {p.ip} <span className="text-muted-foreground">· {p.uaClass} · {p.requests} req</span></span>
                      <span className="flex shrink-0 items-center gap-2"><span className="font-mono text-cyber-red">{p.blocked + p.rateLimited} stopped</span>{reputationBadge(p.reputation)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Rotating addresses does not help an attacker: the user-agent class, the missing browser headers and the burst pattern are scored on every single request, independently of the IP. Botnets reuse their addresses, so reputation catches up within seconds.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What each model looks for</CardTitle>
            <CardDescription>Four complementary views of the same request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {MODELS.map(({ icon: Icon, name, text }) => (
              <div key={name} className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span>
                <div><div className="font-semibold">{name}</div><p className="mt-0.5 text-muted-foreground">{text}</p></div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">The weighted fusion means a request flagged by any one view is caught, while an isolated false alarm from a single model is damped by the other three.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>What happens to each verdict</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-xs sm:grid-cols-2">
            {VERDICTS.map(({ icon: Icon, name, tone, text }) => (
              <div key={name} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className={cn('flex items-center gap-2 font-semibold', tone)}><Icon className="h-4 w-4" />{name}</div>
                <p className="mt-1 text-muted-foreground">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Common questions</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            {FAQ.map(([q, a]) => (
              <div key={q}><div className="font-semibold">{q}</div><p className="mt-0.5 text-muted-foreground">{a}</p></div>
            ))}
            <div>
              <div className="font-semibold">How fast is a decision?</div>
              <p className="mt-0.5 text-muted-foreground">Feature extraction plus four model inferences takes about {engine.avgInferenceMs} ms per request on commodity hardware; the end-to-end latency added by the gateway is a few hundred milliseconds at most.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
