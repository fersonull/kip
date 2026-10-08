// Run: node --experimental-strip-types src/lib/shake.check.ts
// @ts-ignore -- Node needs the extension; the app bundler doesn't.
import { SAMPLE_MS, shakeDetector } from './shake.ts';

const assert = {
  equal(a: unknown, b: unknown, msg: string) {
    if (a !== b) throw new Error(`${msg}: expected ${String(b)}, got ${String(a)}`);
  },
};

/** Runs magnitudes sampled every SAMPLE_MS through a fresh detector; returns how many shakes fired. */
function shakes(mags: number[], g = 1.8) {
  const hit = shakeDetector(g);
  return mags.filter((m, i) => hit(m, i * SAMPLE_MS)).length;
}
const rest = (ms: number) => Array<number>(Math.round(ms / SAMPLE_MS)).fill(1);
const spike = (ms = 40, m = 2.5) => Array<number>(Math.round(ms / SAMPLE_MS)).fill(m);

assert.equal(shakes([...rest(500), ...spike(), ...rest(500)]), 0, 'one jolt');
// Set down on a table: impact, a quick ring, a bounce.
assert.equal(shakes([...rest(200), ...spike(), 1, ...spike(20), ...rest(60), ...spike(20), ...rest(500)]), 0, 'set down');
// Picked up and put down a second apart.
assert.equal(shakes([...spike(), ...rest(600), ...spike(), ...rest(600), ...spike()]), 0, 'slow bumps');
// A real shake: back and forth about 4 times a second.
const wave = Array.from({ length: 4 }, () => [...spike(60), ...rest(80)]).flat();
assert.equal(shakes([...rest(200), ...wave, ...rest(300)]), 1, 'real shake');
// Keeps shaking: the cooldown stops a second launch right away.
assert.equal(shakes([...wave, ...wave, ...wave]), 1, 'cooldown');
// Gentle threshold: a 2.0g shake fires at Gentle (1.8) but not Firm (2.6).
const soft = Array.from({ length: 4 }, () => [...spike(60, 2), ...rest(80)]).flat();
assert.equal(shakes(soft, 1.8), 1, 'gentle');
assert.equal(shakes(soft, 2.6), 0, 'firm');

console.log('shake: ok');
