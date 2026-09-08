export type RegionCloseupFeature =
  | 'collaboration'
  | 'research'
  | 'genesis'
  | 'memory'
  | 'compute'
  | 'market'
  | 'security'
  | 'reality'
  | 'energy'
  | 'unknown';

export type RegionCloseupBlueprint = {
  feature: RegionCloseupFeature;
  system: string;
  deck: string;
  assets: readonly string[];
  status: string;
  landmark: string;
  activity: readonly [string, string, string];
  skyline: readonly [number, number, number];
};

/** Agent-first habitats: hardware is the ground they inhabit, never the subject. */
export const regionCloseupBlueprints: readonly RegionCloseupBlueprint[] = [
  {
    feature: 'collaboration',
    system: 'AGENT COMMONS',
    deck: '能力在这里相遇',
    assets: ['RESEARCH', 'RISK', 'AUDIT', 'TRADE'],
    status: '四路能力正在汇聚',
    landmark: '能力穹顶',
    activity: ['REQUEST', 'PROOF', 'USDC'],
    skyline: [18, 27, 38],
  },
  {
    feature: 'research',
    system: 'AGENT OBSERVATORY',
    deck: '观察、求证、形成判断',
    assets: ['BTC', 'ETH', 'NVDA', 'RWA'],
    status: '公开信号正在形成判断',
    landmark: '信号天文台',
    activity: ['MARKET', 'NEWS', 'REPORT'],
    skyline: [22, 34, 46],
  },
  {
    feature: 'genesis',
    system: 'AGENT GENESIS',
    deck: '身份与能力在这里诞生',
    assets: ['IDENTITY', 'SKILL', 'SERVICE', 'STATE'],
    status: '新能力模块正在成型',
    landmark: '身份孵化器',
    activity: ['IDENTITY', 'SKILL', 'MINT'],
    skyline: [16, 30, 43],
  },
  {
    feature: 'memory',
    system: 'AGENT MEMORY',
    deck: '经历成为文明共同的记忆',
    assets: ['TASK 01', 'RESULT 02', 'TRACE 03', 'INDEX 04'],
    status: '任务经验正在写入记忆',
    landmark: '经验档案塔',
    activity: ['TRACE', 'BLOCK', 'INDEX'],
    skyline: [24, 36, 48],
  },
  {
    feature: 'compute',
    system: 'AGENT COMPUTE',
    deck: '算力跟随任务流动',
    assets: ['GPU 0', 'GPU 1', 'VRAM', 'TOKENS'],
    status: '推理负载正在动态分配',
    landmark: '推理冷却环',
    activity: ['QUEUE', 'GPU', 'RESULT'],
    skyline: [28, 42, 56],
  },
  {
    feature: 'market',
    system: 'AGENT EXCHANGE',
    deck: '价值在 Agent 之间流动',
    assets: ['BTC', 'ETH', 'SOL', 'USDT'],
    status: '资产沿结算通道交换',
    landmark: '流动性中庭',
    activity: ['QUOTE', 'SWAP', 'RECEIPT'],
    skyline: [20, 33, 49],
  },
  {
    feature: 'security',
    system: 'AGENT TRUST',
    deck: '每次行动都先通过信任边界',
    assets: ['AUTH', 'AUDIT', 'RISK', 'PROOF'],
    status: '权限与风险边界正在核验',
    landmark: '零信任门廊',
    activity: ['AUTH', 'SCOPE', 'PROOF'],
    skyline: [26, 39, 52],
  },
  {
    feature: 'reality',
    system: 'AGENT / REALITY',
    deck: 'Agent 与现实相互抵达',
    assets: ['NEWS', 'STOCKS', 'RWA', 'X LAYER'],
    status: '现实信号正在进入世界',
    landmark: '现实信号门',
    activity: ['NEWS', 'RWA', 'X LAYER'],
    skyline: [19, 32, 45],
  },
  {
    feature: 'energy',
    system: 'AGENT ENERGY',
    deck: '持续运行的生命脉冲',
    assets: ['POWER', 'THERMAL', 'UPTIME', 'FLOW'],
    status: '能源正在转化为算力',
    landmark: '能源脉冲井',
    activity: ['POWER', 'GAS', 'UPTIME'],
    skyline: [21, 37, 53],
  },
  {
    feature: 'unknown',
    system: 'AGENT FRONTIER',
    deck: '文明仍在发现新的自己',
    assets: ['NODE ?', 'ROUTE ?', 'WORLD ?', 'NEXT'],
    status: '新的节点正在寻找连接',
    landmark: '边疆航标',
    activity: ['NODE ?', 'ROUTE ?', 'NEXT'],
    skyline: [17, 31, 50],
  },
] as const;

export type CloseupSlot = { x: number; y: number; scale: number };

const closeupSlots: readonly CloseupSlot[] = [
  { x: 915, y: 614, scale: 1.34 },
  { x: 700, y: 656, scale: 1.02 },
  { x: 1130, y: 656, scale: 1.02 },
  { x: 785, y: 495, scale: 0.86 },
  { x: 1045, y: 495, scale: 0.86 },
  { x: 1270, y: 575, scale: 0.78 },
] as const;

export function closeupSlot(index: number): CloseupSlot {
  return closeupSlots[index % closeupSlots.length];
}

export function closeupPopulationLimit(width: number) {
  if (!Number.isFinite(width)) return 4;
  return width < 760 ? 4 : 6;
}
