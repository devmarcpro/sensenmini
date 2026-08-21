/* Sensen Mini — 14-food.js
   Cuisine, alchimie, buffs
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   CUISINE, ALCHIMIE ET POTENTIEL (6.4 / 7.7 / A.9 / A.9.1)
   La nutrition est le multiplicateur : un plat raffiné vaut mieux que
   ses ingrédients crus. Un plat couvrant les cinq éléments gagne ×1.2.
   ================================================================== */
const GROUPS=['Armes','Défense','Éléments','Magie','Récolte','Artisanat','Vie'];
/* à quelle stat chaque famille de plats profite (6.4 / A.9.1) */
const GRPSTAT={Armes:'force',Défense:'endu',Éléments:'per',Magie:'vol',Récolte:'endu',Artisanat:'dex',Vie:'cha'};
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
  /* ce qui sort de l'eau (26b) : quatre prises, avec leurs vertus propres.
     Aucune ne porte le risque d'infection de la chair crue — un poisson se
     mange cru sans fievre, et c'est le seul avantage franc de la peche sur
     la chasse quand on n'a pas de cuisine. */
  {k:'poisson',n:'Poisson',nutr:18,grp:'Vie',alch:'endu',el:4},
  {k:'anguille',n:'Anguille',nutr:14,grp:'Éléments',alch:'per',el:4},
  {k:'algue',n:'Algue',nutr:6,grp:'Magie',alch:'vol',el:4},
  {k:'sangsue',n:'Sangsue',nutr:4,grp:'Défense',alch:'def',el:4},
];
/* la viande d'une créature porte le groupe lié à son élément dominant (A.9.1) */
const MEATGRP=['Vie','Armes','Défense','Artisanat','Magie'];
const PARTN=k=>PARTS.find(p=>p.k===k);
/* clé d'ingrédient animal : type:élément:groupe */
function foodKey(type,el,grp){return type+':'+el+':'+grp;}
function foodInfo(k){
  if(PLANTE[k])return {n:matName(k),nutr:PLANTE[k].nutr,el:domi(matVec(k)),grp:PLANTE[k].grp,plante:1};
  const p=String(k).split(':'),d=PARTN(p[0]);
  /* une clé inconnue (sauvegarde d'une autre version) ne doit pas faire tomber le jeu */
  if(!d)return {n:String(k),nutr:4,el:Math.min(4,Math.max(0,+p[1]||0)),grp:p[2]||'Vie',part:p[0]};
  const el=EL[+p[1]]?+p[1]:0;
  return {n:d.n+' ('+EL[el].n+')',nutr:d.nutr,el,grp:p[2]||d.grp||'Vie',part:p[0],alch:d.alch};
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
  /* « Viande crue : +15 faim, 20 % infection » (F.5). Manger cru nourrissait
     sans jamais rien couter : la cuisine n etait qu un rendement, pas un
     choix. Elle est desormais une precaution. La chair crue seule infecte —
     une baie ne donne pas la fievre. */
  if(i.part==='viande'&&Math.random()<.2){
    addStatus(S,'infection',ri(3,6),1);
    cutIn('病','La chair tourne','infection — l\'endurance faiblira chaque jour jusqu\'au soin');
  }
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
    /* la table rend aussi le potentiel des STATS (6.4) : c'est ce qui raccorde
       l'agriculture, la chasse et la cuisine à la croissance du personnage */
    const sk2=GRPSTAT[g];
    if(sk2&&S.sx[sk2]){
      const damp=Math.max(.12,Math.min(1,(200-S.sx[sk2].pot)/130));
      const d3=pts*damp*.7;
      S.sx[sk2].pot=Math.min(200,S.sx[sk2].pot+d3);
      if(d3>=1)lignes.push(STATN[sk2]+' +'+Math.round(d3));
    }
    if(n2)lignes.push(g+' +'+Math.round(moy/n2));
  }
  gainXp('cuisine',infos.reduce((a,i)=>a+i.nutr,0)*12);
  S.plats=(S.plats||0)+1;questTick('cook',1);
  cutIn('厨',QNAME(q)+' — nutrition '+Math.round(nutr),
    (harmonie>1?'harmonie des cinq ×1.2 · ':'')+(lignes.join(' · ')||'aucun potentiel'));
}
/* ===== ALCHIMIE ===== */
const BUFFN={force:'Force',per:'Perception',vol:'Volonté',dmg:'Dégâts',def:'Réduction',regen:'Régénération'};
/* ==================================================================
   L'ALCHIMIE DES PLANTES (F.8 / F.9)
   Une potion de statistique se distille depuis une PARTIE DE CREATURE :
   l'oeil donne la Perception, la griffe la Force. C'etait tout, et cela
   faisait de l'alchimie un doublon de la cuisine — un multiplicateur de
   plus, sans decision.
   Une potion d'EFFET se distille depuis une PLANTE, et chaque plante a la
   sienne. Elles ne montent aucune statistique : elles font quelque chose,
   maintenant, et souvent quelque chose qu'aucune autre voie ne fait. Une
   fiole de remede vaut trois jours d'endurance rongee ; du poison de lame
   vaut ce qu'on n'arrive pas a tuer autrement — et il est illegal a peu
   pres partout, ce qui est le propre d'une bonne solution.
   ================================================================== */
const ALCHPLANTE={
  achillee:'soin',herbes:'remede',racines:'antipoison',camomille:'sommeil',
  menthe:'fraicheur',ortie:'resistance',sauge:'mana',
  belladone:'poisonlame',amanite:'poisonlame',
};
const POTEFF={
  soin:{n:'Soin',g:'癒',sub:v=>'rend '+Math.round(18*v)+' PV sur-le-champ',
    fait(v){const h=Math.round(18*v);S.hp=Math.min(maxHp(),S.hp+h);
      return '+'+h+' PV';}},
  remede:{n:'Remède',g:'薬',sub:()=>'guérit une infection',
    fait(){return soigner('infection','le remède opère')?'la fièvre tombe':'rien à guérir';}},
  antipoison:{n:'Antipoison',g:'解',sub:()=>'purge le poison',
    fait(){return soigner('poison','le poison se dilue')?'le sang se nettoie':'rien à purger';}},
  sommeil:{n:'Calme',g:'眠',sub:v=>'rend souffle et mana · reposé '+Math.round(v*3)+' h',
    fait(v){S.end=100;S.mana=maxMana();S.repose=S.day+v*3/24;
      soigner('terreur','le calme revient');soigner('confusion','les idées se remettent en place');
      return 'souffle et mana pleins';}},
  fraicheur:{n:'Fraîcheur',g:'涼',sub:v=>'+'+Math.round(40*v)+' contre la chaleur, 10 min',
    fait(v){poserBuff('isochaud',Math.round(40*v),600,'Fraîcheur');return 'la chaleur glisse';}},
  resistance:{n:'Résistance',g:'耐',sub:v=>'+'+Math.round(40*v)+' contre le froid, 10 min',
    fait(v){poserBuff('isofroid',Math.round(40*v),600,'Résistance');return 'le froid glisse';}},
  mana:{n:'Essence',g:'泉',sub:()=>'rend tout le mana',
    fait(){S.mana=maxMana();return 'mana plein';}},
  poisonlame:{n:'Poison de lame',g:'塗',sub:v=>'tes coups empoisonnent '+Math.round(180*v)+' s',
    fait(v){S.lame=Math.round(180*v);return 'la lame luit';}},
};
const poserBuff=(k,v,t,n)=>{S.buffs=(S.buffs||[]).filter(b=>b.k!==k);S.buffs.push({k,v,t,n});};
function distill(sel2){
  if(!hasStation('alambic'))return toast('Il faut un alambic');
  const infos=sel2.map(foodInfo);
  if(!sel2.every(k=>(S.food[k]||0)>0))return toast('Ingrédient manquant');
  /* La plante decide. Si la selection en contient une qui porte un effet,
     c'est cet effet qu'on distille — le reste de la selection ne sert qu'a
     le renforcer. Sans plante d'alchimie, on retombe sur la potion de
     statistique, qui demande une partie de creature. */
  const pl=sel2.find(k=>ALCHPLANTE[k]);
  if(pl)return distillEffet(sel2,pl);
  const base=infos.find(i=>i.alch);
  if(!base)return toast('Il faut une partie de créature (œil, griffe, dent, peau, glande) ou une plante alchimique');
  sel2.forEach(k=>useFood(k,1));
  const q=quality(lv('alchimie'));
  const plantes=infos.filter(i=>i.plante).length;
  const pot={k:base.alch,v:+(q*(1+plantes*.35)).toFixed(2),
    dur:Math.round(60*q*(1+plantes*.5)),n:QNAME(q)+' de '+BUFFN[base.alch]};
  S.potions.push(pot);
  gainXp('alchimie',60+plantes*30);
  questTick('potion',1);
  log('Distillé : potion '+pot.n+' — +'+pot.v+' pendant '+pot.dur+' s');
}
/* une potion d'effet : la plante donne la nature, le reste donne la force */
function distillEffet(sel2,pl){
  const e=ALCHPLANTE[pl],E2=POTEFF[e];
  const autres=sel2.filter(k=>k!==pl).length;
  const q=quality(lv('alchimie'));
  const v=+(q*(1+autres*.22)).toFixed(2);
  sel2.forEach(k=>useFood(k,1));
  const pot={e,v,n:QNAME(q)+' — '+E2.n};
  S.potions.push(pot);
  gainXp('alchimie',90+autres*25);
  questTick('potion',1);
  log('Distillé : '+pot.n+' — '+E2.sub(v));
  return pot;
}
function drink(i){
  const p=S.potions[i];if(!p)return;
  S.potions.splice(i,1);
  if(p.e){
    const E2=POTEFF[p.e];
    if(!E2)return;
    collecte('fiole',p.e);
    const dit=E2.fait(p.v);
    cutIn(E2.g,p.n,dit);
    gainXp('alchimie',20);
    return;
  }
  S.buffs=S.buffs.filter(b=>b.k!==p.k);
  S.buffs.push({k:p.k,v:p.v,t:p.dur,n:p.n});
  cutIn('薬',p.n,'+'+p.v+' pendant '+p.dur+' s');
}
/* le poison de lame s'use au temps, pas aux coups */
function tickLame(dt){
  if(!S.lame)return;
  S.lame-=dt;
  if(S.lame<=0){S.lame=0;log('Le poison de lame est épuisé.');}
}
const buffOf=k=>(S.buffs||[]).reduce((a,b)=>a+(b.k===k?b.v:0),0);
function tickBuffs(dt){
  if(!S.buffs||!S.buffs.length)return;
  S.buffs.forEach(b=>b.t-=dt);
  const out=S.buffs.filter(b=>b.t<=0);
  if(out.length)log(out.map(b=>b.n).join(', ')+' — l\'effet se dissipe');
  S.buffs=S.buffs.filter(b=>b.t>0);
}
