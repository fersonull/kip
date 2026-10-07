import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../timeline";
import { C, F, Ico, prog, Snd } from "../ui";

const BADGES = [
  { icon: "lock", text: "Encrypted on device" },
  { icon: "offline", text: "Offline. No internet access." },
  { icon: "cloudOff", text: "No account. No cloud." },
] as const;

export function Solution({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [a, ...rest] = scene.vo;
  const head = prog(frame, a.at - 6, a.at + 18);
  const out = prog(frame, scene.dur - 0.35 * fps, scene.dur);
  return (
    <AbsoluteFill style={{ padding: "0 0 0 150px", justifyContent: "center", opacity: 1 - out, translate: `${-out * 60}px 0` }}>
      <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: C.rust, opacity: head }}>LOCAL-ONLY PASSWORD MANAGER</div>
      <div
        style={{
          marginTop: 18,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 124,
          lineHeight: 0.98,
          letterSpacing: -4,
          color: C.ink,
          opacity: head,
          translate: `0 ${(1 - head) * 50}px`,
        }}
      >
        Never leaves
        <br />
        your <span style={{ color: C.ember }}>phone.</span>
      </div>
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-start" }}>
        {BADGES.map((b, i) => {
          const at = rest[i].at - 4;
          const p = prog(frame, at, at + 16, (t) => 1 - (1 - t) ** 3 * Math.cos(t * 5));
          return (
            <div
              key={b.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "16px 34px 16px 16px",
                borderRadius: 48,
                background: C.card,
                boxShadow: "0 10px 30px rgba(120,70,40,0.12)",
                opacity: Math.min(1, p * 2),
                scale: 0.85 + p * 0.15,
                translate: `${(1 - p) * -40}px 0`,
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 32, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico name={b.icon} size={34} color={C.rust} width={2.2} />
              </div>
              <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 40, color: C.ink }}>{b.text}</span>
            </div>
          );
        })}
      </div>
      {rest.map((c) => (
        <Snd key={c.id} id="sfx-lock" from={c.at - 4} volume={0.55} />
      ))}
      {scene.vo.map((c) => (
        <Snd key={c.id + "vo"} id={c.id} from={c.at} />
      ))}
    </AbsoluteFill>
  );
}
