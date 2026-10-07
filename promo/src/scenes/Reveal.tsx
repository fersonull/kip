import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../timeline";
import { C, F, Logo, prog, Snd } from "../ui";

/** The ember dot from the problem scene blooms into the logo while warm cream floods the frame. */
export function Reveal({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [v] = scene.vo;
  const flood = prog(frame, 0, 0.7 * fps);
  const bloom = prog(frame, 0, 0.55 * fps, (t) => 1 - Math.cos(t * 4.2) * (1 - t) ** 2); // overshoots, settles
  const word = prog(frame, 0.3 * fps, 0.8 * fps);
  const exit = prog(frame, scene.dur - 1.3 * fps, scene.dur - 0.3 * fps);
  return (
    <AbsoluteFill style={{ background: "#1A1512", overflow: "hidden" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 4400, height: 4400, borderRadius: "50%", background: C.bg, scale: flood, flexShrink: 0 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          translate: `${-exit * 520}px ${-exit * 40}px`,
          scale: 1 - exit * 0.35,
          opacity: 1 - prog(frame, scene.dur - 0.7 * fps, scene.dur - 0.25 * fps),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 44, translate: `${(1 - word) * 210}px 0` }}>
          <Logo w={250} style={{ scale: interpolate(bloom, [0, 1], [0.12, 1]) }} />
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 800,
              fontSize: 240,
              letterSpacing: -8,
              color: C.ink,
              opacity: word,
              clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
            }}
          >
            Kip
          </div>
        </div>
      </AbsoluteFill>
      <Snd id="sfx-whoosh" from={Math.round(scene.dur - 1.15 * fps)} volume={0.7} />
      <Snd id={v.id} from={v.at} />
    </AbsoluteFill>
  );
}
