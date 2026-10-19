import { browser, open } from "./shot.mjs";
const b = await browser();
const p = await open(b, "/tmp/out/lantern-door/index.html", { width: 390, height: 780, isMobile: true, deviceScaleFactor: 1 });
const click = async (sel) => { await p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent); e && e.click(); }, sel); await new Promise(r => setTimeout(r, 700)); };
await p.screenshot({ path: "/tmp/shots/o0.png" });
const txt = await p.evaluate(() => [...document.querySelectorAll("button")].map(b => b.className + ":" + b.textContent.trim().slice(0, 20)).join(" | "));
console.log(txt.slice(0, 600));
await click(".opener");
for (let i = 0; i < 10; i++) {
  await p.screenshot({ path: `/tmp/shots/o${i + 1}.png` });
  const had = await p.evaluate(() => !!document.querySelector(".choice"));
  if (had) await click(".choice"); else { await p.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "→").click()); await new Promise(r => setTimeout(r, 700)); }
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ov) console.log("overflowX", ov, "step", i);
}
await b.close();
