import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { regions, type MarketSignal } from '@/lib/civilization-model';
import type { WorldNews } from '@/lib/world-news';

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

const stockDemo = [
  ['NVDA', '184.62', 2.84],
  ['AAPL', '237.18', 0.72],
  ['TSLA', '418.36', -1.46],
  ['MSFT', '512.40', 1.08],
  ['COIN', '326.55', 3.92],
  ['MSTR', '366.81', -0.88],
] as const;

const flowDemo = [
  ['BTC ETF', 186, true],
  ['ETH ETF', 74, true],
  ['STABLECOIN', 128, true],
  ['EXCHANGE', 96, false],
  ['RWA', 42, true],
] as const;

type MarketWallKind =
  | 'news'
  | 'stocks'
  | 'flows'
  | 'bubbles'
  | 'onchain'
  | 'market';

/**
 * A fully spatial interior city. The far field is a procedural 360° dome and
 * every architectural layer inside it is real geometry, so turning or walking
 * away from the original spawn never exposes the edge of a backdrop image.
 */
export function createInteriorCity(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'agentverse-interior-city-v3-360';
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
  const skySphere = geo(new THREE.SphereGeometry(155, 64, 32));
  const towerBox = geo(new THREE.BoxGeometry(1, 1, 1));
  const tickerCylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 96, 1, true));
  const silver = mat(
    new THREE.MeshPhongMaterial({
      color: '#A8B6BE',
      specular: '#C9DBE5',
      shininess: 78,
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
  const skylineMetal = mat(
    new THREE.MeshStandardMaterial({
      color: '#526471',
      metalness: 0.88,
      roughness: 0.22,
      vertexColors: true,
    }),
  );
  const skylineGlass = mat(
    new THREE.MeshStandardMaterial({
      color: '#0A1D2C',
      metalness: 0.72,
      roughness: 0.16,
      emissive: '#071C2A',
      emissiveIntensity: 0.9,
    }),
  );
  const skylineGlow = mat(
    new THREE.MeshBasicMaterial({
      color: '#7BDEFF',
      vertexColors: true,
      transparent: true,
      opacity: 0.76,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const skyUniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0.35 },
  };
  const skyMaterial = mat(
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vDirection;
        uniform float uTime;
        uniform float uPulse;

        float hash3(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        void main() {
          vec3 dir = normalize(vDirection);
          float vertical = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 lower = vec3(0.004, 0.011, 0.020);
          vec3 upper = vec3(0.020, 0.055, 0.086);
          vec3 color = mix(lower, upper, pow(vertical, 0.72));
          float horizon = exp(-abs(dir.y + 0.04) * 8.0);
          color += vec3(0.025, 0.115, 0.165) * horizon * (0.65 + uPulse * 0.35);
          float aurora = sin(dir.x * 16.0 + dir.z * 12.0 + uTime * 0.035);
          aurora = smoothstep(0.72, 1.0, aurora) * smoothstep(-0.05, 0.55, dir.y);
          color += vec3(0.015, 0.070, 0.095) * aurora;
          float starSeed = hash3(floor(dir * 920.0));
          float stars = step(0.9968, starSeed) * smoothstep(-0.05, 0.48, dir.y);
          color += vec3(0.58, 0.82, 1.0) * stars * (0.45 + 0.55 * sin(uTime * 0.7 + starSeed * 24.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  const cx = regions[0].x * 100;
  const cz = regions[0].y * 100;
  const worldCx = 50;
  const worldCz = 52;
  const blockers: Array<{ x: number; z: number; radius: number }> = [];

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

  function dynamicTexture(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    textures.push(texture);
    return { canvas, context: canvas.getContext('2d')!, texture };
  }

  function shorten(
    value: string,
    context: CanvasRenderingContext2D,
    width: number,
  ) {
    if (context.measureText(value).width <= width) return value;
    let result = value;
    while (result.length > 8 && context.measureText(`${result}…`).width > width)
      result = result.slice(0, -1);
    return `${result}…`;
  }

  function wallBase(
    context: CanvasRenderingContext2D,
    title: string,
    mode: string,
    accent: string,
  ) {
    const gradient = context.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, '#06131E');
    gradient.addColorStop(0.58, '#0A1F2A');
    gradient.addColorStop(1, '#061018');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 512);
    context.strokeStyle = '#315263';
    context.lineWidth = 3;
    context.strokeRect(12, 12, 1000, 488);
    context.fillStyle = accent;
    context.fillRect(12, 12, 10, 488);
    context.font = '700 44px system-ui, sans-serif';
    context.fillStyle = '#F3FAFC';
    context.fillText(title, 54, 72);
    context.font = '700 20px system-ui, sans-serif';
    const modeWidth = Math.max(94, context.measureText(mode).width + 34);
    context.fillStyle =
      mode === 'LIVE'
        ? '#0E714F'
        : mode.includes('缓存')
          ? '#5A4926'
          : '#273C49';
    context.fillRect(970 - modeWidth, 34, modeWidth, 48);
    context.fillStyle =
      mode === 'LIVE'
        ? '#86F2BE'
        : mode.includes('缓存')
          ? '#FFD078'
          : '#9DC7D4';
    context.textAlign = 'center';
    context.fillText(mode, 970 - modeWidth / 2, 66);
    context.textAlign = 'left';
    context.strokeStyle = '#21414F';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(54, 98);
    context.lineTo(970, 98);
    context.stroke();
  }

  function paintMarketWall(
    kind: MarketWallKind,
    context: CanvasRenderingContext2D,
    time: number,
    signal?: MarketSignal | null,
    news?: WorldNews | null,
  ) {
    const positive = '#3CE6A1';
    const negative = '#FF6E7A';
    const cyanText = '#7BDEFF';
    context.clearRect(0, 0, 1024, 512);

    if (kind === 'news') {
      const mode = news?.mode === 'fresh' ? 'LIVE' : news ? '缓存' : '暂无数据';
      wallBase(context, '世界新闻流', mode, '#7BDEFF');
      const items = news?.items.slice(0, 3) ?? [];
      context.font = '600 24px system-ui, sans-serif';
      items.forEach((item, index) => {
        const y = 148 + index * 94;
        context.fillStyle = index === 0 ? '#7BDEFF' : '#86A6B2';
        context.fillRect(54, y - 20, 10, 10);
        context.fillStyle = '#EEF6F8';
        context.fillText(shorten(item.title, context, 820), 86, y);
        context.font = '500 18px system-ui, sans-serif';
        context.fillStyle = '#7FA4B1';
        context.fillText(`${item.category} · COINDESK`, 86, y + 32);
        context.font = '600 24px system-ui, sans-serif';
      });
      if (!items.length) {
        context.fillStyle = '#86A6B2';
        context.font = '500 30px system-ui, sans-serif';
        context.fillText('等待公开新闻信号进入研究区', 54, 226);
      }
      context.fillStyle = '#0B2935';
      context.fillRect(54, 438, 916, 42);
      context.fillStyle = cyanText;
      context.font = '600 19px system-ui, sans-serif';
      const marquee = items[0]?.title ?? 'AGENTVERSE · REALITY SIGNAL INTAKE';
      const shift = (time * 42) % 620;
      context.fillText(shorten(marquee, context, 780), 72 - shift, 466);
      context.fillText(shorten(marquee, context, 780), 720 - shift, 466);
      return;
    }

    if (kind === 'stocks') {
      wallBase(context, '美股观察', 'DEMO', '#FFD078');
      context.font = '600 22px system-ui, sans-serif';
      stockDemo.forEach(([symbol, price, change], index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 54 + column * 305;
        const y = 150 + row * 160;
        context.fillStyle = '#102733';
        context.fillRect(x, y - 34, 270, 126);
        context.fillStyle = '#F4FAFC';
        context.fillText(symbol, x + 18, y);
        context.font = '700 30px ui-monospace, monospace';
        context.fillText(price, x + 18, y + 43);
        context.fillStyle = change >= 0 ? positive : negative;
        context.font = '700 22px ui-monospace, monospace';
        context.fillText(
          `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          x + 158,
          y + 43,
        );
        context.font = '600 22px system-ui, sans-serif';
      });
      context.fillStyle = '#7895A0';
      context.font = '500 18px system-ui, sans-serif';
      context.fillText('示意价格 · 等待接入授权的美股行情源', 54, 470);
      return;
    }

    if (kind === 'flows') {
      wallBase(context, '资金流入 / 流出', 'DEMO', '#AE9AFF');
      flowDemo.forEach(([label, amount, incoming], index) => {
        const y = 142 + index * 68;
        context.font = '600 21px system-ui, sans-serif';
        context.fillStyle = '#DCE8EC';
        context.fillText(label, 54, y);
        context.fillStyle = '#132A35';
        context.fillRect(260, y - 20, 540, 24);
        context.fillStyle = incoming ? positive : negative;
        context.fillRect(
          530,
          y - 20,
          (incoming ? 1 : -1) * Math.min(250, amount * 1.2),
          24,
        );
        context.fillStyle = incoming ? positive : negative;
        context.font = '700 20px ui-monospace, monospace';
        context.fillText(`${incoming ? '+' : '-'}$${amount}M`, 834, y);
      });
      context.strokeStyle = '#66808B';
      context.beginPath();
      context.moveTo(530, 112);
      context.lineTo(530, 430);
      context.stroke();
      context.fillStyle = '#7895A0';
      context.font = '500 18px system-ui, sans-serif';
      context.fillText('负向流出', 260, 466);
      context.fillText('正向流入', 700, 466);
      return;
    }

    if (kind === 'bubbles') {
      wallBase(context, '全球资产涨跌气泡', 'DEMO', '#70E0B4');
      const bubbles = [
        ['BTC', 2.6, 126, 214, 64],
        ['ETH', 1.4, 274, 304, 52],
        ['NVDA', 2.8, 414, 206, 70],
        ['TSLA', -1.5, 568, 318, 56],
        ['COIN', 3.9, 728, 198, 74],
        ['MSTR', -0.9, 884, 310, 48],
      ] as const;
      bubbles.forEach(([symbol, change, x, y, base], index) => {
        const radius = base + Math.sin(time * 0.7 + index) * 4;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle =
          change >= 0 ? 'rgba(31, 197, 126, .72)' : 'rgba(241, 72, 91, .72)';
        context.fill();
        context.strokeStyle = change >= 0 ? positive : negative;
        context.lineWidth = 4;
        context.stroke();
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.font = '700 22px system-ui, sans-serif';
        context.fillText(symbol, x, y - 4);
        context.font = '700 17px ui-monospace, monospace';
        context.fillText(
          `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
          x,
          y + 23,
        );
      });
      context.textAlign = 'left';
      context.fillStyle = '#7895A0';
      context.font = '500 18px system-ui, sans-serif';
      context.fillText('气泡面积映射示意涨跌幅 · 非实时行情', 54, 470);
      return;
    }

    if (kind === 'onchain') {
      wallBase(context, 'X Layer 链上资金路径', 'DEMO', '#7BDEFF');
      const nodes = [
        ['WALLET', 132, 196, positive],
        ['SWAP', 350, 308, cyanText],
        ['AGENT', 572, 186, '#FFD078'],
        ['USDT0', 808, 302, '#AE9AFF'],
      ] as const;
      context.lineWidth = 5;
      nodes.slice(0, -1).forEach((node, index) => {
        const next = nodes[index + 1];
        context.strokeStyle = index === 1 ? '#FFD078' : '#4FBED8';
        context.beginPath();
        context.moveTo(node[1] + 56, node[2]);
        context.bezierCurveTo(
          node[1] + 110,
          node[2] - 70,
          next[1] - 80,
          next[2] + 70,
          next[1] - 56,
          next[2],
        );
        context.stroke();
        const progress = (time * 0.18 + index * 0.27) % 1;
        const px = node[1] + (next[1] - node[1]) * progress;
        const py = node[2] + (next[2] - node[2]) * progress;
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(px, py, 8, 0, Math.PI * 2);
        context.fill();
      });
      nodes.forEach(([label, x, y, color]) => {
        context.fillStyle = '#102631';
        context.beginPath();
        context.arc(x, y, 54, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = color;
        context.lineWidth = 4;
        context.stroke();
        context.fillStyle = '#EEF7F9';
        context.textAlign = 'center';
        context.font = '700 18px system-ui, sans-serif';
        context.fillText(label, x, y + 6);
      });
      context.textAlign = 'left';
      context.fillStyle = positive;
      context.font = '700 25px ui-monospace, monospace';
      context.fillText('NET INFLOW  +$3.8M', 54, 438);
      context.fillStyle = '#7895A0';
      context.font = '500 18px system-ui, sans-serif';
      context.fillText('路径与金额为演示', 720, 438);
      return;
    }

    const marketMode =
      signal?.mode === 'fresh' ? 'LIVE' : signal ? '缓存' : '暂无数据';
    wallBase(
      context,
      'OKX 市场信号',
      marketMode,
      signal && signal.change < 0 ? negative : positive,
    );
    context.fillStyle = '#A6BBC4';
    context.font = '600 23px system-ui, sans-serif';
    context.fillText('BTC / USDT', 54, 162);
    context.fillStyle = '#F5FBFC';
    context.font = '700 74px ui-monospace, monospace';
    context.fillText(
      signal
        ? signal.last.toLocaleString('en-US', { maximumFractionDigits: 2 })
        : '—',
      54,
      250,
    );
    context.fillStyle = signal && signal.change < 0 ? negative : positive;
    context.font = '700 36px ui-monospace, monospace';
    context.fillText(
      signal
        ? `${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%`
        : '等待现实信号',
      680,
      244,
    );
    context.strokeStyle = signal && signal.change < 0 ? negative : positive;
    context.lineWidth = 6;
    context.beginPath();
    for (let index = 0; index < 24; index++) {
      const x = 54 + index * 38;
      const trend = (signal?.change ?? 0) * index * 0.58;
      const y = 374 - Math.sin(index * 1.24 + time * 0.55) * 24 - trend;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.fillStyle = '#7895A0';
    context.font = '500 18px system-ui, sans-serif';
    context.fillText('价格与涨跌来自 OKX · 曲线动画为 Demo', 54, 470);
  }

  // Resolution-independent 360° sky. It contains no bitmap and has no seam,
  // edge or privileged camera direction.
  const skyDome = part(
    root,
    skySphere,
    skyMaterial,
    worldCx,
    18,
    worldCz,
    1,
    1,
    1,
  );
  skyDome.name = 'procedural-360-environment-dome';
  skyDome.renderOrder = -30;

  // Three concentric rings of actual buildings surround the entire playable
  // world. Instancing keeps the panoramic city inexpensive to render.
  const skylineCount = 108;
  const skyline = new THREE.InstancedMesh(towerBox, skylineMetal, skylineCount);
  skyline.name = 'panoramic-360-city-towers';
  skyline.frustumCulled = false;
  root.add(skyline);
  const skylineDummy = new THREE.Object3D();
  const shellColors = [
    new THREE.Color('#7891A0'),
    new THREE.Color('#344957'),
    new THREE.Color('#A6B5BD'),
    new THREE.Color('#213643'),
  ];
  const towerMetrics: Array<{
    angle: number;
    radius: number;
    width: number;
    depth: number;
    height: number;
  }> = [];
  for (let index = 0; index < skylineCount; index++) {
    const angle =
      (index / skylineCount) * Math.PI * 2 + Math.sin(index * 7.13) * 0.018;
    const ring = index % 3;
    const radius = 72 + ring * 13 + Math.sin(index * 2.71) * 3.8;
    const width = 2.2 + ((index * 17) % 7) * 0.42;
    const depth = 2.8 + ((index * 11) % 5) * 0.55;
    const height = 13 + ((index * 19) % 29) + ring * 3;
    towerMetrics.push({ angle, radius, width, depth, height });
    skylineDummy.position.set(
      worldCx + Math.cos(angle) * radius,
      height * 0.5 - 2.6,
      worldCz + Math.sin(angle) * radius,
    );
    skylineDummy.rotation.set(0, Math.PI / 2 - angle, 0);
    skylineDummy.scale.set(width, height, depth);
    skylineDummy.updateMatrix();
    skyline.setMatrixAt(index, skylineDummy.matrix);
    skyline.setColorAt(index, shellColors[(index + ring) % shellColors.length]);
  }
  skyline.instanceMatrix.needsUpdate = true;
  if (skyline.instanceColor) skyline.instanceColor.needsUpdate = true;

  const windowCount = 72;
  const skylineWindows = new THREE.InstancedMesh(
    towerBox,
    skylineGlow,
    windowCount,
  );
  skylineWindows.name = 'panoramic-city-window-ribbons';
  skylineWindows.frustumCulled = false;
  root.add(skylineWindows);
  const lightColors = [
    new THREE.Color('#76DFFF'),
    new THREE.Color('#FFD078'),
    new THREE.Color('#70E0B4'),
  ];
  for (let index = 0; index < windowCount; index++) {
    const tower = towerMetrics[(index * 5) % skylineCount];
    const insetRadius = tower.radius - tower.depth * 0.51;
    skylineDummy.position.set(
      worldCx + Math.cos(tower.angle) * insetRadius,
      Math.max(3.8, tower.height * (0.38 + (index % 3) * 0.13)),
      worldCz + Math.sin(tower.angle) * insetRadius,
    );
    skylineDummy.rotation.set(0, -Math.PI / 2 - tower.angle, 0);
    skylineDummy.scale.set(tower.width * 0.68, 0.09 + (index % 2) * 0.05, 0.06);
    skylineDummy.updateMatrix();
    skylineWindows.setMatrixAt(index, skylineDummy.matrix);
    skylineWindows.setColorAt(index, lightColors[index % lightColors.length]);
  }
  skylineWindows.instanceMatrix.needsUpdate = true;
  if (skylineWindows.instanceColor)
    skylineWindows.instanceColor.needsUpdate = true;

  const spineCount = 72;
  const skylineSpines = new THREE.InstancedMesh(
    towerBox,
    skylineGlow,
    spineCount,
  );
  skylineSpines.name = 'panoramic-city-vertical-light-spines';
  skylineSpines.frustumCulled = false;
  root.add(skylineSpines);
  for (let index = 0; index < spineCount; index++) {
    const tower = towerMetrics[(index * 7 + 3) % skylineCount];
    const insetRadius = tower.radius - tower.depth * 0.52;
    skylineDummy.position.set(
      worldCx + Math.cos(tower.angle) * insetRadius,
      tower.height * 0.5 - 1.4,
      worldCz + Math.sin(tower.angle) * insetRadius,
    );
    skylineDummy.rotation.set(0, -Math.PI / 2 - tower.angle, 0);
    skylineDummy.scale.set(0.075, tower.height * 0.62, 0.055);
    skylineDummy.updateMatrix();
    skylineSpines.setMatrixAt(index, skylineDummy.matrix);
    skylineSpines.setColorAt(
      index,
      lightColors[(index + 1) % lightColors.length],
    );
  }
  skylineSpines.instanceMatrix.needsUpdate = true;
  if (skylineSpines.instanceColor)
    skylineSpines.instanceColor.needsUpdate = true;

  const crownCount = 36;
  const skylineCrowns = new THREE.InstancedMesh(torus, skylineGlow, crownCount);
  skylineCrowns.name = 'panoramic-city-luminous-crowns';
  skylineCrowns.frustumCulled = false;
  root.add(skylineCrowns);
  for (let index = 0; index < crownCount; index++) {
    const tower = towerMetrics[(index * 3 + 1) % skylineCount];
    skylineDummy.position.set(
      worldCx + Math.cos(tower.angle) * tower.radius,
      tower.height - 2.35,
      worldCz + Math.sin(tower.angle) * tower.radius,
    );
    skylineDummy.rotation.set(Math.PI / 2, 0, 0);
    skylineDummy.scale.set(
      tower.width * 0.62,
      tower.width * 0.62,
      tower.width * 0.62,
    );
    skylineDummy.updateMatrix();
    skylineCrowns.setMatrixAt(index, skylineDummy.matrix);
    skylineCrowns.setColorAt(index, lightColors[index % lightColors.length]);
  }
  skylineCrowns.instanceMatrix.needsUpdate = true;
  if (skylineCrowns.instanceColor)
    skylineCrowns.instanceColor.needsUpdate = true;

  const dataColumnCount = 24;
  const dataColumns = new THREE.InstancedMesh(
    towerBox,
    skylineGlow,
    dataColumnCount,
  );
  dataColumns.name = 'panoramic-xlayer-data-columns';
  dataColumns.frustumCulled = false;
  root.add(dataColumns);
  for (let index = 0; index < dataColumnCount; index++) {
    const angle = (index / dataColumnCount) * Math.PI * 2 + 0.11;
    const radius = index % 2 ? 66 : 96;
    const height = 18 + (index % 5) * 4.2;
    skylineDummy.position.set(
      worldCx + Math.cos(angle) * radius,
      height * 0.5 + 2,
      worldCz + Math.sin(angle) * radius,
    );
    skylineDummy.rotation.set(0, -angle, 0);
    skylineDummy.scale.set(0.05, height, 0.05);
    skylineDummy.updateMatrix();
    dataColumns.setMatrixAt(index, skylineDummy.matrix);
    dataColumns.setColorAt(index, lightColors[index % lightColors.length]);
  }
  dataColumns.instanceMatrix.needsUpdate = true;
  if (dataColumns.instanceColor) dataColumns.instanceColor.needsUpdate = true;

  const cityRails = [60, 76, 92, 108].map((radius, index) => {
    const rail = part(
      root,
      torus,
      index % 2 ? amber : cyan,
      worldCx,
      12 + index * 7.2,
      worldCz,
      radius,
      radius,
      radius,
    );
    rail.name = `panoramic-city-rail-${index + 1}`;
    rail.rotation.x = Math.PI / 2;
    return rail;
  });

  const horizonLabels = [
    ['OKX.AI', 'AGENT DIRECTORY'],
    ['X LAYER', 'AGENT SETTLEMENT'],
    ['A2A PAY', 'MACHINE ECONOMY'],
    ['BTC', 'DIGITAL RESERVE'],
    ['ETH', 'SMART CONTRACTS'],
    ['USDT0', 'LIQUIDITY RAIL'],
    ['RWA', 'REAL WORLD ASSETS'],
    ['AGENTVERSE', 'CIVILIZATION NETWORK'],
  ].map(([title, subtitle], index) => {
    const group = new THREE.Group();
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    const radius = 61;
    group.name = `panoramic-protocol-sign-${title.toLowerCase().replaceAll('.', '')}`;
    group.position.set(
      worldCx + Math.cos(angle) * radius,
      8.5 + (index % 2) * 3.2,
      worldCz + Math.sin(angle) * radius,
    );
    group.rotation.y = -Math.PI / 2 - angle;
    root.add(group);
    part(group, box, skylineGlass, 0, 0, 0.12, 5.6, 3.1, 0.28);
    const texture = screenTexture(
      title,
      subtitle,
      index % 2 ? '#FFD078' : '#77DFFF',
      'LIVE INFRASTRUCTURE · WORLD DATA',
    );
    const material = mat(
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    );
    part(group, plane, material, 0, 0, -0.035, 5.1, 2.55, 1);
    return group;
  });

  // Large information façades occupy the previously empty skyline. Real
  // OKX/CoinDesk inputs and illustrative finance surfaces are visibly labelled.
  const marketWallKinds: MarketWallKind[] = [
    'news',
    'stocks',
    'flows',
    'bubbles',
    'onchain',
    'market',
  ];
  const marketWalls = marketWallKinds.map((kind, index) => {
    const group = new THREE.Group();
    const angle = (index / marketWallKinds.length) * Math.PI * 2 + 0.62;
    const radius = 47.5;
    group.name = `skyline-data-wall-${kind}`;
    group.position.set(
      worldCx + Math.cos(angle) * radius,
      11.2 + (index % 2) * 4.2,
      worldCz + Math.sin(angle) * radius,
    );
    group.rotation.y = -Math.PI / 2 - angle;
    root.add(group);
    part(group, box, skylineGlass, 0, 0, 0, 11.7, 6.2, 0.42);
    part(
      group,
      box,
      index % 2 ? amber : cyan,
      0,
      -3.22,
      0.12,
      12.1,
      0.09,
      0.18,
    );
    for (const side of [-1, 1])
      part(group, box, silver, side * 5.55, -4.7, -0.05, 0.17, 3.2, 0.28);
    const surface = dynamicTexture(1024, 512);
    paintMarketWall(kind, surface.context, 0);
    surface.texture.needsUpdate = true;
    const material = mat(
      new THREE.MeshBasicMaterial({
        map: surface.texture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    part(group, plane, material, 0, 0, 0.235, 11.05, 5.28, 1);
    return { kind, group, ...surface };
  });

  // A second physical screen for each texture fills the gaps between the six
  // data districts without duplicating canvas painting or texture memory.
  const marketWallGroups = marketWalls.flatMap((wall, index) => {
    const duplicate = wall.group.clone(true);
    const angle =
      (index / marketWallKinds.length) * Math.PI * 2 + 0.62 + Math.PI / 6;
    const radius = 47.5;
    duplicate.name = `${wall.group.name}-relay`;
    duplicate.position.set(
      worldCx + Math.cos(angle) * radius,
      13.3 + ((index + 1) % 2) * 4.2,
      worldCz + Math.sin(angle) * radius,
    );
    duplicate.rotation.y = -Math.PI / 2 - angle;
    root.add(duplicate);
    return [wall.group, duplicate];
  });

  const tickerSurface = dynamicTexture(2048, 128);
  tickerSurface.texture.wrapS = THREE.RepeatWrapping;
  tickerSurface.texture.repeat.set(3.1, 1);
  const tickerMaterial = mat(
    new THREE.MeshBasicMaterial({
      map: tickerSurface.texture,
      transparent: true,
      opacity: 0.92,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const marketTicker = part(
    root,
    tickerCylinder,
    tickerMaterial,
    worldCx,
    25.5,
    worldCz,
    58,
    1.65,
    58,
  );
  marketTicker.name = 'world-market-360-ticker';

  function paintTicker(signal?: MarketSignal | null, news?: WorldNews | null) {
    const context = tickerSurface.context;
    const canvas = tickerSurface.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(4, 14, 22, .96)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#315262';
    context.strokeRect(0, 4, canvas.width, canvas.height - 8);
    const btc = signal
      ? `BTC ${signal.last.toLocaleString('en-US', { maximumFractionDigits: 0 })}  ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%  ${signal.mode === 'fresh' ? 'LIVE' : '缓存'}`
      : 'BTC 等待 OKX 信号';
    const segments = [
      [btc, !signal || signal.change >= 0 ? '#3CE6A1' : '#FF6E7A'],
      [news?.items[0]?.title ?? '公开新闻等待进入研究区', '#8EDFFF'],
      ['NVDA +2.84% · AAPL +0.72% · TSLA -1.46%  DEMO', '#FFD078'],
      ['X LAYER · AGENT PAY · USDT0 · RWA', '#AE9AFF'],
    ] as const;
    context.font = '700 31px system-ui, sans-serif';
    let x = 34;
    segments.forEach(([text, color]) => {
      context.fillStyle = color;
      const value = shorten(text, context, 760);
      context.fillText(value, x, 80);
      x += context.measureText(value).width + 92;
      context.fillStyle = '#4B7180';
      context.fillRect(x - 48, 34, 4, 54);
    });
    tickerSurface.texture.needsUpdate = true;
  }
  paintTicker();

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
    blockers.push({ x: cx + side * 7.25, z: cz - 15.5, radius: 1.05 });
  }
  part(threshold, box, graphite, 0, 10.45, 0, 15.0, 0.55, 0.74);
  part(threshold, box, gold, 0, 10.78, 0, 14.5, 0.08, 0.78);
  const gateTexture = screenTexture(
    'OKX.AI  ×  X LAYER',
    'AGENT METAVERSE',
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
    blockers.push({ x: group.position.x, z: group.position.z, radius: 2.82 });
    group.rotation.y = side * (row ? -0.3 : -0.18);
    root.add(group);
    part(group, cylinder, graphite, 0, 0.22, 0, 2.8, 0.44, 2.8);
    part(group, cylinder, silver, 0, 0.43, 0, 2.53, 0.14, 2.53);
    part(
      group,
      torus,
      color === '#FFD078' ? amber : color === '#7DE1B5' ? mint : cyan,
      0,
      0.55,
      0,
      2.17,
      2.17,
      2.17,
    ).rotation.x = -Math.PI / 2;
    part(group, box, graphite, 0, 1.45, -0.72, 3.4, 1.75, 0.34).rotation.x =
      -0.12;
    const display = screenTexture(title, subtitle, color);
    const displayMaterial = mat(
      new THREE.MeshBasicMaterial({ map: display, toneMapped: false }),
    );
    const screen = part(
      group,
      plane,
      displayMaterial,
      0,
      1.58,
      -0.52,
      3.08,
      1.3,
      1,
    );
    screen.rotation.x = -0.12;
    for (const terminalSide of [-1, 1]) {
      part(
        group,
        box,
        silver,
        terminalSide * 1.45,
        0.92,
        0.82,
        0.54,
        0.92,
        0.72,
      );
      part(
        group,
        box,
        color === '#FFD078' ? amber : color === '#7DE1B5' ? mint : cyan,
        terminalSide * 1.45,
        1.08,
        0.46,
        0.39,
        0.44,
        0.035,
      );
    }
    return group;
  });

  // Four protocol pylons make the OKX/X Layer path legible before the user
  // reaches the central collaboration stage.
  const nodeGroups = networkNodes.map(([title, subtitle], index) => {
    const angle = -1.08 + index * 0.72;
    const group = new THREE.Group();
    group.name = `network-node-${title.toLowerCase().replaceAll('.', '')}`;
    group.position.set(
      cx + Math.sin(angle) * 17.8,
      0,
      cz - 18 + Math.cos(angle) * 3.4,
    );
    blockers.push({ x: group.position.x, z: group.position.z, radius: 1.28 });
    root.add(group);
    part(group, cylinder, graphite, 0, 0.22, 0, 1.2, 0.44, 1.2);
    part(group, cylinder, gold, 0, 0.48, 0, 0.92, 0.08, 0.92);
    part(group, box, silver, 0, 3.15, 0, 1.35, 5.25 + (index % 2), 1.1);
    part(group, box, graphite, 0, 3.2, 0.58, 1.08, 4.35, 0.08);
    part(
      group,
      box,
      index % 2 ? amber : cyan,
      0,
      5.95 + (index % 2) * 0.5,
      0,
      0.92,
      0.13,
      0.92,
    );
    const display = screenTexture(
      title,
      subtitle,
      index % 2 ? '#FFD078' : '#77DFFF',
    );
    const displayMaterial = mat(
      new THREE.MeshBasicMaterial({ map: display, toneMapped: false }),
    );
    part(group, plane, displayMaterial, 0, 3.22, 0.635, 0.96, 1.28, 1);
    return group;
  });

  const overheadRings = [13.5, 18.5].map((radius, index) => {
    const ring = part(
      root,
      torus,
      index ? gold : cyan,
      cx,
      13.2 + index * 3.1,
      cz - 10,
      radius,
      radius,
      radius,
    );
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
  let newsState: WorldNews | null | undefined;
  let dataDirty = true;
  let lastWallPaint = -Infinity;

  return {
    root,
    skyDome,
    skyline,
    skylineWindows,
    skylineSpines,
    skylineCrowns,
    dataColumns,
    cityRails,
    horizonLabels,
    marketWalls,
    marketWallGroups,
    marketTicker,
    threshold,
    workGroups,
    nodeGroups,
    overheadRings,
    shuttles,
    blockers,
    blocksPoint(x: number, z: number, padding = 0.34) {
      return blockers.some(
        (item) => Math.hypot(x - item.x, z - item.z) < item.radius + padding,
      );
    },
    setSignal(signal?: MarketSignal | null) {
      if (signalState !== signal) dataDirty = true;
      signalState = signal;
    },
    setNews(news?: WorldNews | null) {
      if (newsState !== news) dataDirty = true;
      newsState = news;
    },
    update(time: number, quality: number) {
      const flow = signalState
        ? 1 + Math.min(1.4, Math.abs(signalState.change) / 5)
        : 1;
      skyUniforms.uTime.value = time;
      skyUniforms.uPulse.value +=
        ((signalState ? Math.min(1, Math.abs(signalState.change) / 6) : 0.35) -
          skyUniforms.uPulse.value) *
        0.025;
      skyline.count = quality === 2 ? 48 : quality === 1 ? 78 : skylineCount;
      skylineWindows.count =
        quality === 2 ? 22 : quality === 1 ? 46 : windowCount;
      skylineSpines.count =
        quality === 2 ? 20 : quality === 1 ? 44 : spineCount;
      skylineCrowns.count =
        quality === 2 ? 10 : quality === 1 ? 24 : crownCount;
      dataColumns.count =
        quality === 2 ? 8 : quality === 1 ? 16 : dataColumnCount;
      cityRails.forEach((rail, index) => {
        rail.rotation.z = time * (index % 2 ? -0.0025 : 0.0018);
        rail.visible = quality < 2 || index < 2;
      });
      horizonLabels.forEach((group, index) => {
        group.visible = quality === 0 || index % (quality === 1 ? 2 : 4) === 0;
      });
      marketWallGroups.forEach((group, index) => {
        group.visible =
          quality === 0 ||
          (quality === 1 && index % 3 !== 1) ||
          (quality === 2 && index % 3 === 0);
      });
      marketTicker.visible = true;
      tickerSurface.texture.offset.x = -((time * 0.018) % 1);
      if (dataDirty || Math.abs(time - lastWallPaint) > 0.34) {
        marketWalls.forEach((wall) => {
          paintMarketWall(
            wall.kind,
            wall.context,
            time,
            signalState,
            newsState,
          );
          wall.texture.needsUpdate = true;
        });
        if (dataDirty || Math.abs(time - lastWallPaint) > 1.8)
          paintTicker(signalState, newsState);
        lastWallPaint = time;
        dataDirty = false;
      }
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
        const radius = 52 + lane * 9.2;
        dummy.position.set(
          worldCx + Math.cos(angle) * radius,
          13.5 + lane * 4.2 + Math.sin(time * 0.55 + index) * 0.7,
          worldCz + Math.sin(angle) * radius,
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
