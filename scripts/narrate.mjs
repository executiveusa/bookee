#!/usr/bin/env node
// Narration generator for a Bookee adventure book (ElevenLabs, word-level timestamps).
// Run on YOUR machine. The key is read from your environment and never written anywhere.
//   export ELEVENLABS_API_KEY=...        (or put ELEVENLABS_API_KEY=... in .env.local in the repo root)
//   node scripts/narrate.mjs examples/lantern-door
// Optional: ELEVENLABS_VOICE_ID=<id> to pick a voice. Re-running skips files that already exist.
// Output: <book>/narration/<key>.mp3, <key>.json (words + times), manifest.json.
// Keep <book>/narration/ OUT of any public path (it is gitignored by default).
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2] || "examples/lantern-door";
if (fs.existsSync(".env.local")) for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) { const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY is not set. export it, or add it to .env.local in the repo root."); process.exit(1); }
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const H = { "xi-api-key": KEY };
// Same hash as engine/reader.js (FNV-1a over UTF-16 code units). Do not change one without the other.
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
async function pickVoice() {
  if (process.env.ELEVENLABS_VOICE_ID) return { id: process.env.ELEVENLABS_VOICE_ID, name: "(from ELEVENLABS_VOICE_ID)" };
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: H }); if (!r.ok) throw new Error("voices list failed: " + r.status + " " + await r.text());
  const vs = (await r.json()).voices || [];
  const lab = (v) => JSON.stringify(v.labels || {}).toLowerCase() + " " + (v.description || "").toLowerCase();
  const score = (v) => { const t = lab(v); return (/male/.test(t) && !/female/.test(t) ? 3 : 0) + (/spanish|mexic|latin/.test(t) ? 3 : 0) + (/story|narrat|warm|calm/.test(t) ? 1 : 0); };
  const best = vs.map((v) => [score(v), v]).sort((a, b) => b[0] - a[0])[0];
  if (!best || best[0] < 3) throw new Error("No clear male Spanish voice in your account. Set ELEVENLABS_VOICE_ID (pick one in the ElevenLabs Voice Library and add it to your voices).");
  return { id: best[1].voice_id, name: best[1].name };
}
// Spanish segments = the text before "(English)" in every story line, same split rule as the reader.
const src = fs.readFileSync(path.join(dir, "story.ink"), "utf8").split("\n");
const segs = new Map();
for (const raw of src) {
  const l = raw.trim(); if (!l || /^(\/\/|===|VAR |->|~|#|\*|\+|\{|\}|INCLUDE|LIST|-)/.test(l)) continue;
  const re = /([^()]+?)\s*\(([^()]+)\)/g; let m; while ((m = re.exec(l))) { const es = m[1].trim(); if (es && /[A-Za-zÁÉÍÓÚáéíóúñ¡¿]/.test(es)) segs.set(fnv(es), es); }
}
const out = path.join(dir, "narration"); fs.mkdirSync(out, { recursive: true });
const voice = await pickVoice(); console.log("voice:", voice.name, voice.id, "model:", MODEL, "segments:", segs.size);
const manifest = fs.existsSync(path.join(out, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8")) : { voice: voice.id, model: MODEL, segments: {} };
manifest.voice = voice.id; manifest.model = MODEL;
let made = 0, skipped = 0, failed = 0;
for (const [key, text] of segs) {
  const mp3 = path.join(out, key + ".mp3"), js = path.join(out, key + ".json");
  if (fs.existsSync(mp3) && fs.existsSync(js)) { manifest.segments[key] = { text, mp3: key + ".mp3", words: key + ".json" }; skipped++; continue; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}/with-timestamps?output_format=mp3_44100_64`, { method: "POST", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify({ text, model_id: MODEL, language_code: "es" }) });
  if (!r.ok) { failed++; console.error("FAIL", key, r.status, (await r.text()).slice(0, 200)); if (r.status === 401 || r.status === 429) break; continue; }
  const j = await r.json(); const a = j.alignment || j.normalized_alignment; if (!a) { failed++; console.error("no alignment for", key); continue; }
  // characters -> words (split on whitespace, same as the reader's word spans)
  const words = []; let cur = "", st = 0, en = 0;
  a.characters.forEach((c, i) => { if (/\s/.test(c)) { if (cur) { words.push({ w: cur, s: st, e: en }); cur = ""; } } else { if (!cur) st = a.character_start_times_seconds[i]; cur += c; en = a.character_end_times_seconds[i]; } });
  if (cur) words.push({ w: cur, s: st, e: en });
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, "base64")); fs.writeFileSync(js, JSON.stringify(words));
  manifest.segments[key] = { text, mp3: key + ".mp3", words: key + ".json" }; made++;
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
  process.stdout.write(`\r${made + skipped}/${segs.size}`);
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`\ndone. made ${made}, skipped ${skipped}, failed ${failed}. Next: PBM_NARRATION=1 node bin/bookmaker.mjs build ${dir}  (private build only)`);
