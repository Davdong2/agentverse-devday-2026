import type { Agent, Detail } from './marketplace';
import { appearance } from './world-model';
export type Point = { x: number; y: number };
export const regions = [
  {
    name: '协作核心',
    en: 'COLLABORATION',
    x: 0.464,
    y: 0.486,
    color: '#eacb82',
    description: '能力在这里相遇，为一次任务组成临时生命体。',
  },
  {
    name: '研究域',
    en: 'RESEARCH',
    x: 0.267,
    y: 0.323,
    color: '#8ecaff',
    description: '吸收信号、财报与数据，形成可验证的判断。',
  },
  {
    name: '创生域',
    en: 'GENESIS',
    x: 0.123,
    y: 0.5,
    color: '#efc79c',
    description: '新的技能与 Agent 在这里诞生。',
  },
  {
    name: '记忆域',
    en: 'MEMORY',
    x: 0.449,
    y: 0.259,
    color: '#bda9ed',
    description: '任务结果沉淀为经验，成为下一次协作的起点。',
  },
  {
    name: '算力场',
    en: 'COMPUTE',
    x: 0.651,
    y: 0.254,
    color: '#87dfe6',
    description: '分配计算资源，为整个世界提供执行能力。',
  },
  {
    name: '市场核心',
    en: 'MARKET',
    x: 0.694,
    y: 0.45,
    color: '#edcb7c',
    description: '资产、流动性与策略在这里交换。',
  },
  {
    name: '风险门',
    en: 'RISK',
    x: 0.668,
    y: 0.711,
    color: '#a4dbbc',
    description: '识别风险、检查权限，为协作提供安全边界。',
  },
  {
    name: '现实之门',
    en: 'REALITY',
    x: 0.892,
    y: 0.535,
    color: '#b1c7f6',
    description: '现实信号进入世界，服务结果返回现实。',
  },
  {
    name: '能源场',
    en: 'ENERGY',
    x: 0.273,
    y: 0.738,
    color: '#f4c678',
    description: '能源转化为算力，支持 Agent 持续工作。',
  },
  {
    name: '未知域',
    en: 'UNEXPLORED',
    x: 0.854,
    y: 0.142,
    color: '#93a6bb',
    description: '生态扩张时，新的节点与连接逐渐出现。',
  },
];
export const weathers = {
  nvda: {
    title: '信息风暴',
    event: 'NVIDIA 财报进入现实之门',
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
export const cycleDuration = 80;
export const stages = [
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
    note: '一份新的成果离开协作核心，送往现实之门。',
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
export const skillColors = ['#8ccfff', '#efd17c', '#f0f2ef', '#94d7ad'];
export const skillNames = ['研究', '风险', '审计', '交易'];
export function stageAt(time: number) {
  const t = ((time % cycleDuration) + cycleDuration) % cycleDuration;
  return stages.findIndex((s) => t >= s.start && t < s.end);
}
export function phaseProgress(time: number) {
  const i = stageAt(time),
    s = stages[i];
  return (
    ((((time % cycleDuration) + cycleDuration) % cycleDuration) - s.start) /
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
  const t = time % 80,
    c = regions[0],
    homes = [regions[1], regions[6], regions[3], regions[5]];
  const slots = [
    { x: -0.02, y: -0.009 },
    { x: 0.02, y: -0.009 },
    { x: -0.02, y: 0.026 },
    { x: 0.02, y: 0.026 },
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
