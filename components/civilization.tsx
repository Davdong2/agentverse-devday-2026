'use client';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorld } from '@/components/world-provider';
const WorldWalk = lazy(() => import('@/components/world-walk'));
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
  Route,
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
  Search,
  Database,
  Cpu,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Link2,
  Zap,
  CirclePlus,
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
import { IgnixBadge } from '@/components/ignix-profile';
import AgentDossier from '@/components/agent-dossier';
import { AgentSprite } from '@/components/world-scene';
import CivilizationCanvas, { type Hit } from '@/components/civilization-canvas';
import HomeWorldEffects from '@/components/home-world-effects';
import snapshot from '@/lib/agents.json';
import detailsSnapshot from '@/lib/details.json';
import { cryptoTaskState } from '@/lib/crypto-world';
import {
  agentVariant,
  agentDesigns,
  teamVariants,
  pickAvatar,
} from '@/lib/agent-design';
import { appearance } from '@/lib/world-model';
import {
  buildRelationshipGraph,
  createRelationshipLog,
  relationshipCsv,
  relationshipExport,
} from '@/lib/agent-relationships';
import type { Agent, AgentData, Detail } from '@/lib/marketplace';
import {
  regionSlugs,
  sampleAgents,
  worldRoster,
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
type CameraState = { x: number; y: number; z: number };
const initialCamera = { x: 0.5, y: 0.47, z: 1 };
const regionCamera = { x: 0.5, y: 0.5, z: 1 };
const homeRegionPositions = [
  { x: 0.49, y: 0.52 },
  { x: 0.23, y: 0.73 },
  { x: 0.2, y: 0.48 },
  { x: 0.49, y: 0.78 },
  { x: 0.75, y: 0.72 },
  { x: 0.82, y: 0.47 },
  { x: 0.65, y: 0.36 },
  { x: 0.9, y: 0.64 },
  { x: 0.34, y: 0.35 },
  { x: 0.1, y: 0.62 },
];
const homeRegionIcons = [
  Network,
  Search,
  CirclePlus,
  Database,
  Cpu,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Link2,
  Zap,
  Orbit,
];
const homeRegionSubtitles = [
  '能力汇聚 · 结果生成',
  '发现机会 · 深度分析',
  '创建智能体 · 组合能力',
  '任务结果 · 经验沉淀',
  'GPU 集群 · 模型推理',
  '流动性 · 资产交换',
  '风险监控 · 权限审计',
  '接入地球 · 返回结果',
  '能源转化 · 算力供给',
  '新节点 · 更多可能',
];
export default function Civilization({
  regionIndex,
  profileId,
}: { regionIndex?: number; profileId?: string } = {}) {
  const router = useRouter();
  const {
    data,
    ignix,
    news,
    newsReaction,
    setData,
    time,
    setTime,
    paused,
    setPaused,
    speed,
    setSpeed,
    episode,
    setEpisode,
    scenario,
    setScenario,
    signalMode,
    setSignalMode,
    signal,
    setSignal,
    signalError,
    setSignalError,
    history,
    setHistory,
    recorded,
    events,
    setEvents,
    relationshipLogs,
    setRelationshipLogs,
    relationshipReady,
    viewMode,
    setViewMode,
    walker,
    inspected,
    lastCatalog,
    lastMarket,
    activeMission,
    missionReady,
    clearActiveMission,
  } = useWorld();
  const [refreshing, setRefreshing] = useState(false),
    [notice, setNotice] = useState(''),
    [transitioning, setTransitioning] = useState(false),
    [walkRegion, setWalkRegion] = useState(regionIndex ?? 0);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    },
    [],
  );
  const [cam, setCam] = useState<CameraState>(
      regionIndex !== undefined ? regionCamera : initialCamera,
    ),
    [size, setSize] = useState({ w: 1440, h: 900 }),
    [dragging, setDragging] = useState(false);
  const [panel, setPanel] = useState<
      'directory' | 'agent' | 'region' | 'relationships' | null
    >(profileId ? 'agent' : null),
    [region, setRegion] = useState(regionIndex ?? 0),
    [selected, setSelected] = useState<number | null>(null),
    [agentId, setAgentId] = useState(profileId ?? '2083');
  const [service, setService] = useState<Detail | null>(
      details[profileId ?? '2083'],
    ),
    [serviceNotice, setServiceNotice] = useState('');
  const [eventOpen, setEventOpen] = useState(false),
    [missionDetailsOpen, setMissionDetailsOpen] = useState(false),
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
    });
  const homeView = regionIndex === undefined && viewMode === 'observe';
  const fit = homeView
      ? Math.max(size.w / 1600, size.h / 900)
      : regionIndex !== undefined
        ? Math.max(size.w / 1600, (size.h - 105) / 900) * 0.98
        : Math.min(size.w / 1600, (size.h - 105) / 900) * 1.03,
    scale = fit * cam.z;
  const activeNews =
    signalMode === 'live' && newsReaction && newsReaction.until > Date.now()
      ? newsReaction
      : null;
  const weather =
    activeNews?.weather ??
    (signalMode === 'live'
      ? signal
        ? liveWeather(signal.change)
        : 'calm'
      : scenario);
  const event = weathers[weather],
    stage = stageAt(time),
    phase = phaseProgress(time),
    cycle = Math.floor(time / cycleDuration);
  const agent =
    data.agents.find((a) => a.agentId === agentId) ?? data.agents[0];
  const missionAgentIds =
    activeMission?.steps.map((step) => step.agentId) ?? [];
  const missionAgentKey = missionAgentIds.join(',');
  const dataAgentKey = data.agents.map((item) => item.agentId).join(',');
  const activeMissionId = activeMission?.requestId ?? '';
  const activeMissionGoal = activeMission?.goal ?? '';
  const roster = worldRoster(data.agents, 50, missionAgentIds);
  const population = roster.length;
  const team = missionAgentIds.length
    ? roster
        .filter((item) => missionAgentIds.includes(item.agentId))
        .slice(0, 4)
    : roster.slice(0, 4);
  const missionAgents = missionAgentIds
    .map((id) => data.agents.find((item) => item.agentId === id))
    .filter((item): item is Agent => Boolean(item));
  const activeMissionStep = activeMission
    ? Math.min(
        activeMission.steps.length - 1,
        Math.floor(
          ((stage + phase) / stages.length) * activeMission.steps.length,
        ),
      )
    : -1;
  const relationshipGraph = useMemo(
    () => buildRelationshipGraph(relationshipLogs),
    [relationshipLogs],
  );
  const latestChemistry = relationshipLogs[0];
  const appearanceData = appearance(agent, service ?? undefined);
  const teamIndex = team.findIndex((a) => a.agentId === agent.agentId);
  const regionTask = cryptoTaskState(region, time);
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
      if (d.mode !== 'snapshot') {
        const prev = lastCatalog.current;
        const now = Date.now();
        const changes = d.agents.flatMap((a) => {
          const old = prev.agents.find((v) => v.agentId === a.agentId);
          return !old
            ? [
                {
                  id: 'new-' + a.agentId + '-' + now,
                  title: a.name + ' 出现在本次同步名录',
                  region: regionFor(a),
                  mode:
                    d.mode === 'fresh' ? ('LIVE' as const) : ('缓存' as const),
                  at: now,
                },
              ]
            : a.usageCount > old.usageCount
              ? [
                  {
                    id: 'sales-' + a.agentId + '-' + now,
                    title:
                      a.name +
                      ' 的公开销量增加 ' +
                      (a.usageCount - old.usageCount),
                    region: regionFor(a),
                    mode:
                      d.mode === 'fresh'
                        ? ('LIVE' as const)
                        : ('缓存' as const),
                    at: now,
                  },
                ]
              : [];
        });
        if (changes.length)
          setEvents((old) => [...changes, ...old].slice(0, 8));
        lastCatalog.current = d;
      }
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
          if (s.mode === 'fresh' && lastMarket.current !== s.ts) {
            setEvents((old) =>
              [
                {
                  id: 'market-' + s.ts,
                  title: `BTC 行情进入交易市场 · 24h ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%`,
                  region: 5,
                  mode: 'LIVE' as const,
                  at: Date.now(),
                },
                ...old.filter((e) => !e.id.startsWith('market-')),
              ].slice(0, 8),
            );
            lastMarket.current = s.ts;
            if (Math.abs(s.change) >= 2) setSignalMode('live');
          }
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
    if (time === 0 && matchMedia('(prefers-reduced-motion: reduce)').matches)
      setPaused(true);
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
  }, [viewMode, regionIndex]);
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
    if (!missionReady || !relationshipReady || data.agents.length < 2) return;
    const relationshipCycle = episode * 10000 + cycle;
    const chemistryAgents = activeMission ? missionAgents : data.agents;
    if (chemistryAgents.length < 2) return;
    const log = createRelationshipLog(
      chemistryAgents,
      details,
      relationshipCycle,
      Date.now(),
      regionFor,
      relationshipLogs,
      activeMission
        ? { requestId: activeMission.requestId, goal: activeMission.goal }
        : undefined,
      {
        title: activeNews
          ? `${activeNews.category}“${activeNews.title}”`
          : signalMode === 'live' && signal
            ? `BTC 24h ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}% 的现实行情`
            : event.event,
        mode: activeMission
          ? 'Demo'
          : activeNews
            ? news?.mode === 'fresh'
              ? 'LIVE'
              : '缓存'
            : signalMode === 'live' && signal
              ? signal.mode === 'fresh'
                ? 'LIVE'
                : '缓存'
              : 'Demo',
      },
    );
    if (!log) return;
    setRelationshipLogs((current) => {
      const existing = current.find((item) => item.id === log.id);
      if (existing?.chemistryScore !== undefined) return current;
      return [log, ...current.filter((item) => item.id !== log.id)].slice(
        0,
        300,
      );
    });
    setEvents((current) =>
      [
        {
          id: log.id,
          title: `${log.actorNames[0]} 与 ${log.actorNames[1]} · ${log.type}`,
          region: log.region,
          mode: 'Demo' as const,
          at: log.at,
          summary: log.summary,
          agentIds: log.actorIds,
          requestId: log.missionId,
          outcome: log.outcome,
        },
        ...current.filter((item) => item.id !== log.id),
      ].slice(0, 12),
    );
  }, [
    cycle,
    episode,
    missionReady,
    relationshipReady,
    dataAgentKey,
    missionAgentKey,
    activeMissionId,
    activeMissionGoal,
    activeNews?.id,
    signal?.ts,
    signalMode,
    event.event,
    news?.mode,
  ]);
  useEffect(() => {
    if (panel !== 'agent') return;
    const c = new AbortController();
    setService(details[agent.agentId] ?? null);
    setServiceNotice('正在核对服务');
    const readServices = () =>
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
          if (!c.signal.aborted)
            setServiceNotice('同步暂不可用，保留已保存服务');
        });
    void readServices();
    const interval = setInterval(() => void readServices(), 1200000);
    return () => {
      c.abort();
      clearInterval(interval);
    };
  }, [agent.agentId, panel]);
  const selectAgent = useCallback(
    (a: Agent, instance?: number) => {
      const state = sampleAgents(
        data.agents,
        details,
        time,
        weather,
        50,
        missionAgentIds,
      ).find((s) => s.agentId === a.agentId);
      inspected.current = state
        ? { agentId: a.agentId, instance: state.instance }
        : null;
      setAgentId(a.agentId);
      setSelected(state?.instance ?? null);
      router.push(
        '/regions/' +
          regionSlugs[regionIndex ?? regionFor(a, details[a.agentId])] +
          '/agents/' +
          a.agentId,
      );
    },
    [
      data.agents,
      router,
      regionIndex,
      time,
      weather,
      inspected,
      missionAgentIds.join(','),
    ],
  );
  const focusRegion = useCallback(
    (n: number, showPanel = true) => {
      const position = homeView ? homeRegionPositions[n] : regions[n];
      setRegion(n);
      if (regionIndex === n) {
        setCam(regionCamera);
        if (showPanel) setPanel('region');
        return;
      }
      setCam(
        homeView ? { x: position.x, y: position.y, z: 2.65 } : regionCamera,
      );
      setPanel(null);
      setTransitioning(true);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      navigationTimer.current = setTimeout(
        () => router.push('/regions/' + regionSlugs[n]),
        viewMode === 'observe' ? 650 : 0,
      );
    },
    [homeView, regionIndex, router, viewMode],
  );
  const worldView = () => {
    setCam(initialCamera);
    setPanel(null);
    if (regionIndex !== undefined) router.push('/world');
  };
  const zoom = (delta: number) =>
    setCam((c) => ({
      ...c,
      z: Math.max(
        1,
        Math.min(regionIndex === undefined ? 4.8 : 1.8, c.z + delta),
      ),
    }));
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setCam((c) => ({
        ...c,
        z: Math.max(
          1,
          Math.min(
            regionIndex === undefined ? 4.8 : 1.8,
            c.z * Math.exp(-e.deltaY * 0.001),
          ),
        ),
      }));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [viewMode]);
  const selectionRef = useRef({ agents: data.agents, selectAgent });
  selectionRef.current = { agents: data.agents, selectAgent };
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
          const a = selectionRef.current.agents.find(
            (a) => a.agentId === input.agentId,
          );
          if (!a) throw new Error('Unknown Agent');
          selectionRef.current.selectAgent(a);
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
  }, []);
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
        z: Math.max(
          1,
          Math.min(
            regionIndex === undefined ? 4.8 : 1.8,
            (g.cam.z * d) / g.distance,
          ),
        ),
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
      const hit = pickAvatar(hits.current, wx, wy, Math.max(4, 8 / scale));
      if (hit) {
        const a = data.agents.find((a) => a.agentId === hit.agentId);
        if (a) selectAgent(a, hit.instance);
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
    prompt: `非人类数字文明的宏大等距场景，浅青色云海、柔和象牙色几何平台、九个区域环绕中央协作核心。场景：${event.title}；节点：${regions[region].name}；动作：${stages[stage].title}。四个圆润白色机身、头顶能力块的小型 Agent 的蓝色研究、黄色风险、紫色审计、绿色交易技能正在${stages[stage].title}。功能器官取代人类服装，柔和金色结果核心，克制的几何层次、柔和光影和开阔留白。无文字、无界面、无城市建筑。行为演示，不表示真实任务或收益。`,
  };
  const sceneHref =
    'data:application/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(scene, null, 2));
  const exportRelationshipLogs = (format: 'json' | 'csv') => {
    const content =
      format === 'json'
        ? JSON.stringify(
            relationshipExport(relationshipLogs, data.fetchedAt),
            null,
            2,
          )
        : '\ufeff' + relationshipCsv(relationshipLogs);
    const blob = new Blob([content], {
      type:
        format === 'json'
          ? 'application/json;charset=utf-8'
          : 'text/csv;charset=utf-8',
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `agentverse-relationship-events-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };
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
    <main
      style={
        {
          '--region-accent':
            regionIndex !== undefined ? regions[regionIndex].color : '#86DFF5',
        } as React.CSSProperties
      }
      className={
        'universe-shell soft-world ' +
        (homeView ? 'home-mars ' : '') +
        (activeMission ? 'mission-active ' : '') +
        (regionIndex !== undefined ? 'region-page ' : '') +
        (viewMode === 'walk' ? 'walk-mode ' : '') +
        (transitioning ? 'camera-transition' : '')
      }
    >
      {viewMode === 'walk' ? (
        <Suspense fallback={<div className="walk-loading">正在进入世界…</div>}>
          <WorldWalk
            ignixIds={Object.keys(ignix.associations)}
            agents={data.agents}
            details={details}
            time={time}
            paused={paused}
            speed={speed}
            weather={weather}
            signal={signalMode === 'live' ? signal : null}
            news={news}
            activeNews={activeNews}
            priorityAgentIds={missionAgentIds}
            walker={walker}
            inputBlocked={panel !== null}
            onAgent={(id, instance) => {
              const a = data.agents.find((a) => a.agentId === id);
              if (a) selectAgent(a, instance);
            }}
            onRegion={(n) => focusRegion(n)}
            onNear={setWalkRegion}
            activeEventRegion={
              (
                activeNews ??
                events.find(
                  (e) => e.mode === 'LIVE' && Date.now() - e.at < 45000,
                )
              )?.region
            }
            onExit={() => setViewMode('observe')}
          />
        </Suspense>
      ) : (
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
            {homeView && (
              <>
                <img
                  className="civilization-art"
                  src="/agentverse-mars-civilization.jpg"
                  alt="协作中心与九个功能站点通过发光桥梁连接的火星 Agent 文明"
                  draggable={false}
                />
                <HomeWorldEffects
                  time={time}
                  paused={paused}
                  speed={speed}
                  weather={weather}
                  stage={stage}
                  activeEventRegion={
                    signalMode === 'demo'
                      ? event.region
                      : (activeNews?.region ??
                        events.find(
                          (item) =>
                            item.mode === 'LIVE' &&
                            Date.now() - item.at < 45000,
                        )?.region)
                  }
                  relationshipCount={relationshipGraph.length}
                  agents={roster}
                />
              </>
            )}
            <CivilizationCanvas
              ignixIds={Object.keys(ignix.associations)}
              agents={data.agents}
              details={details}
              time={time}
              paused={paused}
              speed={speed}
              weather={weather}
              selected={selected}
              zoom={cam.z}
              team={team}
              hits={hits}
              population={population}
              viewportWidth={size.w}
              regionIndex={regionIndex}
              activeEventRegion={
                events.find(
                  (e) => e.mode === 'LIVE' && Date.now() - e.at < 45000,
                )?.region
              }
              priorityAgentIds={missionAgentIds}
            />
            {regions
              .filter(
                (r, i) =>
                  (regionIndex === undefined || i === regionIndex) &&
                  (!homeView || i !== 0),
              )
              .map((r) => {
                const i = regions.indexOf(r);
                const position = homeView ? homeRegionPositions[i] : r;
                const RegionIcon = homeRegionIcons[i];
                return (
                  <button
                    key={r.name}
                    className={
                      'region-label ' +
                      (region === i && cam.z > 1 ? 'selected' : '')
                    }
                    style={{
                      left: position.x * 1600,
                      top:
                        position.y * 900 +
                        (homeView
                          ? i === 0
                            ? 50
                            : -20
                          : i === 0
                            ? 105
                            : i === 9
                              ? -42
                              : 64),
                      transform: `translate(-50%,0) scale(${Math.max(0.55, Math.min(1.35, 1 / scale))})`,
                    }}
                    onClick={() => focusRegion(i)}
                    aria-label={`进入${r.name}`}
                  >
                    {homeView ? (
                      <RegionIcon size={18} strokeWidth={1.8} />
                    ) : (
                      <i style={{ background: r.color }} />
                    )}
                    <span>
                      {r.name}
                      <small>{homeView ? homeRegionSubtitles[i] : r.en}</small>
                    </span>
                    {i === 0 && <ChevronRight size={13} />}
                  </button>
                );
              })}
          </div>
          <div className="universe-vignette" />
        </div>
      )}
      <header className="universe-header">
        <Link className="universe-brand" href="/" aria-label="Agentverse 首页">
          <Orbit size={35} strokeWidth={1} />
          <span>
            AGENTVERSE<small>文明观察站 · 创世季</small>
          </span>
        </Link>
        <nav aria-label="观察方式">
          <Link
            href="/world"
            className={homeView && viewMode === 'observe' ? 'active' : ''}
            aria-label="打开世界地图"
          >
            <Globe2 size={16} />
            <span>世界地图</span>
          </Link>
          <button
            className={viewMode === 'walk' ? 'active' : ''}
            onClick={() => {
              if (regionIndex !== undefined) {
                walker.current = {
                  x: regions[regionIndex].x * 100,
                  z: regions[regionIndex].y * 100 + 4,
                  yaw: 0,
                  pitch: 0,
                };
              }
              setViewMode('walk');
            }}
          >
            <Focus size={16} />
            进入世界
          </button>
          <button aria-label="Agent 列表" onClick={() => setPanel('directory')}>
            <Users size={16} />
            <span>Agent 列表</span>
          </button>
          <button
            aria-label="Agent 关系日志"
            className={panel === 'relationships' ? 'active' : ''}
            onClick={() => setPanel('relationships')}
          >
            <Network size={16} />
            <span>关系日志</span>
          </button>
          <Link href="/missions" aria-label="向 Agent 世界发布委托">
            <CirclePlus size={16} />
            <span>发布委托</span>
          </Link>
          <Link href="/integrations" aria-label="查看协议能力审计">
            <ShieldCheck size={16} />
            <span>协议审计</span>
          </Link>
        </nav>
        <button className="source-light" onClick={() => setHelp(true)}>
          <span className="data-mode-badge">
            资料
            {data.mode === 'fresh' ? 'LIVE' : '缓存'}
          </span>
          <span className="demo-mode-badge">行为 Demo</span>
          {paused ? '已暂停' : ''}
          <Info size={14} />
        </button>
      </header>
      {homeView && (
        <div className="home-ecosystem-rail" aria-label="Agent 经济协议层">
          <span>OKX.AI</span>
          <i />
          <span>X LAYER</span>
          <i />
          <span>AGENT PAY</span>
          <i />
          <span>ONCHAIN OS</span>
          <i />
          <span>A2A</span>
          <i />
          <span>IGNIX</span>
        </div>
      )}
      {viewMode === 'observe' &&
        (homeView || regionIndex === 0) &&
        !missionDetailsOpen &&
        latestChemistry && (
          <button
            className="home-chemistry-card"
            onClick={() => setPanel('relationships')}
            aria-label={`查看 ${latestChemistry.actorNames.join(' 与 ')} 的化学反应`}
          >
            <header>
              <span>
                <Sparkles size={14} /> Agent 化学反应
              </span>
              <b>行为 Demo</b>
            </header>
            <strong>
              {latestChemistry.actorNames[0]}
              <i>×</i>
              {latestChemistry.actorNames[1]}
            </strong>
            <p>{latestChemistry.intent ?? latestChemistry.summary}</p>
            <div>
              <span>
                匹配度 {latestChemistry.chemistryScore ?? '—'}
                <em>
                  <i
                    style={{
                      width: `${latestChemistry.chemistryScore ?? 0}%`,
                    }}
                  />
                </em>
              </span>
              <span>
                关系 {latestChemistry.relationBefore ?? 0}
                <ChevronRight size={11} />
                {latestChemistry.relationAfter ?? latestChemistry.relationDelta}
              </span>
            </div>
            <footer>
              <span>{latestChemistry.triggerMode ?? 'Demo'} 触发信号</span>
              查看为什么相遇 <ArrowUpRight size={12} />
            </footer>
          </button>
        )}
      {regionIndex !== undefined && (
        <div className="region-heading">
          <button onClick={worldView}>
            <ArrowLeft size={14} />
            世界地图
          </button>
          <h1>{regions[regionIndex].name}</h1>
          <p>{regions[regionIndex].description}</p>
          <button onClick={() => setPanel('region')}>
            查看区域 <ChevronRight size={13} />
          </button>
        </div>
      )}
      <div className="world-happenings">
        <small>
          世界正在发生
          <button onClick={() => setPanel('relationships')}>
            <Network size={12} /> 关系日志 {relationshipLogs.length}
          </button>
        </small>
        {events.length ? (
          events.slice(0, 2).map((e) => (
            <button key={e.id} onClick={() => focusRegion(e.region, false)}>
              <i className="live-dot" />
              <span>{e.title}</span>
              <b>{e.mode}</b>
            </button>
          ))
        ) : (
          <button onClick={() => focusRegion(0, false)}>
            <i />
            <span>{stages[stage].title}</span>
            <b>Demo</b>
          </button>
        )}
      </div>
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
        <h1>{activeNews?.category ?? event.title}</h1>
        <p>
          {signalMode === 'live'
            ? signal
              ? `BTC 24h ${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%`
              : '等待行情信号'
            : (activeNews?.title ?? event.event)}
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
      <div className="world-summary" aria-hidden="true">
        <span>
          <strong>{population}</strong> 世界居民
        </span>
        <span>
          <strong>{data.agents.length}</strong> 真实档案
        </span>
        <span>
          <strong>{relationshipGraph.length}</strong> 自主关系
        </span>
      </div>
      <div className="collaboration-dock">
        <button
          className="dock-title"
          aria-label={activeMission ? '展开当前委托' : '观察协作中心'}
          aria-expanded={activeMission ? missionDetailsOpen : undefined}
          onClick={() =>
            activeMission
              ? setMissionDetailsOpen((current) => !current)
              : focusRegion(0, false)
          }
        >
          <span className="dock-symbol">
            <Network size={20} />
          </span>
          <span>
            <small>
              {activeMission
                ? `任务协作中心 · ${paused ? '预演已暂停' : '计划预演中'}`
                : `协作核心 · ${paused ? '演示已暂停' : '世界运行中'}`}
            </small>
            <strong>
              {activeMission
                ? `${activeMission.steps[activeMissionStep]?.role} · ${activeMission.steps[activeMissionStep]?.agentName}`
                : stages[stage].title}
            </strong>
          </span>
          {activeMission ? (
            <ChevronDown
              className={
                missionDetailsOpen ? 'dock-chevron open' : 'dock-chevron'
              }
              size={16}
            />
          ) : (
            <ArrowUpRight size={16} />
          )}
        </button>
        <div className="stage-track" aria-label="协作阶段">
          {(activeMission ? activeMission.steps : stages).map((item, i) => {
            const isCurrent = activeMission
              ? activeMissionStep === i
              : stage === i;
            const isPast = activeMission ? activeMissionStep > i : stage > i;
            const label = 'role' in item ? item.role : item.short;
            return (
              <button
                key={'agentId' in item ? item.agentId : item.title}
                aria-label={`观察${label}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={isCurrent ? 'current' : isPast ? 'past' : ''}
                onClick={() =>
                  setTime(
                    activeMission
                      ? cycle * cycleDuration +
                          (i / activeMission.steps.length) * cycleDuration +
                          0.15
                      : cycle * cycleDuration +
                          ('start' in item ? item.start : 0) +
                          0.15,
                  )
                }
              >
                <span>{i + 1}</span>
                <small>{label}</small>
              </button>
            );
          })}
        </div>
        <p className="stage-explanation">
          {activeMission
            ? activeMission.steps[activeMissionStep]?.reason
            : stage === 4
              ? `${skillNames[Math.min(3, Math.floor(phase * 4))]}模块正在工作`
              : stages[stage].note}
        </p>
        <div className="phase-line">
          <span
            style={{
              width: `${((stage + phase) / stages.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {activeMission && missionDetailsOpen && viewMode === 'observe' && (
        <aside
          className="active-mission-card mission-tray"
          aria-label="当前世界委托详情"
        >
          <header>
            <span>
              <Route size={15} /> 当前世界委托
            </span>
            <button
              onClick={() => setMissionDetailsOpen(false)}
              aria-label="收起当前委托"
            >
              <X size={15} />
            </button>
          </header>
          <small>REQUEST {activeMission.requestId.slice(0, 8)}</small>
          <h2>{activeMission.goal}</h2>
          <div className="active-mission-steps mission-tray-steps">
            {activeMission.steps.map((step, index) => {
              const resident = data.agents.find(
                (item) => item.agentId === step.agentId,
              );
              return (
                <button
                  key={`${step.agentId}-${step.serviceId}`}
                  className={index === activeMissionStep ? 'current' : ''}
                  onClick={() => {
                    if (resident) selectAgent(resident);
                  }}
                >
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <span>
                    <strong>{step.agentName}</strong>
                    <small>
                      {step.role} · SERVICE #{step.serviceId}
                    </small>
                  </span>
                  <i>
                    {step.price === '0'
                      ? '免费'
                      : `${step.price} ${step.symbol}`}
                  </i>
                </button>
              );
            })}
          </div>
          <footer>
            <span>
              <ShieldCheck size={13} /> 计划预演 · 未付款或执行
            </span>
            <div>
              <Link href="/missions">
                调整团队 <ChevronRight size={13} />
              </Link>
              <button
                onClick={() => {
                  clearActiveMission();
                  setMissionDetailsOpen(false);
                }}
              >
                退出任务
              </button>
            </div>
          </footer>
        </aside>
      )}
      <div className="world-caption">
        <span>
          <Sparkles size={14} />
          {homeView
            ? 'Agent 元宇宙 · Agentverse'
            : `资料 ${data.mode === 'fresh' ? 'LIVE' : '缓存'} · 动画 Demo`}
        </span>
        <p>
          {homeView
            ? `${signal ? '连接现实数据中' : '等待现实信号'} · ${new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' })} 更新`
            : signalMode === 'live'
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
        <span>
          {regionIndex !== undefined
            ? cam.z < 1.3
              ? '区域'
              : 'Agent'
            : cam.z < 1.5
              ? '世界'
              : cam.z < 3
                ? '区域'
                : 'Agent'}
          视角
        </span>
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
          if (!open) {
            setPanel(null);
            if (profileId && regionIndex !== undefined)
              router.push('/regions/' + regionSlugs[regionIndex]);
          }
        }}
        modal={false}
      >
        <SheetContent
          className={
            panel === 'agent'
              ? 'civilization-sheet dossier-sheet'
              : panel === 'relationships'
                ? 'civilization-sheet relationship-sheet'
                : 'civilization-sheet'
          }
        >
          {panel === 'relationships' ? (
            <>
              <SheetTitle>Agent 世界事件</SheetTitle>
              <SheetDescription>
                从世界信号到 Agent
                意图、伙伴选择、互动结果与关系记忆，每一步都可以追溯。
              </SheetDescription>
              <div className="relationship-mode-note">
                <b>行为 Demo</b>
                <span>
                  当前决策由可重放的结构化规则生成，不是 OKX.AI
                  服务调用或链上交易；现实信号与模拟行为始终分开标记。
                </span>
              </div>
              <div className="relationship-stats">
                <div>
                  <strong>{relationshipLogs.length}</strong>
                  <small>事件</small>
                </div>
                <div>
                  <strong>{relationshipGraph.length}</strong>
                  <small>关系</small>
                </div>
                <div>
                  <strong>
                    {
                      new Set(relationshipLogs.flatMap((log) => log.actorIds))
                        .size
                    }
                  </strong>
                  <small>参与 Agent</small>
                </div>
              </div>
              <div className="relationship-exports">
                <button
                  disabled={!relationshipLogs.length}
                  onClick={() => exportRelationshipLogs('json')}
                >
                  <Download size={15} /> 导出 JSON
                </button>
                <button
                  disabled={!relationshipLogs.length}
                  onClick={() => exportRelationshipLogs('csv')}
                >
                  <Download size={15} /> 导出 CSV
                </button>
              </div>
              <h3>关系网络</h3>
              <div className="relationship-network">
                {relationshipGraph.slice(0, 8).map((edge) => (
                  <article key={edge.id}>
                    <div>
                      <button
                        onClick={() => {
                          const selectedAgent = data.agents.find(
                            (item) => item.agentId === edge.sourceId,
                          );
                          if (selectedAgent) selectAgent(selectedAgent);
                        }}
                      >
                        {edge.sourceName}
                      </button>
                      <i />
                      <span>{edge.kind}</span>
                      <i />
                      <button
                        onClick={() => {
                          const selectedAgent = data.agents.find(
                            (item) => item.agentId === edge.targetId,
                          );
                          if (selectedAgent) selectAgent(selectedAgent);
                        }}
                      >
                        {edge.targetName}
                      </button>
                    </div>
                    <small>
                      互动 {edge.interactions} 次 · 关系强度 {edge.strength}/100
                    </small>
                  </article>
                ))}
                {!relationshipGraph.length && (
                  <p>世界启动后会生成第一条关系。</p>
                )}
              </div>
              <h3>可解释事件时间线</h3>
              <div className="relationship-timeline">
                {relationshipLogs.map((log) => (
                  <article key={log.id}>
                    <header>
                      <span>{log.type}</span>
                      <b>
                        {log.decisionMode ??
                          (log.missionId ? '任务推演' : log.mode)}
                      </b>
                      <time>
                        {new Date(log.at).toLocaleString('zh-CN', {
                          timeZone: 'Asia/Shanghai',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>
                    </header>
                    <h4>{log.title}</h4>
                    <div className="relationship-causality">
                      <p>
                        <span>触发</span>
                        {log.trigger ?? '世界循环触发了本轮能力匹配。'}
                        <b>{log.triggerMode ?? 'Demo'}</b>
                      </p>
                      <p>
                        <span>意图</span>
                        {log.intent ?? log.summary}
                      </p>
                      <p>
                        <span>行动</span>
                        {log.summary}
                      </p>
                    </div>
                    <div className="relationship-chemistry">
                      <div>
                        <span>化学反应</span>
                        <strong>{log.chemistryScore ?? '—'}</strong>
                      </div>
                      <em>
                        <i style={{ width: `${log.chemistryScore ?? 0}%` }} />
                      </em>
                      <section>
                        {(log.chemistryFactors ?? []).map((factor) => (
                          <span key={factor.key} title={factor.note}>
                            {factor.label} +{factor.score}
                          </span>
                        ))}
                      </section>
                    </div>
                    <small>{log.reason}</small>
                    <p className="relationship-outcome">{log.outcome}</p>
                    <small>{log.memoryEffect}</small>
                    <div>
                      <span>{log.capabilities[0]}</span>
                      <span>{log.capabilities[1]}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : panel === 'directory' ? (
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
                      variant={agentVariant(a)}
                    />
                    <span>
                      <strong>
                        {a.name}{' '}
                        {ignix.associations[a.agentId]?.tokens.length ? (
                          <IgnixBadge />
                        ) : null}
                      </strong>
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
              <div className="crypto-workflow">
                <small>加密任务场景 · Demo</small>
                <h3>{regionTask.name}</h3>
                <p>{regionTask.prop}</p>
                <div>
                  {regionTask.steps.map((step, i) => (
                    <span
                      key={step}
                      className={i === regionTask.step ? 'active' : ''}
                    >
                      {step}
                    </span>
                  ))}
                </div>
                <p className="subtle">
                  资产块与任务动作是概念演示，没有提交链上交易。
                </p>
              </div>
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
                      setTime(cycle * cycleDuration);
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
                            variant={agentVariant(a)}
                          />
                          <span>
                            <strong>
                              {a.name}{' '}
                              {ignix.associations[a.agentId]?.tokens.length ? (
                                <IgnixBadge />
                              ) : null}
                            </strong>
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
          ) : profileId && !data.agents.some((a) => a.agentId === profileId) ? (
            <>
              <SheetTitle>此 Agent 的档案暂不可用</SheetTitle>
              <SheetDescription>
                当前同步名录中没有 #{profileId}
                。你可以返回区域，或查看来源页面。
              </SheetDescription>
              <a
                className="observer-button"
                href={'https://www.okx.ai/zh-hans/agents/' + profileId}
                target="_blank"
                rel="noreferrer"
              >
                查看 OKX.AI 原始档案
              </a>
            </>
          ) : (
            <AgentDossier
              key={agent.agentId}
              agent={agent}
              ignix={ignix}
              data={data}
              service={service}
              serviceNotice={serviceNotice}
              time={time}
              state={sampleAgents(
                data.agents,
                details,
                time,
                weather,
                50,
                missionAgentIds,
              ).find((s) => s.agentId === agent.agentId)}
              memories={memories}
              relationships={relationshipLogs.filter((log) =>
                log.actorIds.includes(agent.agentId),
              )}
              team={team}
              onSelect={selectAgent}
              onDirectory={() => setPanel('directory')}
            />
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
              一次 18
              秒循环包含能力请求、吸附合体、工作、交付、结算、拆分和成长。
            </p>
            <p>
              <strong>现实与演示</strong>
              {data.agents.length} 个档案来自 OKX.AI，世界中每个身份只出现一次。
              当前 {population} 个角色的协作和收益均为模拟。现实模式读取 BTC
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
