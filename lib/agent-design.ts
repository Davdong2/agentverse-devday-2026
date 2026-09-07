import type { Agent } from './marketplace';

// A shared body with interchangeable capability cubes, following the supplied reference boards.
export const agentDesigns = [
  {
    name: '研究',
    color: '#63B4F6',
    glyph: 'research',
    skin: '#D4E8F2',
    bodyName: '浅蓝 · 宽圆头',
    shape: 'wide',
    headX: 1.1,
    headY: 0.84,
    bodyX: 1,
    bodyY: 1,
    tool: '数据平板',
    description: '蓝色研究块、数据平板、青色胸口核心',
  },
  {
    name: '交易',
    color: '#68CE9A',
    glyph: 'trading',
    skin: '#CCE8D0',
    bodyName: '薄荷 · 胶囊型',
    shape: 'capsule',
    headX: 0.79,
    headY: 1.22,
    bodyX: 0.87,
    bodyY: 1.08,
    tool: '资产币块',
    description: '绿色交易块、资产币块、交换接口',
  },
  {
    name: '风险',
    color: '#F1C66C',
    glyph: 'risk',
    skin: '#F1D5A3',
    bodyName: '沙金 · 方盾型',
    shape: 'square',
    headX: 1.02,
    headY: 1.02,
    bodyX: 1.17,
    bodyY: 1,
    tool: '验证盾',
    description: '琥珀色风险块、验证盾、权限检查器',
  },
  {
    name: '审计',
    color: '#AC91EA',
    glyph: 'audit',
    skin: '#DBCAE9',
    bodyName: '淡紫 · 长圆型',
    shape: 'tall',
    headX: 0.87,
    headY: 1.17,
    bodyX: 0.91,
    bodyY: 1.08,
    tool: '回执夹板',
    description: '紫色审计块、回执夹板、检查接口',
  },
  {
    name: '金融',
    color: '#ECA3CD',
    glyph: 'finance',
    skin: '#EBC3D2',
    bodyName: '玫瑰 · 圆梨型',
    shape: 'round',
    headX: 0.96,
    headY: 1,
    bodyX: 0.98,
    bodyY: 1.08,
    tool: '资产账本',
    description: '粉色金融块、资产账本、结算片',
  },
  {
    name: '创作',
    color: '#EDAC7B',
    glyph: 'creation',
    skin: '#F1CEAD',
    bodyName: '杏色 · 扁椭圆',
    shape: 'oval',
    headX: 1.08,
    headY: 0.83,
    bodyX: 1.06,
    bodyY: 0.94,
    tool: '生成笔',
    description: '杏色创作块、生成笔、内容晶体',
  },
  {
    name: '生活',
    color: '#71C9C4',
    glyph: 'life',
    skin: '#BDDEDD',
    bodyName: '青色 · 球形',
    shape: 'orb',
    headX: 0.99,
    headY: 1.03,
    bodyX: 1.12,
    bodyY: 1,
    tool: '信息胶囊',
    description: '青色生活块、信息胶囊、连接器',
  },
  {
    name: '开发',
    color: '#929FE9',
    glyph: 'development',
    skin: '#BCC5E2',
    bodyName: '灰蓝 · 棱角型',
    shape: 'chamfer',
    headX: 1.01,
    headY: 0.88,
    bodyX: 1.02,
    bodyY: 0.98,
    tool: '接口终端',
    description: '靛蓝开发块、接口终端、连接模块',
  },
];
export const teamVariants = [0, 2, 3, 1];
export const legacyVariant = (role: number) => [1, 4, 7, 6, 5, 2][role] ?? 7;
export function agentVariant(a: Agent) {
  const known: Record<string, number> = {
    '2083': 0,
    '8355': 2,
    '9626': 3,
    '8136': 1,
  };
  if (known[a.agentId] !== undefined) return known[a.agentId];
  const text = a.name + ' ' + a.description;
  if (/审计|audit/i.test(text)) return 3;
  if (/安全|风控|风险|security|risk/i.test(a.name)) return 2;
  if (
    /研究|情报|research|intelligence/i.test(a.name) ||
    /研究平台|专注于.*研究|市场研究/.test(text)
  )
    return 0;
  if (a.categories.includes('ART_CREATION')) return 5;
  if (a.categories.includes('LIFESTYLE')) return 6;
  if (a.categories.includes('FINANCE')) return 4;
  if (a.categories.includes('TRADING')) return 1;
  return 7;
}
export type AvatarMotion = ReturnType<typeof avatarMotion>;
export type AvatarHit = {
  x: number;
  y: number;
  width: number;
  height: number;
  instance: number;
  agentId: string;
};
export function pickAvatar(
  hits: AvatarHit[],
  x: number,
  y: number,
  padding = 6,
) {
  let selected: AvatarHit | null = null,
    distance = Infinity;
  for (const hit of hits) {
    if (
      Math.abs(x - hit.x) > hit.width * 0.4 + padding ||
      y < hit.y - hit.height - padding ||
      y > hit.y + padding
    )
      continue;
    const d = Math.hypot(x - hit.x, y - (hit.y - hit.height * 0.5));
    if (d <= distance) {
      selected = hit;
      distance = d;
    }
  }
  return selected;
}
export function avatarMotion(
  time: number,
  instance: number,
  phase: number,
  progress: number,
  collaborator: boolean,
  moving: boolean,
) {
  const working = collaborator
    ? phase === 4 && Math.min(3, Math.floor(progress * 4)) === instance
    : !moving;
  const presenting =
    collaborator && (phase === 0 || phase === 5 || phase === 6);
  const joining = collaborator && phase >= 2 && phase <= 6;
  const stride = moving ? Math.sin(time * 8 + instance) * 0.42 : 0;
  const blinkPhase = (((time + instance * 0.47) % 5) + 5) % 5;
  return {
    stride,
    bob:
      Math.sin(time * (moving ? 8 : 2) + instance) * (moving ? 0.025 : 0.012),
    blink: blinkPhase < 0.14 ? 0.16 : 1,
    leftArm: joining ? 0.9 : presenting ? 0.7 : -stride * 0.75,
    rightArm: working
      ? 0.8 + Math.sin(time * 5) * 0.13
      : joining
        ? 0.9
        : stride * 0.75,
    headTilt: working ? Math.sin(time * 2) * 0.055 : 0,
    moduleLift: joining ? 0.07 : Math.sin(time * 2 + instance) * 0.025,
    corePulse: working ? 1.12 + Math.sin(time * 4) * 0.08 : 1,
    composite: collaborator && instance === 0 && phase >= 3 && phase <= 6,
    working,
    presenting,
    joining,
  };
}
