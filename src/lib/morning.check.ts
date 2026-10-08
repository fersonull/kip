// Run: node --experimental-strip-types src/lib/morning.check.ts
// @ts-ignore -- Node needs the extension; the app bundler doesn't.
import { nextMorning } from './morning.ts';

const assert = {
  equal(a: unknown, b: unknown, msg: string) {
    if (a !== b) throw new Error(`${msg}: expected ${String(b)}, got ${String(a)}`);
  },
};

const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m);
const when = (d: Date) => `${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

assert.equal(when(nextMorning(at(8, 14))), '9 9:00', 'afternoon change: next morning');
assert.equal(when(nextMorning(at(8, 23, 30))), '9 9:00', 'late night: next morning');
assert.equal(when(nextMorning(at(9, 0, 30))), '9 9:00', 'just after midnight: same morning');
assert.equal(when(nextMorning(at(9, 8, 55))), '10 9:00', 'right before nine: skip to tomorrow');
assert.equal(when(nextMorning(at(31, 15))), '1 9:00', 'month rolls over');

console.log('morning: ok');
