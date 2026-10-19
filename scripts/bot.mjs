import { browser, open } from "./shot.mjs";
const b = await browser(); const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
// bot: play random paths on phone, record page counts, overflow, dead UI
for (const [name, vp] of [["phone",{width:390,height:780,deviceScaleFactor:2,isMobile:true,hasTouch:true}],]) {
  const p = await open(b, `/tmp/out/lantern-door/index.html`, vp);
  await p.click('[data-act=open]'); await wait(420);
  let steps=0, log=[];
  for (let i=0;i<120;i++){
    await wait(500); const st = await p.evaluate(()=>{const P=__PBM__;const pg=P.pages();const v=P.state.v;const up=P.state.up;const cur=pg[Math.min(v+(up===2?1:0),pg.length-1)];
      const ov=[...document.querySelectorAll('.beat')].filter(e=>e.scrollHeight>e.clientHeight+3).length;
      return {v,k:cur.k,btn:document.querySelectorAll('.choice').length,end:!!document.querySelector('.the-end'),ov,next:!document.querySelector('#bNext').disabled}});
    if(st.ov) log.push('overflow@'+st.v);
    if(st.end){ log.push('END after '+i); break;}
    if(st.btn){ const k=Math.floor(Math.random()*st.btn); await p.evaluate((k)=>document.querySelectorAll('.choice')[k].click(),k); await wait(420); steps++; }
    else if(st.next){ await p.click('#bNext'); await wait(420);} else {log.push('STUCK@'+st.v); break;}
  }
  console.log(name,steps,log.join(' '));
  await p.screenshot({path:`/tmp/shots/bot-${name}.png`});
}
await b.close();
