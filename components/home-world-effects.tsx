'use client';
import { useEffect, useRef } from 'react';
import { drawAvatarSprite } from '@/lib/avatar-sprite';
import { weathers, type Weather } from '@/lib/civilization-model';
import { agentVariant } from '@/lib/agent-design';
import type { Agent } from '@/lib/marketplace';

type Props = {
  time: number;
  paused: boolean;
  speed: number;
  weather: Weather;
  stage: number;
  activeEventRegion?: number;
  relationshipCount: number;
  agents: Agent[];
};

const center = { x: 800, y: 472 };
const nodes = [
  center,
  { x: 538, y: 326 },
  { x: 265, y: 395 },
  { x: 227, y: 548 },
  { x: 354, y: 697 },
  { x: 805, y: 716 },
  { x: 1235, y: 697 },
  { x: 1371, y: 548 },
  { x: 1307, y: 397 },
  { x: 1051, y: 326 },
];

const seeded = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const pointOnCurve = (
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
  t: number,
) => ({
  x: (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x,
  y: (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y,
});

export default function HomeWorldEffects(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = 2400;
    canvas.height = 1350;
    ctx.scale(1.5, 1.5);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    let raf = 0;
    let previous = -Infinity;
    let baseTime = latest.current.time;
    let baseStamp = performance.now();
    let wasPaused = latest.current.paused;
    const glowSprites = new Map<string, HTMLCanvasElement>();
    const atlasImage = new Image();
    let atlasReady = false;
    atlasImage.onload = () => {
      atlasReady = true;
    };
    atlasImage.src = '/agent-diverse-atlas.png';

    const glow = (
      x: number,
      y: number,
      radius: number,
      color: string,
      alpha: number,
    ) => {
      let sprite = glowSprites.get(color);
      if (!sprite) {
        sprite = document.createElement('canvas');
        sprite.width = 96;
        sprite.height = 96;
        const spriteContext = sprite.getContext('2d')!;
        const gradient = spriteContext.createRadialGradient(
          48,
          48,
          0,
          48,
          48,
          48,
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        spriteContext.fillStyle = gradient;
        spriteContext.fillRect(0, 0, 96, 96);
        glowSprites.set(color, sprite);
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
    };

    const drawProfileAgent = (
      x: number,
      y: number,
      index: number,
      time: number,
      agent: Agent,
    ) => {
      if (!atlasReady) return;
      const bob = Math.sin(time * 5 + index) * 1.4;
      const depth = 0.84 + Math.max(0, Math.min(1, (y - 250) / 520)) * 0.28;
      const width = 39 * depth;
      const height = 54 * depth;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(x, y + bob);
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = '#02060A72';
      ctx.beginPath();
      ctx.ellipse(0, 2.5, width * 0.31, height * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#9EEFFF';
      ctx.shadowBlur = 4;
      drawAvatarSprite(
        ctx,
        atlasImage,
        agentVariant(agent),
        -width / 2,
        -height + 4,
        width,
        height,
      );
      ctx.restore();
    };

    const draw = (stamp: number) => {
      raf = requestAnimationFrame(draw);
      const frameInterval = coarse ? 32 : 16;
      if (stamp - previous < frameInterval) return;
      previous = stamp;
      const state = latest.current;
      if (state.paused !== wasPaused) {
        baseTime = state.time;
        baseStamp = stamp;
        wasPaused = state.paused;
      } else if (Math.abs(state.time - baseTime) > 0.4) {
        baseTime = state.time;
        baseStamp = stamp;
      }
      const time =
        reduced || state.paused
          ? state.time
          : baseTime + ((stamp - baseStamp) / 1000) * state.speed;
      const theme = weathers[state.weather].color;
      ctx.clearRect(0, 0, 1600, 900);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Fine atmospheric dust makes the still environment visibly breathe.
      const dustCount = coarse ? 32 : 72;
      for (let i = 0; i < dustCount; i++) {
        const depth = 0.3 + seeded(i + 4) * 0.7;
        const x =
          ((seeded(i + 22) * 1700 + time * (2.5 + depth * 4)) % 1700) - 50;
        const y = 170 + seeded(i + 81) * 610 + Math.sin(time * 0.3 + i) * 4;
        ctx.fillStyle = i % 8 === 0 ? '#FFD5A780' : '#A8E8F350';
        ctx.globalAlpha =
          (0.16 + depth * 0.3) * (0.75 + Math.sin(time + i) * 0.2);
        ctx.beginPath();
        ctx.arc(x, y, depth * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // The central fibre trunk gains independent strands and travelling packets.
      ctx.save();
      ctx.shadowBlur = 9;
      for (let strand = 0; strand < (coarse ? 10 : 22); strand++) {
        const offset = (strand - 10.5) * 4.1;
        const sway = Math.sin(time * 0.45 + strand * 1.7) * (4 + (strand % 4));
        ctx.beginPath();
        ctx.moveTo(center.x + offset * 0.38, center.y + 10);
        ctx.bezierCurveTo(
          center.x + offset * 0.48 + sway,
          350,
          center.x + offset + sway * 0.4,
          175,
          center.x + offset * 0.8,
          -20,
        );
        ctx.strokeStyle = strand % 4 === 0 ? '#FFE2B990' : '#9EEBFF82';
        ctx.shadowColor = strand % 4 === 0 ? '#FFC47B' : '#63DFFF';
        ctx.lineWidth = strand % 5 === 0 ? 1.4 : 0.65;
        ctx.stroke();
        const packet =
          (time * (0.08 + (strand % 4) * 0.012) + seeded(strand)) % 1;
        const packetY = center.y - packet * 530;
        const packetX =
          center.x +
          offset * (0.4 + packet * 0.4) +
          Math.sin(packet * 8 + strand) * 4;
        glow(
          packetX,
          packetY,
          8,
          strand % 4 === 0 ? '#FFD39D' : '#B4F4FF',
          0.3,
        );
      }
      ctx.restore();

      // Existing physical routes become active data fibres without covering the image.
      nodes.slice(1).forEach((node, index) => {
        const control = {
          x: center.x + (node.x - center.x) * 0.47,
          y:
            center.y +
            (node.y - center.y) * 0.2 +
            (node.y < center.y ? -24 : 18),
        };
        ctx.beginPath();
        ctx.moveTo(center.x, center.y + 8);
        ctx.quadraticCurveTo(control.x, control.y, node.x, node.y);
        ctx.strokeStyle = index % 3 === 0 ? '#FFE0A140' : '#80E7FF46';
        ctx.lineWidth = 1.1;
        ctx.shadowColor = index % 3 === 0 ? '#FFC774' : '#63DDF8';
        ctx.shadowBlur = 5;
        ctx.stroke();
        const packetCount = coarse
          ? 1
          : 2 + Math.min(1, Math.floor(state.relationshipCount / 12));
        for (let packet = 0; packet < packetCount; packet++) {
          const progress =
            (time * (0.055 + index * 0.002) +
              packet / packetCount +
              seeded(index + 40)) %
            1;
          const position = pointOnCurve(center, control, node, progress);
          glow(
            position.x,
            position.y,
            10,
            index % 3 === 0 ? '#FFD197' : '#A9F3FF',
            0.35,
          );
          ctx.fillStyle = index % 3 === 0 ? '#FFE6BC' : '#C4F7FF';
          ctx.beginPath();
          ctx.arc(position.x, position.y, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Named identities become visible after entering; the overview shows their
      // shared civilization as small workers moving on the same data routes.
      const workerCount = Math.min(coarse ? 5 : 11, state.agents.length);
      for (let worker = 0; worker < workerCount; worker++) {
        const nodeIndex = worker % 9;
        const node = nodes[nodeIndex + 1];
        const control = {
          x: center.x + (node.x - center.x) * 0.47,
          y:
            center.y +
            (node.y - center.y) * 0.2 +
            (node.y < center.y ? -24 : 18),
        };
        let progress =
          (seeded(worker + 320) + time * (0.011 + (worker % 3) * 0.002)) % 1;
        const direction = worker % 2 ? -1 : 1;
        if (direction < 0) progress = 1 - progress;
        const position = pointOnCurve(center, control, node, progress);
        drawProfileAgent(
          position.x,
          position.y - 5,
          worker,
          time,
          state.agents[worker],
        );
      }

      // Each compute station has a restrained breathing status ring.
      nodes.forEach((node, index) => {
        const active = state.activeEventRegion === index;
        const pulse = 0.5 + Math.sin(time * 1.2 + index * 0.8) * 0.5;
        ctx.save();
        ctx.translate(node.x, node.y - (index === 0 ? 20 : 17));
        ctx.scale(1, 0.36);
        ctx.strokeStyle = active
          ? theme + 'DD'
          : index === 0
            ? '#FFE0A58A'
            : '#8EEBFA55';
        ctx.lineWidth = active ? 3 : 1.2;
        ctx.shadowColor = active ? theme : index === 0 ? '#FFC46F' : '#66DDF8';
        ctx.shadowBlur = active ? 25 : 10 + pulse * 6;
        ctx.beginPath();
        ctx.arc(0, 0, (index === 0 ? 80 : 37) + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // The collaboration core responds to the shared 18-second work stage.
      const stagePulse = 0.5 + Math.sin(time * 2.1) * 0.5;
      glow(
        center.x,
        center.y - 14,
        95 + stagePulse * 22,
        theme,
        0.08 + state.stage * 0.008,
      );
      ctx.save();
      ctx.translate(center.x, center.y - 24);
      ctx.scale(1, 0.34);
      ctx.rotate(time * 0.06);
      ctx.setLineDash([18, 24]);
      ctx.strokeStyle = '#D6F7FF90';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 104 + stagePulse * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Small service craft create life in the empty atmospheric layer.
      const craftCount = coarse ? 2 : 5;
      for (let i = 0; i < craftCount; i++) {
        const progress = (time * (0.012 + i * 0.0015) + seeded(i + 200)) % 1;
        const direction = i % 2 ? -1 : 1;
        const x =
          direction > 0 ? -80 + progress * 1760 : 1680 - progress * 1760;
        const y = 115 + i * 29 - Math.sin(progress * Math.PI) * (35 + i * 4);
        const craftScale = 0.45 + i * 0.06;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(direction * craftScale, craftScale);
        ctx.shadowColor = '#80E8FF';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#DCE9EBB8';
        ctx.beginPath();
        ctx.roundRect(-17, -4, 34, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#75E5FF';
        ctx.fillRect(-11, -2, 13, 3);
        ctx.strokeStyle = '#84E5FF66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-58, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={canvasRef} className="home-world-effects" aria-hidden="true" />
  );
}
