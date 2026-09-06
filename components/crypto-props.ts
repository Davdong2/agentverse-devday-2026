import * as THREE from 'three';
import { regions } from '@/lib/civilization-model';
import {
  cryptoTaskState,
  cryptoTasks,
  cryptoLoadouts,
} from '@/lib/crypto-world';

/** Low polygon task props. All motion is sampled from the world's shared clock. */
export function createCryptoProps(
  scene: THREE.Scene,
  pickable: THREE.Object3D[],
) {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const coin = new THREE.CylinderGeometry(0.34, 0.34, 0.12, 12);
  const ring = new THREE.TorusGeometry(1.15, 0.05, 5, 32);
  const prism = new THREE.OctahedronGeometry(0.4);
  const geos = [box, coin, ring, prism];
  const mats = cryptoTasks.map(
    (t) => new THREE.MeshLambertMaterial({ color: t.color }),
  );
  const ivory = new THREE.MeshLambertMaterial({ color: '#f5efdd' });
  const ink = new THREE.MeshBasicMaterial({ color: '#55717a' });
  const textures: THREE.Texture[] = [];
  const labelMats: THREE.Material[] = [];
  const roots: THREE.Group[] = [];
  function part(
    g: THREE.Group,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    g.add(m);
    return m;
  }
  const stations = regions.map((r, n) => {
    const g = new THREE.Group();
    g.position.set(r.x * 100 + 2.7, 0, r.y * 100 + 0.7);
    scene.add(g);
    roots.push(g);
    const mat = mats[n];
    const table = part(g, box, ivory, 0, 0.58, 0, 2.2, 0.23, 1.4);
    table.userData.region = n;
    pickable.push(table);
    part(g, box, ivory, 0, 0.25, 0, 0.65, 0.6, 0.65);
    const symbol = part(
      g,
      n === 1 || n === 4 || n === 3 ? box : n === 5 ? coin : prism,
      mat,
      -0.65,
      1.1,
      0,
      0.8,
      0.8,
      0.8,
    );
    const output = part(
      g,
      n === 5 ? coin : box,
      n === 5 ? mats[1] : mat,
      0.65,
      1.1,
      0,
      0.65,
      0.65,
      0.65,
    );
    const hoop = part(g, ring, mat, 0, 0.77, 0);
    hoop.rotation.x = n === 6 || n === 1 ? 0 : Math.PI / 2;
    if (n === 6 || n === 1) hoop.position.y = 1.5;
    hoop.scale.set(1, 0.65, 1);
    const bars = Array.from({ length: 4 }, (_, i) =>
      part(
        g,
        box,
        mat,
        -0.65 + i * 0.43,
        0.9,
        0.35,
        0.16,
        0.3 + i * 0.13,
        0.16,
      ),
    );
    const steps = Array.from({ length: 3 }, (_, i) =>
      part(g, box, mat, -0.55 + i * 0.55, 0.76, -0.5, 0.3, 0.05, 0.12),
    );
    // Small text-only signs: no downloaded textures and no decorative texture atlas.
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 112;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#eff5ef';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3d626a';
    ctx.font = '500 27px sans-serif';
    ctx.fillText(cryptoTasks[n].name, 192, 42);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = cryptoTasks[n].color;
    ctx.fillText(cryptoTasks[n].asset + ' · DEMO', 192, 80);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
    const lm = new THREE.SpriteMaterial({ map: tex, depthTest: true });
    labelMats.push(lm);
    const sign = new THREE.Sprite(lm);
    sign.position.set(0, 2.65, 0);
    sign.scale.set(2.6, 0.76, 1);
    g.add(sign);
    sign.userData.region = n;
    pickable.push(sign);
    const receipt = part(g, box, ivory, 0, 1.8, 0, 0.35, 0.08, 0.5);
    return { g, symbol, output, hoop, bars, steps, receipt };
  });
  return {
    update(time: number, detail: number) {
      stations.forEach((s, n) => {
        const a = cryptoTaskState(n, time);
        s.symbol.position.set(a.left * 0.65, 1.08 + a.lift * 0.23, 0);
        s.output.position.set(a.right * 0.65, 1.08 + a.lift * 0.23, 0.24);
        s.symbol.rotation.y = time * 0.5;
        s.output.rotation.y = -time * 0.5;
        s.output.visible = a.visibility > 0.02;
        s.symbol.visible = a.visibility > 0.02;
        s.symbol.scale.setScalar(0.8 * a.visibility);
        s.output.scale.setScalar(0.65 * a.visibility);
        s.receipt.visible = a.receipt > 0.02;
        s.receipt.position.y = 1.4 + a.receipt * 0.5;
        s.receipt.rotation.y = time * 0.35;
        s.hoop.rotation.z = time * 0.3;
        s.hoop.visible = detail < 2 || n === 5 || n === 6;
        s.bars.forEach((b, i) => {
          b.visible = n === 1 || n === 4 || n === 8 || n === 3;
          b.scale.y =
            0.18 +
            ((i + a.step) % 4) * 0.19 +
            (n === 1 ? Math.sin(time + i) * 0.07 : 0);
          b.position.y = 0.8 + b.scale.y / 2;
        });
        s.steps.forEach((b, i) => {
          b.material = i === a.step ? ivory : mats[n];
          b.scale.y = i === a.step ? 0.16 : 0.05;
        });
      });
    },
    dispose() {
      roots.forEach((r) => scene.remove(r));
      geos.forEach((g) => g.dispose());
      [...mats, ivory, ink, ...labelMats].forEach((m) => m.dispose());
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
