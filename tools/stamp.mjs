/* Pose dans sw.js un condensé du contenu réellement mis en cache.
   node tools/stamp.mjs           met la version à jour
   node tools/stamp.mjs --check   sort en erreur si elle est périmée

   Sans cela, VERSION reste figée : l'installation du service worker ne se
   rejoue jamais, les anciens caches survivent, et l'on finit par servir un
   mélange de deux versions. `npm test` appelle --check pour que l'oubli
   soit impossible. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const CHECK=process.argv.includes('--check');

/* on hache exactement ce que le service worker met en cache : index.html
   et tout ce qu'il référence en local */
const html=readFileSync(join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])
  .filter(u=>!/^(https?:)?\/\//.test(u)&&!u.startsWith('data:'));
const h=createHash('sha256');
h.update(html);
for(const u of [...new Set(refs)].sort()){
  try{h.update(u);h.update(readFileSync(join(root,u)));}
  catch(e){/* une référence absente ne doit pas casser l'empreinte */}
}
const attendu='sensen-mini-'+h.digest('hex').slice(0,8);

const swPath=join(root,'sw.js');
const sw=readFileSync(swPath,'utf8');
const actuel=(/const VERSION='([^']+)'/.exec(sw)||[])[1];

if(actuel===attendu){
  if(!CHECK)console.log('version du cache à jour : '+attendu);
  process.exit(0);
}
if(CHECK){
  console.error('La version du cache est périmée : sw.js dit '+actuel+', le contenu vaut '+attendu+'.');
  console.error('Lance `npm run stamp` avant de publier, sinon les navigateurs');
  console.error('garderont un mélange de l\'ancienne et de la nouvelle version.');
  process.exit(1);
}
writeFileSync(swPath,sw.replace(/const VERSION='[^']+'/,"const VERSION='"+attendu+"'"));
console.log('version du cache : '+actuel+' → '+attendu);
