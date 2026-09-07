'use client';
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  return {
    data,
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
