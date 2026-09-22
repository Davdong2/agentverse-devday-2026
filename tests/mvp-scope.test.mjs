import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = ts.transpileModule(fs.readFileSync('lib/mvp-scope.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const { mvpScope } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);

assert.equal(mvpScope.version, '2.0-real');
assert.deepEqual(
  mvpScope.flow.map((item) => item.id),
  [
    'world',
    'directory',
    'mission-composer',
    'ignix-read',
    'ignix-launch-handoff',
  ],
);

for (const id of [
  'metagents',
  'tapeout-identity',
  'tapesend-deweb',
  'ignix-write',
  'treasury-revenue',
]) {
  assert.ok(
    mvpScope.excluded.some((item) => item.id === id),
    `${id} must stay outside the current MVP`,
  );
}

assert.equal(
  mvpScope.flow.some((item) => item.mode === 'write'),
  false,
  'No protocol write is enabled in the real MVP.',
);
assert.equal(
  mvpScope.flow.find((item) => item.id === 'ignix-launch-handoff')?.mode,
  'external-handoff',
);

const profile = fs.readFileSync('components/ignix-profile.tsx', 'utf8');
assert.ok(profile.includes('Agentverse 不代签'));
assert.ok(profile.includes('https://ignix.bot/launch'));

const world = fs.readFileSync('components/civilization.tsx', 'utf8');
for (const label of [
  'OKX.AI PROFILES',
  'AGENTVERSE WORLD',
  'MISSION COMPOSER',
  'IGNIX READ API',
  'BEHAVIOR DEMO',
]) {
  assert.ok(world.includes(label), `world is missing ${label}`);
}

console.log(
  'PASS: the product flow contains only real data, working Agentverse features, explicit demos, and external official handoffs.',
);
