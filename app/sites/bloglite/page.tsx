'use client';

import { useState } from 'react';
import { SiteShell, Section, input, label } from '@/components/sites/site-shell';
import { cn } from '@/lib/utils';

const theme = { primary: 'bg-red-700', primaryText: 'text-red-700', accent: 'bg-amber-400', soft: 'bg-red-50', ring: 'ring-red-200' };
const CATS: Record<string, string> = { security: 'Cybersecurity', business: 'Business', startups: 'Startups', technology: 'Technology' };
const POSTS = [
  { id: 1, cat: 'security', title: 'Bots now account for nearly half of all web traffic, new report finds', dek: 'Automated traffic overtook humans for the first time, and a growing share of it is malicious.', author: 'Meera Iyer', date: '22 Oct 2026', read: 5, bg: 'from-blue-900 to-slate-900', body: ['Nearly half of all internet traffic in 2025 came from automated bots rather than people, according to an industry report released this week — the first time in a decade of measurement that automated requests have overtaken human ones.', 'More worrying for website owners is the composition of that traffic. Roughly a third of all requests were classified as "bad bots": scrapers, credential-stuffing tools and inventory-hoarding scripts that imitate browsers to evade simple filters.', 'Small businesses are the most exposed. Enterprise bot-management platforms cost thousands of dollars a month, leaving smaller sites to rely on CAPTCHAs and rate limits that modern bots routinely bypass.', '"The gap between what large companies can afford and what a local retailer can afford has never been wider," one analyst said. Open-source and machine-learning-based defences, she added, are "the most promising route to closing it."'] },
  { id: 2, cat: 'business', title: 'UPI transaction limits raised for hospitals and education', dek: 'The per-transaction cap rises to ₹5 lakh for select categories from next month.', author: 'Arjun Deshpande', date: '21 Oct 2026', read: 3, bg: 'from-emerald-800 to-slate-900', body: ["India's payments regulator has raised the per-transaction limit for UPI payments to hospitals and educational institutions to ₹5 lakh, up from ₹1 lakh, in a move aimed at reducing reliance on cheques and cards for large bills.", 'Banks have been asked to enable the higher limit by the end of next month. Several lenders said they would roll it out in phases, starting with verified merchants.', 'UPI processed more than 16 billion transactions last month, a record, as the platform continues to displace cash for everyday payments.'] },
  { id: 3, cat: 'startups', title: 'Pune AI start-up raises ₹40 crore to automate warehouse inspections', dek: 'The company uses computer vision to flag damaged goods before they ship.', author: 'Sneha Kulkarni', date: '20 Oct 2026', read: 4, bg: 'from-orange-800 to-slate-900', body: ['A Pune-based start-up that uses computer vision to inspect goods on warehouse conveyor belts has raised ₹40 crore in a Series A round led by a Bengaluru venture fund.', 'The four-year-old company says its cameras can detect dents, tears and mislabelled packages at a rate of 1,200 items a minute, with an error rate below 0.5%.', 'The funds will be used to expand its engineering team in Hinjawadi and open a second office in Chennai.'] },
  { id: 4, cat: 'technology', title: 'Why "explainable AI" is becoming a legal requirement, not a nice-to-have', dek: 'Regulators in three jurisdictions now require automated decisions to be explained to the people they affect.', author: 'Meera Iyer', date: '19 Oct 2026', read: 6, bg: 'from-violet-900 to-slate-900', body: ['When a machine-learning model declines a loan, blocks a login or flags a transaction, who can explain why? Increasingly, the law says someone must.', 'New rules in the European Union, and draft guidance in India, require organisations to provide "meaningful information about the logic involved" in automated decisions that significantly affect individuals.', 'Engineers say the requirement is changing how models are built. Ensembles that expose per-feature contributions, and simpler models used alongside deep networks, are replacing black boxes in regulated settings.'] },
  { id: 5, cat: 'security', title: 'Record 7.3 Tbps DDoS attack blocked, provider says', dek: 'The 45-second assault targeted a hosting company and was the largest ever recorded.', author: 'Rahul Menon', date: '18 Oct 2026', read: 3, bg: 'from-red-900 to-slate-900', body: ['A content-delivery network says it mitigated the largest distributed denial-of-service attack ever recorded, a 7.3 terabit-per-second flood that lasted just 45 seconds.', 'The attack originated from more than 120,000 compromised devices across 160 countries, most of them home routers and cameras.', 'Security researchers warn that attacks of this scale are no longer rare, and that mid-sized businesses without automated mitigation are "one bad afternoon away" from an outage.'] },
  { id: 6, cat: 'business', title: 'Three in four small retailers now sell online, survey finds', dek: 'But most say bot traffic and payment fraud are their biggest headaches.', author: 'Arjun Deshpande', date: '17 Oct 2026', read: 4, bg: 'from-teal-800 to-slate-900', body: ['Seventy-four per cent of small retailers in India now sell through their own website or a marketplace, up from 51% three years ago, a survey of 2,400 businesses found.', 'Yet nearly half of respondents reported losing sales to "unexplained" website slowdowns, and a third had been hit by payment fraud in the past year.', 'The survey authors recommend that small businesses invest in basic bot protection and two-factor authentication before expanding their catalogues.'] },
  { id: 7, cat: 'technology', title: 'The open-source security tools every small team should know', dek: 'From reverse proxies to anomaly detectors, protection no longer has to cost a fortune.', author: 'Sneha Kulkarni', date: '15 Oct 2026', read: 7, bg: 'from-blue-800 to-slate-900', body: ['A decade ago, protecting a website from automated abuse meant buying an appliance or paying a per-request fee to a security vendor. Today a small team can assemble a surprisingly capable stack from open-source parts.', 'Reverse proxies handle TLS and rate limiting; anomaly-detection libraries flag unusual request patterns; and lightweight machine-learning models can classify traffic in a few milliseconds on commodity hardware.', 'The catch, practitioners say, is integration: the components exist, but wiring them into a system that is reliable and explainable still takes real engineering.'] },
  { id: 8, cat: 'security', title: 'Banks see 3× rise in credential-stuffing attempts on login pages', dek: 'Leaked password lists are being replayed at scale against net-banking portals.', author: 'Rahul Menon', date: '14 Oct 2026', read: 4, bg: 'from-amber-800 to-slate-900', body: ['Indian banks recorded a threefold increase in credential-stuffing attempts over the past year, according to a security vendor that monitors login traffic for several lenders.', "In a credential-stuffing attack, bots replay username-and-password pairs leaked from other breaches against a target's login page, hoping customers reused passwords.", 'Behavioural detection — looking at request timing, header patterns and navigation sequences rather than just IP addresses — is proving far more effective than blocklists, the vendor said.'] },
];

export default function BlogLitePage() {
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<number | null>(null);
  const [commented, setCommented] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const post = POSTS.find((p) => p.id === open);
  const list = POSTS.filter((p) => cat === 'all' || p.cat === cat);
  const Thumb = ({ p, h }: { p: (typeof POSTS)[number]; h: string }) => <div className={cn('flex items-end rounded-xl bg-gradient-to-br p-3 text-xs font-semibold text-white', p.bg, h)}><span className="rounded bg-white/20 px-2 py-0.5">{CATS[p.cat]}</span></div>;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SiteShell siteId="bloglite" brand="BlogLite" letter="B" tagline={`${today} · Independent reporting on technology, business and cybersecurity`} theme={theme} nav={Object.entries(CATS).map(([k, v]) => ({ label: v, href: '#latest' }))} cta={{ label: 'Subscribe', href: '#subscribe' }}>
      <Section id="latest" className="pt-8">
        <div className="mb-5 flex flex-wrap gap-2">{[['all', 'Latest'], ...Object.entries(CATS)].map(([k, v]) => <button key={k} type="button" onClick={() => { setCat(k); setOpen(null); }} className={cn('rounded-full border px-3 py-1.5 text-sm', cat === k ? 'border-red-700 bg-red-700 text-white' : 'border-slate-300 bg-white')}>{v}</button>)}</div>
        {post ? (
          <article className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <button type="button" onClick={() => setOpen(null)} className="text-sm text-slate-500">← Back to stories</button>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-700">{CATS[post.cat]}</div>
              <h1 className="mt-1 font-serif text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
              <p className="mt-3 text-lg text-slate-600">{post.dek}</p>
              <p className="mt-2 text-xs text-slate-500">By {post.author} · {post.date} · {post.read} min read</p>
              <div className="mt-4"><Thumb p={post} h="h-64" /></div>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-800">{post.body.map((t, i) => <p key={i}>{t}</p>)}</div>
              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold">Comments</h3>
                {commented ? <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Thanks — your comment is awaiting moderation.</div> : (
                  <form onSubmit={(e) => { e.preventDefault(); setCommented(true); }} className="mt-3 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div><label className={label}>Name</label><input className={input} required /></div><div><label className={label}>Email (not published)</label><input className={input} type="email" required /></div></div><div><label className={label}>Comment</label><textarea className={input} rows={3} required /></div><button type="submit" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Post comment</button></form>
                )}
              </div>
            </div>
            <aside><h3 className="border-b-2 border-red-700 pb-1 font-bold">Related</h3>{POSTS.filter((x) => x.cat === post.cat && x.id !== post.id).slice(0, 3).map((x) => <button key={x.id} type="button" onClick={() => { setOpen(x.id); setCommented(false); }} className="block border-b border-slate-200 py-3 text-left"><div className="font-semibold leading-snug">{x.title}</div><div className="text-xs text-slate-500">{x.date}</div></button>)}</aside>
          </article>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <button type="button" onClick={() => setOpen(list[0].id)} className="text-left"><Thumb p={list[0]} h="h-72" /><h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">{list[0].title}</h1><p className="mt-2 text-lg text-slate-600">{list[0].dek}</p><p className="mt-2 text-xs text-slate-500">By {list[0].author} · {list[0].date} · {list[0].read} min read</p></button>
              <div><h3 className="border-b-2 border-red-700 pb-1 font-bold">Latest</h3>{list.slice(1, 6).map((p) => <button key={p.id} type="button" onClick={() => setOpen(p.id)} className="block w-full border-b border-slate-200 py-3 text-left"><div className="font-semibold leading-snug">{p.title}</div><div className="text-xs text-slate-500">{CATS[p.cat]} · {p.date}</div></button>)}</div>
            </div>
            <h2 className="mb-4 mt-12 text-2xl font-bold">More stories</h2>
            <div className="grid gap-6 md:grid-cols-3">{list.slice(1).map((p) => <button key={p.id} type="button" onClick={() => setOpen(p.id)} className="text-left"><Thumb p={p} h="h-40" /><h3 className="mt-3 font-semibold leading-snug">{p.title}</h3><p className="mt-1 text-sm text-slate-500">{p.dek}</p><p className="mt-1 text-xs text-slate-400">{p.author} · {p.date} · {p.read} min</p></button>)}</div>
          </>
        )}
      </Section>

      <Section id="subscribe" className="pt-0">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:flex md:items-center md:justify-between md:gap-6">
          <div><h3 className="text-xl font-bold">The Morning Brief</h3><p className="text-sm text-slate-600">The five stories that matter, in your inbox by 7 am. Free, no spam.</p></div>
          {subscribed ? <div className="mt-3 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 md:mt-0">You're subscribed — check your inbox to confirm.</div> : <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="mt-3 flex gap-2 md:mt-0"><input className={cn(input, 'md:w-64')} type="email" placeholder="you@example.com" required /><button type="submit" className="shrink-0 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Subscribe</button></form>}
        </div>
      </Section>
    </SiteShell>
  );
}
