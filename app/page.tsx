import Link from 'next/link';
import { ArrowRight, Brain, Globe2, Layers, Lock, Radar, ShieldCheck, Zap, Activity, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { v: '0.914', l: 'Detection F1-score' },
  { v: '0.970', l: 'ROC-AUC' },
  { v: '2.06%', l: 'False-positive rate' },
  { v: '61%', l: 'Flood traffic deflected' },
  { v: '267 ms', l: 'Median added latency' },
];

const MODELS = [
  { icon: Layers, name: 'Random Forest', w: '40%', d: 'Supervised bot / human classification on the ten behavioural features.' },
  { icon: Radar, name: 'Isolation Forest', w: '20%', d: 'Unsupervised outlier detection — catches novel bots with no labels.' },
  { icon: Brain, name: 'Autoencoder', w: '20%', d: 'Reconstruction error against a learned profile of normal traffic.' },
  { icon: Activity, name: 'LSTM', w: '20%', d: 'Sequence model over each client’s recent requests — timing and order.' },
];

const PIPELINE = ['Rate limit', 'Feature extraction', 'AI scoring', 'Mitigation', 'Log & stream'];

const THREATS = [
  ['Volumetric floods', 'Thousands of requests per second from rotating IPs aimed at taking a site offline.'],
  ['Credential stuffing', 'Leaked username/password pairs replayed against login pages.'],
  ['Scraping & price bots', 'Headless clients harvesting catalogues, prices and content.'],
  ['Vulnerability scanners', 'Automated probes for /wp-admin, /.env and other weak spots.'],
  ['Inventory hoarding', 'Bots adding stock to carts so real customers cannot buy.'],
  ['Fake accounts & spam', 'Scripted sign-ups and comment spam.'],
];

export default function LandingPage() {
  return (
    <main className="grid-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyber-teal to-cyber-lime text-background"><ShieldCheck className="h-5 w-5" /></span>
          SmartShield <span className="text-gradient">AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#models" className="hover:text-foreground">Models</a>
          <a href="#threats" className="hover:text-foreground">Threats</a>
          <Link href="/sites/northbolt" className="hover:text-foreground">Demo sites</Link>
        </nav>
        <Link href="/dashboard"><Button size="sm">Open dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
      </header>

      <section className="container pb-16 pt-14 text-center md:pt-24">
        <Badge variant="default" className="mb-5 normal-case tracking-normal"><Zap className="h-3 w-3" /> Adaptive bot mitigation · four-model ensemble · real-time</Badge>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Stop bots before they reach your site — <span className="text-gradient">and explain every decision.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          SmartShield AI sits in front of your web applications as an intelligent reverse proxy. Every request is scored by Random Forest, Isolation Forest, Autoencoder and LSTM models and is allowed, challenged or blocked in milliseconds — on commodity hardware.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard"><Button size="lg">Launch live dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/dashboard/simulator"><Button size="lg" variant="outline">Run an attack drill</Button></Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-5">
          {STATS.map((s) => (
            <div key={s.l} className="glass rounded-xl p-4">
              <div className="text-2xl font-extrabold text-gradient md:text-3xl">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="container py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Five stages, every request</h2>
          <p className="mt-2 text-sm text-muted-foreground">The in-line pipeline runs in the gateway before a request ever touches the origin.</p>
        </div>
        <ol className="grid gap-3 md:grid-cols-5">
          {PIPELINE.map((p, i) => (
            <li key={p} className="glass relative rounded-xl p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">Stage {i + 1}</div>
              <div className="font-semibold">{p}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  'A per-IP token bucket (120 req/min) absorbs the crudest floods first.',
                  'Ten behavioural features: rate, session age, header anomalies, UA class, cookies, language, referrer, method, challenge, payload.',
                  'Four models score the vector; a weighted ensemble fuses them into one risk score with per-feature contributions.',
                  'Allow below 0.55, challenge with a JS proof-of-work up to 0.85, block above it.',
                  'Every decision is logged and streamed to the dashboard over WebSocket.',
                ][i]}
              </p>
              {i < PIPELINE.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />}
            </li>
          ))}
        </ol>
      </section>

      <section id="models" className="container py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Four models, one verdict</h2>
          <p className="mt-2 text-sm text-muted-foreground">Complementary views of the same request — a bot flagged by any one of them is caught, while isolated false alarms are damped.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {MODELS.map(({ icon: Icon, name, w, d }) => (
            <div key={name} className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></span>
                <Badge variant="secondary">weight {w}</Badge>
              </div>
              <div className="font-semibold">{name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="threats" className="container py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">What it stops</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THREATS.map(([t, d]) => (
            <div key={t} className="glass flex gap-3 rounded-xl p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyber-red" />
              <div><div className="font-semibold">{t}</div><p className="text-xs text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <div className="glass grid items-center gap-6 rounded-2xl p-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">See it protect real-looking sites</h2>
            <p className="mt-2 text-sm text-muted-foreground">A bank, an online store, a news magazine and a hotel-booking site run behind the shield. Launch an attack directly at a site and watch it fall over; launch the same attack through SmartShield and watch it stay up.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {[['northbolt', 'NorthBolt Bank'], ['tinyshop', 'TinyShop'], ['bloglite', 'BlogLite News'], ['bookingmini', 'BookingMini Hotels']].map(([id, n]) => (
                <Link key={id} href={`/sites/${id}`} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted/50"><Globe2 className="mr-1 inline h-3 w-3" />{n}</Link>
              ))}
            </div>
          </div>
          <Link href="/dashboard/sites"><Button size="lg" variant="neon"><Eye className="h-4 w-4" /> Watch the demo</Button></Link>
        </div>
      </section>

      <footer className="container flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-8 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} SmartShield AI · Adaptive Bot Mitigation &amp; Traffic Intelligence System Using Deep Learning</span>
        {process.env.NEXT_PUBLIC_SHOWCASE_NOTE !== 'false' && <span>Interactive showcase build · traffic is simulated</span>}
      </footer>
    </main>
  );
}
