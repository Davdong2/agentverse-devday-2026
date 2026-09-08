import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
const compile = (p) =>
  ts.transpileModule(fs.readFileSync(p, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (s) =>
  'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const model = url(
  compile('lib/civilization-model.ts')
    .replace(
      /(['"])\.\/agent-design\1/g,
      JSON.stringify(url(compile('lib/agent-design.ts'))),
    )
    .replace(
      /(['"])\.\/world-model\1/g,
      JSON.stringify(url(compile('lib/world-model.ts'))),
    ),
);
const source = compile('components/world-architecture.ts')
  .replace(/(['"])three\1/g, JSON.stringify(import.meta.resolve('three')))
  .replace(
    /(['"])three\/addons\/geometries\/RoundedBoxGeometry.js\1/g,
    JSON.stringify(
      import.meta.resolve('three/addons/geometries/RoundedBoxGeometry.js'),
    ),
  )
  .replace(/(['"])(three\/addons\/[^'"]+)\1/g, (_, q, m) =>
    JSON.stringify(import.meta.resolve(m)),
  )
  .replace(/(['"])@\/lib\/civilization-model\1/g, JSON.stringify(model));
const { createWorldArchitecture } = await import(url(source));
const { regions, regionConnections, sampleAgents } = await import(model);
const { agents } = JSON.parse(fs.readFileSync('lib/agents.json'));
const details = JSON.parse(fs.readFileSync('lib/details.json'));
const scene = new THREE.Scene(),
  picks = [],
  world = createWorldArchitecture(scene, picks);
assert.equal(world.regionPlatforms.length, 10);
assert.equal(world.routes.length, regionConnections.length);
assert.equal(
  world.fiberLines.length,
  73,
  '28 trunk strands and 45 regional branches form the fiber tree',
);
assert.equal(
  world.earth.children.length,
  3,
  'Earth has surface, clouds and orbit',
);
world.regionPlatforms.forEach((p, i) => {
  assert.equal(p.userData.region, i);
  assert.equal(
    p.position.y + p.scale.y / 2,
    0,
    'All walkable platform tops remain at y=0',
  );
});
world.routes.forEach((route, i) => {
  const [a, b] = regionConnections[i];
  const centerA = new THREE.Vector3(regions[a].x * 100, 0, regions[a].y * 100);
  const centerB = new THREE.Vector3(regions[b].x * 100, 0, regions[b].y * 100);
  assert.ok(
    route.a.distanceTo(centerA) >= (a === 0 ? 10.6 : 5.1),
    'Bridge starts at the platform rim, keeping plazas free of rails',
  );
  assert.ok(
    route.b.distanceTo(centerB) >= (b === 0 ? 10.6 : 5.1),
    'Bridge ends at the opposite rim',
  );
  assert.ok(
    route.length > 0 && route.length < centerA.distanceTo(centerB) - 10,
  );
});
const states = sampleAgents(agents, details, 6, 'calm');
world.update(6, 2, 0.1, states, 0);
const earthRotation = world.earth.children[0].rotation.y;
world.update(12, 2, 0.1, states, 0);
assert.notEqual(
  world.earth.children[0].rotation.y,
  earthRotation,
  'Distant Earth rotates with world time',
);
const spread = world.cubes[0].position.length();
world.update(6, 2, 0.9, states, 0);
assert.ok(
  world.cubes[0].position.length() < spread,
  'Modules dock towards the center',
);
world.update(10, 4, 0.5, states, 0);
assert.ok(world.coop.visible);
assert.ok(
  world.links.every((m) => !m.visible),
  'Old solid cylinders are replaced by layered effects ribbons',
);
assert.equal(world.result.visible, false, 'No receipt before work completes');
world.update(12, 5, 0, states, 0);
const start = world.result.position.clone();
world.update(12, 5, 1, states, 0);
assert.ok(start.distanceTo(world.result.position) > 10);
assert.equal(
  world.result.position.x,
  regions[7].x * 100,
  'Result is delivered to the reality entrance',
);
world.update(16, 7, 0.5, states, 2);
assert.equal(world.coop.visible, false);
assert.ok(world.links.every((m) => !m.visible));
assert.equal(
  world.pulses.count,
  world.routes.length * 3,
  'Reduced tier halves route particles',
);
scene.updateMatrixWorld(true);
scene.traverse((o) =>
  assert.ok(
    o.matrixWorld.elements.every(Number.isFinite),
    'Transforms must be finite',
  ),
);
let disposed = false;
world.regionPlatforms[0].geometry.addEventListener(
  'dispose',
  () => (disposed = true),
);
world.dispose();
assert.ok(disposed);
assert.equal(scene.children.length, 0);
console.log(
  'PASS: 10 level platforms, connected arched routes, docking modules, work/receipt sequencing, real-entrance destination, reduced particles and resource cleanup. No browser/GPU validation.',
);
