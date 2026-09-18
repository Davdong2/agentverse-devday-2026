'use client';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  activeMissionStorageKey,
  isMissionPlan,
  type MissionPlan,
} from '@/lib/mission';
import type { WorldNews, NewsReaction } from '@/lib/world-news';
import ignixSeed from '@/lib/ignix-snapshot.json';
import { mergeIgnixProfiles, type IgnixData } from '@/lib/ignix';
import snapshot from '@/lib/agents.json';
import type { AgentData } from '@/lib/marketplace';
import {
  includeMissionResidents,
  type Weather,
  type MarketSignal,
  type MemoryRecord,
} from '@/lib/civilization-model';
import type { RelationshipLog } from '@/lib/agent-relationships';
export type WorldEvent = {
  id: string;
  title: string;
  region: number;
  mode: 'LIVE' | '缓存' | 'Demo';
  at: number;
  sourceUrl?: string;
  publishedAt?: string;
  summary?: string;
  agentIds?: string[];
  requestId?: string;
  outcome?: string;
};
function useStore() {
  const [ignix, setIgnix] = useState<IgnixData>(ignixSeed as IgnixData);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (document.hidden) return;
      fetch('/api/ignix', { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json() as Promise<IgnixData>;
        })
        .then((d) => {
          if (
            !controller.signal.aborted &&
            d.associations &&
            Array.isArray(d.profiles)
          )
            setIgnix(d);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setIgnix((previous) => ({
              ...previous,
              mode: 'cached',
              stale: true,
            }));
        });
    };
    refresh();
    const timer = setInterval(refresh, 1200000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  const [data, setData] = useState<AgentData>({
    ...snapshot,
    mode: 'snapshot',
  });
  const [time, setTime] = useState(0),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1),
    [episode, setEpisode] = useState(0);
  const [scenario, setScenario] = useState<Weather>('calm'),
    [signalMode, setSignalMode] = useState<'demo' | 'live'>('live'),
    [signal, setSignal] = useState<MarketSignal | null>(null),
    [signalError, setSignalError] = useState('');
  const [history, setHistory] = useState<MemoryRecord[]>([]),
    [events, setEvents] = useState<WorldEvent[]>([]),
    [relationshipLogs, setRelationshipLogs] = useState<RelationshipLog[]>([]),
    [relationshipReady, setRelationshipReady] = useState(false),
    [viewMode, setViewMode] = useState<'observe' | 'walk'>('observe');
  const [activeMission, setActiveMission] = useState<MissionPlan | null>(null);
  const [missionReady, setMissionReady] = useState(false);
  const inspected = useRef<{ agentId: string; instance: number } | null>(null);
  const recorded = useRef(new Set<string>()),
    walker = useRef({ x: 46.8, z: 53.2, yaw: 0, pitch: 0.08 }),
    lastCatalog = useRef<AgentData>({ ...snapshot, mode: 'snapshot' }),
    lastMarket = useRef<number | null>(null);
  const [news, setNews] = useState<WorldNews | null>(null);
  const [newsReaction, setNewsReaction] = useState<NewsReaction | null>(null);
  const seenNews = useRef(new Set<string>());
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(activeMissionStorageKey);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isMissionPlan(parsed)) setActiveMission(parsed);
        }
      } catch {
        // A mission can always be created again from the collaboration center.
      } finally {
        setMissionReady(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!missionReady) return;
    try {
      if (activeMission)
        localStorage.setItem(
          activeMissionStorageKey,
          JSON.stringify(activeMission),
        );
      else localStorage.removeItem(activeMissionStorageKey);
    } catch {
      // Keep the active mission in memory when browser storage is unavailable.
    }
  }, [activeMission, missionReady]);
  const launchMission = useCallback((mission: MissionPlan) => {
    setActiveMission(mission);
    setEvents((current) =>
      [
        {
          id: `mission-${mission.requestId}`,
          title: `新委托进入协作中心 · ${mission.steps.length} 个 Agent 组队`,
          summary: mission.goal,
          region: 0,
          mode: 'Demo' as const,
          at: Date.now(),
          requestId: mission.requestId,
          agentIds: mission.steps.map((step) => step.agentId),
          outcome: '协作计划已生成，等待人类确认后才会调用真实服务。',
        },
        ...current.filter(
          (event) => event.id !== `mission-${mission.requestId}`,
        ),
      ].slice(0, 12),
    );
    setTime(0);
    setEpisode((current) => current + 1);
    setViewMode('observe');
  }, []);
  const clearActiveMission = useCallback(() => setActiveMission(null), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem('agentverse.relationship.logs.v1');
        if (stored) {
          const parsed = JSON.parse(stored) as RelationshipLog[];
          if (Array.isArray(parsed)) setRelationshipLogs(parsed.slice(0, 300));
        }
      } catch {
        // A blocked or malformed local store should not stop the world.
      } finally {
        setRelationshipReady(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!relationshipReady) return;
    try {
      localStorage.setItem(
        'agentverse.relationship.logs.v1',
        JSON.stringify(relationshipLogs.slice(0, 300)),
      );
    } catch {
      // The in-memory log and export remain available when storage is full.
    }
  }, [relationshipLogs, relationshipReady]);
  useEffect(() => {
    const controller = new AbortController();
    async function refreshNews() {
      if (document.hidden) return;
      try {
        const r = await fetch('/api/world-news', { signal: controller.signal });
        if (!r.ok) throw new Error();
        const d = (await r.json()) as WorldNews;
        if (controller.signal.aborted || !Array.isArray(d.items)) return;
        setNews(d);
        const item =
          d.mode !== 'stale'
            ? d.items.find(
                (i) =>
                  !seenNews.current.has(i.id) &&
                  Date.now() - Date.parse(i.publishedAt) < 86400000,
              )
            : null;
        d.items.forEach((i) => seenNews.current.add(i.id));
        if (item) {
          setNewsReaction({ ...item, until: Date.now() + 45000 });
          setEvents((old) =>
            [
              {
                id: 'news-' + item.id,
                title: item.category + ' · ' + item.title,
                region: item.region,
                mode:
                  d.mode === 'fresh' ? ('LIVE' as const) : ('缓存' as const),
                at: Date.now(),
                sourceUrl: item.url,
                publishedAt: item.publishedAt,
              },
              ...old,
            ].slice(0, 8),
          );
          setTime((t) => Math.ceil(t / 18) * 18);
        }
      } catch {
        if (!controller.signal.aborted)
          setNews((old) => (old ? { ...old, mode: 'stale' } : null));
      }
    }
    void refreshNews();
    const timer = setInterval(refreshNews, 600000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  const displayData = useMemo(() => {
    const sourcedAgents = mergeIgnixProfiles(
      data.agents,
      ignix.profiles,
      ignix.associations,
    );
    return {
      ...data,
      agents: includeMissionResidents(
        sourcedAgents,
        (snapshot as AgentData).agents,
        activeMission?.steps.map((step) => step.agentId) ?? [],
      ),
    };
  }, [activeMission, data, ignix]);
  return {
    data: displayData,
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
    launchMission,
    clearActiveMission,
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function WorldProvider({ children }: { children: ReactNode }) {
  const state = useStore();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useWorld() {
  const state = useContext(Context);
  if (!state) throw new Error('WorldProvider required');
  return state;
}
