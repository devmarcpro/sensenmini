/* Sensen Mini — 52-boot.js
   Démarrage, boucle rAF, cycle de vie de l'onglet, service worker
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== DÉMARRAGE ===== */
(async()=>{
  const ok=await load();
  here().seen=true;
  if(ok)paint();
  if(ok)$('log').innerHTML=S.log.map(x=>'<div>'+x+'</div>').join('');
  else buildGate();
  let last=performance.now(),acc=0,wall=Date.now();
  requestAnimationFrame(function loop(t){
    const dt=Math.min(.25,(t-last)/1000);last=t;wall=Date.now();
    if(S.race){step(dt);render();}
    acc+=dt;if(acc>15){acc=0;save();}
    requestAnimationFrame(loop);
  });

  /* ----- cycle de vie : indispensable sur téléphone -----
     Quand l'app est masquée (autre appli, écran éteint, changement d'onglet),
     la boucle rAF s'arrête net. On sauvegarde à ce moment-là, et au retour on
     résout le temps écoulé comme une absence si elle dépasse 90 s. */
  const hide=()=>{if(S.race)save();};
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'){hide();return;}
    const el=(Date.now()-wall)/1000;
    last=performance.now();wall=Date.now();
    if(S.race&&absence(el)){sceneMode='';paint();save();}
  });
  addEventListener('pagehide',hide);
  addEventListener('beforeunload',hide);

  /* ----- service worker : jeu hors-ligne et installable -----
     Seulement servi en http(s) (pas en file://) et hors du build mono-fichier. */
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&document.querySelector('link[rel="manifest"]')){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
