import type { Agent, Detail, Service } from '@/lib/marketplace';

export type MissionInput = {
  goal: string;
  maxAgents?: number;
  riskMode?: 'confirm-before-action';
};

export type MissionCatalog = {
  agents: Agent[];
  details: Record<string, Detail>;
  source: string;
  fetchedAt: string;
  mode: string;
};

export type MissionStep = {
  order: number;
  agentId: string;
  agentName: string;
  serviceId: number;
  serviceName: string;
  serviceType: string;
  price: string;
  symbol: string;
  reason: string;
  serviceUrl: string;
};

export type ComposedMission = {
  goal: string;
  summary: string;
  steps: MissionStep[];
  provenance: {
    source: string;
    fetchedAt: string;
    mode: string;
  };
  safety: {
    automaticPayment: false;
    automaticExecution: false;
    note: string;
  };
};

type Intent = {
  label: string;
  query: string[];
  capability: string[];
};

const intents: Intent[] = [
  {
    label: '市场研究',
    query: ['研究', '行情', '市场', '趋势', 'btc', 'eth', '情绪', '新闻', 'alpha'],
    capability: ['研究', '行情', '趋势', '市场', '情绪', '新闻', 'alpha', 'research'],
  },
  {
    label: '风险验证',
    query: ['风险', '安全', '审计', '合约', '代币', 'token', 'honeypot', 'x layer'],
    capability: ['风险', '安全', '审计', '合约', '代币', 'token', '蜜罐', 'x layer'],
  },
  {
    label: '链上数据',
    query: ['链上', '钱包', '地址', '持仓', '资金流', 'onchain', 'defi'],
    capability: ['链上', '钱包', '地址', '持仓', '资金流', 'onchain', 'defi', 'tvl'],
  },
  {
    label: '创意交付',
    query: ['品牌', '视觉', '图片', '视频', '设计', '内容', '海报'],
    capability: ['品牌', '视觉', '图片', '视频', '设计', '内容', '创意', 'image'],
  },
  {
    label: '执行准备',
    query: ['执行', '交易', '交换', 'swap', '收益', '跨链', '支付'],
    capability: ['执行', '交易', '交换', 'swap', '收益', '跨链', '支付', 'bridge'],
  },
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function occurrenceScore(text: string, terms: string[]) {
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function activeIntents(goal: string) {
  const normalized = goal.toLowerCase();
  return intents.filter((intent) => includesAny(normalized, intent.query));
}

function serviceScore(goal: string, agent: Agent, service: Service) {
  const normalizedGoal = goal.toLowerCase();
  const serviceText = `${service.name} ${service.description}`.toLowerCase();
  const agentText = `${agent.name} ${agent.description}`.toLowerCase();
  const relevant = activeIntents(normalizedGoal);
  const serviceMatches = relevant.filter((intent) =>
    includesAny(serviceText, intent.capability),
  );
  const agentMatches = relevant.filter((intent) =>
    includesAny(agentText, intent.capability),
  );
  const matches = serviceMatches.length ? serviceMatches : agentMatches;
  const affinity = Object.fromEntries(relevant.map((intent) => [
    intent.label,
    occurrenceScore(service.name.toLowerCase(), intent.capability) * 5 +
      occurrenceScore(service.description.toLowerCase(), intent.capability) +
      occurrenceScore(agentText, intent.capability) * 0.25,
  ]));
  const latinTerms = normalizedGoal.match(/[a-z0-9][a-z0-9._-]{1,}/g) ?? [];
  const exactMatches = latinTerms.filter((term) => serviceText.includes(term)).length;
  const a2mcp = service.serviceType.toUpperCase() === 'A2MCP';
  return {
    score:
      serviceMatches.length * 14 +
      agentMatches.length * 2 +
      exactMatches * 4 +
      (a2mcp ? 4 : 0) +
      (agent.onlineStatus ? 1 : 0) +
      Math.min(3, Math.log10(Math.max(1, agent.usageCount))),
    matches,
    affinity,
  };
}

export function composeMission(input: MissionInput, catalog: MissionCatalog): ComposedMission {
  const goal = input.goal.trim().replace(/\s+/g, ' ');
  if (goal.length < 4) throw new Error('目标至少需要 4 个字符。');
  if (goal.length > 600) throw new Error('目标不能超过 600 个字符。');
  if (input.riskMode && input.riskMode !== 'confirm-before-action')
    throw new Error('当前只支持执行前确认模式。');

  const maxAgents = Math.min(4, Math.max(1, Math.trunc(input.maxAgents ?? 3)));
  const candidates = catalog.agents.flatMap((agent) =>
    (catalog.details[agent.agentId]?.services ?? []).map((service) => ({
      agent,
      service,
      ...serviceScore(goal, agent, service),
    })),
  );

  candidates.sort((a, b) =>
    b.score - a.score ||
    Number(a.service.price || Number.POSITIVE_INFINITY) -
      Number(b.service.price || Number.POSITIVE_INFINITY) ||
    a.service.serviceId - b.service.serviceId,
  );

  const selected: typeof candidates = [];
  const usedAgents = new Set<string>();
  for (const intent of activeIntents(goal)) {
    const candidate = candidates
      .filter(
        (item) =>
          !usedAgents.has(item.agent.agentId) &&
          item.matches.some((match) => match.label === intent.label),
      )
      .sort((a, b) =>
        (b.affinity[intent.label] ?? 0) - (a.affinity[intent.label] ?? 0) ||
        b.score - a.score,
      )[0];
    if (!candidate) continue;
    selected.push(candidate);
    usedAgents.add(candidate.agent.agentId);
    if (selected.length === maxAgents) break;
  }
  for (const candidate of candidates) {
    if (selected.includes(candidate)) continue;
    if (usedAgents.has(candidate.agent.agentId)) continue;
    selected.push(candidate);
    usedAgents.add(candidate.agent.agentId);
    if (selected.length === maxAgents) break;
  }

  if (!selected.length) throw new Error('当前资料中没有可用于编排的 OKX.AI 服务。');

  const steps = selected.map(({ agent, service, matches }, index): MissionStep => ({
    order: index + 1,
    agentId: agent.agentId,
    agentName: agent.name,
    serviceId: service.serviceId,
    serviceName: service.name,
    serviceType: service.serviceType,
    price: service.price,
    symbol: service.symbol,
    reason: matches.length
      ? `匹配任务中的${matches.slice(0, 2).map((match) => match.label).join('、')}需求。`
      : '作为通用结构化服务补全任务链路。',
    serviceUrl: `https://www.okx.ai/zh-hans/agents/${agent.agentId}`,
  }));

  return {
    goal,
    summary: `${steps.length} 个 OKX.AI 服务组成的核对型任务计划`,
    steps,
    provenance: {
      source: catalog.source,
      fetchedAt: catalog.fetchedAt,
      mode: catalog.mode,
    },
    safety: {
      automaticPayment: false,
      automaticExecution: false,
      note: '本端点只返回计划和可核对链接；购买、付款、订阅、钱包签名和交易必须由用户在下一步明确确认。',
    },
  };
}
