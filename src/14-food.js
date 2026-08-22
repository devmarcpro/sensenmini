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
/* ==================================================================
   ON CUISINAIT SANS JAMAIS RIEN CUISINER.
   La marmite prenait des ingredients et rendait « un plat » : de la
   nutrition, du potentiel, et un nom generique. Aucune RECETTE, donc
   aucune raison de choisir ce qu'on met dedans au-dela du compte de
   points — et, dans un jeu dont l'objectif annonce est une collection a
   cent pour cent, un systeme entier sans une seule chose a collectionner.

   Seize plats nommes. Aucun ne se debloque, aucun ne s'achete : ils se
   RECONNAISSENT. On met ce qu'il faut dans la marmite, le plat sort, et
   il entre dans la collection. C'est le contraire d'un arbre de recettes
   — on ne deverrouille rien, on decouvre ce qui existait deja.

   Chacun donne un BONUS propre, et le bonus dit la recette : un ragout
   nourrit, une soupe claire soigne, un festin des cinq porte l'harmonie
   plus loin que le simple multiplicateur. Le plat le plus exigeant qui
   correspond gagne — sinon un banquet complet serait toujours annonce
   comme une simple potee.
   ================================================================== */
const PLAT=[
  /* --- les grands, ceux qui demandent de l'harmonie --- */
  {k:'festin',n:'Festin des cinq',g:'宴',d:'les cinq elements dans une seule marmite',
   quand:t=>t.els>=5&&t.n>=5,nutr:1.35,pot:1.35,soin:.25},
  {k:'harmonie',n:'Table harmonieuse',g:'和',d:'quatre elements, et de quoi tenir',
   quand:t=>t.els>=4&&t.n>=4,nutr:1.2,pot:1.2,soin:.18},
  /* --- la viande --- */
  {k:'roti',n:'Rôti entier',g:'焼',d:'trois pieces de viande, rien d autre',
   quand:t=>t.viande>=3,nutr:1.3,pot:1.05,soin:.1},
  {k:'ragout',n:'Ragoût',g:'鍋',d:'de la viande et des legumes',
   quand:t=>t.viande>=2&&t.plante>=1,nutr:1.25,pot:1.1,soin:.12},
  {k:'brochette',n:'Brochettes',g:'串',d:'viande et champignon',
   quand:t=>t.viande>=1&&t.champ>=1,nutr:1.12,pot:1.12,soin:.06},
  /* --- l eau --- */
  {k:'bouillon',n:'Court-bouillon',g:'汁',d:'du poisson et un legume',
   quand:t=>t.poisson>=1&&t.plante>=1,nutr:1.15,pot:1.15,soin:.16},
  {k:'grillade',n:'Grillade de rivière',g:'魚',d:'deux prises sur le feu',
   quand:t=>t.poisson>=2,nutr:1.22,pot:1.05,soin:.1},
  {k:'algues',n:'Bouillon d algues',g:'藻',d:'ce que la mer donne sans se battre',
   quand:t=>t.algue>=1&&t.n>=2,nutr:1.05,pot:1.25,soin:.14},
  /* --- le vegetal --- */
  {k:'potee',n:'Potée',g:'菜',d:'trois legumes, la cuisine des pauvres',
   quand:t=>t.plante>=3,nutr:1.18,pot:1.1,soin:.08},
  {k:'soupe',n:'Soupe claire',g:'椀',d:'deux legumes, et rien qui pese',
   quand:t=>t.plante>=2&&t.viande===0,nutr:1.05,pot:1.05,soin:.22},
  {k:'compote',n:'Compote',g:'果',d:'un fruit sucre, longuement mijote',
   quand:t=>t.fruit>=1&&t.n>=2,nutr:1.1,pot:1.18,soin:.1},
  /* --- les curiosites : ce qu'un chasseur rapporte de bizarre --- */
  {k:'abats',n:'Abats braisés',g:'臓',d:'ce que les autres jettent',
   quand:t=>t.abat>=2,nutr:1.08,pot:1.3,soin:.05},
  {k:'moelle',n:'Moelle et os',g:'骨',d:'on casse l os pour ce qu il y a dedans',
   quand:t=>t.abat>=1&&t.viande>=1,nutr:1.15,pot:1.15,soin:.12},
  {k:'infusion',n:'Infusion',g:'茶',d:'une seule plante, patiemment',
   quand:t=>t.n===1&&t.plante===1,nutr:.9,pot:1.4,soin:.2},
  /* --- et les deux fonds de marmite --- */
  {k:'gamelle',n:'Gamelle',g:'皿',d:'deux choses, n importe lesquelles',
   quand:t=>t.n>=2,nutr:1,pot:1,soin:.04},
  {k:'ordinaire',n:'Ordinaire',g:'匙',d:'ce qu on mange quand il n y a rien a dire',
   quand:t=>true,nutr:1,pot:1,soin:0},
];
const PLATK=PLAT.map(p=>p.k);
/* Ce que la marmite contient, compte par compte : c'est la seule chose dont
   une recette a besoin pour se reconnaitre. */
function platTable(infos){
  const t={n:infos.length,els:new Set(infos.map(i=>i.el)).size,
    viande:0,poisson:0,algue:0,plante:0,fruit:0,champ:0,abat:0};
  infos.forEach(i=>{
    if(i.part==='viande')t.viande++;
    else if(i.part==='poisson'||i.part==='anguille')t.poisson++;
    else if(i.part==='algue')t.algue++;
    else if(i.part)t.abat++;
    if(i.plante){
      t.plante++;
      const nm=String(i.n||'').toLowerCase();
      if(/pomme|poire|raisin|fraise|baie|figue|prune|cerise/.test(nm))t.fruit++;
      if(/champignon|morille|cepe|truffe/.test(nm))t.champ++;
    }
  });
  return t;
}
/* le plus exigeant qui corresponde : la table est rangee du plus rare au
   plus banal, donc le premier qui accepte est le bon */
function platDe(infos){
  const t=platTable(infos);
  for(const p of PLAT){let ok=false;try{ok=!!p.quand(t);}catch(e){ok=false;}if(ok)return p;}
  return PLAT[PLAT.length-1];
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
  const plat=platDe(infos);
  const nutr=infos.reduce((a,i)=>a+i.nutr,0)*q*harmonie*plat.nutr;
  S.faim=Math.min(100,S.faim+nutr);
  S.hp=Math.min(maxHp(),S.hp+maxHp()*(.15+plat.soin));
  collecte('plat',plat.k);
  /* potentiel = Σ bonus des ingrédients × nutrition/100 × qualité */
  const gain={};
  infos.forEach(i=>{if(i.grp)gain[i.grp]=(gain[i.grp]||0)+i.nutr;});
  const lignes=[];
  for(const g in gain){
    const pts=gain[g]*(nutr/100)*harmonie*2.4*plat.pot;
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
  cutIn(plat.g,plat.n+' — '+QNAME(q).toLowerCase()+' · nutrition '+Math.round(nutr),
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
/* ==================================================================
   NEUF PLANTES POUR HUIT FIOLES, ET VINGT-SIX AUTRES QUI NE SERVENT A
   RIEN A L'ALAMBIC.
   Trente-cinq matieres vegetales poussent dans le monde ; neuf seulement
   avaient une vertu. L'herboristerie ramassait donc un lierre, un roseau,
   un houblon en sachant d'avance qu'ils ne feraient jamais rien d'autre
   que de la ficelle ou de la soupe.

   Cinq de plus, et cinq fioles qui remplissent des trous reels : rien
   ne rendait de l'ENDURANCE, rien ne donnait de la VITESSE, rien ne
   soignait le SAIGNEMENT, rien n'aidait a VOIR, rien ne calmait la faim.
   ================================================================== */
const ALCHPLANTE={
  achillee:'soin',herbes:'remede',racines:'antipoison',camomille:'sommeil',
  menthe:'fraicheur',ortie:'resistance',sauge:'mana',
  belladone:'poisonlame',amanite:'poisonlame',
  houblon:'souffle',lierre:'hate',roseau:'garrot',
  myrtille:'oeil',dattes:'satiete',
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
  souffle:{n:'Second souffle',g:'息',sub:v=>'rend tout le souffle et le tient '+Math.round(v*120)+' s',
    fait(v){S.end=100;poserBuff('regen',+(1.2*v).toFixed(1),Math.round(120*v),'Second souffle');
      return 'le souffle revient et tient';}},
  hate:{n:'Hâte',g:'疾',sub:v=>'plus vif '+Math.round(90*v)+' s',
    fait(v){addStatus(S,'hate',Math.round(90*v),1);return 'les gestes s enchainent';}},
  garrot:{n:'Garrot',g:'締',sub:()=>'arrete une plaie qui saigne',
    fait(){return soigner('saignement','le garrot serre')?'la plaie se ferme':'rien qui saigne';}},
  oeil:{n:'Oeil de nuit',g:'瞳',sub:v=>'+'+Math.round(3*v)+' en Perception '+Math.round(v*300)+' s',
    fait(v){poserBuff('per',Math.max(1,Math.round(3*v)),Math.round(300*v),'Oeil de nuit');
      return 'les ombres se detachent';}},
  satiete:{n:'Satiété',g:'飽',sub:v=>'la faim tombe deux fois moins vite, '+Math.round(v*600)+' s',
    fait(v){poserBuff('satiete',.5,Math.round(600*v),'Satiété');S.faim=Math.min(100,S.faim+12*v);
      return 'le ventre se tient tranquille';}},
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
