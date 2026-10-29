'use client';

import { useState } from 'react';
import { ArrowRight, Landmark, Lock, Phone, Zap } from 'lucide-react';
import { SiteShell, Section, input, label } from '@/components/sites/site-shell';
import { fmt } from '@/lib/utils';

const theme = { primary: 'bg-blue-900', primaryText: 'text-blue-900', accent: 'bg-amber-400', soft: 'bg-blue-50', ring: 'ring-blue-200' };
const ACCOUNTS = [
  { no: 'XXXX XXXX 2841', type: 'Savings Account', branch: 'Pune — Viman Nagar', balance: 184320.45 },
  { no: 'XXXX XXXX 9930', type: 'Current Account', branch: 'Pune — Viman Nagar', balance: 56210 },
  { no: 'XXXX XXXX 1107', type: 'Fixed Deposit · 7.10% p.a.', branch: 'Matures 15 Mar 2027', balance: 250000 },
];
const TX = [
  ['22 Oct 2026', 'UPI/P2M/Big Basket', 2340, 0, 184320.45], ['21 Oct 2026', 'NEFT CR — SALARY OCT', 0, 96500, 186660.45], ['20 Oct 2026', 'ATM WDL — Viman Nagar', 10000, 0, 90160.45],
  ['19 Oct 2026', 'POS/Reliance Smart', 1875.3, 0, 100160.45], ['18 Oct 2026', 'UPI/P2P/Rohit Sharma', 1200, 0, 102035.75], ['15 Oct 2026', 'Interest credit — Savings', 0, 612.75, 103235.75],
  ['12 Oct 2026', 'EMI — Home Loan 00421', 18450, 0, 102623], ['10 Oct 2026', 'Netflix.com', 649, 0, 121073],
] as const;
const RATES = [['Savings account', '3.50% p.a.'], ['Fixed deposit — 1 year', '6.80% p.a.'], ['Fixed deposit — 3 years', '7.10% p.a.'], ['Home loan', 'from 8.35% p.a.'], ['Car loan', 'from 8.90% p.a.'], ['Personal loan', 'from 10.75% p.a.']];

export default function NorthBoltPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [amount, setAmount] = useState('5000');
  const [bene, setBene] = useState('');

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim().toLowerCase() === 'demo' && pass === 'demo123') { setLoggedIn(true); setErr(null); }
    else setErr('Invalid customer ID or password. For the demo use demo / demo123.');
  }
  function doTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || !bene) return setTransfer('Please enter a beneficiary and a valid amount.');
    setTransfer(`Transfer of ${fmt.inr(amt)} to ${bene} scheduled · reference NB${Date.now().toString().slice(-8)} · an OTP has been sent to your registered mobile.`);
  }

  return (
    <SiteShell siteId="northbolt" brand="NorthBolt Bank" letter="N" tagline="📞 1800-209-0000 (toll-free, 24×7) · Personal and business banking built around you" theme={theme} nav={[{ label: 'Accounts', href: '#accounts' }, { label: 'Products', href: '#products' }, { label: 'Rates', href: '#rates' }, { label: 'Branches', href: '#branches' }]} cta={{ label: loggedIn ? 'My accounts' : 'Net banking login', href: '#accounts' }}>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">New · Instant UPI on all savings accounts</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Banking that moves with you.</h1>
            <p className="mt-4 max-w-lg text-blue-100">Open an account in minutes, send money instantly, and grow your savings with FD rates up to <strong className="text-white">7.10% p.a.</strong></p>
            <div className="mt-6 flex flex-wrap gap-8 text-sm text-blue-100"><span>🏦 1,240 branches</span><span>🏧 9,800 ATMs</span><span>👥 12M customers</span></div>
          </div>
          <div id="accounts" className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            {loggedIn ? (
              <div>
                <div className="flex items-center justify-between"><div><div className="text-xs text-slate-500">Welcome back</div><div className="text-lg font-bold">Jyotiram Kamble</div><div className="text-xs text-slate-500">Customer ID NB-48213076 · last login 22 Oct 18:42</div></div><button type="button" onClick={() => { setLoggedIn(false); setPass(''); }} className="text-xs font-semibold text-blue-800 underline">Logout</button></div>
                <div className="mt-4 space-y-2">{ACCOUNTS.map((a) => <div key={a.no} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><div><div className="text-xs text-slate-500">{a.type}</div><div className="font-mono text-xs">{a.no}</div></div><div className="text-right font-bold">{fmt.inr(a.balance)}</div></div>)}</div>
              </div>
            ) : (
              <form onSubmit={login} className="space-y-3">
                <h2 className="text-lg font-bold">Login to net banking</h2>
                {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>}
                <div><label className={label}>Customer ID / User ID</label><input className={input} value={user} onChange={(e) => setUser(e.target.value)} placeholder="demo" autoComplete="username" /></div>
                <div><label className={label}>Password</label><input className={input} type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></div>
                <button type="submit" className="w-full rounded-lg bg-blue-900 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Login securely</button>
                <p className="text-[11px] text-slate-500"><Lock className="mr-1 inline h-3 w-3" />Never share your password or OTP. Demo: <code>demo</code> / <code>demo123</code></p>
              </form>
            )}
          </div>
        </div>
      </section>

      {loggedIn && (
        <Section title="Recent transactions" subtitle="Savings XXXX XXXX 2841">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2 text-right">Balance</th></tr></thead><tbody>{TX.map((t) => <tr key={t[1] + t[0]} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-500">{t[0]}</td><td className="px-3 py-2">{t[1]}</td><td className="px-3 py-2 text-right">{t[2] ? fmt.inr(t[2]) : '—'}</td><td className="px-3 py-2 text-right text-emerald-700">{t[3] ? fmt.inr(t[3]) : '—'}</td><td className="px-3 py-2 text-right font-medium">{fmt.inr(t[4])}</td></tr>)}</tbody></table></div>
            <form onSubmit={doTransfer} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold">Fund transfer</h3>
              {transfer && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{transfer}</div>}
              <div><label className={label}>Beneficiary name</label><input className={input} value={bene} onChange={(e) => setBene(e.target.value)} placeholder="As per bank records" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className={label}>Amount (₹)</label><input className={input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div><div><label className={label}>Mode</label><select className={input}><option>IMPS (instant)</option><option>NEFT</option><option>RTGS</option><option>UPI</option></select></div></div>
              <button type="submit" className="w-full rounded-lg bg-blue-900 py-2.5 text-sm font-semibold text-white">Continue → verify with OTP</button>
            </form>
          </div>
        </Section>
      )}

      <Section id="products" title="Products for every goal">
        <div className="grid gap-4 md:grid-cols-4">
          {[['Savings account', 'Zero-balance savings with 3.50% interest and free UPI.', Landmark], ['Fixed deposits', 'Lock in up to 7.10% p.a. with flexible tenures.', Lock], ['Home loans', 'From 8.35% p.a. with doorstep documentation.', ArrowRight], ['Credit cards', 'Up to 5% cashback on fuel, groceries and travel.', Zap]].map(([t, d, I]) => {
            const Icon = I as typeof Landmark;
            return <div key={String(t)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-900"><Icon className="h-5 w-5" /></span><h3 className="mt-3 font-bold">{String(t)}</h3><p className="mt-1 text-sm text-slate-500">{String(d)}</p><a href="#accounts" className="mt-3 inline-block text-sm font-semibold text-blue-800">Learn more →</a></div>;
          })}
        </div>
      </Section>

      <Section id="rates" title="Interest rate card" subtitle="Effective 01 Oct 2026. Rates are subject to change." className="pt-0">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm">{RATES.map(([p, r]) => <tbody key={p}><tr className="border-t border-slate-100 first:border-0"><td className="px-4 py-2.5">{p}</td><td className="px-4 py-2.5 text-right font-bold">{r}</td></tr></tbody>)}</table></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Why 12 million customers trust NorthBolt</h3><ul className="mt-3 space-y-3 text-sm text-slate-600"><li><strong className="text-slate-900">Bank-grade security.</strong> Two-factor authentication, device binding and real-time fraud monitoring on every transaction.</li><li><strong className="text-slate-900">Instant everything.</strong> UPI, IMPS and NEFT 24×7 — including bank holidays.</li><li><strong className="text-slate-900">Human support.</strong> <Phone className="inline h-3.5 w-3.5" /> 1800-209-0000 any time, or walk into any of 1,240 branches.</li></ul></div>
        </div>
      </Section>

      <Section id="branches" title="Branches & ATMs" className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {[['Viman Nagar', 'Shop 4, Phoenix Market City Rd, Pune 411014', 'NBOL0002841'], ['Kharadi', 'EON IT Park Gate 2, Pune 411014', 'NBOL0002855'], ['Hinjawadi', 'Phase 1, Rajiv Gandhi Infotech Park, Pune 411057', 'NBOL0002870'], ['Mumbai — Andheri East', 'Chakala, Andheri East, Mumbai 400093', 'NBOL0001102']].map(([n, a, i]) => (
            <div key={n} className="rounded-xl border border-slate-200 bg-white p-4"><div className="font-bold">{n}</div><div className="text-sm text-slate-500">{a}</div><div className="mt-1 text-xs">IFSC <strong>{i}</strong> · Mon–Sat 9:30–16:30 · <span className="text-emerald-700">● Open now</span></div></div>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
