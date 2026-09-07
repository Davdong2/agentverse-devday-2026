import { parseWorldNews, type WorldNews } from '@/lib/world-news';
import seed from '@/lib/world-news-snapshot.json';
import { worldStore } from '@/lib/server-store';
const source = 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  key = 'signals/public-news-v1.json';
let cached: WorldNews | null = null,
  pending: Promise<WorldNews | null> | null = null,
  retryAfter = 0;
function fallback() {
  const data = cached ?? (seed as WorldNews);
  const items = data.items.filter(
    (i) => Date.now() - Date.parse(i.publishedAt) < 172800000,
  );
  return items.length ? { ...data, items, mode: 'stale' as const } : null;
}
async function read() {
  if (!cached)
    try {
      const s = await worldStore()?.get(key);
      if (s) {
        const d = await s.json<WorldNews>();
        if (
          d.source === source &&
          Array.isArray(d.items) &&
          Number.isFinite(Date.parse(d.fetchedAt))
        )
          cached = d;
      }
    } catch {}
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 600000)
    return { ...cached, mode: 'cached' as const };
  if (Date.now() < retryAfter) return fallback();
  try {
    const r = await fetch(source, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/rss+xml, application/xml' },
    });
    if (!r.ok) throw new Error('News upstream');
    const text = await r.text();
    cached = {
      source,
      fetchedAt: new Date().toISOString(),
      mode: 'fresh',
      items: parseWorldNews(text),
    };
    try {
      await worldStore()?.put(key, JSON.stringify(cached));
    } catch {}
    return cached;
  } catch {
    retryAfter = Date.now() + 60000;
    return fallback();
  }
}
export async function GET() {
  if (!pending)
    pending = read().finally(() => {
      pending = null;
    });
  const data = await pending;
  return Response.json(data ?? { error: '公开新闻暂不可用' }, {
    status: data ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
