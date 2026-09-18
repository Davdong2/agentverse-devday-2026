import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const compiled = ts.transpileModule(
  fs.readFileSync('lib/agent-relationships.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const url =
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64');
const {
  deriveDisposition,
  createRelationshipLog,
  buildRelationshipGraph,
  relationshipExport,
  relationshipCsv,
} = await import(url);
const { agents, fetchedAt } = JSON.parse(
  fs.readFileSync('lib/agents.json', 'utf8'),
);
const details = JSON.parse(fs.readFileSync('lib/details.json', 'utf8'));

const disposition = deriveDisposition(agents[0], details[agents[0].agentId]);
assert.equal(disposition.agentId, agents[0].agentId);
assert.equal(disposition.traits.length, 2);
assert.ok(disposition.capabilities.length > 0);
for (const score of [
  disposition.curiosity,
  disposition.caution,
  disposition.sociability,
  disposition.ambition,
  disposition.reliability,
])
  assert.ok(score >= 0 && score <= 100);

const regionFor = (agent) => Number(agent.agentId) % 10;
const first = createRelationshipLog(agents, details, 3, 1000, regionFor);
const repeated = createRelationshipLog(agents, details, 3, 1000, regionFor);
assert.deepEqual(
  first,
  repeated,
  'The same world cycle must replay identically',
);
assert.ok(first);
assert.notEqual(first.actorIds[0], first.actorIds[1]);
assert.equal(first.mode, 'Demo');
assert.equal(first.source, 'profile_inference');
assert.ok(first.reason.includes('公开资料推导'));
assert.ok(agents.some((agent) => agent.name === first.actorNames[0]));
assert.ok(agents.some((agent) => agent.name === first.actorNames[1]));
assert.match(first.memoryEffect, /记住/);
assert.match(first.outcome, /关系强度/);

const missionChemistry = createRelationshipLog(
  agents.slice(0, 4),
  details,
  4,
  2000,
  regionFor,
  [first],
  { requestId: 'mission-1', goal: '研究市场并核对风险' },
);
assert.equal(missionChemistry.source, 'mission_simulation');
assert.equal(missionChemistry.missionId, 'mission-1');
assert.equal(missionChemistry.goal, '研究市场并核对风险');

const later = { ...first, id: first.id + '-again', at: 2000 };
const graph = buildRelationshipGraph([later, first]);
assert.equal(graph.length, 1);
assert.equal(graph[0].interactions, 2);
assert.equal(graph[0].strength, first.relationDelta * 2);

const exported = relationshipExport([first], fetchedAt);
assert.equal(exported.schema, 'agentverse.relationship-events.v1');
assert.equal(exported.events.length, 1);
assert.match(exported.behaviorNotice, /Demo/);
const csv = relationshipCsv([first]);
assert.match(csv, /actor_1_name/);
assert.match(csv, new RegExp(first.actorNames[0]));
assert.equal(createRelationshipLog([], details, 0, 0, regionFor), null);
assert.equal(
  createRelationshipLog([agents[0]], details, 0, 0, regionFor),
  null,
);

console.log(
  'PASS: deterministic profile-derived relationships, transparent Demo provenance, graph aggregation and JSON/CSV exports.',
);
