import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(
  new URL('../components/world-interior-city.ts', import.meta.url),
  'utf8',
);

test('walkable interior is a spatial 360-degree Agent economy city', () => {
  for (const term of [
    'OKX.AI',
    'AGENTVERSE',
    'MISSION',
    'IGNIX',
    'PUBLIC PROFILES',
    'READ-ONLY INDEX',
    'RESEARCH AGENT',
    'TRADING AGENT',
    'RISK AGENT',
    'RWA AGENT',
    'procedural-360-environment-dome',
    'panoramic-360-city-towers',
    'panoramic-city-window-ribbons',
    'panoramic-city-vertical-light-spines',
    'panoramic-city-luminous-crowns',
    'panoramic-xlayer-data-columns',
    'panoramic-city-rail',
    'AGENTVERSE',
    'TASK COMPOSER',
    'BTC',
    'ETH',
    'USDT0',
    '世界新闻流',
    '美股观察',
    '资金流入 / 流出',
    '全球资产涨跌气泡',
    'X Layer 链上资金路径',
    'OKX 市场信号',
    'world-market-360-ticker',
  ]) {
    assert.ok(source.includes(term), `missing ${term}`);
  }
  assert.doesNotMatch(source, /agentverse-interior-skyline-v2\.webp/);
  assert.doesNotMatch(source, /new THREE\.TextureLoader/);
  assert.match(source, /new THREE\.SphereGeometry\(155, 64, 32\)/);
  assert.match(source, /side: THREE\.BackSide/);
  assert.match(source, /const skylineCount = 108/);
  assert.match(source, /const dataColumnCount = 24/);
  assert.match(source, /const spineCount = 72/);
  assert.match(source, /const crownCount = 36/);
  assert.match(source, /new THREE\.InstancedMesh\(towerBox, skylineMetal/);
  assert.match(source, /workGroups = workCells\.map/);
  assert.match(source, /nodeGroups = networkNodes\.map/);
  assert.match(source, /shuttleCount = 14/);
  assert.match(source, /quality === 2 \? 5 : quality === 1 \? 9/);
  assert.match(source, /signalState/);
  assert.match(source, /setNews\(news\?: WorldNews \| null\)/);
  assert.match(source, /const marketWallGroups = marketWalls\.flatMap/);
  assert.match(source, /blocksPoint\(x: number, z: number, padding = 0\.34\)/);
  assert.match(source, /wall\.group\.clone\(true\)/);
  assert.match(source, /news\?\.mode === 'fresh' \? 'LIVE'/);
  assert.match(source, /价格与涨跌来自 OKX · 曲线动画为 Demo/);
  assert.match(source, /示意价格 · 等待接入授权的美股行情源/);
  assert.match(source, /textures\.forEach\(\(item\) => item\.dispose\(\)\)/);
});
