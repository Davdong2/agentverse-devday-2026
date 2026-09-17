import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { regions, type MarketSignal } from '@/lib/civilization-model';

type DataPanel = {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
};

const protocolNames = [
  ['OKX.AI', 'AGENT 名录'],
  ['X LAYER', 'AGENT ECONOMY'],
  ['AGENT PAY', 'USDT0 结算'],
  ['ONCHAIN OS', '链上工具'],
  ['A2A', '服务协作'],
  ['IGNIX', 'TOKEN 关联'],
] as const;

const payloadNames = [
  ['BTC', '#F1A94B'],
  ['ETH', '#8FA9F2'],
  ['SOL', '#84E4C1'],
  ['OKB', '#DDEAF4'],
  ['USDT0', '#4CCB9B'],
  ['RWA', '#E6C06E'],
  ['A2A', '#78C9FF'],
  ['MCP', '#B99AF0'],
] as const;

/**
 * A physical Agent-economy layer for the walkable world. All numbers shown on
 * dynamic walls come from the current page state; the rest is labelled Demo
 * infrastructure and should be read as world-building rather than chain proof.
 */
export function createAgentEconomy(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'okx-xlayer-agent-economy';
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
  const box = geo(new RoundedBoxGeometry(1, 1, 1, 3, 0.07));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 36));
  const sphere = geo(new THREE.SphereGeometry(1, 28, 20));
  const torus = geo(new THREE.TorusGeometry(1, 0.025, 6, 96));
  const packetGeometry = geo(new RoundedBoxGeometry(1, 1, 1, 2, 0.12));
  const shell = mat(
    new THREE.MeshPhongMaterial({
      color: '#CBD3D8',
      specular: '#FFFFFF',
      shininess: 96,
    }),
  );
  const graphite = mat(
    new THREE.MeshPhongMaterial({
      color: '#121C27',
      specular: '#7894A7',
      shininess: 78,
    }),
  );
  const gold = mat(
    new THREE.MeshPhongMaterial({
      color: '#C99B55',
      specular: '#FFF0CB',
      shininess: 112,
    }),
  );
  const cyan = mat(
    new THREE.MeshBasicMaterial({
      color: '#7BE4FF',
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const mint = mat(
    new THREE.MeshBasicMaterial({
      color: '#72E2BA',
      transparent: true,
      opacity: 0.54,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const amber = mat(
    new THREE.MeshBasicMaterial({
      color: '#FFD17B',
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const coreFill = mat(
    new THREE.MeshBasicMaterial({
      color: '#247EAA',
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
    }),
  );
  const coreMark = mat(
    new THREE.MeshBasicMaterial({
      color: '#BDEFFF',
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
  );
  const coreRing = mat(
    new THREE.MeshBasicMaterial({
      color: '#75DFFF',
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const cx = regions[0].x * 100;
  const cz = regions[0].y * 100;
  const coreZ = cz - 7.9;

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

  function panelTexture(
    title: string,
    line1: string,
    line2: string,
    accent = '#7BE4FF',
    size: [number, number] = [1024, 384],
  ): DataPanel {
    const canvas = document.createElement('canvas');
    canvas.width = size[0];
    canvas.height = size[1];
    const ctx = canvas.getContext('2d')!;
    const draw = (a: string, b: string, c: string) => {
      ctx.fillStyle = '#07131D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#102A37';
      ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
      ctx.fillStyle = accent;
      ctx.fillRect(18, 18, 12, canvas.height - 36);
      ctx.fillStyle = '#F1FAFC';
      ctx.font = `600 ${Math.round(canvas.height * 0.17)}px system-ui`;
      ctx.fillText(a, 62, canvas.height * 0.32, canvas.width - 110);
      ctx.fillStyle = '#A8DDEA';
      ctx.font = `500 ${Math.round(canvas.height * 0.105)}px system-ui`;
      ctx.fillText(b, 64, canvas.height * 0.57, canvas.width - 120);
      ctx.fillStyle = '#D3B477';
      ctx.font = `500 ${Math.round(canvas.height * 0.085)}px system-ui`;
      ctx.fillText(c, 64, canvas.height * 0.79, canvas.width - 120);
    };
    draw(title, line1, line2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.push(texture);
    return { canvas, texture };
  }

  function redrawPanel(
    panel: DataPanel,
    title: string,
    line1: string,
    line2: string,
    accent: string,
  ) {
    const ctx = panel.canvas.getContext('2d')!;
    const width = panel.canvas.width;
    const height = panel.canvas.height;
    ctx.fillStyle = '#07131D';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#102A37';
    ctx.fillRect(18, 18, width - 36, height - 36);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    ctx.fillStyle = accent;
    ctx.fillRect(18, 18, 12, height - 36);
    ctx.fillStyle = '#F1FAFC';
    ctx.font = `600 ${Math.round(height * 0.17)}px system-ui`;
    ctx.fillText(title, 62, height * 0.32, width - 110);
    ctx.fillStyle = '#A8DDEA';
    ctx.font = `500 ${Math.round(height * 0.105)}px system-ui`;
    ctx.fillText(line1, 64, height * 0.57, width - 120);
    ctx.fillStyle = '#D3B477';
    ctx.font = `500 ${Math.round(height * 0.085)}px system-ui`;
    ctx.fillText(line2, 64, height * 0.79, width - 120);
    panel.texture.needsUpdate = true;
  }

  function mountScreen(
    parent: THREE.Object3D,
    panel: DataPanel,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
  ) {
    part(parent, box, shell, x, y, z, width + 0.34, height + 0.34, 0.28);
    part(
      parent,
      box,
      graphite,
      x,
      y,
      z + 0.16,
      width + 0.12,
      height + 0.12,
      0.08,
    );
    const screenMaterial = mat(
      new THREE.MeshBasicMaterial({
        map: panel.texture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    part(parent, plane, screenMaterial, x, y, z + 0.212, width, height, 1);
    for (const side of [-1, 1])
      part(
        parent,
        cylinder,
        gold,
        x + side * (width / 2 + 0.11),
        y - height / 2 - 0.08,
        z + 0.05,
        0.055,
        0.08,
        0.055,
      );
  }

  // Hero network: a luminous X Layer core grows from the same physical GPU
  // oculus used by the collaboration animation.
  const networkCore = new THREE.Group();
  networkCore.name = 'xlayer-network-core';
  networkCore.position.set(cx, 8.35, coreZ);
  root.add(networkCore);
  part(networkCore, sphere, cyan, 0, 0, 0, 2.15, 2.15, 2.15).material = mat(
    new THREE.MeshBasicMaterial({
      color: '#7DDFFF',
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  part(networkCore, sphere, coreFill, 0, 0, 0, 1.78, 1.78, 1.78);
  const xBarA = part(networkCore, box, coreMark, 0, 0, 0, 0.19, 1.72, 0.19);
  const xBarB = part(networkCore, box, coreMark, 0, 0, 0, 0.19, 1.72, 0.19);
  xBarA.rotation.z = Math.PI / 4;
  xBarB.rotation.z = -Math.PI / 4;
  const coreRings = [2.75, 3.25, 3.85].map((radius, index) => {
    const ring = part(
      networkCore,
      torus,
      coreRing,
      0,
      0,
      0,
      radius,
      radius,
      radius,
    );
    ring.rotation.set(Math.PI / 2 + index * 0.35, index * 0.7, 0);
    return ring;
  });
  const heroPanel = panelTexture(
    'AGENTVERSE',
    'X LAYER · AGENT NATIVE WORLD',
    'OKX.AI · A2A · ONCHAIN OS · DEMO WORLD',
  );
  mountScreen(root, heroPanel, cx, 4.95, cz - 9.15, 5.4, 1.4);
  part(root, box, graphite, cx, 2.55, cz - 9.32, 0.28, 4.65, 0.28);
  part(root, cylinder, gold, cx, 0.14, cz - 9.32, 1.15, 0.16, 1.15);

  // Actual page data is set into these two hardware walls by setData().
  const directoryPanel = panelTexture(
    'OKX.AI DIRECTORY',
    '正在载入 Agent 资料',
    '资料来源与行为模式分开标记',
    '#78D7FF',
  );
  const marketPanel = panelTexture(
    'OKX MARKET DATA',
    'BTC / USDT · 等待行情',
    '行情来源会显示 LIVE 或缓存',
    '#70DEB6',
  );
  const leftWall = new THREE.Group();
  leftWall.position.set(cx - 7.1, 3.4, cz - 6.7);
  leftWall.rotation.y = 0.24;
  root.add(leftWall);
  mountScreen(leftWall, directoryPanel, 0, 0, 0, 3.15, 1.55);
  part(leftWall, box, graphite, 0, -1.45, -0.08, 0.18, 2.6, 0.18);
  part(leftWall, cylinder, gold, 0, -2.77, -0.08, 0.82, 0.12, 0.82);
  const rightWall = new THREE.Group();
  rightWall.position.set(cx + 7.1, 3.4, cz - 6.7);
  rightWall.rotation.y = -0.24;
  root.add(rightWall);
  mountScreen(rightWall, marketPanel, 0, 0, 0, 3.15, 1.55);
  part(rightWall, box, graphite, 0, -1.45, -0.08, 0.18, 2.6, 0.18);
  part(rightWall, cylinder, gold, 0, -2.77, -0.08, 0.82, 0.12, 0.82);

  // Six protocol towers turn the far side of the platform into an Agent city.
  const protocolPillars = protocolNames.map(([title, subtitle], index) => {
    const pillar = new THREE.Group();
    pillar.name = `protocol-pillar-${title.toLowerCase().replaceAll('.', '')}`;
    pillar.position.set(
      cx - 8.2 + index * 3.28,
      0,
      cz - 12.9 - (index % 2) * 1.15,
    );
    root.add(pillar);
    part(pillar, cylinder, graphite, 0, 0.16, 0, 0.92, 0.24, 0.92);
    part(pillar, cylinder, gold, 0, 0.34, 0, 0.72, 0.08, 0.72);
    part(pillar, box, shell, 0, 2.2, 0, 1.3, 3.75 + (index % 2) * 0.72, 1.05);
    part(pillar, box, graphite, 0, 2.25, 0.56, 1.08, 2.75, 0.08);
    part(
      pillar,
      box,
      index % 3 === 0 ? cyan : index % 3 === 1 ? mint : amber,
      0,
      4.25 + (index % 2) * 0.36,
      0,
      0.82,
      0.12,
      0.82,
    );
    const screen = panelTexture(
      title,
      subtitle,
      'AGENTVERSE · DEMO INFRA',
      index % 3 === 0 ? '#78D7FF' : index % 3 === 1 ? '#70DEB6' : '#FFD17B',
      [512, 512],
    );
    const screenMat = mat(
      new THREE.MeshBasicMaterial({
        map: screen.texture,
        toneMapped: false,
      }),
    );
    part(pillar, plane, screenMat, 0, 2.26, 0.615, 0.93, 0.93, 1);
    return pillar;
  });

  // The upper compute ring carries ecosystem names as integrated illuminated
  // fascia. Panels face the center, so observers can read them while moving.
  const bannerTexts = [
    'OKX.AI AGENTS',
    'X LAYER',
    'A2A SERVICES',
    'AGENT PAY',
    'USDT0',
    'ONCHAIN OS',
    'DEX · DEFI',
    'RWA DATA',
    'AGENT TOKENS',
    'CO-CREATE',
  ];
  const bannerTextures = bannerTexts.map((text, index) =>
    panelTexture(
      text,
      index % 2 ? 'AGENT ECONOMY' : 'AGENT NATIVE NETWORK',
      'DEMO WORLD',
      index % 3 === 0 ? '#78D7FF' : index % 3 === 1 ? '#70DEB6' : '#FFD17B',
      [768, 256],
    ),
  );
  const banners = bannerTextures.map((panel, index) => {
    const angle = (index * Math.PI * 2) / bannerTextures.length + 0.16;
    const banner = new THREE.Group();
    banner.position.set(
      cx + Math.cos(angle) * 10.25,
      9.18,
      cz + Math.sin(angle) * 10.25,
    );
    banner.rotation.y = Math.atan2(
      cx - banner.position.x,
      cz - banner.position.z,
    );
    root.add(banner);
    part(banner, box, graphite, 0, 0, 0, 1.55, 0.42, 0.16);
    const bannerMat = mat(
      new THREE.MeshBasicMaterial({
        map: panel.texture,
        toneMapped: false,
      }),
    );
    part(banner, plane, bannerMat, 0, 0, 0.092, 1.38, 0.31, 1);
    return banner;
  });

  // Crypto assets and Agent protocol packets orbit as solid modules rather
  // than detached sprites, echoing the capability blocks carried by Agents.
  const payloads = payloadNames.map(([ticker, color], index) => {
    const payload = new THREE.Group();
    payload.name = `economy-payload-${ticker.toLowerCase()}`;
    root.add(payload);
    const face = panelTexture(
      ticker,
      'X LAYER',
      'DEMO MODULE',
      color,
      [384, 384],
    );
    const side = mat(
      new THREE.MeshPhongMaterial({
        color,
        specular: '#FFFFFF',
        shininess: 110,
        transparent: true,
        opacity: 0.86,
      }),
    );
    const faceMat = mat(
      new THREE.MeshBasicMaterial({
        map: face.texture,
        toneMapped: false,
      }),
    );
    const cube = part(
      payload,
      packetGeometry,
      [side, side, side, side, faceMat, faceMat],
      0,
      0,
      0,
      0.58,
      0.58,
      0.58,
    );
    cube.add(
      new THREE.LineSegments(
        geo(new THREE.EdgesGeometry(packetGeometry, 24)),
        mat(
          new THREE.LineBasicMaterial({
            color: '#E9FBFF',
            transparent: true,
            opacity: 0.72,
          }),
        ),
      ),
    );
    payload.userData.index = index;
    return payload;
  });

  const packetMaterial = mat(
    new THREE.MeshBasicMaterial({
      color: '#B9F0FF',
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
  const dataPackets = new THREE.InstancedMesh(
    packetGeometry,
    packetMaterial,
    36,
  );
  dataPackets.name = 'xlayer-a2a-packet-stream';
  dataPackets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  dataPackets.frustumCulled = false;
  root.add(dataPackets);
  const dummy = new THREE.Object3D();
  let lastDataKey = '';

  return {
    root,
    networkCore,
    protocolPillars,
    banners,
    payloads,
    dataPackets,
    directoryPanel,
    marketPanel,
    setData(
      agentCount: number,
      ignixCount: number,
      signal?: MarketSignal | null,
    ) {
      const key = `${agentCount}:${ignixCount}:${signal?.last ?? ''}:${signal?.change ?? ''}:${signal?.mode ?? ''}`;
      if (key === lastDataKey) return;
      lastDataKey = key;
      redrawPanel(
        directoryPanel,
        'OKX.AI DIRECTORY',
        `${agentCount} 个已载入 Agent 档案`,
        `${ignixCount} 个 IGNIX TOKEN 关联 · 资料状态见页面`,
        '#78D7FF',
      );
      redrawPanel(
        marketPanel,
        'OKX MARKET DATA',
        signal
          ? `BTC / USDT  ${signal.last.toLocaleString('en-US', { maximumFractionDigits: 2 })}  ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%`
          : 'BTC / USDT · 等待行情信号',
        signal
          ? `OKX ${signal.mode === 'fresh' ? 'LIVE' : '缓存'} · 世界响应为 Demo`
          : '无行情时不生成模拟价格',
        signal?.change && signal.change < 0 ? '#F4AE83' : '#70DEB6',
      );
    },
    update(time: number, quality: number) {
      networkCore.rotation.y = time * 0.035;
      coreRings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 ? -0.08 : 0.065) + index;
      });
      protocolPillars.forEach((pillar, index) => {
        pillar.visible = quality < 2 || index % 2 === 0;
        pillar.position.y = Math.sin(time * 0.45 + index) * 0.025;
      });
      banners.forEach((banner, index) => {
        banner.visible = quality === 0 || index % 2 === 0;
      });
      payloads.forEach((payload, index) => {
        const angle = time * (0.09 + (index % 3) * 0.008) + index * 0.785;
        const radius = 4.25 + (index % 2) * 0.7;
        payload.position.set(
          cx + Math.cos(angle) * radius,
          5.85 + Math.sin(time * 0.7 + index) * 0.35 + (index % 2) * 0.6,
          coreZ + Math.sin(angle) * radius,
        );
        payload.rotation.set(time * 0.18 + index, -angle + Math.PI / 2, 0);
        payload.visible = quality < 2 || index % 2 === 0;
      });
      dataPackets.count = quality === 2 ? 12 : quality === 1 ? 24 : 36;
      for (let index = 0; index < dataPackets.count; index++) {
        const progress = (time * 0.075 + index / dataPackets.count) % 1;
        const angle = progress * Math.PI * 6 + index * 2.399963;
        const radius = 0.48 + progress * 3.9;
        dummy.position.set(
          cx + Math.cos(angle) * radius,
          0.25 + progress * 7.7,
          cz + (coreZ - cz) * progress + Math.sin(angle) * radius,
        );
        dummy.scale.setScalar(0.045 + (index % 3) * 0.018);
        dummy.rotation.set(time * 0.4, angle, 0);
        dummy.updateMatrix();
        dataPackets.setMatrixAt(index, dummy.matrix);
      }
      dataPackets.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      textures.forEach((item) => item.dispose());
      root.removeFromParent();
    },
  };
}
