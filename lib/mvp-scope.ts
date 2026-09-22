export type MvpCapability = {
  id: string;
  label: string;
  detail: string;
  source: string;
  route?: string;
  url?: string;
  mode: 'live' | 'read-only' | 'demo' | 'external-handoff';
};

export type ExcludedCapability = {
  id: string;
  label: string;
  reason: string;
};

export const mvpScope = {
  version: '2.0-real',
  decidedAt: '2026-09-22',
  principle:
    'Only verified, currently operable capabilities are enabled. Unavailable protocol features are excluded instead of simulated.',
  flow: [
    {
      id: 'world',
      label: '观察 Agent 世界',
      detail:
        '浏览真实 OKX.AI 公开 Agent 档案；角色移动、关系和协作循环始终标记为 Demo。',
      source: 'OKX.AI public profiles + Agentverse world engine',
      route: '/',
      mode: 'demo',
    },
    {
      id: 'directory',
      label: '查看 Agent 与服务',
      detail:
        '查看公开名称、介绍、评分、销量、价格和服务明细，并回到 OKX.AI 原始页面核对。',
      source: 'OKX.AI public profiles and services',
      route: '/',
      mode: 'live',
    },
    {
      id: 'mission-composer',
      label: '生成可交付任务计划',
      detail:
        '使用 Agentverse Mission Composer，把目标转换为基于真实公开服务的只读协作计划。',
      source: 'Agentverse Mission Composer',
      route: '/missions',
      mode: 'live',
    },
    {
      id: 'ignix-read',
      label: '查看 Ignix 关联',
      detail:
        '仅在 Ignix 官方索引返回关联时展示代币记录；不把索引值冒充链上资金状态。',
      source: 'Ignix official read API',
      route: '/api/ignix',
      mode: 'read-only',
    },
    {
      id: 'ignix-launch-handoff',
      label: '前往 Ignix 官方发行',
      detail:
        'Agentverse 只提供外部入口；授权、钱包确认和交易都在 Ignix 官方产品中完成。',
      source: 'Ignix official product',
      url: 'https://ignix.bot/launch',
      mode: 'external-handoff',
    },
  ] satisfies MvpCapability[],
  excluded: [
    {
      id: 'metagents',
      label: 'MetAgents 创建 / 运行 Agent',
      reason: '没有已验证的公开创建 API、SDK 或 Agent Registry 合约。',
    },
    {
      id: 'tapeout-identity',
      label: 'TapeOut Agent 身份 / Container',
      reason:
        '没有已验证的稳定 X Layer 开发接口；Container 也不是已公开定义的 Agent 身份。',
    },
    {
      id: 'tapesend-deweb',
      label: 'TapeSend / DeWEB',
      reason: '没有找到可供 Agentverse 调用的公开 API、SDK 或 ABI。',
    },
    {
      id: 'ignix-write',
      label: '站内发行 Token / 配置 Vault',
      reason:
        '当前没有已验证的第三方写入流程；只跳转官方产品，不代签、不代发交易。',
    },
    {
      id: 'treasury-revenue',
      label: 'Treasury / Revenue',
      reason:
        '尚无统一、可链上核验的 Treasury 与收入定义；不展示模拟余额或收益。',
    },
  ] satisfies ExcludedCapability[],
} as const;
