import type { Agent, Detail } from './marketplace';
import { agentVariant, teamVariants, agentDesigns } from './agent-design';
import { appearance } from './world-model';
export type Point = { x: number; y: number };
export const regions = [
  {
    name: '协作中心',
    en: 'COLLABORATION',
    x: 0.468,
    y: 0.435,
    color: '#eacb82',
    description: '能力在这里相遇，为一次任务组成临时生命体。',
  },
  {
    name: '研究区',
    en: 'RESEARCH',
    x: 0.247,
    y: 0.615,
    color: '#8ecaff',
    description: '吸收信号、财报与数据，形成可验证的判断。',
  },
  {
    name: '创生区',
    en: 'GENESIS',
    x: 0.125,
    y: 0.44,
    color: '#efc79c',
    description: '新的技能与 Agent 在这里诞生。',
  },
  {
    name: '记忆库',
    en: 'MEMORY',
    x: 0.454,
    y: 0.741,
    color: '#bda9ed',
    description: '任务结果沉淀为经验，成为下一次协作的起点。',
  },
  {
    name: '算力站',
    en: 'COMPUTE',
    x: 0.67,
    y: 0.654,
    color: '#87dfe6',
    description: '分配计算资源，为整个世界提供执行能力。',
  },
  {
    name: '交易市场',
    en: 'MARKET',
    x: 0.691,
    y: 0.391,
    color: '#edcb7c',
    description: '资产、流动性与策略在这里交换。',
  },
  {
    name: '安全区',
    en: 'RISK',
    x: 0.569,
    y: 0.226,
    color: '#a4dbbc',
    description: '识别风险、检查权限，为协作提供安全边界。',
  },
  {
    name: '现实入口',
    en: 'REALITY',
    x: 0.852,
    y: 0.503,
    color: '#b1c7f6',
    description: '现实信号进入世界，服务结果返回现实。',
  },
  {
    name: '能源站',
    en: 'ENERGY',
    x: 0.275,
    y: 0.223,
    color: '#f4c678',
    description: '能源转化为算力，支持 Agent 持续工作。',
  },
  {
    name: '未知世界',
    en: 'UNEXPLORED',
    x: 0.881,
    y: 0.842,
    color: '#93a6bb',
    description: '生态扩张时，新的节点与连接逐渐出现。',
  },
];
export const weathers = {
  news: {
    title: '现实信息涌入',
    event: '公开新闻进入研究区',
    note: '研究、风险检查与协作响应这一条信息。角色响应为演示。',
    color: '#A9CDE4',
    asset: 'DATA',
    region: 1,
  },
  nvda: {
    title: '信息风暴',
    event: 'NVIDIA 财报进入现实入口',
    note: '研究、风险、审计和交易能力正向 NVDA 资产核心汇聚。',
    color: '#a5d8ff',
    asset: 'NVDA',
    region: 5,
  },
  storm: {
    title: '波动风暴',
    event: 'BTC 大幅下跌',
    note: '波动环扩散，风险能力进入市场，部分交易路径开始绕行。',
    color: '#f2a06f',
    asset: 'BTC',
    region: 5,
  },
  tide: {
    title: '流动性涨潮',
    event: '大量资金进入市场',
    note: '资金河变宽，资产节点亮起，协作与流动性同步增加。',
    color: '#9cdec8',
    asset: 'USDT',
    region: 5,
  },
  chain: {
    title: '数字大陆生长',
    event: 'X Layer 活跃度上升',
    note: '新平台升起，新桥梁连接市场，更多 Agent 迁入。',
    color: '#b7d8ed',
    asset: 'X LAYER',
    region: 9,
  },
  attack: {
    title: '风险污染',
    event: '协议出现安全事件',
    note: '受影响道路关闭，审计与风险 Agent 进入，其他 Agent 绕行。',
    color: '#f28b85',
    asset: 'RISK',
    region: 6,
  },
  resources: {
    title: '资源循环',
    event: '文明向现实购买能源',
    note: '协作收益流向现实设备，再以能源和算力回到 Agent 世界。',
    color: '#edcf83',
    asset: 'ENERGY',
    region: 8,
  },
  calm: {
    title: '平稳运行',
    event: '世界正在持续协作',
    note: '信息、任务、能力与价值，沿着连接缓慢流动。',
    color: '#a8cfbf',
    asset: 'BTC',
    region: 5,
  },
};
export type Weather = keyof typeof weathers;
export const cycleDuration = 18;
const originalStages = [
  {
    title: '发出能力请求',
    short: '请求',
    start: 0,
    end: 8,
    note: '研究 Agent 需要风险、审计与执行能力。',
  },
  {
    title: '寻找彼此',
    short: '汇聚',
    start: 8,
    end: 18,
    note: '能力相匹配的 Agent 沿数据轨道靠近。',
  },
  {
    title: '模块吸附',
    short: '连接',
    start: 18,
    end: 26,
    note: '标准连接块展开，四种能力开始组合。',
  },
  {
    title: 'Strategy Agent 诞生',
    short: '合体',
    start: 26,
    end: 32,
    note: '临时复合体为这一次任务而诞生。',
  },
  {
    title: '能力依次工作',
    short: '工作',
    start: 32,
    end: 48,
    note: '研究 → 风险 → 审计 → 执行。',
  },
  {
    title: '交付结果核心',
    short: '交付',
    start: 48,
    end: 55,
    note: '一份新的成果离开协作中心，送往现实入口。',
  },
  {
    title: '奖励按贡献分流',
    short: '结算',
    start: 55,
    end: 63,
    note: '演示奖励沿结算轨道返回各参与者。',
  },
  {
    title: '复合体拆分',
    short: '分解',
    start: 63,
    end: 71,
    note: '任务结束，技能块回到各自的 Agent。',
  },
  {
    title: '带着新经验出发',
    short: '成长',
    start: 71,
    end: 80,
    note: '记忆归档，新的技能块被安装，下一次协作开始。',
  },
];
export const stages = originalStages.map((s) => ({
  ...s,
  start: (s.start * 18) / 80,
  end: (s.end * 18) / 80,
}));
export const skillColors = teamVariants.map((v) => agentDesigns[v].color);
export const skillNames = ['研究', '风险', '审计', '交易'];
export function stageAt(time: number) {
  const m = time % cycleDuration;
  const t = m < 0 ? m + cycleDuration : m;
  return stages.findIndex((s) => t >= s.start && t < s.end);
}
export function phaseProgress(time: number) {
  const i = stageAt(time),
    s = stages[i];
  return (
    ((time % cycleDuration < 0
      ? (time % cycleDuration) + cycleDuration
      : time % cycleDuration) -
      s.start) /
    (s.end - s.start)
  );
}
export function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
export function regionFor(a: Agent, d?: Detail) {
  const v = appearance(a, d);
  if (v.role === 5) return 6;
  if (v.role === 0) return /研究/.test(a.description) ? 1 : 5;
  if (v.role === 1) return 5;
  if (v.role === 2) return /记忆|数据/.test(a.description) ? 3 : 4;
  return 2;
}
export function collaborationPose(time: number, index: number): Point {
  const t = ((time % cycleDuration) * 80) / cycleDuration,
    c = regions[0],
    homes = [regions[1], regions[6], regions[3], regions[5]];
  const slots = [
    { x: -0.014, y: -0.011 },
    { x: 0.014, y: -0.011 },
    { x: -0.014, y: 0.014 },
    { x: 0.014, y: 0.014 },
  ];
  const near = { x: c.x + slots[index].x, y: c.y + slots[index].y };
  const far = { x: c.x + slots[index].x * 3.1, y: c.y + slots[index].y * 2.7 };
  const lerp = (a: Point, b: Point, p: number) => ({
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
  });
  if (t < 8) return homes[index];
  if (t < 18) return lerp(homes[index], far, (t - 8) / 10);
  if (t < 26) return lerp(far, near, (t - 18) / 8);
  if (t < 63) return near;
  if (t < 71) return lerp(near, far, (t - 63) / 8);
  return lerp(far, homes[index], (t - 71) / 9);
}

/**
 * Stationary residents occupy deterministic safety rings inside a district.
 * The outer service consoles begin around 3.9 m from a small platform center,
 * so every resident remains inside 3.15 m and leaves the bridge mouths open.
 */
export function residentSlot(
  home: number,
  ordinal: number,
  population: number,
  time: number,
): Point {
  const center = regions[home];
  const innerCount = Math.min(6, population);
  const outerCount = Math.max(1, population - innerCount);
  const outer = ordinal >= innerCount;
  const slot = outer ? ordinal - innerCount : ordinal;
  const count = outer ? outerCount : innerCount;
  const radius = population === 1 ? 1.7 : outer ? 3.1 : 2.05;
  const direction = home % 2 ? 1 : -1;
  const angle =
    home * 0.61 +
    (slot / Math.max(1, count)) * Math.PI * 2 +
    (outer ? Math.PI / 6 : 0) +
    time * 0.008 * direction;
  return {
    x: center.x + (Math.cos(angle) * radius) / 100,
    y: center.y + (Math.sin(angle) * radius * 0.82) / 100,
  };
}
export function liveWeather(change: number): Weather {
  return change <= -2 ? 'storm' : change >= 2 ? 'tide' : 'calm';
}
export type MarketSignal = {
  last: number;
  change: number;
  ts: number;
  source: string;
  mode: 'fresh' | 'cached' | 'stale';
};
export type MemoryRecord = {
  cycle: number;
  agentIds: string[];
  weather: Weather;
  result: string;
  reward: number;
};

export const regionSlugs = [
  'collaboration',
  'research',
  'genesis',
  'memory',
  'compute',
  'market',
  'safety',
  'reality',
  'energy',
  'unknown',
];
export type AgentState = {
  instance: number;
  agentId: string;
  name: string;
  role: number;
  variant: number;
  x: number;
  y: number;
  collaborator: boolean;
  activity: string;
};
export type WorldState = {
  time: number;
  weather: Weather;
  agents: AgentState[];
  stage: number;
  paused: boolean;
};
/** One visible body per source identity; genuine same-name identities are preserved. */
export function worldRoster(agents: Agent[], limit = 50): Agent[] {
  const unique = [...new Map(agents.map((a) => [a.agentId, a])).values()];
  const used = new Set<string>();
  const team = ['2083', '8355', '9626', '8136'].flatMap((id) => {
    const a =
      unique.find((item) => item.agentId === id && !used.has(id)) ??
      unique.find((item) => !used.has(item.agentId));
    if (!a) return [];
    used.add(a.agentId);
    return [a];
  });
  return [...team, ...unique.filter((a) => !used.has(a.agentId))].slice(
    0,
    Math.max(0, limit),
  );
}
export function sampleAgents(
  agents: Agent[],
  details: Record<string, Detail>,
  time: number,
  weather: Weather,
  count = 50,
): AgentState[] {
  const roster = worldRoster(agents, count);
  const homes = roster.map((a, i) => {
    if (i < 4) return 0;
    const visual = appearance(a, details[a.agentId]);
    let home = regionFor(a, details[a.agentId]);
    if (i % 13 === 0) home = 8;
    if (i % 17 === 0) home = 3;
    if (i % 19 === 0) home = 7;
    if (weather === 'chain' && i % 5 === 0) home = 9;
    return home;
  });
  const populations = new Map<number, number>();
  homes.slice(4).forEach((home) =>
    populations.set(home, (populations.get(home) ?? 0) + 1),
  );
  const ordinals = new Map<number, number>();
  return roster.map((a, i) => {
    const visual = appearance(a, details[a.agentId]);
    if (i < 4) {
      const p = collaborationPose(time, i);
      return {
        instance: i,
        agentId: a.agentId,
        name: a.name,
        role: [0, 5, 2, 0][i],
        variant: teamVariants[i],
        x: p.x,
        y: p.y,
        collaborator: true,
        activity: stages[stageAt(time)].title,
      };
    }
    const home = homes[i];
    const ordinal = ordinals.get(home) ?? 0;
    ordinals.set(home, ordinal + 1);
    const base = regions[home];
    const slot = residentSlot(
      home,
      ordinal,
      populations.get(home) ?? 1,
      time,
    );
    let x = slot.x,
      y = slot.y;
    if (i % 4 === 0) {
      const u = (time * 0.028 + seeded(i + 91)) % 1;
      let destination = i % 8 === 0 ? regions[0] : regions[(home + 1) % 9];
      if (weather === 'nvda' && i % 3 === 0) destination = regions[5];
      if (weather === 'news') destination = regions[1];
      if ((weather === 'attack' || weather === 'storm') && visual.role === 5)
        destination = regions[6];
      if (
        weather === 'attack' &&
        visual.role !== 5 &&
        destination === regions[6]
      )
        destination = regions[3];
      x = base.x + (destination.x - base.x) * u;
      y = base.y + (destination.y - base.y) * u - Math.sin(u * Math.PI) * 0.014;
    }
    return {
      instance: i,
      agentId: a.agentId,
      name: a.name,
      role: visual.role,
      variant: agentVariant(a),
      x,
      y,
      collaborator: false,
      activity: i % 4 === 0 ? '移动中' : '工作中',
    };
  });
}

export const regionConnections: [number, number][] = [
  ...regions.slice(1).map((_, i): [number, number] => [0, i + 1]),
  [2, 1],
  [1, 3],
  [3, 4],
  [4, 7],
  [7, 5],
];
export function canWalkAt(x: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (
    regions.some(
      (r, n) =>
        Math.hypot(x - r.x * 100, z - r.y * 100) < (n === 0 ? 10.5 : 5.1),
    )
  )
    return true;
  return regionConnections.some(([a, b]) => {
    const ax = regions[a].x * 100,
      az = regions[a].y * 100;
    const dx = (regions[b].x - regions[a].x) * 100,
      dz = (regions[b].y - regions[a].y) * 100;
    const t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
    );
    return Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.22;
  });
}
