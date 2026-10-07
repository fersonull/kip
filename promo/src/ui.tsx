import { Audio } from "@remotion/media";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Easing, interpolate, staticFile, useVideoConfig } from "remotion";

// The app's own palette, so the promo can't drift from it.
export { C, tintFor } from "../../src/constants/tokens";
import { C } from "../../src/constants/tokens";

const latin = { subsets: ["latin" as const] };
export const F = {
  display: loadBricolage("normal", { weights: ["700", "800"], ...latin }).fontFamily,
  body: loadDMSans("normal", { weights: ["400", "500", "700"], ...latin }).fontFamily,
  mono: loadMono("normal", { weights: ["400", "600"], ...latin }).fontFamily,
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 over [a, b] frames with the house ease. */
export const prog = (frame: number, a: number, b: number, easing = ease) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

/**
 * Piecewise keyframes where each segment has its own easing: [[frame, value, easingIntoThisKey?], ...].
 * interpolate() takes one easing for every segment, which makes slow drifts stop dead at each key.
 */
export function track(frame: number, keys: [number, number, ((t: number) => number)?][]) {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) return interpolate(frame, [f0, f1], [v0, v1], { ...clamp, easing: e ?? ease });
  }
  return keys[keys.length - 1][1];
}

// Audio files that exist; filled from the timeline so a missing file is silence instead of a render error.
export const AudioOk = createContext<Set<string>>(new Set());

export function Snd({ id, from = 0, volume = 1, loop }: { id: string; from?: number; volume?: number | ((f: number) => number); loop?: boolean }) {
  const { fps } = useVideoConfig();
  if (!useContext(AudioOk).has(id)) return null;
  return <Audio name={id} src={staticFile(`audio/${id}.mp3`)} from={from} volume={volume} loop={loop} premountFor={fps} />;
}

/** The app's pebble shape (ui.tsx Pebble), which CSS can draw exactly. */
export function Pebble({ w, h, color = C.ember, style, children }: { w: number; h: number; color?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: color,
        borderRadius: "58% 42% 52% 48% / 56% 50% 50% 44%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Pebble with the dark eye: the Kip logo. */
export function Logo({ w, style }: { w: number; style?: CSSProperties }) {
  const h = w * 0.84;
  const eye = w * 0.19;
  return (
    <Pebble w={w} h={h} style={style}>
      <div style={{ position: "absolute", width: eye, height: eye, borderRadius: eye, background: C.ink, left: w * 0.58, top: h * 0.33 }} />
    </Pebble>
  );
}

// Minimal stroked icons (24-unit grid), drawn here instead of pulling an icon font.
const ICONS = {
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  offline: "M2 8.8a15 15 0 0 1 20 0 M5.5 12.4a10 10 0 0 1 13 0 M9 16a5 5 0 0 1 6 0 M12 19.5h.01 M3 3l18 18",
  cloudOff: "M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 9.2 4.5 4.5 0 0 0 7 18z M3 3l18 18",
  warn: "M12 3l10 18H2z M12 10v5 M12 18h.01",
  check: "M5 12.5l4.5 4.5L19 7.5",
  key: "M14.5 9.5a4 4 0 1 1-1.2-2.8 M13.3 11.2L21 19 M18 16l2-2 M16 14l2-2",
};

export function Ico({ name, size = 24, color = C.ink, width = 2 }: { name: keyof typeof ICONS; size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}
