import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{spawnSync}from'node:child_process';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bookee-test-'));const cli=(...args)=>spawnSync(process.execPath,['bin/bookee.mjs',...args],{encoding:'utf8'});
process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
test('one CLI implementation and version',()=>{assert.match(cli('--version').stdout,/1\.0\.2/);assert.match(fs.readFileSync('bin/bookee.mjs','utf8'),/import/)});
test('new adventure passes path check, no usage fallthrough',()=>{const dir=path.join(tmp,'adventure');const n=cli('new',dir,'--kind','adventure');assert.equal(n.status,0);assert.doesNotMatch(n.stdout,/bookmaker <command>/);const c=cli('check',dir);assert.equal(c.status,0,c.stdout+c.stderr);assert.match(c.stdout,/dead ends: 0\s+unreachable knots: 0/);assert.equal(cli('build',dir,'--out',tmp+'/out').status,0);const e=cli('export','kindle',dir,'--out',tmp+'/out');assert.equal(e.status,1);assert.match(e.stderr,/Add an author/)});
test('empty guides are not publishable',()=>{const dir=path.join(tmp,'guide');assert.equal(cli('new',dir,'--kind','guide').status,0);assert.equal(cli('check',dir).status,1);assert.equal(cli('build',dir,'--out',tmp+'/out').status,1)});
test('sample paths remain complete',()=>{assert.equal(cli('check','examples/lantern-door').status,0)});

test('plugin payload builds all three types without node_modules',()=>{
 const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'bookee-offline-'));
 try{
  for(const name of ['bin','lib','vendor','engine','assets','examples','scripts'])fs.cpSync(name,path.join(isolated,name),{recursive:true});
  const run=(...args)=>spawnSync(process.execPath,[path.join(isolated,'bin/bookmaker.mjs'),...args],{cwd:isolated,encoding:'utf8',env:{...process.env,NODE_PATH:''}});
  assert.equal(fs.existsSync(path.join(isolated,'node_modules')),false);
  assert.equal(run('--version').status,0);
  for(const name of ['sourdough-weekend','lantern-door','acme-proposal']){
   const source=path.join(isolated,'examples',name);
   const result=run('build',source,'--out',path.join(isolated,'out'));
   assert.equal(result.status,0,name+': '+result.stdout+result.stderr);
  }
 }finally{fs.rmSync(isolated,{recursive:true,force:true})}
});
