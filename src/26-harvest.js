/* Sensen Mini — 26-harvest.js
   Récolte, percement des strates
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== RÉCOLTE (A.2) ===== */
function toolFor(cat){
  const kind=TOOLKIND[cat];
  if(!kind)return {dur:1,q:1,n:'mains nues'};
  let best={dur:1,q:1,n:'mains nues'};
  const scan=it=>{if(it&&it.kind==='outil'&&it.fn===kind&&it.dur>best.dur)
    best={dur:it.dur,q:it.q,n:it.nom};};
  Object.values(S.eq).forEach(scan);S.items.forEach(scan);
  return best;
}
const canHarvest=mk=>{const m=MAT[mk],t=toolFor(m.c);return t.dur*t.q>=m.d*.5;};
/* A.2, plus un temps de geste incompressible : l'outil le plus dur ne fait pas disparaître le coup */
function harvestTime(mk){const m=MAT[mk],t=toolFor(m.c);return .6+m.d/(t.dur*t.q*sf(lv(CAT[m.c].sk)));}
function harvestTick(dt){
  const mk=S.target;if(!mk)return;
  const m=MAT[mk];
  if(!canHarvest(mk)){log('<span class="bd">L\'outil rebondit sur '+m.n+'</span>');S.occ='repos';S.target=null;return;}
  harvT+=dt;
  const t=harvestTime(mk);
  if(harvT>=t){
    harvT-=t;
    const c=here();
    if(stockOf(c,mk)<=0){
      log('<span class="bd">'+m.n+' : le gisement est épuisé ici — il se reconstitue la semaine prochaine.</span>');
      S.occ='repos';S.target=null;S.resume=null;return;}
    const qte=takeStock(c,mk,1+Math.floor(lv(CAT[m.c].sk)/10));
    S.mat[mk]=(S.mat[mk]||0)+qte;
    if(PLANTE[mk])addFood(mk,qte);
    gainXp(CAT[m.c].sk,m.d);questTick('harvest',qte,mk);noteRate('harv');
    S.end=Math.max(0,S.end-1.4);
    float('+'+qte,EL[domi(matVec(mk))].c);knock();maybeScroll(mk);
    if(S.end<=0){S.resume='recolte';S.occ='repos';log('Souffle coupé. Tu reprendras l\'outil au repos.');}
  }
}
const pierceNeed=d=>12+d*18;
const canPierce=rock=>{const t=toolFor('roche');return t.dur*t.q>=MAT[rock].d;};
function pierce(dt){
  const c=here(),next=Math.min(5,c.depth+1),rock=STRATA[next].rock;
  if(!canPierce(rock)){toast('La roche rebondit — il faut un outil de dureté '+MAT[rock].d);S.occ='repos';return;}
  harvT+=dt;
  const t=harvestTime(rock);
  if(harvT>=t){
    harvT-=t;c.dug++;gainXp('minage',MAT[rock].d*1.5);
    S.mat[rock]=(S.mat[rock]||0)+1;
    S.end=Math.max(0,S.end-2);knock();float('+1','#8A8A82');
    if(c.dug>=pierceNeed(c.depth)){c.dug=0;c.depth=next;S.occ='repos';S.resume=null;
      cutIn('掘','Strate '+next+' — '+STRATA[next].n,'profondeur '+STRATA[next].prof+' blocs');}
    if(S.end<=0){S.resume='percer';S.occ='repos';log('Souffle coupé. Le percement reprendra.');}
  }
}
function eat(mk){
  const m=MAT[mk];if(m.nutr===undefined||!(S.mat[mk]>0))return;
  S.mat[mk]--;if(!S.mat[mk])delete S.mat[mk];
  if(S.food[mk])useFood(mk,1);
  if(m.tox){poisonBy(mk);paint();return;}
  S.faim=Math.min(100,S.faim+m.nutr*.5);
  log('Tu manges '+m.n+' cru. Une cuisine ferait bien mieux.');
  paint();
}
