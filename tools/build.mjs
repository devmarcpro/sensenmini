/* Reconstruit un fichier unique distribuable : dist/sensen-mini.html */
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'src/style.css'),'utf8');
const files=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')).sort();
const js=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');
let out=html
  .replace(/<link rel="stylesheet" href="src\/style.css">/,'<style>\n'+css+'\n</style>')
  /* le mono-fichier s'ouvre en file:// : ni manifest, ni icônes externes, ni service worker */
  .replace(/\n\s*<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>/g,'')
  .replace(/\n\s*<script src="src\/[^"]+"><\/script>/g,'')
  .replace(/<\/body>/,'<script>\n\'use strict\';\n'+js+'\n</script>\n</body>');
mkdirSync(join(root,'dist'),{recursive:true});
writeFileSync(join(root,'dist/sensen-mini.html'),out);
console.log('dist/sensen-mini.html —',(out.length/1024).toFixed(1),'ko,',files.length,'modules');
