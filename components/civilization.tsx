'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe2,
  Focus,
  Users,
  Minus,
  Plus,
  Pause,
  Play,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Radio,
  Camera,
  RefreshCw,
  ArrowLeft,
  Maximize2,
  Info,
  Download,
  Network,
  Orbit,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AgentSprite } from '@/components/world-scene';
import CivilizationCanvas, { type Hit } from '@/components/civilization-canvas';
import snapshot from '@/lib/agents.json';
import detailsSnapshot from '@/lib/details.json';
import { appearance } from '@/lib/world-model';
import type { Agent, AgentData, Detail } from '@/lib/marketplace';
import {
  regions,
  weathers,
  stages,
  stageAt,
  phaseProgress,
  cycleDuration,
  regionFor,
  skillNames,
  skillColors,
  liveWeather,
  type Weather,
  type MarketSignal,
  type MemoryRecord,
} from '@/lib/civilization-model';
const details = detailsSnapshot as Record<string, Detail>;
const population = 600;
type CameraState = { x: number; y: number; z: number };
const initialCamera = { x: 0.5, y: 0.47, z: 1 };
export default function Civilization() {
  const [data, setData] = useState<AgentData>({
      ...snapshot,
      mode: 'snapshot',
    }),
    [refreshing, setRefreshing] = useState(false),
    [notice, setNotice] = useState('');
  const [time, setTime] = useState(0),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1),
    [episode, setEpisode] = useState(0);
  const [scenario, setScenario] = useState<Weather>('nvda'),
    [signalMode, setSignalMode] = useState<'demo' | 'live'>('demo'),
    [signal, setSignal] = useState<MarketSignal | null>(null),
    [signalError, setSignalError] = useState('');
  const [cam, setCam] = useState<CameraState>(initialCamera),
    [size, setSize] = useState({ w: 1440, h: 900 }),
    [dragging, setDragging] = useState(false);
  const [panel, setPanel] = useState<'directory' | 'agent' | 'region' | null>(
      null,
    ),
    [region, setRegion] = useState(0),
    [selected, setSelected] = useState<number | null>(null),
    [agentId, setAgentId] = useState('2083');
  const [history, setHistory] = useState<MemoryRecord[]>([]),
    [service, setService] = useState<Detail | null>(details['2083']),
    [serviceNotice, setServiceNotice] = useState('');
  const [eventOpen, setEventOpen] = useState(false),
    [help, setHelp] = useState(false),
    [photo, setPhoto] = useState(false),
    [photoConfigured, setPhotoConfigured] = useState(false),
    [photoBusy, setPhotoBusy] = useState(false),
    [photoUrl, setPhotoUrl] = useState(''),
    [photoError, setPhotoError] = useState(''),
    [photoUncertain, setPhotoUncertain] = useState(false);
  const viewport = useRef<HTMLDivElement>(null),
    hits = useRef<Hit[]>([]),
    pointers = useRef(new Map<number, { x: number; y: number }>()),
    gesture = useRef({
      x: 0,
      y: 0,
      cam: initialCamera,
      distance: 0,
      moved: false,
    }),
    recorded = useRef(new Set<string>());
  const fit = Math.min(size.w / 1600, (size.h - 105) / 900) * 1.03,
    scale = fit * cam.z;
  const weather =
    signalMode === 'live'
      ? signal
        ? liveWeather(signal.change)
        : 'calm'
      : scenario;
  const event = weathers[weather],
    stage = stageAt(time),
    phase = phaseProgress(time),
    cycle = Math.floor(time / cycleDuration);
  const agent =
    data.agents.find((a) => a.agentId === agentId) ?? data.agents[0];
  const team = ['2083', '8355', '9626', '8136'].map(
    (id, i) =>
      data.agents.find((a) => a.agentId === id) ??
      data.agents[i % data.agents.length],
  );
  const appearanceData = appearance(agent, service ?? undefined);
  const memories = history.filter((h) => h.agentIds.includes(agent.agentId));
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/agents?refresh=' + Date.now(), {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as AgentData;
      if (!d.agents?.length) throw new Error();
      setData(d);
      setNotice(
        d.mode === 'snapshot' ? '使用最近保存的真实资料' : '名录已核对',
      );
    } catch {
      setNotice('同步暂不可用，保留已保存资料');
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 1200000);
    return () => clearInterval(id);
  }, [refresh]);
  useEffect(() => {
    let canceled = false;
    async function read() {
      try {
        const r = await fetch('/api/world-signal', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const s = (await r.json()) as MarketSignal;
        if (!canceled) {
          setSignal(s);
          setSignalError('');
        }
      } catch {
        if (!canceled) setSignalError('现实行情暂不可用');
      }
    }
    void read();
    const id = setInterval(() => void read(), 60000);
    return () => {
      canceled = true;
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      if (!document.hidden) setTime((t) => t + dt * speed);
    }, 100);
    return () => clearInterval(id);
  }, [paused, speed]);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (stage < 7) return;
    const key = episode + ':' + cycle;
    if (recorded.current.has(key)) return;
    recorded.current.add(key);
    setHistory((h) =>
      [
        {
          cycle: recorded.current.size,
          agentIds: team.map((a) => a.agentId),
          weather,
          result:
            weather === 'nvda'
              ? 'NVDA 分析报告'
              : weather === 'attack'
                ? '风险审计结果'
                : '协作策略结果',
          reward: 10,
        },
        ...h,
      ].slice(0, 30),
    );
  }, [stage, cycle, episode, weather, team.map((a) => a.agentId).join(',')]);
  useEffect(() => {
    if (panel !== 'agent') return;
    const c = new AbortController();
    setService(details[agent.agentId] ?? null);
    setServiceNotice('正在核对服务');
    fetch('/api/agents/' + agent.agentId, { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Detail>;
      })
      .then((d) => {
        setService(d);
        setServiceNotice(
          d.mode === 'snapshot' ? '已保存服务资料' : '服务资料已核对',
        );
      })
      .catch(() => {
        if (!c.signal.aborted) setServiceNotice('同步暂不可用，保留已保存服务');
      });
    return () => c.abort();
  }, [agent.agentId, panel]);
  const selectAgent = useCallback(
    (a: Agent, instance?: number) => {
      setAgentId(a.agentId);
      setSelected(
        instance ?? data.agents.findIndex((v) => v.agentId === a.agentId),
      );
      setPanel('agent');
    },
    [data.agents],
  );
  const focusRegion = useCallback((n: number, showPanel = true) => {
    setRegion(n);
    setCam({ x: regions[n].x, y: regions[n].y, z: n === 0 ? 2.35 : 2.8 });
    if (showPanel) setPanel('region');
    else setPanel(null);
  }, []);
  const worldView = () => {
    setCam(initialCamera);
    setPanel(null);
  };
  const zoom = (delta: number) =>
    setCam((c) => ({ ...c, z: Math.max(1, Math.min(4.8, c.z + delta)) }));
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setCam((c) => ({
        ...c,
        z: Math.max(1, Math.min(4.8, c.z * Math.exp(-e.deltaY * 0.001))),
      }));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: { registerTool: (t: unknown, o: unknown) => void };
      }
    ).modelContext;
    if (!ctx) return;
    const c = new AbortController();
    ctx.registerTool(
      {
        name: 'select_agent',
        title: '查看 Agent 档案',
        description:
          '查看 OKX.AI 真实档案及明确标注的本次模拟记录；不执行交易。',
        inputSchema: {
          type: 'object',
          properties: { agentId: { type: 'string' } },
          required: ['agentId'],
          additionalProperties: false,
        },
        execute: async (input: { agentId: string }) => {
          const a = data.agents.find((a) => a.agentId === input.agentId);
          if (!a) throw new Error('Unknown Agent');
          selectAgent(a);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  agentId: a.agentId,
                  name: a.name,
                  behavior: 'simulation',
                }),
              },
            ],
          };
        },
      },
      { signal: c.signal },
    );
    return () => c.abort();
  }, [data.agents, selectAgent]);
  const startGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    viewport.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      cam: { ...cam },
      distance:
        pts.length === 2
          ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
          : 0,
      moved: false,
    };
    setDragging(true);
  };
  const moveGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current,
      pts = [...pointers.current.values()];
    if (pts.length === 2 && g.distance) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      g.moved = true;
      setCam({
        ...g.cam,
        z: Math.max(1, Math.min(4.8, (g.cam.z * d) / g.distance)),
      });
      return;
    }
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) g.moved = true;
    setCam({
      ...g.cam,
      x: Math.max(0.05, Math.min(0.95, g.cam.x - dx / (1600 * scale))),
      y: Math.max(0.08, Math.min(0.92, g.cam.y - dy / (900 * scale))),
    });
  };
  const endGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    setDragging(false);
    if (pointers.current.size === 1) {
      const p = [...pointers.current.values()][0];
      gesture.current = {
        x: p.x,
        y: p.y,
        cam: { ...cam },
        distance: 0,
        moved: true,
      };
      return;
    }
    if (!gesture.current.moved && pointers.current.size === 0) {
      const bounds = viewport.current!.getBoundingClientRect();
      const wx = (e.clientX - bounds.left - size.w / 2) / scale + cam.x * 1600,
        wy = (e.clientY - bounds.top - size.h * 0.52) / scale + cam.y * 900;
      const nearest = hits.current.reduce<{ hit: Hit | null; d: number }>(
        (v, h) => {
          const d = Math.hypot(h.x - wx, h.y - wy);
          return d < v.d ? { hit: h, d } : v;
        },
        { hit: null, d: 22 / scale },
      );
      if (nearest.hit) {
        const a = data.agents.find((a) => a.agentId === nearest.hit!.agentId);
        if (a) selectAgent(a, nearest.hit.instance);
      }
    }
  };
  const chooseWeather = (w: Weather) => {
    setSignalMode('demo');
    setScenario(w);
    setTime(0);
    setEpisode((e) => e + 1);
    setEventOpen(false);
  };
  useEffect(() => {
    if (!photo) return;
    fetch('/api/photographs')
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then((d) => setPhotoConfigured(Boolean(d.configured)))
      .catch(() => setPhotoConfigured(false));
  }, [photo]);
  const scene = {
    world: 'Agentverse',
    version: '0.2',
    source: data.source,
    sourceFetchedAt: data.fetchedAt,
    behavior: 'simulation_only',
    agent: { id: agent.agentId, name: agent.name },
    region: regions[region].name,
    stage: stages[stage].title,
    weather: {
      type: weather,
      mode: signalMode,
      signal: signalMode === 'live' ? signal : null,
    },
    camera: cam,
    team: team.map((a, i) => ({
      id: a.agentId,
      name: a.name,
      demonstrationRole: skillNames[i],
    })),
    population,
    memories: history,
    verifiedTransactions: [],
    prompt: `非人类数字文明的宏大等距场景，午夜蓝云海、象牙陶瓷功能平台、九个区域环绕中央协作核心。场景：${event.title}；节点：${regions[region].name}；动作：${stages[stage].title}。四个小型模块化 Agent 的蓝色研究、黄色风险、白色审计、绿色交易技能正在${stages[stage].title}。功能器官取代人类服装，柔和金色结果核心，真实层次和宏大空间。无文字、无界面、无城市建筑。行为演示，不表示真实任务或收益。`,
  };
  const sceneHref =
    'data:application/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(scene, null, 2));
  const generatePhoto = async () => {
    if (photoBusy || photoUncertain) return;
    setPhotoBusy(true);
    setPhotoError('');
    setPhotoUrl('');
    const requestId = crypto.randomUUID();
    try {
      const r = await fetch('/api/photographs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          agentId: agent.agentId,
          node: region,
          state:
            stage < 2
              ? 'idle'
              : stage < 5
                ? 'research'
                : stage < 7
                  ? 'execute'
                  : 'complete',
          world: 'civilization',
          stage,
          weather,
        }),
      });
      const d = (await r.json()) as {
        code?: string;
        url?: string;
        error?: string;
      };
      if (!r.ok) {
        if (d.code === 'uncertain' || d.code === 'already_requested') {
          setPhotoUncertain(true);
          setPhotoUrl(d.url ?? '');
        }
        throw new Error(d.error || '图片生成暂不可用');
      }
      setPhotoUrl(d.url ?? '');
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : '图片生成连接中断');
      if (e instanceof TypeError) {
        setPhotoUncertain(true);
        setPhotoUrl('/api/photographs/' + requestId);
      }
    } finally {
      setPhotoBusy(false);
    }
  };
  return (
    <main className="universe-shell">
      <div
        ref={viewport}
        className={'universe-viewport ' + (dragging ? 'is-dragging' : '')}
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          setDragging(false);
        }}
      >
        <div
          className="world-plane"
          style={{
            left: size.w / 2 - cam.x * 1600 * scale,
            top: size.h * 0.52 - cam.y * 900 * scale,
            transform: `scale(${scale})`,
          }}
        >
          <img
            className="civilization-art"
            src="/civilization.webp"
            alt="协作核心居中，九个功能区域悬浮在云海中的 Agent 文明"
            draggable={false}
          />
          <CivilizationCanvas
            agents={data.agents}
            details={details}
            time={time}
            weather={weather}
            selected={selected}
            zoom={cam.z}
            team={team}
            hits={hits}
            population={population}
          />
          {regions.map((r, i) => (
            <button
              key={r.name}
              className={
                'region-label ' + (region === i && cam.z > 1 ? 'selected' : '')
              }
              style={{
                left: r.x * 1600,
                top: r.y * 900 + (i === 0 ? 105 : i === 9 ? -42 : 64),
                transform: `translate(-50%,0) scale(${Math.max(0.55, Math.min(1.35, 1 / scale))})`,
              }}
              onClick={() => focusRegion(i)}
            >
              <i style={{ background: r.color }} />
              <span>
                {r.name}
                <small>{r.en}</small>
              </span>
              {i === 0 && <ChevronRight size={13} />}
            </button>
          ))}
        </div>
        <div className="universe-vignette" />
      </div>
      <header className="universe-header">
        <a className="universe-brand" href="/" aria-label="Agentverse 首页">
          <Orbit size={35} strokeWidth={1} />
          <span>
            AGENTVERSE<small>文明观察站 · 创世季</small>
          </span>
        </a>
        <nav aria-label="观察视角">
          <button className={cam.z <= 1.05 ? 'active' : ''} onClick={worldView}>
            <Globe2 size={16} />
            世界
          </button>
          <button
            className={region === 0 && cam.z > 1 ? 'active' : ''}
            onClick={() => focusRegion(0, false)}
          >
            <Focus size={16} />
            协作核心
          </button>
          <button
            className={panel === 'directory' ? 'active' : ''}
            onClick={() => setPanel('directory')}
          >
            <Users size={16} />
            Agent 档案
          </button>
        </nav>
        <button className="source-light" onClick={() => setHelp(true)}>
          <i />
          {paused ? '世界已暂停' : '世界运行中'}
          <Info size={14} />
        </button>
      </header>
      <aside
        className="world-weather"
        style={{ '--weather': event.color } as React.CSSProperties}
      >
        <button
          className="weather-eyebrow"
          onClick={() => setEventOpen(!eventOpen)}
        >
          <Radio size={13} />
          {signalMode === 'demo' ? '情景演示' : '现实信号'}
          <ChevronDown size={13} />
        </button>
        <h1>{event.title}</h1>
        <p>
          {signalMode === 'live'
            ? signal
              ? `BTC 24h ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%`
              : '等待行情信号'
            : event.event}
        </p>
        <button
          className="watch-event"
          onClick={() => focusRegion(event.region, false)}
        >
          观察正在发生的事 <ArrowUpRight size={14} />
        </button>
        {eventOpen && (
          <div className="event-picker">
            <div className="event-picker-head">
              世界的天气
              <button
                aria-label="关闭情景选择"
                onClick={() => setEventOpen(false)}
              >
                <X size={15} />
              </button>
            </div>
            {(Object.keys(weathers) as Weather[])
              .filter((w) => w !== 'calm')
              .map((w) => (
                <button
                  key={w}
                  className={
                    signalMode === 'demo' && scenario === w ? 'chosen' : ''
                  }
                  onClick={() => chooseWeather(w)}
                >
                  <i style={{ background: weathers[w].color }} />
                  <span>
                    {weathers[w].title}
                    <small>{weathers[w].event}</small>
                  </span>
                </button>
              ))}
            <button
              className="live-choice"
              onClick={() => {
                setSignalMode('live');
                setEventOpen(false);
              }}
            >
              <Radio size={16} />
              <span>
                跟随真实 BTC 行情<small>价格变化映射为世界天气</small>
              </span>
            </button>
          </div>
        )}
      </aside>
      <div className="world-summary">
        <span>
          <strong>{population}</strong> 演示 Agent
        </span>
        <span>
          <strong>{data.agents.length}</strong> 真实档案
        </span>
        <span>
          <strong>{history.length}</strong> 本次协作成果
        </span>
      </div>
      <div className="collaboration-dock">
        <button className="dock-title" onClick={() => focusRegion(0, false)}>
          <span className="dock-symbol">
            <Network size={20} />
          </span>
          <span>
            <small>协作核心 · {paused ? '演示已暂停' : '演示进行中'}</small>
            <strong>{stages[stage].title}</strong>
          </span>
          <ArrowUpRight size={16} />
        </button>
        <div className="stage-track" aria-label="协作阶段">
          {stages.map((s, i) => (
            <button
              key={s.title}
              aria-label={`观察${s.title}`}
              aria-current={stage === i ? 'step' : undefined}
              className={stage === i ? 'current' : stage > i ? 'past' : ''}
              onClick={() => setTime(cycle * 80 + s.start + 0.15)}
            >
              <span>{i + 1}</span>
              <small>{s.short}</small>
            </button>
          ))}
        </div>
        <p className="stage-explanation">
          {stage === 4
            ? `${skillNames[Math.min(3, Math.floor(((time % 80) - 32) / 4))]}模块正在工作`
            : stages[stage].note}
        </p>
        <div className="phase-line">
          <span style={{ width: `${((stage + phase) / 9) * 100}%` }} />
        </div>
      </div>
      <div className="world-caption">
        <span>
          <Sparkles size={14} />
          真实名录 · 文明行为演示
        </span>
        <p>
          {signalMode === 'live'
            ? signal
              ? `${signal.mode === 'stale' ? '行情已过期 · ' : ''}OKX · ${new Date(signal.ts).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' })} 更新`
              : signalError || '正在读取现实行情'
            : '拖动探索 · 滚轮或双指缩放'}
        </p>
      </div>
      <div className="world-controls">
        <button
          onClick={() => setPaused(!paused)}
          aria-label={paused ? '继续世界' : '暂停世界'}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button
          className="speed-button"
          onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
          aria-label="切换演示速度"
        >
          {speed}×
        </button>
        <b />
        <button onClick={() => zoom(-0.5)} aria-label="缩小">
          <Minus size={18} />
        </button>
        <span>{cam.z < 1.5 ? '世界' : cam.z < 3 ? '区域' : 'Agent'}视角</span>
        <button onClick={() => zoom(0.5)} aria-label="放大">
          <Plus size={18} />
        </button>
        <button onClick={worldView} aria-label="回到全域">
          <Maximize2 size={16} />
        </button>
        <b />
        <button
          onClick={() => {
            setPaused(true);
            setPhoto(true);
          }}
          aria-label="场景摄影"
        >
          <Camera size={17} />
        </button>
      </div>
      <button className="ecology-note" onClick={() => setHelp(true)}>
        第 {cycle + 1} 次循环 <span>·</span> 文明仍在生长{' '}
        <ChevronRight size={13} />
      </button>
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        modal={false}
      >
        <SheetContent className="civilization-sheet">
          {panel === 'directory' ? (
            <>
              <SheetTitle>世界里的 Agent</SheetTitle>
              <SheetDescription>
                公开资料来自 OKX.AI；世界中展示的是它们的演示分身。
              </SheetDescription>
              <div className="catalog-status">
                <span>
                  {data.mode === 'snapshot'
                    ? '已保存的真实资料'
                    : '近期核对的真实资料'}
                </span>
                <button
                  disabled={refreshing}
                  onClick={() => void refresh()}
                  aria-label="同步名录"
                >
                  <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                </button>
              </div>
              <small className="subtle">
                {notice ||
                  new Date(data.fetchedAt).toLocaleString('zh-CN', {
                    timeZone: 'Asia/Shanghai',
                  })}
              </small>
              <div className="civilization-directory">
                {data.agents.map((a) => (
                  <button key={a.agentId} onClick={() => selectAgent(a)}>
                    <AgentSprite
                      role={appearance(a, details[a.agentId]).role}
                    />
                    <span>
                      <strong>{a.name}</strong>
                      <small>
                        {a.categoryName.join(' · ')} · {a.score || '暂无'}评分
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            </>
          ) : panel === 'region' ? (
            <>
              <SheetTitle>{regions[region].name}</SheetTitle>
              <SheetDescription>{regions[region].description}</SheetDescription>
              <div className="region-profile-label">{regions[region].en}</div>
              {region === 0 ? (
                <>
                  <h3>本次协作</h3>
                  <p>{stages[stage].note}</p>
                  <div className="team-list">
                    {team.map((a, i) => (
                      <button key={a.agentId} onClick={() => selectAgent(a)}>
                        <i style={{ background: skillColors[i] }} />
                        <span>
                          {skillNames[i]}能力<small>{a.name}</small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                  <p className="simulation-note">
                    能力分工和协作关系均为场景演示，不是这些服务的真实任务记录。
                  </p>
                  <h3>结果核心</h3>
                  <div className="result-list">
                    {history.length ? (
                      history.slice(0, 4).map((h) => (
                        <div key={h.cycle}>
                          <Sparkles size={17} />
                          <span>
                            {h.result}
                            <small>
                              协作 #{h.cycle} · 演示奖励 {h.reward} USDT
                            </small>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p>首轮成果将在本次协作完成后出现。</p>
                    )}
                  </div>
                  <button
                    className="observer-button"
                    onClick={() => {
                      setPanel(null);
                      setTime(cycle * 80);
                      setPaused(false);
                    }}
                  >
                    <Play size={15} />
                    从头观察协作
                  </button>
                </>
              ) : (
                <>
                  <h3>这个区域的 Agent</h3>
                  <div className="civilization-directory">
                    {data.agents
                      .filter(
                        (a) => regionFor(a, details[a.agentId]) === region,
                      )
                      .map((a) => (
                        <button key={a.agentId} onClick={() => selectAgent(a)}>
                          <AgentSprite
                            role={appearance(a, details[a.agentId]).role}
                          />
                          <span>
                            <strong>{a.name}</strong>
                            <small>{a.categoryName[0]}</small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                  </div>
                  {!data.agents.some(
                    (a) => regionFor(a, details[a.agentId]) === region,
                  ) && (
                    <p className="simulation-note">
                      这是供 Agent
                      使用的基础设施区域，当前公开名录没有常驻档案。
                    </p>
                  )}
                  <h3>世界状态</h3>
                  <p>{event.note}</p>
                  {region === 7 && (
                    <>
                      <h3>现实资产的空间映射</h3>
                      <div className="asset-concepts">
                        <span>NVDA · 股权核心</span>
                        <span>黄金 · 稳定资产核心</span>
                        <span>国债 · 低波动模块</span>
                        <span>能源 · 能量晶体</span>
                        <span>算力 · 计算资源</span>
                      </div>
                      <p className="simulation-note">
                        这些节点展示资产形态的概念映射，不代表持有资产、实时估值或已经完成代币化。
                      </p>
                    </>
                  )}
                  {region === 8 && (
                    <p className="simulation-note">
                      资源循环展示 Agent
                      收益如何换取现实能源和设备，再返回为算力；不是已执行的采购。
                    </p>
                  )}
                  <button
                    className="observer-button"
                    onClick={() => {
                      setPanel(null);
                      setEventOpen(true);
                    }}
                  >
                    切换世界天气
                    <ChevronRight size={15} />
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                className="back-catalog"
                onClick={() => setPanel('directory')}
              >
                <ArrowLeft size={14} />
                全部档案
              </button>
              <SheetTitle>{agent.name}</SheetTitle>
              <SheetDescription>
                {agent.categoryName.join(' · ')} · OKX.AI #{agent.agentId}
              </SheetDescription>
              <div className="agent-portrait">
                <AgentSprite role={appearanceData.role} />
                <span>
                  {selected !== null && selected < 0
                    ? '协作核心 · 演示角色'
                    : '演示分身 #' +
                      String((selected ?? 0) + 1).padStart(3, '0')}
                  <small>
                    公开信誉 {agent.score || '暂无评分'} · 本次成长{' '}
                    {memories.length} 次
                  </small>
                </span>
              </div>
              <Tabs defaultValue="identity" className="profile-tabs">
                <TabsList>
                  <TabsTrigger value="identity">真实档案</TabsTrigger>
                  <TabsTrigger value="activity">协作与成长</TabsTrigger>
                  <TabsTrigger value="services">服务</TabsTrigger>
                </TabsList>
                <TabsContent value="identity">
                  <p className="real-description">{agent.description}</p>
                  <div className="ability-chips">
                    {appearanceData.modules.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                  <dl className="real-metrics">
                    <div>
                      <dt>公开评分</dt>
                      <dd>{agent.score || '—'}</dd>
                    </div>
                    <div>
                      <dt>总已售</dt>
                      <dd>{agent.usageCount.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>好评率</dt>
                      <dd>{agent.approvalRate || '—'}</dd>
                    </div>
                  </dl>
                  <p className="subtle">
                    市场列表起价 {agent.startingPrice} {agent.symbol} /{' '}
                    {agent.priceInterval || '次'}
                  </p>
                  <p className="subtle">
                    资料时间{' '}
                    {new Date(data.fetchedAt).toLocaleString('zh-CN', {
                      timeZone: 'Asia/Shanghai',
                    })}
                  </p>
                </TabsContent>
                <TabsContent value="activity">
                  <p className="simulation-note">
                    以下为本次世界演示产生的记录，不是实际合作、收入或技能认证。
                  </p>
                  <h3>
                    {team.some((a) => a.agentId === agent.agentId)
                      ? stages[stage].title
                      : '在' +
                        regions[regionFor(agent, service ?? undefined)].name +
                        '活动'}
                  </h3>
                  <div className="skill-growth">
                    {skillNames.map((name, i) => (
                      <div key={name}>
                        <i style={{ background: skillColors[i] }} />
                        <span>{name}</span>
                        <div>
                          <span
                            style={{
                              width: `${Math.min(100, 22 + memories.length * 12 + (i === 0 ? 15 : 0))}%`,
                              background: skillColors[i],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <h3>本次协作伙伴</h3>
                  <div className="partner-list">
                    {(team.some((a) => a.agentId === agent.agentId) ? team : [])
                      .filter((a) => a.agentId !== agent.agentId)
                      .map((a) => (
                        <button key={a.agentId} onClick={() => selectAgent(a)}>
                          {a.name}
                          <ArrowUpRight size={12} />
                        </button>
                      ))}
                  </div>
                  <h3>记忆</h3>
                  {memories.length ? (
                    memories.map((h) => (
                      <div className="memory-record" key={h.cycle}>
                        <strong>{h.result}</strong>
                        <p>协作 #{h.cycle} · 技能经验 +1</p>
                        <small>演示分配 {(h.reward / 4).toFixed(1)} USDT</small>
                      </div>
                    ))
                  ) : (
                    <p className="subtle">
                      完成协作后，结果与成长会留在本次观察中。
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="services">
                  <p className="subtle">
                    {serviceNotice} · 已载入 {service?.services.length ?? 0} /{' '}
                    {service?.total ?? 0}
                  </p>
                  {service?.services.map((s) => (
                    <div className="actual-service" key={s.serviceId}>
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <strong>
                        {s.price} {s.symbol}
                        {s.priceInterval ? ' / ' + s.priceInterval : ''}
                      </strong>
                    </div>
                  ))}
                  {!service && <p>服务暂不可用，可打开原始页面。</p>}
                </TabsContent>
              </Tabs>
              <a
                className="observer-button"
                href={'https://www.okx.ai/zh-hans/agents/' + agent.agentId}
                target="_blank"
                rel="noreferrer"
              >
                查看 OKX.AI 原始服务
                <ArrowUpRight size={16} />
              </a>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="observer-dialog">
          <DialogTitle>观察一个正在运行的世界</DialogTitle>
          <DialogDescription>
            远处看生态，中景看协作，近处认识一个 Agent。
          </DialogDescription>
          <div className="help-steps">
            <p>
              <strong>世界视角</strong>
              拖动地图，或选择区域。滚轮、双指和下方按钮都可以缩放。
            </p>
            <p>
              <strong>协作核心</strong>
              一次完整循环包含能力请求、吸附合体、工作、交付、结算、拆分和成长。
            </p>
            <p>
              <strong>现实与演示</strong>20 个档案来自 OKX.AI。600
              个活动角色是演示分身，协作和收益均为模拟。现实模式读取 BTC
              行情；其他事件是可切换的假设情景。
            </p>
            <p>
              <strong>文明成长</strong>
              完成一次协作，结果进入本次观察的记忆，新连接与技能随循环出现。刷新页面会重置模拟进程。
            </p>
          </div>
          <a
            href="https://www.okx.ai/zh-hans/agents"
            target="_blank"
            rel="noreferrer"
            className="observer-button"
          >
            查看真实名录
            <ArrowUpRight size={15} />
          </a>
        </DialogContent>
      </Dialog>
      <Dialog open={photo} onOpenChange={setPhoto}>
        <DialogContent className="observer-dialog photo-dialog">
          <DialogTitle>留住文明的这一刻</DialogTitle>
          <DialogDescription>
            {regions[region].name} · {event.title} · {stages[stage].title}
          </DialogDescription>
          <img
            src={photoUrl && !photoUncertain ? photoUrl : '/civilization.webp'}
            alt={photoUrl ? '生成的纪念图' : '世界视觉参考'}
          />
          <p className="subtle">
            按当前角色、协作阶段、天气和观察视角生成场景描述。
          </p>
          <a
            className="observer-button"
            href={sceneHref}
            download={'agentverse-civilization-' + agent.agentId + '.json'}
          >
            <Download size={15} />
            导出场景描述
          </a>
          <button
            className="observer-button"
            disabled={!photoConfigured || photoBusy || photoUncertain}
            onClick={() => void generatePhoto()}
          >
            <Camera size={15} />
            {photoBusy ? '正在生成…' : '生成高清纪念图'}
          </button>
          {photoError && (
            <p role="alert" className="simulation-note">
              {photoError}
            </p>
          )}
          {photoUrl && (
            <a
              href={photoUrl}
              download={!photoUncertain}
              className="observer-button"
            >
              {photoUncertain ? '查看已提交结果' : '下载纪念图'}
            </a>
          )}
          <p className="subtle">
            {photoConfigured
              ? '每次生成一张，使用已配置图片服务的额度。'
              : '尚未配置图片生成服务。场景描述仍可导出。'}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
