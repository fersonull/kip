import { Accelerometer } from 'expo-sensors';
import { useEffect } from 'react';

import type { Settings } from './keys';

const G = { Gentle: 1.8, Firm: 2.6 };

/** Foreground-only shake detection. Readings are in g; resting is ~1. */
export function useShake(level: Settings['shake'] | undefined, enabled: boolean, onShake: () => void) {
  useEffect(() => {
    if (!enabled || !level || level === 'Off') return;
    const g = G[level];
    let last = 0;
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (Math.hypot(x, y, z) < g) return;
      const now = Date.now();
      if (now - last < 1500) return;
      last = now;
      onShake();
    });
    return () => sub.remove();
  }, [level, enabled, onShake]);
}
