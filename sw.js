/* Sensen Mini — service worker
   Rend le jeu installable et jouable hors-ligne.

   Le piège, appris à nos dépens : servir le cache d'abord en rafraîchissant
   en arrière-plan (stale-while-revalidate) ne garantit aucune atomicité
   entre les fichiers. Chaque ressource se rafraîchit pour son compte, et
   l'on peut donc charger le nouveau JavaScript avec l'ancienne feuille de
   style. Le jeu se retrouve alors avec des créatures en morceaux — des
   règles de rendu périmées appliquées à une géométrie neuve.

   On sert donc le réseau d'abord pour tout ce qui compose l'application :
   en ligne, la version est toujours cohérente. Le cache ne prend le relais
   que hors-ligne, avec le dernier jeu complet mis en réserve. Les polices,
   elles, restent en cache d'abord — elles ne changent pas.

   VERSION est un condensé du contenu réel, pose par tools/stamp.mjs : dès
   qu'un fichier change, l'installation se rejoue et les anciens caches
   disparaissent. `npm test` vérifie qu'elle est à jour. */
const VERSION='sensen-mini-57f933a4';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.png'];

/* La mise en réserve AVALAIT SES PROPRES ÉCHECS : `cache.add(u).catch(()=>{})`
   ignorait tout fichier qui ne se téléchargeait pas. Le jeu s'installait donc
   « avec succès » avec un fichier manquant et ne se lançait pas hors-ligne,
   sans que rien, nulle part, ne dise lequel. Un échec silencieux dans le
   chemin de l'installation est le pire endroit possible pour en mettre un.

   On garde le comportement tolérant — mieux vaut une réserve incomplète que
   pas de réserve du tout — mais on RETIENT ce qui a manqué, on le dit dans
   la console, et la page peut l'interroger. */
function refsDe(html){
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])
    .filter(u=>!/^(https?:)?\/\//.test(u)&&!u.startsWith('data:'));
}
async function precache(){
  const cache=await caches.open(VERSION);
  const html=await (await fetch('./index.html',{cache:'no-store'})).text();
  const urls=[...new Set(SHELL.concat(refsDe(html)))];
  const rates=[];
  await Promise.all(urls.map(u=>cache.add(u).catch(()=>{rates.push(u);})));
  if(rates.length)console.warn('service worker : '+rates.length+' fichier(s) hors réserve — '+rates.join(', '));
  return rates;
}
/* de quoi interroger la réserve depuis la page : combien de fichiers attendus,
   et lesquels manquent vraiment */
self.addEventListener('message',e=>{
  if(!e.data||e.data.q!=='reserve')return;
  e.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    let html='';try{html=await (await fetch('./index.html',{cache:'no-store'})).text();}catch(x){}
    const urls=[...new Set(SHELL.concat(refsDe(html)))];
    const manque=[];
    for(const u of urls)if(!(await cache.match(u)))manque.push(u);
    const src=e.source||(await self.clients.matchAll())[0];
    if(src)src.postMessage({r:'reserve',total:urls.length,manque});
  })());
});
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{await precache();await self.skipWaiting();})());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const font=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(url.origin!==location.origin&&!font)return;
  e.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    /* les polices ne bougent pas : le cache d'abord, sans aller voir */
    if(font){
      const hit=await cache.match(req);
      if(hit)return hit;
      const res=await fetch(req).catch(()=>null);
      if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone());
      return res||Response.error();
    }
    /* l'application : le réseau d'abord, pour ne jamais melanger deux versions */
    try{
      const res=await fetch(req);
      if(res&&res.ok)cache.put(req,res.clone());
      return res;
    }catch(err){
      const hit=await cache.match(req,{ignoreSearch:true});
      if(hit)return hit;
      if(req.mode==='navigate'){
        const idx=await cache.match('./index.html',{ignoreSearch:true});
        if(idx)return idx;
      }
      return Response.error();
    }
  })());
});
