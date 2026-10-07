import { AbsoluteFill, Easing, Sequence, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "./Phone";
import { How, BEAT_LEAD, shakeIn } from "./scenes/How";
import { Cta } from "./scenes/Cta";
import { Problem } from "./scenes/Problem";
import { Reveal } from "./scenes/Reveal";
import { Solution } from "./scenes/Solution";
import { FillBeat, fillTimes, SaveBeat, saveTimes, ShakeBeat, Switcher, Vault } from "./screens";
import type { Timeline } from "./timeline";
import { AudioOk, C, prog, Snd, track } from "./ui";

const lin = (t: number) => t;
const sine = Easing.inOut(Easing.sin);

/** One phone for scenes 2–5, so it glides between shots instead of cutting. */
function PhoneLayer({ t }: { t: Timeline }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = t.reveal.from + t.reveal.dur - Math.round(1.1 * fps);
  if (frame < enter) return null;

  const land = t.solution.from;
  const how = t.how.from;
  const settle = how + Math.round(0.5 * fps);
  const cta = t.cta.from;
  const out = cta + Math.round(0.9 * fps);
  const end = t.total;
  const [save, fill, shake] = t.how.vo;
  const beat = (c: typeof save) => how + c.at - BEAT_LEAD;
  const shakeAt = how + shake.at + shakeIn(shake.len);
  const { sheetAt, saveAt } = saveTimes(save.len);
  const sheet = beat(save) + sheetAt;
  const saved = beat(save) + saveAt;
  const tap = beat(fill) + fillTimes(fill.len).tapAt;
  const sk = frame - shakeAt;
  const wobble = sk >= 0 && sk < 32 ? Math.sin(sk * 1.25) * (1 - sk / 32) : 0;

  // Focus camera: [frame, zoom, focus point]. The focus point is in screen px from the screen centre
  // (screen is 360×780), and the phone shifts so that point stays put while it scales. Each key frames
  // whatever the voice is describing; the phone is allowed to run off-frame while zoomed.
  const shot: [number, number, number, number, ((t: number) => number)?][] = [
    [enter, 1, 0, 0],
    [how, 1, 0, 0],
    [beat(save) + 24, 1.45, 0, 20, sine], // typing into the form
    [sheet - 4, 1.45, 0, 20, lin],
    [sheet + 24, 1.85, 0, 285, sine], // "Save to Kip?" sheet
    [saved + 44, 1.85, 0, 290, lin], // hold through the tap and the "Kept" toast
    [beat(fill) + 34, 1.95, -40, 140, sine], // Kip's chip in the keyboard
    [tap + 6, 1.95, -40, 140, lin],
    [tap + 34, 1.55, 0, 30, sine], // the form filling in
    [beat(shake) - 4, 1.55, 0, 40, lin],
    [beat(shake) + 22, 1, 0, 0, sine], // whole phone, so the shake reads
    [shakeAt + 22, 1, 0, 0, lin],
    [shakeAt + 54, 1.5, 0, -45, sine], // the New login sheet
    [cta, 1.5, 0, -45, lin],
    [out, 0.94, 0, 0, sine], // pull back for the end card
    [end, 0.92, 0, 0, lin],
  ];
  const s = track(frame, shot.map(([f, z, , , e]) => [f, z, e]));
  const fx = track(frame, shot.map(([f, , x, , e]) => [f, x, e]));
  const fy = track(frame, shot.map(([f, , , y, e]) => [f, y, e]));

  const pose = {
    x: track(frame, [[enter, 1500], [land, 420], [how, 420, lin], [settle, 470], [cta, 470, lin], [out, -430], [end, -440, lin]]) - fx * s + wobble * 16,
    y: track(frame, [[enter, 220], [land, 0], [how, 0, lin], [settle, 40]]) - fy * s,
    rx: track(frame, [[enter, 18], [land, 6], [how, 4, sine], [settle, 2], [cta, 2, lin], [out, 5]]),
    ry: track(frame, [[enter, -80], [land, -24], [how, 14, sine], [settle, -6], [cta, -6, lin], [out, 24], [end, 17, lin]]),
    rz: track(frame, [[enter, 16], [land, 0]]) + wobble * 9,
    s,
  };

  return (
    <Phone pose={pose}>
      <Switcher
        f={frame}
        items={[
          [enter, (f) => <Vault f={f} />],
          [beat(save), (f) => <SaveBeat f={f} len={save.len} />],
          [beat(fill), (f) => <FillBeat f={f} len={fill.len} />],
          [beat(shake), (f) => <ShakeBeat f={f} shakeAt={shakeAt - beat(shake)} />],
          [cta, () => <Vault f={999} />],
        ]}
      />
    </Phone>
  );
}

/** Decor eases in over the reveal's flat cream so the cut into the solution is invisible. */
function Cream() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = prog(frame, 0, 1.2 * fps, sine);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 50%, ${C.peach}55 0%, transparent 45%)`, opacity: grow }} />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 760,
          left: -260,
          top: 560,
          borderRadius: "58% 42% 52% 48% / 56% 50% 50% 44%",
          background: C.sand,
          rotate: `${frame / 12}deg`,
          opacity: 0.7 * grow,
          scale: 0.6 + 0.4 * grow,
          translate: `${(1 - grow) * -160}px ${(1 - grow) * 200}px`,
        }}
      />
    </AbsoluteFill>
  );
}

export function KipPromo({ t }: { t?: Timeline }) {
  const { fps } = useVideoConfig();
  if (!t) return null; // calculateMetadata always fills it
  const spans = (Object.values(t).filter((v) => typeof v === "object" && "vo" in v) as Timeline["problem"][]).flatMap((s) =>
    s.vo.map((c) => [s.from + c.at, s.from + c.at + c.len]),
  );
  // Music sits under the voice: ducked while anyone speaks, fades in and out at the ends.
  const music = (f: number) => {
    const talking = Math.max(...spans.map(([a, b]) => Math.min(prog(f, a - 10, a, lin), 1 - prog(f, b, b + 14, lin))));
    const edge = Math.min(prog(f, 0, 20, lin), 1 - prog(f, t.total - 1.5 * fps, t.total, lin));
    return edge * (f < t.reveal.from ? 0.4 : 0.55) * (1 - 0.6 * talking);
  };

  return (
    <AudioOk.Provider value={new Set(t.audio)}>
      <AbsoluteFill style={{ background: C.bg }}>
        <Sequence name="Cream background" from={t.solution.from} premountFor={fps}>
          <Cream />
        </Sequence>
        <Series>
          <Series.Sequence name="Problem" durationInFrames={t.problem.dur} premountFor={fps}>
            <Problem scene={t.problem} />
          </Series.Sequence>
          <Series.Sequence name="Reveal" durationInFrames={t.reveal.dur} premountFor={fps}>
            <Reveal scene={t.reveal} />
          </Series.Sequence>
          <Series.Sequence name="Solution" durationInFrames={t.solution.dur} premountFor={fps}>
            <Solution scene={t.solution} />
          </Series.Sequence>
          <Series.Sequence name="How it works" durationInFrames={t.how.dur} premountFor={fps}>
            <How scene={t.how} />
          </Series.Sequence>
          <Series.Sequence name="CTA" durationInFrames={t.cta.dur} premountFor={fps}>
            <Cta scene={t.cta} />
          </Series.Sequence>
        </Series>
        <PhoneLayer t={t} />
        <Snd id="music" volume={music} loop />
        <Snd id="sfx-riser" from={Math.max(0, t.reveal.from - Math.round(1.7 * fps))} volume={0.5} />
      </AbsoluteFill>
    </AudioOk.Provider>
  );
}
