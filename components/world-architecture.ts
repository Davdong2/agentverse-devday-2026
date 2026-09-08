import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  regions,
  regionConnections,
  canWalkAt,
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
      color: '#C7C9C9',
      specular: '#FFFFFF',
      shininess: 72,
    }),
  );
  stone.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;',
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 stoneLocal=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      stoneLocal=instanceMatrix*stoneLocal;
      #endif
      vStonePosition=(modelMatrix*stoneLocal).xyz;
      vStoneNormal=normalize(mat3(modelMatrix)*objectNormal);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneNormal;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
      vec3 weights=pow(abs(vStoneNormal),vec3(5.));weights/=max(.001,weights.x+weights.y+weights.z);
      vec3 px=texture2D(map,vStonePosition.yz*.3).rgb;
      vec3 py=texture2D(map,vStonePosition.xz*.3).rgb;
      vec3 pz=texture2D(map,vStonePosition.xy*.3).rgb;
      diffuseColor.rgb*=mix(vec3(1.),px*weights.x+py*weights.y+pz*weights.z,.42);
      #endif
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float grain=fract(sin(dot(floor(vStonePosition*150.0),vec3(12.9898,78.233,37.719)))*43758.5453);
      float strata=sin(vStonePosition.y*8.0+sin(vStonePosition.x*2.0)*0.3);
      diffuseColor.rgb*=0.967+grain*0.038+strata*0.006;`,
    );
  };
  stone.customProgramCacheKey = () => 'agentverse-brushed-alloy-v3';
  const edge = mat(
    new THREE.MeshPhongMaterial({
      color: '#202833',
      specular: '#7B8B9C',
      shininess: 54,
    }),
  );
  const gold = mat(
    new THREE.MeshPhongMaterial({ color: '#B99159', shininess: 82 }),
  );
  const board = mat(
    new THREE.MeshPhongMaterial({
      color: '#172D2C',
      specular: '#4E8987',
      shininess: 42,
    }),
  );
  const glowColors = ['#8DD8FF', '#A8E6D3', '#FFE1A0'];
  const glow = glowColors.map((color) =>
    mat(
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
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
  const pavingPoints: number[] = [];
  const segment = (a: THREE.Vector3, b: THREE.Vector3) =>
    pavingPoints.push(...a.toArray(), ...b.toArray());
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
        'varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main(){float lane=pow(.5+.5*sin(vUv.x*150.),24.);float pulse=pow(.5+.5*cos(vUv.y*30.-uTime*2.+sin(vUv.x*16.)*2.),16.);float fade=smoothstep(0.,.12,vUv.y)*(1.-smoothstep(.76,1.,vUv.y));gl_FragColor=vec4(mix(uColor,vec3(.94,.98,1.),pulse),fade*(.012+lane*.10+pulse*lane*.38));}',
    }),
  );
  const curtain = geo(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true));
  regions.forEach((r, n) => {
    const x = r.x * 100,
      z = r.y * 100,
      R = n === 0 ? 11 : 5.5;
    const moduleBase = mesh(box, stone, x, -0.82, z, R * 1.72, 1.5, R * 1.72);
    moduleBase.rotation.y = n * 0.07;
    const floor = mesh(cylinder, board, x, -0.4, z, R, 0.8, R);
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
    for (let sector = 0; sector < 20; sector++) {
      const angle = (sector * Math.PI * 2) / 20;
      segment(
        new THREE.Vector3(
          x + Math.cos(angle) * R * 0.32,
          0.012,
          z + Math.sin(angle) * R * 0.32,
        ),
        new THREE.Vector3(
          x + Math.cos(angle) * R * 0.94,
          0.012,
          z + Math.sin(angle) * R * 0.94,
        ),
      );
    }
    for (const radius of [R * 0.32, R * 0.6, R * 0.78])
      for (let s = 0; s < 96; s++) {
        const a = (s * Math.PI * 2) / 96,
          b = ((s + 1) * Math.PI * 2) / 96;
        segment(
          new THREE.Vector3(
            x + Math.cos(a) * radius,
            0.012,
            z + Math.sin(a) * radius,
          ),
          new THREE.Vector3(
            x + Math.cos(b) * radius,
            0.012,
            z + Math.sin(b) * radius,
          ),
        );
      }
    ring(x, 0.022, z, R * 0.96, gold);
    ring(x, 0.03, z, R * 0.87, glow[n % 3]);
    for (let j = 0; j < 5; j++) {
      const a = (j * Math.PI * 2) / 5 + 0.5;
      const px = x + Math.cos(a) * R * 0.92,
        pz = z + Math.sin(a) * R * 0.92;
      mesh(box, stone, px, 0.27, pz, 0.22, 0.54, 0.22);
      mesh(box, glow[n % 3], px, 0.56, pz, 0.11, 0.04, 0.11);
    }
    // Each region is the open top of a giant compute module: vents, sockets and status rails
    // live around the walkable motherboard deck instead of becoming decorative buildings.
    for (let j = 0; j < 8; j++) {
      const a = (j * Math.PI * 2) / 8 + Math.PI / 8,
        px = x + Math.cos(a) * R * 0.73,
        pz = z + Math.sin(a) * R * 0.73;
      const socket = mesh(box, edge, px, 0.095, pz, 0.54, 0.17, 0.72);
      socket.rotation.y = -a;
      const status = mesh(
        box,
        glow[(n + j) % 3],
        px,
        0.195,
        pz,
        0.32,
        0.025,
        0.5,
      );
      status.rotation.y = -a;
    }
    const fall = mesh(curtain, beamMat, x, -9, z, 0.36, 17, 0.36);
    waterfalls.push(fall);
    if (n === 1 || n === 3 || n === 4) {
      // Quiet library / memory / compute arc, with open circulation through the middle.
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * 1.12 + k * 0.2,
          px = x + Math.cos(a) * 4.55,
          pz = z + Math.sin(a) * 4.55;
        const h = n === 4 ? 2.8 + (k % 2) * 0.5 : n === 3 ? 2.3 : 1.6;
        const shelf = mesh(box, stone, px, h / 2, pz, 0.54, h, 0.58);
        shelf.rotation.y = -a;
        for (let j = 0; j < 3; j++) {
          const slab = mesh(
            box,
            n === 3 ? gold : glow[n % 3],
            px,
            0.5 + j * 0.48,
            pz - 0.32,
            0.36,
            0.025,
            0.055,
          );
          slab.rotation.y = -a;
        }
      }
    }
    if (n === 5) {
      [-1, 1].forEach((side) => {
        ring(x + side * 2.65, 0.08, z, 1.05, gold);
        ring(x + side * 2.65, 0.09, z, 0.82, glow[side === 1 ? 1 : 2]);
      });
    }
    if (n === 6) {
      for (let k = 0; k < 3; k++) {
        const shield = ring(x, 2.75, z - 2.6, 0.85 + k * 0.24, glow[1]);
        shield.rotation.x = 0;
      }
    }
    if (n === 7) {
      const portal = mesh(curtain, beamMat, x, 2.6, z - 2.4, 1.05, 5.2, 1.05);
      waterfalls.push(portal);
    }
    if (n !== 0) {
      ring(x, 0.045, z, 2.5, glow[n % 3]);
      if (n === 5 || n === 8) {
        // Exchange pavilion and energy canopy share an open circular roof line.
        ring(x, 5.1, z - 0.65, 4.2, gold);
        const canopy = ring(x, 5.0, z - 0.65, 4.1, stone);
        canopy.scale.z = 5.5;
        for (const side of [-1, 1]) {
          mesh(box, stone, x + side * 3.8, 2.45, z - 1.2, 0.4, 4.9, 0.46);
          mesh(box, gold, x + side * 3.8, 4.8, z - 1.2, 0.46, 0.1, 0.52);
        }
        if (n === 8)
          for (let k = 0; k < 7; k++) {
            const fin = mesh(
              box,
              stone,
              x - 2.4 + k * 0.8,
              4.45,
              z - 2.6,
              0.32,
              0.08,
              1.4,
            );
            fin.rotation.z = -0.25;
          }
      } else if (n === 3 || n === 4) {
        // Archive galleries and compute piers have clearly different silhouettes.
        for (const side of [-1, 1]) {
          const arch = mesh(
            archGeo,
            stone,
            x + side * 2.9,
            0,
            z - 2.85,
            0.6,
            n === 3 ? 1.0 : 1.28,
            0.7,
          );
          arch.userData.region = n;
          pickable.push(arch);
          mesh(box, gold, x + side * 2.9, 6.1, z - 2.85, 0.65, 0.075, 0.7);
        }
        mesh(box, stone, x, n === 3 ? 5.1 : 6.6, z - 2.85, 5.8, 0.26, 0.72);
      } else if (n === 9) {
        const horizon = ring(x, 4.7, z - 2.8, 2.65, gold);
        horizon.rotation.x = 0.24;
        horizon.rotation.y = 0.35;
        mesh(box, stone, x - 3.2, 1.7, z - 2.0, 0.65, 3.4, 0.9);
        mesh(box, stone, x + 3.2, 2.3, z - 2.0, 0.65, 4.6, 0.9);
      } else {
        const arch = mesh(
          archGeo,
          stone,
          x,
          0,
          z - 3.55,
          n === 7 ? 1.8 : 1.55,
          n === 7 ? 1.5 : 1.2,
          1,
        );
        arch.userData.region = n;
        pickable.push(arch);
        const inset = mesh(
          archGeo,
          gold,
          x,
          0,
          z - 3.12,
          n === 7 ? 1.66 : 1.4,
          n === 7 ? 1.45 : 1.15,
          0.12,
        );
        if (n === 2) {
          inset.material = glow[0];
        }
      }
    }
  });
  // A high open rotunda gives the collaboration center a distinct skyline.
  const rotundaX = regions[0].x * 100,
    rotundaZ = regions[0].y * 100;
  const rotundaShape = new THREE.Shape();
  rotundaShape.absarc(0, 0, 11.5, 0, Math.PI * 2, false);
  const rotundaHole = new THREE.Path();
  rotundaHole.absarc(0, 0, 9.7, 0, Math.PI * 2, true);
  rotundaShape.holes.push(rotundaHole);
  const upperRing = mesh(
    geo(
      new THREE.ExtrudeGeometry(rotundaShape, {
        depth: 0.45,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 2,
        curveSegments: 64,
      }),
    ),
    stone,
    rotundaX,
    9.5,
    rotundaZ,
  );
  upperRing.rotation.x = -Math.PI / 2;
  ring(rotundaX, 9.54, rotundaZ, 11.4, gold);
  ring(rotundaX, 9.55, rotundaZ, 9.8, glow[0]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.18,
      x = rotundaX + Math.cos(a) * 11.3,
      z = rotundaZ + Math.sin(a) * 11.3;
    if (!canWalkAt(x, z)) mesh(box, stone, x, 2.75, z, 0.8, 13.5, 0.8);
    const colonnade = mesh(archGeo, stone, x, 9.5, z, 0.72, 0.8, 0.8);
    colonnade.rotation.y = Math.PI / 2 - a;
  }
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
  const routeMaterial = mat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float uTime;
    void main(){float lane=floor(vUv.x*3.);float across=abs(fract(vUv.x*3.)-.5);
    float line=exp(-across*across*1500.);float haze=exp(-across*across*100.);
    float travel=fract(vUv.y*5.-uTime*.38+lane*.29);
    float packet=smoothstep(.65,.96,travel)*(1.-smoothstep(.96,1.,travel));
    vec3 color=lane<1.?vec3(.28,.65,.9):lane<2.?vec3(.35,.73,.61):vec3(.84,.67,.33);
    float ends=smoothstep(0.,.03,vUv.y)*(1.-smoothstep(.97,1.,vUv.y));
    gl_FragColor=vec4(color,ends*(line*(.15+packet*.6)+haze*packet*.12));}`,
    }),
  );
  regionConnections.forEach(([a, b], i) => {
    // Bridges meet the island rims. Center-to-center rails used to cut through every plaza.
    const centerA = new THREE.Vector3(
        regions[a].x * 100,
        0,
        regions[a].y * 100,
      ),
      centerB = new THREE.Vector3(regions[b].x * 100, 0, regions[b].y * 100),
      direction = centerB.clone().sub(centerA).normalize(),
      A = centerA
        .clone()
        .addScaledVector(direction, (a === 0 ? 11 : 5.5) - 0.3),
      B = centerB
        .clone()
        .addScaledVector(direction, -(b === 0 ? 11 : 5.5) + 0.3),
      length = A.distanceTo(B);
    const g = new THREE.Group();
    g.position.copy(A).lerp(B, 0.5);
    g.rotation.y = Math.atan2(B.x - A.x, B.z - A.z);
    root.add(g);
    mesh(box, board, 0, -0.2, 0, 2.8, 0.4, length, g);
    [-1, 1].forEach((side) => {
      mesh(box, gold, side * 1.36, -0.025, 0, 0.05, 0.045, length, g);
      mesh(box, stone, side * 1.42, -0.44, 0, 0.1, 0.2, length, g);
    });
    // Curved supports belong only to the span between the two islands.
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(-length * 0.46, -0.36);
    bridgeShape.lineTo(length * 0.46, -0.36);
    bridgeShape.lineTo(length * 0.46, -4.0);
    bridgeShape.quadraticCurveTo(0, -0.65, -length * 0.46, -4.0);
    bridgeShape.closePath();
    const supportGeo = geo(
      new THREE.ExtrudeGeometry(bridgeShape, {
        depth: 0.22,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.045,
        bevelThickness: 0.045,
        curveSegments: 32,
        steps: 1,
      }),
    );
    for (const side of [-1, 1]) {
      const arch = mesh(supportGeo, stone, side * 1.06, 0, 0, 1, 1, 1, g);
      arch.rotation.y = Math.PI / 2;
      // Slender separated parapet posts leave the route visible from eye level.
      for (let k = 0; k < Math.floor(length / 3); k++) {
        const z = -length / 2 + 1.5 + k * 3;
        mesh(box, stone, side * 1.35, 0.29, z, 0.13, 0.6, 0.13, g);
        mesh(box, gold, side * 1.35, 0.61, z, 0.16, 0.035, 0.16, g);
      }
      mesh(box, stone, side * 1.35, 0.59, 0, 0.1, 0.085, length, g);
    }
    const stream = mesh(
      geo(new THREE.PlaneGeometry(2.1, length)),
      routeMaterial,
      0,
      0.021,
      0,
      1,
      1,
      1,
      g,
    );
    stream.rotation.x = -Math.PI / 2;
    if (i % 3 === 0 && length > 15) mesh(archGeo, stone, 0, 0, 0, 1, 1, 1, g);
    const laneSegments = Math.floor(length / 1.35);
    for (let k = 1; k < laneSegments; k++) {
      const u = k / laneSegments,
        point = A.clone().lerp(B, u),
        side = new THREE.Vector3(B.z - A.z, 0, A.x - B.x).normalize();
      segment(
        point.clone().addScaledVector(side, -1.24).setY(0.013),
        point.clone().addScaledVector(side, 1.24).setY(0.013),
      );
    }
    routes.push({ a: A, b: B, length, group: g });
  });
  const pavingGeometry = geo(new THREE.BufferGeometry());
  pavingGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(pavingPoints, 3),
  );
  const paving = new THREE.LineSegments(
    pavingGeometry,
    mat(
      new THREE.LineBasicMaterial({
        color: '#A8A7A7',
        transparent: true,
        opacity: 0.25,
      }),
    ),
  );
  root.add(paving);
  // Each moving pulse is a single instance, shared across all routes.
  const pulseGeo = geo(new THREE.SphereGeometry(1, 8, 6));
  const pulseMat = mat(
    new THREE.MeshBasicMaterial({
      color: '#D9F4FF',
      transparent: true,
      opacity: 0.6,
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
  // A recessed, layered oculus anchors the floating modules in a clear working space.
  mesh(cylinder, edge, cx, -0.04, cz, 1.3, 0.1, 1.3);
  mesh(cylinder, stone, cx, 0.025, cz, 1.18, 0.07, 1.18);
  ring(cx, 0.064, cz, 1.03, gold);
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
  // A fiber trunk rises from the GPU core and separates into fine data filaments
  // that terminate at every regional compute module.
  const fiberLines: THREE.Line[] = [];
  const fiberMaterials: THREE.LineBasicMaterial[] = [];
  const fiberPalette = ['#9DE8FF', '#DDF9FF', '#8CE6C9', '#FFD397'];
  const addFiber = (
    points: THREE.Vector3[],
    color: string,
    opacity: number,
  ) => {
    const geometry = geo(new THREE.BufferGeometry().setFromPoints(points));
    const material = mat(
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    fiberMaterials.push(material);
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 5;
    root.add(line);
    fiberLines.push(line);
  };
  for (let i = 0; i < 28; i++) {
    const points: THREE.Vector3[] = [];
    for (let p = 0; p <= 24; p++) {
      const t = p / 24,
        radius = 0.16 + t * (0.45 + (i % 5) * 0.08),
        angle = i * 2.399963 + t * 3.2;
      points.push(
        new THREE.Vector3(
          cx + Math.cos(angle) * radius,
          0.15 + t * 29,
          cz + Math.sin(angle) * radius,
        ),
      );
    }
    addFiber(points, fiberPalette[i % fiberPalette.length], 0.28);
  }
  regions.slice(1).forEach((region, regionOffset) => {
    const tx = region.x * 100,
      tz = region.y * 100;
    for (let strand = 0; strand < 5; strand++) {
      const side = strand - 2,
        curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(cx + side * 0.12, 16 + strand * 0.32, cz),
          new THREE.Vector3(
            cx + (tx - cx) * 0.24 + side * 0.38,
            12.5 + strand * 0.12,
            cz + (tz - cz) * 0.24,
          ),
          new THREE.Vector3(
            cx + (tx - cx) * 0.68,
            6.5 + strand * 0.18,
            cz + (tz - cz) * 0.68 + side * 0.3,
          ),
          new THREE.Vector3(tx + side * 0.22, 0.7, tz),
        ]);
      addFiber(
        curve.getPoints(30),
        fiberPalette[(regionOffset + strand) % fiberPalette.length],
        0.22,
      );
    }
  });
  // A lightweight rotating Earth keeps the real world visible beyond the machine.
  const earth = new THREE.Group();
  earth.position.set(84, 46, -55);
  root.add(earth);
  const earthSurface = mesh(
    geo(new THREE.SphereGeometry(8.4, 36, 24)),
    mat(
      new THREE.MeshPhongMaterial({
        color: '#3A78A6',
        emissive: '#102A46',
        specular: '#BEEBFF',
        shininess: 72,
      }),
    ),
    0,
    0,
    0,
    1,
    1,
    1,
    earth,
  );
  const earthClouds = mesh(
    geo(new THREE.SphereGeometry(8.55, 32, 20)),
    mat(
      new THREE.MeshBasicMaterial({
        color: '#EAF8FF',
        transparent: true,
        opacity: 0.12,
        wireframe: true,
        depthWrite: false,
      }),
    ),
    0,
    0,
    0,
    1,
    1,
    1,
    earth,
  );
  const earthOrbit = mesh(
    geo(new THREE.TorusGeometry(11.5, 0.025, 5, 96)),
    glow[0],
    0,
    0,
    0,
    1,
    1,
    1,
    earth,
  );
  earthOrbit.rotation.x = Math.PI / 2.5;
  earth.rotation.z = -0.18;
  const starPositions: number[] = [];
  for (let i = 0; i < 420; i++) {
    const a = i * 2.399963,
      h = ((i * 47) % 211) / 210,
      radius = 105 + (i % 17);
    starPositions.push(
      48 + Math.cos(a) * radius,
      12 + h * 82,
      48 + Math.sin(a) * radius,
    );
  }
  const starGeometry = geo(new THREE.BufferGeometry());
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3),
  );
  const stars = new THREE.Points(
    starGeometry,
    mat(
      new THREE.PointsMaterial({
        color: '#D9EEFF',
        size: 0.18,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    ),
  );
  root.add(stars);
  const yAxis = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  // Static world geometry is batched by material, retaining pick targets and animated parts.
  root.updateMatrixWorld(true);
  const keep = new Set<THREE.Object3D>([
    ...pickable,
    ...waterfalls,
    ...links,
    result,
    coreBeam,
    earthSurface,
    earthClouds,
    earthOrbit,
  ]);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const original: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (
      !(o instanceof THREE.Mesh) ||
      o instanceof THREE.InstancedMesh ||
      keep.has(o)
    )
      return;
    let parent: THREE.Object3D | null = o;
    while (parent) {
      if (parent === coop) return;
      parent = parent.parent;
    }
    const m = o.material as THREE.Material;
    if (Array.isArray(m)) return;
    const list = batches.get(m) ?? [];
    list.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
    batches.set(m, list);
    original.push(o);
  });
  original.forEach((o) => o.removeFromParent());
  batches.forEach((list, m) => {
    // Buffer layouts differ between extruded stone and parametric primitives.
    const normalized = list.map((g) => {
      const result = g.index ? g.toNonIndexed() : g;
      if (result !== g) g.dispose();
      return result;
    });
    const merged = mergeGeometries(normalized);
    normalized.forEach((g) => g.dispose());
    if (merged) root.add(new THREE.Mesh(geo(merged), m));
  });
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
    fiberLines,
    earth,
    setSurfaceMap(texture: THREE.Texture) {
      stone.map = texture;
      stone.needsUpdate = true;
      board.map = texture;
      board.needsUpdate = true;
    },
    update(
      time: number,
      phase: number,
      progress: number,
      states: AgentState[],
      quality: number,
      flow = 1,
    ) {
      beamMat.uniforms.uTime.value = time;
      routeMaterial.uniforms.uTime.value = time * flow;
      earthSurface.rotation.y = time * 0.018;
      earthClouds.rotation.y = -time * 0.026;
      earthOrbit.rotation.z = time * 0.008;
      fiberMaterials.forEach((material, i) => {
        material.opacity =
          (quality > 1 && i % 3 ? 0.08 : 0.18) +
          Math.pow(0.5 + 0.5 * Math.sin(time * 1.7 - i * 0.31), 8) * 0.2;
      });
      waterfalls.forEach((o, i) => (o.visible = quality < 2 || i === 0));
      pulses.count = routes.length * (quality > 0 ? 3 : 6);
      for (let i = 0; i < pulses.count; i++) {
        const route = routes[Math.floor(i / (quality > 0 ? 3 : 6))],
          u = (time * 0.09 * flow + (i % 6) / 6) % 1;
        dummy.position.copy(route.a).lerp(route.b, u);
        dummy.position.y = 0.07;
        dummy.scale.set(0.045, 0.018, 0.14 * flow);
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
        o.visible = false; // Camera-facing layered ribbons are rendered by world-effects.
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
