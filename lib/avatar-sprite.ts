// Source crops are explicit: generated subjects do not align perfectly to a regular grid.
export const avatarFrames = [
  [70, 15, 360, 495],
  [465, 15, 275, 495],
  [795, 15, 325, 495],
  [1160, 15, 290, 495],
  [70, 530, 360, 460],
  [465, 530, 275, 460],
  [795, 530, 325, 460],
  [1160, 530, 290, 460],
];
export function drawAvatarSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  variant: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const [sx, sy, sw, sh] = avatarFrames[variant] ?? avatarFrames[0];
  const scale = Math.min((width * 0.96) / sw, (height * 0.96) / sh),
    w = sw * scale,
    h = sh * scale;
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x + (width - w) / 2,
    y + height - h,
    w,
    h,
  );
}
