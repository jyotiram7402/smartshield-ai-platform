'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { SiteShell, Section, input, label } from '@/components/sites/site-shell';
import { cn, fmt } from '@/lib/utils';

const theme = { primary: 'bg-cyan-700', primaryText: 'text-cyan-700', accent: 'bg-orange-500', soft: 'bg-cyan-50', ring: 'ring-cyan-200' };
const CITIES = ['Pune', 'Mumbai', 'Goa', 'Bengaluru'];
const HOTELS = [
  { id: 'h1', name: 'The Westbank Grand', city: 'Pune', area: 'Koregaon Park', rating: 4.6, reviews: 1842, price: 7200, star: 5, bg: 'from-cyan-700 to-slate-900', amenities: ['Free Wi-Fi', 'Pool', 'Spa', 'Breakfast', 'Gym'], desc: "A landmark five-star hotel on the banks of the Mula-Mutha, minutes from Koregaon Park's restaurants." },
  { id: 'h2', name: 'Hinjawadi Business Suites', city: 'Pune', area: 'Hinjawadi Phase 1', rating: 4.3, reviews: 960, price: 3600, star: 4, bg: 'from-blue-700 to-slate-900', amenities: ['Free Wi-Fi', 'Breakfast', 'Gym', 'Parking'], desc: 'Modern business hotel next to the Rajiv Gandhi Infotech Park, with large work desks in every room.' },
  { id: 'h3', name: 'Lavasa Lakeside Resort', city: 'Pune', area: 'Lavasa', rating: 4.5, reviews: 2210, price: 9800, star: 4, bg: 'from-emerald-700 to-slate-900', amenities: ['Lake view', 'Pool', 'Kids club', 'Breakfast'], desc: 'Hillside resort with lake-facing balconies, 90 minutes from Pune city.' },
  { id: 'h4', name: 'Marine Drive Residency', city: 'Mumbai', area: 'Marine Drive', rating: 4.4, reviews: 3120, price: 11500, star: 5, bg: 'from-violet-700 to-slate-900', amenities: ['Sea view', 'Breakfast', 'Spa', 'Bar'], desc: "Art-deco heritage hotel on the Queen's Necklace with sunset views over the Arabian Sea." },
  { id: 'h5', name: 'BKC Executive Hotel', city: 'Mumbai', area: 'Bandra Kurla Complex', rating: 4.2, reviews: 1480, price: 6900, star: 4, bg: 'from-amber-700 to-slate-900', amenities: ['Free Wi-Fi', 'Breakfast', 'Gym', 'Business centre'], desc: 'Steps from the financial district, with express check-in for corporate travellers.' },
  { id: 'h6', name: 'Palolem Beach Huts', city: 'Goa', area: 'Palolem', rating: 4.7, reviews: 2890, price: 4200, star: 3, bg: 'from-sky-600 to-slate-900', amenities: ['Beachfront', 'Restaurant', 'Yoga deck', 'Bike rental'], desc: 'Eco-friendly beach cottages a few steps from the crescent-shaped Palolem beach.' },
  { id: 'h7', name: 'Candolim Sands Resort', city: 'Goa', area: 'Candolim', rating: 4.4, reviews: 1733, price: 6400, star: 4, bg: 'from-red-700 to-slate-900', amenities: ['Pool', 'Breakfast', 'Bar', 'Spa'], desc: 'Family resort with two pools and a lively beach shack, near Fort Aguada.' },
  { id: 'h8', name: 'Indiranagar Boutique Stay', city: 'Bengaluru', area: 'Indiranagar', rating: 4.5, reviews: 820, price: 4800, star: 4, bg: 'from-green-800 to-slate-900', amenities: ['Free Wi-Fi', 'Breakfast', 'Rooftop cafe', 'Parking'], desc: "A 24-room boutique hotel on 100 Feet Road, surrounded by Bengaluru's best cafes." },
];
const ROOMS = [{ code: 'std', name: 'Standard room', mult: 1, desc: '28 m² · Queen bed · City view' }, { code: 'dlx', name: 'Deluxe room', mult: 1.35, desc: '36 m² · King bed · Premium view · Bathtub' }, { code: 'ste', name: 'Suite', mult: 2.1, desc: '58 m² · Living area · Butler service' }];
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export default function BookingMiniPage() {
  const [city, setCity] = useState('Pune');
  const [checkin, setCheckin] = useState(plus(7));
  const [checkout, setCheckout] = useState(plus(9));
  const [guests, setGuests] = useState(2);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [room, setRoom] = useState<(typeof ROOMS)[number] | null>(null);
  const [guestName, setGuestName] = useState('');
  const [ref, setRef] = useState<string | null>(null);
  const hotel = HOTELS.find((h) => h.id === hotelId);
  const nights = Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 864e5) || 1);
  const list = HOTELS.filter((h) => h.city === city).sort((a, b) => a.price - b.price);
  const Art = ({ h, cls }: { h: (typeof HOTELS)[number]; cls: string }) => <div className={cn('flex items-end rounded-xl bg-gradient-to-br p-3 text-xs text-white', h.bg, cls)}><span>{'★'.repeat(h.star)} <span className="opacity-80">{h.area}</span></span></div>;

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName || !hotel || !room) return;
    setRef('BM' + Date.now().toString(36).toUpperCase().slice(-7));
  }

  return (
    <SiteShell siteId="bookingmini" brand="BookingMini" letter="B" tagline="📞 1800-266-7000 · 24×7 support · ₹ INR · Best price guarantee" theme={theme} nav={[{ label: 'Hotels', href: '#hotels' }, { label: 'Deals', href: '#hotels' }, { label: 'Help', href: '#help' }]} cta={{ label: 'My bookings', href: '#help' }}>
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h1 className="text-4xl font-extrabold md:text-5xl">Find your next stay.</h1>
          <p className="mt-2 text-cyan-100">Hotels, resorts and homestays across India — best price guaranteed.</p>
          <form onSubmit={(e) => { e.preventDefault(); setHotelId(null); setRoom(null); setRef(null); }} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-xl md:grid-cols-5 md:items-end">
            <div><label className={label}>Destination</label><select className={input} value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className={label}>Check-in</label><input className={input} type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
            <div><label className={label}>Check-out</label><input className={input} type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
            <div><label className={label}>Guests</label><select className={input} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">Search hotels</button>
          </form>
        </div>
      </section>

      <Section id="hotels" title={hotel ? hotel.name : `${list.length} properties in ${city}`} subtitle={`${checkin} → ${checkout} · ${nights} night${nights > 1 ? 's' : ''} · ${guests} guest${guests > 1 ? 's' : ''}`}>
        {ref && hotel && room ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="text-3xl">✅</div><h3 className="mt-1 text-xl font-bold text-emerald-900">Booking confirmed — reference {ref}</h3>
            <p className="mt-1 text-sm text-emerald-800">A confirmation has been sent to your email. Free cancellation until {checkin} 12:00.</p>
            <table className="mt-4 w-full text-sm"><tbody>{[['Hotel', `${hotel.name}, ${hotel.area}`], ['Room', room.name], ['Guest', guestName], ['Dates', `${checkin} → ${checkout} (${nights} night${nights > 1 ? 's' : ''})`], ['Room charges', fmt.inr(Math.round(hotel.price * room.mult) * nights)], ['Taxes & fees (12%)', fmt.inr(Math.round(Math.round(hotel.price * room.mult) * nights * 0.12))], ['Total', fmt.inr(Math.round(Math.round(hotel.price * room.mult) * nights * 1.12))]].map(([k, v]) => <tr key={k} className="border-t border-emerald-200/60"><td className="py-1.5 text-emerald-700">{k}</td><td className="py-1.5 text-right font-medium">{v}</td></tr>)}</tbody></table>
            <button type="button" onClick={() => { setRef(null); setRoom(null); setHotelId(null); }} className="mt-4 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">Book another stay</button>
          </div>
        ) : hotel ? (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <button type="button" onClick={() => { setHotelId(null); setRoom(null); }} className="text-sm text-slate-500">← Back to results</button>
              <div className="mt-2"><Art h={hotel} cls="h-72" /></div>
              <p className="mt-3 text-sm text-slate-500">{hotel.area}, {hotel.city} · <span className="text-amber-600"><Star className="inline h-3.5 w-3.5 fill-current" /> {hotel.rating}</span> · {hotel.reviews.toLocaleString('en-IN')} reviews</p>
              <p className="mt-2 text-slate-700">{hotel.desc}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">{hotel.amenities.map((a) => <span key={a} className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs text-cyan-800">{a}</span>)}</p>
              <h3 className="mt-6 font-bold">Choose a room</h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2 text-left">Room</th><th className="px-3 py-2 text-right">Per night</th><th className="px-3 py-2 text-right">{nights} night{nights > 1 ? 's' : ''}</th><th /></tr></thead><tbody>{ROOMS.map((r) => { const pn = Math.round(hotel.price * r.mult); return <tr key={r.code} className={cn('border-t border-slate-100', room?.code === r.code && 'bg-cyan-50')}><td className="px-3 py-2"><strong>{r.name}</strong><div className="text-xs text-slate-500">{r.desc}</div></td><td className="px-3 py-2 text-right">{fmt.inr(pn)}</td><td className="px-3 py-2 text-right font-bold">{fmt.inr(pn * nights)}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => setRoom(r)} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white">Reserve</button></td></tr>; })}</tbody></table></div>
            </div>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
              {room ? (
                <form onSubmit={confirm} className="space-y-3"><h3 className="font-bold">Guest details</h3><p className="text-xs text-slate-500">{room.name} · {fmt.inr(Math.round(hotel.price * room.mult) * nights)} + 12% taxes</p><div><label className={label}>Full name</label><input className={input} value={guestName} onChange={(e) => setGuestName(e.target.value)} required /></div><div><label className={label}>Email</label><input className={input} type="email" required /></div><div><label className={label}>Mobile</label><input className={input} required /></div><button type="submit" className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white">Confirm booking</button></form>
              ) : (
                <><h3 className="font-bold">Your stay</h3><table className="mt-2 w-full text-sm"><tbody>{[['Check-in', checkin], ['Check-out', checkout], ['Guests', String(guests)], ['Nights', String(nights)]].map(([k, v]) => <tr key={k} className="border-t border-slate-100"><td className="py-1.5 text-slate-500">{k}</td><td className="py-1.5 text-right font-medium">{v}</td></tr>)}</tbody></table><p className="mt-3 text-xs text-slate-500">✅ Free cancellation until 24 h before check-in · No prepayment needed.</p><p className="mt-2 text-xs italic text-slate-500">&ldquo;Spotless rooms and a superb breakfast. Will be back.&rdquo; — Priya, Oct 2026</p></>
              )}
            </aside>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((h) => (
              <div key={h.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Art h={h} cls="h-40" />
                <h3 className="mt-3 font-bold">{h.name}</h3>
                <p className="text-xs text-slate-500">{h.area}, {h.city} · <span className="text-amber-600"><Star className="inline h-3 w-3 fill-current" /> {h.rating}</span> ({h.reviews.toLocaleString('en-IN')} reviews)</p>
                <p className="mt-2 flex flex-wrap gap-1">{h.amenities.slice(0, 3).map((a) => <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{a}</span>)}</p>
                <div className="mt-3 flex items-end justify-between"><div><span className="text-xl font-bold">{fmt.inr(h.price)}</span><span className="text-xs text-slate-500"> / night</span><div className="text-xs text-emerald-700">Free cancellation</div></div><button type="button" onClick={() => { setHotelId(h.id); setRoom(null); }} className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white">View rooms</button></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="help" className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">{[['💸 Best price guarantee', "Found it cheaper? We'll match it and give you ₹500 off."], ['🗓️ Free cancellation', 'On most stays, up to 24 hours before check-in.'], ['🎧 24×7 support', 'Real people on the phone, any time of day. 1800-266-7000']].map(([t, d]) => <div key={t} className="rounded-xl border border-slate-200 bg-white p-5"><div className="font-bold">{t}</div><p className="mt-1 text-sm text-slate-500">{d}</p></div>)}</div>
      </Section>
    </SiteShell>
  );
}
