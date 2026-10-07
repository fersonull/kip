import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Scene } from "../timeline";
import { C, F, Logo, prog, Snd } from "../ui";

export function Cta({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const [v] = scene.vo;
  const pop = prog(frame, 6, 30, (t) => 1 - Math.cos(t * 4.5) * (1 - t) ** 2);
  const tag = prog(frame, v.at + v.len * 0.3, v.at + v.len * 0.3 + 20);
  const foot = prog(frame, v.at + v.len, v.at + v.len + 20);
  return (
    <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 170 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: 780 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <Logo w={190} style={{ scale: interpolate(pop, [0, 1], [0.2, 1]) }} />
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 200, letterSpacing: -7, color: C.ink, opacity: Math.min(1, pop * 2), lineHeight: 1 }}>Kip</div>
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 72,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: C.ink,
            opacity: tag,
            translate: `0 ${(1 - tag) * 30}px`,
          }}
        >
          Your passwords,
          <br />
          <span style={{ color: C.ember }}>kept close.</span>
        </div>
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 14, opacity: foot }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: C.ok }} />
          <span style={{ fontFamily: F.body, fontSize: 34, color: C.muted }}>Offline. Nothing leaves this phone.</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: F.mono, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: C.faint, opacity: foot }}>FOR ANDROID</div>
      </div>
      <Snd id="sfx-hit" from={0} volume={0.8} />
      <Snd id={v.id} from={v.at} />
    </AbsoluteFill>
  );
}
