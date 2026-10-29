'use client';

import { useMemo, useState } from 'react';
import { ShoppingCart, Star, Truck } from 'lucide-react';
import { SiteShell, Section, input, label } from '@/components/sites/site-shell';
import { cn, fmt } from '@/lib/utils';

const theme = { primary: 'bg-emerald-600', primaryText: 'text-emerald-700', accent: 'bg-rose-500', soft: 'bg-emerald-50', ring: 'ring-emerald-200' };
const CATS = [['all', 'All'], ['kitchen', 'Kitchen'], ['home', 'Home & Living'], ['decor', 'Decor'], ['gifts', 'Gifts']];
const PRODUCTS = [
  { id: 'p1', name: 'Hand-thrown ceramic mug (350 ml)', cat: 'kitchen', price: 549, mrp: 699, rating: 4.6, reviews: 312, emoji: '☕', bg: 'bg-amber-100' },
  { id: 'p2', name: 'Acacia wood cutting board', cat: 'kitchen', price: 1299, mrp: 1799, rating: 4.8, reviews: 540, emoji: '🪵', bg: 'bg-orange-100' },
  { id: 'p3', name: 'Linen tea towels (set of 3)', cat: 'kitchen', price: 799, mrp: 999, rating: 4.4, reviews: 128, emoji: '🧺', bg: 'bg-sky-100' },
  { id: 'p4', name: 'Beeswax pillar candle', cat: 'decor', price: 449, mrp: 549, rating: 4.7, reviews: 211, emoji: '🕯️', bg: 'bg-yellow-100' },
  { id: 'p5', name: 'Brass wall key holder', cat: 'home', price: 899, mrp: 1199, rating: 4.5, reviews: 96, emoji: '🔑', bg: 'bg-violet-100' },
  { id: 'p6', name: 'Terracotta planter with saucer', cat: 'decor', price: 650, mrp: 850, rating: 4.3, reviews: 74, emoji: '🪴', bg: 'bg-green-100' },
  { id: 'p7', name: 'Cotton throw blanket', cat: 'home', price: 1899, mrp: 2499, rating: 4.6, reviews: 388, emoji: '🧶', bg: 'bg-rose-100' },
  { id: 'p8', name: 'Cast-iron skillet 26 cm', cat: 'kitchen', price: 2199, mrp: 2999, rating: 4.9, reviews: 1021, emoji: '🍳', bg: 'bg-slate-200' },
  { id: 'p9', name: 'Scented soy candle gift box', cat: 'gifts', price: 1199, mrp: 1499, rating: 4.7, reviews: 266, emoji: '🎁', bg: 'bg-pink-100' },
  { id: 'p10', name: 'Leather passport wallet', cat: 'gifts', price: 1499, mrp: 1999, rating: 4.5, reviews: 158, emoji: '👝', bg: 'bg-amber-200' },
  { id: 'p11', name: 'Framed botanical print A3', cat: 'decor', price: 1099, mrp: 1399, rating: 4.4, reviews: 61, emoji: '🖼️', bg: 'bg-emerald-100' },
  { id: 'p12', name: 'Bamboo desk organiser', cat: 'home', price: 749, mrp: 949, rating: 4.2, reviews: 44, emoji: '🗂️', bg: 'bg-lime-100' },
];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export default function TinyShopPage() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<string[]>([]);
  const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [orderRef, setOrderRef] = useState('');

  const list = useMemo(() => PRODUCTS.filter((p) => (cat === 'all' || p.cat === cat) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))), [cat, q]);
  const lines = useMemo(() => { const m: Record<string, number> = {}; for (const id of cart) m[id] = (m[id] || 0) + 1; return Object.entries(m).map(([id, qty]) => ({ p: byId[id], qty })); }, [cart]);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !address) return;
    setOrderRef('TS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000));
    setStep('done');
    setCart([]);
  }

  return (
    <SiteShell siteId="tinyshop" brand="TinyShop" letter="T" tagline="🚚 Free delivery on orders over ₹999 · 7-day easy returns · care@tinyshop.example" theme={theme} nav={[{ label: 'Shop', href: '#shop' }, { label: 'Deals', href: '#shop' }, { label: 'Help', href: '#help' }]} cta={{ label: `🛒 Cart (${cart.length})`, href: '#cart' }}>
      <section className="bg-gradient-to-br from-emerald-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Festive sale · up to 30% off</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Thoughtfully made things for your home.</h1>
            <p className="mt-4 max-w-lg text-slate-600">Small-batch kitchenware, decor and gifts from independent makers across India.</p>
            <div className="mt-6 flex max-w-md gap-2"><input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for mugs, candles, boards…" /><a href="#shop" className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Search</a></div>
          </div>
          <div className="grid grid-cols-2 gap-3">{PRODUCTS.slice(0, 4).map((p) => <div key={p.id} className={cn('grid h-36 place-items-center rounded-2xl text-6xl', p.bg)}>{p.emoji}</div>)}</div>
        </div>
      </section>

      <Section id="shop" title="Shop" subtitle={`${list.length} products`}>
        <div className="mb-5 flex flex-wrap gap-2">{CATS.map(([id, n]) => <button key={id} type="button" onClick={() => setCat(id)} className={cn('rounded-full border px-3 py-1.5 text-sm', cat === id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-slate-700')}>{n}</button>)}</div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={cn('grid h-36 place-items-center rounded-lg text-6xl', p.bg)}>{p.emoji}</div>
                <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
                <div className="mt-1 text-xs text-amber-600"><Star className="inline h-3 w-3 fill-current" /> {p.rating} <span className="text-slate-400">({p.reviews})</span></div>
                <div className="mt-2 flex items-center justify-between"><div><span className="text-lg font-bold">{fmt.inr(p.price)}</span> <span className="text-xs text-slate-400 line-through">{fmt.inr(p.mrp)}</span></div><button type="button" onClick={() => { setCart([...cart, p.id]); setStep('cart'); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Add</button></div>
              </div>
            ))}
            {!list.length && <p className="text-sm text-slate-500">No products matched. Try another search.</p>}
          </div>

          <aside id="cart" className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
            <h3 className="flex items-center gap-2 font-bold"><ShoppingCart className="h-4 w-4" />Your cart</h3>
            {step === 'done' ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><div className="text-2xl">✅</div><strong>Thank you, {name}!</strong> Order <strong>{orderRef}</strong> is confirmed and will be delivered to {address} within 3–5 days.<button type="button" onClick={() => setStep('cart')} className="mt-2 block text-xs underline">Continue shopping</button></div>
            ) : !lines.length ? (
              <p className="mt-2 text-sm text-slate-500">Your cart is empty.</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-slate-100 text-sm">{lines.map((l) => <li key={l.p.id} className="flex items-center justify-between py-2"><span className="truncate pr-2">{l.p.name} × {l.qty}</span><span className="flex items-center gap-2"><span className="font-medium">{fmt.inr(l.p.price * l.qty)}</span><button type="button" onClick={() => setCart(cart.filter((x) => x !== l.p.id))} className="text-xs text-slate-400 hover:text-red-600">✕</button></span></li>)}</ul>
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{fmt.inr(subtotal)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{shipping ? fmt.inr(shipping) : 'Free'}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>{fmt.inr(subtotal + shipping)}</span></div></div>
                {step === 'cart' ? (
                  <button type="button" onClick={() => setStep('checkout')} className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white">Proceed to checkout</button>
                ) : (
                  <form onSubmit={placeOrder} className="mt-4 space-y-3">
                    <div><label className={label}>Full name</label><input className={input} value={name} onChange={(e) => setName(e.target.value)} required /></div>
                    <div><label className={label}>Delivery address</label><input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no., street, city, PIN" required /></div>
                    <div><label className={label}>Payment</label><select className={input}><option>UPI</option><option>Credit / debit card</option><option>Cash on delivery</option></select></div>
                    <button type="submit" className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white">Place order · {fmt.inr(subtotal + shipping)}</button>
                  </form>
                )}
                <p className="mt-2 text-[11px] text-slate-500">🔒 Payments secured with 256-bit encryption.</p>
              </>
            )}
          </aside>
        </div>
      </Section>

      <Section id="help" className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {[['🚚 Free delivery', 'On every order over ₹999, anywhere in India.'], ['↩️ 7-day returns', 'Return any item within 7 days of delivery. Pickup is free.'], ['💬 Customer care', 'care@tinyshop.example · 1800-123-4567 (9am–9pm)']].map(([t, d]) => <div key={t} className="rounded-xl border border-slate-200 bg-white p-5"><div className="font-bold">{t}</div><p className="mt-1 text-sm text-slate-500">{d}</p></div>)}
        </div>
        <p className="mt-4 text-xs text-slate-400"><Truck className="mr-1 inline h-3 w-3" />Delivery by {new Date(Date.now() + 3 * 864e5).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} for orders placed today.</p>
      </Section>
    </SiteShell>
  );
}
