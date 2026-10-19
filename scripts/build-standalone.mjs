// One self-contained HTML file: fonts as data URIs, demo books as srcdoc. For private preview hosts that take a single file.
import fs from "node:fs"; import path from "node:path";
import { buildHtml } from "../lib/build.mjs";
const out = process.argv[2] || "dist/standalone.html";
let html = fs.readFileSync("site-src/index.html", "utf8");
html = html.replace(/<link rel="preload"[^>]*>\n?/g, "");
html = html.replace(/url\((assets\/fonts\/[^)]+\.woff2)\)/g, (_, p) => `url(data:font/woff2;base64,${fs.readFileSync(p).toString("base64")})`);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const books = {};
for (const d of ["sourdough-weekend", "lantern-door"]) {
  const { html: book } = buildHtml("examples/" + d);
  html = html.replace(`src="demo/${d}/"`, `data-book="${d}"`);
  html = html.split(`href="demo/${d}/"`).join(`href="#books" data-demo="${d}"`);
  books[d] = book;
}
const json = JSON.stringify(books).replace(/</g, "\\u003c");
const overlay = `<div id="ov" style="display:none;position:fixed;inset:0;z-index:99;background:rgba(20,15,10,.82);padding:2vh 2vw"><button id="ovx" style="position:absolute;top:10px;right:14px;z-index:2;min-height:44px;padding:0 16px;font:500 14px serif;cursor:pointer">Close</button><iframe id="ovf" style="width:min(100%,520px);height:100%;margin:0 auto;display:block;border:0;background:#d8d0bd" title="Book demo"></iframe></div><script>var BOOKS=${json};var BLOBS={};function blobFor(k){return BLOBS[k]||(BLOBS[k]=URL.createObjectURL(new Blob([BOOKS[k]],{type:"text/html"})))}document.querySelectorAll("iframe[data-book]").forEach(function(f){f.src=blobFor(f.getAttribute("data-book"))});document.addEventListener("click",function(e){var a=e.target.closest("[data-demo]");if(!a)return;e.preventDefault();document.getElementById("ovf").src=blobFor(a.getAttribute("data-demo"));document.getElementById("ov").style.display="block"});document.getElementById("ovx").onclick=function(){document.getElementById("ov").style.display="none";document.getElementById("ovf").removeAttribute("src")}</script>`;
html = html.replace("</body>", () => overlay + "</body>");
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log("standalone", out, (html.length / 1048576).toFixed(2), "MB; iframes with srcdoc:", (html.match(/srcdoc=/g) || []).length);
