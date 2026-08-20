/* Sensen Mini — 09-progress.js
   XP, potentiel, qualité
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== PROGRESSION (A.1 / 6.4) ===== */
function gainXp(id,amount){
  const s=S.sk[id];if(!s||amount<=0)return;
  let mul=s.pot/100;
  const R=S.race&&RACE[S.race];
  if(R&&R.xp)mul*=R.xp;
  if(S.race==='nain'&&(id==='minage'||id==='forge'))mul*=1.15;
  if(S.race==='cendreux'&&id==='forge')mul*=1.15;
  if(repose())mul*=1.05;
  s.xp+=amount*mul;
  let n=xpNext(s.lv);
  while(s.xp>=n){
    s.xp-=n;s.lv++;
    s.pot=Math.max(s.base,s.pot-(10+s.lv/10));
    n=xpNext(s.lv);
    if(s.lv%5===0)cutIn('練',SKILLS[id].n+' niveau '+s.lv,'potentiel '+Math.round(s.pot));
  }
}
