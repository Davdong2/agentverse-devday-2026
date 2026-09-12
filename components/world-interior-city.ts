import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { regions, type MarketSignal } from '@/lib/civilization-model';

const workCells = [
  ['RESEARCH AGENT', 'ONCHAIN DATA', '#77DFFF'],
  ['TRADING AGENT', 'DEX · LIQUIDITY', '#FFD078'],
  ['RISK AGENT', 'SECURITY · AUDIT', '#7DE1B5'],
  ['RWA AGENT', 'REAL WORLD ASSETS', '#AE9AFF'],
] as const;

const networkNodes = [
  ['OKX.AI', 'AGENT DISCOVERY'],
  ['X LAYER', 'SETTLEMENT'],
  ['AGENT PAY', 'USDT0 ESCROW'],
  ['ONCHAIN OS', 'WALLET · SWAP'],
] as const;

/**
 * The near field of the walkable world: a crisp skyline plate plus physical
 * work cells. It is deliberately behind the live Agents so the scene gains
 * depth without turning the interactive characters into another flat image.
 */
export function createInteriorCity(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'agentverse-interior-city-v2';
  scene.add(root);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const geo = <T extends THREE.BufferGeometry>(value: T) => {
    geometries.push(value);
    return value;
  };
  const mat = <T extends THREE.Material>(value: T) => {
    materials.push(value);
    return value;
  };
  const box = geo(new RoundedBoxGeometry(1, 1, 1, 3, 0.08));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 48));
  const torus = geo(new THREE.TorusGeometry(1, 0.028, 6, 96));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const silver = mat(
    new THREE.MeshPhongMaterial({
      color: '#BFC9CF',
      specular: '#FFFFFF',
      shininess: 112,
    }),
  );
  const graphite = mat(
    new THREE.MeshPhongMaterial({
      color: '#0B151F',
      specular: '#638CA6',
      shininess: 92,
    }),
  );
  const gold = mat(
    new THREE.MeshPhongMaterial({
      color: '#C99B51',
      specular: '#FFF0C8',
      shininess: 118,
    }),
  );
  const cyan = mat(
    new THREE.MeshBasicMaterial({
      color: '#70DFFF',
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const mint = mat(
    new THREE.MeshBasicMaterial({
      color: '#70E0B4',
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const amber = mat(
    new THREE.MeshBasicMaterial({
      color: '#FFD078',
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const cx = regions[0].x * 100;
  const cz = regions[0].y * 100;

  function part(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    parent.add(object);
    return object;
  }

  function screenTexture(
    title: string,
    subtitle: string,
    color: string,
    footnote = 'AGENTVERSE · DEMO WORLD',
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 384;
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 768, 384);
    gradient.addColorStop(0, '#071520');
    gradient.addColorStop(1, '#102B3B');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 768, 384);
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.strokeRect(14, 14, 740, 356);
    context.fillStyle = color;
    context.fillRect(14, 14, 13, 356);
    context.fillStyle = '#F4FBFC';
    context.font = '600 62px system-ui, sans-serif';
    context.fillText(title, 62, 128, 640);
    context.fillStyle = '#A6DCE8';
    context.font = '500 34px system-ui, sans-serif';
    context.fillText(subtitle, 64, 211, 630);
    context.fillStyle = '#D6B973';
    context.font = '500 23px system-ui, sans-serif';
    context.fillText(footnote, 64, 304, 630);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.push(texture);
    return texture;
  }

  // A generated environment plate supplies the distant city. It sits far
  // behind the live scene and is never used for collision or interaction.
  const backdropTexture = new THREE.TextureLoader().load(
    '/agentverse-interior-skyline-v2.webp',
  );
  backdropTexture.colorSpace = THREE.SRGBColorSpace;
  backdropTexture.anisotropy = 4;
  textures.push(backdropTexture);
  const backdropMaterial = mat(
    new THREE.MeshBasicMaterial({
      map: backdropTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  const backdrop = part(
    root,
    plane,
    backdropMaterial,
    cx,
    24.5,
    cz - 72,
    108,
    41.8,
    1,
  );
  backdrop.name = 'infinite-agent-city-backdrop';
  backdrop.renderOrder = -20;

  // The city threshold creates a strong first read from the default spawn.
  const threshold = new THREE.Group();
  threshold.name = 'xlayer-city-threshold';
  threshold.position.set(cx, 0, cz - 15.5);
  root.add(threshold);
  for (const side of [-1, 1]) {
    part(threshold, box, silver, side * 7.25, 5.4, 0, 0.58, 10.8, 0.72);
    part(threshold, box, graphite, side * 7.25, 5.45, 0.4, 0.4, 9.8, 0.08);
    part(threshold, box, cyan, side * 7.25, 5.45, 0.5, 0.13, 8.8, 0.035);
    part(threshold, cylinder, gold, side * 7.25, 0.11, 0, 1.0, 0.22, 1.0);
  }
  part(threshold, box, graphite, 0, 10.45, 0, 15.0, 0.55, 0.74);
  part(threshold, box, gold, 0, 10.78, 0, 14.5, 0.08, 0.78);
  const gateTexture = screenTexture(
    'OKX.AI  ×  X LAYER',
    'AGENT NATIVE ECONOMY',
    '#7BDFFF',
    'DISCOVER · COLLABORATE · PAY · OWN',
  );
  const gateMaterial = mat(
    new THREE.MeshBasicMaterial({ map: gateTexture, toneMapped: false }),
  );
  part(threshold, plane, gateMaterial, 0, 10.42, 0.405, 7.3, 1.23, 1);

  const workGroups = workCells.map(([title, subtitle, color], index) => {
    const group = new THREE.Group();
    group.name = `agent-work-cell-${title.toLowerCase().replaceAll(' ', '-')}`;
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    group.position.set(cx + side * (10.4 + row * 1.4), 0, cz - 4.7 - row * 7.2);
    group.rotation.y = side * (row ? -0.3 : -0.18);
    root.add(group);
    part(group, cylinder, graphite, 0, 0.22, 0, 2.8, 0.44, 2.8);
    part(group, cylinder, silver, 0, 0.43, 0, 2.53, 0.14, 2.53);
    part(group, torus, color === '#FFD078' ? amber : color === '#7DE1B5' ? mint : cyan, 0, 0.55, 0, 2.17, 2.17, 2.17).rotation.x = -Math.PI / 2;
    part(group, box, graphite, 0, 1.45, -0.72, 3.4, 1.75, 0.34).rotation.x = -0.12;
    const display = screenTexture(title, subtitle, color);
    const displayMaterial = mat(
      new THREE.MeshBasicMaterial({ map: display, toneMapped: false }),
    );
    const screen = part(group, plane, displayMaterial, 0, 1.58, -0.52, 3.08, 1.3, 1);
    screen.rotation.x = -0.12;
    for (const terminalSide of [-1, 1]) {
      part(group, box, silver, terminalSide * 1.45, 0.92, 0.82, 0.54, 0.92, 0.72);
      part(group, box, color === '#FFD078' ? amber : color === '#7DE1B5' ? mint : cyan, terminalSide * 1.45, 1.08, 0.46, 0.39, 0.44, 0.035);
    }
    return group;
  });

  // Four protocol pylons make the OKX/X Layer path legible before the user
  // reaches the central collaboration stage.
  const nodeGroups = networkNodes.map(([title, subtitle], index) => {
    const angle = -1.08 + index * 0.72;
    const group = new THREE.Group();
    group.name = `network-node-${title.toLowerCase().replaceAll('.', '')}`;
    group.position.set(cx + Math.sin(angle) * 17.8, 0, cz - 18 + Math.cos(angle) * 3.4);
    root.add(group);
    part(group, cylinder, graphite, 0, 0.22, 0, 1.2, 0.44, 1.2);
    part(group, cylinder, gold, 0, 0.48, 0, 0.92, 0.08, 0.92);
    part(group, box, silver, 0, 3.15, 0, 1.35, 5.25 + (index % 2), 1.1);
    part(group, box, graphite, 0, 3.2, 0.58, 1.08, 4.35, 0.08);
    part(group, box, index % 2 ? amber : cyan, 0, 5.95 + (index % 2) * 0.5, 0, 0.92, 0.13, 0.92);
    const display = screenTexture(title, subtitle, index % 2 ? '#FFD078' : '#77DFFF');
    const displayMaterial = mat(
      new THREE.MeshBasicMaterial({ map: display, toneMapped: false }),
    );
    part(group, plane, displayMaterial, 0, 3.22, 0.635, 0.96, 1.28, 1);
    return group;
  });

  const overheadRings = [13.5, 18.5].map((radius, index) => {
    const ring = part(root, torus, index ? gold : cyan, cx, 13.2 + index * 3.1, cz - 10, radius, radius, radius);
    ring.name = `overhead-data-ring-${index + 1}`;
    ring.rotation.x = Math.PI / 2;
    return ring;
  });

  const shuttleCount = 14;
  const shuttles = new THREE.InstancedMesh(box, silver, shuttleCount);
  const shuttleLights = new THREE.InstancedMesh(box, cyan, shuttleCount);
  shuttles.name = 'interior-agent-transit';
  shuttleLights.name = 'interior-agent-transit-light';
  shuttles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shuttleLights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shuttles.frustumCulled = false;
  shuttleLights.frustumCulled = false;
  root.add(shuttles, shuttleLights);
  const dummy = new THREE.Object3D();
  let signalState: MarketSignal | null | undefined;

  return {
    root,
    backdrop,
    threshold,
    workGroups,
    nodeGroups,
    overheadRings,
    shuttles,
    setSignal(signal?: MarketSignal | null) {
      signalState = signal;
    },
    update(time: number, quality: number) {
      const flow = signalState ? 1 + Math.min(1.4, Math.abs(signalState.change) / 5) : 1;
      overheadRings.forEach((ring, index) => {
        ring.rotation.z = time * (index ? -0.028 : 0.04);
        ring.visible = quality < 2 || index === 0;
      });
      workGroups.forEach((group, index) => {
        group.position.y = Math.sin(time * 0.45 + index) * 0.025;
        group.visible = quality < 2 || index < 2;
      });
      nodeGroups.forEach((group, index) => {
        group.visible = quality === 0 || index % 2 === 0;
      });
      shuttles.count = quality === 2 ? 5 : quality === 1 ? 9 : shuttleCount;
      shuttleLights.count = shuttles.count;
      for (let index = 0; index < shuttles.count; index++) {
        const lane = index % 3;
        const angle = time * (0.055 + lane * 0.009) * flow + index * 1.73;
        const radius = 17 + lane * 5.2;
        dummy.position.set(
          cx + Math.cos(angle) * radius,
          8.5 + lane * 2.15 + Math.sin(time * 0.55 + index) * 0.5,
          cz - 8 + Math.sin(angle) * radius * 0.42,
        );
        dummy.rotation.set(0, -angle + Math.PI / 2, 0);
        dummy.scale.set(0.9 + lane * 0.18, 0.18, 0.42);
        dummy.updateMatrix();
        shuttles.setMatrixAt(index, dummy.matrix);
        dummy.position.y -= 0.14;
        dummy.scale.set(0.58 + lane * 0.12, 0.035, 0.3);
        dummy.updateMatrix();
        shuttleLights.setMatrixAt(index, dummy.matrix);
      }
      shuttles.instanceMatrix.needsUpdate = true;
      shuttleLights.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      textures.forEach((item) => item.dispose());
      root.removeFromParent();
    },
  };
}
