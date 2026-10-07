import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../timeline";
import { C, clamp, F, Ico, prog, Snd } from "../ui";

type Card = { x: number; y: number; rot: number; at: number; text: string; kind: "note" | "alert" };

// x/y from frame centre. `at` is a fraction of the line the card belongs to (notes: line 1, alerts: line 2).
const NOTES: Card[] = [
  { x: -700, y: -300, rot: -8, at: 0.0, text: "netflix → password123", kind: "note" },
  { x: 640, y: -330, rot: 6, at: 0.15, text: "bank: Summer2024!", kind: "note" },
  { x: -720, y: 250, rot: 5, at: 0.3, text: "wifi = qwerty", kind: "note" },
  { x: 690, y: 270, rot: -5, at: 0.45, text: "SAME ONE FOR\nEVERYTHING", kind: "note" },
  { x: -260, y: -400, rot: 3, at: 0.6, text: "email: alex1990", kind: "note" },
  { x: 300, y: 400, rot: -3, at: 0.75, text: "pin 0000 (don't forget)", kind: "note" },
];
const ALERTS: Card[] = [
  { x: 420, y: -235, rot: 0, at: 0.0, text: "Password reused on 14 sites", kind: "alert" },
  { x: -430, y: 235, rot: 0, at: 0.25, text: "Forgot password? Reset again", kind: "alert" },
  { x: 470, y: 250, rot: 0, at: 0.5, text: "Found in a data breach", kind: "alert" },
];

const NOTE_TINTS = [C.peach, "#F3E3C6", C.sand, "#F4DCCB"];

export function Problem({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [a, b] = scene.vo;
  const end = scene.dur;
  // Everything gets sucked into one ember dot, which becomes the logo in the next scene.
  const collapse = prog(frame, end - 0.45 * fps, end, (t) => t * t * t);
  const serverAt = b.at + b.len * 0.62;
  const glitch = (at: number) => frame >= at && frame < at + 9;
  const glitching = glitch(b.at) || glitch(serverAt);
  const jx = glitching ? Math.sin(frame * 9.1) * 10 : 0;

  const card = (c: Card, i: number, line: typeof a) => {
    const at = line.at + c.at * line.len;
    const p = prog(frame, at, at + 14, (t) => 1 - (1 - t) ** 3 * Math.cos(t * 6));
    if (frame < at) return null;
    const float = Math.sin((frame + i * 40) / 40) * 6;
    const k = 1 - collapse;
    return (
      <div
        key={c.text}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: `calc(-50% + ${c.x * k}px) calc(-50% + ${(c.y + float) * k}px)`,
          rotate: `${c.rot * k}deg`,
          scale: p * k,
          ...(c.kind === "note"
            ? {
                padding: "26px 30px",
                width: 330,
                background: NOTE_TINTS[i % NOTE_TINTS.length],
                color: C.ink,
                fontFamily: F.mono,
                fontWeight: 600,
                fontSize: 30,
                whiteSpace: "pre-line",
                boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                borderRadius: 4,
              }
            : {
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "22px 28px",
                borderRadius: 22,
                background: "#3A2723",
                border: `2px solid ${C.dangerLine}`,
                color: "#FBE3DF",
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 32,
                boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
              }),
        }}
      >
        {c.kind === "alert" && <Ico name="warn" size={36} color={C.dangerLine} width={2.4} />}
        {c.text}
      </div>
    );
  };

  const word = (text: string, at: number, color: string = C.bg) => {
    const p = prog(frame, at, at + 12);
    return (
      <span style={{ display: "inline-block", opacity: p, translate: `0 ${(1 - p) * 40}px`, color, marginRight: "0.25em" }}>{text}</span>
    );
  };

  const line1 = 1 - prog(frame, b.at - 8, b.at + 4);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #33291F 0%, #1A1512 70%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${jx}px 0` }}>
        {NOTES.map((c, i) => card(c, i, a))}
        {ALERTS.map((c, i) => card(c, i, b))}
        {/* "someone else's server": a cloud that glitches red */}
        {frame >= serverAt && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 150,
              translate: "-50% 0",
              scale: prog(frame, serverAt, serverAt + 12) * (1 - collapse),
              filter: glitching ? `drop-shadow(8px 0 0 ${C.dangerLine}) drop-shadow(-8px 0 0 #4FB3BF)` : undefined,
            }}
          >
            <Ico name="cloudOff" size={150} color={C.dangerLine} width={1.6} />
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 124,
          letterSpacing: -3,
          lineHeight: 1.02,
          textAlign: "center",
          opacity: 1 - collapse,
          textShadow: glitching ? `6px 0 ${C.dangerLine}, -6px 0 #4FB3BF` : "0 6px 40px rgba(0,0,0,0.6)",
        }}
      >
        {line1 > 0 ? (
          <div style={{ opacity: line1, maxWidth: 1100 }}>
            {word("Your", a.at)}
            {word("passwords", a.at + 6)}
            <br />
            {word("are", a.at + 14)}
            {word("everywhere.", a.at + 20, C.peach)}
          </div>
        ) : (
          <div style={{ maxWidth: 1300 }}>
            {word("Reused.", b.at)}
            {word("Forgotten.", b.at + b.len * 0.18)}
            <br />
            <span style={{ fontSize: 84 }}>
              {word("On", b.at + b.len * 0.38)}
              {word("someone", b.at + b.len * 0.45)}
              {word("else’s", b.at + b.len * 0.52)}
              {word("server.", serverAt, C.dangerLine)}
            </span>
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: C.ember,
            scale: interpolate(collapse, [0.6, 1], [0, 1], clamp),
          }}
        />
      </AbsoluteFill>

      {NOTES.slice(0, 5).map((c) => (
        <Snd key={c.text} id="sfx-pop" from={Math.round(a.at + c.at * a.len)} volume={0.35} />
      ))}
      <Snd id="sfx-glitch" from={b.at} volume={0.45} />
      <Snd id="sfx-glitch" from={Math.round(serverAt)} volume={0.6} />
      <Snd id={a.id} from={a.at} />
      <Snd id={b.id} from={b.at} />
    </AbsoluteFill>
  );
}
