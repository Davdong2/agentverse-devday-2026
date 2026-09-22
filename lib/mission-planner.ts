import type { Agent, Detail, Service } from '@/lib/marketplace';
import type { ComposedMission, MissionStep } from '@/lib/mission';

export type MissionInput = {
  goal: string;
  maxAgents?: number;
  riskMode?: 'confirm-before-action';
  assetSymbol?: string;
  chainId?: string;
  contractAddress?: string;
};

export type MissionCatalog = {
  agents: Agent[];
  details: Record<string, Detail>;
  source: string;
  fetchedAt: string;
  mode: string;
};

type Intent = {
  label: string;
  query: string[];
  capability: string[];
};

const intents: Intent[] = [
  {
    label: '市场研究',
    query: [
      '研究',
      '行情',
      '市场',
      '趋势',
      'btc',
      'eth',
      '情绪',
      '新闻',
      'alpha',
      'research',
      'market',
      'trend',
      'sentiment',
      'news',
    ],
    capability: [
      '研究',
      '行情',
      '趋势',
      '市场',
      '情绪',
      '新闻',
      'alpha',
      'research',
    ],
  },
  {
    label: '风险验证',
    query: [
      '风险',
      '安全',
      '审计',
      '合约',
      '代币',
      'token',
      'honeypot',
      'x layer',
      'risk',
      'security',
      'audit',
      'contract',
    ],
    capability: [
      '风险',
      '安全',
      '审计',
      '合约',
      '代币',
      'token',
      '蜜罐',
      'x layer',
    ],
  },
  {
    label: '链上数据',
    query: [
      '链上',
      '钱包',
      '地址',
      '持仓',
      '资金流',
      'onchain',
      'defi',
      'on-chain',
      'wallet',
      'address',
      'holdings',
    ],
    capability: [
      '链上',
      '钱包',
      '地址',
      '持仓',
      '资金流',
      'onchain',
      'defi',
      'tvl',
    ],
  },
  {
    label: '创意交付',
    query: [
      '品牌',
      '视觉',
      '图片',
      '视频',
      '设计',
      '内容',
      '海报',
      'design',
      'creative',
      'image',
      'video',
      'brand',
      'content',
      'poster',
    ],
    capability: [
      '品牌',
      '视觉',
      '图片',
      '视频',
      '设计',
      '内容',
      '创意',
      'image',
    ],
  },
  {
    label: '执行准备',
    query: [
      '执行',
      '交易',
      '交换',
      'swap',
      '收益',
      '跨链',
      '支付',
      'trade',
      'trading',
      'bridge',
      'payment',
      'yield',
    ],
    capability: [
      '执行',
      '交易',
      '交换',
      'swap',
      '收益',
      '跨链',
      '支付',
      'bridge',
    ],
  },
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function occurrenceScore(text: string, terms: string[]) {
  return terms.reduce(
    (score, term) => score + (text.includes(term) ? 1 : 0),
    0,
  );
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
  const affinity = Object.fromEntries(
    relevant.map((intent) => [
      intent.label,
      occurrenceScore(service.name.toLowerCase(), intent.capability) * 5 +
        occurrenceScore(service.description.toLowerCase(), intent.capability) +
        occurrenceScore(agentText, intent.capability) * 0.25,
    ]),
  );
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'this',
    'that',
    'from',
    'into',
    'please',
    'help',
    'agent',
    'agents',
    'service',
    'services',
    'plan',
    'create',
    'find',
  ]);
  const latinTerms = [
    ...new Set(normalizedGoal.match(/[a-z0-9][a-z0-9._-]{2,}/g) ?? []),
  ].filter((term) => !stopWords.has(term));
  const serviceTerms = new Set(
    serviceText.match(/[a-z0-9][a-z0-9._-]*/g) ?? [],
  );
  const exactMatches = latinTerms.filter((term) =>
    serviceTerms.has(term),
  ).length;
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
    exactMatches,
  };
}

export function normalizeMissionInput(value: unknown): MissionInput & {
  maxAgents: number;
  riskMode: 'confirm-before-action';
} {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('请求必须是 JSON 对象。');
  const input = value as Record<string, unknown>;
  const allowed = new Set([
    'goal',
    'maxAgents',
    'riskMode',
    'assetSymbol',
    'chainId',
    'contractAddress',
  ]);
  const unknownFields = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknownFields.length)
    throw new Error(`不支持的字段：${unknownFields.join('、')}。`);

  if (typeof input.goal !== 'string') throw new Error('缺少字符串字段 goal。');
  const goal = input.goal.trim().replace(/\s+/g, ' ');
  if (goal.length < 4) throw new Error('目标至少需要 4 个字符。');
  if (goal.length > 600) throw new Error('目标不能超过 600 个字符。');

  const maxAgents = input.maxAgents ?? 3;
  if (
    !Number.isInteger(maxAgents) ||
    Number(maxAgents) < 1 ||
    Number(maxAgents) > 4
  )
    throw new Error('maxAgents 必须是 1 到 4 之间的整数。');
  if (
    input.riskMode !== undefined &&
    input.riskMode !== 'confirm-before-action'
  )
    throw new Error('当前只支持执行前确认模式。');

  if (input.assetSymbol !== undefined && typeof input.assetSymbol !== 'string')
    throw new Error('assetSymbol 必须是字符串。');
  const assetSymbol =
    typeof input.assetSymbol === 'string'
      ? input.assetSymbol.trim().toUpperCase()
      : '';
  if (assetSymbol && !/^[A-Z0-9._-]{1,20}$/.test(assetSymbol))
    throw new Error(
      'assetSymbol 只能包含字母、数字、点、短横线或下划线，最长 20 个字符。',
    );

  if (input.chainId !== undefined && typeof input.chainId !== 'string')
    throw new Error('chainId 必须是字符串。');
  const chainId = typeof input.chainId === 'string' ? input.chainId.trim() : '';
  if (chainId && !/^eip155:\d{1,12}$/.test(chainId))
    throw new Error('chainId 必须使用 CAIP-2 格式，例如 eip155:196。');

  if (
    input.contractAddress !== undefined &&
    typeof input.contractAddress !== 'string'
  )
    throw new Error('contractAddress 必须是字符串。');
  const contractAddress =
    typeof input.contractAddress === 'string'
      ? input.contractAddress.trim()
      : '';
  if (contractAddress && !/^0x[a-fA-F0-9]{40}$/.test(contractAddress))
    throw new Error('contractAddress 必须是有效的 EVM 合约地址。');

  return {
    goal,
    maxAgents: Number(maxAgents),
    riskMode: 'confirm-before-action',
    ...(assetSymbol ? { assetSymbol } : {}),
    ...(chainId ? { chainId } : {}),
    ...(contractAddress ? { contractAddress } : {}),
  };
}

export function composeMission(
  input: MissionInput,
  catalog: MissionCatalog,
): ComposedMission {
  const normalized = normalizeMissionInput(input);
  const { goal, maxAgents } = normalized;
  const scoringGoal = [
    goal,
    normalized.assetSymbol,
    normalized.contractAddress ? 'X Layer token 代币 合约 风险' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const candidates = catalog.agents
    .flatMap((agent) =>
      (catalog.details[agent.agentId]?.services ?? []).map((service) => ({
        agent,
        service,
        ...serviceScore(scoringGoal, agent, service),
      })),
    )
    .filter(
      (candidate) => candidate.matches.length > 0 || candidate.exactMatches > 0,
    );

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Number(a.service.price || Number.POSITIVE_INFINITY) -
        Number(b.service.price || Number.POSITIVE_INFINITY) ||
      a.service.serviceId - b.service.serviceId,
  );

  type SelectedCandidate = (typeof candidates)[number] & {
    assignedRole?: string;
  };
  const selected: SelectedCandidate[] = [];
  const usedAgents = new Set<string>();
  for (const intent of activeIntents(scoringGoal)) {
    const candidate = candidates
      .filter(
        (item) =>
          !usedAgents.has(item.agent.agentId) &&
          item.matches.some((match) => match.label === intent.label),
      )
      .sort(
        (a, b) =>
          b.exactMatches - a.exactMatches ||
          (b.affinity[intent.label] ?? 0) - (a.affinity[intent.label] ?? 0) ||
          b.score - a.score,
      )[0];
    if (!candidate) continue;
    selected.push({ ...candidate, assignedRole: intent.label });
    usedAgents.add(candidate.agent.agentId);
    if (selected.length >= maxAgents) break;
  }
  if (selected.length < maxAgents) {
    for (const candidate of candidates) {
      if (usedAgents.has(candidate.agent.agentId)) continue;
      selected.push(candidate);
      usedAgents.add(candidate.agent.agentId);
      if (selected.length >= maxAgents) break;
    }
  }

  if (!selected.length)
    throw new Error(
      '没有找到与当前目标足够相关的 OKX.AI 服务，请补充资产、链或任务类型。',
    );

  const steps = selected.map(
    ({ agent, service, matches, assignedRole }, index): MissionStep => {
      const capabilities = matches.length
        ? [...new Set(matches.map((match) => match.label))]
        : ['通用协作'];
      return {
        order: index + 1,
        agentId: agent.agentId,
        agentName: agent.name,
        serviceId: service.serviceId,
        serviceName: service.name,
        serviceType: service.serviceType,
        price: service.price,
        symbol: service.symbol,
        role:
          assignedRole ??
          (capabilities.length > 1 ? '交叉验证' : capabilities[0]),
        capabilities,
        dependsOn: index === 0 ? [] : [index],
        reason: matches.length
          ? `匹配任务中的${capabilities.slice(0, 2).join('、')}需求。`
          : '作为通用结构化服务补全任务链路。',
        serviceUrl: `https://www.okx.ai/zh-hans/agents/${agent.agentId}`,
      };
    },
  );

  return {
    goal,
    summary: `${steps.length} 个 OKX.AI 服务组成的核对型任务计划`,
    steps,
    request: {
      maxAgents,
      riskMode: normalized.riskMode,
      ...(normalized.assetSymbol
        ? { assetSymbol: normalized.assetSymbol }
        : {}),
      ...(normalized.chainId ? { chainId: normalized.chainId } : {}),
      ...(normalized.contractAddress
        ? { contractAddress: normalized.contractAddress }
        : {}),
    },
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
