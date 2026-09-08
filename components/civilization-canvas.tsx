'use client';
import { drawVectorAgent } from '@/lib/vector-agent';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Agent, Detail } from '@/lib/marketplace';
import { cryptoTaskState } from '@/lib/crypto-world';
import {
  avatarMotion,
  teamVariants,
  type AvatarMotion,
  type AvatarHit,
} from '@/lib/agent-design';
import { appearance } from '@/lib/world-model';
import {
  cycleDuration,
  sampleAgents,
  regions,
  seeded,
  regionFor,
  collaborationPose,
  stageAt,
  phaseProgress,
  skillColors,
  weathers,
  type Weather,
} from '@/lib/civilization-model';
export type Hit = AvatarHit;
type Props = {
  agents: Agent[];
  ignixIds: string[];
  details: Record<string, Detail>;
  time: number;
  paused: boolean;
  speed: number;
  weather: Weather;
  selected: number | null;
  zoom: number;
  team: Agent[];
  hits: MutableRefObject<Hit[]>;
  population: number;
  activeEventRegion?: number;
  regionIndex?: number;
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
    let raf = 0,
      previous = 0;
    let lastFrame = '';
    let baseTime = -1,
      baseStamp = 0;
    const frameInterval = matchMedia('(pointer:coarse)').matches ? 30 : 15;
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
    const drawComputeWorld = (t: number, focus?: number) => {
      const background = ctx.createLinearGradient(0, 0, 0, 900);
      background.addColorStop(0, '#07101C');
      background.addColorStop(0.46, '#101B25');
      background.addColorStop(1, '#181311');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1600, 900);

      const horizon = ctx.createRadialGradient(800, 260, 10, 800, 260, 820);
      horizon.addColorStop(0, '#8FCDE926');
      horizon.addColorStop(0.42, '#31546D18');
      horizon.addColorStop(1, '#02060A00');
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 0, 1600, 900);

      for (let i = 0; i < 180; i++) {
        const x = (i * 197) % 1600,
          y = 38 + ((i * 83) % 280),
          flicker = 0.24 + 0.22 * Math.sin(t * 0.35 + i);
        dot(x, y, i % 9 === 0 ? 1.4 : 0.7, `rgba(204,235,255,${flicker})`);
      }

      ctx.save();
      ctx.strokeStyle = '#78BFD51F';
      ctx.lineWidth = 1;
      const vanishingX = 800,
        vanishingY = 245;
      for (let x = -500; x <= 2100; x += 95) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(x, 900);
        ctx.stroke();
      }
      for (let row = 1; row <= 17; row++) {
        const y = vanishingY + Math.pow(row / 17, 1.72) * 655;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1600, y);
        ctx.stroke();
      }
      ctx.restore();

      // Repeated horizon modules continue beyond the navigable map.
      for (let i = 0; i < 17; i++) {
        const x = -80 + i * 108,
          y = 315 + (i % 3) * 18,
          w = 64 + (i % 2) * 18;
        ctx.globalAlpha = 0.2 + (i % 4) * 0.035;
        ctx.fillStyle = '#9EA9AF';
        ctx.beginPath();
        ctx.roundRect(x, y, w, 27, 7);
        ctx.fill();
        ctx.fillStyle = '#071019';
        ctx.fillRect(x + 9, y + 9, w - 18, 8);
      }
      ctx.globalAlpha = 1;

      const center = regions[0];
      regions.slice(1).forEach((region, index) => {
        const startX = center.x * 1600,
          startY = center.y * 900 - 70,
          endX = region.x * 1600,
          endY = region.y * 900;
        for (let strand = 0; strand < 5; strand++) {
          ctx.beginPath();
          ctx.moveTo(startX + (strand - 2) * 3, startY);
          ctx.bezierCurveTo(
            startX + (endX - startX) * 0.24,
            startY - 120 - strand * 4,
            startX + (endX - startX) * 0.72,
            endY - 90 + strand * 5,
            endX + (strand - 2) * 3,
            endY,
          );
          ctx.strokeStyle = [
            '#8DE5FF66',
            '#DDFBFF78',
            '#8CE8CA66',
            '#FFD29166',
            '#8DE5FF55',
          ][(index + strand) % 5];
          ctx.lineWidth = strand === 1 ? 1.8 : 0.8;
          ctx.stroke();
        }
      });

      const drawModule = (n: number) => {
        const region = regions[n],
          x = region.x * 1600,
          y = region.y * 900,
          radius = n === 0 ? 112 : 69,
          selected = focus === n;
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowColor = selected ? region.color : '#00000099';
        ctx.shadowBlur = selected ? 34 : 18;
        ctx.fillStyle = '#02070BBB';
        ctx.beginPath();
        ctx.ellipse(
          0,
          radius * 0.48,
          radius * 1.08,
          radius * 0.38,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        const alloy = ctx.createLinearGradient(
          -radius,
          -radius,
          radius,
          radius,
        );
        alloy.addColorStop(0, '#F5F6F5');
        alloy.addColorStop(0.34, '#AAB2B7');
        alloy.addColorStop(0.72, '#59636B');
        alloy.addColorStop(1, '#1C252D');
        ctx.fillStyle = alloy;
        ctx.beginPath();
        ctx.roundRect(
          -radius,
          -radius * 0.48,
          radius * 2,
          radius * 0.92,
          radius * 0.24,
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#111C22';
        ctx.beginPath();
        ctx.roundRect(
          -radius * 0.83,
          -radius * 0.62,
          radius * 1.66,
          radius * 0.78,
          radius * 0.2,
        );
        ctx.fill();
        ctx.strokeStyle = '#EAF7FF55';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const board = ctx.createRadialGradient(
          0,
          -radius * 0.23,
          2,
          0,
          0,
          radius,
        );
        board.addColorStop(0, region.color + '55');
        board.addColorStop(0.45, '#173330');
        board.addColorStop(1, '#0A1719');
        ctx.fillStyle = board;
        ctx.beginPath();
        ctx.ellipse(
          0,
          -radius * 0.2,
          radius * 0.7,
          radius * 0.34,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.strokeStyle = region.color + 'AA';
        ctx.lineWidth = selected ? 2.4 : 1.3;
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI * 2) / 12,
            px = Math.cos(a) * radius * 0.58,
            py = -radius * 0.2 + Math.sin(a) * radius * 0.25;
          ctx.fillStyle = i % 3 ? '#18252C' : region.color;
          ctx.beginPath();
          ctx.roundRect(px - 4, py - 3, 8, 6, 2);
          ctx.fill();
        }

        ctx.strokeStyle = region.color + 'AA';
        ctx.fillStyle = '#050B10';
        ctx.lineWidth = 1.5;
        if (n === 3) {
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.roundRect(i * 15 - 6, -radius * 0.55, 12, radius * 0.55, 3);
            ctx.fill();
            ctx.stroke();
          }
        } else if (n === 4) {
          for (const px of [-22, 22])
            for (const py of [-radius * 0.34, -radius * 0.02]) {
              ctx.beginPath();
              ctx.arc(px, py, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              for (let blade = 0; blade < 6; blade++) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(
                  px + Math.cos(blade * 1.047 + t * 0.12) * 8,
                  py + Math.sin(blade * 1.047 + t * 0.12) * 8,
                );
                ctx.stroke();
              }
            }
        } else if (n === 5) {
          for (const px of [-23, 23]) {
            ctx.beginPath();
            ctx.arc(px, -radius * 0.2, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(-6, -radius * 0.2);
          ctx.lineTo(6, -radius * 0.2);
          ctx.stroke();
        } else if (n === 6) {
          ctx.beginPath();
          ctx.moveTo(0, -radius * 0.57);
          ctx.lineTo(23, -radius * 0.42);
          ctx.lineTo(17, -radius * 0.08);
          ctx.lineTo(0, 3);
          ctx.lineTo(-17, -radius * 0.08);
          ctx.lineTo(-23, -radius * 0.42);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (n === 7 || n === 9) {
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(
              0,
              -radius * 0.25,
              17 + i * 10,
              8 + i * 5,
              0,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(0, -radius * 0.72);
          ctx.lineTo(0, 5);
          ctx.stroke();
        } else if (n === 8) {
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(
              0,
              -radius * 0.2,
              12 + i * 8,
              5 + i * 4,
              0,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
        } else {
          const cells = n === 0 ? 9 : 4;
          for (let i = 0; i < cells; i++) {
            const cols = n === 0 ? 3 : 2,
              px = (i % cols) * 18 - ((cols - 1) * 18) / 2,
              py = Math.floor(i / cols) * 13 - radius * 0.42;
            ctx.fillStyle = i % 2 ? region.color + 'CC' : '#071018';
            ctx.beginPath();
            ctx.roundRect(px - 7, py - 5, 14, 10, 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        ctx.fillStyle = '#0B1116';
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(
            -radius * 0.72 + i * radius * 0.16,
            radius * 0.23,
            radius * 0.07,
            3,
          );
        }
        ctx.restore();
      };
      const depthOrder = regions
        .map((_, index) => index)
        .sort((a, b) => regions[a].y - regions[b].y);
      depthOrder.forEach(drawModule);

      const coreX = center.x * 1600,
        coreY = center.y * 900 - 58;
      for (let strand = 0; strand < 24; strand++) {
        ctx.beginPath();
        ctx.moveTo(coreX + (strand - 12) * 1.4, coreY + 30);
        ctx.bezierCurveTo(
          coreX + Math.sin(strand * 1.7) * 24,
          coreY - 120,
          coreX + Math.cos(strand * 1.2) * 34,
          135,
          coreX + (strand - 12) * 3.2,
          -20,
        );
        ctx.strokeStyle = strand % 4 === 0 ? '#FFE0A788' : '#A9EEFF66';
        ctx.lineWidth = strand % 5 === 0 ? 2 : 0.8;
        ctx.stroke();
      }
    };
    const actor = (
      x: number,
      y: number,
      variant: number,
      size: number,
      motion?: AvatarMotion,
    ) => {
      ctx.save();
      ctx.translate(x, y - (motion?.bob ?? 0) * 18);
      if (motion) ctx.rotate(motion.stride * 0.04 + motion.headTilt * 0.4);
      drawVectorAgent(
        ctx,
        variant,
        -size / 2,
        -size * 1.22,
        size,
        (size * 4) / 3,
        motion,
      );
      ctx.restore();
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
      if (stamp - previous < frameInterval) return;
      previous = stamp;
      const p = latest.current;
      if (baseTime !== p.time) {
        baseTime = p.time;
        baseStamp = stamp;
      }
      const t =
          p.time +
          (p.paused ? 0 : Math.min(0.11, (stamp - baseStamp) / 1000) * p.speed),
        c = regions[0],
        weather = weathers[p.weather],
        phase = stageAt(t),
        ct = ((t % cycleDuration) * 80) / cycleDuration;
      const frameKey = [
        t,
        p.weather,
        p.zoom,
        p.selected,
        p.activeEventRegion,
        p.regionIndex,
      ].join(':');
      if (lastFrame === frameKey && lastAgents === p.agents) return;
      lastFrame = frameKey;
      lastAgents = p.agents;
      ctx.clearRect(0, 0, 1600, 900);
      if (p.regionIndex !== undefined) drawComputeWorld(t, p.regionIndex);
      p.hits.current = [];
      if (p.activeEventRegion !== undefined) {
        const r = regions[p.activeEventRegion];
        glow(r.x * 1600, r.y * 900, 100, '#c3d997', 0.5);
        ctx.strokeStyle = '#83aa7d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          r.x * 1600,
          r.y * 900,
          75 + Math.sin(t * 3) * 4,
          32 + Math.sin(t * 3) * 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
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
      // Close views reveal shared crypto workflow props; the overview stays quiet.
      regions.forEach((r, n) => {
        if (p.zoom < 1.7 && n !== 5 && n !== 6) return;
        const task = cryptoTaskState(n, t),
          x = r.x * 1600 + (n === 0 ? 122 : 43),
          y = r.y * 900 + 22;
        ctx.save();
        ctx.strokeStyle = task.color + '77';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y, 27, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let j = 0; j < 2; j++) {
          const px = x + (j === 0 ? task.left : task.right) * 18,
            py = y - 10 - task.lift * 5;
          ctx.globalAlpha = task.visibility;
          ctx.fillStyle = j === 0 ? task.color : '#f5edd8';
          ctx.strokeStyle = task.color;
          ctx.beginPath();
          ctx.roundRect(px - 5, py - 5, 10, 10, 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (task.receipt > 0.02) {
          ctx.fillStyle = '#e5d7a9';
          ctx.fillRect(x - 4, y - 18 - task.receipt * 12, 8, 5);
        }
        if (p.zoom > 1.7) {
          text(task.asset, x, y - 29, task.color, 12);
          for (let j = 0; j < 3; j++) {
            ctx.fillStyle = j === task.step ? task.color : task.color + '44';
            ctx.fillRect(x - 16 + j * 12, y + 17, 8, j === task.step ? 4 : 2);
          }
          text(task.label + ' · Demo', x, y + 38, '#A9C3CA', 12);
        }
        ctx.restore();
      });
      const states = sampleAgents(
        p.agents,
        p.details,
        t,
        p.weather,
        p.population,
      );
      for (const a of states.filter((a) => !a.collaborator)) {
        const x = a.x * 1600,
          y = a.y * 900,
          chosen = p.selected === a.instance,
          actorSize = chosen ? 42 : p.zoom > 2 ? 36 : 30;
        actor(
          x,
          y,
          a.variant,
          actorSize,
          avatarMotion(t, a.instance, phase, 0, false, a.activity === '移动中'),
        );

        if (p.ignixIds.includes(a.agentId)) {
          ctx.fillStyle = '#254E41';
          ctx.beginPath();
          ctx.roundRect(x + actorSize * 0.18, y - actorSize * 1.18, 15, 13, 4);
          ctx.fill();
          text(
            'ig',
            x + actorSize * 0.18 + 7.5,
            y - actorSize * 1.18 + 10,
            '#EFF7D6',
            10,
          );
        }
        if (chosen) {
          ctx.strokeStyle = '#aa8241';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(x, y + 7, 18, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          text(a.name, x, y - 38, '#EAF7FA', 14);
        }
        p.hits.current.push({
          x,
          y,
          width: actorSize,
          height: actorSize * 1.22,
          instance: a.instance,
          agentId: a.agentId,
        });
      }
      // Collaboration is an explicit animated state machine, not a claimed live task.
      const cx = c.x * 1600,
        cy = c.y * 900;
      ctx.strokeStyle = '#607f8760';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 97, 52, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < p.team.length; i++) {
        const pos = collaborationPose(t, i),
          x = pos.x * 1600,
          y = pos.y * 900;
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
        actor(
          x,
          y,
          teamVariants[i],
          phase >= 3 && phase <= 6 ? 43 : 39,
          avatarMotion(
            t,
            i,
            phase,
            phaseProgress(t),
            true,
            phase === 1 || phase === 2 || phase >= 7,
          ),
        );
        if (p.zoom > 1.5 || phase === 4)
          text(
            skillNamesLocal[i],
            x,
            y + 30,
            working ? '#F4FBFD' : skillColors[i],
            12,
          );
        if (p.selected === i) {
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
            width: phase >= 3 && phase <= 6 ? 43 : 39,
            height: (phase >= 3 && phase <= 6 ? 43 : 39) * 1.22,
            instance: i,
            agentId: p.team[i].agentId,
          });
      }
      if (phase === 0 || phase === 1) {
        text('需要风险 · 审计 · 执行能力', cx, cy - 63, '#DCEFF4', 15);
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
        text('STRATEGY AGENT', cx, cy - 68, '#DFF7FA', 14);
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
        text('经验 +1 · 技能积累', cx, cy + 22, '#DFF7FA', 15);
      }
      if (p.weather !== 'calm')
        text(weather.asset, mx, my - 27, weather.color, 14);
      // Session-driven ecology growth: new network nodes emerge rather than invented source metrics.
      const generation = Math.min(6, Math.floor(t / cycleDuration));
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
