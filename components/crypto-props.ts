import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { regions, type MarketSignal } from '@/lib/civilization-model';
import {
  cryptoTaskState,
  cryptoTasks,
  cryptoLoadouts,
} from '@/lib/crypto-world';

const exhibitContent = [
  [
    '任务托管与交付',
    'USDC · ESCROW',
    '能力请求 → 结果验证 → 服务结算',
    '任务合约',
    '交付凭证',
    '结算回执',
  ],
  [
    '链上信号研究所',
    'BTC · ETH · X LAYER',
    '读取行情 → 交叉研究 → 形成报告',
    '行情信号',
    '链上数据',
    '研究摘要',
  ],
  [
    'Agent 身份工坊',
    'IDENTITY · CAPABILITY',
    '建立身份 → 安装技能 → 加入世界',
    '身份凭证',
    '能力接口',
    '服务目录',
  ],
  [
    '区块回执档案馆',
    'BLOCK · HASH · RECEIPT',
    '核对哈希 → 连接区块 → 归档记忆',
    '区块摘要',
    '任务回执',
    '历史索引',
  ],
  [
    '交易执行机房',
    'QUEUE · EXECUTION',
    '任务入队 → 批次执行 → 返回结果',
    '待处理',
    '执行中',
    '回执输出',
  ],
  [
    '双资产交换池',
    'ETH / USDC',
    '读取报价 → 交换资产 → 生成回执',
    '资产池 A',
    '交换路径',
    '资产池 B',
  ],
  [
    '权限验证庭',
    'READ · SIGN · SEND',
    '读取权限 → 检查范围 → 返回检查结果',
    '读取权限',
    '签名范围',
    '发送权限',
  ],
  [
    '现实信号门',
    'NEWS · RWA · MARKET',
    '来源标记 → 信号封装 → 送入研究区',
    '新闻事件',
    '现实资产',
    '市场行情',
  ],
  [
    'Gas 能源花园',
    'GAS · RESOURCE',
    '预估资源 → 补充能源 → 支持执行',
    '资源预估',
    '能源补给',
    '执行配额',
  ],
  [
    '跨域探索驿站',
    'X LAYER · DISCOVERY',
    '发现节点 → 核对连接 → 扩展路径',
    '当前节点',
    '连接请求',
    '未知节点',
  ],
];
/** Distinct small exhibits, with explanatory content rather than invented live transactions. */
export function createCryptoProps(
  scene: THREE.Scene,
  pickable: THREE.Object3D[],
) {
  const geos: THREE.BufferGeometry[] = [],
    materials: THREE.Material[] = [],
    textures: THREE.Texture[] = [];
  const geo = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);
  const mat = <T extends THREE.Material>(m: T) => (materials.push(m), m);
  const box = geo(new RoundedBoxGeometry(1, 1, 1, 3, 0.08));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 48));
  const ring = geo(new THREE.TorusGeometry(1, 0.035, 8, 64));
  const sphere = geo(new THREE.SphereGeometry(1, 20, 14));
  const prism = geo(new THREE.OctahedronGeometry(1));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const stone = mat(
    new THREE.MeshPhongMaterial({
      color: '#F5F0E8',
      shininess: 30,
      specular: '#E3E5E9',
    }),
  );
  const ivory = mat(
    new THREE.MeshPhongMaterial({
      color: '#FEFCF7',
      shininess: 85,
      specular: '#FFFFFF',
    }),
  );
  const gold = mat(
    new THREE.MeshPhongMaterial({
      color: '#CDAA65',
      shininess: 95,
      specular: '#FFF4D8',
    }),
  );
  const ink = mat(
    new THREE.MeshPhongMaterial({ color: '#324F64', shininess: 65 }),
  );
  const accents = cryptoTasks.map((t) =>
    mat(
      new THREE.MeshPhongMaterial({
        color: t.color,
        shininess: 90,
        specular: '#FFFFFF',
      }),
    ),
  );
  const glass = mat(
    new THREE.MeshPhongMaterial({
      color: '#ADE3F6',
      transparent: true,
      opacity: 0.24,
      shininess: 110,
      specular: '#FFFFFF',
      depthWrite: false,
    }),
  );
  const luminous = mat(
    new THREE.MeshBasicMaterial({
      color: '#B9EBFF',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  const roots: THREE.Group[] = [];
  let researchDisplay:
    | { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }
    | undefined;
  let lastMarketKey = '';
  function part(
    g: THREE.Group,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    dynamic = false,
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.userData.batch = !dynamic;
    g.add(m);
    return m;
  }
  function hoop(
    g: THREE.Group,
    x: number,
    y: number,
    z: number,
    r: number,
    material = gold,
    vertical = false,
  ) {
    const m = part(g, ring, material, x, y, z, r, r, r);
    if (!vertical) m.rotation.x = -Math.PI / 2;
    return m;
  }
  function label(
    g: THREE.Group,
    title: string,
    sub: string,
    x: number,
    y: number,
    z: number,
    width = 2.4,
    height = 0.56,
  ) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#F7F9F5';
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = '#274557';
    ctx.textAlign = 'center';
    ctx.font = '600 46px sans-serif';
    ctx.fillText(title, 384, 77, 720);
    ctx.font = '27px sans-serif';
    ctx.fillStyle = '#768D9C';
    ctx.fillText(sub, 384, 137, 720);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    const lm = mat(
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }),
    );
    return part(g, plane, lm, x, y, z, width, height, 1, true);
  }
  function display(
    g: THREE.Group,
    n: number,
    x: number,
    y: number,
    z: number,
    width = 3.4,
    height = 1.85,
  ) {
    part(g, box, stone, x, y, z, width + 0.14, height + 0.14, 0.16);
    part(g, box, gold, x, y - height / 2 - 0.1, z, 0.8, 0.025, 0.18);
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 576;
    const ctx = c.getContext('2d')!;
    const row = exhibitContent[n];
    ctx.fillStyle = '#EDF4F6';
    ctx.fillRect(0, 0, 1024, 576);
    ctx.fillStyle = '#C5DCE5';
    ctx.fillRect(0, 0, 12, 576);
    ctx.fillStyle = '#27475E';
    ctx.font = '600 45px sans-serif';
    ctx.fillText(row[0], 52, 73);
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#698392';
    ctx.fillText(row[1], 54, 120);
    ctx.fillStyle = '#536F75';
    ctx.fillText('DEMO / 流程演示', 730, 73);
    if (n === 1) {
      // A labelled, dimensionless illustration of a candlestick research signal.
      ctx.strokeStyle = '#D2E1E7';
      ctx.lineWidth = 1;
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.moveTo(52, 174 + j * 61);
        ctx.lineTo(970, 174 + j * 61);
        ctx.stroke();
      }
      for (let i = 0; i < 28; i++) {
        const y0 = 300 - Math.sin(i * 0.56) * 45 - i * 2.1,
          h = 18 + ((i * 11) % 44);
        ctx.strokeStyle = ctx.fillStyle = i % 4 === 0 ? '#BD9B79' : '#609D9A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(72 + i * 32, y0 - h / 2 - 13);
        ctx.lineTo(72 + i * 32, y0 + h / 2 + 13);
        ctx.stroke();
        ctx.fillRect(63 + i * 32, y0 - h / 2, 18, h);
      }
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#78909E';
      ctx.fillText('示意走势 · 无价格刻度 · 非实时行情', 54, 457);
    } else {
      for (let i = 0; i < 3; i++) {
        const xx = 52 + i * 309;
        ctx.fillStyle = '#DFEAF0';
        ctx.fillRect(xx, 170, 280, 235);
        ctx.fillStyle = cryptoTasks[n].color;
        ctx.font = '300 84px sans-serif';
        ctx.fillText('0' + (i + 1), xx + 24, 267);
        ctx.fillStyle = '#31566B';
        ctx.font = '32px sans-serif';
        ctx.fillText(row[i + 3], xx + 24, 341, 235);
        if (i < 2) {
          ctx.font = '28px sans-serif';
          ctx.fillText('→', xx + 281, 290);
        }
      }
      ctx.fillStyle = '#78909E';
      ctx.font = '24px sans-serif';
      ctx.fillText('概念流程 · 世界动作不代表真实链上执行', 54, 457);
    }
    ctx.fillStyle = '#54727D';
    ctx.font = '28px sans-serif';
    ctx.fillText(row[2], 54, 525, 930);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    const screen = part(
      g,
      plane,
      mat(new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })),
      x,
      y,
      z + 0.091,
      width,
      height,
      1,
      true,
    );
    if (n === 1) researchDisplay = { canvas: c, texture: t };
    screen.userData.region = n;
    pickable.push(screen);
    return screen;
  }
  function medallion(
    g: THREE.Group,
    glyph: string,
    ticker: string,
    color: string,
  ) {
    const coin = new THREE.Group();
    coin.position.set(0, 4.65, -0.82);
    g.add(coin);
    const rim = part(coin, cylinder, gold, 0, 0, 0, 0.62, 0.09, 0.62);
    rim.rotation.x = Math.PI / 2;
    const c = document.createElement('canvas');
    c.width = c.height = 384;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(192, 192, 176, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F4E9CD';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(192, 192, 160, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFDF4';
    ctx.font = '500 164px system-ui';
    ctx.fillText(glyph, 192, 219);
    ctx.font = '500 30px system-ui';
    ctx.fillText(ticker, 192, 285);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const face = mat(
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    part(coin, plane, face, 0, 0, 0.05, 1.24, 1.24, 1, true);
    hoop(g, 0, 4.65, -0.82, 0.78, gold, true);
    part(g, box, stone, 0, 3.93, -0.9, 0.15, 0.5, 0.18);
  }
  const stations = regions.map((r, n) => {
    const g = new THREE.Group();
    g.name = 'exhibit-' + n;
    g.position.set(r.x * 100 + (n === 0 ? 5.5 : 0), 0, r.y * 100 - 2.3);
    scene.add(g);
    roots.push(g);
    if (n === 1) medallion(g, '₿', 'BITCOIN', '#BA945B');
    if (n === 5) medallion(g, '◇', 'ETH / USDC', '#799EAD');
    if (n === 9) medallion(g, 'X', 'X LAYER', '#6D9187');
    const accent = accents[n],
      moving: THREE.Object3D[] = [];
    // Recessed plinth, trimmed base and lit toe-kick unify otherwise different machinery.
    part(g, box, stone, 0, 0.1, 0, 5, 0.2, 2.6);
    part(g, box, gold, 0, 0.215, 0, 4.75, 0.026, 2.35);
    label(
      g,
      regions[n].name,
      cryptoTasks[n].asset + ' · DEMO',
      0,
      0.41,
      1.32,
      2.8,
      0.4,
    );
    if (n !== 5 && n !== 6 && n !== 9) display(g, n, 0, 2.85, -0.83, 3.6, 1.92);
    if (n === 0) {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 1.45;
        part(g, cylinder, ivory, x, 0.58, 0.18, 0.57, 0.72, 0.57);
        hoop(g, x, 0.96, 0.18, 0.52);
        const contract = part(
          g,
          box,
          accent,
          x,
          1.2,
          0.18,
          0.5,
          0.1,
          0.65,
          true,
        );
        moving.push(contract);
        label(
          g,
          ['REQUEST', 'PROOF', 'USDC'][i],
          '演示流程',
          x,
          0.63,
          0.77,
          1,
          0.3,
        );
      }
    } else if (n === 1) {
      part(g, box, ivory, 0, 0.82, 0.3, 3.65, 0.14, 1.05);
      for (const x of [-1.45, 1.45])
        part(g, box, stone, x, 0.5, 0.3, 0.18, 0.58, 0.7);
      const lens = hoop(g, -1.65, 1.3, 0.3, 0.45, accent, true);
      lens.rotation.y = 0.25;
      moving.push(lens);
      lens.userData.batch = false;
      for (let i = 0; i < 5; i++)
        part(
          g,
          box,
          i % 2 ? ivory : accent,
          0.1 + i * 0.24,
          0.96 + i * 0.045,
          0.25,
          0.67,
          0.04,
          0.48,
        );
      for (let i = 0; i < 3; i++) {
        const m = part(
          g,
          box,
          accent,
          -0.7 + i * 0.45,
          1.14,
          0.3,
          0.18,
          0.3 + i * 0.12,
          0.14,
          true,
        );
        moving.push(m);
      }
    } else if (n === 2) {
      for (const x of [-1.3, 0, 1.3]) {
        part(g, cylinder, ivory, x, 0.48, 0, 0.47, 0.55, 0.47);
        hoop(g, x, 0.79, 0, 0.44);
        part(g, sphere, glass, x, 1.18, 0, 0.43, 0.57, 0.43);
        const seed = part(g, prism, accent, x, 1.15, 0, 0.16, 0.24, 0.16, true);
        moving.push(seed);
        hoop(g, x, 1.8, 0, 0.38, accent);
        part(g, box, stone, x, 2, -0.61, 0.1, 1.1, 0.14);
      }
    } else if (n === 3) {
      for (let col = 0; col < 4; col++)
        for (let row = 0; row < 4; row++) {
          const x = -1.7 + col * 1.12,
            y = 0.5 + row * 0.37;
          part(g, box, row % 2 ? ivory : stone, x, y, 0.18, 0.97, 0.3, 0.9);
          part(g, box, accent, x, y, 0.65, 0.4, 0.026, 0.025);
        }
      const hash = part(g, box, glass, 0, 1.94, 0.15, 0.55, 0.55, 0.55, true);
      moving.push(hash);
      hoop(g, 0, 1.66, 0.15, 0.66, accent);
    } else if (n === 4) {
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 1.3;
        part(g, box, ink, x, 1.03, 0, 0.82, 1.62, 0.65);
        for (let row = 0; row < 6; row++) {
          part(g, box, ivory, x, 0.43 + row * 0.23, 0.36, 0.72, 0.18, 0.1);
          part(
            g,
            box,
            accent,
            x - 0.21,
            0.43 + row * 0.23,
            0.423,
            0.11,
            0.035,
            0.016,
          );
        }
        const pack = part(g, box, accent, x, 1.98, 0, 0.32, 0.1, 0.45, true);
        moving.push(pack);
      }
      for (let i = 0; i < 3; i++)
        part(g, box, gold, -1.3 + i * 1.3, 0.25, 0.95, 0.65, 0.025, 0.08);
    } else if (n === 5) {
      display(g, n, 0, 2.84, -0.86, 3.5, 1.82);
      for (let i = 0; i < 2; i++) {
        const x = i ? 1.34 : -1.34;
        part(g, cylinder, ivory, x, 0.43, 0, 0.95, 0.4, 0.95);
        part(g, cylinder, ink, x, 0.643, 0, 0.8, 0.012, 0.8);
        part(g, cylinder, glass, x, 0.66, 0, 0.77, 0.02, 0.77);
        hoop(g, x, 0.675, 0, 0.9, gold);
        hoop(g, x, 0.7, 0, 0.66, accent);
        const token = part(
          g,
          i ? cylinder : prism,
          i ? gold : accents[1],
          x,
          1.18,
          0,
          i ? 0.36 : 0.26,
          i ? 0.09 : 0.53,
          i ? 0.36 : 0.26,
          true,
        );
        if (i) token.rotation.x = Math.PI / 2;
        moving.push(token);
        label(
          g,
          i ? 'USDC' : 'ETH',
          '资产交换 · Demo',
          x,
          0.5,
          0.96,
          1.25,
          0.34,
        );
      }
      for (let i = 0; i < 3; i++)
        part(g, box, accent, 0, 0.36, 0.3 + (i - 1) * 0.2, 0.6, 0.035, 0.045);
    } else if (n === 6) {
      // Three distinct permission apertures form a quiet scanner corridor.
      for (let i = 0; i < 3; i++) {
        const z = 0.5 - i * 0.65;
        for (const x of [-1, 1])
          part(g, box, stone, x, 1.23, z, 0.25, 2.0, 0.25);
        part(g, box, ivory, 0, 2.23, z, 2.25, 0.22, 0.25);
        part(g, box, accent, 0, 2.08, z, 1.8, 0.03, 0.08);
      }
      const scan = part(g, plane, glass, 0, 1.23, 0.55, 1.73, 1.7, 1, true);
      moving.push(scan);
      label(
        g,
        '权限检查',
        'READ / SIGN / SEND · DEMO',
        0,
        2.56,
        -0.7,
        2.55,
        0.53,
      );
      display(g, n, 2, 1.41, 0.1, 1.14, 1.45);
    } else if (n === 7) {
      for (const x of [-1.95, 1.95]) {
        part(g, box, stone, x, 1.95, -0.5, 0.36, 3.5, 0.42);
        part(g, box, accent, x, 1.88, -0.25, 0.055, 2.7, 0.035);
      }
      part(g, box, ivory, 0, 3.76, -0.5, 4.25, 0.3, 0.42);
      for (let i = 0; i < 3; i++) {
        const packet = part(
          g,
          box,
          i % 2 ? glass : accent,
          -1.4 + i * 1.4,
          0.9,
          0.2,
          0.55,
          0.13,
          0.6,
          true,
        );
        moving.push(packet);
        label(
          g,
          ['NEWS', 'RWA', 'MARKET'][i],
          '来源 → 研究',
          -1.4 + i * 1.4,
          0.58,
          0.92,
          1.2,
          0.34,
        );
      }
    } else if (n === 8) {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 1.22;
        part(g, cylinder, ivory, x, 0.38, 0.1, 0.44, 0.25, 0.44);
        const crystal = part(
          g,
          prism,
          gold,
          x,
          1.06,
          0.1,
          0.26,
          0.7,
          0.26,
          true,
        );
        moving.push(crystal);
        hoop(g, x, 0.62, 0.1, 0.48, accent);
        hoop(g, x, 1.4, 0.1, 0.48, gold);
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          part(
            g,
            box,
            stone,
            x + Math.cos(a) * 0.48,
            0.98,
            0.1 + Math.sin(a) * 0.48,
            0.055,
            1.15,
            0.055,
          );
        }
      }
    } else {
      part(g, cylinder, ivory, 0, 0.48, 0, 1.55, 0.45, 1.55);
      const globe = hoop(g, 0, 1.63, 0, 1.06, accent, true);
      globe.userData.batch = false;
      moving.push(globe);
      const inner = hoop(g, 0, 1.63, 0, 0.78, gold, true);
      inner.rotation.y = Math.PI / 2;
      inner.userData.batch = false;
      moving.push(inner);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        part(
          g,
          prism,
          i < 2 ? accent : ivory,
          Math.cos(a) * 1.85,
          1.1,
          Math.sin(a) * 0.7,
          0.18,
          0.23,
          0.18,
        );
      }
      label(g, 'X LAYER', '跨域探索 · DEMO', 0, 2.9, -0.8, 2.6, 0.56);
      label(
        g,
        '发现 → 验证 → 连接',
        '概念流程 · 尚未连接的新节点',
        0,
        0.64,
        1.6,
        2.8,
        0.46,
      );
    }
    const receipt = part(g, box, ivory, 0, 1.75, 0.9, 0.48, 0.08, 0.6, true);
    const status = part(
      g,
      box,
      accent,
      0,
      0.26,
      1.17,
      0.65,
      0.022,
      0.085,
      true,
    );
    // Merge static station parts by material; displays and moving pieces stay separate.
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    g.children.slice().forEach((o) => {
      if (!(o instanceof THREE.Mesh) || !o.userData.batch) return;
      o.updateMatrix();
      const shape = o.geometry.clone().applyMatrix4(o.matrix);
      const m = o.material as THREE.Material;
      const list = batches.get(m) ?? [];
      list.push(shape);
      batches.set(m, list);
      g.remove(o);
    });
    batches.forEach((list, m) => {
      const normalized = list.map((g) => {
        const shape = g.index ? g.toNonIndexed() : g;
        if (shape !== g) g.dispose();
        return shape;
      });
      const merged = mergeGeometries(normalized);
      normalized.forEach((t) => t.dispose());
      if (!merged) return;
      const object = new THREE.Mesh(geo(merged), m);
      object.userData.region = n;
      g.add(object);
      pickable.push(object);
    });
    return { g, moving, receipt, status, region: n };
  });
  return {
    roots,
    stations,
    textures,
    setMarketSignal(signal?: MarketSignal | null) {
      if (!researchDisplay) return;
      const key = signal
        ? `${signal.last}:${signal.change}:${signal.mode}`
        : 'none';
      if (key === lastMarketKey) return;
      lastMarketKey = key;
      const ctx = researchDisplay.canvas.getContext('2d')!;
      ctx.fillStyle = '#EDF4F6';
      ctx.fillRect(22, 482, 1002, 94);
      ctx.fillStyle = '#315B69';
      ctx.font = '500 30px sans-serif';
      const line = signal
        ? `BTC $${signal.last.toLocaleString('en-US', { maximumFractionDigits: 2 })}  ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%  · OKX ${signal.mode === 'fresh' ? 'LIVE' : '缓存'}`
        : 'BTC / ETH 研究工作台 · 等待行情信号';
      ctx.fillText(line, 54, 538, 930);
      researchDisplay.texture.needsUpdate = true;
    },
    setSurfaceMap(texture: THREE.Texture) {
      stone.map = texture;
      stone.needsUpdate = true;
    },
    blocksPoint(x: number, z: number) {
      return stations.some(
        (s) =>
          Math.abs(x - s.g.position.x) < 2.55 &&
          Math.abs(z - s.g.position.z) < 1.28,
      );
    },
    update(time: number, quality: number) {
      stations.forEach((s, n) => {
        const task = cryptoTaskState(n, time);
        s.moving.forEach((o, i) => {
          if (!o.userData.home) o.userData.home = o.position.clone();
          const home = o.userData.home as THREE.Vector3;
          o.position.copy(home);
          o.position.y += Math.sin(time * 1.35 + i) * 0.07 + task.lift * 0.19;
          if (n === 5) {
            o.position.x = home.x * (i === 0 ? -task.left : task.right);
            o.position.z += task.lift * (i === 0 ? 0.32 : -0.32);
            o.rotation.y = time * 0.38;
          } else if (n === 6) o.position.z = 0.52 - task.progress * 1.3;
          else if (n === 4 || n === 7) o.position.y += task.progress * 0.4;
          else o.rotation.y = time * (n === 9 ? 0.18 : 0.35) + i * 0.7;
          o.visible =
            (quality < 2 || i < 2) && (n !== 5 || task.visibility > 0.02);
        });
        s.receipt.visible = task.receipt > 0.04;
        s.receipt.position.y = 1.72 + task.receipt * 0.4;
        s.status.scale.x = 0.2 + task.progress * 0.9;
      });
    },
    dispose() {
      roots.forEach((g) => scene.remove(g));
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
export function createAgentEquipment() {
  const box = new THREE.BoxGeometry(1, 1, 1),
    ring = new THREE.TorusGeometry(0.44, 0.04, 5, 16),
    prism = new THREE.OctahedronGeometry(0.2);
  const mats = cryptoLoadouts.map(
    (l) => new THREE.MeshLambertMaterial({ color: l.color }),
  );
  return {
    attach(parent: THREE.Group) {
      const band = new THREE.Mesh(ring, mats[0]);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.48;
      const visor = new THREE.Mesh(box, mats[0]);
      visor.scale.set(0.58, 0.1, 0.08);
      visor.position.set(0, 0.87, -0.36);
      const tool = new THREE.Mesh(box, mats[0]);
      tool.scale.set(0.3, 0.22, 0.26);
      tool.position.set(0.54, 0.65, -0.05);
      const charm = new THREE.Mesh(prism, mats[0]);
      charm.position.set(-0.48, 0.72, 0);
      parent.add(band, visor, tool, charm);
      return {
        update(index: number, time: number, active: boolean) {
          const mat = mats[index];
          band.material = mat;
          visor.material = mat;
          tool.material = mat;
          charm.material = mat;
          band.visible = index === 0 || index === 1 || index === 5;
          visor.visible = index === 1 || index === 5;
          tool.scale.set(
            index === 5 ? 0.08 : 0.3,
            index === 5 ? 0.48 : 0.22,
            index === 5 ? 0.4 : 0.26,
          );
          tool.position.y = index === 2 ? 0.92 : index === 3 ? 1.1 : 0.65;
          tool.scale.y = index === 3 ? 0.44 : tool.scale.y;
          tool.rotation.z = active ? Math.sin(time * 4) * 0.18 : 0;
          charm.visible = index === 0 || index === 3 || index === 4;
          charm.position.y = 0.72 + (active ? Math.sin(time * 3) * 0.12 : 0);
          charm.rotation.y = time * 0.8;
          band.rotation.z = time * (index === 5 ? 0.6 : 0.25);
        },
      };
    },
    dispose() {
      box.dispose();
      ring.dispose();
      prism.dispose();
      mats.forEach((m) => m.dispose());
    },
  };
}
