// Proposal mode: brand-styled business proposals from a proposal.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "../vendor/marked/marked.esm.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(p, "utf8");
const esc = (s) => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));

export function loadProposal(dir) {
  const f = path.join(dir, "proposal.json");
  if (!fs.existsSync(f)) throw new Error("no proposal.json in " + dir);
  const spec = JSON.parse(read(f));
  const meta = {
    id: spec.id || path.basename(dir), title: spec.title || "Proposal",
    brand: spec.brand || "PROPOSAL", provider: spec.provider || "", client: spec.client || "",
    date: spec.date || "", lang: spec.lang || "en",
  };
  const pages = (spec.pages || []).map((p) => {
    const kind = p.kind || "proposal-page";
    let html = p.html || marked.parse(p.md || "", { gfm: true });
    if (!html.trim() && kind.includes("back-cover")) {
      html = `<div class="back-cover-art"><h1>${meta.brand || "PROPOSAL"}</h1><p>END OF PROPOSAL</p></div>`;
    } else if (!html.trim() && kind.includes("cover")) {
      html = `<div class="cover-leather" aria-hidden="true"></div><div class="cover-tooling" aria-hidden="true"></div><div class="cover-composition"><p class="cover-subtitle">Proposal</p><h1 class="bookee-proposal-title">${esc(meta.title)}</h1><p class="bookee-proposal-client">For ${esc(meta.client)}</p></div>`;
    }
    return { title: p.title || "", kicker: p.kicker || "", kind, html };
  });
  return { mode: "proposal", meta, pages };
}

export function checkProposal(book) {
  const notes = []; let bad = 0;
  const kinds = book.pages.map((p) => p.kind);
  if (!kinds[0] || !kinds[0].includes("cover")) { notes.push("first page is not a cover"); bad = 1; }
  if (!kinds[kinds.length - 1]?.includes("back-cover")) { notes.push("last page is not a back-cover"); bad = 1; }
  if (!kinds.some((k) => k.includes("legal-page"))) notes.push("note: no legal-page (signatures?)");
  if (book.pages.some((p) => !p.kind.includes("cover") && !p.html.trim())) { notes.push("empty page body (non-cover)"); bad = 1; }
  return { bad, notes };
}

export function buildProposalHtml(dir) {
  const book = loadProposal(dir);
  const { meta } = book;
  // Config is JSON data, escaped so authored text cannot end the script element.
  // The renderer is prebuilt and shipped with the plugin, not compiled on first run.
  const config = JSON.stringify({meta,pages:book.pages}).replace(/</g, "\\u003c");
  const bundle = "window.__BOOKEE_PROPOSAL__=" + config + ";\n" + read(path.join(ROOT,"engine/proposal/runtime.js"));
  const vdir = path.join(ROOT, "engine/vendor/flipbook-renderer");
  let css = ["book.css", "renderer-core.css", "proposal.css"].map((f) => read(path.join(vdir, f))).join("\n");
  css = css.replaceAll("YOUR BRAND", meta.brand.toUpperCase())
           .replaceAll("Prepared by VENDOR NAME", meta.provider ? "Prepared by " + meta.provider : "");
  css += `
.book-page.cover .cover-composition{display:flex!important;justify-content:center!important;gap:18px!important}.bookee-proposal-title{font:400 clamp(25px,6cqi,44px)/1.15 Georgia,serif;color:#ddd6c7;text-align:center;margin:0}.bookee-proposal-client{font:400 clamp(14px,3cqi,22px)/1.4 Georgia,serif;color:#c8c1b3;text-align:center;margin:0}.book-page.cover .cover-composition:after{white-space:normal!important;margin:0!important;font-size:clamp(16px,4cqi,25px)!important;align-self:center!important}.book-page.cover .cover-composition:before{align-self:center!important}.book-page.cover .cover-composition:before{margin:0!important}`;
  const html = `<!doctype html>
<html lang="${meta.lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${meta.title}</title>
<meta name="theme-color" content="#050505">
<style>${css}</style></head>
<body><div id="root"><main style="min-height:100svh;display:grid;place-items:center;background:#050505;color:#f5f1e8;font:16px Georgia,serif"><p>Opening ${meta.title}...</p></main></div>
<script>${bundle}</script>
</body></html>`;
  return { html, model: { id: meta.id, title: meta.title, mode: "proposal", pages: book.pages.length }, book };
}
