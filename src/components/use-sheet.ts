import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const OUT_MS = 220;
const IN = { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) };
const OUT = { duration: OUT_MS, easing: Easing.in(Easing.cubic) };

/**
 * Bottom-sheet motion: the sheet slides, its backdrop only fades.
 * Opens on mount; close(then) plays it in reverse and calls `then` once it's off screen.
 */
export function useSheet() {
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  const dim = useSharedValue(0);

  useEffect(() => {
    y.set(withTiming(0, IN));
    dim.set(withTiming(1, IN));
  }, [y, dim]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: dim.get() }));

  const close = (then: () => void) => {
    y.set(withTiming(height, OUT));
    dim.set(withTiming(0, OUT));
    setTimeout(then, OUT_MS);
  };

  return { sheetStyle, backdropStyle, close };
}
