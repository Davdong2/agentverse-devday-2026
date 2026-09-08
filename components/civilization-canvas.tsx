'use client';
import { drawVectorAgent } from '@/lib/vector-agent';
import { drawAvatarSprite } from '@/lib/avatar-sprite';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Agent, Detail } from '@/lib/marketplace';
import { cryptoTaskState } from '@/lib/crypto-world';
import {
  agentDesigns,
  avatarMotion,
  teamVariants,
  type AvatarMotion,
  type AvatarHit,
} from '@/lib/agent-design';
import { appearance } from '@/lib/world-model';
import {
  closeupPopulationLimit,
  closeupSlot,
  regionCloseupBlueprints,
} from '@/lib/region-closeup';
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
  viewportWidth: number;
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
    let referenceAtlas: HTMLImageElement | null = null;
    const atlasImage = new Image();
    atlasImage.onload = () => {
      referenceAtlas = atlasImage;
      lastFrame = '';
    };
    atlasImage.src = '/agent-diverse-atlas.png';
    canvas.width = 3200;
    canvas.height = 1800;
    ctx.scale(2, 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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
      if (referenceAtlas)
        drawAvatarSprite(
          ctx,
          referenceAtlas,
          variant,
          -size / 2,
          -size * 1.22,
          size,
          (size * 4) / 3,
        );
      else
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
    const capsule = (
      value: string,
      x: number,
      y: number,
      color: string,
      size = 12,
      padding = 9,
    ) => {
      ctx.save();
      ctx.font = `500 ${size}px Arial, sans-serif`;
      const width = ctx.measureText(value).width + padding * 2;
      ctx.fillStyle = '#071016E8';
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - width / 2, y - size - 8, width, size + 14, 8);
      ctx.fill();
      ctx.stroke();
      text(value, x, y, '#EAF5F6', size);
      ctx.restore();
    };
    const localFiber = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      color: string,
      t: number,
      seedValue: number,
    ) => {
      ctx.save();
      ctx.strokeStyle = color + '75';
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.bezierCurveTo(ax, ay + 70, bx, by - 85, bx, by);
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.13 + i / 3 + seedValue * 0.17) % 1,
          v = 1 - u,
          cx1 = ax,
          cy1 = ay + 70,
          cx2 = bx,
          cy2 = by - 85,
          x =
            v * v * v * ax +
            3 * v * v * u * cx1 +
            3 * v * u * u * cx2 +
            u * u * u * bx,
          y =
            v * v * v * ay +
            3 * v * v * u * cy1 +
            3 * v * u * u * cy2 +
            u * u * u * by;
        dot(x, y, i === 0 ? 3.2 : 2, '#F4FFFF');
      }
      ctx.restore();
    };
    const drawHabitatInstrument = (
      regionIndex: number,
      x: number,
      y: number,
      t: number,
    ) => {
      const blueprint = regionCloseupBlueprints[regionIndex],
        color = regions[regionIndex].color,
        pulse = (Math.sin(t * 1.8) + 1) / 2;
      ctx.save();
      ctx.translate(x, y);

      // The instrument is a shared organ used by Agents, embedded in the deck.
      const halo = ctx.createRadialGradient(0, 0, 3, 0, 0, 165);
      halo.addColorStop(0, color + '4F');
      halo.addColorStop(0.52, color + '12');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.fillRect(-180, -165, 360, 330);
      ctx.strokeStyle = color + '7A';
      ctx.lineWidth = 1.5;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        ctx.ellipse(0, 14, 102 + ring * 25, 38 + ring * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (blueprint.feature === 'compute') {
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(side * 54, -14, 38, 0, Math.PI * 2);
          ctx.fillStyle = '#071014';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.stroke();
          for (let blade = 0; blade < 7; blade++) {
            const a = blade * 0.897 + t * (side * 0.72);
            ctx.beginPath();
            ctx.moveTo(side * 54, -14);
            ctx.quadraticCurveTo(
              side * 54 + Math.cos(a + 0.35) * 15,
              -14 + Math.sin(a + 0.35) * 15,
              side * 54 + Math.cos(a) * 30,
              -14 + Math.sin(a) * 30,
            );
            ctx.stroke();
          }
        }
      } else if (blueprint.feature === 'security') {
        ctx.fillStyle = '#071014';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -74);
        ctx.lineTo(58, -48);
        ctx.lineTo(46, 28);
        ctx.lineTo(0, 66);
        ctx.lineTo(-46, 28);
        ctx.lineTo(-58, -48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.lineTo(-4, 13);
        ctx.lineTo(25, -22);
        ctx.stroke();
      } else if (blueprint.feature === 'reality') {
        for (let ring = 0; ring < 4; ring++) {
          ctx.strokeStyle = color + (ring === 0 ? 'CC' : '66');
          ctx.beginPath();
          ctx.ellipse(0, -12, 37 + ring * 19, 55 + ring * 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#DCEAFF';
        ctx.beginPath();
        ctx.arc(0, -18, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6F98B7';
        ctx.beginPath();
        ctx.arc(8, -24, 13, -0.5, 2.2);
        ctx.fill();
      } else if (blueprint.feature === 'memory') {
        for (let i = 0; i < 5; i++) {
          const yy = 37 - i * 24;
          ctx.fillStyle =
            i === Math.floor((t * 0.45) % 5) ? color + 'AA' : '#101B22';
          ctx.strokeStyle = color + '88';
          ctx.beginPath();
          ctx.roundRect(-72 + i * 6, yy - 24, 144 - i * 12, 19, 5);
          ctx.fill();
          ctx.stroke();
        }
      } else if (blueprint.feature === 'energy') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(19, -79);
        ctx.lineTo(-29, -5);
        ctx.lineTo(8, -5);
        ctx.lineTo(-18, 67);
        ctx.lineTo(44, -20);
        ctx.lineTo(8, -20);
        ctx.closePath();
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = i * 1.256 + t * 0.25;
          dot(Math.cos(a) * 86, 2 + Math.sin(a) * 34, 4, color);
        }
      } else if (blueprint.feature === 'unknown') {
        ctx.strokeStyle = color;
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate(t * 0.04 + i * 1.047);
          ctx.strokeRect(22 + i * 7, -8, 18, 16);
          ctx.restore();
        }
        glow(0, 0, 70 + pulse * 16, color, 0.2);
        text('?', 0, 17, '#EAF3F5', 55);
      } else {
        const count = blueprint.feature === 'market' ? 4 : 7;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + t * 0.08,
            radius = blueprint.feature === 'genesis' ? 45 + i * 5 : 74,
            px = Math.cos(a) * radius,
            py = -6 + Math.sin(a) * radius * 0.43;
          ctx.fillStyle =
            blueprint.feature === 'collaboration'
              ? skillColors[i % skillColors.length]
              : i % 2
                ? color
                : '#EAF8F7';
          ctx.strokeStyle = '#F5FFFFAA';
          ctx.beginPath();
          ctx.roundRect(px - 13, py - 13, 26, 26, 7);
          ctx.fill();
          ctx.stroke();
        }
        if (blueprint.feature === 'research') {
          ctx.strokeStyle = '#E9F8FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-8, -14, 27, 0, Math.PI * 2);
          ctx.moveTo(12, 7);
          ctx.lineTo(42, 37);
          ctx.stroke();
        }
      }
      text(blueprint.system, 0, -112, '#EAF4F5', 13);
      text(blueprint.deck, 0, -91, '#9CB2B7', 12);
      ctx.restore();
    };
    const drawAgentHabitat = (
      p: Props,
      t: number,
      phase: number,
      phaseValue: number,
    ) => {
      const regionIndex = p.regionIndex ?? 0,
        region = regions[regionIndex],
        blueprint = regionCloseupBlueprints[regionIndex],
        focusX = 915,
        focusY = 330;

      const background = ctx.createLinearGradient(0, 0, 0, 900);
      background.addColorStop(0, '#091523');
      background.addColorStop(0.48, '#12252F');
      background.addColorStop(1, '#211A15');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1600, 900);

      const atmosphere = ctx.createRadialGradient(
        focusX,
        360,
        20,
        focusX,
        360,
        720,
      );
      atmosphere.addColorStop(0, region.color + '28');
      atmosphere.addColorStop(0.46, '#18354519');
      atmosphere.addColorStop(1, '#02050800');
      ctx.fillStyle = atmosphere;
      ctx.fillRect(250, 0, 1350, 900);

      // A continuing habitat replaces the old finite grid of thumbnail nodes.
      for (let i = 0; i < 28; i++) {
        const x = 300 + ((i * 173) % 1420),
          y = 170 + ((i * 67) % 190),
          w = 48 + (i % 4) * 18,
          h = 90 + (i % 5) * 25;
        ctx.globalAlpha = 0.16 + (i % 4) * 0.025;
        const tower = ctx.createLinearGradient(x, y, x + w, y + h);
        tower.addColorStop(0, '#E8ECEB');
        tower.addColorStop(0.32, '#6E7D84');
        tower.addColorStop(1, '#182329');
        ctx.fillStyle = tower;
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - h, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = i % 3 === 0 ? region.color : '#A7C9D0';
        ctx.lineWidth = 1;
        for (let band = 0; band < 3; band++)
          ctx.strokeRect(x - w / 2 + 7, y - h + 17 + band * 18, w - 14, 5);
      }
      ctx.globalAlpha = 1;

      const horizonFade = ctx.createLinearGradient(0, 270, 0, 470);
      horizonFade.addColorStop(0, '#07101600');
      horizonFade.addColorStop(1, '#071016D9');
      ctx.fillStyle = horizonFade;
      ctx.fillRect(0, 260, 1600, 230);

      // Precision-milled host deck. The material supports the Agent habitat.
      ctx.save();
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 45;
      ctx.fillStyle = '#03070A';
      ctx.beginPath();
      ctx.ellipse(focusX, 738, 570, 168, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      const alloy = ctx.createLinearGradient(420, 430, 1370, 820);
      alloy.addColorStop(0, '#F5F6F3');
      alloy.addColorStop(0.18, '#AEB8BC');
      alloy.addColorStop(0.51, '#4F5A61');
      alloy.addColorStop(0.82, '#C9CFCE');
      alloy.addColorStop(1, '#29343A');
      ctx.fillStyle = alloy;
      ctx.beginPath();
      ctx.ellipse(focusX, 650, 545, 208, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#091218';
      ctx.beginPath();
      ctx.ellipse(focusX, 625, 505, 178, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E7F6FA42';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let ring = 0; ring < 4; ring++) {
        ctx.strokeStyle = ring === 1 ? region.color + 'A0' : '#C6E7EE2B';
        ctx.lineWidth = ring === 1 ? 3 : 1;
        ctx.beginPath();
        ctx.ellipse(
          focusX,
          625,
          425 - ring * 58,
          142 - ring * 18,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      for (let i = 0; i < 44; i++) {
        const a = (i / 44) * Math.PI * 2,
          x = focusX + Math.cos(a) * 469,
          y = 627 + Math.sin(a) * 159;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = i % 4 === 0 ? region.color : '#0B1419';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      }
      ctx.restore();

      // One fiber trunk arrives from the shared world and branches to actual Agents.
      for (let strand = 0; strand < 18; strand++) {
        ctx.strokeStyle = strand % 4 === 0 ? region.color + 'A8' : '#AEEBFA5F';
        ctx.lineWidth = strand % 5 === 0 ? 2.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(focusX + (strand - 9) * 3.1, -30);
        ctx.bezierCurveTo(
          focusX + Math.sin(strand * 1.4) * 55,
          120,
          focusX + Math.cos(strand * 1.1) * 45,
          230,
          focusX + (strand - 9) * 1.3,
          focusY - 70,
        );
        ctx.stroke();
      }
      glow(focusX, focusY, 180, region.color, 0.12);
      drawHabitatInstrument(regionIndex, focusX, focusY, t);

      const states = sampleAgents(
          p.agents,
          p.details,
          t,
          p.weather,
          p.population,
        ),
        sources = new Map(p.agents.map((agent) => [agent.agentId, agent])),
        resident = (state: (typeof states)[number]) => {
          const source = sources.get(state.agentId);
          return source
            ? regionFor(source, p.details[source.agentId]) === regionIndex
            : false;
        },
        distance = (state: (typeof states)[number]) =>
          Math.hypot(state.x - region.x, state.y - region.y),
        localStates = [...states]
          .sort((a, b) => {
            if (regionIndex === 0 && a.collaborator !== b.collaborator)
              return Number(b.collaborator) - Number(a.collaborator);
            if (resident(a) !== resident(b))
              return Number(resident(b)) - Number(resident(a));
            return distance(a) - distance(b);
          })
          .slice(0, closeupPopulationLimit(p.viewportWidth));

      for (let i = localStates.length - 1; i >= 0; i--) {
        const state = localStates[i],
          slot = closeupSlot(i),
          actorSize = 102 * slot.scale,
          color = agentDesigns[state.variant]?.color ?? region.color;
        localFiber(focusX, focusY + 78, slot.x, slot.y + 4, color, t, i);
        ctx.save();
        ctx.globalAlpha = i === 0 ? 0.3 : 0.16;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(
          slot.x,
          slot.y + 8,
          actorSize * 0.55,
          actorSize * 0.16,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
        actor(
          slot.x,
          slot.y,
          state.variant,
          actorSize,
          avatarMotion(
            t,
            state.instance,
            phase,
            phaseValue,
            state.collaborator,
            state.activity === '移动中',
          ),
        );
        capsule(
          state.name.length > 20 ? state.name.slice(0, 19) + '…' : state.name,
          slot.x,
          slot.y - actorSize * 1.43,
          color,
          i === 0 ? 14 : 12,
          i === 0 ? 12 : 9,
        );
        if (p.ignixIds.includes(state.agentId)) {
          ctx.fillStyle = '#365F50';
          ctx.beginPath();
          ctx.roundRect(
            slot.x + actorSize * 0.29,
            slot.y - actorSize * 1.2,
            19,
            16,
            5,
          );
          ctx.fill();
          text(
            'ig',
            slot.x + actorSize * 0.29 + 9.5,
            slot.y - actorSize * 1.2 + 12,
            '#F0F9D8',
            10,
          );
        }
        if (p.selected === state.instance) {
          ctx.strokeStyle = '#FFF0B4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(
            slot.x,
            slot.y + 7,
            actorSize * 0.58,
            actorSize * 0.18,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        p.hits.current.push({
          x: slot.x,
          y: slot.y,
          width: actorSize,
          height: actorSize * 1.22,
          instance: state.instance,
          agentId: state.agentId,
        });
      }

      // Crypto and capability labels are engraved into the deck instead of floating cards.
      blueprint.assets.forEach((asset, index) => {
        const x = 548 + index * 245;
        ctx.fillStyle = index % 2 ? '#111C21' : '#0B151B';
        ctx.strokeStyle = region.color + '4F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 55, 800, 110, 28, 7);
        ctx.fill();
        ctx.stroke();
        dot(
          x - 38,
          814,
          3,
          index === Math.floor((t * 0.35) % 4) ? '#EFFFFF' : region.color,
        );
        text(asset, x + 4, 818, '#A9BEC2', 10);
      });
      text(blueprint.status, focusX, 862, '#A7B7B8', 13);
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
        p.viewportWidth,
      ].join(':');
      if (lastFrame === frameKey && lastAgents === p.agents) return;
      lastFrame = frameKey;
      lastAgents = p.agents;
      ctx.clearRect(0, 0, 1600, 900);
      p.hits.current = [];
      if (p.regionIndex !== undefined) {
        drawAgentHabitat(p, t, phase, phaseProgress(t));
        return;
      }
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
