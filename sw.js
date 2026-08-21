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
const VERSION='sensen-mini-515cc829';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.png'];

async function precache(){
  const cache=await caches.open(VERSION);
  const html=await (await fetch('./index.html',{cache:'no-store'})).text();
  const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])
    .filter(u=>!/^(https?:)?\/\//.test(u)&&!u.startsWith('data:'));
  const urls=[...new Set(SHELL.concat(refs))];
  await Promise.all(urls.map(u=>cache.add(u).catch(()=>{})));
}
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
