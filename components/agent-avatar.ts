import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { agentDesigns, type AvatarMotion } from '@/lib/agent-design';

/** Shared geometry and materials, with close-range limbs and expressions. No PBR or large textures. */
export function createAvatarFactory() {
  const rounded = new RoundedBoxGeometry(1, 1, 1, 4, 0.23);
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const plane = new THREE.PlaneGeometry(1, 1);
  const disk = new THREE.CylinderGeometry(0.16, 0.16, 0.055, 12);
  const collar = new THREE.CylinderGeometry(1, 1, 1, 28);
  const ring = new THREE.TorusGeometry(1, 0.08, 6, 28);
  const chamfer = new RoundedBoxGeometry(1, 1, 1, 2, 0.17);
  const oval = new THREE.SphereGeometry(0.5, 28, 20);
  const lowOval = new THREE.SphereGeometry(0.5, 12, 8);
  const geos: THREE.BufferGeometry[] = [
    rounded,
    sphere,
    plane,
    disk,
    collar,
    ring,
    chamfer,
    oval,
    lowOval,
  ];
  const skins = agentDesigns.map(
    (d) =>
      new THREE.MeshPhongMaterial({
        color: d.skin,
        specular: '#FFFFFF',
        shininess: 85,
      }),
  );
  const ivory = new THREE.MeshPhongMaterial({
    color: '#F4F0E8',
    specular: '#FFFFFF',
    shininess: 85,
  });
  const ink = new THREE.MeshPhongMaterial({
    color: '#162937',
    specular: '#7594A5',
    shininess: 110,
  });
  const blush = new THREE.MeshLambertMaterial({ color: '#EDB5B2' });
  const cyan = new THREE.MeshBasicMaterial({ color: '#79DFFA' });
  const pale = new THREE.MeshBasicMaterial({ color: '#E9FCFF' });
  const glass = new THREE.MeshPhongMaterial({
    shininess: 110,
    specular: '#FFFFFF',
    color: '#83E5F4',
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const gold = new THREE.MeshPhongMaterial({
    color: '#E4BF64',
    specular: '#FFF2C7',
    shininess: 90,
  });
  const variants = agentDesigns.map(
    (d) =>
      new THREE.MeshPhongMaterial({
        color: d.color,
        shininess: 95,
        specular: '#FFFFFF',
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      }),
  );
  const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  geos.push(outlineGeo);
  const outlineMat = new THREE.LineBasicMaterial({
    color: '#DDF8FF',
    transparent: true,
    opacity: 0.78,
  });
  const shadowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {},
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;gl_FragColor=vec4(.22,.29,.37,.18*pow(max(0.,1.-r),2.));}',
  });
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
    outlineMat,
    shadowMat,
    ink,
    blush,
    cyan,
    pale,
    glass,
    gold,
    ...variants,
    ...skins,
    ...glyphMats,
  ];
  const moduleProfiles = [
    [0.43, 0.4, 0.4],
    [0.48, 0.34, 0.4],
    [0.42, 0.43, 0.42],
    [0.36, 0.47, 0.38],
    [0.44, 0.36, 0.44],
    [0.5, 0.32, 0.37],
    [0.39, 0.41, 0.39],
    [0.45, 0.36, 0.38],
  ] as const;
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
  const distantForms = agentDesigns.map((d) => {
    const parts: THREE.BufferGeometry[][] = [[], [], []];
    const add = (
      bucket: number,
      geometry: THREE.BufferGeometry,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
    ) => {
      const t = new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        new THREE.Vector3(sx, sy, sz),
      );
      const copy = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      parts[bucket].push(copy.applyMatrix4(t));
    };
    add(
      0,
      ['round', 'oval', 'orb', 'capsule'].includes(d.shape) ? lowOval : chamfer,
      0,
      1.22,
      0,
      0.92 * d.headX,
      0.69 * d.headY,
      0.65,
    );
    add(
      0,
      ['round', 'orb', 'oval'].includes(d.shape) ? lowOval : chamfer,
      0,
      0.64,
      0,
      0.54 * d.bodyX,
      0.57 * d.bodyY,
      0.43,
    );
    for (const side of [-1, 1]) {
      add(0, chamfer, side * 0.15, 0.265, 0, 0.18, 0.27, 0.22);
      add(
        0,
        chamfer,
        side * (0.34 * d.bodyX + 0.025),
        0.68,
        0,
        0.16,
        0.31,
        0.19,
      );
      add(0, lowOval, side * 0.47 * d.headX, 1.21, 0, 0.11, 0.25, 0.25);
      add(1, chamfer, side * 0.15, 0.145, -0.018, 0.19, 0.075, 0.24);
      add(
        1,
        lowOval,
        side * (0.34 * d.bodyX + 0.04),
        0.53,
        0,
        0.15,
        0.16,
        0.15,
      );
      add(1, lowOval, side * 0.15 * d.headX, 1.25, -0.342, 0.075, 0.17, 0.035);
    }
    add(2, chamfer, 0, 0.66, -0.237, 0.18, 0.18, 0.026);
    return parts.map((pieces) => {
      const merged = mergeGeometries(pieces)!;
      pieces.forEach((p) => p.dispose());
      geos.push(merged);
      return merged;
    });
  });
  return {
    create(instance: number) {
      const g = new THREE.Group();
      g.userData.instance = instance;
      const body = mesh(g, rounded, ivory, 0, 0.64, 0, 0.54, 0.57, 0.43);
      const head = mesh(g, rounded, ivory, 0, 1.22, 0, 0.92, 0.69, 0.65);
      [body, head].forEach((m) => (m.userData.instance = instance));
      const shadow = mesh(g, plane, shadowMat, 0, 0.015, 0, 1.6, 1.1, 1);
      shadow.rotation.x = -Math.PI / 2;
      const ears = [-1, 1].map((s) =>
        mesh(g, sphere, ivory, s * 0.47, 1.21, 0, 0.055, 0.125, 0.125),
      );
      const eyes = [-1, 1].map((s) =>
        mesh(g, oval, ink, s * 0.15, 1.25, -0.342, 0.075, 0.17, 0.035),
      );
      const eyeGlints = [-1, 1].map((s) =>
        mesh(
          g,
          sphere,
          pale,
          s * 0.15 - 0.017,
          1.29,
          -0.365,
          0.009,
          0.014,
          0.008,
        ),
      );
      const cheeks = [-1, 1].map((s) =>
        mesh(g, sphere, blush, s * 0.27, 1.09, -0.319, 0.063, 0.032, 0.013),
      );
      const chest = mesh(g, rounded, cyan, 0, 0.66, -0.222, 0.22, 0.22, 0.025);
      const chestInset = mesh(
        g,
        rounded,
        ivory,
        0,
        0.66,
        -0.238,
        0.155,
        0.155,
        0.02,
      );
      const chestRing = mesh(
        g,
        ring,
        cyan,
        0,
        0.66,
        -0.254,
        0.245,
        0.245,
        0.08,
      );
      const neckCollar = mesh(g, collar, ink, 0, 0.925, 0, 0.3, 0.055, 0.25);
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
      const skillEdge = new THREE.LineSegments(outlineGeo, outlineMat);
      skillEdge.scale.set(0.38, 0.35, 0.35);
      hat.add(skillEdge);
      const skillCore = mesh(hat, rounded, pale, 0, 0, 0, 0.1, 0.1, 0.1);
      skill.userData.instance = instance;
      const icon = mesh(hat, plane, glyphMats[0], 0, 0, -0.205, 0.28, 0.28, 1);
      icon.rotation.y = Math.PI;
      mesh(hat, rounded, cyan, 0, 0.245, 0, 0.065, 0.12, 0.065);
      const crown = mesh(hat, rounded, glass, 0, 0.37, 0, 0.22, 0.22, 0.22);
      const spark = mesh(hat, rounded, pale, 0, 0.37, 0, 0.085, 0.085, 0.085);
      const crownEdge = new THREE.LineSegments(outlineGeo, outlineMat);
      crownEdge.scale.set(0.2, 0.2, 0.2);
      crownEdge.position.y = 0.37;
      hat.add(crownEdge);
      const backpack = mesh(
        g,
        rounded,
        variants[0],
        0,
        0.69,
        0.27,
        0.32,
        0.36,
        0.18,
      );
      const shoulderCaps = limbs.map((l, i) =>
        mesh(
          l.arm,
          rounded,
          variants[0],
          (i ? 1 : -1) * 0.025,
          -0.09,
          0,
          0.18,
          0.12,
          0.21,
        ),
      );
      const shoulderRings = limbs.map((l) =>
        mesh(l.arm, ring, cyan, 0, -0.02, -0.085, 0.12, 0.12, 0.07),
      );
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
      const sidePorts = [-1, 1].map((side) => {
        const port = mesh(
          g,
          disk,
          variants[0],
          side * 0.5,
          0.69,
          0.02,
          0.7,
          0.75,
          0.7,
        );
        port.rotation.z = Math.PI / 2;
        return port;
      });
      const backCore = mesh(g, ring, cyan, 0, 0.69, 0.385, 0.15, 0.15, 0.06);
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
      const skinMeshes: THREE.Mesh[] = [];
      g.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material === ivory) skinMeshes.push(o);
      });
      const farShell = new THREE.Group();
      g.add(farShell);
      const farParts = distantForms[0].map((geo, i) =>
        mesh(farShell, geo, [skins[0], ink, cyan][i], 0, 0, 0),
      );
      farParts.forEach((m) => (m.userData.instance = instance));
      let variant = -1;
      return {
        g,
        body,
        head,
        skillEdge,
        skill,
        limbs,
        eyes,
        eyeGlints,
        chestRing,
        neckCollar,
        shoulderRings,
        sidePorts,
        backCore,
        capability,
        extra,
        farShell,
        pickable: [body, head, skill, ...farParts],
        update(
          nextVariant: number,
          time: number,
          motion: AvatarMotion,
          detail: boolean,
        ) {
          if (nextVariant !== variant) {
            variant = nextVariant;
            farParts.forEach((m, i) => (m.geometry = distantForms[variant][i]));
            farParts[0].material = skins[variant];
            skill.material = variants[variant];
            backpack.material = variants[variant];
            shoulderCaps.forEach((m) => (m.material = variants[variant]));
            sidePorts.forEach((m) => (m.material = variants[variant]));
            icon.material = glyphMats[variant];
            const design = agentDesigns[variant];
            const [moduleX, moduleY, moduleZ] = moduleProfiles[variant];
            skill.scale.set(moduleX, moduleY, moduleZ);
            skillEdge.scale.set(moduleX * 0.9, moduleY * 0.88, moduleZ * 0.9);
            icon.position.z = -moduleZ * 0.51;
            icon.scale.set(
              Math.min(moduleX, moduleY) * 0.68,
              Math.min(moduleX, moduleY) * 0.68,
              1,
            );
            skinMeshes.forEach((m) => (m.material = skins[variant]));
            head.geometry = ['round', 'oval', 'orb', 'capsule'].includes(
              design.shape,
            )
              ? oval
              : design.shape === 'chamfer'
                ? chamfer
                : rounded;
            head.scale.set(0.92 * design.headX, 0.69 * design.headY, 0.65);
            body.geometry = ['round', 'orb', 'oval'].includes(design.shape)
              ? oval
              : rounded;
            body.scale.set(0.54 * design.bodyX, 0.57 * design.bodyY, 0.43);
            ears.forEach(
              (e, i) => (e.position.x = (i ? 1 : -1) * 0.47 * design.headX),
            );
            eyes.forEach((e, i) => {
              e.position.x = (i ? 1 : -1) * 0.15 * design.headX;
              e.position.z = -0.342;
            });
            cheeks.forEach(
              (e, i) => (e.position.x = (i ? 1 : -1) * 0.27 * design.headX),
            );
            limbs.forEach(
              (l, i) => (l.arm.position.x = (i ? 1 : -1) * 0.34 * design.bodyX),
            );
          }
          const design = agentDesigns[variant];
          const isRound = ['round', 'oval', 'orb', 'capsule'].includes(
            design.shape,
          );
          head.geometry = isRound
            ? detail
              ? oval
              : lowOval
            : detail && design.shape !== 'chamfer'
              ? rounded
              : chamfer;
          body.geometry = ['round', 'orb', 'oval'].includes(design.shape)
            ? detail
              ? oval
              : lowOval
            : detail
              ? rounded
              : chamfer;
          skill.geometry = detail ? rounded : chamfer;
          limbs.forEach((l) => {
            l.arm.visible = detail;
            l.leg.visible = detail;
          });
          farShell.visible = !detail;
          body.visible = detail;
          head.visible = detail;
          chest.visible = detail;
          chestInset.visible = detail;
          icon.visible = detail;
          skillCore.visible = detail;
          spark.visible = detail;
          // The merged distant form keeps the same face, fingers, ears and split legs in three draw calls.
          [...ears, ...cheeks, ...eyeGlints].forEach(
            (m) => (m.visible = detail),
          );
          eyes.forEach((m) => {
            m.visible = detail;
            m.scale.y = 0.155 * motion.blink;
          });
          eyeGlints.forEach((m) => {
            m.scale.y = 0.014 * motion.blink;
          });
          g.position.y = Math.max(0, motion.bob);
          shadow.position.y = 0.015 - g.position.y;
          // Face and shell share the same subtle tilt rather than drifting apart.
          head.rotation.z = motion.headTilt;
          skillEdge.visible = detail;
          crownEdge.visible = detail;
          shoulderCaps.forEach((m) => (m.visible = detail));
          shoulderRings.forEach((m) => (m.visible = detail));
          sidePorts.forEach((m) => (m.visible = detail));
          backpack.visible = detail;
          backCore.visible = detail;
          neckCollar.visible = detail;
          skillCore.rotation.y = time * 0.8;
          skillCore.scale.setScalar(0.1 * motion.corePulse);
          hat.position.y =
            1.81 +
            (agentDesigns[variant].headY - 1) * 0.345 +
            motion.moduleLift;
          crown.rotation.y = time * 0.3;
          crown.position.y = motion.composite ? 0.88 : 0.37;
          spark.position.y = crown.position.y;
          crownEdge.position.y = crown.position.y;
          crownEdge.rotation.y = crown.rotation.y;
          chest.scale.set(
            0.22 * motion.corePulse,
            0.22 * motion.corePulse,
            0.025,
          );
          chestRing.scale.set(
            0.245 * motion.corePulse,
            0.245 * motion.corePulse,
            0.08,
          );
          chestRing.visible = detail;
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
          capability.visible = detail && (motion.joining || motion.presenting);
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
