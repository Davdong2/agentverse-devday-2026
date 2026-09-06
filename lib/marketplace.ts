export type Agent = {
  agentId: string;
  name: string;
  avatar: string;
  description: string;
  score?: string;
  approvalRate: string;
  usageCount: number;
  startingPrice: string;
  priceInterval?: string;
  symbol: string;
  categories: string[];
  categoryName: string[];
  onlineStatus: number;
};
export type Service = {
  serviceId: number;
  name: string;
  description: string;
  price: string;
  symbol: string;
  priceInterval?: string;
  serviceType: string;
};
export type AgentData = {
  source: string;
  fetchedAt: string;
  total: number;
  agents: Agent[];
  mode?: string;
  message?: string;
};
export type Detail = {
  fetchedAt: string;
  total: number;
  services: Service[];
  mode?: string;
};
export const areas = [
  {
    name: '研究台',
    action: '发现机会',
    note: '读取信号，把信息整理成判断。',
    state: '研究',
    ids: ['2083', '7526', '2013', '2135', '6008', '11049', '1828', '4543'],
  },
  {
    name: '风险门',
    action: '风险检查',
    note: '检查合约、权限和风险，让路径继续。',
    state: '验证',
    ids: ['8355', '6087', '9626'],
  },
  {
    name: '交易塔',
    action: '执行任务',
    note: '依据任务要求执行，形成可交付结果。',
    state: '执行',
    ids: ['8136', '11167', '6023', '9486', '6731', '5421', '6211'],
  },
  {
    name: '结算桥',
    action: '确认交付',
    note: '交付结果并核对结算，留下可追溯记录。',
    state: '完成',
    ids: ['2118', '4864'],
  },
];
export function areaFor(a: Agent) {
  const known = areas.findIndex((n) => n.ids.includes(a.agentId));
  if (known >= 0) return known;
  return a.categories.includes('TRADING') || a.categories.includes('FINANCE')
    ? 2
    : 0;
}
export async function readPublicPage(path = '') {
  const res = await fetch('https://www.okx.ai/zh-hans/agents' + path, {
    headers: {
      'User-Agent': 'Agentverse/0.1 public-catalog-reader',
      'Accept-Language': 'zh-CN',
    },
    signal: AbortSignal.timeout(14000),
  });
  if (!res.ok) throw new Error('Marketplace HTTP '+res.status);
  const html = await res.text();
  if (html.length > 4000000) throw new Error('Response too large');
  const match = html.match(
    /<script\b[^>]*\bid=["']appState["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) throw new Error('Marketplace format changed');
  return JSON.parse(match[1])?.appContext?.initialProps;
}
export function normalizeAgent(a: Record<string, unknown>): Agent {
  if (
    !/^\d+$/.test(String(a.agentId)) ||
    typeof a.name !== 'string' ||
    typeof a.description !== 'string' ||
    typeof a.startingPrice !== 'string' ||
    !Number.isFinite(Number(a.usageCount)) ||
    !Array.isArray(a.categories) ||
    !Array.isArray(a.categoryName)
  )
    throw new Error('Invalid catalog');
  let avatar = '';
  try {
    const u = new URL(String(a.avatar));
    if (
      u.protocol === 'https:' &&
      ['static.okx.com', 'static.coinall.ltd'].includes(u.hostname)
    )
      avatar = u.href;
  } catch {}
  return {
    agentId: String(a.agentId),
    name: a.name.slice(0, 200),
    description: a.description.slice(0, 12000),
    avatar,
    score: typeof a.score === 'string' ? a.score : undefined,
    approvalRate: String(a.approvalRate ?? '—'),
    usageCount: Number(a.usageCount),
    startingPrice: a.startingPrice,
    priceInterval:
      typeof a.priceInterval === 'string' ? a.priceInterval : undefined,
    symbol: String(a.symbol ?? 'USDT'),
    categories: a.categories.map(String),
    categoryName: a.categoryName.map(String),
    onlineStatus: Number(a.onlineStatus ?? 0),
  };
}
