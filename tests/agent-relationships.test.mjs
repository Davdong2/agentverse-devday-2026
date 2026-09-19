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
const first = createRelationshipLog(
  agents,
  details,
  3,
  1000,
  regionFor,
  [],
  undefined,
  { title: 'BTC 现实行情进入世界', mode: 'LIVE' },
);
const repeated = createRelationshipLog(
  agents,
  details,
  3,
  1000,
  regionFor,
  [],
  undefined,
  { title: 'BTC 现实行情进入世界', mode: 'LIVE' },
);
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
assert.match(first.trigger, /BTC 现实行情/);
assert.equal(first.triggerMode, 'LIVE');
assert.match(first.intent, /正在寻找/);
assert.ok(first.partnerNeed);
assert.ok(first.chemistryScore >= 0 && first.chemistryScore <= 100);
assert.equal(first.chemistryFactors.length, 5);
assert.equal(first.relationBefore, 0);
assert.equal(first.relationAfter, first.relationDelta);
assert.equal(first.decisionMode, '结构化推演');

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
assert.equal(missionChemistry.triggerMode, 'Demo');
assert.match(missionChemistry.trigger, /人类委托/);
assert.equal(missionChemistry.decisionMode, '结构化推演');

const later = { ...first, id: first.id + '-again', at: 2000 };
const graph = buildRelationshipGraph([later, first]);
assert.equal(graph.length, 1);
assert.equal(graph[0].interactions, 2);
assert.equal(graph[0].strength, first.relationDelta * 2);

const exported = relationshipExport([first], fetchedAt);
assert.equal(exported.schema, 'agentverse.relationship-events.v2');
assert.equal(exported.events.length, 1);
assert.match(exported.behaviorNotice, /Demo/);
const csv = relationshipCsv([first]);
assert.match(csv, /actor_1_name/);
assert.match(csv, /chemistry_score/);
assert.match(csv, new RegExp(first.actorNames[0]));
assert.equal(createRelationshipLog([], details, 0, 0, regionFor), null);
assert.equal(
  createRelationshipLog([agents[0]], details, 0, 0, regionFor),
  null,
);

const civilization = fs.readFileSync('components/civilization.tsx', 'utf8');
assert.match(civilization, /Agent 化学反应/);
assert.match(civilization, /可解释事件时间线/);
assert.match(civilization, /chemistryFactors/);
assert.match(civilization, /relationBefore/);
const dossier = fs.readFileSync('components/agent-dossier.tsx', 'utf8');
assert.match(dossier, /当前意图/);
assert.match(dossier, /正在寻找/);

console.log(
  'PASS: deterministic, explainable Agent chemistry with transparent Demo provenance, graph aggregation, visible intent and JSON/CSV exports.',
);
