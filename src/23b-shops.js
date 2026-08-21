/* Sensen Mini — 23b-shops.js
   Boutiques des villes : inventaires hebdomadaires, achat (7.1 / A.8)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   BOUTIQUES
   Une ville porte des commerces (22-realms.js). Chacun renouvelle son
   étal chaque semaine ; ce qu'on achète disparaît jusqu'au prochain
   arrivage. Prix suggéré A.8 : valeur × qualité × rareté × réputation,
   modulé par l'économie locale. L'or payé entre dans la bourse de la
   ville — il recircule, il ne disparaît pas (7.6).
   ================================================================== */
const SHOPDEF={
  forgeron:{n:'Forgeron',g:'鍛',d:'composants de métal, fixations, un outil ou deux'},
  armurier:{n:'Armurier',g:'甲',d:'pièces d\'armure et armes de série, sans affixe'},
  alchimiste:{n:'Alchimiste',g:'薬',d:'potions et parties de créature'},
  libraire:{n:'Libraire',g:'書',d:'grimoires et manuels — la lecture reste à tes risques'},
  tailleur:{n:'Tailleur',g:'裁',d:'tissus, cuir tanné, sangles et rembourrage'},
  'épicier':{n:'Épicier',g:'食',d:'de quoi manger, cru ou en vivres'},
  joaillier:{n:'Joaillier',g:'玉',d:'gemmes brutes, parfois un cristal de mana'},
  herboriste:{n:'Herboriste',g:'草',d:'herbes, champignons, et un remède'},
};
/* ===== CE QU'ON TROUVE SUIT LA VILLE =====
   Tout l'équipement de boutique était tiré dans 0,80–1,20 de qualité, quelle
   que soit la ville. Une capitale à cent cases de marche vendait donc
   exactement la même camelote que le hameau d'à côté — et le plus souvent
   moins bonne que l'équipement de départ. Le voyage ne payait rien, et la
   boutique n'était une voie de progression pour personne.
   Le rang de la ville décide maintenant du plancher, la prospérité nuance. */
const rangVille=t=>t.cap>=26?2:t.cap>=14?1:0;
const qVille=(t,etendue)=>+([.80,1.00,1.20][rangVille(t)]*(.92+(t.prosp||1)*.12)
  +Math.random()*(etendue===undefined?.40:etendue)).toFixed(2);
/* facteur de prix à l'achat : réputation, prospérité, douane */
function buyMul(t){
  const k=kingdomAt(t.x,t.y);
  return repMulPrix()*(.8+t.prosp*.3)*(k&&k.gov==='ploutocratie'?1.1:1);
}
const offMat=(t,mk,n,extra)=>({t:'mat',mk,n,label:matName(mk)+' × '+n,sub:CAT[MAT[mk].c].n+' · dureté '+MAT[mk].d,
  p:Math.max(1,Math.round(MAT[mk].v*n*1.5*townPrice(t,mk)*buyMul(t)*(extra||1)))});
const offRef=(t,f,mk,n)=>({t:'ref',f,mk,n,label:formeNom(f,mk)+' × '+n,sub:'forme travaillée',
  p:Math.max(2,Math.round(MAT[mk].v*FORM[f].cost*n*.8*buyMul(t)))});
function offComp(t,ct,f,mk,lvl){
  const q=+quality(lvl).toFixed(2),n=ri(1,2);
  return {t:'comp',ct,f,mk,q,n,label:COMP[ct].n+' de '+matName(mk)+' × '+n,sub:(f==='brut'?'brut':FORM[f].n)+' · q'+q.toFixed(2)+' '+QNAME(q),
    p:Math.max(3,Math.round(MAT[mk].v*(COMP[ct].w>.5?2:1)*1.2*q*n*buyMul(t)))};
}
function offItem(t,it){return {t:'item',it,label:it.nom,sub:itemLine(it).split(' · ').slice(0,2).join(' · '),
  p:Math.max(5,Math.round(itemValue(it)*1.3*buyMul(t)))};}
function mkShopItem(kind,fn,mats,q){
  const def=kind==='arme'?FUNC[fn]:OUTIL[fn];
  const parts=def.comp.map(ct=>partFor(ct,mats));
  parts.push(partFor('fixations',mats.concat(['fer'])));
  return mkItem(kind,fn,parts,q);
}
function mkShopArmor(sl,ct,mk,q){
  const parts=[{ct,f:COMP[ct].forms[0],mk},{ct:'sangles',f:'tanne',mk:'cuir'},{ct:'fixations',f:'lingot',mk:'fer'}];
  const it=mkItem('armure',sl,parts,q);
  it.cons=COMP[ct].cons;
  it.nom=armorName(sl,it.cons,mk);
  it.slots=Math.random()<.3?1:0;
  return it;
}
const offFood=(t,k,n)=>{const i=foodInfo(k);return {t:'food',k,n,label:i.n+' × '+n,sub:'nutrition '+i.nutr+(i.grp?' · potentiel '+i.grp:''),
  p:Math.max(1,Math.round((2+i.nutr*.6)*n*buyMul(t)))};};
/* une recette industrielle a l'etal : chere, et on ne l'achete qu'une fois */
const offAlliage=(t,k)=>({t:'alliage',k,label:'Recette : '+ALLIAGE[k].n,
  sub:ALLIAGE[k].d+' · '+STATION[ALLIAGE[k].st].n+' · Forge '+ALLIAGE[k].lv,
  p:Math.round((180+MAT[k].d*22)*buyMul(t))});
function offBook(t){
  const g=Math.random()<.6,dm=pick(DK.filter(d=>DOMAIN[d].b===(g?'grimoire':'manuel')));
  const b={id:'b'+(S.nid++),dom:dm,diff:ri(3,8)};
  return {t:'book',b,label:(g?'Grimoire':'Manuel')+' de '+DOMAIN[dm].n,sub:'difficulté '+b.diff+' · DD '+readDD(b),
    p:Math.round((50+b.diff*14)*buyMul(t))};
}
/* une fiole d effet a l etal : le prix suit ce qu elle epargne */
function offEffet(t,e){
  const q=+quality(ri(8,30)).toFixed(2);
  const pot={e,v:q,n:QNAME(q)+' — '+POTEFF[e].n};
  return {t:'potion',pot,label:'Fiole : '+POTEFF[e].n,sub:POTEFF[e].sub(q),
    p:Math.round((45+q*55+(e==='poisonlame'?70:0))*buyMul(t))};
}
/* une parure a l etal : son sous-titre EST la liste de ce qu elle fait */
function offParure(t,kind,q){
  const it=mkParure(kind,pick(PARURE[kind].mats),q);
  return {t:'item',it,label:it.nom,
    sub:affListe(it).join(' · '),
    p:Math.round(parureValeur(it)*1.5*buyMul(t))};
}
function offPotion(t,k){
  const q=+quality(ri(5,30)).toFixed(2),plantes=ri(0,2);
  const pot={k,v:+(q*(1+plantes*.35)).toFixed(2),dur:Math.round(60*q*(1+plantes*.5)),n:QNAME(q)+' de '+BUFFN[k]};
  return {t:'potion',pot,label:'Potion '+pot.n,sub:'+'+pot.v+' '+BUFFN[k]+' pendant '+pot.dur+' s',
    p:Math.round((25+pot.v*30+pot.dur*.2)*buyMul(t))};
}
const offVivres=(t,n)=>({t:'vivres',n,label:'Vivres × '+n,sub:'nourrissent résidents et compagnons, ou toi (+28 faim)',p:Math.round(6*n*buyMul(t))});
/* ----- génération par commerce ----- */
const SHOPGEN={
  forgeron(t){const o=[];const lvl=ri(6,20)+Math.round(t.prosp*6);
    const mats=['fer','cuivre'].concat(t.prosp>1?['argent']:[]);
    for(let i=0;i<ri(2,3);i++)o.push(offComp(t,pick(['lame','pointe','tetemasse','ferhache','teteoutil']),'lingot',pick(mats),lvl));
    o.push(offComp(t,'fixations','lingot','fer',lvl));
    o.push(offRef(t,'lingot','fer',ri(2,5)));
    const tool=pick(Object.keys(OUTIL));
    o.push(offItem(t,mkShopItem('outil',tool,['fer','chene'],qVille(t))));
    /* une capitale prospere tient parfois une recette industrielle (4.2.2) :
       c'est l'autre voie, pour qui ne descend pas dans les ruines */
    if(rangVille(t)>=2&&t.prosp>.9){
      const inconnus=ALK.filter(k=>!alliageConnu(k));
      if(inconnus.length&&Math.random()<.5)o.push(offAlliage(t,pick(inconnus)));
    }
    return o;},
  armurier(t){const o=[];
    for(let i=0;i<ri(2,3);i++){const sl=pick(SLOTS.filter(x=>x.zone)).k;const ct=pick(['plaque','anneaux','peau','rembourrage']);
      const mk=ct==='peau'?'cuir':ct==='rembourrage'?'laine':pick(['fer','cuivre']);
      o.push(offItem(t,mkShopArmor(sl,ct,mk,qVille(t,.50))));}
    o.push(offItem(t,mkShopItem('arme',pick(FK2.filter(f=>!FUNC[f].dist)),['fer','chene'],qVille(t))));
    /* l'armurier tient toujours un bouclier, et souvent un arc — en bois de pays */
    o.push(offItem(t,mkShopItem('arme','bouclier',['fer','cuir'],qVille(t,.50))));
    if(Math.random()<.6){
      const bois=pick(['frene','orme','if','bambou','chene']);
      o.push(offItem(t,mkShopItem('arme',Math.random()<.7?'arc':'fronde',[bois,'cuir'],qVille(t))));}
    return o;},
  alchimiste(t){const o=[];
    for(let i=0;i<ri(2,3);i++)o.push(offPotion(t,pick(Object.keys(BUFFN))));
    /* deux fioles d effet : c est la seule facon d en avoir sans alambic */
    for(let i=0;i<ri(1,2);i++)o.push(offEffet(t,pick(Object.keys(POTEFF))));
    for(let i=0;i<ri(1,2);i++){const d=pick(PARTS.slice(1));o.push(offFood(t,foodKey(d.k,d.el,d.grp),ri(1,3)));}
    return o;},
  libraire(t){const o=[];for(let i=0;i<ri(2,3)+(t.prosp>1.1?1:0);i++)o.push(offBook(t));return o;},
  tailleur(t){const o=[];
    o.push(offRef(t,'tissu',pick(['lin','laine']),ri(3,6)));o.push(offRef(t,'tanne','cuir',ri(2,4)));
    const lvl=ri(6,18);
    o.push(offComp(t,'sangles','tissu','lin',lvl));o.push(offComp(t,pick(['rembourrage','peau']),pick(['rembourrage']).length?'tissu':'tanne','laine',lvl));
    if(Math.random()<.5)o.push(offMat(t,'soie',ri(1,3)));
    /* le tailleur habille le dos et la taille */
    o.push(offParure(t,Math.random()<.6?'cape':'ceinture',qVille(t,.35)));
    return o;},
  'épicier'(t){const o=[];
    const crops=tirerN(Object.keys(MAT).filter(k=>MAT[k].crop&&MAT[k].nutr>0&&!MAT[k].tox),3);
    crops.forEach(mk=>o.push(offMat(t,mk,ri(5,12))));
    for(let i=0;i<2;i++){const el=ri(0,4);o.push(offFood(t,foodKey('viande',el,MEATGRP[el]),ri(3,6)));}
    o.push(offVivres(t,ri(4,10)));o.push(offMat(t,'eaupure',ri(4,8)));
    return o;},
  joaillier(t){const o=[];
    const gems=tirerN(GEMK.filter(g=>g!=='cristalmana'&&g!=='diamant'),ri(2,4));
    gems.forEach(g=>o.push(offMat(t,g,ri(1,2),1.2)));
    if(t.prosp>1&&Math.random()<.4)o.push(offMat(t,'diamant',1,1.4));
    if(t.prosp>1&&Math.random()<.5)o.push(offMat(t,'cristalmana',1,1.3));
    if(Math.random()<.5)o.push(offMat(t,pick(['lapis','turquoise','malachite']),ri(1,2)));
    /* Le joaillier ne vendait que des pierres brutes. Il monte aussi ce
       qu'on en fait : anneaux, amulettes, talismans — les seuls objets du
       jeu dont l'effet ne se joue pas au combat. */
    for(let i=0;i<ri(1,3);i++){
      const kind=pick(['anneau','amulette','talisman']);
      o.push(offParure(t,kind,qVille(t,.35)));
    }
    return o;},
  herboriste(t){const o=[];
    o.push(offMat(t,'herbes',ri(4,10)));o.push(offMat(t,'champignons',ri(3,8)));
    /* l herboriste tient les plantes qui se distillent, et le remede tout pret */
    o.push(offMat(t,pick(['achillee','camomille','menthe','ortie','sauge','racines']),ri(2,5)));
    if(Math.random()<.6)o.push(offEffet(t,pick(['remede','antipoison','soin'])));
    o.push(offPotion(t,'regen'));if(Math.random()<.5)o.push(offMat(t,'baies',ri(4,8)));
    return o;},
};
/* l'étal de la semaine, matérialisé à la première consultation */
function shopStock(t){
  if(!t.stock||t.stock.week!==S.week){
    t.stock={week:S.week,offers:{}};
    (t.shops||[]).forEach(k=>{if(SHOPGEN[k])t.stock.offers[k]=SHOPGEN[k](t);});
  }
  return t.stock.offers;
}
const shopsOpen=t=>!isNight()&&!t.abandonne&&repTier(repLocale())>0;
function buyOffer(shopKey,idx){
  const t=townAt(S.pos[0],S.pos[1]);if(!t)return toast('Aucune ville ici');
  if(!shopsOpen(t))return toast(isNight()?'Les boutiques sont fermées la nuit':'On ne te vend rien ici');
  const list=shopStock(t)[shopKey];if(!list)return;
  const o=list[idx];if(!o)return;
  if(S.or<o.p)return toast('Il faut '+o.p+' or');
  if(o.t==='item'&&sacPlein())return toast('Sac plein ('+S.items.length+'/'+sacMax()+') — fonds ou équipe avant');
  S.or-=o.p;t.or=Math.min(t.orMax*3,t.or+o.p);
  list.splice(idx,1);
  if(o.t==='mat'){S.mat[o.mk]=(S.mat[o.mk]||0)+o.n;if(PLANTE[o.mk])addFood(o.mk,o.n);}
  else if(o.t==='ref')addRef(o.f,o.mk,o.n);
  else if(o.t==='alliage')apprendreAlliage(o.k);
  else if(o.t==='comp'){const tier=Math.round(o.q*4)/4,k=o.ct+'|'+o.f+'|'+o.mk+'|'+tier;const c=S.comp[k];
    if(c){c.q=(c.q*c.n+o.q*o.n)/(c.n+o.n);c.n+=o.n;}else S.comp[k]={ct:o.ct,f:o.f,mk:o.mk,q:o.q,n:o.n};}
  else if(o.t==='item')S.items.push(o.it);
  else if(o.t==='food')addFood(o.k,o.n);
  else if(o.t==='book')S.books.push(o.b);
  else if(o.t==='potion')S.potions.push(o.pot);
  else if(o.t==='vivres')S.vivres=(S.vivres||0)+o.n;
  gainXp('negociation',o.p/5);
  const k=kingdomAt(t.x,t.y);if(k)gainRep(.3,k.race,kingdomHere());
  log('Acheté : '+o.label+' — −'+o.p+' or');
  /* possession interdite ici ? le contrôle joue à la sortie de l'échoppe */
  if(o.t==='mat')controle('entree');
}
