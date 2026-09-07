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
  const dummy = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    eye = new THREE.Vector3(),
    side = new THREE.Vector3(),
    point = new THREE.Vector3();
  return {
    root,
    ribbons,
    wave,
    eventWave,
    specks,
    clouds,
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
