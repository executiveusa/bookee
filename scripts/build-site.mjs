import fs from "node:fs"; import path from "node:path";
import { buildHtml } from "../lib/build.mjs";
const out = process.argv[2] || "dist/site";
// Small Home button injected into every flipbook page (demos + upload template).
const homeBtn = `<style>.bookee-home{flex-shrink:0;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;font:14px/1 Georgia,serif;color:#5a4a2a;background:#f3ead2;border:1px solid #c9a227;border-radius:20px;text-decoration:none}.bookee-home:focus-visible{outline:2px solid #5a4a2a;outline-offset:3px}.reader-bar{gap:12px;flex-wrap:wrap}.reader-bar .wordmark{margin-right:auto}.reader-bar .bookee-home{font-size:12px}.reader-bar .reader-actions{margin-left:auto}@media(max-width:520px){.reader-bar .wordmark{max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.reader-bar .reader-actions{width:100%;justify-content:space-between;gap:5px;margin:5px 0}.reader-bar .reader-actions button{min-height:32px}}@media(max-width:360px){.bar{flex-wrap:wrap}.bar .bookee-home{margin-right:calc(100% - 78px)}.bar .spacer{display:none}}</style><script>if(window.self===window.top){const addHome=()=>{const bar=document.querySelector('.bar,.reader-bar');if(!bar||bar.querySelector('.bookee-home'))return;const a=document.createElement('a');a.className='bookee-home';a.href='https://bookee-iota.vercel.app/';a.setAttribute('aria-label','Back to homepage');a.textContent='← Home';bar.prepend(a)};addHome();new MutationObserver(addHome).observe(document.body,{childList:true,subtree:true})}</script>`;
const withHome = (html) => html.replace("</body></html>", homeBtn + "</body></html>");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "assets/fonts"), { recursive: true });
fs.copyFileSync("site-src/index.html", path.join(out, "index.html"));
for (const f of fs.readdirSync("assets/fonts")) fs.copyFileSync("assets/fonts/" + f, path.join(out, "assets/fonts", f));
const demoIds = [];
for (const d of ["sourdough-weekend", "lantern-door", "acme-proposal"]) {
  const { html, model } = buildHtml("examples/" + d);
  fs.mkdirSync(path.join(out, "demo", model.id), { recursive: true });
  fs.writeFileSync(path.join(out, "demo", model.id, "index.html"), withHome(html));
  demoIds.push(model.id);
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
const SITE = "https://bookee-iota.vercel.app";
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + SITE + "/sitemap.xml\n");
const siteUrls = ["/", "/upload/", ...demoIds.map((id) => "/demo/" + id + "/")];
fs.writeFileSync(path.join(out, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + siteUrls.map((u) => "  <url><loc>" + SITE + u + "</loc></url>").join("\n") + "\n</urlset>\n");
console.log("site built ->", out);
