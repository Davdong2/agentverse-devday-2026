'use client';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Agent, Detail } from '@/lib/marketplace';
import { appearance } from '@/lib/world-model';
import {
  regions,
  seeded,
  regionFor,
  collaborationPose,
  stageAt,
  skillColors,
  weathers,
  type Weather,
} from '@/lib/civilization-model';
export type Hit = { x: number; y: number; instance: number; agentId: string };
type Props = {
  agents: Agent[];
  details: Record<string, Detail>;
  time: number;
  weather: Weather;
  selected: number | null;
  zoom: number;
  team: Agent[];
  hits: MutableRefObject<Hit[]>;
  population: number;
};
export default function CivilizationCanvas(props: Props) {
  const el = useRef<HTMLCanvasElement>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const canvas = el.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sprite = new Image();
    sprite.src = '/agent-sprites.png';
    let raf = 0,
      previous = 0;
    let lastFrame = '';
    let lastAgents: Agent[] | null = null;
    canvas.width = 2400;
    canvas.height = 1350;
    ctx.scale(1.5, 1.5);
    const line = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      color: string,
      width = 1,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x * 1600, a.y * 900);
      ctx.quadraticCurveTo(
        (a.x + b.x) * 800,
        (a.y + b.y) * 450 - 18,
        b.x * 1600,
        b.y * 900,
      );
      ctx.stroke();
    };
    const glow = (
      x: number,
      y: number,
      r: number,
      color: string,
      alpha = 0.3,
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    };
    const dot = (x: number, y: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    const actor = (x: number, y: number, role: number, size: number) => {
      if (sprite.complete && sprite.naturalWidth)
        ctx.drawImage(
          sprite,
          (role * sprite.naturalWidth) / 6,
          0,
          sprite.naturalWidth / 6,
          sprite.naturalHeight,
          x - size / 2,
          y - size * 1.6,
          size,
          size * 2,
        );
      else dot(x, y, size / 5, skillColors[role % 4]);
    };
    const text = (
      str: string,
      x: number,
      y: number,
      color = '#eef4ed',
      size = 13,
    ) => {
      ctx.fillStyle = color;
      ctx.font = `${size}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(str, x, y);
    };
    const frame = (stamp: number) => {
      raf = requestAnimationFrame(frame);
      if (stamp - previous < 33) return;
      previous = stamp;
      const p = latest.current,
        t = p.time,
        c = regions[0],
        weather = weathers[p.weather],
        phase = stageAt(t),
        ct = t % 80;
      const frameKey = [t, p.weather, p.zoom, p.selected, sprite.complete].join(
        ':',
      );
      if (lastFrame === frameKey && lastAgents === p.agents) return;
      lastFrame = frameKey;
      lastAgents = p.agents;
      ctx.clearRect(0, 0, 1600, 900);
      p.hits.current = [];
      const pulse = (Math.sin(t * 0.65) + 1) / 2;
      const visuals = p.agents.map((a) => appearance(a, p.details[a.agentId]));
      const homes = p.agents.map((a) => regionFor(a, p.details[a.agentId]));
      regions.forEach((r, n) => {
        const local = visuals.filter((_, i) => homes[i] === n);
        if (local.length) {
          const heat = local.reduce((sum, v) => sum + v.heat, 0) / local.length;
          glow(
            r.x * 1600,
            r.y * 900,
            45 + heat * 60,
            r.color,
            0.04 + heat * 0.14,
          );
        }
      });
      // Connection geometry is a visualization of information and resource routes.
      regions.slice(1).forEach((r, i) => {
        const closed = p.weather === 'attack' && (i === 4 || i === 5);
        line(r, c, closed ? '#f68e7040' : r.color + '3a', closed ? 1 : 1.2);
        if (!closed)
          for (let j = 0; j < 5; j++) {
            const u = (t * 0.035 + j / 5 + i * 0.1) % 1;
            const x = (r.x + (c.x - r.x) * u) * 1600,
              y = (r.y + (c.y - r.y) * u) * 900 - Math.sin(u * Math.PI) * 9;
            dot(x, y, 1.6, r.color);
          }
      });
      const mx = regions[weather.region].x * 1600,
        my = regions[weather.region].y * 900;
      glow(
        mx,
        my,
        p.weather === 'calm' ? 70 : 130,
        weather.color,
        p.weather === 'calm' ? 0.16 : 0.25 + pulse * 0.16,
      );
      if (p.weather === 'nvda') {
        line(regions[7], regions[5], '#b5d8ff55', 5);
        line(regions[5], regions[1], '#9acfff44', 3);
        for (let i = 0; i < 18; i++) {
          const u = (t * 0.13 + i / 18) % 1;
          dot(
            (regions[7].x + (regions[5].x - regions[7].x) * u) * 1600,
            (regions[7].y + (regions[5].y - regions[7].y) * u) * 900,
            2.6,
            '#ceebff',
          );
        }
        glow(
          regions[1].x * 1600,
          regions[1].y * 900,
          85,
          '#9acfff',
          0.2 + pulse * 0.2,
        );
      }
      if (p.weather === 'storm' || p.weather === 'attack') {
        for (let i = 0; i < 4; i++) {
          const r = ((t * 19 + i * 40) % 160) + 20;
          ctx.save();
          ctx.globalAlpha = (1 - r / 200) * 0.5;
          ctx.strokeStyle = weather.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(mx, my, r, r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (p.weather === 'attack') {
          ctx.fillStyle = '#25152e55';
          ctx.beginPath();
          ctx.ellipse(mx, my, 95, 53, 0, 0, Math.PI * 2);
          ctx.fill();
          text('×  风险隔离', mx, my + 56, '#f4a597', 14);
        }
      }
      if (p.weather === 'tide') {
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = `rgba(142,229,201,${0.28 - i * 0.045})`;
          ctx.lineWidth = 7 - i;
          ctx.beginPath();
          ctx.ellipse(
            mx,
            my,
            64 + i * 20 + pulse * 7,
            25 + i * 10,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      }
      if (p.weather === 'chain') {
        const expansion = Math.min(1, ct / 25);
        for (let i = 0; i < 5; i++) {
          const r = regions[9],
            q = { x: r.x - 0.1 + i * 0.035, y: r.y + 0.05 + (i % 2) * 0.055 };
          line(regions[4], q, '#c7e5ed88', 1.5);
          ctx.save();
          ctx.globalAlpha = expansion;
          ctx.strokeStyle = '#c6e8e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(
            q.x * 1600,
            q.y * 900,
            15 * expansion,
            7 * expansion,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          dot(q.x * 1600, q.y * 900, 3, '#dbf5e9');
          ctx.restore();
        }
        text('X LAYER · 新节点', mx, my + 100, '#ceebf1', 13);
      }
      if (p.weather === 'resources') {
        [8, 4, 7, 0].forEach((n, i, arr) => {
          const a = regions[n],
            b = regions[arr[(i + 1) % 4]];
          line(a, b, '#f0ce8566', 2.5);
          for (let j = 0; j < 8; j++) {
            const u = (t * 0.07 + j / 8) % 1;
            dot(
              (a.x + (b.x - a.x) * u) * 1600,
              (a.y + (b.y - a.y) * u) * 900,
              2.4,
              '#f2db94',
            );
          }
        });
      }
      // Real-world asset concepts become functional nodes; no ownership or live quotes are implied.
      ['NVDA', 'GOLD', 'BONDS', 'ENERGY', 'COMPUTE'].forEach((name, i) => {
        const x = regions[7].x * 1600 + (i - 2) * 29,
          y = regions[7].y * 900 + 70 + Math.abs(i - 2) * 5;
        const color = ['#a8dcaa', '#efcf80', '#d1d8e0', '#f3b975', '#97dce4'][
          i
        ];
        dot(x, y, 4, color);
        if (p.zoom > 1.6) text(name, x, y + 18, color, 10);
        if (i < 4)
          line(
            { x: x / 1600, y: y / 900 },
            { x: (x + 29) / 1600, y: y / 900 },
            color + '66',
          );
      });
      // Hundreds of explicitly simulated instances are mapped to real catalog profiles.
      for (let i = 0; i < p.population; i++) {
        const a = p.agents[i % p.agents.length];
        if (!a) continue;
        const visual = visuals[i % p.agents.length];
        let home = homes[i % p.agents.length];
        if (i % 13 === 0) home = 8;
        if (i % 17 === 0) home = 3;
        if (i % 19 === 0) home = 7;
        if (p.weather === 'chain' && i % 5 === 0) home = 9;
        const base = regions[home];
        const theta =
          seeded(i + 3) * Math.PI * 2 + t * (0.025 + seeded(i + 8) * 0.022);
        const radius =
          (0.014 + seeded(i + 22) * 0.048) * (home === 9 ? 0.45 : 1);
        let x = base.x + Math.cos(theta) * radius,
          y = base.y + Math.sin(theta) * radius * 0.55;
        const traveler =
          i % 4 === 0 ||
          ((p.weather === 'storm' || p.weather === 'attack') &&
            visual.role === 5);
        if (traveler) {
          const u = (t * (0.018 + seeded(i + 11) * 0.011) + seeded(i + 91)) % 1;
          let destination = i % 8 === 0 ? regions[0] : regions[(home + 1) % 9];
          if (p.weather === 'nvda' && i % 3 === 0) destination = regions[5];
          if (
            (p.weather === 'storm' || p.weather === 'attack') &&
            visual.role === 5
          )
            destination = regions[weather.region];
          if (
            p.weather === 'attack' &&
            visual.role !== 5 &&
            destination === regions[6]
          )
            destination = regions[3];
          x = base.x + (destination.x - base.x) * u;
          y =
            base.y +
            (destination.y - base.y) * u -
            Math.sin(u * Math.PI) * 0.014;
        }
        const sx = x * 1600,
          sy = y * 900;
        const chosen = p.selected === i;
        if (p.zoom > 1.8 || i % 7 === 0 || chosen) {
          actor(
            sx,
            sy + Math.sin(t * 2 + i) * 1.3,
            visual.role,
            chosen ? 25 : p.zoom > 2.5 ? 15 : 12,
          );
        } else {
          dot(sx, sy, 1.6 + seeded(i) * 0.9, visual.color);
        }
        if (chosen) {
          ctx.strokeStyle = '#f5dc95';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(sx, sy + 7, 18, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          text(a.name, sx, sy - 37, '#fff6d3', 14);
        }
        p.hits.current.push({ x: sx, y: sy, instance: i, agentId: a.agentId });
      }
      // Collaboration is an explicit animated state machine, not a claimed live task.
      const cx = c.x * 1600,
        cy = c.y * 900;
      ctx.strokeStyle = '#607f8760';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 97, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const pos = collaborationPose(t, i),
          x = pos.x * 1600,
          y = pos.y * 900;
        const role = [0, 5, 2, 0][i];
        const working = phase === 4 && Math.floor((ct - 32) / 4) === i;
        if (phase >= 2 && phase <= 7) {
          line(
            pos,
            c,
            skillColors[i] + (working ? 'ff' : '88'),
            working ? 4 : 2,
          );
          glow(x, y, working ? 45 : 25, skillColors[i], working ? 0.6 : 0.2);
        }
        actor(x, y, role, phase >= 3 && phase <= 6 ? 40 : 32);
        ctx.fillStyle = skillColors[i];
        ctx.shadowColor = skillColors[i];
        ctx.shadowBlur = working ? 18 : 0;
        ctx.fillRect(x - 6, y - 40, 12, 12);
        ctx.shadowBlur = 0;
        if (p.zoom > 1.5 || phase === 4)
          text(
            skillNamesLocal[i],
            x,
            y + 30,
            working ? '#183347' : skillColors[i],
            12,
          );
        if (p.selected === -1 - i) {
          ctx.strokeStyle = '#f4d99d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y + 8, 25, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (p.team[i])
          p.hits.current.push({
            x,
            y,
            instance: -1 - i,
            agentId: p.team[i].agentId,
          });
      }
      if (phase === 0 || phase === 1) {
        text('需要风险 · 审计 · 执行能力', cx, cy - 63, '#314a5a', 15);
        glow(cx, cy, 40, '#d1b163', 0.25);
      }
      if (phase >= 3 && phase <= 6) {
        glow(cx, cy - 3, 42, '#fff5be', 0.35 + pulse * 0.3);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#fff4ca';
        ctx.shadowColor = '#fff1ae';
        ctx.shadowBlur = 25;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.restore();
        text('STRATEGY AGENT', cx, cy - 68, '#355263', 14);
      }
      if (phase === 5) {
        const u = (ct - 48) / 7,
          x = cx + (regions[7].x * 1600 - cx) * u,
          y = cy + (regions[7].y * 900 - cy) * u;
        glow(x, y, 27, '#fff5b1', 0.7);
        ctx.fillStyle = '#fff1ad';
        ctx.fillRect(x - 7, y - 7, 14, 14);
        text('结果核心', x, y - 20, '#fff6cc', 13);
      }
      if (phase === 6) {
        for (let i = 0; i < 4; i++) {
          const destination = collaborationPose(t, i);
          const u = ((ct - 55) * 0.32 + i * 0.23) % 1;
          dot(
            cx + (destination.x * 1600 - cx) * u,
            cy + (destination.y * 900 - cy) * u,
            4,
            '#ffd78a',
          );
        }
        text('10 USDT · 演示奖励分流', cx, cy + 87, '#f4dca8', 14);
      }
      if (phase === 8) {
        for (let i = 0; i < 4; i++) {
          const pos = collaborationPose(t, i),
            u = (ct - 71) / 9;
          const x = pos.x * 1600,
            y = pos.y * 900 - 50 + u * 18;
          ctx.fillStyle = skillColors[(i + 1) % 4];
          ctx.fillRect(x - 5, y - 5, 10, 10);
        }
        text('经验 +1 · 技能积累', cx, cy + 22, '#355263', 15);
      }
      if (p.weather !== 'calm')
        text(weather.asset, mx, my - 27, weather.color, 14);
      // Session-driven ecology growth: new network nodes emerge rather than invented source metrics.
      const generation = Math.min(6, Math.floor(t / 80));
      for (let i = 0; i < generation; i++) {
        const x = cx - 85 + i * 31,
          y = cy + 102;
        dot(x, y, 3.5, '#bcdcc7');
        if (i)
          line(
            { x: (x - 31) / 1600, y: y / 900 },
            { x: x / 1600, y: y / 900 },
            '#bcdcc766',
          );
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={el} className="civilization-canvas" aria-hidden="true" />;
}
const skillNamesLocal = ['研究', '风险', '审计', '交易'];
