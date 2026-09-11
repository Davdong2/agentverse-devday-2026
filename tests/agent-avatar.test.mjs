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
const design = url(compile('lib/agent-design.ts'));
const { agentDesigns, agentVariant, teamVariants, avatarMotion, pickAvatar } =
  await import(design);
const canvasSource = fs.readFileSync(
    'components/civilization-canvas.tsx',
    'utf8',
  ),
  spriteSource = fs.readFileSync('components/world-scene.tsx', 'utf8'),
  walkSource = fs.readFileSync('components/world-walk.tsx', 'utf8'),
  homeEffectsSource = fs.readFileSync(
    'components/home-world-effects.tsx',
    'utf8',
  ),
  civilizationSource = fs.readFileSync('components/civilization.tsx', 'utf8');
assert.ok(canvasSource.includes('agent-diverse-atlas.png'));
assert.ok(spriteSource.includes('agent-diverse-atlas.png'));
assert.ok(homeEffectsSource.includes('agent-diverse-atlas.png'));
assert.ok(homeEffectsSource.includes('drawAvatarSprite'));
assert.ok(homeEffectsSource.includes('agentVariant(agent)'));
assert.ok(!homeEffectsSource.includes('drawTinyAgent'));
assert.ok(civilizationSource.includes('agents={roster}'));
assert.ok(!walkSource.includes('setPanelAtlas'));
assert.ok(!walkSource.includes('walk-instructions'));
assert.ok(!walkSource.includes('agentverse-walk-introduction'));
assert.ok(
  !fs.readFileSync('components/agent-avatar.ts', 'utf8').includes('heartPlate'),
);
assert.ok(
  !fs.readFileSync('components/agent-avatar.ts', 'utf8').includes('backPlate'),
);
assert.ok(
  !fs.readFileSync('lib/vector-agent.ts', 'utf8').includes('visorWidth'),
);
assert.ok(
  canvasSource.includes('drawAvatarSprite') &&
    canvasSource.includes('drawVectorAgent') &&
    spriteSource.includes('drawAvatarSprite'),
  'Close observation and profile cards share the authored skin; vector rendering remains the loading fallback',
);
assert.equal(agentDesigns.length, 8);
assert.equal(new Set(agentDesigns.map((a) => a.color)).size, 8);
const { agents } = JSON.parse(fs.readFileSync('lib/agents.json', 'utf8'));
const team = ['2083', '8355', '9626', '8136'];
team.forEach((id, i) =>
  assert.equal(
    agentVariant(agents.find((a) => a.agentId === id)),
    teamVariants[i],
  ),
);
for (const a of agents) assert.ok(agentVariant(a) >= 0 && agentVariant(a) < 8);
const source = compile('components/agent-avatar.ts')
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
  .replace(/(['"])@\/lib\/agent-design\1/g, JSON.stringify(design));
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          beginPath() {},
          arc() {},
          ellipse() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
          fillRect() {},
        };
      },
    };
  },
};
const { createAvatarFactory } = await import(url(source));
const factory = createAvatarFactory(),
  avatar = factory.create(0);
assert.ok(
  avatar.head.scale.x > avatar.body.scale.x * 1.5,
  'Reference silhouette has an oversized rounded head',
);
assert.equal(avatar.eyes.length, 2);
assert.equal(avatar.limbs.length, 2);
assert.ok(
  avatar.pickable.every((p) => p.userData.instance === 0),
  'Head, body and capability cube open the same identity',
);
avatar.update(0, 2, avatarMotion(2, 0, 1, 0.5, true, true), true);
assert.notEqual(avatar.limbs[0].leg.rotation.x, 0);
assert.equal(avatar.limbs[0].leg.rotation.x, -avatar.limbs[1].leg.rotation.x);
assert.equal(
  avatar.head.material.type,
  'MeshPhongMaterial',
  'Shell responds to specular lighting',
);
assert.equal(
  avatar.eyes[0].material.color.getHexString(),
  '162937',
  'Near camera restores two independent dark oval eyes',
);
assert.ok(
  avatar.skillEdge.visible,
  'Near camera exposes capability edge highlights',
);
assert.equal(avatar.eyeGlints.length, 2);
assert.ok(
  avatar.eyeGlints.every((m) => m.visible),
  'Near camera adds a restrained highlight to each independent eye',
);
assert.ok(avatar.chestRing.visible && avatar.neckCollar.visible);
assert.equal(avatar.shoulderRings.length, 2);
assert.equal(avatar.sidePorts.length, 2);
assert.equal(avatar.earPorts.length, 2);
assert.equal(avatar.soleLights.length, 2);
assert.ok(
  avatar.shoulderRings.every((m) => m.visible) &&
    avatar.earPorts.every((m) => m.visible) &&
    avatar.sidePorts.every((m) => m.visible) &&
    avatar.backCore.visible,
  'Close range exposes physical joints and interface hardware',
);
const working = avatarMotion(8, 0, 4, 0.1, true, false);
avatar.update(0, 8, working, true);
avatar.g.updateMatrixWorld(true);
assert.ok(
  working.leftArm > 0 && working.rightArm > 0,
  'Hands extend toward the -Z face direction',
);
assert.ok(
  avatar.extra.every((m) => m.visible),
  'Leader displays the combined capability modules',
);
assert.ok(
  avatar.capability.visible,
  'Working group presents a shared capability core',
);
assert.ok(
  avatar.toolGroup.visible && avatar.toolAura.visible,
  'The active collaborator keeps its physical tool and work aura visible',
);
const split = avatarMotion(15, 0, 7, 0.2, true, true);
avatar.update(0, 15, split, true);
assert.ok(
  avatar.extra.every((m) => !m.visible),
  'Composite modules separate after work',
);
assert.deepEqual(
  avatarMotion(8, 0, 4, 0.1, true, false),
  working,
  'Identical world time produces identical motion',
);
const silhouettes = new Set(),
  skins = new Set(),
  modules = new Set();
for (let v = 0; v < 8; v++) {
  avatar.update(v, 3, avatarMotion(3, 4, 0, 0, false, false), false);
  assert.ok(avatar.skill.material.color instanceof THREE.Color);
  skins.add(avatar.head.material.color.getHex());
  modules.add(avatar.skill.scale.toArray().join());
  silhouettes.add(
    avatar.head.geometry.type +
      avatar.head.scale.toArray().join() +
      avatar.body.scale.toArray().join(),
  );
}
assert.equal(skins.size, 8, 'All types have distinct body skins');
assert.equal(
  modules.size,
  8,
  'Every capability family has a distinct physical module proportion',
);
assert.equal(
  silhouettes.size,
  8,
  'All types have distinct head and body proportions',
);
assert.equal(
  avatar.farShell.visible,
  true,
  'Distant body retains a complete silhouette',
);
assert.equal(
  avatar.farShell.children.length,
  3,
  'Cached shell, dark insets and eyes require only three draw calls',
);
const bounds = new THREE.Box3().setFromObject(avatar.farShell);
assert.ok(
  bounds.min.y < 0.12 && bounds.max.y > 1.5,
  'Distant silhouette includes separate feet, torso and head',
);
assert.ok(
  avatar.farShell.children.every((m) => avatar.pickable.includes(m)),
  'Distant figures keep the same clickable identity',
);
assert.equal(
  avatar.limbs[0].arm.visible,
  false,
  'Far LOD suppresses articulated limb draw calls',
);
assert.ok(
  avatar.eyeGlints.every((m) => !m.visible) &&
    avatar.earPorts.every((m) => !m.visible) &&
    avatar.sidePorts.every((m) => !m.visible) &&
    !avatar.chestRing.visible,
  'Fine facial and connector details are culled by the distant LOD',
);
const hit = {
  x: 100,
  y: 100,
  width: 40,
  height: 49,
  instance: 0,
  agentId: '2083',
};
assert.equal(
  pickAvatar([hit], 100, 52)?.agentId,
  '2083',
  'Capability cube is clickable in Canvas',
);
assert.equal(
  pickAvatar([hit], 100, 98)?.agentId,
  '2083',
  'Feet remain clickable',
);
assert.equal(
  pickAvatar([hit], 150, 50),
  null,
  'Background does not select a distant Agent',
);
factory.dispose();
console.log(
  'PASS: 8 reference variants, consistent real-profile identity, rounded-head proportions, clickable capability cubes, alternating gait, forward handoff, composite/split sequencing and deterministic motion. No browser or GPU assertions.',
);
