'use client';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { environmentFor } from '@/lib/world-environment';
import type { WorldNews, NewsReaction } from '@/lib/world-news';
import type { MarketSignal } from '@/lib/civilization-model';
import { createWorldEffects } from '@/components/world-effects';
import { createWorldArchitecture } from '@/components/world-architecture';
import { createCryptoProps } from '@/components/crypto-props';
import { createAgentLabels } from '@/components/agent-labels';
import { createAvatarFactory } from '@/components/agent-avatar';
import { avatarMotion } from '@/lib/agent-design';
import { cryptoTaskState } from '@/lib/crypto-world';
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
  ignixIds: string[];
  details: Record<string, Detail>;
  time: number;
  paused: boolean;
  speed: number;
  weather: Weather;
  signal?: MarketSignal | null;
  news?: WorldNews | null;
  activeNews?: NewsReaction | null;
  walker: MutableRefObject<Walker>;
  onAgent: (id: string, instance: number) => void;
  inputBlocked?: boolean;
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
    scene.background = new THREE.Color('#DDE5F0');
    scene.fog = new THREE.Fog('#DDE5F0', 30, 115);
    const camera = new THREE.PerspectiveCamera(
      56,
      host.clientWidth / host.clientHeight,
      0.1,
      240,
    );
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight('#F4F7FF', '#AAB8CD', 1.65));
    const sun = new THREE.DirectionalLight('#FFF1D8', 2.1);
    sun.position.set(-20, 35, 20);
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#C4DEFF', 1.1);
    rim.position.set(15, 12, -25);
    scene.add(rim);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
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
    const architecture = createWorldArchitecture(scene, pickable);
    const coreGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    geometries.push(coreGeo);
    const cryptoProps = createCryptoProps(scene, pickable);
    const avatars = createAvatarFactory();
    const labels = createAgentLabels();
    const actors = Array.from({ length: 50 }, (_, i) => {
      const avatar = avatars.create(i);
      const label = labels.create(i);
      avatar.g.add(label.sprite, label.badge);
      scene.add(avatar.g);
      pickable.push(...avatar.pickable, label.sprite, label.badge);
      return { ...avatar, label, positioned: false };
    });
    const effects = createWorldEffects(scene);
    let disposed = false;
    const surfaceTexture = new THREE.TextureLoader().load(
      '/world-limestone.jpg',
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          4,
          renderer.capabilities.getMaxAnisotropy(),
        );
        architecture.setSurfaceMap(texture);
        cryptoProps.setSurfaceMap(texture);
      },
    );
    const panelTexture = new THREE.TextureLoader().load(
      '/world-panels.jpg',
      (t) => {
        if (disposed) {
          t.dispose();
          return;
        }
        avatars.setPanelAtlas(t);
      },
    );
    const skyTexture = new THREE.TextureLoader().load('/world-skyline.jpg');
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    const skyGeometry = new THREE.CylinderGeometry(108, 108, 164, 80, 1, true);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      color: '#F0F5FF',
    });
    const skyline = new THREE.Mesh(skyGeometry, skyMaterial);
    skyline.position.set(48, 35, 48);
    skyline.renderOrder = -10;
    scene.add(skyline);
    const skyColor = new THREE.Color(),
      fogColor = new THREE.Color();
    const walkable = (x: number, z: number) =>
      canWalkAt(x, z) && !cryptoProps.blocksPoint(x, z);
    const keys = new Set<string>();
    let looking = false,
      lastX = 0,
      lastY = 0,
      dragDistance = 0;
    const down = (e: KeyboardEvent) => {
      if (latest.current.inputBlocked) return;
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
      if (latest.current.inputBlocked) return;
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
      if (latest.current.inputBlocked) return;
      looking = false;
      if (dragDistance > 8) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(pickable, false).find((h) => {
        if (h.distance >= 30) return false;
        let object: THREE.Object3D | null = h.object;
        while (object) {
          if (!object.visible) return false;
          object = object.parent;
        }
        return true;
      });
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
          if (a) latest.current.onAgent(a.agentId, instance);
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
      if (p.inputBlocked) {
        forward = 0;
        strafe = 0;
        keys.clear();
        stick.current = { x: 0, y: 0 };
        looking = false;
      }
      const length = Math.max(1, Math.hypot(forward, strafe));
      forward /= length;
      strafe /= length;
      const dx =
          (-Math.sin(w.yaw) * forward + Math.cos(w.yaw) * strafe) * dt * 5,
        dz = (-Math.cos(w.yaw) * forward - Math.sin(w.yaw) * strafe) * dt * 5;
      if (walkable(w.x + dx, w.z + dz)) {
        w.x += dx;
        w.z += dz;
      } else {
        if (walkable(w.x + dx, w.z)) w.x += dx;
        if (walkable(w.x, w.z + dz)) w.z += dz;
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
      cryptoProps.update(time, level);
      actors.forEach((actor, i) => {
        if (i >= states.length) {
          actor.g.visible = false;
          actor.positioned = false;
        }
      });
      states.forEach((a, i) => {
        const actor = actors[i];
        const moveX = a.x * 100 - actor.g.position.x,
          moveZ = a.y * 100 - actor.g.position.z;
        const moving = actor.positioned && Math.hypot(moveX, moveZ) > 0.002;
        if (a.collaborator && phase >= 2 && phase <= 6)
          actor.g.rotation.y = Math.atan2(a.x - center.x, a.y - center.y);
        else if (moving) actor.g.rotation.y = Math.atan2(-moveX, -moveZ);
        else if (!actor.positioned) actor.g.rotation.y = i * 0.8;
        actor.positioned = true;
        actor.g.position.set(a.x * 100, 0, a.y * 100);
        const motion = avatarMotion(
          time,
          i,
          phase,
          progress,
          a.collaborator,
          moving,
        );
        actor.update(
          a.variant,
          time,
          motion,
          Math.hypot(a.x * 100 - w.x, a.y * 100 - w.z) < (level > 0 ? 12 : 22),
        );
        actor.g.visible =
          i < 4 ||
          level < 2 ||
          Math.hypot(a.x * 100 - w.x, a.y * 100 - w.z) < 18;
        actor.g.scale.setScalar(motion.composite ? 1.08 : 1);
        actor.label.update(
          a.name,
          Math.hypot(a.x * 100 - w.x, a.y * 100 - w.z),
          canvas.clientHeight,
          camera.fov,
          motion.composite,
          actor.g.visible,
          p.ignixIds.includes(a.agentId),
        );
      });
      const environment = environmentFor(p.weather, p.signal?.change ?? 0);
      skyColor.set(environment.sky);
      fogColor.set(environment.fog);
      skyMaterial.color.lerp(skyColor, dt * 1.2);
      (scene.background as THREE.Color).lerp(fogColor, dt * 1.2);
      if (scene.fog instanceof THREE.Fog)
        scene.fog.color.lerp(fogColor, dt * 1.2);
      sun.intensity += (environment.sun - sun.intensity) * dt * 1.2;
      renderer.toneMappingExposure +=
        (environment.exposure - renderer.toneMappingExposure) * dt * 1.2;
      architecture.update(
        time,
        phase,
        progress,
        states,
        level,
        environment.flow,
      );
      effects.update(
        time,
        phase,
        progress,
        states,
        camera,
        level,
        p.weather,
        p.activeEventRegion,
      );
      renderer.render(scene, camera);
      elapsed += frameSeconds;
      frames++;
      if (elapsed > 3) {
        const fps = frames / elapsed;
        if (fps < 32 && level < 2) {
          level++;
          renderer.setPixelRatio(level === 1 ? 1 : 0.8);
          setQuality(level === 1 ? '轻量' : '省电');
          scene.fog = new THREE.Fog('#DDE5F0', 15, level === 1 ? 65 : 45);
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
      disposed = true;
      surfaceTexture.dispose();
      panelTexture.dispose();
      skyTexture.dispose();
      skyGeometry.dispose();
      skyMaterial.dispose();
      effects.dispose();
      architecture.dispose();
      cryptoProps.dispose();
      avatars.dispose();
      labels.dispose();
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
          <div className="walk-signal-card">
            <span>
              BTC / USDT{' '}
              <small>
                {props.signal
                  ? props.signal.mode === 'fresh'
                    ? 'LIVE'
                    : '缓存'
                  : '暂无行情'}
              </small>
            </span>
            {props.signal && (
              <strong>
                {props.signal.last.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}
                <em className={props.signal.change < 0 ? 'negative' : ''}>
                  {props.signal.change >= 0 ? '+' : ''}
                  {props.signal.change.toFixed(2)}%
                </em>
              </strong>
            )}
            <p>24h 行情映射环境 · 世界响应为演示</p>
            {props.activeNews && (
              <a href={props.activeNews.url} target="_blank" rel="noreferrer">
                {props.activeNews.category} · {props.activeNews.title}
                <small>CoinDesk · 查看新闻来源 ↗</small>
              </a>
            )}
            {!props.activeNews && props.news?.items[0] && (
              <a
                href={props.news.items[0].url}
                target="_blank"
                rel="noreferrer"
              >
                {props.news.items[0].title}
                <small>
                  CoinDesk ·{' '}
                  {props.news.mode === 'stale' ? '缓存新闻' : '公开新闻'} ↗
                </small>
              </a>
            )}
          </div>
          <div className="walk-location">
            <MapPin size={15} />
            {regions[area].name}
            <span className="walk-task-action">
              {cryptoTaskState(area, props.time).label} · Demo
            </span>
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
