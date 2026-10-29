import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = new Set(['flood', 'credstuff', 'scraper', 'scanner', 'hoarder', 'mixed']);
const ROUTES = new Set(['direct', 'shield']);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);

/** Persist a finished attack drill as an incident (no-op without Supabase). */
export async function POST(req: Request) {
  const sb = getSupabase();
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const kind = String(body.kind || ''), route = String(body.route || ''), siteId = String(body.siteId || '').slice(0, 40);
  if (!KINDS.has(kind) || !ROUTES.has(route) || !siteId) return NextResponse.json({ ok: false, error: 'invalid_incident' }, { status: 400 });
  const stats = (body.stats && typeof body.stats === 'object' ? body.stats : {}) as Record<string, unknown>;
  const row = {
    site_id: siteId,
    site_name: String(body.siteName || siteId).slice(0, 80),
    kind, route,
    intensity: num(body.intensity),
    duration_sec: num(body.durationSec),
    started_at: new Date(num(body.startedAt) || Date.now()).toISOString(),
    sent: num(stats.sent), allowed: num(stats.allowed), challenged: num(stats.challenged), blocked: num(stats.blocked), rate_limited: num(stats.rateLimited), served: num(stats.served), shed: num(stats.shed),
    shield_enabled: body.shieldEnabled === true,
  };
  if (!sb) return NextResponse.json({ ok: true, persisted: false, incident: row });
  const { error } = await sb.from('incidents').insert(row);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true });
}

/** Recent incidents (empty without Supabase). */
export async function GET() {
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ persisted: false, incidents: [] });
  const { data, error } = await sb.from('incidents').select('*').order('started_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ persisted: true, error: error.message }, { status: 500 });
  return NextResponse.json({ persisted: true, incidents: data });
}
