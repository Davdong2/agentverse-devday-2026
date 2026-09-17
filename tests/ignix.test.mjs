import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync('lib/ignix.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizeIgnix, mergeIgnixProfiles, retainIgnixProfiles } =
  await import(
    'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
  );
const seed = JSON.parse(fs.readFileSync('lib/ignix-snapshot.json'));
const token = '0x' + 'a'.repeat(40),
  second = '0x' + 'b'.repeat(40);
const launch = (address, asp) => ({
  tokenAddress: address,
  symbol: 'TOK',
  name: 'Name',
  asp,
  graduated: false,
});
const linked = { id: 123, name: 'Same Name', matched: 'linked', rev: 8.80013 };
const r = normalizeIgnix({
  code: 200,
  data: {
    launches: [
      launch(token, linked),
      launch(token.toUpperCase().replace('0X', '0x'), linked),
      launch(second, linked),
      launch('0x' + 'c'.repeat(40), { ...linked, id: 456, matched: 'name' }),
      launch('javascript:evil', linked),
      launch('0x' + 'd'.repeat(40), { ...linked, id: '__proto__' }),
    ],
  },
});
assert.deepEqual(
  Object.keys(r),
  ['123'],
  'Only explicit linked Agent IDs are accepted',
);
assert.equal(r['123'].tokens.length, 2, 'Duplicate contracts are removed');
assert.equal(
  r['123'].revenueUsd,
  '8.80013',
  'Agent revenue is not added for each token',
);
assert.ok(
  r['123'].tokens.every((t) =>
    t.url.startsWith('https://ignix.bot/launch?token=0x'),
  ),
);
assert.throws(() => normalizeIgnix({ code: 500, data: { launches: [] } }));
assert.deepEqual(
  normalizeIgnix({ code: 200, data: { launches: [] } }),
  {},
  'Successful empty result removes badges',
);
const zero = normalizeIgnix({
  code: 200,
  data: { launches: [launch(token, { ...linked, rev: 0 })] },
});
assert.equal(zero['123'].revenueUsd, '0');
const unknown = normalizeIgnix({
  code: 200,
  data: { launches: [launch(token, { ...linked, rev: null })] },
});
assert.equal(unknown['123'].revenueUsd, null, 'Missing revenue is not zero');
const merged = mergeIgnixProfiles(
  [{ agentId: '11025', name: 'Current Name' }],
  seed.profiles,
  seed.associations,
);
assert.equal(merged.filter((a) => a.agentId === '11025').length, 1);
assert.equal(merged[0].name, 'Current Name');
assert.ok(
  !merged.some((a) => a.agentId === '11192'),
  'Unavailable OKX identity is never fabricated',
);
assert.equal(mergeIgnixProfiles([], seed.profiles, {}).length, 0);
const checkedAt = '2026-09-07T16:00:00.000Z';
const unavailable = { ...seed, profiles: [], fetchedAt: checkedAt };
const restored = retainIgnixProfiles(
  seed.associations,
  [],
  unavailable,
  seed,
  checkedAt,
);
assert.equal(
  restored.profiles.length,
  3,
  'Cloud OKX failure retains independently verified profiles',
);
assert.ok(
  !restored.profiles.some((a) => a.agentId === '11192'),
  'Missing identity stays absent',
);
assert.equal(restored.profileSources['11025'].mode, 'cached');
assert.equal(
  restored.profileSources['11025'].fetchedAt,
  seed.fetchedAt,
  'Association refresh never refreshes old profile timestamps',
);
const previous = { ...seed, ...restored, fetchedAt: checkedAt };
const fresh = {
  ...seed.profiles.find((a) => a.agentId === '11025'),
  name: 'Updated OKX name',
};
const partial = retainIgnixProfiles(
  seed.associations,
  [fresh],
  previous,
  seed,
  checkedAt,
);
assert.equal(
  partial.profiles.find((a) => a.agentId === '11025').name,
  fresh.name,
);
assert.equal(partial.profileSources['11025'].mode, 'fresh');
assert.equal(partial.profileSources['11025'].fetchedAt, checkedAt);
assert.equal(partial.profileSources['11110'].mode, 'cached');
assert.equal(partial.profileSources['11110'].fetchedAt, seed.fetchedAt);
const removed = retainIgnixProfiles({}, [], previous, seed, checkedAt);
assert.deepEqual(
  removed,
  { profiles: [], profileSources: {} },
  'Successful association removal overrides every fallback',
);
const repeated = retainIgnixProfiles(
  seed.associations,
  [],
  { ...previous, ...partial },
  seed,
  '2026-09-07T17:00:00.000Z',
);
assert.equal(
  repeated.profileSources['11025'].fetchedAt,
  checkedAt,
  'Repeated failures keep the last successful profile time',
);
console.log(
  'PASS: exact linked IDs, no fuzzy identity matching, strict contract URLs, zero vs missing revenue, no double counting, removal semantics and independently sourced profiles.',
);
