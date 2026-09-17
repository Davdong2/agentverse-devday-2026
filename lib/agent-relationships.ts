import type { Agent, Detail } from './marketplace';

export type RelationshipKind =
  | '协作'
  | '委托'
  | '学习'
  | '信任'
  | '竞合'
  | '转介';

export type AgentDisposition = {
  agentId: string;
  label: string;
  traits: string[];
  capabilities: string[];
  curiosity: number;
  caution: number;
  sociability: number;
  ambition: number;
  reliability: number;
};

export type RelationshipLog = {
  id: string;
  at: number;
  cycle: number;
  region: number;
  mode: 'Demo' | 'LIVE' | '缓存';
  type: RelationshipKind;
  actorIds: [string, string];
  actorNames: [string, string];
  title: string;
  summary: string;
  reason: string;
  capabilities: [string, string];
  traits: [string, string];
  relationDelta: number;
  source: 'profile_inference' | 'a2a_event' | 'onchain_event';
};

export type RelationshipEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  kind: RelationshipKind;
  strength: number;
  interactions: number;
  lastAt: number;
};

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function score(text: string, words: RegExp, seed: number) {
  return clamp(36 + (seed % 35) + (words.test(text) ? 25 : 0));
}

function capabilityNames(agent: Agent, detail?: Detail) {
  const services = detail?.services
    ?.map((service) => service.name.trim())
    .filter(Boolean);
  const categories = agent.categoryName
    .map((name) => name.trim())
    .filter(Boolean);
  return [...new Set([...(services ?? []), ...categories])].slice(0, 4).length
    ? [...new Set([...(services ?? []), ...categories])].slice(0, 4)
    : ['通用任务'];
}

/**
 * A transparent Demo disposition derived from public profile text. It must never
 * be presented as a verified psychological assessment of the service owner.
 */
export function deriveDisposition(
  agent: Agent,
  detail?: Detail,
): AgentDisposition {
  const capabilities = capabilityNames(agent, detail);
  const text = [
    agent.description,
    ...agent.categories,
    ...agent.categoryName,
    ...capabilities,
  ].join(' ');
  const seed = hash(agent.agentId + ':' + text);
  const curiosity = score(
    text,
    /研究|搜索|分析|信息|research|search|data|insight/i,
    seed,
  );
  const caution = score(
    text,
    /风险|安全|审计|检查|risk|security|audit|verify/i,
    seed >>> 3,
  );
  const sociability = score(
    text,
    /社交|协作|连接|社区|social|collab|partner|community/i,
    seed >>> 6,
  );
  const ambition = score(
    text,
    /交易|增长|收益|市场|trade|trading|growth|market|yield/i,
    seed >>> 9,
  );
  const publicScore = Number.parseFloat(agent.score ?? '');
  const reliability = clamp(
    38 +
      (Number.isFinite(publicScore) ? publicScore * 9 : seed % 23) +
      Math.min(14, Math.log10(agent.usageCount + 1) * 4),
  );
  const ranked = [
    ['探索', curiosity],
    ['审慎', caution],
    ['协作', sociability],
    ['行动', ambition],
    ['可靠', reliability],
  ] as const;
  const traits = [...ranked]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);
  return {
    agentId: agent.agentId,
    label: traits.join(' · ') + '型',
    traits,
    capabilities,
    curiosity,
    caution,
    sociability,
    ambition,
    reliability,
  };
}

function pairScore(a: AgentDisposition, b: AgentDisposition, cycle: number) {
  const overlap = a.capabilities.some((name) => b.capabilities.includes(name));
  const complement = overlap ? 7 : 24;
  const socialFit = (a.sociability + b.sociability) / 12;
  const trust = (a.reliability + b.reliability) / 18;
  const exploration = Math.abs(a.curiosity - b.caution) < 28 ? 8 : 2;
  return (
    complement +
    socialFit +
    trust +
    exploration +
    (hash(`${cycle}:${a.agentId}:${b.agentId}`) % 1000) / 100
  );
}

function relationshipType(
  a: AgentDisposition,
  b: AgentDisposition,
): RelationshipKind {
  const sameCapability = a.capabilities.some((name) =>
    b.capabilities.includes(name),
  );
  if (sameCapability && Math.max(a.ambition, b.ambition) > 70) return '竞合';
  if (a.curiosity > 70 && b.caution > 65) return '委托';
  if (Math.abs(a.reliability - b.reliability) > 24) return '学习';
  if (a.reliability + b.reliability > 155) return '信任';
  if (a.sociability + b.sociability > 135) return '转介';
  return '协作';
}

function actionFor(kind: RelationshipKind) {
  return {
    协作: '组合能力，共同处理一项任务',
    委托: '把需要复核的部分交给对方',
    学习: '交换一次工作方法与经验',
    信任: '建立一条可重复调用的可信连接',
    竞合: '在相近目标上比较方案并共享结果',
    转介: '把适合的任务与能力转给对方',
  }[kind];
}

export function createRelationshipLog(
  agents: Agent[],
  details: Record<string, Detail>,
  cycle: number,
  at: number,
  regionForAgent: (agent: Agent, detail?: Detail) => number,
): RelationshipLog | null {
  const unique = [
    ...new Map(agents.map((agent) => [agent.agentId, agent])).values(),
  ];
  if (unique.length < 2) return null;
  const dispositions = new Map(
    unique.map((agent) => [
      agent.agentId,
      deriveDisposition(agent, details[agent.agentId]),
    ]),
  );
  const actorIndex = hash(`cycle:${cycle}`) % unique.length;
  const actor = unique[actorIndex];
  const actorDisposition = dispositions.get(actor.agentId)!;
  const candidates = unique
    .filter((candidate) => candidate.agentId !== actor.agentId)
    .map((candidate) => ({
      candidate,
      disposition: dispositions.get(candidate.agentId)!,
      score: pairScore(
        actorDisposition,
        dispositions.get(candidate.agentId)!,
        cycle,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.candidate.agentId.localeCompare(b.candidate.agentId),
    );
  const partner = candidates[0].candidate;
  const partnerDisposition = candidates[0].disposition;
  const kind = relationshipType(actorDisposition, partnerDisposition);
  const actorCapability =
    actorDisposition.capabilities[cycle % actorDisposition.capabilities.length];
  const partnerCapability =
    partnerDisposition.capabilities[
      (cycle + 1) % partnerDisposition.capabilities.length
    ];
  const relationDelta = Math.max(
    2,
    Math.min(9, Math.round(candidates[0].score / 10)),
  );
  return {
    id: `relationship-${cycle}-${actor.agentId}-${partner.agentId}-${kind}`,
    at,
    cycle,
    region: regionForAgent(actor, details[actor.agentId]),
    mode: 'Demo',
    type: kind,
    actorIds: [actor.agentId, partner.agentId],
    actorNames: [actor.name, partner.name],
    title: `${actor.name} 与 ${partner.name} 建立${kind}关系`,
    summary: `${actor.name} 以“${actorCapability}”发起，${partner.name} 用“${partnerCapability}”响应；双方${actionFor(kind)}。`,
    reason: `公开资料推导的演示性格分别偏${actorDisposition.traits.join('、')}与${partnerDisposition.traits.join('、')}，两项能力在本轮匹配中互补。`,
    capabilities: [actorCapability, partnerCapability],
    traits: [actorDisposition.label, partnerDisposition.label],
    relationDelta,
    source: 'profile_inference',
  };
}

export function buildRelationshipGraph(
  logs: RelationshipLog[],
): RelationshipEdge[] {
  const edges = new Map<string, RelationshipEdge>();
  for (const log of [...logs].reverse()) {
    const ids = [...log.actorIds].sort();
    const key = `${ids[0]}:${ids[1]}:${log.type}`;
    const existing = edges.get(key);
    if (existing) {
      existing.interactions += 1;
      existing.strength = Math.min(100, existing.strength + log.relationDelta);
      existing.lastAt = Math.max(existing.lastAt, log.at);
    } else {
      edges.set(key, {
        id: key,
        sourceId: log.actorIds[0],
        targetId: log.actorIds[1],
        sourceName: log.actorNames[0],
        targetName: log.actorNames[1],
        kind: log.type,
        strength: log.relationDelta,
        interactions: 1,
        lastAt: log.at,
      });
    }
  }
  return [...edges.values()].sort((a, b) => b.lastAt - a.lastAt);
}

export function relationshipExport(logs: RelationshipLog[], fetchedAt: string) {
  return {
    schema: 'agentverse.relationship-events.v1',
    exportedAt: new Date().toISOString(),
    dataMode: 'mixed',
    sourceProfileSnapshot: {
      provider: 'OKX.AI / verified IGNIX associations',
      fetchedAt,
    },
    behaviorNotice:
      'Events marked Demo are autonomous simulations derived from public profile capabilities. They are not verified agent actions, payments, or transactions.',
    relationships: buildRelationshipGraph(logs),
    events: logs,
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function relationshipCsv(logs: RelationshipLog[]) {
  const headers = [
    'id',
    'time',
    'mode',
    'type',
    'actor_1_id',
    'actor_1_name',
    'actor_2_id',
    'actor_2_name',
    'capability_1',
    'capability_2',
    'relation_delta',
    'summary',
    'reason',
    'source',
  ];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.at).toISOString(),
    log.mode,
    log.type,
    log.actorIds[0],
    log.actorNames[0],
    log.actorIds[1],
    log.actorNames[1],
    log.capabilities[0],
    log.capabilities[1],
    log.relationDelta,
    log.summary,
    log.reason,
    log.source,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
