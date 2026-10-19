// Development-only: rebuild the shipped runtime after changing the proposal loader.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { build } from 'esbuild';
const source=fs.readFileSync('engine/proposal/loader.js','utf8');
const input=source.replace('import{pages,meta}from"./pages.js";','const {pages,meta}=window.__BOOKEE_PROPOSAL__;');
if(input===source)throw new Error('Proposal config import not found');
await build({stdin:{contents:input,resolveDir:process.cwd()+'/engine/proposal',sourcefile:'loader.js'},bundle:true,format:'iife',minify:true,outfile:'engine/proposal/runtime.js',legalComments:'eof'});
const dependencies=['react','react-dom','react-pageflip','page-flip','scheduler'];
const provenance={note:'Prebuilt proposal browser runtime. Build script requires npm development dependencies; installed plugin execution does not.',source:'engine/proposal/loader.js',loader_sha256:crypto.createHash('sha256').update(source).digest('hex'),runtime_sha256:crypto.createHash('sha256').update(fs.readFileSync('engine/proposal/runtime.js')).digest('hex'),dependencies:[]};
fs.mkdirSync('vendor/proposal-licenses',{recursive:true});
for(const name of dependencies){const root='node_modules/'+name;const pkg=JSON.parse(fs.readFileSync(root+'/package.json'));provenance.dependencies.push({name,version:pkg.version,license:pkg.license});const file=fs.readdirSync(root).find(x=>/^licen[cs]e/i.test(x));if(!file)throw new Error('Missing license '+name);fs.copyFileSync(root+'/'+file,'vendor/proposal-licenses/'+name+'.txt');}
fs.writeFileSync('engine/proposal/runtime-provenance.json',JSON.stringify(provenance,null,2)+'\n');
