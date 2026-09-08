import * as THREE from 'three';
import {
  regions,
  type AgentState,
  type Weather,
} from '@/lib/civilization-model';

/** Soft volumetric-looking effects without render targets or bloom. All movement uses WorldState time. */
export function createWorldEffects(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'world-atmosphere';
  scene.add(root);
  const materials: THREE.Material[] = [],
    geometries: THREE.BufferGeometry[] = [];
  const material = <T extends THREE.Material>(m: T) => (materials.push(m), m);
  const geometry = <T extends THREE.BufferGeometry>(g: T) => (
    geometries.push(g),
    g
  );
  const cx = regions[0].x * 100,
    cz = regions[0].y * 100;
  const vertex =
    'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  const ribbonMaterial = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uColor: { value: new THREE.Color('#8BCBEF') },
      },
      vertexShader: vertex,
      fragmentShader: `varying vec2 vUv;uniform float uTime;uniform float uPhase;uniform vec3 uColor;
      void main(){float crossFade=pow(max(0.,1.-abs(vUv.y-.5)*2.),2.5);
      float tip=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.88,1.,vUv.x));
      float travel=pow(.5+.5*cos(vUv.x*32.-uTime*5.),12.);
      float core=pow(max(0.,1.-abs(vUv.y-.5)*2.),16.);
      gl_FragColor=vec4(mix(uColor,vec3(.94,.99,1.),core*.78),tip*(crossFade*.20+core*.32+travel*crossFade*.48));}`,
    }),
  );
  const segments = 28;
  const ribbons = Array.from({ length: 12 }, (_, i) => {
    const g = geometry(new THREE.BufferGeometry());
    const positions = new Float32Array((segments + 1) * 2 * 3),
      uv = new Float32Array((segments + 1) * 4),
      indices: number[] = [];
    for (let s = 0; s <= segments; s++) {
      uv[s * 4] = uv[s * 4 + 2] = s / segments;
      uv[s * 4 + 1] = 0;
      uv[s * 4 + 3] = 1;
      if (s < segments) {
        const j = s * 2;
        indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
      }
    }
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(indices);
    const m = new THREE.Mesh(g, ribbonMaterial);
    m.frustumCulled = false;
    m.visible = false;
    m.userData.strand = i % 3;
    root.add(m);
    return m;
  });
  const ringMaterial = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0 },
        uColor: { value: new THREE.Color('#B6E4F5') },
      },
      vertexShader: vertex,
      fragmentShader: `varying vec2 vUv;uniform float uTime;uniform float uStrength;uniform vec3 uColor;
    void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);
    float moving=fract(uTime*.28);float ring=exp(-pow((r-moving)*38.,2.))*(1.-moving);
    float etched=exp(-pow((r-.72)*150.,2.))*.23+exp(-pow((r-.89)*190.,2.))*.17;
    float ticks=step(.87,cos(a*36.))*smoothstep(.58,.6,r)*(1.-smoothstep(.68,.7,r))*.16;
    gl_FragColor=vec4(uColor,(ring*.45+etched+ticks)*uStrength*(1.-smoothstep(.94,1.,r)));}`,
    }),
  );
  const disc = geometry(new THREE.PlaneGeometry(12, 12));
  const wave = new THREE.Mesh(disc, ringMaterial);
  wave.position.set(cx, 0.045, cz);
  wave.rotation.x = -Math.PI / 2;
  root.add(wave);
  const eventMaterial = material(ringMaterial.clone());
  const skyHaloMat = material(
    new THREE.MeshBasicMaterial({
      color: '#BDE4F5',
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  const skyHaloGeo = geometry(new THREE.TorusGeometry(2.5, 0.025, 6, 96));
  const skyHalos = Array.from({ length: 3 }, (_, i) => {
    const m = new THREE.Mesh(skyHaloGeo, skyHaloMat);
    m.scale.setScalar(1 + i * 0.22);
    root.add(m);
    return m;
  });
  const eventWave = new THREE.Mesh(disc, eventMaterial);
  eventWave.rotation.x = -Math.PI / 2;
  root.add(eventWave);
  const speckGeometry = geometry(new THREE.BufferGeometry());
  const seeds = new Float32Array(144 * 3);
  for (let i = 0; i < 144; i++) {
    seeds[i * 3] = (i * 0.618) % 1;
    seeds[i * 3 + 1] = (i * 0.317) % 1;
    seeds[i * 3 + 2] = (i * 0.791) % 1;
  }
  speckGeometry.setAttribute('position', new THREE.BufferAttribute(seeds, 3));
  const speckMaterial = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBurst: { value: 0 },
        uScale: { value: 1 },
        uCenter: { value: new THREE.Vector3(cx, 0, cz) },
      },
      vertexShader: `uniform float uTime;uniform float uBurst;uniform float uScale;uniform vec3 uCenter;varying float vLife;varying float vGold;
    void main(){float t=fract(uTime*.19+position.y);float a=position.x*6.283;float r=.5+position.z*2.9;
    vec3 p=uCenter+vec3(cos(a+uTime*.08)*r,.2+t*4.3,sin(a+uTime*.08)*r);
    if(uBurst>0.)p=uCenter+vec3(cos(a)*r*uBurst*1.4,2.6+sin(position.z*3.14)*uBurst*2.1-uBurst*uBurst,sin(a)*r*uBurst*1.4);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((2.+position.z*3.)*uScale*7./max(1.,-mv.z),1.,12.);vLife=sin(t*3.14159);vGold=uBurst;}`,
      fragmentShader: `varying float vLife;varying float vGold;void main(){float r=length(gl_PointCoord-.5)*2.;float a=exp(-r*r*5.)*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(mix(vec3(.68,.87,.98),vec3(1.,.85,.52),step(.01,vGold)),a*vLife*.78);}`,
    }),
  );
  const specks = new THREE.Points(speckGeometry, speckMaterial);
  specks.frustumCulled = false;
  root.add(specks);
  // One instanced cloud layer provides aerial depth below bridges; never overlays the UI.
  const cloudGeo = geometry(new THREE.PlaneGeometry(1, 1));
  const cloudsMat = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.28 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;vec4 p=instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*p;}`,
      fragmentShader: `varying vec2 vUv;uniform float uTime;uniform float uOpacity;void main(){vec2 p=(vUv-.5)*2.;float body=exp(-dot(p*vec2(.95,1.3),p*vec2(.95,1.3))*3.);
      body+=exp(-dot(p-vec2(.37,.09),p-vec2(.37,.09))*15.)*.32;
      body+=exp(-dot(p+vec2(.35,-.1),p+vec2(.35,-.1))*18.)*.24;
      float edge=(1.-smoothstep(.64,1.,abs(p.x)))*(1.-smoothstep(.62,1.,abs(p.y)));
      gl_FragColor=vec4(mix(vec3(.78,.84,.91),vec3(.98,.98,.97),body),body*edge*uOpacity);}`,
    }),
  );
  const clouds = new THREE.InstancedMesh(cloudGeo, cloudsMat, 36);
  clouds.frustumCulled = false;
  root.add(clouds);
  // Fine packets continuously rise from every compute district. Positions are
  // deterministic and rendered in one point cloud for a dense but light network.
  const moteGeometry = geometry(new THREE.BufferGeometry());
  const motePositions: number[] = [],
    motePhases: number[] = [];
  regions.forEach((region, regionIndex) => {
    for (let i = 0; i < 18; i++) {
      const angle = i * 2.399963 + regionIndex * 0.37,
        radius = 0.45 + (i % 6) * 0.43;
      motePositions.push(
        region.x * 100 + Math.cos(angle) * radius,
        0.2 + (i % 5) * 0.12,
        region.y * 100 + Math.sin(angle) * radius,
      );
      motePhases.push(((i * 17 + regionIndex * 23) % 97) / 97);
    }
  });
  moteGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(motePositions, 3),
  );
  moteGeometry.setAttribute(
    'aPhase',
    new THREE.Float32BufferAttribute(motePhases, 1),
  );
  const moteMaterial = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uColor: { value: new THREE.Color('#91E4F5') },
      },
      vertexShader: `attribute float aPhase;uniform float uTime;uniform float uScale;varying float vLife;
      void main(){float life=fract(aPhase+uTime*.075);vec3 p=position;
      p.y+=life*5.2;p.x+=sin(uTime*.55+aPhase*31.)*.12;p.z+=cos(uTime*.48+aPhase*27.)*.12;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((2.2+aPhase*2.4)*uScale*8./max(1.,-mv.z),1.,7.);vLife=sin(life*3.14159);}`,
      fragmentShader: `uniform vec3 uColor;varying float vLife;void main(){float r=length(gl_PointCoord-.5)*2.;
      float core=exp(-r*r*7.)*(1.-smoothstep(.72,1.,r));gl_FragColor=vec4(uColor,core*vLife*.82);}`,
    }),
  );
  const networkMotes = new THREE.Points(moteGeometry, moteMaterial);
  networkMotes.frustumCulled = false;
  root.add(networkMotes);
  const beaconGeometry = geometry(new THREE.TorusGeometry(1, 0.018, 6, 72));
  const beaconMaterial = material(
    new THREE.MeshBasicMaterial({
      color: '#94DDEB',
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const regionBeacons = new THREE.InstancedMesh(
    beaconGeometry,
    beaconMaterial,
    regions.length,
  );
  regionBeacons.frustumCulled = false;
  root.add(regionBeacons);
  const eventCageMaterial = material(
    new THREE.MeshBasicMaterial({
      color: '#BDE4F5',
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const eventCage = new THREE.InstancedMesh(
    beaconGeometry,
    eventCageMaterial,
    3,
  );
  eventCage.name = 'active-region-orbits';
  eventCage.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  eventCage.frustumCulled = false;
  root.add(eventCage);
  // The trunk already branches into every district. These last-mile fibers make
  // that hierarchy legible by terminating at the live Agent positions.
  const maxFiberAgents = 50,
    strandsPerAgent = 2;
  const agentFiberGeometry = geometry(new THREE.BufferGeometry());
  const agentFiberPositions = new Float32Array(
      maxFiberAgents * strandsPerAgent * 2 * 3,
    ),
    agentFiberColors = new Float32Array(
      maxFiberAgents * strandsPerAgent * 2 * 3,
    );
  agentFiberGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(agentFiberPositions, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  agentFiberGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(agentFiberColors, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const agentFiberMaterial = material(
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const agentFibers = new THREE.LineSegments(
    agentFiberGeometry,
    agentFiberMaterial,
  );
  agentFibers.name = 'agent-last-mile-fibers';
  agentFibers.frustumCulled = false;
  root.add(agentFibers);
  const packetGeometry = geometry(new THREE.IcosahedronGeometry(0.055, 1));
  const packetMaterial = material(
    new THREE.MeshBasicMaterial({
      color: '#DDF8FF',
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const agentFiberPackets = new THREE.InstancedMesh(
    packetGeometry,
    packetMaterial,
    maxFiberAgents,
  );
  agentFiberPackets.name = 'agent-fiber-packets';
  agentFiberPackets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  agentFiberPackets.frustumCulled = false;
  root.add(agentFiberPackets);
  const dummy = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    eye = new THREE.Vector3(),
    side = new THREE.Vector3(),
    point = new THREE.Vector3(),
    fiberStart = new THREE.Vector3(),
    fiberEnd = new THREE.Vector3(),
    fiberOffset = new THREE.Vector3(),
    fiberColor = new THREE.Color(),
    fiberBright = new THREE.Color('#E9FBFF');
  return {
    root,
    ribbons,
    wave,
    eventWave,
    specks,
    clouds,
    networkMotes,
    regionBeacons,
    eventCage,
    agentFibers,
    agentFiberPackets,
    update(
      time: number,
      phase: number,
      progress: number,
      states: AgentState[],
      camera: THREE.Camera,
      quality: number,
      weather: Weather,
      eventRegion?: number,
    ) {
      ribbonMaterial.uniforms.uTime.value = time;
      ringMaterial.uniforms.uTime.value = time;
      ringMaterial.uniforms.uStrength.value =
        phase >= 1 && phase <= 6 ? 1 : 0.3;
      speckMaterial.uniforms.uTime.value = time;
      speckMaterial.uniforms.uBurst.value = phase === 5 ? progress : 0;
      speckMaterial.uniforms.uScale.value = quality ? 1 : 1.6;
      speckGeometry.setDrawRange(
        0,
        quality === 2 ? 36 : quality === 1 ? 72 : 144,
      );
      specks.visible = phase >= 1 && phase <= 6;
      moteMaterial.uniforms.uTime.value = time;
      moteMaterial.uniforms.uScale.value = quality === 0 ? 1 : 1.35;
      moteMaterial.uniforms.uColor.value.set(
        weather === 'attack' || weather === 'storm'
          ? '#F3BE8D'
          : weather === 'chain'
            ? '#98E7C3'
            : '#91E4F5',
      );
      moteGeometry.setDrawRange(
        0,
        quality === 2 ? 54 : quality === 1 ? 108 : motePhases.length,
      );
      regionBeacons.visible = quality < 2;
      regions.forEach((region, i) => {
        const active =
            i === eventRegion || (i === 0 && phase >= 1 && phase <= 6),
          pulse = 1 + Math.sin(time * 1.7 + i) * 0.035,
          radius = (i === 0 ? 4.7 : 2.65) * (active ? 1.08 : 1) * pulse;
        dummy.position.set(region.x * 100, 0.065, region.y * 100);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(radius, radius, radius);
        dummy.updateMatrix();
        regionBeacons.setMatrixAt(i, dummy.matrix);
      });
      regionBeacons.instanceMatrix.needsUpdate = true;
      const fiberLimit =
        quality === 2 ? 12 : quality === 1 ? 24 : maxFiberAgents;
      const orderedStates = [
        ...states.filter((state) => state.collaborator),
        ...states
          .filter((state) => !state.collaborator)
          .sort(
            (left, right) =>
              Math.hypot(
                left.x * 100 - camera.position.x,
                left.y * 100 - camera.position.z,
              ) -
              Math.hypot(
                right.x * 100 - camera.position.x,
                right.y * 100 - camera.position.z,
              ),
          ),
      ].slice(0, fiberLimit);
      const positionAttribute = agentFiberGeometry.attributes
          .position as THREE.BufferAttribute,
        colorAttribute = agentFiberGeometry.attributes
          .color as THREE.BufferAttribute;
      orderedStates.forEach((state, stateIndex) => {
        const agentX = state.x * 100,
          agentZ = state.y * 100,
          home = regions.reduce(
            (best, region, regionIndex) =>
              Math.hypot(agentX - region.x * 100, agentZ - region.y * 100) <
              Math.hypot(
                agentX - regions[best].x * 100,
                agentZ - regions[best].y * 100,
              )
                ? regionIndex
                : best,
            0,
          ),
          hubX = regions[home].x * 100,
          hubZ = regions[home].y * 100,
          dx = agentX - hubX,
          dz = agentZ - hubZ,
          distance = Math.max(0.001, Math.hypot(dx, dz)),
          anchorDistance = Math.min(2.15, distance * 0.48);
        fiberStart.set(
          hubX + (dx / distance) * anchorDistance,
          0.12,
          hubZ + (dz / distance) * anchorDistance,
        );
        fiberEnd.set(agentX, 0.58, agentZ);
        fiberOffset.set(-dz / distance, 0, dx / distance).multiplyScalar(0.045);
        fiberColor.set(regions[home].color);
        for (let strand = 0; strand < strandsPerAgent; strand++) {
          const vertex = (stateIndex * strandsPerAgent + strand) * 2,
            direction = strand ? 1 : -1;
          positionAttribute.setXYZ(
            vertex,
            fiberStart.x + fiberOffset.x * direction,
            fiberStart.y,
            fiberStart.z + fiberOffset.z * direction,
          );
          positionAttribute.setXYZ(
            vertex + 1,
            fiberEnd.x + fiberOffset.x * direction,
            fiberEnd.y,
            fiberEnd.z + fiberOffset.z * direction,
          );
          colorAttribute.setXYZ(
            vertex,
            fiberColor.r,
            fiberColor.g,
            fiberColor.b,
          );
          colorAttribute.setXYZ(
            vertex + 1,
            fiberBright.r,
            fiberBright.g,
            fiberBright.b,
          );
        }
        const travel = (time * 0.34 + stateIndex * 0.173) % 1;
        dummy.position.copy(fiberStart).lerp(fiberEnd, travel);
        dummy.position.y += Math.sin(travel * Math.PI) * 0.055;
        dummy.scale.setScalar(quality === 0 ? 1 : 0.82);
        dummy.rotation.set(0, time + stateIndex, 0);
        dummy.updateMatrix();
        agentFiberPackets.setMatrixAt(stateIndex, dummy.matrix);
      });
      agentFiberGeometry.setDrawRange(
        0,
        orderedStates.length * strandsPerAgent * 2,
      );
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      agentFiberPackets.count = orderedStates.length;
      agentFiberPackets.instanceMatrix.needsUpdate = true;
      const working = phase >= 1 && phase <= 4;
      ribbons.forEach((m, i) => {
        const state = states[Math.floor(i / 3)];
        m.visible = working && !!state && (quality === 0 || i % 3 === 0);
        if (!m.visible) return;
        a.set(state.x * 100, 1.1, state.y * 100);
        b.set(cx, 2.6, cz);
        const strand = i % 3,
          offset = (strand - 1) * 0.16;
        const data = m.geometry.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j <= segments; j++) {
          const u = j / segments,
            lift = Math.sin(u * Math.PI) * (0.6 + strand * 0.12);
          point.copy(a).lerp(b, u);
          point.y += lift;
          tangent.copy(b).sub(a);
          tangent.y += Math.cos(u * Math.PI) * Math.PI * (0.6 + strand * 0.12);
          eye.copy(camera.position).sub(point);
          side.crossVectors(tangent, eye).normalize();
          point.addScaledVector(side, Math.sin(u * Math.PI) * offset);
          const width = strand === 1 ? 0.15 : 0.085;
          data.setXYZ(
            j * 2,
            point.x - side.x * width,
            point.y - side.y * width,
            point.z - side.z * width,
          );
          data.setXYZ(
            j * 2 + 1,
            point.x + side.x * width,
            point.y + side.y * width,
            point.z + side.z * width,
          );
        }
        data.needsUpdate = true;
      });
      eventWave.visible = eventRegion !== undefined || weather !== 'calm';
      const index =
        eventRegion ??
        (weather === 'attack' ? 6 : weather === 'resources' ? 8 : 5);
      eventCage.visible = eventWave.visible && quality < 2;
      eventCageMaterial.color.set(
        weather === 'attack' || weather === 'storm'
          ? '#E7B07C'
          : weather === 'chain'
            ? '#9BE5C4'
            : '#BDE4F5',
      );
      for (let orbitIndex = 0; orbitIndex < 3; orbitIndex++) {
        const radius = 1.75 + orbitIndex * 0.36;
        dummy.position.set(
          regions[index].x * 100,
          2.2 + orbitIndex * 0.18,
          regions[index].y * 100,
        );
        dummy.rotation.set(
          Math.PI / 2 + orbitIndex * 0.52,
          time * (orbitIndex % 2 ? -0.22 : 0.18) + orbitIndex,
          orbitIndex * 0.44,
        );
        dummy.scale.setScalar(
          radius * (1 + Math.sin(time * 1.6 + orbitIndex) * 0.035),
        );
        dummy.updateMatrix();
        eventCage.setMatrixAt(orbitIndex, dummy.matrix);
      }
      eventCage.instanceMatrix.needsUpdate = true;
      skyHalos.forEach((m, i) => {
        m.visible = eventWave.visible && quality < 2;
        m.position.set(
          regions[index].x * 100,
          12 + i * 0.25,
          regions[index].y * 100,
        );
        m.rotation.set(
          Math.PI / 2 + i * 0.23,
          Math.sin(time * 0.1 + i) * 0.28,
          time * 0.06,
        );
      });
      skyHaloMat.color.set(
        weather === 'attack' || weather === 'storm'
          ? '#DCB88A'
          : weather === 'chain'
            ? '#C1E8D3'
            : '#BDE4F5',
      );
      eventWave.position.set(
        regions[index].x * 100,
        0.055,
        regions[index].y * 100,
      );
      eventMaterial.uniforms.uTime.value = time;
      eventMaterial.uniforms.uStrength.value = 0.85;
      eventMaterial.uniforms.uColor.value.set(
        weather === 'attack' || weather === 'storm' ? '#D8A378' : '#A8D5DC',
      );
      cloudsMat.uniforms.uOpacity.value =
        weather === 'storm' || weather === 'attack' ? 0.48 : 0.28;
      clouds.count = quality === 2 ? 12 : quality === 1 ? 24 : 36;
      for (let i = 0; i < clouds.count; i++) {
        const angle = i * 2.39996,
          radius = 12 + (i % 8) * 8;
        dummy.position.set(
          48 + Math.cos(angle) * radius + Math.sin(time * 0.012 + i) * 1.3,
          -4.5 - (i % 5) * 2.7,
          48 + Math.sin(angle) * radius,
        );
        dummy.quaternion.copy(camera.quaternion);
        dummy.scale.set(18 + (i % 4) * 5, 6 + (i % 3) * 2, 1);
        dummy.updateMatrix();
        clouds.setMatrixAt(i, dummy.matrix);
      }
      clouds.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      root.removeFromParent();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
