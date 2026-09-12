import * as THREE from 'three';

/** Text-only atlas cache: nameplates use the source Agent name and face the camera. */
export function createAgentLabels() {
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 64;
  badgeCanvas.height = 64;
  const badgeCtx = badgeCanvas.getContext('2d')!;
  badgeCtx.fillStyle = '#254E41';
  badgeCtx.beginPath();
  badgeCtx.roundRect(2, 2, 60, 60, 18);
  badgeCtx.fill();
  badgeCtx.strokeStyle = '#BBDCB2';
  badgeCtx.lineWidth = 3;
  badgeCtx.stroke();
  badgeCtx.fillStyle = '#F1F8D7';
  badgeCtx.font = '700 36px system-ui';
  badgeCtx.textAlign = 'center';
  badgeCtx.textBaseline = 'middle';
  badgeCtx.fillText('ig', 32, 32);
  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  badgeTexture.colorSpace = THREE.SRGBColorSpace;
  const badgeMaterial = new THREE.SpriteMaterial({
    map: badgeTexture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  const cache = new Map<
    string,
    {
      texture: THREE.CanvasTexture;
      material: THREE.SpriteMaterial;
      aspect: number;
      width: number;
    }
  >();
  function entry(name: string) {
    const existing = cache.get(name);
    if (existing) return existing;
    const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d')!;
    ctx.font = '600 20px system-ui, sans-serif';
    const lines: string[] = [];
    let line = '';
    for (const char of Array.from(name)) {
      if (ctx.measureText(line + char).width > 238 && line) {
        lines.push(line);
        line = char;
      } else line += char;
    }
    if (line) lines.push(line);
    if (!lines.length) lines.push('Agent');
    const width =
      Math.ceil(Math.max(...lines.map((t) => ctx.measureText(t).width))) + 30;
    canvas.width = width;
    canvas.height = lines.length * 28 + 20;
    ctx.fillStyle = 'rgba(7,20,29,0.91)';
    ctx.beginPath();
    ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(169,229,241,0.62)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(130,220,236,0.72)';
    ctx.beginPath();
    ctx.roundRect(
      10,
      canvas.height - 4,
      Math.max(18, canvas.width * 0.26),
      2,
      1,
    );
    ctx.fill();
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#EDF9FB';
    lines.forEach((text, i) =>
      ctx.fillText(text, canvas.width / 2, 23 + i * 28),
    );
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      alphaTest: 0.04,
      toneMapped: false,
    });
    const value = {
      texture,
      material,
      aspect: canvas.width / canvas.height,
      width: canvas.width,
    };
    cache.set(name, value);
    return value;
  }
  return {
    create(instance: number) {
      const sprite = new THREE.Sprite();
      sprite.userData.instance = instance;
      sprite.name = 'agent-nameplate';
      const badge = new THREE.Sprite(badgeMaterial);
      badge.userData.instance = instance;
      badge.visible = false;
      badge.name = 'ignix-linked-mark';
      let current = '';
      let label: ReturnType<typeof entry> | undefined;
      return {
        sprite,
        badge,
        update(
          name: string,
          distance: number,
          viewportHeight: number,
          fov: number,
          composite: boolean,
          visible: boolean,
          ignix = false,
          parentScale = 1,
        ) {
          if (current !== name || !label) {
            if (!label) sprite.material.dispose();
            current = name;
            label = entry(name);
            sprite.material = label.material;
          }
          const pixelWidth = Math.min(104, label.width * 0.46);
          const scale = Math.max(
            0.58,
            Math.min(
              3.25,
              (pixelWidth * 2 * Math.tan((fov * Math.PI) / 360) * distance) /
                Math.max(360, viewportHeight),
            ),
          );
          const compensatedScale = scale / Math.max(0.1, parentScale);
          sprite.scale.set(compensatedScale, compensatedScale / label.aspect, 1);
          sprite.position.set(
            0,
            (composite ? 3.2 : 2.62) +
              ((instance % 4) * 0.2) / Math.max(0.1, parentScale),
            0,
          );
          sprite.visible = visible;
          badge.visible = visible && ignix;
          badge.position.set(
            0.36,
            (composite ? 2.82 : 2.1) +
              ((instance % 4) * 0.08) / Math.max(0.1, parentScale),
            0,
          );
          badge.scale.setScalar(
            Math.max(0.2, Math.min(0.36, scale * 0.15)) /
              Math.max(0.1, parentScale),
          );
        },
      };
    },
    dispose() {
      cache.forEach((v) => {
        v.texture.dispose();
        v.material.dispose();
      });
      cache.clear();
      badgeTexture.dispose();
      badgeMaterial.dispose();
    },
    get cacheSize() {
      return cache.size;
    },
  };
}
