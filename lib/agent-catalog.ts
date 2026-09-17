import snapshot from '@/lib/agents.json';
import { normalizeAgent, readPublicPage, type AgentData } from '@/lib/marketplace';
import { worldStore } from '@/lib/server-store';

const cacheKey = 'catalog/latest.json';
const freshnessMs = 20 * 60 * 1000;
const failureCooldownMs = 60 * 1000;

let memoryCache: AgentData | null = null;
let inflight: Promise<AgentData> | null = null;
let refreshBlockedUntil = 0;

function bundledCatalog(): AgentData {
  return {
    ...(snapshot as AgentData),
    mode: 'snapshot',
    message: '实时目录暂不可用，正在使用最后核验的服务快照。',
  };
}

function normalizeStored(data: AgentData): AgentData | null {
  if (!Array.isArray(data.agents) || !data.agents.length) return null;
  if (!Number.isFinite(Date.parse(data.fetchedAt))) return null;
  return {
    source: data.source,
    fetchedAt: data.fetchedAt,
    total: Number(data.total),
    agents: data.agents.map((agent) =>
      normalizeAgent(agent as unknown as Record<string, unknown>),
    ),
  };
}

async function loadStoredCatalog() {
  if (memoryCache) return;
  const store = worldStore();
  if (!store) return;
  try {
    const saved = await store.get(cacheKey);
    if (!saved) return;
    const normalized = normalizeStored(await saved.json<AgentData>());
    if (normalized) memoryCache = normalized;
  } catch {
    // The bundled verified snapshot remains available.
  }
}

async function refreshCatalog(): Promise<AgentData> {
  const page = await readPublicPage();
  const list = page?.AgentMarketplaceAgentList?.agentList;
  if (!Array.isArray(list?.list) || !list.list.length)
    throw new Error('Catalog records unavailable');

  const data: AgentData = {
    source: (snapshot as AgentData).source,
    fetchedAt: new Date().toISOString(),
    total: Number(list.total),
    agents: list.list.slice(0, 50).map(normalizeAgent),
  };
  memoryCache = data;
  refreshBlockedUntil = 0;

  const store = worldStore();
  if (store) {
    try {
      await store.put(cacheKey, JSON.stringify(data), {
        httpMetadata: { contentType: 'application/json' },
      });
    } catch {
      console.error('catalog_cache_write_failed');
    }
  }
  return { ...data, mode: 'fresh' };
}

export async function getAgentCatalog(): Promise<AgentData> {
  await loadStoredCatalog();
  if (memoryCache && Date.now() - Date.parse(memoryCache.fetchedAt) < freshnessMs)
    return { ...memoryCache, mode: 'cached' };

  if (Date.now() < refreshBlockedUntil) {
    if (memoryCache)
      return {
        ...memoryCache,
        mode: 'stale-cache',
        message: '实时目录同步正在冷却，正在使用上次成功读取的资料。',
      };
    return bundledCatalog();
  }

  inflight ??= refreshCatalog();
  try {
    return await inflight;
  } catch (error) {
    refreshBlockedUntil = Date.now() + failureCooldownMs;
    console.error(
      'catalog_sync_failed',
      error instanceof Error ? error.message : 'Unknown upstream error',
    );
    if (memoryCache)
      return {
        ...memoryCache,
        mode: 'stale-cache',
        message: '实时同步暂不可用，正在显示上次成功读取的真实资料。',
      };
    return bundledCatalog();
  } finally {
    inflight = null;
  }
}
