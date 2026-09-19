import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const route = fs.readFileSync(
  new URL('../app/api/a2mcp/compose/route.ts', import.meta.url),
  'utf8',
);

test('A2MCP success is explicitly marked as delivered', () => {
  assert.match(route, /ok: true/);
  assert.match(route, /deliveryStatus: 'delivered'/);
});

test('A2MCP failures provide stable diagnostics and a retry example', () => {
  assert.match(route, /deliveryStatus: 'failed'/);
  assert.match(route, /code,/);
  assert.match(route, /hint,/);
  assert.match(route, /exampleRequest/);
  for (const code of [
    'RATE_LIMITED',
    'PAYLOAD_TOO_LARGE',
    'INVALID_JSON',
    'INVALID_INPUT',
    'NO_MATCHING_SERVICES',
  ]) {
    assert.match(route, new RegExp(code));
  }
});

test('A2MCP empty POST is an explicit delivered availability probe', () => {
  assert.match(route, /emptyProbe/);
  assert.match(route, /default-example/);
  assert.doesNotMatch(route, /UNSUPPORTED_MEDIA_TYPE/);
});
