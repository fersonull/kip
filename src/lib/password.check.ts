// Run: node --experimental-strip-types src/lib/password.check.ts
// @ts-ignore -- Node needs the extension; the app bundler doesn't.
import { DIGITS, generate, LOWER, strengthOf, SYMBOLS, UPPER } from './password.ts';

const fill = (a: Uint32Array) => crypto.getRandomValues(a as Uint32Array<ArrayBuffer>);
const assert = {
  ok(v: unknown, msg = 'assertion failed') {
    if (!v) throw new Error(msg);
  },
  equal(a: unknown, b: unknown) {
    if (a !== b) throw new Error(`expected ${String(b)}, got ${String(a)}`);
  },
};

assert.equal(strengthOf(''), 0);
assert.equal(strengthOf('short'), 0);
assert.equal(strengthOf('abcdefgh'), 1);
assert.equal(strengthOf('abcdefghijkl'), 2);
assert.equal(strengthOf('pebbles in my pocket'), 4);
assert.equal(strengthOf('Abcdefgh1!'), 2);

for (let len = 8; len <= 40; len++) assert.equal(generate(len, { upper: true, num: true, sym: true }, fill).length, len);
const only = generate(500, { upper: false, num: false, sym: false }, fill);
assert.ok([...only].every((c) => LOWER.includes(c)));
const all = generate(2000, { upper: true, num: true, sym: true }, fill);
for (const set of [UPPER, DIGITS, SYMBOLS]) assert.ok([...all].some((c) => set.includes(c)));
assert.ok(![...all].some((c) => 'lIO01'.includes(c)));

console.log('password.check ok');
