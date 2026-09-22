import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

// Execute the actual route and bundled catalog, not source-string assertions.
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const url = new URL(`../${path}`, import.meta.url);
  if (path.endsWith('.json')) return JSON.parse(fs.readFileSync(url, 'utf8'));
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(url, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const require = (name) => {
    assert.ok(name.startsWith('@/'), `Unexpected dependency: ${name}`);
    return load(name.slice(2) + (name.endsWith('.json') ? '' : '.ts'));
  };
  vm.runInNewContext(
    `(function(module,exports,require){${code}\n})(module,module.exports,require)`,
    {
      module,
      require,
      Response,
      Request,
      URL,
      URLSearchParams,
      crypto: webcrypto,
      console: { info() {} },
    },
  );
  cache.set(path, module.exports);
  return module.exports;
}
const { POST, GET } = load('app/api/a2mcp/compose/route.ts');
async function invoke(body) {
  const response = await POST(
    new Request('https://example.test/api/a2mcp/compose', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
  return { response, data: await response.json() };
}

test('availability probes deliver an explicitly labelled example plan', async () => {
  for (const body of ['', {}, { arguments: {} }, { params: {} }]) {
    const { response, data } = await invoke(body);
    assert.equal(response.status, 200);
    assert.equal(data.deliveryStatus, 'delivered');
    assert.equal(data.input.source, 'default-example');
    assert.equal(data.delivery.type, 'collaboration-plan');
    assert.equal(data.delivery.downstreamExecuted, false);
    assert.ok(data.delivery.report.includes(data.goal));
    assert.equal(data.delivery.catalogAsOf, data.provenance.fetchedAt);
    assert.ok(data.steps.length > 0);
  }
});

test('Chinese and English goals return relevant plans with the requested limit', async () => {
  for (const goal of [
    '研究 BTC 市场',
    'Research the BTC market',
    'Design a community event poster',
  ]) {
    const { response, data } = await invoke({ goal, maxAgents: 1 });
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.goal, goal);
    assert.equal(data.input.source, 'provided');
    assert.equal(data.steps.length, 1);
    assert.ok(
      data.steps[0].capabilities.includes(
        goal.startsWith('Design') ? '创意交付' : '市场研究',
      ),
    );
    assert.equal(data.safety.automaticPayment, false);
  }
});

test('invalid requests cannot silently turn into a successful BTC sample', async () => {
  for (const body of [
    { goaal: 'Audit a token' },
    { maxAgents: 2 },
    { goal: 'Research BTC', extra: true },
    { goal: 'Research BTC', maxAgents: 9 },
    '{"goal":',
    null,
  ]) {
    const { response, data } = await invoke(body);
    assert.equal(response.status, 400, JSON.stringify(data));
    assert.equal(data.ok, false);
    assert.equal(data.deliveryStatus, 'failed');
    assert.ok(data.code && data.error && data.hint && data.exampleRequest.goal);
  }
});

test('ordinary English words do not invent matching services', async () => {
  const { response, data } = await invoke({
    goal: 'Please find an agent for underwater basket weaving',
  });
  assert.equal(response.status, 422);
  assert.equal(data.code, 'NO_MATCHING_SERVICES');
  assert.equal(data.deliveryStatus, 'failed');
});

test('descriptor states the service scope and required input', async () => {
  const data = await (
    await GET(new Request('https://example.test/api/a2mcp/compose'))
  ).json();
  assert.equal(data.billing, 'free');
  assert.equal(data.deliverable, 'collaboration-plan');
  assert.deepEqual(data.inputSchema.required, ['goal']);
  assert.ok(data.delivery.emptyProbe.includes('{}'));
});
