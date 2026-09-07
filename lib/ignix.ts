import type { Agent } from './marketplace';
export type IgnixToken = {
  address: string;
  name: string;
  symbol: string;
  graduated: boolean;
  url: string;
};
export type IgnixAssociation = {
  agentId: string;
  agentName: string;
  match: 'linked';
  revenueUsd: string | null;
  tokens: IgnixToken[];
};
export type IgnixData = {
  source: string;
  fetchedAt: string;
  mode: 'fresh' | 'cached' | 'snapshot';
  stale?: boolean;
  associations: Record<string, IgnixAssociation>;
  profiles: Agent[];
  message?: string;
};
const address = /^0x[\da-fA-F]{40}$/;
export function normalizeIgnix(
  payload: unknown,
): Record<string, IgnixAssociation> {
  const p = payload as { code?: number; data?: { launches?: unknown[] } };
  if (p?.code !== 200 || !Array.isArray(p.data?.launches))
    throw new Error('IGNIX list unavailable');
  const result: Record<string, IgnixAssociation> = {};
  const seen = new Set<string>();
  for (const item of p.data.launches.slice(0, 5000)) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    const a = t.asp as Record<string, unknown> | undefined;
    if (
      !a ||
      a.matched !== 'linked' ||
      !/^\d{1,15}$/.test(String(a.id)) ||
      typeof t.tokenAddress !== 'string' ||
      !address.test(t.tokenAddress)
    )
      continue;
    const token = t.tokenAddress.toLowerCase();
    if (seen.has(token)) continue;
    seen.add(token);
    const id = String(a.id),
      rev = a.rev;
    const revenue =
      (typeof rev === 'number' || typeof rev === 'string') &&
      /^\d+(\.\d+)?$/.test(String(rev)) &&
      Number.isFinite(Number(rev))
        ? String(rev)
        : null;
    const row = result[id] ?? {
      agentId: id,
      agentName: String(a.name ?? '').slice(0, 200),
      match: 'linked',
      revenueUsd: revenue,
      tokens: [],
    };
    // Revenue is an Agent-level total: never add it again for a second token.
    if (row.revenueUsd !== revenue) row.revenueUsd = null;
    row.tokens.push({
      address: token,
      name: String(t.name ?? '').slice(0, 200),
      symbol: String(t.symbol ?? '').slice(0, 80),
      graduated: t.graduated === true,
      url: 'https://ignix.bot/launch?token=' + token,
    });
    result[id] = row;
  }
  return result;
}
export function mergeIgnixProfiles(
  agents: Agent[],
  profiles: Agent[],
  associations: Record<string, IgnixAssociation>,
) {
  const ids = new Set(agents.map((a) => a.agentId));
  return [
    ...agents,
    ...[...profiles]
      .sort((a, b) => Number(a.agentId) - Number(b.agentId))
      .filter(
        (a) =>
          !!associations[a.agentId] &&
          !ids.has(a.agentId) &&
          (ids.add(a.agentId), true),
      ),
  ];
}
export function hasIgnix(data: IgnixData, id: string) {
  return !!data.associations[id]?.tokens.length;
}
