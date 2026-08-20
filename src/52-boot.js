/* Sensen Mini — 33-boot.js
   Démarrage et boucle rAF
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== DÉMARRAGE ===== */
(async()=>{
  const ok=await load();
  cell(0,0).seen=true;
  if(ok)paint();
  if(ok)$('log').innerHTML=S.log.map(x=>'<div>'+x+'</div>').join('');
  else buildGate();
  let last=performance.now(),acc=0;
  requestAnimationFrame(function loop(t){
    const dt=Math.min(.25,(t-last)/1000);last=t;
    if(S.race){step(dt);render();}
    acc+=dt;if(acc>15){acc=0;save();}
    requestAnimationFrame(loop);
  });
})();
