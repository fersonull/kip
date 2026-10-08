/**
 * A shake is several separate peaks over the threshold in a short window, not one jolt: setting the
 * phone down or picking it up spikes once or twice. Mirrored in KipShakeService.kt; keep them in step.
 * Tuning knobs: raise PEAKS if bumps still trigger it, lower it if real shakes get missed.
 */
export const PEAKS = 3;
export const WINDOW_MS = 1000;
/** Readings closer than this belong to the same peak (a jolt rings for a few samples). */
export const GAP_MS = 100;
export const COOLDOWN_MS = 1500;
/** Sample every 20 ms: slower sampling blurs a quick back-and-forth into one long peak. */
export const SAMPLE_MS = 20;

/** Feed it readings (magnitude in g, time in ms). Returns true on the reading that completes a shake. */
export function shakeDetector(g: number) {
  let above = false;
  let peaks: number[] = [];
  let last = -Infinity;
  return (mag: number, now: number) => {
    const rising = mag >= g && !above;
    above = mag >= g;
    if (!rising || now - last < COOLDOWN_MS) return false;
    peaks = peaks.filter((t) => now - t < WINDOW_MS);
    if (peaks.length && now - peaks[peaks.length - 1] < GAP_MS) return false;
    peaks.push(now);
    if (peaks.length < PEAKS) return false;
    peaks = [];
    last = now;
    return true;
  };
}
