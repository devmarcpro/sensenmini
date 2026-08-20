/* Sensen Mini — service worker
   Rend le jeu installable et jouable hors-ligne.
   - À l'installation : lit index.html et met en cache tout ce qu'il référence
     (CSS, les modules src/, manifest, icônes). Pas de liste à maintenir.
   - Ensuite : pour les fichiers du site, on sert le cache tout de suite et on
     le rafraîchit en arrière-plan (stale-while-revalidate) — une mise à jour
     publiée arrive au rechargement suivant.
   - Les polices Google sont mises en cache à la première visite. */
const VERSION='sensen-mini-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    const html=await (await fetch('./index.html',{cache:'no-store'})).text();
    const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])
      .filter(u=>!/^(https?:)?\/\//.test(u)&&!u.startsWith('data:'));
    const urls=[...new Set(SHELL.concat(refs))];
    await Promise.all(urls.map(u=>cache.add(u).catch(()=>{})));
    await self.skipWaiting();
  })());
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
    const hit=await cache.match(req,{ignoreSearch:url.origin===location.origin});
    const refresh=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone());return res;}).catch(()=>null);
    if(hit){if(!font)refresh;return hit;}  /* polices : cache d'abord, sans refetch */
    const res=await refresh;
    if(res)return res;
    if(req.mode==='navigate')return (await cache.match('./index.html'))||Response.error();
    return Response.error();
  })());
});
