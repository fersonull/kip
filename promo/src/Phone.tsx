import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

export const SCREEN_W = 360;
export const SCREEN_H = 780;
const BEZEL = 11;
const W = SCREEN_W + BEZEL * 2;
const H = SCREEN_H + BEZEL * 2;
const R = 58;
const DEPTH = 34;
const LAYERS = 17; // ponytail: stacked slices fake the rounded body; past ~75° of yaw the steps show. Add slices if a shot needs it.

export type Pose = { x: number; y: number; rx: number; ry: number; rz: number; s: number };

const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

/** CSS 3D phone. Children render live inside the screen at SCREEN_W × SCREEN_H. */
export function Phone({ pose, children }: { pose: Pose; children: ReactNode }) {
  const { x, y, rx, ry, rz, s } = pose;
  return (
    <AbsoluteFill style={{ perspective: 2200, alignItems: "center", justifyContent: "center" }}>
      {/* Floor shadow stays flat; it only follows position and squashes with yaw. */}
      <div
        style={{
          position: "absolute",
          width: W * 1.1 * (1 - Math.abs(ry) / 200),
          height: 70,
          borderRadius: "50%",
          background: "rgba(60,35,20,0.28)",
          filter: "blur(28px)",
          translate: `${x}px ${y + H * 0.5 * s + 40}px`,
          scale: s,
        }}
      />
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          transformStyle: "preserve-3d",
          transform: `translate(${x}px, ${y}px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        }}
      >
        {Array.from({ length: LAYERS }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: R,
              // Brightest mid-depth: reads as a polished rim catching light.
              background: mix([34, 30, 27], [120, 108, 98], Math.sin((Math.PI * i) / (LAYERS - 1))),
              transform: `translateZ(${-(i / (LAYERS - 1)) * DEPTH}px)`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: R,
            background: "#0E0C0B",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.16)",
            transform: "translateZ(0.5px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: BEZEL,
              top: BEZEL,
              width: SCREEN_W,
              height: SCREEN_H,
              borderRadius: R - BEZEL,
              overflow: "hidden",
              background: "#000",
            }}
          >
            {children}
            <div style={{ position: "absolute", top: 13, left: "50%", width: 13, height: 13, marginLeft: -6.5, borderRadius: 7, background: "#0B0A09" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.16) 48%, rgba(255,255,255,0.04) 56%, transparent 64%)",
                backgroundSize: "300% 100%",
                backgroundPosition: `${50 - ry * 2.2}% 0`,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
