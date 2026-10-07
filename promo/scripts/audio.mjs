// Generates every audio asset for the promo from ElevenLabs into public/audio.
// Run: node --env-file=.env scripts/audio.mjs
// Existing files are skipped, so re-runs cost nothing. Delete a file to regenerate it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("Set ELEVENLABS_API_KEY in promo/.env");

const OUT = "public/audio";
const VOICE = process.env.ELEVENLABS_VOICE_ID ?? "nPczCjzI2devNBz1zQrb"; // Brian: deep, calm narrator

// One clip per sentence, so scenes can time each beat to its line. Edit the script in src/vo.json.
const VO = Object.assign({}, ...Object.values(JSON.parse(readFileSync("src/vo.json", "utf8"))));

const SFX = {
  "sfx-glitch": ["Short digital glitch error buzz, harsh data corruption stutter", 1.2],
  "sfx-pop": ["Soft modern UI notification pop, clean and subtle", 0.6],
  "sfx-riser": ["Short cinematic riser swelling up into a hit, tension build", 2.0],
  "sfx-whoosh": ["Fast smooth air whoosh, object flying past the camera", 1.0],
  "sfx-lock": ["Satisfying solid metallic lock click, secure latch", 0.6],
  "sfx-shimmer": ["Bright magical sparkle shimmer, quick UI success chime", 1.0],
  "sfx-rattle": ["Phone shaking in hand, quick plastic rattle, three shakes", 0.8],
  "sfx-hit": ["Deep warm cinematic logo impact with soft reverb tail", 2.5],
};

const MUSIC_PROMPT =
  "Warm minimal modern electronic, confident and optimistic tech product promo, 110 bpm, soft plucks, " +
  "airy pads, tight punchy drums. Tense filtered intro for the first 6 seconds, then the full beat drops " +
  "and builds gently, clean resolved ending. Instrumental.";

async function post(path, body) {
  const res = await fetch(`https://api.elevenlabs.io${path}`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function make(name, fn) {
  const file = `${OUT}/${name}.mp3`;
  if (existsSync(file)) return console.log(`skip ${file}`);
  writeFileSync(file, await fn());
  console.log(`wrote ${file}`);
}

mkdirSync(OUT, { recursive: true });

for (const [id, text] of Object.entries(VO)) {
  await make(id, () =>
    post(`/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    }),
  );
}

for (const [id, [text, duration_seconds]] of Object.entries(SFX)) {
  await make(id, () =>
    post("/v1/sound-generation?output_format=mp3_44100_128", { text, duration_seconds, prompt_influence: 0.6 }),
  );
}

// The Music API may be unavailable on the free plan; fall back to a looping SFX-model bed.
await make("music", async () => {
  try {
    return await post("/v1/music", { prompt: MUSIC_PROMPT, music_length_ms: 30000, force_instrumental: true });
  } catch (e) {
    console.warn(`music API failed, using looped bed instead: ${e.message}`);
    return post("/v1/sound-generation?output_format=mp3_44100_128", {
      text: "Warm minimal electronic music loop, soft plucks, airy pads, gentle punchy beat, 110 bpm, optimistic tech",
      duration_seconds: 30,
      loop: true,
      prompt_influence: 0.5,
    });
  }
});
