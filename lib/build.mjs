// Assemble one self-contained book HTML file from a source folder.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "../vendor/marked/marked.esm.mjs";
import { compileInk } from "./ink.mjs";
import { buildProposalHtml } from "./proposal.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(p, "utf8");

export function fontCss() {
  const dir = path.join(ROOT, "assets/fonts");
  const faces = [
    ["Bodoni Moda", 400, "normal", "bodoni-moda-latin-400-normal"], ["Bodoni Moda", 500, "normal", "bodoni-moda-latin-500-normal"],
    ["Bodoni Moda", 600, "normal", "bodoni-moda-latin-600-normal"], ["Bodoni Moda", 700, "normal", "bodoni-moda-latin-700-normal"],
    ["Bodoni Moda", 400, "italic", "bodoni-moda-latin-400-italic"], ["Bodoni Moda", 500, "italic", "bodoni-moda-latin-500-italic"],
    ["Newsreader", 400, "normal", "newsreader-latin-400-normal"], ["Newsreader", 500, "normal", "newsreader-latin-500-normal"],
    ["Newsreader", 600, "normal", "newsreader-latin-600-normal"], ["Newsreader", 400, "italic", "newsreader-latin-400-italic"],
    ["Newsreader", 500, "italic", "newsreader-latin-500-italic"],
  ];
  return faces.map(([fam, w, st, f]) => {
    const b64 = fs.readFileSync(path.join(dir, f + ".woff2")).toString("base64");
    return `@font-face{font-family:"${fam}";font-weight:${w};font-style:${st};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  }).join("\n");
}

export function parseFront(src) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  const meta = {};
  if (m) { for (const line of m[1].split("\n")) { const k = /^(\w+):\s*(.*)$/.exec(line); if (k) meta[k[1]] = k[2].replace(/^["']|["']$/g, ""); } }
  return { meta, body: m ? src.slice(m[0].length) : src };
}
export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "book";

export function loadBook(dir) {
  const bookMd = path.join(dir, "book.md"), inkF = path.join(dir, "story.ink");
  if (fs.existsSync(bookMd)) {
    const { meta, body } = parseFront(read(bookMd));
    const chapters = []; let cur = null;
    for (const line of body.split("\n")) {
      const h = /^# (.+)$/.exec(line);
      if (h) { cur = { title: h[1].trim(), md: "" }; chapters.push(cur); } else if (cur) cur.md += line + "\n";
    }
    for (const c of chapters) { c.html = marked.parse(c.md, { gfm: true, breaks: false }); c.kind = /^(about|colophon)/i.test(c.title) ? "colophon" : "chapter"; c.words = c.md.split(/\s+/).filter(Boolean).length; }
    return { mode: "guide", meta, chapters };
  }
  if (fs.existsSync(inkF)) {
    const meta = fs.existsSync(path.join(dir, "book.json")) ? JSON.parse(read(path.join(dir, "book.json"))) : {};
    const src = read(inkF);
    const { json, errors, warnings } = compileInk(src);
    const assets = {};
    const adir = path.join(dir, "art");
    if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) { const ext = path.extname(f).slice(1).toLowerCase(); const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" ? "image/jpeg" : "image/" + ext; assets[path.basename(f, path.extname(f))] = `data:${mime};base64,` + fs.readFileSync(path.join(adir, f)).toString("base64"); }
    const slotNames = [...new Set([...src.matchAll(/#\s*image\s*:\s*(\S+)/g)].map((m) => m[1]))];
    const songs = [...new Set([...src.matchAll(/#\s*song\s*:\s*(\S+)/g)].map((m) => m[1]))];
    const slots = [...slotNames.map((n) => ({ id: n, kind: "image", filled: !!assets[n] })), ...songs.map((n) => ({ id: n, kind: "audio", filled: false }))];
    const endings = [...new Set([...src.matchAll(/#\s*ending\s*:\s*(.+)$/gm)].map((m) => m[1].trim()))];
    let narration = null; const nm = path.join(dir, "narration/manifest.json");
    if (process.env.PBM_NARRATION === "1" && fs.existsSync(nm)) { const man = JSON.parse(read(nm)); narration = {}; for (const [k, v] of Object.entries(man.segments || {})) { const mp = path.join(dir, "narration", v.mp3), wp = path.join(dir, "narration", v.words); if (fs.existsSync(mp) && fs.existsSync(wp)) narration[k] = { a: "data:audio/mpeg;base64," + fs.readFileSync(mp).toString("base64"), w: JSON.parse(read(wp)) }; } }
    return { mode: "adventure", meta, src, slots, ink: json, inkErrors: errors, inkWarnings: warnings, assets, endings, narration };
  }
  throw new Error("No book.md or story.ink in " + dir);
}

export function buildHtml(dir, opts = {}) {
  if (fs.existsSync(path.join(dir, "proposal.json"))) return buildProposalHtml(dir);
  const b = loadBook(dir);
  if (b.inkErrors?.length) throw new Error("Ink compile errors:\n" + b.inkErrors.join("\n"));
  const meta = b.meta;
  const model = {
    id: meta.id || slugify(meta.title || path.basename(dir)), title: meta.title || "Untitled", subtitle: meta.subtitle || "", author: meta.author || "",
    backline: meta.backline || "", mode: b.mode, songLabel: meta.songLabel || "",
  };
  if (b.mode === "guide") model.chapters = b.chapters.map((c) => ({ title: c.title, html: c.html, kind: c.kind }));
  else { model.ink = JSON.parse(b.ink); model.endingsTotal = b.endings.length; model.assets = b.assets; if (b.narration) model.narration = b.narration; model.slots = !!meta.slots; }
  const css = read(path.join(ROOT, "engine/reader.css")), js = read(path.join(ROOT, "engine/reader.js"));
  const inkRt = b.mode === "adventure" ? `<script>${read(path.join(ROOT, "vendor/ink-runtime.js"))}</script>` : "";
  const data = JSON.stringify(model).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");
  const html = `<!doctype html>
<html lang="${meta.lang || "en"}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(model.title)}</title>
<meta name="theme-color" content="#d8d0bd">
<style>${fontCss()}\n${css}</style></head>
<body><div id="app"></div>
<noscript><p style="padding:2rem;font-family:Georgia,serif">This book needs JavaScript. A plain-text copy is available from the author.</p></noscript>
${inkRt}
<script>window.__BOOK__=${data};</script>
<script>${js}</script>
</body></html>`;
  return { html, model, book: b };
}
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
