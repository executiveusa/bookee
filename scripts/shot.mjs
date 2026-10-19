import puppeteer from "puppeteer-core";
export async function browser() { return puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"] }); }
export async function open(b, file, vp) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport(vp);
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message)); p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });
  await p.goto(file.startsWith("http") ? file : "file://" + file); await p.waitForSelector("html[data-ready]", { timeout: 8000 }); await new Promise(r=>setTimeout(r,300)); return p;
}
