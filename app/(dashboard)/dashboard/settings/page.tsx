'use client';

import { RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_CONFIG } from '@/lib/engine/ensemble';
import type { ModelId } from '@/lib/engine/types';
import { useSim } from '@/lib/store';
import { cn } from '@/lib/utils';

const MODEL_NAMES: Record<ModelId, string> = { rf: 'Random Forest', if: 'Isolation Forest', ae: 'Autoencoder', lstm: 'LSTM' };

export default function SettingsPage() {
  const cfg = useSim((s) => s.config);
  const setConfig = useSim((s) => s.setConfig);
  const totalW = Object.values(cfg.weights).reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shield policy</CardTitle><CardDescription>Changes apply instantly to every request in the pipeline</CardDescription></CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
              <div><div className="font-semibold">Shield enabled</div><p className="text-xs text-muted-foreground">Off = the gateway forwards everything without scoring (plain reverse proxy).</p></div>
              <Switch checked={cfg.enabled} onCheckedChange={(v) => setConfig({ enabled: v })} label="Shield enabled" />
            </div>
            <label className="block">
              <div className="flex justify-between text-xs"><span>Challenge threshold</span><span className="font-mono text-cyber-amber">{cfg.challengeThreshold.toFixed(2)}</span></div>
              <input type="range" min={0.3} max={0.95} step={0.01} value={cfg.challengeThreshold} onChange={(e) => setConfig({ challengeThreshold: Math.min(Number(e.target.value), cfg.blockThreshold) })} className="mt-1 w-full" />
              <p className="text-[11px] text-muted-foreground">Requests scoring at or above this get a JavaScript proof-of-work challenge (HTTP 202).</p>
            </label>
            <label className="block">
              <div className="flex justify-between text-xs"><span>Block threshold</span><span className="font-mono text-cyber-red">{cfg.blockThreshold.toFixed(2)}</span></div>
              <input type="range" min={0.4} max={0.99} step={0.01} value={cfg.blockThreshold} onChange={(e) => setConfig({ blockThreshold: Math.max(Number(e.target.value), cfg.challengeThreshold) })} className="mt-1 w-full" />
              <p className="text-[11px] text-muted-foreground">Requests scoring at or above this are rejected outright (HTTP 403).</p>
            </label>
            <label className="block">
              <div className="flex justify-between text-xs"><span>Per-IP rate limit</span><span className="font-mono text-cyber-violet">{cfg.perIpRpm} req/min</span></div>
              <input type="range" min={30} max={600} step={10} value={cfg.perIpRpm} onChange={(e) => setConfig({ perIpRpm: Number(e.target.value) })} className="mt-1 w-full" />
              <p className="text-[11px] text-muted-foreground">Coarse first filter applied before the AI engine (HTTP 429).</p>
            </label>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 bg-cyber-lime/60" style={{ width: `${cfg.challengeThreshold * 100}%` }} />
              <div className="absolute inset-y-0 bg-cyber-amber/60" style={{ left: `${cfg.challengeThreshold * 100}%`, width: `${(cfg.blockThreshold - cfg.challengeThreshold) * 100}%` }} />
              <div className="absolute inset-y-0 bg-cyber-red/60" style={{ left: `${cfg.blockThreshold * 100}%`, right: 0 }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>0 · allow</span><span>challenge</span><span>block · 1</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ensemble weights</CardTitle><CardDescription>How much each model counts toward the fused risk score</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {(Object.keys(MODEL_NAMES) as ModelId[]).map((id) => (
              <label key={id} className="block">
                <div className="flex justify-between text-xs"><span>{MODEL_NAMES[id]}</span><span className="font-mono">{cfg.weights[id].toFixed(2)} <span className="text-muted-foreground">({Math.round((100 * cfg.weights[id]) / totalW)}%)</span></span></div>
                <input type="range" min={0} max={1} step={0.05} value={cfg.weights[id]} onChange={(e) => setConfig({ weights: { ...cfg.weights, [id]: Number(e.target.value) } })} className="mt-1 w-full" />
              </label>
            ))}
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {(Object.keys(MODEL_NAMES) as ModelId[]).map((id) => <div key={id} className={cn(id === 'rf' ? 'bg-cyber-teal' : id === 'if' ? 'bg-cyber-violet' : id === 'ae' ? 'bg-cyber-blue' : 'bg-cyber-amber')} style={{ width: `${(100 * cfg.weights[id]) / totalW}%` }} title={MODEL_NAMES[id]} />)}
            </div>
            <p className="text-[11px] text-muted-foreground">Weights are normalised to sum to 1 at inference time. The production defaults (0.40 / 0.20 / 0.20 / 0.20) were chosen on the validation split.</p>
            <Button variant="outline" size="sm" onClick={() => setConfig({ ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } })}><RotateCcw className="h-3.5 w-3.5" />Reset to defaults</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Effective configuration</CardTitle><CardDescription>As served by <span className="font-mono">GET /api/admin/state</span></CardDescription></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-[#060a12] p-3 font-mono text-[11px] leading-relaxed text-cyber-lime">{JSON.stringify({ shield: { enabled: cfg.enabled, blockThreshold: cfg.blockThreshold, challengeThreshold: cfg.challengeThreshold }, rateLimit: { perIpRpm: cfg.perIpRpm }, ensemble: { weights: cfg.weights }, challenge: { ttlSeconds: 600, difficulty: 18 } }, null, 2)}</pre>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-cyber-lime" />Deployment</div>
            <p>Gateway <span className="font-mono">:5000</span> (Node.js · Express · Socket.IO) · AI engine <span className="font-mono">:8000</span> (Python · FastAPI · TensorFlow) · Dashboard <span className="font-mono">:3000</span> (Next.js) · Protected origins <span className="font-mono">:4001–4004</span>.</p>
            <p>Challenge tokens are HMAC-signed and bound to the client IP for 10 minutes. Rate-limit buckets and sessions are pruned every 30 s.</p>
            <p>Model files live in <span className="font-mono">ai-engine/saved_models/</span> and are hot-reloaded with <span className="font-mono">POST /reload</span> after retraining.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
