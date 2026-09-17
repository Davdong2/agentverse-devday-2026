import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const written = [];
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          font: '',
          measureText(text) {
            return { width: Array.from(text).length * 20 };
          },
          beginPath() {},
          roundRect() {},
          fill() {},
          stroke() {},
          fillText(text) {
            written.push(text);
          },
        };
      },
    };
  },
};
const source = ts
  .transpileModule(fs.readFileSync('components/agent-labels.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    /(['"])three\1/g,
    JSON.stringify(import.meta.resolve('three')),
  );
const { createAgentLabels } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);
const factory = createAgentLabels(),
  first = factory.create(0),
  other = factory.create(1),
  name = '研究 Agent · 真实名字很长也完整保留';
first.update(name, 8, 900, 56, false, true);
other.update(name, 20, 900, 56, false, true);
assert.equal(
  written.filter((t) => t !== 'ig').join(''),
  name,
  'Wrapped label preserves the complete source name',
);
assert.equal(
  factory.cacheSize,
  1,
  'Duplicate world instances share a name texture',
);
assert.equal(first.sprite.material, other.sprite.material);
assert.equal(
  first.sprite.userData.instance,
  0,
  'Name click identifies exact actor',
);
assert.ok(
  other.sprite.scale.x > first.sprite.scale.x,
  'Distance compensation preserves readability',
);
const uncompensatedLabelScale = first.sprite.scale.x;
first.update(name, 8, 900, 56, false, true, false, 0.62);
assert.ok(
  first.sprite.scale.x > uncompensatedLabelScale * 1.5,
  'Smaller world bodies keep readable nameplates through parent-scale compensation',
);
assert.ok(
  other.sprite.position.y - first.sprite.position.y >= 0.19,
  'Nearby names are vertically staggered during collaboration',
);
const y = first.sprite.position.y;
first.update(name, 8, 900, 56, true, true);
assert.ok(
  first.sprite.position.y > y,
  'Composite skill crown does not cover name',
);
assert.equal(
  first.sprite.material.depthTest,
  true,
  'Architecture occludes nameplates',
);
first.update(name, 8, 900, 56, false, false);
assert.equal(
  first.sprite.visible,
  false,
  'Culled actors do not leave ghost names',
);
let disposed = false;
first.sprite.material.addEventListener('dispose', () => (disposed = true));
factory.dispose();
assert.ok(disposed);
console.log(
  'PASS: exact real names, Unicode wrapping, billboard sprites, shared textures, distance scaling, composite clearance, actor picking and disposal. No GPU assertion.',
);

const markedFactory = createAgentLabels(),
  marked = markedFactory.create(24);
marked.update('Xstocks', 10, 900, 56, false, true, true);
assert.equal(marked.badge.visible, true);
assert.equal(marked.badge.userData.instance, 24);
marked.update('Other', 10, 900, 56, false, true, false);
assert.equal(
  marked.badge.visible,
  false,
  'No IG mark without an exact association',
);
markedFactory.dispose();
