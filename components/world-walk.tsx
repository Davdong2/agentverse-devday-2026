'use client';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { environmentFor } from '@/lib/world-environment';
import type { WorldNews, NewsReaction } from '@/lib/world-news';
import type { MarketSignal } from '@/lib/civilization-model';
import { createWorldEffects } from '@/components/world-effects';
import { createWorldArchitecture } from '@/components/world-architecture';
import { createAgentEconomy } from '@/components/world-agent-economy';
import { createInteriorCity } from '@/components/world-interior-city';
import { createCryptoProps } from '@/components/crypto-props';
import { createAgentLabels } from '@/components/agent-labels';
import { createAvatarFactory } from '@/components/agent-avatar';
import { avatarMotion } from '@/lib/agent-design';
import { cryptoTaskState } from '@/lib/crypto-world';
import { ArrowUp, ChevronDown, Globe2, MapPin, RotateCcw } from 'lucide-react';
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
    [knob, setKnob] = useState({ x: 0, y: 0 });
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111821');
    scene.fog = new THREE.Fog('#3A3436', 36, 125);
    const camera = new THREE.PerspectiveCamera(
      56,
      host.clientWidth / host.clientHeight,
      0.1,
      240,
    );
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight('#DDF2FF', '#68452F', 1.08));
    const sun = new THREE.DirectionalLight('#FFD9B3', 2.28);
    sun.position.set(-20, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 768 : 1536, mobile ? 768 : 1536);
    Object.assign(sun.shadow.camera, {
      left: -23,
      right: 23,
      top: 23,
      bottom: -23,
      near: 1,
      far: 95,
    });
    sun.shadow.bias = -0.00015;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 2;
    scene.add(sun, sun.target);
    const rim = new THREE.DirectionalLight('#7BDFFF', 0.96);
    rim.position.set(15, 12, -25);
    scene.add(rim);
    const cityGlow = new THREE.PointLight('#79DFFF', 3.4, 34, 2);
    cityGlow.position.set(regions[0].x * 100, 8, regions[0].y * 100 - 5);
    scene.add(cityGlow);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const pickable: THREE.Object3D[] = [];
    const architecture = createWorldArchitecture(scene, pickable);
    const interiorCity = createInteriorCity(scene);
    const economy = createAgentEconomy(scene);
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
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const m = object.material;
      if (
        !Array.isArray(m) &&
        (m instanceof THREE.MeshPhongMaterial ||
          m instanceof THREE.MeshLambertMaterial) &&
        !m.transparent
      ) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = boardCanvas.height = 512;
    const boardContext = boardCanvas.getContext('2d');
    if (boardContext) {
      boardContext.fillStyle = '#152523';
      boardContext.fillRect(0, 0, 512, 512);
      boardContext.strokeStyle = '#3B9B92';
      boardContext.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const p = 14 + ((i * 37) % 480),
          q = 14 + ((i * 83) % 480);
        boardContext.beginPath();
        boardContext.moveTo(0, p);
        boardContext.lineTo(q, p);
        boardContext.lineTo(q, 512);
        boardContext.stroke();
      }
      boardContext.fillStyle = '#B89259';
      for (let i = 0; i < 34; i++) {
        const x = 12 + ((i * 71) % 488),
          y = 12 + ((i * 109) % 488);
        boardContext.fillRect(x, y, 5, 5);
      }
    }
    const surfaceTexture = new THREE.CanvasTexture(boardCanvas);
    surfaceTexture.wrapS = surfaceTexture.wrapT = THREE.RepeatWrapping;
    surfaceTexture.repeat.set(2.2, 2.2);
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    );
    architecture.setSurfaceMap(surfaceTexture);
    cryptoProps.setSurfaceMap(surfaceTexture);
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
      near = -1,
      shadowStamp = 0,
      slowWindows = 0,
      fastWindows = 0;
    const warmedAt = performance.now() + 6000;
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
      cryptoProps.setMarketSignal(p.signal);
      cryptoProps.update(time, level);
      economy.setData(p.agents.length, p.ignixIds.length, p.signal);
      economy.update(time, level);
      interiorCity.setSignal(p.signal);
      interiorCity.setNews(p.news);
      interiorCity.update(time, level);
      cityGlow.visible = level < 2;
      cityGlow.intensity = level === 0 ? 3.4 : 1.8;
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
      // One bounded sunlight map, refreshed at 12 Hz instead of every frame.
      if (level < 2 && now - shadowStamp > (level ? 160 : 80)) {
        sun.position.set(w.x - 17, 30, w.z + 18);
        sun.target.position.set(w.x, 0, w.z);
        sun.target.updateMatrixWorld();
        renderer.shadowMap.needsUpdate = true;
        shadowStamp = now;
      }
      renderer.render(scene, camera);
      elapsed += frameSeconds;
      frames++;
      if (elapsed > 3) {
        const fps = frames / elapsed;
        if (now > warmedAt) {
          slowWindows = fps < 30 ? slowWindows + 1 : 0;
          fastWindows = fps > 55 ? fastWindows + 1 : 0;
          const nextLevel =
            slowWindows >= 2
              ? Math.min(2, level + 1)
              : fastWindows >= 3
                ? Math.max(0, level - 1)
                : level;
          if (nextLevel !== level) {
            level = nextLevel;
            slowWindows = fastWindows = 0;
            renderer.setPixelRatio(
              level === 0
                ? Math.min(devicePixelRatio, mobile ? 1.3 : 1.8)
                : level === 1
                  ? 1
                  : 0.8,
            );
            renderer.shadowMap.enabled = level < 2;
            setQuality(['标准', '轻量', '省电'][level]);
            scene.fog = new THREE.Fog(
              fogColor,
              level ? 15 : 30,
              level === 0 ? 115 : level === 1 ? 65 : 45,
            );
          }
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
      surfaceTexture.dispose();
      effects.dispose();
      architecture.dispose();
      interiorCity.dispose();
      economy.dispose();
      cryptoProps.dispose();
      avatars.dispose();
      labels.dispose();
      sun.shadow.dispose();
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
          <details className="walk-signal-card">
            <summary aria-label="查看行情与新闻">
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
              <ChevronDown className="signal-chevron" size={14} />
            </summary>
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
          </details>
          <div className="walk-location">
            <MapPin size={15} />
            主板层 · {regions[area].name}
            <span className="walk-task-action">
              {cryptoTaskState(area, props.time).label} · Demo
            </span>
            <small>GPU 内部 · 文明观察者 · {quality}画质</small>
          </div>
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
              aria-label="回到协作中心"
              title="回到协作中心"
              onClick={() => {
                props.walker.current = {
                  x: regions[0].x * 100,
                  z: regions[0].y * 100 + 9.7,
                  yaw: 0,
                  pitch: 0.08,
                };
              }}
            >
              <RotateCcw size={15} />
              <span>回到协作中心</span>
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
