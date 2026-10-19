import fs from "node:fs"; import path from "node:path";
import { buildHtml } from "../lib/build.mjs";
const out = process.argv[2] || "dist/site";
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "assets/fonts"), { recursive: true });
fs.copyFileSync("site-src/index.html", path.join(out, "index.html"));
for (const f of fs.readdirSync("assets/fonts")) fs.copyFileSync("assets/fonts/" + f, path.join(out, "assets/fonts", f));
for (const d of ["sourdough-weekend", "lantern-door", "acme-proposal"]) {
  const { html, model } = buildHtml("examples/" + d);
  fs.mkdirSync(path.join(out, "demo", model.id), { recursive: true });
  fs.writeFileSync(path.join(out, "demo", model.id, "index.html"), html);
}

// Upload page: template book built once, swapped client-side (no server round-trip).
{
  const tmp = "dist/.template-book";
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(tmp + "/book.md", "---\nid: your-book\ntitle: Your Book\nsubtitle: ''\nauthor: You\nbackline: Made with Bookee, in your browser.\n---\n\n# Your first chapter\n\nYour words go here.\n");
  const { html } = buildHtml(tmp);
  fs.mkdirSync(path.join(out, "upload"), { recursive: true });
  fs.writeFileSync(path.join(out, "upload", "template.html"), html);
  fs.copyFileSync("site-src/upload.html", path.join(out, "upload", "index.html"));
  fs.copyFileSync("site-src/upload.js", path.join(out, "upload", "upload.js"));
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("site built ->", out);
