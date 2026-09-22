import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = ts.transpileModule(
  fs.readFileSync('lib/integrations/catalog.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

const { integrationAuditDate, integrationCatalog } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);

assert.equal(integrationAuditDate, '2026-09-22');
assert.deepEqual(
  integrationCatalog.map((item) => item.id),
  ['metagents', 'tapeout', 'ignix'],
);

const capability = (protocol, id) =>
  integrationCatalog
    .find((item) => item.id === protocol)
    ?.capabilities.find((item) => item.id === id);

assert.equal(
  capability('metagents', 'createMetAgent')?.status,
  'not-connected',
);
assert.equal(capability('tapeout', 'sendTapeMessage')?.status, 'not-connected');
assert.equal(capability('tapeout', 'createContainer')?.status, 'external-only');
assert.equal(capability('ignix', 'listLaunches')?.status, 'verified');
assert.equal(capability('ignix', 'createAgentToken')?.status, 'external-only');
assert.equal(
  capability('ignix', 'configureDirectedVault')?.notes.includes(
    'fixed at launch',
  ),
  true,
);

const verifiedWrites = integrationCatalog.flatMap((integration) =>
  integration.capabilities.filter(
    (item) => item.mode !== 'read' && item.status === 'verified',
  ),
);
assert.equal(
  verifiedWrites.length,
  0,
  'No protocol write may be exposed as verified after Phase 0.',
);

for (const file of [
  'integrations/metagents.md',
  'integrations/tapeout.md',
  'integrations/ignix.md',
]) {
  const doc = fs.readFileSync(file, 'utf8');
  for (const heading of [
    '## Official documentation',
    '## Contract addresses',
    '## ABI',
    '## API',
    '## SDK',
    '## Authentication',
    '## Available functions',
    '## Events',
    '## Limitations',
    '## Test transaction',
    '## Source',
  ]) {
    assert.ok(doc.includes(heading), `${file} is missing ${heading}`);
  }
}

console.log(
  'PASS: Phase 0 manifests expose only verified Ignix reads and preserve explicit protocol adapter gates.',
);
