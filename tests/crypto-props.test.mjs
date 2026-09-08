import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
const compile = (path) =>
  ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (s) =>
  'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const base = url(compile('lib/world-model.ts'));
const model = url(
  compile('lib/civilization-model.ts')
    .replace(
      /(['"])\.\/agent-design\1/g,
      JSON.stringify(url(compile('lib/agent-design.ts'))),
    )
    .replace(/(['"])\.\/world-model\1/g, JSON.stringify(base)),
);
const crypto = url(compile('lib/crypto-world.ts'));
const source = compile('components/crypto-props.ts')
  .replace(/(['"])three\1/g, JSON.stringify(import.meta.resolve('three')))
  .replace(/(['"])(three\/addons\/[^'"]+)\1/g, (_, q, m) =>
    JSON.stringify(import.meta.resolve(m)),
  )
  .replace(/(['"])@\/lib\/civilization-model\1/g, JSON.stringify(model))
  .replace(/(['"])@\/lib\/crypto-world\1/g, JSON.stringify(crypto));
// Text-only canvas stand-in; checks Three scene state, not WebGL rendering or browser pixels.
const drawn = [];
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillRect() {},
          fillText(text) {
            drawn.push(text);
          },
          arc() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
          fill() {},
        };
      },
    };
  },
};
const { createCryptoProps, createAgentEquipment } = await import(url(source));
const scene = new THREE.Scene(),
  picks = [];
const stations = createCryptoProps(scene, picks);
assert.equal(scene.children.length, 10);
stations.setMarketSignal({ last: 65000.5, change: 1.25, mode: 'fresh' });
assert.ok(
  drawn.at(-1).includes('65,000.5') && drawn.at(-1).includes('OKX LIVE'),
);
stations.setMarketSignal(null);
assert.ok(
  drawn.at(-1).includes('等待行情信号'),
  'Removing a signal clears the old live price',
);
assert.ok(picks.length >= 20);
assert.ok(picks.every((p) => Number.isInteger(p.userData.region)));
const market = stations.stations[5],
  input = market.moving[0],
  output = market.moving[1];
stations.update(3 - 5 * 1.7, 0);
const initial = input.position.x;
stations.update(15 - 5 * 1.7, 0);
assert.ok(input.position.x > initial);
assert.ok(output.position.x < 0);
assert.equal(
  market.receipt.visible,
  true,
  'Completed task produces a visible receipt',
);
stations.update(3 - 5 * 1.7, 0);
assert.equal(market.receipt.visible, false, 'No receipt before task execution');
for (const s of stations.stations) {
  assert.ok(
    stations.blocksPoint(s.g.position.x, s.g.position.z),
    'Exhibit footprint blocks walking through its body',
  );
}
assert.equal(stations.blocksPoint(46.8, 51.5), false, 'Entry remains open');
scene.updateMatrixWorld(true);
scene.traverse((o) => assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
const signatures = stations.stations.map((s) =>
  s.g.children.map((o) => o.geometry?.attributes.position.count ?? 0).join(','),
);
assert.ok(
  new Set(signatures).size >= 8,
  'Regions use distinct facility geometry',
);
let materialDisposed = false;
stations.textures[0].addEventListener(
  'dispose',
  () => (materialDisposed = true),
);
const equipment = createAgentEquipment(),
  body = new THREE.Group(),
  gear = equipment.attach(body);
gear.update(5, 2, true);
assert.equal(body.children[1].visible, true);
assert.ok(body.children[2].scale.y > 0.4);
gear.update(0, 2, false);
assert.equal(body.children[1].visible, false);
assert.ok(body.children[2].scale.y < 0.3);
stations.dispose();
equipment.dispose();
assert.equal(scene.children.length, 0);
assert.ok(materialDisposed);
console.log(
  'PASS: 10 clickable Three task stations, physical asset exchange, correctly timed receipt, distinct security/trading gear and cleanup. No GPU assertions.',
);
