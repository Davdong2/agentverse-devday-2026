/** Shared choreography only: these are conceptual crypto workflows, never submitted transactions. */
export const cryptoTasks = [
  {
    name: '协作结算',
    asset: 'USDC',
    prop: '任务合约 · 结果核心',
    steps: ['组合能力', '交付结果', '分配演示报酬'],
    color: '#b89853',
  },
  {
    name: '链上研究',
    asset: 'BTC',
    prop: '行情柱 · 数据透镜',
    steps: ['接收信号', '交叉分析', '生成研究片'],
    color: '#6b9cb5',
  },
  {
    name: 'Agent 身份',
    asset: 'ID',
    prop: '身份种子 · 能力接口',
    steps: ['装入身份', '连接能力', '启动分身'],
    color: '#bd9978',
  },
  {
    name: '链上记忆',
    asset: 'HASH',
    prop: '哈希书页 · 回执档案',
    steps: ['整理回执', '连接区块', '归档记忆'],
    color: '#9884b5',
  },
  {
    name: '执行队列',
    asset: 'TX',
    prop: '交易包 · 执行槽',
    steps: ['任务排队', '批次执行', '返回回执'],
    color: '#70a5aa',
  },
  {
    name: '资产交换',
    asset: 'ETH / USDC',
    prop: '双资产池 · 结算轨道',
    steps: ['读取报价', '交换资产块', '生成交换回执'],
    color: '#b39a60',
  },
  {
    name: '授权检查',
    asset: 'AUTH',
    prop: '权限环 · 验证盾',
    steps: ['读取授权范围', '检查访问权限', '返回检查结果'],
    color: '#77a58a',
  },
  {
    name: '现实预言机',
    asset: 'DATA',
    prop: '数据门户 · 信号封装器',
    steps: ['接收外部信号', '标记数据来源', '送入研究区'],
    color: '#839ec2',
  },
  {
    name: 'Gas 补给',
    asset: 'GAS',
    prop: '能源格 · 算力晶体',
    steps: ['预估执行资源', '补充能源格', '支持下一次执行'],
    color: '#c4a45f',
  },
  {
    name: '跨域连接',
    asset: 'X LAYER',
    prop: '连接种子 · 新节点',
    steps: ['发现新节点', '核对连接信息', '展开探索路径'],
    color: '#879fad',
  },
];
export const cryptoLoadouts = [
  {
    name: '交换执行装',
    gear: '双资产托盘 · 结算腰环',
    action: '搬运资产块，连接交换路径',
    glyph: '⇄',
    color: '#b69a59',
  },
  {
    name: '信号研究装',
    gear: '数据透镜 · 行情扫描片',
    action: '扫描数据，整理研究片',
    glyph: '◈',
    color: '#74a6c0',
  },
  {
    name: '协议接口装',
    gear: '接口肩块 · 回执卡槽',
    action: '拼接接口，封装任务回执',
    glyph: '⌘',
    color: '#8fa6ae',
  },
  {
    name: '信息交互装',
    gear: '信号触角 · 消息胶囊',
    action: '收取请求，转交信息胶囊',
    glyph: '⋯',
    color: '#bd998a',
  },
  {
    name: '内容生成装',
    gear: '生成晶体 · 元数据片',
    action: '组装内容，附上元数据片',
    glyph: '◇',
    color: '#a38abb',
  },
  {
    name: '权限验证装',
    gear: '权限护环 · 验证盾',
    action: '扫描权限，亮起检查标记',
    glyph: '✓',
    color: '#82aa8d',
  },
];
export function loadoutIndex(role: number, instance = 4) {
  return instance < 4 ? [1, 5, 2, 0][instance] : Math.max(0, Math.min(5, role));
}
export function cryptoTaskState(region: number, time: number) {
  const task = cryptoTasks[region];
  const cycle = (((time + region * 1.7) % 18) + 18) % 18;
  const step = Math.min(2, Math.floor(cycle / 6));
  const progress = (cycle % 6) / 6;
  const transfer =
    step === 0 ? 0 : step === 2 ? 1 : progress * progress * (3 - 2 * progress);
  const visibility =
    step === 0
      ? Math.min(1, progress * 5)
      : step === 2
        ? Math.min(1, (1 - progress) * 5)
        : 1;
  return {
    ...task,
    left: -1 + transfer * 2,
    right: 1 - transfer * 2,
    lift: step === 1 ? Math.sin(progress * Math.PI) : 0,
    visibility,
    receipt: step === 2 ? Math.sin(progress * Math.PI) : 0,
    step,
    progress: (cycle % 6) / 6,
    orbit: cycle / 18,
    label: task.steps[step],
    mode: 'Demo' as const,
  };
}
