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
const { sampleAgents, regions } = await import(model);
const { environmentFor } = await import(
  url(compile('lib/world-environment.ts'))
);
assert.ok(environmentFor('tide', 8).sun > environmentFor('calm', 0).sun);
assert.ok(
  environmentFor('storm', -8).exposure < environmentFor('calm').exposure,
);
assert.ok(environmentFor('tide', 8).flow > environmentFor('calm').flow);
assert.ok(
  Object.values(environmentFor('calm', NaN)).every(
    (v) => typeof v !== 'number' || Number.isFinite(v),
  ),
);
const { parseWorldNews } = await import(url(compile('lib/world-news.ts')));
const now = Date.parse('2026-09-08T00:00:00Z');
const item = (
  title,
  link = 'https://www.coindesk.com/markets/example',
  date = 'Mon, 07 Sep 2026 15:00:00 +0000',
) =>
  `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate></item>`;
const rss = (s) => `<rss><channel>${s}</channel></rss>`;
const result = parseWorldNews(
  rss(
    item('ETF signal') +
      item('Duplicate') +
      item('Hack reported', 'https://www.coindesk.com/security/example') +
      item('Bad host', 'https://evil.example/'),
  ),
  now,
);
assert.equal(result.length, 2);
assert.equal(result[0].category, 'ETF 动态');
assert.equal(result[1].region, 6);
assert.equal(
  parseWorldNews(
    rss(
      item(
        'Old',
        'https://www.coindesk.com/old',
        'Tue, 01 Sep 2026 00:00:00 +0000',
      ),
    ),
    now,
  ).length,
  0,
);
assert.equal(
  parseWorldNews(
    rss(
      item(
        'Future',
        'https://www.coindesk.com/future',
        'Tue, 08 Sep 2026 20:00:00 +0000',
      ),
    ),
    now,
  ).length,
  0,
);
assert.equal(
  parseWorldNews(rss(item('Script', 'javascript:alert(1)')), now).length,
  0,
);
assert.throws(() => parseWorldNews('<html>blocked</html>'));
const { createWorldEffects } = await import(
  url(
    compile('components/world-effects.ts')
      .replace(/(['"])three\1/g, JSON.stringify(import.meta.resolve('three')))
      .replace(/(['"])@\/lib\/civilization-model\1/g, JSON.stringify(model)),
  )
);
const scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera();
camera.position.set(46.8, 1.65, 51.5);
const effects = createWorldEffects(scene),
  agents = JSON.parse(fs.readFileSync('lib/agents.json')).agents;
const states = sampleAgents(agents, {}, 7, 'calm');
effects.update(7, 2, 0.5, states, camera, 0, 'calm');
assert.equal(effects.ribbons.filter((m) => m.visible).length, 12);
assert.equal(
  effects.networkMotes.geometry.attributes.position.count,
  180,
  'Ten districts share a lightweight 180-packet data atmosphere',
);
assert.equal(effects.networkMotes.geometry.drawRange.count, 180);
assert.equal(effects.regionBeacons.count, 10);
assert.equal(effects.regionBeacons.visible, true);
assert.equal(
  effects.agentFibers.geometry.drawRange.count,
  states.length * 4,
  'Every live Agent receives two last-mile fiber strands',
);
assert.equal(effects.agentFiberPackets.count, states.length);
const data = effects.ribbons[0].geometry.attributes.position;
const midpoint = new THREE.Vector3(
  (data.getX(0) + data.getX(1)) / 2,
  (data.getY(0) + data.getY(1)) / 2,
  (data.getZ(0) + data.getZ(1)) / 2,
);
assert.ok(
  midpoint.distanceTo(
    new THREE.Vector3(states[0].x * 100, 1.1, states[0].y * 100),
  ) < 0.0001,
  'Beam begins at the actual shared actor',
);
for (const m of effects.ribbons)
  assert.ok([...m.geometry.attributes.position.array].every(Number.isFinite));
effects.update(7, 2, 0.5, states, camera, 2, 'attack', 6);
assert.equal(effects.ribbons.filter((m) => m.visible).length, 4);
assert.equal(effects.clouds.count, 12);
assert.equal(effects.networkMotes.geometry.drawRange.count, 54);
assert.equal(effects.regionBeacons.visible, false);
assert.equal(effects.agentFibers.geometry.drawRange.count, 48);
assert.equal(effects.agentFiberPackets.count, 12);
assert.equal(effects.eventCage.visible, false);
assert.equal(effects.eventWave.position.x, regions[6].x * 100);
effects.update(7, 2, 0.5, states, camera, 0, 'attack', 6);
assert.equal(effects.eventCage.visible, true);
const eventOrbit = new THREE.Matrix4();
effects.eventCage.getMatrixAt(0, eventOrbit);
assert.ok(eventOrbit.elements.every(Number.isFinite));
effects.update(17, 8, 0.5, states, camera, 0, 'calm');
assert.equal(effects.ribbons.filter((m) => m.visible).length, 0);
assert.equal(effects.specks.visible, false);
effects.dispose();
assert.equal(scene.children.length, 0);
console.log(
  'PASS: sourced news validation, expiry and routing; bullish/bearish environment; shared actor ribbons, reduced effects tiers and cleanup. No browser/GPU validation.',
);
