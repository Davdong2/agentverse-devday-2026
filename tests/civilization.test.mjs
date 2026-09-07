import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compile = (name) =>
  ts.transpileModule(fs.readFileSync(name, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const worldUrl = url(compile('lib/world-model.ts'));
const model = compile('lib/civilization-model.ts')
  .replace(
    /(['"])\.\/agent-design\1/g,
    JSON.stringify(url(compile('lib/agent-design.ts'))),
  )
  .replace(/(['"])\.\/world-model\1/g, JSON.stringify(worldUrl));
const {
  regions,
  stages,
  stageAt,
  phaseProgress,
  collaborationPose,
  liveWeather,
  cycleDuration,
  regionFor,
  sampleAgents,
  worldRoster,
  canWalkAt,
  regionConnections,
} = await import(url(model));
assert.equal(regions.length, 10);
assert.equal(cycleDuration, 18);
for (let i = 0; i < stages.length; i++) {
  assert.equal(stageAt(stages[i].start), i);
  assert.equal(stageAt(stages[i].end - 0.001), i);
  assert.ok(Math.abs(phaseProgress(stages[i].start)) < 1e-10);
  if (i) assert.equal(stages[i - 1].end, stages[i].start);
}
assert.equal(stageAt(cycleDuration), 0);
assert.equal(stageAt(cycleDuration * 2), 0);
for (let t = 0; t < 160; t += 0.1)
  for (let i = 0; i < 4; i++) {
    const p = collaborationPose(t, i);
    assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    if (t > 0.1) {
      const q = collaborationPose(t - 0.1, i);
      assert.ok(
        Math.hypot(q.x - p.x, q.y - p.y) < 0.05,
        'Agent must move continuously across stages',
      );
    }
  }
const d = (t) => {
  const a = collaborationPose(t, 0),
    b = collaborationPose(t, 1);
  return Math.hypot(a.x - b.x, a.y - b.y);
};
assert.ok(
  d(7) < d(4),
  'Docked modules must be closer than approaching modules',
);
assert.ok(d(16) > d(7), 'Completed composite must split apart');
assert.equal(liveWeather(-2), 'storm');
assert.equal(liveWeather(2), 'tide');
assert.equal(liveWeather(0.3), 'calm');
const { agents } = JSON.parse(fs.readFileSync('lib/agents.json', 'utf8'));
for (const a of agents) {
  const n = regionFor(a);
  assert.ok(n >= 0 && n < regions.length);
}
console.log(
  'PASS: ten regions, complete continuous collaboration cycle, docking/splitting, market weather thresholds and real-profile region mapping.',
);

const details = JSON.parse(fs.readFileSync('lib/details.json', 'utf8'));
const state = sampleAgents(agents, details, 7, 'nvda', 50);
assert.equal(state.length, agents.length);
assert.equal(
  new Set(state.map((a) => a.agentId)).size,
  state.length,
  'An identity must never be cloned to fill capacity',
);
assert.deepEqual(
  state.slice(0, 4).map((a) => a.agentId),
  ['2083', '8355', '9626', '8136'],
);
const sameNames = [
  ...agents,
  { ...agents[0], agentId: '99999', name: agents[0].name },
];
assert.equal(
  worldRoster(sameNames).filter((a) => a.name === agents[0].name).length,
  2,
  'Different source IDs may legitimately share a name',
);
assert.equal(
  worldRoster([...agents, agents[0]]).length,
  agents.length,
  'Duplicate source IDs produce one body',
);
assert.deepEqual(
  sampleAgents([], {}, 0, 'calm'),
  [],
  'Empty catalogs must not fabricate actors',
);
const fifty = Array.from({ length: 50 }, (_, i) => ({
  ...agents[i % agents.length],
  agentId: String(90000 + i),
}));
assert.equal(
  sampleAgents(fifty, {}, 0, 'calm').length,
  50,
  'Capacity still supports 50 distinct source identities',
);
assert.equal(state.filter((a) => a.collaborator).length, 4);
for (let i = 0; i < 4; i++) {
  assert.equal(state[i].x, collaborationPose(7, i).x);
  assert.equal(state[i].y, collaborationPose(7, i).y);
}
assert.deepEqual(
  sampleAgents(agents, details, 7, 'nvda', 50),
  state,
  'Both cameras must derive identical AgentState from the same clock and source',
);
assert.ok(state.every((a) => agents.some((p) => p.agentId === a.agentId)));
const start = performance.now();
for (let i = 0; i < 600; i++) sampleAgents(agents, details, i / 60, 'calm', 50);
console.log(
  'Shared state sampling, ms/frame:',
  ((performance.now() - start) / 600).toFixed(3),
);

for (const r of regions)
  assert.ok(canWalkAt(r.x * 100, r.y * 100), 'Every region must be accessible');
for (const [a, b] of regionConnections)
  for (let u = 0; u <= 1; u += 0.025) {
    assert.ok(
      canWalkAt(
        (regions[a].x + (regions[b].x - regions[a].x) * u) * 100,
        (regions[a].y + (regions[b].y - regions[a].y) * u) * 100,
      ),
      'Bridges must connect regions without collision gaps',
    );
  }
assert.equal(canWalkAt(0, 0), false);
assert.equal(canWalkAt(100, 100), false);
assert.equal(canWalkAt(NaN, 50), false);
console.log(
  'PASS: shared camera samples, unique real-profile instances (50-identity capacity), all walkable regions and continuous bridges, out-of-world rejection.',
);
