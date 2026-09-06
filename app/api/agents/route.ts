import snapshot from '@/lib/agents.json';
import { readPublicPage, normalizeAgent, type AgentData } from '@/lib/marketplace';
import { worldStore } from '@/lib/server-store';
let cached: AgentData | null = null;
const cacheKey = 'catalog/latest.json';
const response = (data: AgentData) => Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const store = worldStore();
  if (!cached && store) {
    try {
      const saved = await store.get(cacheKey);
      if (saved) {
        const data = await saved.json<AgentData>();
        if (Array.isArray(data.agents) && data.agents.length && Number.isFinite(Date.parse(data.fetchedAt))) {
          cached = { ...data, agents: data.agents.map(a => normalizeAgent(a as unknown as Record<string, unknown>)) };
        }
      }
    } catch { /* The bundled snapshot remains available. */ }
  }
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 1200000) return response({ ...cached, mode: 'cached' });
  try {
    const p = await readPublicPage();
    const list = p?.AgentMarketplaceAgentList?.agentList;
    if (!Array.isArray(list?.list) || !list.list.length) throw new Error('Catalog records unavailable');
    const data = { source: snapshot.source, fetchedAt: new Date().toISOString(), total: Number(list.total), agents: list.list.slice(0, 50).map(normalizeAgent) };
    cached = data;
    if (store) {
      try { await store.put(cacheKey, JSON.stringify(data), { httpMetadata: { contentType: 'application/json' } }); }
      catch { console.error('catalog_cache_write_failed'); }
    }
    return response({ ...data, mode: 'fresh' });
  } catch (error) {
    console.error('catalog_sync_failed', error instanceof Error ? error.message : 'Unknown upstream error');
    return response({ ...(cached ?? snapshot), mode: 'snapshot', message: '同步暂不可用，正在显示上次成功读取的真实资料。' });
  }
}
