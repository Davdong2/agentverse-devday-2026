import type { Agent, Detail } from './marketplace';
export type State = 'idle' | 'research' | 'execute' | 'complete';
export const stateNames: Record<State, string> = {
  idle: '空闲',
  research: '研究',
  execute: '执行',
  complete: '完成',
};
const roleMap: Record<string, number> = {
  TRADING: 0,
  FINANCE: 1,
  SOFTWARE_SERVICES: 2,
  LIFESTYLE: 3,
  ART_CREATION: 4,
  OTHER: 2,
};
export const roleColors = [
  '#ba914f',
  '#638dae',
  '#58988d',
  '#c78e7e',
  '#9b8aac',
  '#76a78f',
];
export const roleNames = [
  '执行核心',
  '资本环',
  '接口模块',
  '交互核心',
  '生成模块',
  '扫描环',
];
export function appearance(a: Agent, details?: Detail | null) {
  const text = [
    a.name,
    a.description,
    ...(details?.services.map((s) => s.name) ?? []),
  ].join(' ');
  const rules: [RegExp, string][] = [
    [/研究|情报|新闻|分析|research|intelligence/i, '信号研究'],
    [/安全|审计|风控|风险|security|audit|risk/i, '风险扫描'],
    [/交易|兑换|跟单|swap|trading/i, '执行模块'],
    [/API|数据|接口|data/i, '数据接口'],
    [/创意|漫画|品牌|图像|设计|创作|art|image/i, '生成核心'],
    [/食谱|健康|饮食|生活|烹饪/, '交互模块'],
  ];
  const modules = rules
    .filter(([r]) => r.test(text))
    .map(([, name]) => name)
    .slice(0, 3);
  const role =
    /审计|安全|风控|合规|security|audit/i.test(a.name + ' ' + a.description) &&
    a.categories.includes('SOFTWARE_SERVICES')
      ? 5
      : (roleMap[a.categories[0]] ?? 2);
  const score = a.score === undefined ? null : Number(a.score),
    approval = parseFloat(a.approvalRate);
  const reputation =
    score === null || !Number.isFinite(score)
      ? 0
      : score >= 4.8 && approval >= 95
        ? 3
        : score >= 4.5
          ? 2
          : score >= 4
            ? 1
            : 0;
  const heat = Math.min(1, Math.log10(Math.max(0, a.usageCount) + 1) / 4.5);
  const primary = a.name + ' ' + a.description;
  const home = /出金|托管|跨链桥|支付结算/.test(primary)
    ? 3
    : role === 5
      ? 1
      : role === 4 || role === 1
        ? 2
        : role === 0 && /研究平台|专注于.*研究|市场研究/.test(primary)
          ? 0
          : role === 0
            ? 2
            : 0;
  return {
    role,
    color: roleColors[role],
    organ: roleNames[role],
    modules: modules.length ? modules : [roleNames[role]],
    reputation,
    heat,
    home,
    source: '由公开分类、简介、服务、评分与销量映射',
  };
}
export const anchors = [
  { x: 20, y: 47 },
  { x: 39, y: 47 },
  { x: 61, y: 48 },
  { x: 84, y: 75 },
];
export const route = [
  { x: 20, y: 47 },
  { x: 24, y: 49 },
  { x: 27, y: 53 },
  { x: 31, y: 56 },
  { x: 35, y: 55 },
  { x: 39, y: 47 },
  { x: 43, y: 48 },
  { x: 46, y: 53 },
  { x: 50, y: 57 },
  { x: 55, y: 58 },
  { x: 61, y: 48 },
  { x: 60, y: 58 },
  { x: 66, y: 62 },
  { x: 68, y: 68 },
  { x: 74, y: 73 },
  { x: 79, y: 76 },
  { x: 84, y: 75 },
];
export const anchorIndexes = [0, 5, 10, 16];
export function pointAt(progress: number) {
  const x = Math.max(0, Math.min(1, progress)) * (route.length - 1);
  const i = Math.floor(x),
    t = x - i;
  const p = route[i],
    q = route[Math.min(i + 1, route.length - 1)];
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}
export function replayState(progress: number): State {
  return progress === 0
    ? 'idle'
    : progress < 0.36
      ? 'research'
      : progress < 1
        ? 'execute'
        : 'complete';
}
