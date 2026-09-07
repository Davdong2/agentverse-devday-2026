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
    ctx.font = '600 26px system-ui, sans-serif';
    const lines: string[] = [];
    let line = '';
    for (const char of Array.from(name)) {
      if (ctx.measureText(line + char).width > 310 && line) {
        lines.push(line);
        line = char;
      } else line += char;
    }
    if (line) lines.push(line);
    if (!lines.length) lines.push('Agent');
    const width =
      Math.ceil(Math.max(...lines.map((t) => ctx.measureText(t).width))) + 34;
    canvas.width = width;
    canvas.height = lines.length * 34 + 22;
    ctx.fillStyle = 'rgba(250,252,255,0.91)';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '600 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#35495D';
    lines.forEach((text, i) =>
      ctx.fillText(text, canvas.width / 2, 28 + i * 34),
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
        ) {
          if (current !== name || !label) {
            if (!label) sprite.material.dispose();
            current = name;
            label = entry(name);
            sprite.material = label.material;
          }
          const pixelWidth = Math.min(185, label.width * 0.55);
          const scale = Math.max(
            0.9,
            Math.min(
              4.5,
              (pixelWidth * 2 * Math.tan((fov * Math.PI) / 360) * distance) /
                Math.max(360, viewportHeight),
            ),
          );
          sprite.scale.set(scale, scale / label.aspect, 1);
          sprite.position.set(
            0,
            (composite ? 3.35 : 2.85) + (instance < 4 ? instance * 0.12 : 0),
            0,
          );
          sprite.visible = visible;
          badge.visible = visible && ignix;
          badge.position.set(0.43, composite ? 2.9 : 2.2, 0);
          badge.scale.setScalar(Math.max(0.25, Math.min(0.45, scale * 0.18)));
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
