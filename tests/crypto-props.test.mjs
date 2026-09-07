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
  .replace(/(['"])@\/lib\/civilization-model\1/g, JSON.stringify(model))
  .replace(/(['"])@\/lib\/crypto-world\1/g, JSON.stringify(crypto));
// Text-only canvas stand-in; checks Three scene state, not WebGL rendering or browser pixels.
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return { fillRect() {}, fillText() {} };
      },
    };
  },
};
const { createCryptoProps, createAgentEquipment } = await import(url(source));
const scene = new THREE.Scene(),
  picks = [];
const stations = createCryptoProps(scene, picks);
assert.equal(scene.children.length, 10);
assert.equal(picks.length, 20);
assert.ok(picks.every((p) => Number.isInteger(p.userData.region)));
const market = scene.children[5],
  input = market.children[2],
  output = market.children[3];
stations.update(3 - 5 * 1.7, 0);
const initial = input.position.x;
stations.update(15 - 5 * 1.7, 0);
assert.ok(input.position.x > initial);
assert.ok(output.position.x < 0);
assert.equal(
  market.children.at(-1).visible,
  true,
  'Completed task produces a visible receipt',
);
stations.update(3 - 5 * 1.7, 0);
assert.equal(
  market.children.at(-1).visible,
  false,
  'No receipt before task execution',
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
console.log(
  'PASS: 10 clickable Three task stations, physical asset exchange, correctly timed receipt, distinct security/trading gear and cleanup. No GPU assertions.',
);
