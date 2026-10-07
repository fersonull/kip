import type { CSSProperties, ReactNode } from "react";
import { interpolate } from "remotion";
import { SCREEN_H, SCREEN_W } from "./Phone";
import { FPS } from "./timeline";
import { C, clamp, F, Ico, Logo, Pebble, prog, tintFor } from "./ui";

const sec = (s: number) => s * FPS;
const typed = (text: string, f: number, a: number, b: number) => text.slice(0, Math.round(text.length * prog(f, a, b, (t) => t)));
const cursor = (f: number) => (Math.floor(f / 28) % 2 ? "transparent" : C.ember);
const fill: CSSProperties = { position: "absolute", inset: 0 };

const EMAIL = "alex@mailo.com";

function StatusBar({ color = C.ink }: { color?: string }) {
  return (
    <div style={{ height: 40, padding: "12px 26px 0", display: "flex", justifyContent: "space-between", fontFamily: F.body, fontWeight: 500, fontSize: 13, color }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <span style={{ width: 20, height: 10, borderRadius: 3, border: `1.5px solid ${color}`, padding: 1 }}>
          <span style={{ display: "block", width: "75%", height: "100%", borderRadius: 1, background: color }} />
        </span>
      </span>
    </div>
  );
}

/** Expanding ring where a finger lands. */
function Tap({ x, y, at, f }: { x: number; y: number; at: number; f: number }) {
  const p = prog(f, at, at + 22);
  if (f < at || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        background: "rgba(42,36,32,0.18)",
        border: "2px solid rgba(42,36,32,0.35)",
        scale: interpolate(p, [0, 1], [0.5, 1.4]),
        opacity: 1 - p,
      }}
    />
  );
}

// ——— Kip's vault ("Your pocket"), mirrors src/app/index.tsx ———

const FAVS = [
  ["Ember Bank", "alex.rivera"],
  ["Mailo", EMAIL],
];
const REST = [
  ["Northwind Air", EMAIL],
  ["Pixelhub", "arivera"],
  ["Shoply", EMAIL],
  ["Studio Notes", "alex"],
  ["Trailpass", "alex.r"],
  ["Tunely", "alexr_music"],
];

function Row({ title, user, fav, i, f }: { title: string; user: string; fav?: boolean; i: number; f: number }) {
  const p = prog(f, 6 + i * 4, 30 + i * 4);
  return (
    <div style={{ height: 58, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", opacity: p, translate: `0 ${(1 - p) * 16}px` }}>
      <Pebble w={40} h={36} color={tintFor(title)}>
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.ink }}>{title[0]}</span>
      </Pebble>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 15, color: C.ink }}>{title}</div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{user}</div>
      </div>
      {fav && <span style={{ color: C.ember, fontSize: 17 }}>★</span>}
    </div>
  );
}

const Head = ({ children }: { children: ReactNode }) => (
  <div style={{ height: 36, padding: "14px 20px 0", fontFamily: F.mono, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, color: C.faint }}>{children}</div>
);

export function Vault({ f }: { f: number }) {
  return (
    <div style={{ ...fill, background: C.bg }}>
      <StatusBar />
      <div style={{ padding: "18px 20px 4px", fontFamily: F.display, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: C.ink }}>Your pocket</div>
      <div style={{ padding: "0 20px 10px", fontFamily: F.body, fontSize: 13, color: C.muted }}>8 logins · all on this phone</div>
      <Head>★ FAVORITES</Head>
      {FAVS.map(([t, u], i) => (
        <Row key={t} title={t} user={u} fav i={i} f={f} />
      ))}
      <Head>EVERYTHING ELSE</Head>
      {REST.map(([t, u], i) => (
        <Row key={t} title={t} user={u} i={i + 2} f={f} />
      ))}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 20, display: "flex", gap: 10 }}>
        <div style={{ flex: 1, height: 56, borderRadius: 28, background: C.ink, display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth={2.2} strokeLinecap="round">
            <circle cx={10.5} cy={10.5} r={6.5} />
            <path d="M15.5 15.5L20 20" />
          </svg>
          <span style={{ fontFamily: F.body, fontSize: 15, color: "#9A8E84" }}>Find a login</span>
        </div>
        <Pebble w={56} h={56}>
          <span style={{ fontFamily: F.body, fontSize: 32, lineHeight: 1, color: C.ink, marginTop: -3 }}>+</span>
        </Pebble>
      </div>
    </div>
  );
}

// ——— A third-party app's sign-in (anywhere Kip autofills) ———

const NAVY = "#1F3A5F";

function Field({ label, value, focused, f, autofilled = 0, mono }: { label: string; value: string; focused?: boolean; f: number; autofilled?: number; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 12, color: "#5B6575", marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 50,
          borderRadius: 12,
          border: `1.5px solid ${focused ? NAVY : "#D5DAE1"}`,
          background: autofilled ? `rgba(244,181,143,${0.35 * autofilled})` : "#fff",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: mono ? F.mono : F.body,
          fontSize: mono ? 18 : 15,
          letterSpacing: mono ? 2 : 0,
          color: "#16202E",
        }}
      >
        {value}
        {focused && <span style={{ width: 2, height: 20, marginLeft: 1, background: cursor(f) }} />}
      </div>
    </div>
  );
}

function LoginApp({ f, email, pw, focus, pressAt, autofilled = 0, signedIn = 0 }: {
  f: number; email: string; pw: number; focus?: "email" | "pw"; pressAt?: number; autofilled?: number; signedIn?: number;
}) {
  const pressed = pressAt !== undefined && f >= pressAt && f < pressAt + 10;
  return (
    <div style={{ ...fill, background: "#F4F6F9" }}>
      <StatusBar color="#16202E" />
      <div style={{ padding: "34px 26px 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="#fff">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
        </div>
        <div style={{ margin: "22px 0 4px", fontFamily: F.body, fontWeight: 700, fontSize: 26, color: "#16202E" }}>Northwind Air</div>
        <div style={{ marginBottom: 26, fontFamily: F.body, fontSize: 14, color: "#5B6575" }}>Sign in to manage your trips</div>
        <Field label="Email" value={email} focused={focus === "email"} f={f} autofilled={autofilled} />
        <Field label="Password" value={"•".repeat(pw)} focused={focus === "pw"} f={f} autofilled={autofilled} mono />
        <div
          style={{
            marginTop: 10,
            height: 52,
            borderRadius: 26,
            background: signedIn ? "#2E7D4F" : NAVY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            scale: pressed ? 0.97 : 1,
          }}
        >
          {signedIn ? <Ico name="check" size={20} color="#fff" width={2.6} /> : null}
          {signedIn ? "Signed in" : "Sign in"}
        </div>
      </div>
    </div>
  );
}

/** Beat 1: sign in somewhere, Kip offers to save. `len` is the voice line, which places the sheet on "Kip offers". */
export const saveTimes = (len: number) => {
  const sheetAt = Math.max(sec(1.45), len * 0.42);
  return { sheetAt, saveAt: sheetAt + sec(1.0) };
};
export function SaveBeat({ f, len }: { f: number; len: number }) {
  const { sheetAt, saveAt } = saveTimes(len);
  const sheet = prog(f, sheetAt, sheetAt + 18) - prog(f, saveAt + 12, saveAt + 28, (t) => t * t);
  const toast = prog(f, saveAt + 20, saveAt + 34);
  return (
    <div style={fill}>
      <LoginApp
        f={f}
        email={typed(EMAIL, f, sec(0.1), sec(0.75))}
        pw={Math.round(10 * prog(f, sec(0.85), sec(1.2), (t) => t))}
        focus={f < sec(0.8) ? "email" : f < sheetAt ? "pw" : undefined}
        pressAt={sheetAt - 14}
      />
      <Tap x={180} y={444} at={sheetAt - 14} f={f} />
      <div style={{ ...fill, background: `rgba(10,14,20,${0.35 * sheet})` }} />
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 10,
          padding: "20px 20px 18px",
          borderRadius: 28,
          background: "#fff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          translate: `0 ${(1 - sheet) * 260}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo w={38} />
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 21, color: C.ink, letterSpacing: -0.4 }}>Save to Kip?</div>
        </div>
        <div style={{ margin: "14px 0 4px", fontFamily: F.body, fontWeight: 700, fontSize: 15, color: C.ink }}>Northwind Air</div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{EMAIL} · ••••••••••</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <div style={{ height: 44, padding: "0 16px", borderRadius: 22, display: "flex", alignItems: "center", fontFamily: F.body, fontWeight: 500, fontSize: 14, color: C.muted }}>Not now</div>
          <div
            style={{
              height: 44,
              padding: "0 22px",
              borderRadius: 22,
              background: C.ember,
              display: "flex",
              alignItems: "center",
              fontFamily: F.body,
              fontWeight: 700,
              fontSize: 14,
              color: C.ink,
              scale: f >= saveAt && f < saveAt + 10 ? 0.94 : 1,
            }}
          >
            Save
          </div>
        </div>
        <Tap x={290} y={150} at={saveAt} f={f} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          bottom: 36,
          height: 48,
          borderRadius: 24,
          background: C.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: F.body,
          fontWeight: 500,
          fontSize: 14,
          color: C.bg,
          opacity: toast,
          translate: `0 ${(1 - toast) * 20}px`,
        }}
      >
        <Ico name="check" size={18} color={C.peach} width={2.6} />
        Kept. It’s in your pocket.
      </div>
    </div>
  );
}

function Keyboard({ f, chipAt, children }: { f: number; chipAt: number; children: ReactNode }) {
  const chip = prog(f, chipAt, chipAt + 16);
  const rows = [10, 9, 7];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 286, background: "#E7E1DA", padding: "8px 6px 0" }}>
      <div style={{ height: 48, display: "flex", alignItems: "center", padding: "0 6px", opacity: chip, translate: `${(1 - chip) * 40}px 0` }}>{children}</div>
      {rows.map((n, r) => (
        <div key={r} style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 9 }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} style={{ width: 29, height: 40, borderRadius: 6, background: "#FBF8F4", boxShadow: "0 1px 0 rgba(0,0,0,0.12)" }} />
          ))}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 9 }}>
        <div style={{ width: 58, height: 40, borderRadius: 6, background: "#D3CBC2" }} />
        <div style={{ width: 186, height: 40, borderRadius: 6, background: "#FBF8F4" }} />
        <div style={{ width: 58, height: 40, borderRadius: 6, background: "#D3CBC2" }} />
      </div>
    </div>
  );
}

/** Beat 2: next visit, Kip's chip in the keyboard fills the form. */
export const fillTimes = (len: number) => ({ tapAt: Math.max(sec(0.95), len * 0.4) });
export function FillBeat({ f, len }: { f: number; len: number }) {
  const chipAt = sec(0.2);
  const { tapAt } = fillTimes(len);
  const filled = prog(f, tapAt + 4, tapAt + 16);
  const kbOut = prog(f, tapAt + 14, tapAt + 34, (t) => t * t);
  const signAt = tapAt + sec(0.75);
  return (
    <div style={fill}>
      <LoginApp
        f={f}
        email={filled > 0 ? EMAIL : ""}
        pw={filled > 0 ? 10 : 0}
        focus={filled > 0 ? undefined : "email"}
        autofilled={filled - prog(f, signAt + 20, signAt + 50)}
        pressAt={signAt}
        signedIn={f >= signAt + 8 ? 1 : 0}
      />
      <Tap x={180} y={444} at={signAt} f={f} />
      <div style={{ ...fill, top: undefined, height: 286, translate: `0 ${kbOut * 300}px` }}>
        <Keyboard f={f} chipAt={chipAt}>
          <div
            style={{
              height: 38,
              padding: "0 14px 0 8px",
              borderRadius: 19,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              scale: f >= tapAt && f < tapAt + 10 ? 0.94 : 1,
            }}
          >
            <Logo w={24} />
            <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13, color: C.ink }}>Northwind Air</span>
            <span style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{EMAIL}</span>
          </div>
          <Tap x={130} y={30} at={tapAt} f={f} />
        </Keyboard>
      </div>
    </div>
  );
}

/** Beat 3: shake the phone, Kip's add sheet opens. The phone itself shakes in KipPromo at the same `shakeAt`. */
export function ShakeBeat({ f, shakeAt }: { f: number; shakeAt: number }) {
  const sheet = prog(f, shakeAt + sec(0.4), shakeAt + sec(0.4) + 20);
  const pw = "k7#Rv-pL2q-9xWm";
  const typeAt = shakeAt + sec(0.75);
  return (
    <div style={fill}>
      <Vault f={999} />
      <div style={{ ...fill, background: `rgba(42,36,32,${0.4 * sheet})` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: SCREEN_H - 90,
          borderRadius: "28px 28px 0 0",
          background: C.sheet,
          padding: "10px 20px",
          translate: `0 ${(1 - sheet) * (SCREEN_H - 60)}px`,
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.handle, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: F.body, fontSize: 22, color: C.ink, width: 24 }}>×</span>
          <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, color: C.ink }}>New login</span>
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 18 }}>Opened with a shake. Add it in seconds.</div>
        <KipField label="Name" value={typed("Ember Bank", f, typeAt, typeAt + sec(0.45))} focused={f < typeAt + sec(0.5)} f={f} />
        <KipField label="Username or email" value={f > typeAt + sec(0.5) ? "alex.rivera" : ""} f={f} />
        <KipField label="Password" value={pw} mono f={f} />
        <div
          style={{
            marginTop: 8,
            height: 56,
            borderRadius: 28,
            background: C.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 16,
            color: C.bg,
          }}
        >
          Save to pocket
        </div>
      </div>
    </div>
  );
}

function KipField({ label, value, focused, mono, f }: { label: string; value: string; focused?: boolean; mono?: boolean; f: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 52,
          borderRadius: 16,
          background: C.card,
          border: `1.5px solid ${focused ? C.ember : C.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontFamily: mono ? F.mono : F.body,
          fontSize: mono ? 15 : 16,
          color: C.ink,
        }}
      >
        {value}
        {focused && <span style={{ width: 2, height: 20, marginLeft: 1, background: cursor(f) }} />}
      </div>
    </div>
  );
}

/** Slides each new screen in over the previous one, like an app switch. */
export function Switcher({ f, items }: { f: number; items: [number, (f: number) => ReactNode][] }) {
  let i = 0;
  while (i + 1 < items.length && f >= items[i + 1][0]) i++;
  const p = interpolate(f - items[i][0], [0, 16], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  return (
    <div style={{ ...fill, width: SCREEN_W, height: SCREEN_H }}>
      {i > 0 && p < 1 && <div style={{ ...fill, translate: `${-p * 90}px 0`, opacity: 1 - p * 0.6 }}>{items[i - 1][1](f - items[i - 1][0])}</div>}
      <div style={{ ...fill, translate: `${(1 - p) * (i > 0 ? SCREEN_W : 0)}px 0`, boxShadow: i > 0 && p < 1 ? "-10px 0 30px rgba(0,0,0,0.2)" : undefined }}>
        {items[i][1](f - items[i][0])}
      </div>
    </div>
  );
}
