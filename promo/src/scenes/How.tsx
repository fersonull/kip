import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fillTimes, saveTimes } from "../screens";
import type { Scene } from "../timeline";
import { C, F, prog, Snd } from "../ui";

/** Each on-screen demo starts this many frames before its voice line. */
export const BEAT_LEAD = 15;
/** Where "shake" lands inside "Need one fast? Just shake." */
export const shakeIn = (len: number) => Math.round(len * 0.68);

const STEPS = [
  { title: "Log in anywhere.", sub: "Kip offers to save it." },
  { title: "Fills itself in.", sub: "One tap, next time." },
  { title: "Need one fast?", sub: "Just shake." },
];

export function How({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const starts = scene.vo.map((c) => c.at - BEAT_LEAD);
  const [save, fill, shake] = scene.vo;
  const { sheetAt, saveAt } = saveTimes(save.len);
  const { tapAt } = fillTimes(fill.len);
  return (
    <AbsoluteFill style={{ padding: "0 0 0 150px", justifyContent: "center" }}>
      {STEPS.map((s, i) => {
        const inP = prog(frame, starts[i], starts[i] + 18);
        const outP = i < 2 ? prog(frame, starts[i + 1] - 8, starts[i + 1] + 6) : prog(frame, scene.dur - 20, scene.dur);
        if (inP <= 0 || outP >= 1) return null;
        return (
          <div key={s.title} style={{ position: "absolute", left: 150, opacity: inP * (1 - outP), translate: `0 ${(1 - inP) * 50 - outP * 40}px` }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
              {STEPS.map((_, j) => (
                <div key={j} style={{ width: j === i ? 56 : 16, height: 16, borderRadius: 8, background: j === i ? C.ember : C.line }} />
              ))}
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 116, lineHeight: 1, letterSpacing: -4, color: C.ink }}>{s.title}</div>
            <div style={{ marginTop: 22, fontFamily: F.body, fontWeight: 500, fontSize: 52, color: C.muted }}>{s.sub}</div>
          </div>
        );
      })}
      <Snd id="sfx-pop" from={Math.round(starts[0] + sheetAt)} volume={0.6} />
      <Snd id="sfx-lock" from={Math.round(starts[0] + saveAt)} volume={0.4} />
      <Snd id="sfx-shimmer" from={Math.round(starts[1] + tapAt)} volume={0.5} />
      <Snd id="sfx-rattle" from={shake.at + shakeIn(shake.len)} volume={0.8} />
      <Snd id="sfx-pop" from={shake.at + shakeIn(shake.len) + 24} volume={0.5} />
      {scene.vo.map((c) => (
        <Snd key={c.id} id={c.id} from={c.at} />
      ))}
    </AbsoluteFill>
  );
}
