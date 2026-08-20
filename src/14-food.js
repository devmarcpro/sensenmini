/* Sensen Mini — 14-food.js
   Cuisine, alchimie, buffs
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   CUISINE, ALCHIMIE ET POTENTIEL (6.4 / 7.7 / A.9 / A.9.1)
   La nutrition est le multiplicateur : un plat raffiné vaut mieux que
   ses ingrédients crus. Un plat couvrant les cinq éléments gagne ×1.2.
   ================================================================== */
const GROUPS=['Armes','Défense','Éléments','Magie','Récolte','Artisanat','Vie'];
/* ingrédients végétaux : tout matériau du catalogue qui porte une nutrition (F.1 / F.8) */
const PLANTE={};
Object.keys(MAT).forEach(k=>{if(MAT[k].nutr!==undefined)PLANTE[k]={nutr:MAT[k].nutr,grp:MAT[k].grp||'Vie',tox:MAT[k].tox};});
/* viandes et parties : paramétriques, dérivées de la créature (A.9.1) */
const PARTS=[
  {k:'viande',n:'Viande',nutr:22,grp:null},          /* le groupe vient de la créature */
  {k:'oeil',n:'Œil',nutr:4,grp:'Vie',alch:'per',el:4},
  {k:'griffe',n:'Griffe',nutr:3,grp:'Armes',alch:'force',el:3},
  {k:'dent',n:'Dent',nutr:3,grp:'Armes',alch:'dmg',el:1},
  {k:'peau',n:'Peau',nutr:6,grp:'Défense',alch:'def',el:2},
  {k:'glande',n:'Glande',nutr:4,grp:'Magie',alch:'vol',el:0},
];
/* la viande d'une créature porte le groupe lié à son élément dominant (A.9.1) */
const MEATGRP=['Vie','Armes','Défense','Artisanat','Magie'];
const PARTN=k=>PARTS.find(p=>p.k===k);
/* clé d'ingrédient animal : type:élément:groupe */
function foodKey(type,el,grp){return type+':'+el+':'+grp;}
function foodInfo(k){
  if(PLANTE[k])return {n:matName(k),nutr:PLANTE[k].nutr,el:domi(matVec(k)),grp:PLANTE[k].grp,plante:1};
  const p=k.split(':'),d=PARTN(p[0]);
  return {n:d.n+' ('+EL[+p[1]].n+')',nutr:d.nutr,el:+p[1],grp:p[2],part:p[0],alch:d.alch};
}
const addFood=(k,n)=>{S.food[k]=(S.food[k]||0)+n;};
function useFood(k,n){if((S.food[k]||0)<n)return false;S.food[k]-=n;if(!S.food[k])delete S.food[k];return true;}
/* une créature laisse sa propre viande : le groupe dérive de son profil */
function creatureDrops(e){
  e=e||E;if(!e)return;
  const el=domi(e.vec);
  addFood(foodKey('viande',el,MEATGRP[el]),1+(e.rare?2:0));
  if(Math.random()<.35){const d=pick(PARTS.slice(1));
    addFood(foodKey(d.k,d.el,d.grp),1);}
}
/* manger cru depuis le garde-manger : moitié de la nutrition, aucun potentiel.
   Indispensable loin de toute cuisine — sinon la faim est une impasse. */
function eatFood(k){
  if(!(S.food[k]>0))return;
  const i=foodInfo(k);
  useFood(k,1);
  if(PLANTE[k]&&PLANTE[k].tox){poisonBy(k);return;}
  S.faim=Math.min(100,S.faim+i.nutr*.5);
  log('Tu manges '+i.n+' cru'+(i.part==='viande'||i.plante?'':'e')+'. Une cuisine ferait bien mieux.');
}
/* belladone, amanite : crues, elles empoisonnent — et la cuisine les refuse */
function poisonBy(k){
  addStatus(S,'poison',10,Math.max(1,maxHp()*.012));
  cutIn('毒',matName(k)+' — empoisonné','le poison ronge pendant 10 s ; une cuisine ne l\'aurait pas servi');
}
/* ===== CUISINE ===== */
function cook(sel2){
  if(!hasStation('cuisine'))return toast('Il faut une cuisine');
  if(!sel2.length)return toast('Choisis des ingrédients');
  const infos=sel2.map(foodInfo);
  if(!sel2.every(k=>(S.food[k]||0)>0))return toast('Ingrédient manquant');
  const tox=sel2.find(k=>PLANTE[k]&&PLANTE[k].tox);
  if(tox)return toast(matName(tox)+' : toxique, bon pour l\'alambic, pas pour la marmite');
  sel2.forEach(k=>useFood(k,1));
  const q=quality(lv('cuisine'));
  const els=new Set(infos.map(i=>i.el));
  const harmonie=els.size>=5?1.2:1;
  const nutr=infos.reduce((a,i)=>a+i.nutr,0)*q*harmonie;
  S.faim=Math.min(100,S.faim+nutr);
  S.hp=Math.min(maxHp(),S.hp+maxHp()*.15);
  /* potentiel = Σ bonus des ingrédients × nutrition/100 × qualité */
  const gain={};
  infos.forEach(i=>{if(i.grp)gain[i.grp]=(gain[i.grp]||0)+i.nutr;});
  const lignes=[];
  for(const g in gain){
    const pts=gain[g]*(nutr/100)*harmonie*2.4;
    let n2=0,moy=0;
    SK.filter(k=>SKILLS[k].grp===g).forEach(k=>{
      /* rendements décroissants : plus le potentiel est haut, moins un plat rend */
      const damp=Math.max(.12,Math.min(1,(200-S.sk[k].pot)/130));
      const d2=pts*damp;
      S.sk[k].pot=Math.min(200,S.sk[k].pot+d2);moy+=d2;n2++;});
    if(n2)lignes.push(g+' +'+Math.round(moy/n2));
  }
  gainXp('cuisine',infos.reduce((a,i)=>a+i.nutr,0)*12);
  S.plats=(S.plats||0)+1;questTick('cook',1);
  cutIn('厨',QNAME(q)+' — nutrition '+Math.round(nutr),
    (harmonie>1?'harmonie des cinq ×1.2 · ':'')+(lignes.join(' · ')||'aucun potentiel'));
}
/* ===== ALCHIMIE ===== */
const BUFFN={force:'Force',per:'Perception',vol:'Volonté',dmg:'Dégâts',def:'Réduction',regen:'Régénération'};
function distill(sel2){
  if(!hasStation('alambic'))return toast('Il faut un alambic');
  const infos=sel2.map(foodInfo);
  const base=infos.find(i=>i.alch);
  if(!base)return toast('Il faut une partie de créature (œil, griffe, dent, peau, glande)');
  if(!sel2.every(k=>(S.food[k]||0)>0))return toast('Ingrédient manquant');
  sel2.forEach(k=>useFood(k,1));
  const q=quality(lv('alchimie'));
  const plantes=infos.filter(i=>i.plante).length;
  const pot={k:base.alch,v:+(q*(1+plantes*.35)).toFixed(2),
    dur:Math.round(60*q*(1+plantes*.5)),n:QNAME(q)+' de '+BUFFN[base.alch]};
  S.potions.push(pot);
  gainXp('alchimie',60+plantes*30);
  log('Distillé : potion '+pot.n+' — +'+pot.v+' pendant '+pot.dur+' s');
}
function drink(i){
  const p=S.potions[i];if(!p)return;
  S.potions.splice(i,1);
  S.buffs=S.buffs.filter(b=>b.k!==p.k);
  S.buffs.push({k:p.k,v:p.v,t:p.dur,n:p.n});
  cutIn('薬',p.n,'+'+p.v+' pendant '+p.dur+' s');
}
const buffOf=k=>(S.buffs||[]).reduce((a,b)=>a+(b.k===k?b.v:0),0);
function tickBuffs(dt){
  if(!S.buffs||!S.buffs.length)return;
  S.buffs.forEach(b=>b.t-=dt);
  const out=S.buffs.filter(b=>b.t<=0);
  if(out.length)log(out.map(b=>b.n).join(', ')+' — l\'effet se dissipe');
  S.buffs=S.buffs.filter(b=>b.t>0);
}
