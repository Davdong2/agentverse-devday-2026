'use client';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { ArrowUp, Globe2, MapPin, Navigation, RotateCcw } from 'lucide-react';
import {
  regions,
  regionConnections,
  canWalkAt,
  sampleAgents,
  stageAt,
  phaseProgress,
  cycleDuration,
  skillColors,
  type Weather,
} from '@/lib/civilization-model';
import type { Agent, Detail } from '@/lib/marketplace';
type Walker = { x: number; z: number; yaw: number; pitch: number };
type Props = {
  agents: Agent[];
  details: Record<string, Detail>;
  time: number;
  paused: boolean;
  speed: number;
  weather: Weather;
  walker: MutableRefObject<Walker>;
  onAgent: (id: string) => void;
  onRegion: (n: number) => void;
  onNear: (n: number) => void;
  onExit: () => void;
  activeEventRegion?: number;
};
export default function WorldWalk(props: Props) {
  const mount = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    stick = useRef({ x: 0, y: 0 });
  latest.current = props;
  const [error, setError] = useState(''),
    [area, setArea] = useState(0),
    [quality, setQuality] = useState('标准'),
    [knob, setKnob] = useState({ x: 0, y: 0 }),
    [hint, setHint] = useState(true);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setError('当前设备暂不能开启漫游，请使用观察世界。');
      return;
    }
    const mobile = matchMedia('(pointer:coarse)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.3 : 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#c2e2e6');
    scene.fog = new THREE.Fog('#c2e2e6', 20, 85);
    const camera = new THREE.PerspectiveCamera(
      65,
      host.clientWidth / host.clientHeight,
      0.1,
      120,
    );
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight('#fffbea', '#93bfc7', 2.8));
    const sun = new THREE.DirectionalLight('#fff2d5', 2);
    sun.position.set(-20, 35, 20);
    scene.add(sun);
    const ivory = new THREE.MeshLambertMaterial({ color: '#f3eedb' }),
      edge = new THREE.MeshLambertMaterial({ color: '#c5d9cd' }),
      white = new THREE.MeshLambertMaterial({ color: '#f3f1df' });
    const mats = [
      '#94c4df',
      '#dabd7e',
      '#c0b7db',
      '#c2d0df',
      '#bdace0',
      '#a6d0b8',
    ].map((c) => new THREE.MeshLambertMaterial({ color: c }));
    const geometries: THREE.BufferGeometry[] = [],
      materials: THREE.Material[] = [ivory, edge, white, ...mats],
      pickable: THREE.Object3D[] = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1),
      sphere = new THREE.SphereGeometry(0.14, 8, 6);
    geometries.push(boxGeo, sphere);
    function mesh(
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
      scene.add(m);
      return m;
    }
    function bridge(a: number, b: number) {
      const aa = { x: regions[a].x * 100, z: regions[a].y * 100 },
        bb = { x: regions[b].x * 100, z: regions[b].y * 100 };
      const length = Math.hypot(bb.x - aa.x, bb.z - aa.z);
      const m = mesh(
        boxGeo,
        ivory,
        (aa.x + bb.x) / 2,
        -0.08,
        (aa.z + bb.z) / 2,
        2.8,
        0.35,
        length,
      );
      m.rotation.y = Math.atan2(bb.x - aa.x, bb.z - aa.z);
    }
    regionConnections.forEach(([a, b]) => bridge(a, b));
    const portals: THREE.Object3D[] = [];
    regions.forEach((r, n) => {
      const radius = n === 0 ? 11 : 5.5,
        geo = new THREE.CylinderGeometry(radius, radius * 0.96, 0.6, 32);
      geometries.push(geo);
      const platform = mesh(geo, ivory, r.x * 100, -0.32, r.y * 100);
      platform.userData.region = n;
      pickable.push(platform);
      const under = new THREE.ConeGeometry(radius * 0.86, 5, 7);
      geometries.push(under);
      const low = mesh(under, edge, r.x * 100, -3.05, r.y * 100);
      low.rotation.z = Math.PI;
      const px = r.x * 100,
        pz = r.y * 100;
      if (n === 6 || n === 7 || n === 2) {
        const mat = n === 6 ? mats[5] : ivory;
        mesh(boxGeo, mat, px - 1.7, 2.1, pz - 2, 0.7, 4.2, 0.8);
        mesh(boxGeo, mat, px + 1.7, 2.1, pz - 2, 0.7, 4.2, 0.8);
        const top = mesh(boxGeo, mat, px, 4.25, pz - 2, 4.1, 0.7, 0.8);
        top.userData.region = n;
        pickable.push(top);
        portals.push(top);
      }
      if (n === 1 || n === 3 || n === 4) {
        for (let i = 0; i < 4; i++) {
          const m = mesh(
            boxGeo,
            mats[n === 1 ? 0 : n === 3 ? 2 : 5],
            px + (i % 2) * 1.7 - 1,
            1 + (i % 3) * 0.5,
            pz - 2 - Math.floor(i / 2) * 1.5,
            1.1,
            2 + (i % 3),
            1.1,
          );
          m.userData.region = n;
          pickable.push(m);
        }
      }
      if (n === 5) {
        const torus = new THREE.TorusGeometry(2.2, 0.13, 8, 48);
        geometries.push(torus);
        const ring = mesh(torus, mats[1], px, 2.7, pz - 2);
        ring.userData.region = n;
        pickable.push(ring);
        mesh(boxGeo, ivory, px, 1.25, pz - 2, 1.6, 2.5, 1.6);
        portals.push(ring);
      }
      if (n === 8) {
        for (let i = 0; i < 2; i++) {
          const pyramid = new THREE.ConeGeometry(1.6 - i * 0.4, 3.8 - i, 4);
          geometries.push(pyramid);
          mesh(pyramid, mats[1], px + i * 3 - 1, 1.9 - i * 0.5, pz - 2);
        }
      }
    });
    const bodyGeo = new THREE.BoxGeometry(0.72, 0.83, 0.64),
      coreGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3),
      eyeGeo = new THREE.SphereGeometry(0.045, 6, 4);
    geometries.push(bodyGeo, coreGeo, eyeGeo);
    const ink = new THREE.MeshBasicMaterial({ color: '#4e686e' });
    materials.push(ink);
    const actors = Array.from({ length: 50 }, (_, i) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, white);
      body.position.y = 0.62;
      body.userData.instance = i;
      const core = new THREE.Mesh(coreGeo, mats[i % 6]);
      core.position.set(0, 1.24, 0);
      g.add(body, core);
      for (const x of [-0.15, 0.15]) {
        const eye = new THREE.Mesh(eyeGeo, ink);
        eye.position.set(x, 0.72, -0.326);
        g.add(eye);
      }
      g.userData.instance = i;
      scene.add(g);
      pickable.push(body, core);
      return { g, core };
    });
    const links = Array.from({ length: 4 }, (_, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: skillColors[i],
        transparent: true,
        opacity: 0.7,
      });
      materials.push(mat);
      return mesh(boxGeo, mat, 0, 0.6, 0, 1, 0.13, 0.13);
    });
    const resultMat = new THREE.MeshBasicMaterial({ color: '#f4d780' });
    materials.push(resultMat);
    const result = mesh(boxGeo, resultMat, 0, 1.7, 0, 0.45, 0.45, 0.45);
    const eventGeo = new THREE.TorusGeometry(4.8, 0.045, 5, 48);
    geometries.push(eventGeo);
    const eventMat = new THREE.MeshBasicMaterial({ color: '#89b28a' });
    materials.push(eventMat);
    const eventRing = mesh(eventGeo, eventMat, 0, 0.08, 0);
    eventRing.rotation.x = -Math.PI / 2;
    const particles = Array.from({ length: 20 }, (_, i) =>
      mesh(coreGeo, i % 2 ? mats[0] : mats[1], 0, 1, 0, 0.4, 0.4, 0.4),
    );
    const keys = new Set<string>();
    let looking = false,
      lastX = 0,
      lastY = 0,
      dragDistance = 0;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,[role="dialog"]'))
        return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
        ].includes(e.key.toLowerCase())
      ) {
        keys.add(e.key.toLowerCase());
        e.preventDefault();
        setHint(false);
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const blur = () => {
      keys.clear();
      stick.current = { x: 0, y: 0 };
      looking = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const pointerDown = (e: PointerEvent) => {
      looking = true;
      dragDistance = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e: PointerEvent) => {
      if (!looking) return;
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      const w = latest.current.walker.current;
      w.yaw -= dx * 0.004;
      w.pitch = Math.max(-0.7, Math.min(0.6, w.pitch - dy * 0.003));
      lastX = e.clientX;
      lastY = e.clientY;
      setHint(false);
    };
    const pointerUp = (e: PointerEvent) => {
      looking = false;
      if (dragDistance > 8) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray
        .intersectObjects(pickable, false)
        .find((h) => h.distance < 30);
      if (hit) {
        const obj = hit.object;
        const instance = obj.userData.instance ?? obj.parent?.userData.instance;
        if (instance !== undefined) {
          const a = sampleAgents(
            latest.current.agents,
            latest.current.details,
            latest.current.time,
            latest.current.weather,
          )[instance];
          latest.current.onAgent(a.agentId);
        } else if (obj.userData.region !== undefined)
          latest.current.onRegion(obj.userData.region);
      }
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', blur);
    const onLost = (e: Event) => {
      e.preventDefault();
      setError('图形资源暂不可用，请返回观察世界。');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    const observer = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(host);
    let raf = 0,
      last = performance.now(),
      baseTime = -1,
      baseStamp = 0,
      elapsed = 0,
      frames = 0,
      level = 0,
      near = -1;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const frameSeconds = (now - last) / 1000;
      const dt = Math.min(0.05, frameSeconds);
      last = now;
      if (document.hidden) return;
      const p = latest.current,
        w = p.walker.current;
      let forward =
        (keys.has('w') || keys.has('arrowup') ? 1 : 0) -
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0) -
        stick.current.y;
      let strafe =
        (keys.has('d') || keys.has('arrowright') ? 1 : 0) -
        (keys.has('a') || keys.has('arrowleft') ? 1 : 0) +
        stick.current.x;
      const length = Math.max(1, Math.hypot(forward, strafe));
      forward /= length;
      strafe /= length;
      const dx =
          (-Math.sin(w.yaw) * forward + Math.cos(w.yaw) * strafe) * dt * 5,
        dz = (-Math.cos(w.yaw) * forward - Math.sin(w.yaw) * strafe) * dt * 5;
      if (canWalkAt(w.x + dx, w.z + dz)) {
        w.x += dx;
        w.z += dz;
      } else {
        if (canWalkAt(w.x + dx, w.z)) w.x += dx;
        if (canWalkAt(w.x, w.z + dz)) w.z += dz;
      }
      camera.position.set(w.x, 1.65, w.z);
      camera.rotation.set(w.pitch, w.yaw, 0, 'YXZ');
      const closest = regions.reduce(
        (a, r, i) =>
          Math.hypot(w.x - r.x * 100, w.z - r.y * 100) <
          Math.hypot(w.x - regions[a].x * 100, w.z - regions[a].y * 100)
            ? i
            : a,
        0,
      );
      if (closest !== near) {
        near = closest;
        setArea(near);
        p.onNear(near);
      }
      if (baseTime !== p.time) {
        baseTime = p.time;
        baseStamp = now;
      }
      const time =
          p.time +
          (p.paused ? 0 : Math.min(0.11, (now - baseStamp) / 1000) * p.speed),
        states = sampleAgents(p.agents, p.details, time, p.weather),
        phase = stageAt(time),
        progress = phaseProgress(time),
        center = regions[0];
      states.forEach((a, i) => {
        const actor = actors[i];
        actor.g.position.set(a.x * 100, 0, a.y * 100);
        actor.core.material = mats[a.role % 6];
        actor.g.rotation.y = Math.sin(i + time * 0.2) * 0.5;
        actor.g.visible =
          i < 4 ||
          level < 2 ||
          Math.hypot(a.x * 100 - w.x, a.y * 100 - w.z) < 18;
        actor.core.scale.setScalar(
          a.collaborator && phase === 4 && Math.floor(progress * 4) === i
            ? 1.5
            : 1,
        );
        if (a.collaborator)
          actor.g.scale.setScalar(phase >= 3 && phase <= 6 ? 1.1 : 1);
      });
      links.forEach((m, i) => {
        const a = states[i];
        m.visible = phase >= 2 && phase <= 7;
        const x = a.x * 100,
          z = a.y * 100,
          cx = center.x * 100,
          cz = center.y * 100;
        m.position.set((x + cx) / 2, 0.7, (z + cz) / 2);
        m.scale.set(0.15, 0.15, Math.hypot(x - cx, z - cz));
        m.rotation.y = Math.atan2(x - cx, z - cz);
      });
      result.visible = phase >= 3 && phase <= 6;
      result.position.set(center.x * 100, 1.5, center.y * 100);
      result.rotation.y = time * 0.8;
      if (phase === 5) {
        result.position.x += (regions[7].x - center.x) * 100 * progress;
        result.position.z += (regions[7].y - center.y) * 100 * progress;
      }
      particles.forEach((m, i) => {
        m.visible = level < 1;
        const source = regions[p.weather === 'resources' ? 8 : 7],
          dest = regions[p.weather === 'attack' ? 6 : 5];
        let u = (time * 0.18 + i / 20) % 1;
        if (p.weather === 'storm') u = 1 - u;
        m.position.set(
          (source.x + (dest.x - source.x) * u) * 100,
          0.7 + Math.sin(u * Math.PI) * 0.6,
          (source.y + (dest.y - source.y) * u) * 100,
        );
      });
      eventRing.visible = p.activeEventRegion !== undefined;
      if (p.activeEventRegion !== undefined) {
        const r = regions[p.activeEventRegion];
        eventRing.position.set(r.x * 100, 0.08, r.y * 100);
        eventRing.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
      }
      renderer.render(scene, camera);
      elapsed += frameSeconds;
      frames++;
      if (elapsed > 3) {
        const fps = frames / elapsed;
        if (fps < 32 && level < 2) {
          level++;
          renderer.setPixelRatio(level === 1 ? 1 : 0.8);
          setQuality(level === 1 ? '轻量' : '省电');
          scene.fog = new THREE.Fog('#c2e2e6', 15, level === 1 ? 65 : 45);
        }
        elapsed = 0;
        frames = 0;
      }
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', blur);
      canvas.removeEventListener('webglcontextlost', onLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);
  const joystick = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2,
      dy = e.clientY - r.top - r.height / 2,
      len = Math.max(36, Math.hypot(dx, dy));
    stick.current = { x: dx / len, y: dy / len };
    setKnob({ x: (dx / len) * 30, y: (dy / len) * 30 });
    setHint(false);
  };
  return (
    <div className="world-walk">
      <div ref={mount} className="walk-renderer" />
      {error ? (
        <div className="walk-fallback">
          <p>{error}</p>
          <button onClick={props.onExit}>
            <Globe2 size={16} />
            返回观察世界
          </button>
        </div>
      ) : (
        <>
          <div className="walk-reticle" />
          <div className="walk-location">
            <MapPin size={15} />
            {regions[area].name}
            <small>文明观察者 · {quality}画质</small>
          </div>
          {hint && (
            <div className="walk-instructions">
              <Navigation size={20} />
              <strong>走进世界</strong>
              <p>WASD 移动 · 拖动转向 · 点击角色或节点</p>
              <small>手机使用左侧摇杆，右侧拖动转向</small>
              <button onClick={() => setHint(false)}>开始探索</button>
            </div>
          )}
          <div
            className="walk-joystick"
            onPointerDown={joystick}
            onPointerMove={(e) => {
              if (e.buttons) joystick(e);
            }}
            onPointerUp={() => {
              stick.current = { x: 0, y: 0 };
              setKnob({ x: 0, y: 0 });
            }}
            onPointerCancel={() => {
              stick.current = { x: 0, y: 0 };
              setKnob({ x: 0, y: 0 });
            }}
            aria-label="移动摇杆"
          >
            <span style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}>
              <ArrowUp size={18} />
            </span>
          </div>
          <div className="walk-actions">
            <button
              onClick={() => {
                props.walker.current = {
                  x: regions[0].x * 100,
                  z: regions[0].y * 100 + 8,
                  yaw: 0,
                  pitch: 0,
                };
              }}
            >
              <RotateCcw size={15} />
              回到协作中心
            </button>
            <button onClick={props.onExit}>
              <Globe2 size={15} />
              观察世界
            </button>
          </div>
        </>
      )}
    </div>
  );
}
