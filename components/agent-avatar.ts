import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { agentDesigns, type AvatarMotion } from '@/lib/agent-design';

/** Shared geometry and materials, with close-range limbs and expressions. No PBR or large textures. */
export function createAvatarFactory() {
  const rounded = new RoundedBoxGeometry(1, 1, 1, 2, 0.18);
  const sphere = new THREE.SphereGeometry(1, 8, 6);
  const plane = new THREE.PlaneGeometry(1, 1);
  const disk = new THREE.CylinderGeometry(0.16, 0.16, 0.055, 12);
  const geos = [rounded, sphere, plane, disk];
  const ivory = new THREE.MeshLambertMaterial({ color: '#F4F0E8' });
  const ink = new THREE.MeshLambertMaterial({ color: '#26343A' });
  const blush = new THREE.MeshLambertMaterial({ color: '#EDB5B2' });
  const cyan = new THREE.MeshBasicMaterial({ color: '#79DFFA' });
  const pale = new THREE.MeshBasicMaterial({ color: '#E9FCFF' });
  const glass = new THREE.MeshLambertMaterial({
    color: '#83E5F4',
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const gold = new THREE.MeshLambertMaterial({ color: '#E4BF64' });
  const variants = agentDesigns.map(
    (d) => new THREE.MeshLambertMaterial({ color: d.color }),
  );
  const textures: THREE.Texture[] = [];
  const glyphMats = agentDesigns.map((_, i) => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = (points: number[][]) => {
      ctx.beginPath();
      points.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(70, 52, 25, 0, Math.PI * 2);
      ctx.stroke();
      path([
        [52, 73],
        [30, 97],
      ]);
    }
    if (i === 1) {
      [25, 52, 79].forEach((x, k) =>
        ctx.fillRect(x, 86 - k * 18, 15, 20 + k * 18),
      );
    }
    if (i === 2) {
      path([
        [64, 24],
        [94, 38],
        [88, 78],
        [64, 102],
        [40, 78],
        [34, 38],
        [64, 24],
      ]);
    }
    if (i === 3) {
      ctx.beginPath();
      ctx.arc(64, 64, 36, 0, Math.PI * 2);
      ctx.stroke();
      path([
        [43, 64],
        [59, 79],
        [84, 49],
      ]);
    }
    if (i === 4) {
      for (let y = 36; y < 97; y += 25) {
        ctx.beginPath();
        ctx.ellipse(64, y, 31, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      path([
        [33, 36],
        [33, 87],
      ]);
      path([
        [95, 36],
        [95, 87],
      ]);
    }
    if (i === 5) {
      path([
        [64, 25],
        [75, 50],
        [102, 64],
        [75, 77],
        [64, 104],
        [52, 77],
        [26, 64],
        [52, 50],
        [64, 25],
      ]);
    }
    if (i === 6) {
      ctx.beginPath();
      ctx.ellipse(67, 58, 21, 37, 0.65, 0, Math.PI * 2);
      ctx.stroke();
      path([
        [36, 100],
        [77, 39],
      ]);
    }
    if (i === 7) {
      path([
        [43, 38],
        [21, 64],
        [43, 89],
      ]);
      path([
        [85, 38],
        [107, 64],
        [85, 89],
      ]);
      path([
        [73, 29],
        [57, 98],
      ]);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    return new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      depthWrite: false,
    });
  });
  const materials = [
    ivory,
    ink,
    blush,
    cyan,
    pale,
    glass,
    gold,
    ...variants,
    ...glyphMats,
  ];
  function mesh(
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
  return {
    create(instance: number) {
      const g = new THREE.Group();
      g.userData.instance = instance;
      const body = mesh(g, rounded, ivory, 0, 0.64, 0, 0.54, 0.57, 0.43);
      const head = mesh(g, rounded, ivory, 0, 1.22, 0, 0.92, 0.69, 0.65);
      [body, head].forEach((m) => (m.userData.instance = instance));
      const ears = [-1, 1].map((s) =>
        mesh(g, rounded, ivory, s * 0.47, 1.21, 0, 0.09, 0.23, 0.22),
      );
      const eyes = [-1, 1].map((s) =>
        mesh(g, rounded, ink, s * 0.175, 1.25, -0.326, 0.1, 0.19, 0.03),
      );
      const cheeks = [-1, 1].map((s) =>
        mesh(g, sphere, blush, s * 0.27, 1.09, -0.319, 0.063, 0.032, 0.013),
      );
      const chest = mesh(g, rounded, cyan, 0, 0.66, -0.222, 0.22, 0.22, 0.025);
      mesh(g, rounded, ivory, 0, 0.66, -0.238, 0.155, 0.155, 0.02);
      const limbs = [-1, 1].map((s) => {
        const leg = new THREE.Group();
        leg.position.set(s * 0.15, 0.38, 0);
        g.add(leg);
        mesh(leg, rounded, ivory, 0, -0.115, 0, 0.18, 0.27, 0.22);
        mesh(leg, rounded, ink, 0, -0.235, -0.018, 0.19, 0.075, 0.24);
        const arm = new THREE.Group();
        arm.position.set(s * 0.34, 0.86, 0);
        g.add(arm);
        mesh(arm, sphere, ink, 0, -0.02, 0, 0.09, 0.1, 0.09);
        mesh(arm, rounded, ivory, s * 0.025, -0.15, 0, 0.16, 0.31, 0.19);
        mesh(arm, sphere, ink, s * 0.04, -0.33, 0, 0.075, 0.08, 0.075);
        return { leg, arm };
      });
      const hat = new THREE.Group();
      g.add(hat);
      hat.position.y = 1.81;
      const skill = mesh(hat, rounded, variants[0], 0, 0, 0, 0.43, 0.4, 0.4);
      skill.userData.instance = instance;
      const icon = mesh(hat, plane, glyphMats[0], 0, 0, -0.205, 0.28, 0.28, 1);
      icon.rotation.y = Math.PI;
      mesh(hat, rounded, cyan, 0, 0.245, 0, 0.065, 0.12, 0.065);
      const crown = mesh(hat, rounded, glass, 0, 0.37, 0, 0.22, 0.22, 0.22);
      const spark = mesh(hat, rounded, pale, 0, 0.37, 0, 0.085, 0.085, 0.085);
      const toolGroup = new THREE.Group();
      limbs[0].arm.add(toolGroup);
      toolGroup.position.set(-0.04, -0.3, -0.13);
      const tablet = mesh(toolGroup, rounded, ink, 0, 0, 0, 0.28, 0.35, 0.045);
      const tabletFace = mesh(
        toolGroup,
        rounded,
        cyan,
        0,
        0,
        -0.03,
        0.21,
        0.26,
        0.025,
      );
      const coin = mesh(toolGroup, disk, gold, 0, 0, 0);
      coin.rotation.x = Math.PI / 2;
      const shield = mesh(
        toolGroup,
        rounded,
        variants[2],
        0,
        0,
        0,
        0.3,
        0.4,
        0.07,
      );
      const pencil = mesh(toolGroup, rounded, ivory, 0, 0, 0, 0.08, 0.45, 0.08);
      const tip = mesh(toolGroup, sphere, gold, 0, 0.25, 0, 0.05, 0.08, 0.05);
      const capability = mesh(g, rounded, glass, 0, 0.89, -0.56, 0.2, 0.2, 0.2);
      const extra = [2, 1, 3].map((v, i) => {
        const group = new THREE.Group();
        g.add(group);
        mesh(group, rounded, variants[v], 0, 0, 0, 0.3, 0.29, 0.29);
        const glyph = mesh(
          group,
          plane,
          glyphMats[v],
          0,
          0,
          -0.15,
          0.2,
          0.2,
          1,
        );
        glyph.rotation.y = Math.PI;
        group.position.set((i - 1) * 0.34, 2.16, 0);
        return group;
      });
      let variant = -1;
      return {
        g,
        body,
        head,
        skill,
        limbs,
        eyes,
        capability,
        extra,
        pickable: [body, head, skill],
        update(
          nextVariant: number,
          time: number,
          motion: AvatarMotion,
          detail: boolean,
        ) {
          if (nextVariant !== variant) {
            variant = nextVariant;
            skill.material = variants[variant];
            icon.material = glyphMats[variant];
          }
          // At distance retain the body, limbs and capability silhouette, without tiny facial accents.
          [...ears, ...cheeks].forEach((m) => (m.visible = detail));
          eyes.forEach((m) => {
            m.visible = detail;
            m.scale.y = 0.19 * motion.blink;
          });
          g.position.y = motion.bob;
          head.rotation.z = motion.headTilt;
          hat.position.y = 1.81 + motion.moduleLift;
          crown.rotation.y = time * 0.3;
          crown.position.y = motion.composite ? 0.88 : 0.37;
          spark.position.y = crown.position.y;
          chest.scale.set(
            0.22 * motion.corePulse,
            0.22 * motion.corePulse,
            0.025,
          );
          limbs[0].leg.rotation.x = motion.stride;
          limbs[1].leg.rotation.x = -motion.stride;
          limbs[0].arm.rotation.x = motion.leftArm;
          limbs[1].arm.rotation.x = motion.rightArm;
          toolGroup.visible = detail && !motion.joining;
          tablet.visible = variant === 0 || variant === 3 || variant === 7;
          tabletFace.visible = tablet.visible;
          coin.visible = variant === 1 || variant === 4;
          shield.visible = variant === 2;
          pencil.visible = variant === 5 || variant === 6;
          tip.visible = pencil.visible;
          capability.visible = motion.joining || motion.presenting;
          capability.rotation.y = time * 0.8;
          capability.position.y =
            0.88 + (motion.working ? Math.sin(time * 3) * 0.08 : 0);
          extra.forEach((m, i) => {
            m.visible = motion.composite;
            m.position.y = 2.28 + Math.sin(time * 2 + i) * 0.015;
          });
        },
      };
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
