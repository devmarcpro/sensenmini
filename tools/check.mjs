/* Vérifie la syntaxe de chaque module sans navigateur */
import {readdirSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const src=join(dirname(fileURLToPath(import.meta.url)),'../src');
let ko=0;
for(const f of readdirSync(src).filter(f=>f.endsWith('.js')).sort()){
  try{ new vm.Script(readFileSync(join(src,f),'utf8'),{filename:f}); console.log('ok  '+f); }
  catch(e){ ko++; console.log('ERR '+f+' : '+e.message); }
}
process.exit(ko?1:0);
