import { agentDesigns, type AvatarMotion } from './agent-design';

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

/** A texture-free Agent body shared by overview cards and the live Canvas world. */
export function drawVectorAgent(
  ctx: CanvasRenderingContext2D,
  variant: number,
  x: number,
  y: number,
  width: number,
  height: number,
  motion?: AvatarMotion,
) {
  const design = agentDesigns[variant] ?? agentDesigns[0],
    sx = width / 100,
    sy = height / 128,
    stride = (motion?.stride ?? 0) * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#02070D';
  ctx.beginPath();
  ctx.ellipse(50, 119, 31, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const shell = ctx.createLinearGradient(18, 28, 83, 111);
  shell.addColorStop(0, '#FCFCFB');
  shell.addColorStop(0.48, design.skin);
  shell.addColorStop(1, '#DCE3E7');
  const metal = ctx.createLinearGradient(0, 0, 0, 30);
  metal.addColorStop(0, '#F7F9FA');
  metal.addColorStop(1, '#87939E');

  ctx.fillStyle = '#1B242C';
  rounded(ctx, 29, 101 + stride, 18, 17, 7);
  ctx.fill();
  rounded(ctx, 53, 101 - stride, 18, 17, 7);
  ctx.fill();
  ctx.fillStyle = metal;
  rounded(ctx, 30, 99 + stride, 17, 13, 6);
  ctx.fill();
  rounded(ctx, 53, 99 - stride, 17, 13, 6);
  ctx.fill();

  ctx.fillStyle = shell;
  rounded(ctx, 20, 66, 60, 45, design.shape === 'square' ? 10 : 20);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF99';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side < 0 ? 17 : 83, 77);
    ctx.rotate(side * ((motion?.leftArm ?? 0) - (motion?.rightArm ?? 0)) * 0.2);
    ctx.fillStyle = shell;
    rounded(ctx, side < 0 ? -10 : -2, 0, 12, 28, 7);
    ctx.fill();
    ctx.fillStyle = '#202932';
    ctx.beginPath();
    ctx.arc(side < 0 ? -4 : 4, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const headWidth = 76 * design.headX,
    headHeight = 52 * design.headY,
    headX = 50 - headWidth / 2,
    headY = 27 - (headHeight - 52) * 0.42;
  ctx.fillStyle = shell;
  rounded(
    ctx,
    headX,
    headY,
    headWidth,
    headHeight,
    design.shape === 'square' || design.shape === 'chamfer' ? 13 : 25,
  );
  ctx.fill();
  ctx.strokeStyle = '#FFFFFFB8';
  ctx.stroke();

  ctx.fillStyle = '#111417';
  for (const eyeX of [41, 59]) {
    rounded(
      ctx,
      eyeX - 3.6,
      headY + headHeight * 0.37,
      7.2,
      headHeight * 0.27,
      4,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#F2B8B8';
  ctx.globalAlpha = 0.72;
  for (const cheekX of [30, 70]) {
    ctx.beginPath();
    ctx.ellipse(cheekX, headY + headHeight * 0.68, 4.4, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = design.color;
  ctx.lineWidth = 3;
  rounded(ctx, 40, 78, 20, 16, 5);
  ctx.stroke();
  ctx.fillStyle = design.color + '55';
  ctx.fill();
  ctx.fillStyle = '#DDFBFF';
  ctx.beginPath();
  ctx.arc(50, 85.5, 2.2, 0, Math.PI * 2);
  ctx.fill();

  const moduleGradient = ctx.createLinearGradient(37, 3, 64, 25);
  moduleGradient.addColorStop(0, '#FFFFFFDD');
  moduleGradient.addColorStop(0.24, design.color);
  moduleGradient.addColorStop(1, '#244455');
  ctx.fillStyle = moduleGradient;
  rounded(ctx, 36, 5, 28, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#DFFCFFAA';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#E9FCFF';
  rounded(ctx, 47, 11, 6, 10, 2);
  ctx.fill();
  ctx.globalAlpha = 0.56;
  ctx.strokeStyle = design.color;
  ctx.beginPath();
  ctx.moveTo(41, 18);
  ctx.lineTo(59, 12);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (motion?.composite) {
    [2, 1, 3].forEach((module, index) => {
      ctx.fillStyle = agentDesigns[module].color;
      rounded(ctx, 33 + index * 12, -5 - index * 2, 10, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#EFFFFF';
      ctx.stroke();
    });
  }
  if (motion?.joining || motion?.presenting) {
    ctx.fillStyle = '#9DEEFF';
    rounded(ctx, 45, 61, 10, 10, 2);
    ctx.fill();
  }
  ctx.restore();
}
