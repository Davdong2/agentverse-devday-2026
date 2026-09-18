import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(
  new URL('../lib/mission-planner.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(
  `(function(module, exports){${js}\n})(module, module.exports)`,
  {
    module: compiledModule,
  },
);
const { composeMission } = compiledModule.exports;

const agents = [
  {
    agentId: '1',
    name: 'Risk Agent',
    avatar: '',
    description: '代币合约安全',
    approvalRate: '100%',
    usageCount: 20,
    startingPrice: '0',
    symbol: 'USDT',
    categories: ['SOFTWARE_SERVICES'],
    categoryName: ['软件服务'],
    onlineStatus: 1,
  },
  {
    agentId: '2',
    name: 'News Agent',
    avatar: '',
    description: '市场新闻和情绪研究',
    approvalRate: '100%',
    usageCount: 10,
    startingPrice: '0',
    symbol: 'USDT',
    categories: ['FINANCE'],
    categoryName: ['金融'],
    onlineStatus: 1,
  },
  {
    agentId: '3',
    name: 'Execution Agent',
    avatar: '',
    description: 'X Layer 交易执行准备',
    approvalRate: '100%',
    usageCount: 8,
    startingPrice: '0',
    symbol: 'USDT',
    categories: ['TRADING'],
    categoryName: ['交易'],
    onlineStatus: 1,
  },
  {
    agentId: '4',
    name: 'Food Agent',
    avatar: '',
    description: '家庭饮食和菜谱',
    approvalRate: '100%',
    usageCount: 100,
    startingPrice: '0',
    symbol: 'USDT',
    categories: ['LIFE'],
    categoryName: ['生活'],
    onlineStatus: 1,
  },
];
const catalog = {
  agents,
  details: {
    1: {
      fetchedAt: '2026-09-17T00:00:00Z',
      total: 1,
      services: [
        {
          serviceId: 11,
          name: 'Token 风险扫描',
          description: '检查合约、蜜罐和税费风险',
          price: '0.01',
          symbol: 'USDT',
          serviceType: 'A2MCP',
        },
      ],
    },
    2: {
      fetchedAt: '2026-09-17T00:00:00Z',
      total: 1,
      services: [
        {
          serviceId: 22,
          name: '市场新闻',
          description: '返回 BTC 新闻和市场情绪',
          price: '0',
          symbol: 'USDT',
          serviceType: 'A2MCP',
        },
      ],
    },
    3: {
      fetchedAt: '2026-09-17T00:00:00Z',
      total: 1,
      services: [
        {
          serviceId: 33,
          name: '交易执行准备',
          description: '生成 X Layer swap 交易参数，不自动签名',
          price: '0',
          symbol: 'USDT',
          serviceType: 'A2MCP',
        },
      ],
    },
    4: {
      fetchedAt: '2026-09-17T00:00:00Z',
      total: 1,
      services: [
        {
          serviceId: 44,
          name: '家庭菜谱',
          description: '生成一周饮食计划',
          price: '0',
          symbol: 'USDT',
          serviceType: 'A2MCP',
        },
      ],
    },
  },
  source: 'https://www.okx.ai/zh-hans/agents',
  fetchedAt: '2026-09-17T00:00:00Z',
  mode: 'test',
};

test('mission planner returns deterministic, verifiable service steps', () => {
  const result = composeMission(
    { goal: '研究 BTC 新闻并检查代币合约风险', maxAgents: 2 },
    catalog,
  );
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps.map((step) => step.agentId).join(','), '2,1');
  assert.equal(
    result.steps.map((step) => step.role).join(','),
    '市场研究,风险验证',
  );
  assert.equal(
    JSON.stringify(result.steps.map((step) => [...step.dependsOn])),
    JSON.stringify([[], [1]]),
  );
  assert.ok(
    result.steps.every((step) =>
      /^https:\/\/www\.okx\.ai\/zh-hans\/agents\/\d+$/.test(step.serviceUrl),
    ),
  );
  assert.equal(result.safety.automaticPayment, false);
  assert.equal(result.safety.automaticExecution, false);
});

test('mission planner enforces input and agent limits', () => {
  assert.throws(
    () => composeMission({ goal: 'a' }, catalog),
    /至少需要 4 个字符/,
  );
  assert.throws(
    () => composeMission({ goal: '分析市场新闻', maxAgents: 99 }, catalog),
    /1 到 4/,
  );
  assert.throws(
    () => composeMission({ goal: '分析市场新闻', maxAgents: 0 }, catalog),
    /1 到 4/,
  );
  assert.throws(
    () =>
      composeMission(
        { goal: '检查代币风险', contractAddress: '0x1234' },
        catalog,
      ),
    /有效的 EVM 合约地址/,
  );
  assert.throws(
    () => composeMission({ goal: '分析市场新闻', extra: true }, catalog),
    /不支持的字段/,
  );
});

test('mission planner never exceeds a limit already reached by intent selection', () => {
  const result = composeMission(
    { goal: '研究市场新闻，检查代币风险，并准备执行交易', maxAgents: 3 },
    catalog,
  );
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps.map((step) => step.agentId).join(','), '2,1,3');
});

test('mission planner does not pad a plan with unrelated services', () => {
  const result = composeMission(
    { goal: '研究市场新闻，检查代币风险，并准备执行交易', maxAgents: 4 },
    catalog,
  );
  assert.equal(result.steps.length, 3);
  assert.ok(result.steps.every((step) => step.agentId !== '4'));
});

test('mission planner preserves validated X Layer context', () => {
  const contractAddress = '0x1111111111111111111111111111111111111111';
  const result = composeMission(
    {
      goal: '检查这个代币的合约风险',
      maxAgents: 2,
      assetSymbol: 'demo',
      chainId: 'eip155:196',
      contractAddress,
    },
    catalog,
  );
  assert.equal(result.request.assetSymbol, 'DEMO');
  assert.equal(result.request.chainId, 'eip155:196');
  assert.equal(result.request.contractAddress, contractAddress);
});
