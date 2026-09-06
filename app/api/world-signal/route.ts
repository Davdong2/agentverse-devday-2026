import { worldStore } from '@/lib/server-store';
import type { MarketSignal } from '@/lib/civilization-model';
let cached: MarketSignal | null = null;
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  if (cached && Date.now() - cached.ts < 60000)
    return Response.json({ ...cached, mode: 'cached' }, { headers });
  try {
    const r = await fetch(
      'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) throw new Error('upstream');
    const b = (await r.json()) as {
      code: string;
      data?: { last: string; open24h: string; ts: string }[];
    };
    const v = b.data?.[0];
    if (b.code !== '0' || !v) throw new Error('format');
    const last = Number(v.last),
      open = Number(v.open24h),
      ts = Number(v.ts);
    if (
      !Number.isFinite(last) ||
      last <= 0 ||
      !Number.isFinite(open) ||
      open <= 0 ||
      !Number.isFinite(ts) ||
      ts < 0
    )
      throw new Error('invalid');
    cached = {
      last,
      change: (last / open - 1) * 100,
      ts,
      source: 'https://www.okx.com/zh-hans/trade-spot/btc-usdt',
      mode: Date.now() - ts > 600000 ? 'stale' : 'fresh',
    };
    try {
      await worldStore()?.put('signals/btc.json', JSON.stringify(cached));
    } catch {}
    return Response.json(cached, { headers });
  } catch {
    if (!cached) {
      try {
        const saved = await worldStore()?.get('signals/btc.json');
        if (saved) cached = await saved.json<MarketSignal>();
      } catch {}
    }
    if (cached) return Response.json({ ...cached, mode: 'stale' }, { headers });
    return Response.json(
      { error: '现实信号暂不可用，情景演示仍可探索。' },
      { status: 503, headers },
    );
  }
}
