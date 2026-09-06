import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compiled = ts.transpileModule(
  fs.readFileSync('lib/crypto-world.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { cryptoTasks, cryptoLoadouts, cryptoTaskState, loadoutIndex } =
  await import(
    'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
  );
assert.equal(cryptoTasks.length, 10);
assert.equal(cryptoLoadouts.length, 6);
assert.deepEqual(
  [0, 1, 2, 3].map((i) => loadoutIndex(0, i)),
  [1, 5, 2, 0],
);
for (let n = 0; n < 10; n++) {
  const start = -n * 1.7;
  for (let t = 0; t < 18; t += 0.03) {
    const s = cryptoTaskState(n, start + t),
      repeat = cryptoTaskState(n, start + t + 18);
    assert.equal(s.mode, 'Demo');
    assert.ok(s.step >= 0 && s.step < 3);
    assert.ok(Math.abs(s.left + s.right) < 1e-8);
    assert.ok(s.visibility >= 0 && s.visibility <= 1);
    assert.ok(Math.abs(s.left - repeat.left) < 1e-8);
    assert.equal(s.label, s.steps[s.step]);
    assert.equal(s.receipt > 0, s.step === 2 && s.progress > 0);
  }
  const before = cryptoTaskState(n, start + 5.999),
    after = cryptoTaskState(n, start + 6.001);
  assert.ok(
    Math.abs(before.left - after.left) < 1e-5,
    'Exchange begins without position discontinuity',
  );
  const finish = cryptoTaskState(n, start + 11.999),
    receipt = cryptoTaskState(n, start + 12.001);
  assert.ok(
    Math.abs(finish.left - receipt.left) < 1e-5,
    'Receipt phase preserves completed swap',
  );
  assert.equal(cryptoTaskState(n, start + 3).left, -1);
  assert.equal(cryptoTaskState(n, start + 15).left, 1);
  assert.ok(
    cryptoTaskState(n, start + 17.999).visibility < 0.001,
    'Assets retire before the next cycle',
  );
}
console.log(
  'PASS: 10 crypto workflows, 6 loadouts, shared periodic state, continuous exchange, receipt sequencing and explicit Demo provenance.',
);
