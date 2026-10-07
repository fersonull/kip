export type GenOpts = { upper: boolean; num: boolean; sym: boolean };

// Look-alikes (l, I, O, 0, 1) left out on purpose.
export const LOWER = 'abcdefghijkmnopqrstuvwxyz';
export const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const DIGITS = '23456789';
export const SYMBOLS = '!#$%&*+-=?@^_';

export function generate(len: number, o: GenOpts, fill: (a: Uint32Array) => Uint32Array): string {
  const cs = LOWER + (o.upper ? UPPER : '') + (o.num ? DIGITS : '') + (o.sym ? SYMBOLS : '');
  const r = fill(new Uint32Array(len));
  let s = '';
  for (let i = 0; i < len; i++) s += cs[r[i] % cs.length];
  return s;
}

/** 0–4. Setup requires at least 2. */
export function strengthOf(pw: string): number {
  if (!pw || pw.length < 8) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(pw)).length;
  let s = 1;
  if (pw.length >= 12) s++;
  if (pw.length >= 16 || (classes >= 3 && pw.length >= 10)) s++;
  if (pw.length >= 20 || (pw.length >= 14 && classes >= 3)) s++;
  return Math.min(s, 4);
}
