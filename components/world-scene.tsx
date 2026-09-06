'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { Agent, Detail } from '@/lib/marketplace';
import {
  appearance,
  anchors,
  route,
  pointAt,
  stateNames,
  type State,
} from '@/lib/world-model';
export function AgentSprite({
  role,
  className = '',
}: {
  role: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={'agent-sprite ' + className}
      style={{ backgroundPosition: `${role * 20}% 50%` }}
    />
  );
}
export default function WorldScene({
  agents,
  details,
  selectedId,
  progress,
  active,
  state,
  onSelect,
  onNode,
}: {
  agents: Agent[];
  details: Record<string, Detail>;
  selectedId: string;
  progress: number;
  active: boolean;
  state: State;
  onSelect: (a: Agent) => void;
  onNode: (i: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const context = el.getContext('2d');
    if (!context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      const w = el.clientWidth,
        h = el.clientHeight,
        dpr = Math.min(devicePixelRatio, 2);
      if (
        el.width !== Math.round(w * dpr) ||
        el.height !== Math.round(h * dpr)
      ) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, w, h);
      context.lineWidth = 2;
      context.strokeStyle = active ? '#f7f2cbaa' : '#ffffff40';
      context.beginPath();
      route.forEach((p, i) => {
        if (i === 0) context.moveTo((p.x * w) / 100, (p.y * h) / 100);
        else context.lineTo((p.x * w) / 100, (p.y * h) / 100);
      });
      context.stroke();
      if (active) {
        for (let i = 0; i < 6; i++) {
          const p = pointAt(reduced ? progress : (progress + i / 6) % 1);
          context.beginPath();
          context.fillStyle = '#ffedaf';
          context.shadowColor = '#f3d895';
          context.shadowBlur = 8;
          context.arc((p.x * w) / 100, (p.y * h) / 100, 2.3, 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [active, progress]);
  const groups = [0, 0, 0, 0];
  return (
    <div className="scene-layer">
      <canvas ref={canvas} aria-hidden="true" className="flow-canvas" />
      {agents.map((a) => {
        const visual = appearance(a, details[a.agentId]);
        const n = visual.home;
        const ordinal = groups[n]++;
        const chosen = a.agentId === selectedId;
        const anchor = anchors[n];
        const rest = {
          x: anchor.x + ((ordinal % 4) - 1.5) * 3.7,
          y: anchor.y + Math.floor(ordinal / 4) * 5 - 2,
        };
        const p = chosen && active ? pointAt(progress) : rest;
        const demoState: State = chosen
          ? state
          : (['idle', 'research', 'execute', 'complete'] as State[])[
              Number(a.agentId) % 4
            ];
        return (
          <button
            key={a.agentId}
            data-agent-id={a.agentId}
            data-visual-role={visual.role}
            data-visual-state={demoState}
            aria-label={`${a.name}，${a.categoryName[0]}，${stateNames[demoState]}（演示）`}
            aria-pressed={chosen}
            onClick={() => onSelect(a)}
            className={`inhabitant ${chosen ? 'is-selected' : ''} state-${demoState} reputation-${visual.reputation}`}
            style={
              {
                left: p.x + '%',
                top: p.y + '%',
                '--role-color': visual.color,
                '--heat': visual.heat,
                '--bob-duration': `${4.8 - visual.heat * 1.8}s`,
              } as CSSProperties
            }
          >
            <AgentSprite role={visual.role} />
            <span className="reputation-halo" />
            <span className="inhabitant-name">
              {a.name}
              <small>{stateNames[demoState]} · 演示</small>
            </span>
          </button>
        );
      })}
      <div className="node-census">
        {anchors.map((_, i) => (
          <button key={i} onClick={() => onNode(i)}>
            <span
              style={{
                background: ['#638dae', '#76a78f', '#ba914f', '#9b8aac'][i],
              }}
            />
            {['研究', '风控', '执行', '结算'][i]} {groups[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
