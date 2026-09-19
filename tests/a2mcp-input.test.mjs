import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(
  new URL('../lib/a2mcp-input.ts', import.meta.url),
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
  `(function(module, exports, URLSearchParams){${js}\n})(module, module.exports, URLSearchParams)`,
  { module: compiledModule, URLSearchParams },
);
const { parseA2mcpRequest } = compiledModule.exports;

test('empty POST uses a deterministic example delivery request', () => {
  const parsed = parseA2mcpRequest('', null);
  assert.equal(parsed.source, 'default-example');
  assert.equal(parsed.format, 'empty');
  assert.equal(parsed.value.goal, '研究 BTC 市场状态，并检查 X Layer 代币风险');
});

test('OKX.AI empty JSON probes and empty envelopes use the example delivery', () => {
  for (const body of ['{}', '{"params":{}}', '{"arguments":{}}']) {
    const parsed = parseA2mcpRequest(body, 'application/json');
    assert.equal(parsed.source, 'default-example');
    assert.equal(parsed.format, 'json');
    assert.equal(
      parsed.value.goal,
      '研究 BTC 市场状态，并检查 X Layer 代币风险',
    );
  }
});

test('common tool envelopes and goal aliases are accepted', () => {
  const wrapped = parseA2mcpRequest(
    JSON.stringify({ arguments: { query: '研究 BTC 市场', max_agents: '2' } }),
    'application/json',
  );
  assert.equal(wrapped.value.goal, '研究 BTC 市场');
  assert.equal(wrapped.value.maxAgents, 2);

  const plain = parseA2mcpRequest('检查 X Layer 代币风险', 'text/plain');
  assert.equal(plain.value.goal, '检查 X Layer 代币风险');
  assert.equal(plain.format, 'text');
});

test('form parameters are normalized', () => {
  const parsed = parseA2mcpRequest(
    'goal=%E7%A0%94%E7%A9%B6+BTC+%E5%B8%82%E5%9C%BA&maxAgents=3',
    'application/x-www-form-urlencoded',
  );
  assert.equal(parsed.value.goal, '研究 BTC 市场');
  assert.equal(parsed.value.maxAgents, 3);
  assert.equal(parsed.format, 'form');
});
