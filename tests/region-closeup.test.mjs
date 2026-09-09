import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const compile = (path) =>
  ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const { closeupPopulationLimit, closeupSlot, regionCloseupBlueprints } =
  await import(url(compile('lib/region-closeup.ts')));

assert.equal(regionCloseupBlueprints.length, 10);
assert.equal(
  new Set(regionCloseupBlueprints.map((item) => item.feature)).size,
  10,
  'Every region needs its own physical Agent habitat',
);
for (const blueprint of regionCloseupBlueprints) {
  assert.match(blueprint.system, /^AGENT/);
  assert.equal(blueprint.assets.length, 4);
  assert.ok(blueprint.deck.length > 6);
  assert.ok(blueprint.status.length > 6);
  assert.ok(blueprint.landmark.length >= 4);
  assert.equal(blueprint.activity.length, 3);
  assert.equal(blueprint.skyline.length, 3);
  assert.ok(blueprint.skyline.every((height) => height >= 16));
}

const slots = Array.from({ length: 6 }, (_, index) => closeupSlot(index));
assert.equal(new Set(slots.map(({ x, y }) => `${x}:${y}`)).size, 6);
assert.ok(
  slots[0].scale > Math.max(...slots.slice(1).map((slot) => slot.scale)),
  'The resident Agent must be the visual subject',
);
assert.equal(closeupPopulationLimit(390), 4);
assert.equal(closeupPopulationLimit(1440), 6);
assert.equal(closeupPopulationLimit(Number.NaN), 4);

const canvasSource = fs.readFileSync(
  'components/civilization-canvas.tsx',
  'utf8',
);
assert.match(canvasSource, /canvas\.width = 3200/);
assert.match(
  canvasSource,
  /drawAgentHabitat\(p, t, phase, phaseProgress\(t\)\)/,
);
assert.match(
  canvasSource,
  /regionFor\(source, p\.details\[source\.agentId\]\)/,
);
assert.match(
  canvasSource,
  /drawHabitatCity\(regionIndex, t, ambientStates, p\.ignixIds\)/,
);
assert.match(canvasSource, /drawHabitatFloor\(regionIndex, t, focusX\)/);
assert.match(canvasSource, /drawHabitatForeground\(regionIndex, t\)/);
assert.match(canvasSource, /AGENT SERVICE NETWORK/);
assert.match(canvasSource, /residentSlots/);

console.log(
  'PASS: ten distinct Agent-first habitats, resident-first staging, six non-overlapping close-range actors and a 2× vector canvas.',
);
