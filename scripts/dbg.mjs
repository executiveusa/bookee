import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:"new",args:["--no-sandbox"]});
const c=await b.createBrowserContext();const p=await c.newPage();await p.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:2});
await p.goto("http://localhost:8731/",{waitUntil:"networkidle0"});
await p.type("#does","I fix kitchens");await p.type("#say","week one");
await p.evaluate(()=>document.querySelector("#f button[type=submit]").click());await new Promise(r=>setTimeout(r,500));
console.log(await p.evaluate(()=>({li:document.querySelectorAll("#out li").length,sw:document.documentElement.scrollWidth,iw:innerWidth,wide:[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>392).slice(0,6).map(e=>e.tagName+"."+e.className+"#"+e.id)})));
await b.close();
