// Generates the Hosted File project sources. No iframes, no inline scripts: the reader runs as bundled code.
import fs from "node:fs"; import path from "node:path";
import { buildHtml, fontCss } from "../lib/build.mjs";
const out = process.argv[2] || "/home/sandbox/pbm-site/src";
const w = (f, s) => fs.writeFileSync(path.join(out, f), s);
let html = fs.readFileSync("site-src/index.html", "utf8");
const css0 = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const css = css0.replace(/url\((assets\/fonts\/[^)]+\.woff2)\)/g, (_, p) => `url(data:font/woff2;base64,${fs.readFileSync(p).toString("base64")})`)
  + `\n.herocard{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:#5a1d22;color:#ebd9ae;text-decoration:none;padding:12%}\n.herocard b{font:600 clamp(30px,4vw,52px)/1.05 var(--d)}\n.herocard i{font:italic 400 18px/1.3 var(--t);margin-top:14px;color:#d9c398}\n.herocard span{margin-top:28px;border:1px solid #c9a362;padding:14px 22px;font:500 13px/1 var(--t);letter-spacing:.2em;text-transform:uppercase}\n`;
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1].replace('$("#f").addEventListener("submit"', '$("#f .btn").addEventListener("click"');
let body = /<body>([\s\S]*?)<script>/.exec(html)[1];
body = body.replace(/<div class="frame"><iframe[\s\S]*?<\/iframe><\/div>/, '<a class="frame herocard" href="#/read/lantern-door" aria-label="Open the live Lantern Door demo"><b>Lantern<br>Door</b><i>An adventure where YOU choose</i><span>Play the live demo</span></a>');
body = body.replace(/href="demo\/([a-z-]+)\/"/g, 'href="#/read/$1"').replace("A live book, not a picture of one. Tap Begin and choose.", "A live book, not a picture of one. Tap play and choose.");
w("landing-parts.ts", `export const landingCss = ${JSON.stringify(css)};\nexport const landingBody = ${JSON.stringify(body)};\nexport function initWidget(): void {\n${script}\n}\n`);
const books = {}; for (const d of ["sourdough-weekend", "lantern-door"]) { const { model } = buildHtml("examples/" + d); books[model.id] = model; }
w("books.ts", `export const books: Record<string, any> = ${JSON.stringify(books)};\n`);
w("reader-css.ts", `export default ${JSON.stringify(fontCss() + "\n" + fs.readFileSync("engine/reader.css", "utf8"))};\n`);
w("vendor-ink.ts", "// @ts-nocheck\n(function(exports,module,define){\n" + fs.readFileSync("vendor/ink-runtime.js", "utf8").replace(/\/\/# sourceMappingURL=.*$/m, "").replace("}(this,", "}(globalThis,") + "\n})(undefined,undefined,undefined);\nexport {};\n");
w("reader-core.ts", "// @ts-nocheck\nexport function startReader() {\n" + fs.readFileSync("engine/reader.js", "utf8") + "\n}\n");
w("App.tsx", `import React, { useEffect } from 'react';
import './vendor-ink';
import { landingCss, landingBody, initWidget } from './landing-parts';
import readerCss from './reader-css';
import { books } from './books';
import { startReader } from './reader-core';
(window as any).__loadSong = (id: string) => import('./audio-data').then((m) => m.songs[id]);

function readId(): string | null { const m = /^#\\/read\\/([a-z0-9-]+)/.exec(window.location.hash); return m && books[m[1]] ? m[1] : null; }

function Landing() {
    useEffect(() => { initWidget(); }, []);
    return <><style>{landingCss}</style><div dangerouslySetInnerHTML={{ __html: landingBody }} /></>;
}

let readerStarted = false;
function Reader({ id }: { id: string }) {
    useEffect(() => {
        if (readerStarted) { window.location.reload(); return; }
        readerStarted = true;
        const st = document.createElement('style'); st.textContent = readerCss; document.head.appendChild(st);
        const app = document.createElement('div'); app.id = 'app'; document.body.appendChild(app);
        const back = document.createElement('a'); back.href = '#/'; back.textContent = '\\u2190 Back to site';
        back.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:50;background:#f4edda;color:#1c1915;padding:10px 14px;font:500 14px Georgia,serif;text-decoration:none;border:1px solid #1c1915';
        document.body.appendChild(back);
        (window as any).__BOOK__ = books[id];
        startReader();
        return () => {
            const songs = (window as any).__songs || {}; Object.keys(songs).forEach((k) => songs[k].pause());
            app.remove(); back.remove(); st.remove();
        };
    }, []);
    return null;
}

export function App() {
    const [id, setId] = React.useState<string | null>(readId());
    useEffect(() => { const h = () => setId(readId()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
    return id ? <Reader id={id} /> : <Landing />;
}
`);
console.log("hosted sources ->", out);
