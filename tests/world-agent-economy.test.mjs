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
const url = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
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
const source = compile('components/world-agent-economy.ts')
  .replace(/(['"])three\1/g, JSON.stringify(import.meta.resolve('three')))
  .replace(/(['"])(three\/addons\/[^'"]+)\1/g, (_, quote, module) =>
    JSON.stringify(import.meta.resolve(module)),
  )
  .replace(/(['"])@\/lib\/civilization-model\1/g, JSON.stringify(model));

const drawn = [];
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillRect() {},
          strokeRect() {},
          fillText(text) {
            drawn.push(text);
          },
        };
      },
    };
  },
};

const { createAgentEconomy } = await import(url(source));
const scene = new THREE.Scene();
const economy = createAgentEconomy(scene);
assert.equal(economy.protocolPillars.length, 6);
assert.equal(economy.banners.length, 10);
assert.equal(economy.payloads.length, 8);
assert.equal(economy.dataPackets.count, 36);
assert.ok(
  ['OKX.AI', 'X LAYER', 'AGENT PAY', 'ONCHAIN OS', 'A2A', 'IGNIX'].every(
    (label) => drawn.includes(label),
  ),
  'Internal city exposes the requested Agent-economy systems',
);
assert.ok(
  ['BTC', 'ETH', 'SOL', 'OKB', 'USDT0', 'RWA', 'MCP'].every((label) =>
    drawn.includes(label),
  ),
  'Crypto payloads are embedded in physical modules',
);
economy.setData(24, 5, {
  last: 77247.6,
  change: 0.52,
  mode: 'fresh',
});
assert.ok(
  drawn.includes('24 个已载入 Agent 档案') &&
    drawn.includes('5 个 IGNIX TOKEN 关联 · 资料状态见页面'),
);
assert.ok(
  drawn.some((line) => line.includes('77,247.6')) &&
    drawn.includes('OKX LIVE · 世界响应为 Demo'),
  'Live market provenance and Demo world response remain distinct',
);
economy.update(2, 0);
const firstPacket = new THREE.Matrix4();
economy.dataPackets.getMatrixAt(0, firstPacket);
economy.update(9, 0);
const movedPacket = new THREE.Matrix4();
economy.dataPackets.getMatrixAt(0, movedPacket);
assert.notDeepEqual(firstPacket.elements, movedPacket.elements);
economy.update(12, 2);
assert.equal(economy.dataPackets.count, 12);
assert.equal(
  economy.protocolPillars.filter((pillar) => pillar.visible).length,
  3,
);
assert.equal(economy.banners.filter((banner) => banner.visible).length, 5);
let disposed = false;
economy.directoryPanel.texture.addEventListener(
  'dispose',
  () => (disposed = true),
);
economy.dispose();
assert.equal(scene.children.length, 0);
assert.ok(disposed);
console.log(
  'PASS: physical OKX/X Layer Agent economy, protocol skyline, live-labelled market wall, orbiting crypto modules, performance tiers and cleanup.',
);
