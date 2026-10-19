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
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("site built ->", out);
