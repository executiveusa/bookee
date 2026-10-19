import { browser, open } from "./shot.mjs";
const b = await browser();
const p = await open(b, "/tmp/out/lantern-door/index.html", { width: 390, height: 780, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.click("[data-act=open]"); await new Promise(r => setTimeout(r, 800));
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll(".beat")].map(e => ({ sh: e.scrollHeight, ch: e.clientHeight, fs: e.style.fontSize, words: e.textContent.split(/\s+/).length, img: !!e.parentElement.querySelector("img,.slot") })))));
await p.screenshot({ path: "/tmp/shots/ov0.png" });
await b.close();
