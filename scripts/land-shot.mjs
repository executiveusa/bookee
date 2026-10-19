import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:"new",args:["--no-sandbox","--disable-gpu"]});
for(const [n,vp] of [["desk",{width:1440,height:900}],["phone",{width:390,height:844,isMobile:true,deviceScaleFactor:2}]]){
 const c=await b.createBrowserContext();const p=await c.newPage();await p.setViewport(vp);
 p.on("pageerror",e=>console.log("ERR",e.message));p.on("console",m=>{if(m.type()==="error")console.log("CON",m.text())});
 p.on("requestfailed",r=>console.log("FAIL",r.url()));
 await p.goto("http://localhost:8731/",{waitUntil:"networkidle0"});await new Promise(r=>setTimeout(r,800));
 await p.screenshot({path:`/tmp/shots/land-${n}-fold.png`});
 console.log(n,"overflowX",await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
 await p.type("#does","I fix commercial kitchens");await p.type("#reader","new restaurant owners");await p.type("#say","Most breakdowns are decided in week one.");
 await p.click("#f button[type=submit]");await new Promise(r=>setTimeout(r,500));
 console.log(n,"plan items",await p.evaluate(()=>document.querySelectorAll("#out li").length));
 await p.screenshot({path:`/tmp/shots/land-${n}-full.png`,fullPage:true});
}
await b.close();
