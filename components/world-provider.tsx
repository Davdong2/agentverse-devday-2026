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
    [signalMode, setSignalMode] = useState<'demo' | 'live'>('demo'),
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
