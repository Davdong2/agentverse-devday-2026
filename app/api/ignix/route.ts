import seed from '@/lib/ignix-snapshot.json';
import {
  normalizeIgnix,
  retainIgnixProfiles,
  type IgnixData,
} from '@/lib/ignix';
import { readPublicPage, normalizeAgent, type Agent } from '@/lib/marketplace';
import { worldStore } from '@/lib/server-store';
let cached: IgnixData | null = null,
  pending: Promise<IgnixData> | null = null,
  retryAfter = 0;
const TTL = 1200000,
  key = 'ignix/associations-v1.json';
const categoryNames: Record<string, string> = {
  ART_CREATION: '艺术创作',
  FINANCE: '金融',
  LIFESTYLE: '生活',
  TRADING: '交易',
  SOFTWARE_SERVICES: '软件服务',
};
async function sync(): Promise<IgnixData> {
  const store = worldStore();
  if (!cached && store) {
    try {
      const saved = await store.get(key);
      if (saved) {
        const d = await saved.json<IgnixData>();
        if (
          d.source === seed.source &&
          Number.isFinite(Date.parse(d.fetchedAt)) &&
          d.associations &&
          Array.isArray(d.profiles)
        )
          cached = d;
      }
    } catch {}
  }
  if (cached)
    cached = {
      ...cached,
      ...retainIgnixProfiles(
        cached.associations,
        [],
        cached,
        seed as IgnixData,
        cached.fetchedAt,
      ),
    };
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < TTL)
    return { ...cached, mode: 'cached' };
  if (Date.now() < retryAfter)
    return {
      ...(cached ?? (seed as IgnixData)),
      mode: 'cached',
      stale: true,
      message: 'IGNIX 同步暂不可用，保留上次关联记录。',
    };
  try {
    const response = await fetch(seed.source, {
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('IGNIX upstream');
    const associations = normalizeIgnix(await response.json());
    const ids = Object.keys(associations).slice(0, 24);
    const profiles: Agent[] = [];
    // These profiles are sourced separately from OKX.AI, never synthesized from token metadata.
    for (let i = 0; i < ids.length; i += 4) {
      await Promise.all(
        ids.slice(i, i + 4).map(async (id) => {
          try {
            const p = await readPublicPage('/' + id),
              d = p?.AgentDetailPage,
              o = d?.overview;
            if (String(o?.agentId) !== id) throw new Error('Identity mismatch');
            const categories = Array.isArray(o.categories) ? o.categories : [];
            profiles.push(
              normalizeAgent({
                ...o,
                startingPrice: String(o.serviceLowestFee ?? ''),
                symbol: d.services?.list?.[0]?.symbol ?? '',
                categoryName: categories.map(
                  (c: string) => categoryNames[c] ?? c,
                ),
              }),
            );
          } catch {
            /* Unavailable profiles are not fabricated or substituted. */
          }
        }),
      );
    }
    const fetchedAt = new Date().toISOString();
    const data: IgnixData = {
      source: seed.source,
      fetchedAt,
      mode: 'fresh',
      associations,
      ...retainIgnixProfiles(
        associations,
        profiles,
        cached,
        seed as IgnixData,
        fetchedAt,
      ),
    };
    cached = data;
    if (store)
      try {
        await store.put(key, JSON.stringify(data), {
          httpMetadata: { contentType: 'application/json' },
        });
      } catch {}
    return data;
  } catch {
    retryAfter = Date.now() + 60000;
    return {
      ...(cached ?? (seed as IgnixData)),
      mode: 'cached',
      stale: true,
      message: 'IGNIX 同步暂不可用，保留上次关联记录。',
    };
  }
}
export async function GET() {
  if (!pending)
    pending = sync().finally(() => {
      pending = null;
    });
  return Response.json(await pending, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
