/* Sensen Mini — 09-progress.js
   XP, potentiel, qualité
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== PROGRESSION (A.1 / 6.4) ===== */
/* ===== LES STATS MONTENT AUSSI (6.4 / A.1.1) =====
   Même mécanique que les compétences, mais une courbe bien plus raide :
   une stat est une identité, pas un compteur. La Force vient des coups
   portés, l'Endurance des coups reçus, la Volonté du mana dépensé — on
   ne monte que ce dont on se sert.
   Sources et coût : monter consomme du potentiel, la table le rend. */
const STATN=Object.fromEntries(STATS.map(s=>[s[0],s[1]]));
const statNext=N=>400*Math.pow(Math.max(1,N-4),1.85);
function gainStat(k,amount){
  if(!S.sx||!S.sx[k]||!(amount>0))return;
  const s=S.sx[k];
  s.xp+=amount*(s.pot/100);
  let n=statNext(S.stats[k]);
  let g=0;
  while(s.xp>=n&&g++<4){
    s.xp-=n;S.stats[k]++;
    s.pot=Math.max(s.base,s.pot-(12+S.stats[k]));
    n=statNext(S.stats[k]);
    cutIn('能',STATN[k]+' '+S.stats[k],'potentiel '+Math.round(s.pot)+' — la table le rend');
  }
}
function gainXp(id,amount){
  const s=S.sk[id];if(!s||amount<=0)return;
  let mul=s.pot/100;
  const R=S.race&&RACE[S.race];
  if(R&&R.xp)mul*=R.xp;
  if(S.race==='nain'&&(id==='minage'||id==='forge'))mul*=1.15;
  if(S.race==='cendreux'&&id==='forge')mul*=1.15;
  if(repose())mul*=1.05;
  /* chaque famille de collection achevee vaut un pour cent, partout */
  if(typeof colErudition==='function')mul*=1+colErudition();
  s.xp+=amount*mul;
  let n=xpNext(s.lv);
  while(s.xp>=n){
    s.xp-=n;s.lv++;
    s.pot=Math.max(s.base,s.pot-(10+s.lv/10));
    n=xpNext(s.lv);
    if(s.lv%5===0)cutIn('練',SKILLS[id].n+' niveau '+s.lv,'potentiel '+Math.round(s.pot));
  }
}
