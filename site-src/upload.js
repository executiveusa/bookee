/* Bookee upload: PDF or EPUB -> flipbook, entirely in this browser.
   The file never leaves the device. No upload, no account, nothing stored. */
const $ = (id) => document.getElementById(id);
let chapters = [], meta = { title: "", author: "" };

function setStatus(t) { $("status").textContent = t; }
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

async function readPdf(buf, name) {
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let title = name.replace(/\.pdf$/i, ""), author = "";
  try { const m = await doc.getMetadata(); if (m.info && m.info.Title) title = m.info.Title; if (m.info && m.info.Author) author = m.info.Author; } catch (e) {}
  let words = [], cur = { n: 1, words: [] }, out = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;
    cur.words.push(text);
    if (cur.words.join(" ").split(/\s+/).length > 1100) { out.push(cur); cur = { n: p + 1, words: [] }; }
    if (out.length >= 60) break;
  }
  if (cur.words.length) out.push(cur);
  chapters = out.map((c, i) => ({ title: "Part " + (i + 1), html: c.words.map((w) => "<p>" + esc(w) + "</p>").join("\n"), kind: "chapter" }));
  meta = { title, author };
  return { pages: doc.numPages, parts: chapters.length };
}

function xhtmlToText(x) {
  const d = new DOMParser().parseFromString(x, "application/xhtml+xml");
  if (d.querySelector("parsererror")) return { h: "", t: "" };
  const head = d.querySelector("h1, h2, h3");
  const h = head ? head.textContent.trim() : "";
  if (head) head.remove();
  const t = (d.body ? d.body.innerHTML : "").trim();
  const v = (d.body ? d.body.textContent : "").replace(/\s+/g, " ").trim();
  return { h, t, v };
}

async function readEpub(buf, name) {
  const zip = await JSZip.loadAsync(buf);
  const container = await zip.file("META-INF/container.xml").async("string");
  const opfPath = container.match(/full-path="([^"]+)"/)[1];
  const opfDir = opfPath.split("/").slice(0, -1).join("/");
  const opf = await zip.file(opfPath).async("string");
  const opfDoc = new DOMParser().parseFromString(opf, "application/xml");
  const dc = (tag) => { const e = opfDoc.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag)[0]; return e ? e.textContent.trim() : ""; };
  meta = { title: dc("title") || name.replace(/\.epub$/i, ""), author: dc("creator") };
  const manifest = {};
  for (const it of opfDoc.getElementsByTagName("item")) manifest[it.getAttribute("id")] = it.getAttribute("href");
  const spine = [...opfDoc.getElementsByTagName("itemref")].map((r) => r.getAttribute("idref")).filter(Boolean);
  chapters = [];
  for (const idref of spine) {
    const href = manifest[idref];
    if (!href) continue;
    const f = zip.file((opfDir ? opfDir + "/" : "") + href);
    if (!f) continue;
    const { h, t, v } = xhtmlToText(await f.async("string"));
    if (!t || !v || v.length < 20) continue; // skip cover pages and image-only items
    chapters.push({ title: h || "Section " + (chapters.length + 1), html: t, kind: "chapter" });
    if (chapters.length >= 120) break;
  }
  return { pages: spine.length, parts: chapters.length };
}

async function handleFile(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) { setStatus("That file is " + Math.round(file.size / 1048576) + " MB. Keep it under 25 MB - bigger books need the full plugin."); return; }
  setStatus("Reading " + file.name + " ...");
  try {
    const buf = await file.arrayBuffer();
    const isEpub = /\.epub$/i.test(file.name);
    const r = isEpub ? await readEpub(buf, file.name) : await readPdf(buf, file.name);
    if (!chapters.length) { setStatus("No readable text found. A scanned PDF has no text layer - it needs OCR first."); return; }
    $("title-in").value = meta.title; $("author-in").value = meta.author;
    $("preview").innerHTML = chapters.map((c, i) => "<li><b>" + esc(c.title) + "</b> <span>" + Math.round(c.html.length / 6) + " words</span></li>").join("");
    $("step2").style.display = "block";
    setStatus("Found " + r.parts + " sections from " + r.pages + " " + (isEpub ? "spine items" : "pages") + ".");
  } catch (e) { setStatus("Could not read that file: " + e.message); }
}

async function buildBook() {
  setStatus("Setting type...");
  const tpl = await (await fetch("template.html")).text();
  const lines = tpl.split("\n");
  const bi = lines.findIndex((l) => l.includes("window.__BOOK__"));
  const jsonStart = lines[bi].indexOf("{");
  const jsonEnd = lines[bi].lastIndexOf("}");
  const lineSuffix = lines[bi].slice(jsonEnd + 1); // keeps ";</script>" when it shares the line
  const model = JSON.parse(lines[bi].slice(jsonStart, jsonEnd + 1));
  model.title = $("title-in").value || "My Book";
  model.author = $("author-in").value || "";
  model.subtitle = "";
  model.backline = "Made with Bookee from " + (model.backline ? "your own file." : "your own file.");
  model.chapters = chapters;
  lines[bi] = lines[bi].slice(0, jsonStart) + JSON.stringify(model).replace(/</g, "\\u003c") + lineSuffix;
  let html = lines.join("\n").replace(/<title>[^<]*<\/title>/, "<title>" + esc(model.title) + "</title>");
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (model.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-book") + ".html";
  a.click();
  setStatus("Done. " + a.download + " is in your downloads - a complete flipbook that opens anywhere.");
}

$("drop").addEventListener("click", () => $("file").click());
$("drop").addEventListener("dragover", (e) => { e.preventDefault(); $("drop").classList.add("over"); });
$("drop").addEventListener("dragleave", () => $("drop").classList.remove("over"));
$("drop").addEventListener("drop", (e) => { e.preventDefault(); $("drop").classList.remove("over"); handleFile(e.dataTransfer.files[0]); });
$("file").addEventListener("change", (e) => handleFile(e.target.files[0]));
$("make").addEventListener("click", buildBook);
