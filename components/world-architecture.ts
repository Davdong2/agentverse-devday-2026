import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  regions,
  regionConnections,
  type AgentState,
} from '@/lib/civilization-model';

/** Walkable floor remains at y=0; arches and terraces enrich its silhouette without changing paths. */
export function createWorldArchitecture(
  scene: THREE.Scene,
  pickable: THREE.Object3D[],
) {
  const root = new THREE.Group();
  scene.add(root);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const geo = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };
  const mat = <T extends THREE.Material>(m: T) => {
    materials.push(m);
    return m;
  };
  const stone = mat(
    new THREE.MeshPhongMaterial({
      color: '#F2EADF',
      specular: '#E7DED0',
      shininess: 26,
    }),
  );
  const edge = mat(
    new THREE.MeshPhongMaterial({ color: '#D3CECD', shininess: 14 }),
  );
  const gold = mat(
    new THREE.MeshPhongMaterial({ color: '#D6BD83', shininess: 60 }),
  );
  const glowColors = ['#8DD8FF', '#A8E6D3', '#FFE1A0'];
  const glow = glowColors.map((color) =>
    mat(
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  const box = geo(new RoundedBoxGeometry(1, 1, 1, 2, 0.08));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 64));
  const ringGeo = geo(new THREE.TorusGeometry(1, 0.012, 6, 96));
  function mesh(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    parent: THREE.Object3D = root,
  ) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    parent.add(o);
    return o;
  }
  function ring(x: number, y: number, z: number, r: number, m: THREE.Material) {
    const o = mesh(ringGeo, m, x, y, z, r, r, r);
    o.rotation.x = -Math.PI / 2;
    return o;
  }
  const archShape = new THREE.Shape();
  archShape.moveTo(-1.75, 0);
  archShape.lineTo(-1.75, 4.3);
  archShape.absarc(0, 4.3, 1.75, Math.PI, 0, true);
  archShape.lineTo(1.75, 0);
  archShape.lineTo(1.28, 0);
  archShape.lineTo(1.28, 4.3);
  archShape.absarc(0, 4.3, 1.28, 0, Math.PI, false);
  archShape.lineTo(-1.28, 0);
  archShape.closePath();
  const archGeo = geo(
    new THREE.ExtrudeGeometry(archShape, {
      depth: 0.6,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 20,
    }),
  );
  archGeo.translate(0, 0, -0.3);
  const towers = new THREE.InstancedMesh(box, stone, 60);
  root.add(towers);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 60; i++) {
    const a = i * 2.399963,
      r = 45 + (i % 7) * 6,
      h = 14 + (i % 9) * 4;
    dummy.position.set(48 + Math.cos(a) * r, -22 + h / 2, 48 + Math.sin(a) * r);
    dummy.scale.set(2 + (i % 3), h, 2 + (i % 4));
    dummy.rotation.set(0, a, 0);
    dummy.updateMatrix();
    towers.setMatrixAt(i, dummy.matrix);
  }
  towers.instanceMatrix.needsUpdate = true;
  const regionPlatforms: THREE.Mesh[] = [];
  const waterfalls: THREE.Mesh[] = [];
  const beamMat = mat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#A3DAFF') },
      },
      vertexShader:
        'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main(){float lane=pow(.5+.5*sin(vUv.x*100.),14.);float pulse=pow(.5+.5*sin(vUv.y*65.+uTime*3.),8.);float fade=smoothstep(0.,.2,vUv.y)*smoothstep(1.,.7,vUv.y);gl_FragColor=vec4(uColor,fade*(.035+lane*.22+pulse*lane*.5));}',
    }),
  );
  const curtain = geo(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true));
  regions.forEach((r, n) => {
    const x = r.x * 100,
      z = r.y * 100,
      R = n === 0 ? 11 : 5.5;
    const floor = mesh(cylinder, stone, x, -0.4, z, R, 0.8, R);
    floor.userData.region = n;
    pickable.push(floor);
    regionPlatforms.push(floor);
    mesh(cylinder, edge, x, -0.86, z, R * 0.96, 0.18, R * 0.96);
    mesh(cylinder, stone, x, -1.12, z, R * 0.83, 0.35, R * 0.83);
    for (let k = 0; k < 3; k++)
      mesh(
        cylinder,
        stone,
        x,
        -1.7 - k * 0.8,
        z,
        R * (0.63 - k * 0.12),
        0.7,
        R * (0.63 - k * 0.12),
      );
    ring(x, 0.022, z, R * 0.96, gold);
    ring(x, 0.03, z, R * 0.87, glow[n % 3]);
    for (let j = 0; j < 5; j++) {
      const a = (j * Math.PI * 2) / 5 + 0.5;
      const px = x + Math.cos(a) * R * 0.92,
        pz = z + Math.sin(a) * R * 0.92;
      mesh(box, stone, px, 0.27, pz, 0.22, 0.54, 0.22);
      mesh(box, glow[n % 3], px, 0.56, pz, 0.11, 0.04, 0.11);
    }
    const fall = mesh(curtain, beamMat, x, -9, z, 0.36, 17, 0.36);
    waterfalls.push(fall);
    if (n !== 0) {
      const arch = mesh(archGeo, stone, x, 0, z - 2.4, 1.35, 1.35, 1);
      arch.userData.region = n;
      pickable.push(arch);
      ring(x, 0.045, z, 2.5, glow[n % 3]);
    }
  });
  // Background terraces sit outside the walkable islands, separated by aerial haze.
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12,
      r = 48;
    const x = 48 + Math.cos(a) * r,
      z = 48 + Math.sin(a) * r,
      y = 8 + (i % 4) * 5;
    mesh(cylinder, stone, x, y, z, 5, 0.65, 5);
    mesh(cylinder, edge, x, y - 0.7, z, 3.7, 0.65, 3.7);
    mesh(archGeo, stone, x, y + 0.32, z - 1.7, 1.1, 1.1, 1);
    ring(x, y + 0.34, z, 4.7, glow[i % 3]);
    mesh(curtain, beamMat, x, y - 12, z, 0.27, 23, 0.27);
  }
  const routes: {
    a: THREE.Vector3;
    b: THREE.Vector3;
    length: number;
    group: THREE.Group;
  }[] = [];
  regionConnections.forEach(([a, b], i) => {
    const A = new THREE.Vector3(regions[a].x * 100, 0, regions[a].y * 100),
      B = new THREE.Vector3(regions[b].x * 100, 0, regions[b].y * 100),
      length = A.distanceTo(B);
    const g = new THREE.Group();
    g.position.copy(A).lerp(B, 0.5);
    g.rotation.y = Math.atan2(B.x - A.x, B.z - A.z);
    root.add(g);
    mesh(box, stone, 0, -0.2, 0, 2.8, 0.4, length, g);
    [-1, 1].forEach((side) => {
      mesh(box, gold, side * 1.36, -0.025, 0, 0.05, 0.045, length, g);
      mesh(box, stone, side * 1.42, -0.44, 0, 0.1, 0.2, length, g);
    });
    // Curved supports below the flat walkway form the arched bridge silhouette.
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -3.5, -length * 0.4),
      new THREE.Vector3(0, -0.6, 0),
      new THREE.Vector3(0, -3.5, length * 0.4),
    );
    const supportGeo = geo(new THREE.TubeGeometry(curve, 28, 0.3, 5, false));
    mesh(supportGeo, edge, 0, 0, 0, 1, 1, 1, g);
    for (let lane = 0; lane < 3; lane++)
      mesh(
        box,
        glow[lane],
        (lane - 1) * 0.42,
        0.018,
        0,
        0.045,
        0.018,
        length,
        g,
      );
    if (i % 3 === 0 && length > 15) mesh(archGeo, stone, 0, 0, 0, 1, 1, 1, g);
    routes.push({ a: A, b: B, length, group: g });
  });
  // Each moving pulse is a single instance, shared across all routes.
  const pulseGeo = geo(new THREE.SphereGeometry(1, 8, 6));
  const pulseMat = mat(
    new THREE.MeshBasicMaterial({
      color: '#D9F4FF',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const pulses = new THREE.InstancedMesh(pulseGeo, pulseMat, routes.length * 6);
  pulses.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(pulses);
  pulses.frustumCulled = false;
  const center = regions[0],
    cx = center.x * 100,
    cz = center.y * 100;
  [1.3, 2.1, 3.2, 4.4].forEach((r, i) => {
    ring(cx, 0.03 + i * 0.006, cz, r, i % 2 ? gold : glow[0]);
  });
  const coop = new THREE.Group();
  coop.position.set(cx, 2.6, cz);
  root.add(coop);
  const cubeGeo = geo(new RoundedBoxGeometry(0.48, 0.48, 0.48, 3, 0.045));
  const edgeGeo = geo(new THREE.EdgesGeometry(cubeGeo, 25));
  const lineMat = mat(
    new THREE.LineBasicMaterial({
      color: '#E5FBFF',
      transparent: true,
      opacity: 0.9,
    }),
  );
  const cubes = Array.from({ length: 8 }, (_, i) => {
    const m = mat(
      new THREE.MeshPhongMaterial({
        color: ['#81BEFA', '#B1A0EC', '#F0D17A', '#8EDFC3'][i % 4],
        transparent: true,
        opacity: 0.65,
        shininess: 100,
        specular: '#FFFFFF',
        depthWrite: false,
      }),
    );
    const cube = mesh(cubeGeo, m, 0, 0, 0, 1, 1, 1, coop);
    cube.add(new THREE.LineSegments(edgeGeo, lineMat));
    mesh(pulseGeo, glow[i % 3], 0, 0, 0, 0.085, 0.085, 0.085, cube);
    return cube;
  });
  const orbit = mesh(
    geo(new THREE.TorusGeometry(1.1, 0.012, 6, 96)),
    glow[0],
    0,
    0,
    0,
    1,
    1,
    1,
    coop,
  );
  orbit.rotation.x = Math.PI * 0.4;
  const coreBeam = mesh(curtain, beamMat, cx, 1.3, cz, 0.22, 2.6, 0.22);
  const links = Array.from({ length: 4 }, (_, i) =>
    mesh(cylinder, glow[i % 3], 0, 0, 0, 0.025, 1, 0.025),
  );
  const rays = new THREE.InstancedMesh(pulseGeo, pulseMat, 48);
  rays.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rays.frustumCulled = false;
  root.add(rays);
  const result = mesh(cubeGeo, gold, cx, 2.6, cz, 0.8, 0.8, 0.8);
  result.add(new THREE.LineSegments(edgeGeo, lineMat));
  const yAxis = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  return {
    root,
    regionPlatforms,
    routes,
    pulses,
    cubes,
    links,
    result,
    coop,
    waterfalls,
    update(
      time: number,
      phase: number,
      progress: number,
      states: AgentState[],
      quality: number,
    ) {
      beamMat.uniforms.uTime.value = time;
      waterfalls.forEach((o, i) => (o.visible = quality < 2 || i === 0));
      pulses.count = routes.length * (quality > 0 ? 3 : 6);
      for (let i = 0; i < pulses.count; i++) {
        const route = routes[Math.floor(i / (quality > 0 ? 3 : 6))],
          u = (time * 0.09 + (i % 6) / 6) % 1;
        dummy.position.copy(route.a).lerp(route.b, u);
        dummy.position.y = 0.07;
        dummy.scale.set(0.085, 0.035, 0.25);
        dummy.rotation.set(0, route.group.rotation.y, 0);
        dummy.updateMatrix();
        pulses.setMatrixAt(i, dummy.matrix);
      }
      pulses.instanceMatrix.needsUpdate = true;
      const joined = phase >= 2 && phase <= 6;
      coop.visible = joined;
      coreBeam.visible = joined;
      coop.rotation.y = time * 0.23;
      orbit.rotation.z = time * 0.12;
      cubes.forEach((o, i) => {
        const spread = phase === 2 ? 1.8 - progress * 1.22 : 0.58;
        o.position.set(
          ((i % 2) - 0.5) * spread,
          ((Math.floor(i / 2) % 2) - 0.5) * spread,
          (Math.floor(i / 4) - 0.5) * spread,
        );
        o.rotation.set(0, phase === 2 ? (1 - progress) * 0.8 : 0, 0);
      });
      links.forEach((o, i) => {
        o.visible = phase >= 1 && phase <= 4;
        const a = states[i];
        if (!a) return;
        const start = new THREE.Vector3(a.x * 100, 1.05, a.y * 100),
          end = new THREE.Vector3(cx, 2.6, cz);
        direction.copy(end).sub(start);
        o.position.copy(start).lerp(end, 0.5);
        o.scale.set(0.021, direction.length(), 0.021);
        o.quaternion.setFromUnitVectors(yAxis, direction.normalize());
      });
      rays.visible = quality < 2 && joined;
      for (let i = 0; i < 48; i++) {
        const u = (time * 0.45 + i / 48) % 1,
          a = i * 2.39996;
        dummy.position.set(
          cx + Math.cos(a) * (0.2 + u * 0.6),
          0.1 + u * 3.3,
          cz + Math.sin(a) * (0.2 + u * 0.6),
        );
        dummy.scale.setScalar(0.018 + (i % 3) * 0.008);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        rays.setMatrixAt(i, dummy.matrix);
      }
      rays.instanceMatrix.needsUpdate = true;
      result.visible = phase === 5 || phase === 6;
      result.position.set(cx, 2.6, cz);
      if (phase === 5)
        result.position.lerp(
          new THREE.Vector3(regions[7].x * 100, 1.5, regions[7].y * 100),
          progress,
        );
      result.rotation.set(time * 0.25, time * 0.7, 0);
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      root.removeFromParent();
    },
  };
}
