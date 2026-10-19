import fs from "node:fs"; import path from "node:path";
import { buildHtml } from "../lib/build.mjs";
const out = process.argv[2] || "dist/site";
// Small Home button injected into every flipbook page (demos + upload template).
const homeBtn = '<a href="/" aria-label="Back to homepage" style="position:fixed;top:10px;left:10px;z-index:9999;display:inline-block;padding:8px 12px;font:14px/1 Georgia,serif;color:#5a4a2a;background:rgba(243,234,210,.92);border:1px solid #c9a227;border-radius:20px;text-decoration:none">&larr; Home</a>';
const withHome = (html) => html.replace("</body></html>", homeBtn + "</body></html>");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "assets/fonts"), { recursive: true });
fs.copyFileSync("site-src/index.html", path.join(out, "index.html"));
for (const f of fs.readdirSync("assets/fonts")) fs.copyFileSync("assets/fonts/" + f, path.join(out, "assets/fonts", f));
for (const d of ["sourdough-weekend", "lantern-door", "acme-proposal"]) {
  const { html, model } = buildHtml("examples/" + d);
  fs.mkdirSync(path.join(out, "demo", model.id), { recursive: true });
  fs.writeFileSync(path.join(out, "demo", model.id, "index.html"), withHome(html));
}

// Upload page: template book built once, swapped client-side (no server round-trip).
{
  const tmp = "dist/.template-book";
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(tmp + "/book.md", "---\nid: your-book\ntitle: Your Book\nsubtitle: ''\nauthor: You\nbackline: Made with Bookee, in your browser.\n---\n\n# Your first chapter\n\nYour words go here.\n");
  const { html } = buildHtml(tmp);
  fs.mkdirSync(path.join(out, "upload"), { recursive: true });
  fs.writeFileSync(path.join(out, "upload", "template.html"), withHome(html));
  fs.copyFileSync("site-src/upload.html", path.join(out, "upload", "index.html"));
  fs.copyFileSync("site-src/upload.js", path.join(out, "upload", "upload.js"));
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("site built ->", out);
