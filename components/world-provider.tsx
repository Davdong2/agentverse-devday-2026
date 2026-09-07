'use client';
import {
  createContext,
  useEffect,
  useMemo,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { WorldNews, NewsReaction } from '@/lib/world-news';
import ignixSeed from '@/lib/ignix-snapshot.json';
import { mergeIgnixProfiles, type IgnixData } from '@/lib/ignix';
import snapshot from '@/lib/agents.json';
import type { AgentData } from '@/lib/marketplace';
import type {
  Weather,
  MarketSignal,
  MemoryRecord,
} from '@/lib/civilization-model';
export type WorldEvent = {
  id: string;
  title: string;
  region: number;
  mode: 'LIVE' | '缓存' | 'Demo';
  at: number;
  sourceUrl?: string;
  publishedAt?: string;
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
    [viewMode, setViewMode] = useState<'observe' | 'walk'>('observe');
  const inspected = useRef<{ agentId: string; instance: number } | null>(null);
  const recorded = useRef(new Set<string>()),
    walker = useRef({ x: 46.8, z: 51.5, yaw: 0, pitch: 0 }),
    lastCatalog = useRef<AgentData>({ ...snapshot, mode: 'snapshot' }),
    lastMarket = useRef<number | null>(null);
  const [news, setNews] = useState<WorldNews | null>(null);
  const [newsReaction, setNewsReaction] = useState<NewsReaction | null>(null);
  const seenNews = useRef(new Set<string>());
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
  const displayData = useMemo(
    () => ({
      ...data,
      agents: mergeIgnixProfiles(
        data.agents,
        ignix.profiles,
        ignix.associations,
      ),
    }),
    [data, ignix],
  );
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
    viewMode,
    setViewMode,
    walker,
    inspected,
    lastCatalog,
    lastMarket,
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
