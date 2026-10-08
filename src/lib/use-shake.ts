import { Accelerometer } from 'expo-sensors';
import { useEffect } from 'react';

import type { Settings } from './keys';
import { SAMPLE_MS, shakeDetector } from './shake';

const G = { Gentle: 1.8, Firm: 2.6 };

/** Foreground-only shake detection. Readings are in g; resting is ~1. */
export function useShake(level: Settings['shake'] | undefined, enabled: boolean, onShake: () => void) {
  useEffect(() => {
    if (!enabled || !level || level === 'Off') return;
    const hit = shakeDetector(G[level]);
    Accelerometer.setUpdateInterval(SAMPLE_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (hit(Math.hypot(x, y, z), Date.now())) onShake();
    });
    return () => sub.remove();
  }, [level, enabled, onShake]);
}
