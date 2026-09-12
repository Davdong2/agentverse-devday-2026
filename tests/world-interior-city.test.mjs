import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(
  new URL('../components/world-interior-city.ts', import.meta.url),
  'utf8',
);

test('walkable interior has a visible Agent economy city layer', () => {
  for (const term of [
    'OKX.AI',
    'X LAYER',
    'AGENT PAY',
    'ONCHAIN OS',
    'RESEARCH AGENT',
    'TRADING AGENT',
    'RISK AGENT',
    'RWA AGENT',
    'agentverse-interior-skyline-v2.webp',
  ]) {
    assert.ok(source.includes(term), `missing ${term}`);
  }
  assert.match(source, /workGroups = workCells\.map/);
  assert.match(source, /nodeGroups = networkNodes\.map/);
  assert.match(source, /shuttleCount = 14/);
  assert.match(source, /quality === 2 \? 5 : quality === 1 \? 9/);
  assert.match(source, /signalState/);
  assert.match(source, /textures\.forEach\(\(item\) => item\.dispose\(\)\)/);
});

