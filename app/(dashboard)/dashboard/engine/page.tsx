'use client';

import { useState } from 'react';
import { ArrowRight, Brain, Cpu, Gauge, Layers, Play, Radar, Server, Activity, SlidersHorizontal, ListFilter, ShieldCheck, ScrollText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { ModelBreakdown } from '@/components/dashboard/model-breakdown';
import { classifyUa, FEATURE_LABELS } from '@/lib/engine/features';
import type { RawRequest, SiteId, TrafficEvent } from '@/lib/engine/types';
import { useSim } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

const UA_PRESETS: { label: string; ua: string }[] = [
  { label: 'Chrome 130 · Windows (browser)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
  { label: 'Safari · iPhone (browser)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1' },
  { label: 'python-requests/2.32.3', ua: 'python-requests/2.32.3' },
  { label: 'curl/8.9.1', ua: 'curl/8.9.1' },
  { label: 'Scrapy/2.11.2', ua: 'Scrapy/2.11.2 (+https://scrapy.org)' },
  { label: 'HeadlessChrome/129', ua: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/129.0.0.0' },
  { label: 'okhttp/4.12.0', ua: 'okhttp/4.12.0' },
  { label: '(no user-agent)', ua: '' },
];
const MODEL_ICON = { rf: Layers, if: Radar, ae: Brain, lstm: Activity } as const;
const STAGES = [
  { icon: Gauge, name: 'Rate limit', d: 'Per-IP token bucket, 120 req/min. Excess → HTTP 429 before any model runs.' },
  { icon: ListFilter, name: 'Feature extraction', d: 'Ten behavioural features from headers, timing and session state.' },
  { icon: Cpu, name: 'AI scoring', d: 'RF · IF · AE · LSTM run in parallel; weighted ensemble → risk 0–1.' },
  { icon: ShieldCheck, name: 'Mitigation', d: 'Allow < 0.55 · challenge < 0.85 · block ≥ 0.85 (configurable).' },
  { icon: ScrollText, name: 'Log & stream', d: 'Decision, features and explanations streamed to this dashboard.' },
];

export default function EnginePage() {
  const engine = useSim((s) => s.engine);
  const cfg = useSim((s) => s.config);
  const last = useSim((s) => s.lastDecision);
  const scoreCustom = useSim((s) => s.scoreCustom);
  const [frozen, setFrozen] = useState<TrafficEvent | null>(null);

  // custom inference form
  const [uaIdx, setUaIdx] = useState(0);
  const [customUa, setCustomUa] = useState('');
  const [rate, setRate] = useState(3);
  const [age, setAge] = useState(45);
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [path, setPath] = useState('/');
  const [siteId, setSiteId] = useState<SiteId>('northbolt');
  const [accept, setAccept] = useState(true);
  const [lang, setLang] = useState(2);
  const [enc, setEnc] = useState(true);
  const [referer, setReferer] = useState(true);
  const [cookie, setCookie] = useState(true);
  const [solved, setSolved] = useState(false);
  const [bytes, setBytes] = useState(0);
  const [result, setResult] = useState<TrafficEvent | null>(null);

  function run() {
    const ua = uaIdx === -1 ? customUa : UA_PRESETS[uaIdx].ua;
    const req: RawRequest = {
      id: `custom_${Date.now().toString(36)}`, ts: Date.now(), ip: '203.0.113.42', ua, uaClass: classifyUa(ua), method, path, siteId, kind: 'human', route: 'shield',
      headers: { accept, acceptLanguage: lang, acceptEncoding: enc, referer, cookie }, contentLength: method === 'POST' ? bytes : 0, challengeSolved: solved,
    };
    setResult(scoreCustom(req, { request_rate_per_min: rate, session_age_ms: age * 1000 }));
  }

  const trace = frozen || last;
  const health = {
    status: 'ok', service: 'smartshield-ai-engine', version: '1.4.2', python: engine.runtime, tensorflow: engine.tensorflow,
    loaded_models: engine.models.filter((m) => m.loaded).map((m) => m.id), weights: cfg.weights, features: engine.featureCount,
    inferences: engine.inferences, avg_latency_ms: engine.avgInferenceMs, uptime_s: engine.uptimeSec,
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Server} label="Engine" value="ONLINE" sub={`${engine.framework} · ${engine.runtime}`} tone="text-cyber-lime" />
        <StatCard icon={Cpu} label="Models loaded" value={`${engine.models.filter((m) => m.loaded).length} / 4`} sub={engine.tensorflow} />
        <StatCard icon={Activity} label="Inferences" value={fmt.int(engine.inferences)} sub={`avg ${engine.avgInferenceMs} ms per request`} />
        <StatCard icon={SlidersHorizontal} label="Features" value={String(engine.featureCount)} sub="behavioural vector per request" />
      </div>

      <Card>
        <CardHeader><CardTitle>Request pipeline</CardTitle><CardDescription>What happens to every request that enters the gateway at <span className="font-mono">/proxy/&lt;site&gt;/</span></CardDescription></CardHeader>
        <CardContent>
          <ol className="grid gap-3 md:grid-cols-5">
            {STAGES.map(({ icon: Icon, name, d }, i) => (
              <li key={name} className={cn('relative rounded-xl border p-3', i === 2 ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-muted/20')}>
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold"><span className={cn('grid h-7 w-7 place-items-center rounded-lg', i === 2 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}><Icon className="h-4 w-4" /></span>{i + 1}. {name}</div>
                <p className="text-[11px] text-muted-foreground">{d}</p>
                {i < STAGES.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.values(FEATURE_LABELS).map((l) => <Badge key={l} variant="outline" className="normal-case tracking-normal">{l}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {engine.models.map((m) => {
          const Icon = MODEL_ICON[m.id];
          return (
            <Card key={m.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span><div><CardTitle>{m.name}</CardTitle><CardDescription className="font-mono">{m.file}</CardDescription></div></div>
                <Badge variant={m.loaded ? 'success' : 'destructive'}>{m.loaded ? 'loaded' : 'missing'}</Badge>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Algorithm</span><span className="text-right">{m.algorithm}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Hyper-params</span><span className="text-right">{m.params}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Trained on</span><span className="text-right">{m.trainedOn}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Version</span><span className="font-mono">{m.version}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Ensemble weight</span><span className="font-mono text-primary">{(m.weight * 100).toFixed(0)}%</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle>Live inference trace</CardTitle><CardDescription>The most recent request scored by the engine</CardDescription></div>
            <Button size="sm" variant={frozen ? 'default' : 'outline'} onClick={() => setFrozen(frozen ? null : last)}>{frozen ? 'Resume live' : 'Freeze'}</Button>
          </CardHeader>
          <CardContent>{trace ? <ModelBreakdown event={trace} /> : <p className="text-xs text-muted-foreground">Waiting for traffic…</p>}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Score a request yourself</CardTitle><CardDescription>Build a request, run it through the four models and read the explanation</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <label className="block"><span className="text-muted-foreground">User-Agent</span>
              <select value={uaIdx} onChange={(e) => setUaIdx(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5">
                {UA_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}<option value={-1}>Custom…</option>
              </select>
              {uaIdx === -1 && <input value={customUa} onChange={(e) => setCustomUa(e.target.value)} placeholder="Paste a user-agent string" className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono" />}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-muted-foreground">Request rate / min: <b className="font-mono text-foreground">{rate}</b></span><input type="range" min={1} max={400} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 w-full" /></label>
              <label className="block"><span className="text-muted-foreground">Session age: <b className="font-mono text-foreground">{age}s</b></span><input type="range" min={0} max={600} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-1 w-full" /></label>
              <label className="block"><span className="text-muted-foreground">Method</span><select value={method} onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"><option>GET</option><option>POST</option></select></label>
              <label className="block"><span className="text-muted-foreground">Path</span><select value={path} onChange={(e) => setPath(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"><option>/</option><option>/login</option><option>/api/products</option><option>/checkout</option><option>/wp-admin/</option><option>/.env</option></select></label>
              <label className="block"><span className="text-muted-foreground">Site</span><select value={siteId} onChange={(e) => setSiteId(e.target.value as SiteId)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"><option value="northbolt">NorthBolt Bank</option><option value="tinyshop">TinyShop</option><option value="bloglite">BlogLite News</option><option value="bookingmini">BookingMini Hotels</option></select></label>
              <label className="block"><span className="text-muted-foreground">Accept-Language count</span><select value={lang} onChange={(e) => setLang(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"><option value={0}>0 (missing)</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
              {method === 'POST' && <label className="block"><span className="text-muted-foreground">Body size (bytes)</span><input type="number" min={0} value={bytes} onChange={(e) => setBytes(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono" /></label>}
            </div>
            <div className="flex flex-wrap gap-3">
              {[['Accept header', accept, setAccept], ['Accept-Encoding', enc, setEnc], ['Referrer', referer, setReferer], ['Cookie', cookie, setCookie], ['Challenge token', solved, setSolved]].map(([l, v, set]) => (
                <label key={String(l)} className="inline-flex items-center gap-1.5"><input type="checkbox" checked={v as boolean} onChange={(e) => (set as unknown as (b: boolean) => void)(e.target.checked)} className="accent-primary" />{String(l)}</label>
              ))}
            </div>
            <Button onClick={run}><Play className="h-4 w-4" /> Run inference</Button>
            {result && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3"><ModelBreakdown event={result} /></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Engine API</CardTitle><CardDescription>FastAPI service on <span className="font-mono">:8000</span> — what the gateway calls for every request</CardDescription></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-xs">
            {[['GET', '/health', 'Loaded models, weights, uptime'], ['POST', '/predict', 'Score one feature vector → risk, class, contributions, explanations'], ['POST', '/batch', 'Score many vectors in one call'], ['GET', '/info', 'Model versions and hyper-parameters'], ['POST', '/reload', 'Hot-reload models from saved_models/ after retraining']].map(([m, p, d]) => (
              <div key={p} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"><Badge variant={m === 'GET' ? 'success' : 'default'}>{m}</Badge><span className="font-mono">{p}</span><span className="ml-auto text-right text-muted-foreground">{d}</span></div>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-[#060a12] p-3 font-mono text-[11px] leading-relaxed text-cyber-lime"><span className="text-muted-foreground">$ curl http://localhost:8000/health</span>{'\n'}{JSON.stringify(health, null, 2)}</pre>
        </CardContent>
      </Card>
    </>
  );
}
