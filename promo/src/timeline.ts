import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { CalculateMetadataFunction, staticFile } from "remotion";
import vo from "./vo.json";

export const FPS = 60;

export type SceneKey = keyof typeof vo;
/** All in frames. `vo[].at` is relative to the scene start. */
export type Scene = { from: number; dur: number; vo: { id: string; at: number; len: number }[] };
export type Timeline = Record<SceneKey, Scene> & { total: number; audio: string[] };

const SFX = ["sfx-glitch", "sfx-pop", "sfx-riser", "sfx-whoosh", "sfx-lock", "sfx-shimmer", "sfx-rattle", "sfx-hit", "music"];

// Seconds. A scene runs lead + clips (gap between each) + tail, and never shorter than min.
const LAYOUT: Record<SceneKey, { lead: number; gap: number; tail: number; min: number }> = {
  problem: { lead: 0.35, gap: 0.35, tail: 0.7, min: 6 }, // tail holds the collapse into the reveal
  reveal: { lead: 0.25, gap: 0, tail: 1.6, min: 2.6 }, // tail is the phone fly-in
  solution: { lead: 0.3, gap: 0.2, tail: 0.3, min: 5.5 },
  how: { lead: 0.3, gap: 0.75, tail: 1.6, min: 8.5 }, // gaps let each demo land; tail shows the New login sheet
  cta: { lead: 0.5, gap: 0, tail: 1.3, min: 3.5 },
};

const exists = async (id: string) => (await fetch(staticFile(`audio/${id}.mp3`), { method: "HEAD" })).ok;

const seconds = async (id: string) => {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(`audio/${id}.mp3`)) });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

/** Sizes every scene to its voiceover. Before audio exists, guesses from word count so the Studio still plays. */
export const calculateTimeline: CalculateMetadataFunction<{ t?: Timeline }> = async () => {
  const audio: string[] = [];
  const t = { audio } as unknown as Timeline;
  let from = 0;
  for (const key of Object.keys(LAYOUT) as SceneKey[]) {
    const { lead, gap, tail, min } = LAYOUT[key];
    const clips: Scene["vo"] = [];
    let at = lead;
    for (const [id, text] of Object.entries(vo[key])) {
      const ok = await exists(id);
      if (ok) audio.push(id);
      const len = ok ? await seconds(id) : text.split(" ").length / 2.6;
      clips.push({ id, at: Math.round(at * FPS), len: Math.round(len * FPS) });
      at += len + gap;
    }
    const dur = Math.round(Math.max(at - gap + tail, min) * FPS);
    t[key] = { from, dur, vo: clips };
    from += dur;
  }
  for (const id of SFX) if (await exists(id)) audio.push(id);
  t.total = from;
  return { durationInFrames: from, props: { t } };
};
