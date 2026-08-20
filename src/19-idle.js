/* Sensen Mini — 19-idle.js
   Automatisations, râtelier, cadence observée, hors-ligne
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   AUTOMATISATIONS ET VEILLE
   Un idle doit tourner sans toi. Ce que tu fais à la main se rachète,
   et ce que tu ne regardes pas se résout par formules — jamais par
   simulation accélérée (même principe que l'abstraction hors-site).
   ================================================================== */
const AUTOS={
  garde:{g:'護',n:'Garde réflexe',max:4,cost:600,r:2.1,
    d:'la garde se lève seule dans la fenêtre ; chaque rang ajoute 12 % de chances que ce soit une parade parfaite'},
  rotation:{g:'環',n:'Communion des cinq',max:1,cost:2600,r:1,
    d:'l\'élément de l\'arme tourne tout seul dans le cycle d\'engendrement — entretien 4 mana par frappe, aucun dégainage'},
  deto:{g:'重',n:'Détonateur',max:1,cost:1500,r:1,
    d:'place la frappe lourde en résolveur quand la chaîne est pleine à un segment près'},
  marmite:{g:'厨',n:'Marmite',max:1,cost:500,r:1,
    d:'cuisine un plat dès que la faim tombe sous 40 ou le potentiel moyen sous 70'},
  intendance:{g:'帳',n:'Intendance',max:1,cost:900,r:1,
    d:'vend seule les matériaux excédentaires quand tu passes dans un village ouvert'},
  veilleur:{g:'眠',n:'Veilleur',max:1,cost:1200,r:1,
    d:'te fait dormir quand la nuit tombe sur une cellule où tu as un lit'},
  fondeur:{g:'熔',n:'Fondeur',max:1,cost:700,r:1,
    d:'fond seul le butin commun et inhabituel qui ne vaut pas ce que tu portes — un tiers de sa valeur en or'},
};
const AK=Object.keys(AUTOS);
const auto=k=>(S.auto&&S.auto[k])||0;
const autoCost=k=>Math.round(AUTOS[k].cost*Math.pow(AUTOS[k].r,auto(k)));
function buyAuto(k){
  if(auto(k)>=AUTOS[k].max)return;
  const c=autoCost(k);
  if(S.or<c)return toast('Il faut '+c+' or');
  S.or-=c;S.auto[k]=auto(k)+1;
  cutIn(AUTOS[k].g,AUTOS[k].n,'rang '+auto(k)+'/'+AUTOS[k].max);
}
/* --- râtelier : changer d'arme en pleine chaîne est une mécanique voulue --- */
const rackList=()=>S.items.filter(it=>it.kind==='arme');
function rackElements(){
  const set={};
  const w=weapon();if(w)set[domi(itemVec(w))]=1;
  rackList().forEach(it=>set[domi(itemVec(it))]=1);
  return set;
}
function drawFrom(el){
  const i=S.items.findIndex(it=>it.kind==='arme'&&domi(itemVec(it))===el);
  if(i<0||S.end<5)return false;
  const old=S.eq.main1;
  S.eq.main1=S.items[i];
  if(old)S.items[i]=old;else S.items.splice(i,1);
  S.end-=5;
  return true;
}
function rotateRack(){
  const w=weapon();if(!w)return;
  if(S.end<S.thr+18)return;      /* on ne dégaine pas si ça coupe le rythme */
  drawFrom(gen(domi(itemVec(w))));
}
/* --- cadence observée : le hors-ligne reprend ton rythme réel --- */
function noteRate(k){S.cnt=S.cnt||{};S.cnt[k]=(S.cnt[k]||0)+1;}
function rollRates(){
  S.rate=S.rate||{};S.cnt=S.cnt||{};
  ['kill','harv','craft','djroom'].forEach(k=>{
    const v=S.cnt[k]||0;
    S.rate[k]=S.rate[k]===undefined?v:S.rate[k]*.5+v*.5;
    S.cnt[k]=0;});
}
/* --- la cadence effective (E.6) ---
   On reprend le rythme observé. À défaut — première nuit, occupation
   qu'on vient de changer — on le CALCULE : le temps d'un coup de pioche
   ou d'une pièce d'atelier est connu à la seconde près, et la vitesse
   d'un tueur se déduit de son arme. Mieux vaut une estimation prudente
   qu'un rapport vide. */
function cadence(k){
  const r=(S.rate||{})[k];
  if(r>0)return r;
  if(k==='harv'&&S.target&&canHarvest(S.target))return 60/harvestTime(S.target)*.8;
  if(k==='craft'&&S.craft&&craftCan()){
    const j=S.craft,skk=j.t==='form'?STATION[FORM[j.f].st].sk:STATION[COMP[j.ct].st].sk;
    return 60/craftTime(j.mk,skk)*.8;}
  if(k==='kill'){
    const w=weapon();if(!w)return 0;
    const c=here();
    const power=S.occ==='donjon'&&c.dj?djPower():1+c.corr/26+c.depth*.6;
    const hp=40*Math.pow(1.21,power);
    const F=FUNC[w.fn];
    const puis=isDist(w)?((w.ela||8)/45):(w.durBase/20);
    const dps=F.d[0]*(F.d[1]+1)/2*puis*w.q*sf(lv(w.fn))*F.spd*.45;
    if(dps<=0)return 0;
    return Math.max(.15,Math.min(6,60/Math.max(3,hp/dps)));}
  return 0;
}
/* --- résolution de l'absence (E.6 : formules, jamais de simulation) --- */
function offline(sec){
  const capH=8;
  const coupe=Math.min(sec,capH*3600);
  const min=coupe/60,eff=.6;
  const r=[];
  S.day+=coupe/DAY;
  const w=Math.floor(S.day/WEEK);
  let nw=0;while(S.week<w&&nw<24){S.week++;weekly();nw++;}
  if(nw)r.push(nw+' semaine'+(nw>1?'s':'')+' de territoire résolues');
  /* la faim : on ne jeûne pas huit heures quand le garde-manger est plein.
     L'absence y pioche, exactement comme on le ferait à la main. */
  S.faim=Math.max(0,S.faim-coupe/90);
  if(S.faim<70){
    let repas=0;
    for(let i=0;i<500&&S.faim<95;i++){
      const k=Object.keys(S.food).find(x=>S.food[x]>0);
      if(k){useFood(k,1);S.faim=Math.min(100,S.faim+foodInfo(k).nutr*.5);repas++;continue;}
      if(S.vivres>0){S.vivres--;S.faim=Math.min(100,S.faim+28);repas++;continue;}
      break;
    }
    if(repas)r.push(repas+' repas pris sur les réserves');
    else if(S.faim<=0)r.push('<span class="bd">rien à manger — tu reviens affamé</span>');
  }
  const rt={kill:cadence('kill'),harv:cadence('harv'),craft:cadence('craft'),djroom:(S.rate||{}).djroom||0};
  const c=here();
  if((S.occ==='combat'||S.occ==='donjon')&&rt.kill>0){
    const n=Math.round(rt.kill*min*eff);
    if(n>0){
      const g=Math.round(n*(5+c.corr*.55+c.depth*5));
      S.or+=g;
      const xp=n*(20+c.corr*1.2);
      const wpn=weapon();
      if(wpn){gainXp(wpn.fn,xp);gainXp('el_'+EL[domi(itemVec(wpn))].k,xp);}
      gainXp('encaissement',xp*.3);
      for(let i=0;i<Math.min(n,60);i++){addFood(foodKey('viande',ri(0,4),MEATGRP[ri(0,4)]),1);}
      const loot=Math.floor(n*.03);
      for(let i=0;i<Math.min(loot,6);i++)dropLoot(c,false);
      r.push(n+' créatures abattues, +'+g+' or');
    }
  } else if(S.occ==='recolte'&&S.target&&rt.harv>0){
    const n=takeStock(c,S.target,Math.round(rt.harv*min*eff));
    if(n>0){const m=MAT[S.target];
      S.mat[S.target]=(S.mat[S.target]||0)+n;
      if(PLANTE[S.target])addFood(S.target,n);
      gainXp(CAT[m.c].sk,n*m.d);
      r.push(n+' × '+matName(S.target)+' récoltés');}
  } else if(S.occ==='atelier'&&S.craft&&rt.craft>0){
    const n=Math.round(rt.craft*min*eff);
    let fait=0;
    for(let i=0;i<n;i++){if(!craftCan())break;
      if(S.craft.t==='form')transform(S.craft.f,S.craft.mk);else makeComp(S.craft.ct,S.craft.f,S.craft.mk);
      fait++;}
    if(fait)r.push(fait+' pièces façonnées');
    if(fait<n)r.push('l\'ouvrage s\'est arrêté faute de matière');
  } else if(S.occ==='explore'){
    const n=Math.round(min/3*eff);let vu=0;
    for(let i=0;i<n;i++){const b=explorePulseSilent();if(b)vu++;}
    if(vu)r.push(vu+' cellules dévoilées');
  }
  if(sec>capH*3600)r.push('(plafonné à '+capH+' h)');
  return r;
}
function explorePulseSilent(){
  const c=here();let found=null,best=99;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    const n=cell(c.x+dx,c.y+dy);if(n.seen)continue;
    const d=Math.abs(dx)+Math.abs(dy);if(d<best){best=d;found=n;}}
  if(!found)return false;
  found.seen=true;gainXp('perception_sk',12);return true;
}
