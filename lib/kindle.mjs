// Kindle (KDP) export: EPUB 3 reflowable + marketing cover at KDP spec + publish sheet.
// KDP rules sourced 2026-10-19 from official pages (see KINDLE-PUBLISH.txt for URLs):
//  - EPUB accepted per Kindle Publishing Guidelines (kdp.amazon.com/help/topic/G200634390)
//  - Marketing cover: 2560h x 1600w px, JPEG, RGB, <=5MB (kdp.amazon.com/help/topic/G6GTK3T3NUHKLEFX)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadBook, slugify } from "./build.mjs";
import { loadProposal } from "./proposal.mjs";
import { marked } from "marked";
import { makeZip } from "./zip.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inkToSections(src) {
  // Linear read of an ink story: knots become sections, choice/tag lines stripped.
  const sections = [];
  let cur = null;
  for (const line of src.split("\n")) {
    const knot = line.match(/^===\s*([A-Za-z0-9_]+)\s*===/);
    if (knot) { cur = { title: knot[1].replace(/_/g, " "), md: "" }; sections.push(cur); continue; }
    if (!cur) continue;
    if (/^\s*(\*\s|\+\s|->|#|~)/.test(line)) continue; // choices, diverts, tags, vars
    cur.md += line + "\n";
  }
  return sections.filter((s) => s.md.trim().length > 0);
}

export function exportKindle(dir, outDir) {
  let meta, chapters;
  if (fs.existsSync(path.join(dir, "proposal.json"))) {
    const p = loadProposal(dir);
    meta = { id: p.meta.id, title: p.meta.title || "Proposal", author: p.meta.provider || p.meta.brand || "", language: p.meta.lang };
    chapters = p.pages.filter((pg) => pg.html && !(pg.kind || "").includes("cover")).map((pg, i) => ({ title: pg.title || `Section ${i + 1}`, html: pg.html }));
  } else {
    const b = loadBook(dir);
    meta = b.meta;
    if (b.mode === "guide") chapters = b.chapters.map((c) => ({ title: c.title, html: c.html }));
    else {
      const raw = fs.readFileSync(path.join(dir, "story.ink"), "utf8");
      chapters = inkToSections(raw).map((s) => ({ title: s.title, html: marked.parse(s.md, { gfm: true }) }));
    }
  }
  const id = slugify(meta.id || meta.title || "book");
  const title = meta.title || "Untitled";
  const author = String(meta.author || "").trim();
  if (!author) throw new Error("Add an author to book.md or book.json before exporting. For proposals, set provider in proposal.json.");
  if (chapters.some(c => !c.html.replace(/<[^>]*>/g, "").trim())) throw new Error("Fill the empty chapters before exporting.");
  const lang = meta.language || "en";
  const out = path.join(outDir, `${id}-kindle`);
  fs.mkdirSync(out, { recursive: true });

  // Cover at KDP marketing spec via PIL helper (1600x2560 JPEG, RGB).
  const coverPath = path.join(out, "cover.jpg");
  const coverScript = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "scripts", "make-cover.py");
  execFileSync("python3", [coverScript, "--title", title, "--author", author, "--out", coverPath], { stdio: "pipe" });
  const coverBytes = fs.readFileSync(coverPath);

  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const uuid = "urn:uuid:" + crypto.randomUUID();
  const chapFiles = chapters.map((c, i) => `ch${String(i + 1).padStart(3, "0")}.xhtml`);
  const xhtmlPage = (t, body) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${esc(lang)}">
<head><meta charset="utf-8"/><title>${esc(t)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body></html>`;

  const entries = [
    { name: "mimetype", data: "application/epub+zip", store: true },
    { name: "META-INF/container.xml", data: `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>` },
    { name: "OEBPS/style.css", data: `body{font-family:serif;line-height:1.5;margin:1em}h1{text-align:center;margin-top:2em}h2{margin-top:1.5em}p{text-indent:1.2em;margin:0.4em 0}blockquote{margin:1em 2em;font-style:italic}img.cover{max-width:100%;height:auto}` },
    { name: "OEBPS/cover.jpg", data: coverBytes },
    { name: "OEBPS/cover.xhtml", data: xhtmlPage("Cover", `<div style="text-align:center"><img class="cover" src="cover.jpg" alt="${esc(title)} cover"/></div>`) },
  ];
  chapters.forEach((c, i) => entries.push({ name: `OEBPS/${chapFiles[i]}`, data: xhtmlPage(c.title, `<h1>${esc(c.title)}</h1>\n${c.html}`) }));

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
    `<item id="coverimg" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>`,
    `<item id="coverpage" href="cover.xhtml" media-type="application/xhtml+xml"/>`,
    ...chapFiles.map((f, i) => `<item id="ch${i + 1}" href="${f}" media-type="application/xhtml+xml"/>`),
  ].join("\n    ");
  const spineItems = [`<itemref idref="coverpage"/>`, ...chapFiles.map((_, i) => `<itemref idref="ch${i + 1}"/>`)].join("\n    ");
  entries.push({ name: "OEBPS/content.opf", data: `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uuid}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:creator>${esc(author)}</dc:creator>
    <dc:language>${esc(lang)}</dc:language>
    <meta property="dcterms:modified">${stamp}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>` });

  const navPoints = chapFiles.map((f, i) => `<li><a href="${f}">${esc(chapters[i].title)}</a></li>`).join("\n        ");
  entries.push({ name: "OEBPS/nav.xhtml", data: xhtmlPage("Contents", `<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
        ${navPoints}
      </ol></nav>`) });
  const ncxPoints = chapFiles.map((f, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(chapters[i].title)}</text></navLabel><content src="${f}"/></navPoint>`).join("\n    ");
  entries.push({ name: "OEBPS/toc.ncx", data: `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uuid}"/></head><docTitle><text>${esc(title)}</text></docTitle><navMap>
    ${ncxPoints}
  </navMap></ncx>` });

  const epubPath = path.join(out, `${id}.epub`);
  fs.writeFileSync(epubPath, makeZip(entries));

  fs.writeFileSync(path.join(out, "KINDLE-PUBLISH.txt"), `KINDLE (KDP) PUBLISH SHEET - ${title}
Generated ${stamp} by Bookee.

WHAT IS IN THIS FOLDER
- ${id}.epub    Your book as a reflowable EPUB 3, ready for KDP.
- cover.jpg     Marketing cover at KDP's recommended spec: 2560 x 1600 px, JPEG, RGB.
- This sheet.

WHAT "INSTANT PUBLISH" MEANS - AND WHAT IT DOES NOT
Your book file is formatted to KDP's current requirements, so the upload
itself is the fast part. KDP does not let tools publish for you: YOU sign in
to your own KDP account, upload these files, set the title/price/territories,
and click Publish. Amazon then reviews the book (their timeline, usually up
to 72 hours). Bookee does not publish, upload, or hold an Amazon account.

STEPS
1. Sign in at https://kdp.amazon.com (your Amazon account).
2. Create > Kindle eBook.
3. Upload ${id}.epub as the manuscript.
4. Upload cover.jpg as the cover (or design your own at the same spec:
   2560h x 1600w px, JPEG, RGB color, 300 DPI, 5 MB or less).
5. Check the result in Kindle Previewer before publishing - Amazon
   recommends this for every EPUB upload.
6. Set pricing and territories, then Publish.

SOURCES (verified 2026-10-19, official Amazon KDP pages)
- Accepted eBook file formats (EPUB accepted; validate with Kindle
  Previewer before upload):
  https://kdp.amazon.com/en_US/help/topic/G200634390
- Cover image guidelines (dimensions, JPEG/RGB/300DPI/5MB):
  https://kdp.amazon.com/en_US/help/topic/G6GTK3T3NUHKLEFX
- Kindle Publishing Guidelines (EPUB specification reference):
  https://kdp.amazon.com/en_US/help/topic/G200634500
`);
  return { out, epubPath, coverPath, chapters: chapters.length, title, id };
}
