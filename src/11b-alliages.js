/* Sensen Mini — 11b-alliages.js
   Palier industriel : alliages, stations améliorées, combustible (GDD 4.2.2)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE PALIER INDUSTRIEL (4.2.2)

   Quatre métaux du catalogue — bronze, laiton, acier, acier trempé —
   n'étaient nulle part : ni dans un biome, ni dans une strate, et rien
   ne les produisait. Du contenu mort. Le GDD dit pourtant ce qu'ils
   sont : des composites qu'on ALLIE, à des stations améliorées qui
   brûlent du combustible, sur des recettes qu'on trouve dans les ruines
   profondes, chez les marchands des capitales, ou aux hauts rangs de
   guilde.

   « Aucun système nouveau », dit le GDD, et c'est vrai : la fonte
   réutilise les stations, les matières et les recettes déjà en place.

   L'ÉQUILIBRAGE SE FAIT TOUT SEUL PAR LE WU XING. Un composite a un
   vecteur PLAT : statistiquement supérieur, élémentairement muet. Le
   fer pur d'un forgeron reste meilleur pour une chaîne Wu Xing que
   l'acier d'une ruine — puissance brute contre expressivité, sans
   aucun nerf à écrire.
   ================================================================== */

/* Le combustible et ce qu'il vaut : une fonte en consomme selon sa
   difficulté, et l'anthracite en fait plus avec moins. */
const COMBUSTIBLE={charbon:1,anthracite:1.8,lignite:.6,bitume:.8,tourbecomp:.5,boiscalcine:.7};

const ALLIAGE={
  bronze:{n:'Bronze',g:'青',st:'hautfourneau',lv:12,rend:2,
    de:[['cuivre',3],['etain',1]],feu:2,
    d:'cuivre et étain — le premier alliage, tendre mais docile'},
  laiton:{n:'Laiton',g:'黄',st:'hautfourneau',lv:16,rend:2,
    de:[['cuivre',3],['zinc',1]],feu:2,
    d:'cuivre et zinc — sonne clair, brille, et conduit un peu de mana'},
  acier:{n:'Acier',g:'鋼',st:'hautfourneau',lv:24,rend:2,
    /* le carbone vient du combustible lui-meme : demander du charbon en
       ingredient ET en combustible embrouillait la lecture pour rien */
    de:[['fer',5]],feu:4,
    d:'fer et carbone — deux fois plus dur que le fer, et bien plus muet'},
  aciertrempe:{n:'Acier trempé',g:'焼',st:'laminoir',lv:36,rend:1,
    de:[['acier',3],['eaupure',2]],feu:4,
    d:'l\'acier repris au laminoir et trempé — ce que le monde fait de plus dur sans magie'},
};
const ALK=Object.keys(ALLIAGE);

/* Combien d'unités de combustible on a sous la main, à leur pouvoir réel. */
function combustibleDispo(){
  let t=0;
  for(const k in COMBUSTIBLE)t+=(S.mat[k]||0)*COMBUSTIBLE[k];
  return t;
}
/* On brûle le moins précieux d'abord : la lignite avant l'anthracite. */
function brulerCombustible(n){
  const ordre=Object.keys(COMBUSTIBLE).sort((a,b)=>COMBUSTIBLE[a]-COMBUSTIBLE[b]);
  for(const k of ordre){
    while(n>0&&(S.mat[k]||0)>0){S.mat[k]--;n-=COMBUSTIBLE[k];if(!S.mat[k])delete S.mat[k];}
    if(n<=0)break;
  }
  return n<=0;
}
/* La recette se connaît, comme celle d'un composant exotique (learnRecipe). */
const alliageConnu=k=>!!(S.recipes&&S.recipes['alliage:'+k]);
function apprendreAlliage(k){
  if(!ALLIAGE[k]||alliageConnu(k))return false;
  S.recipes=S.recipes||{};S.recipes['alliage:'+k]=1;
  cutIn('鋳','Recette : '+ALLIAGE[k].n,ALLIAGE[k].d);
  return true;
}
/* Ce qui bloque une fonte, en clair — le panneau s'en sert pour le dire. */
function allierBlocage(k){
  const A=ALLIAGE[k];if(!A)return 'recette inconnue';
  if(!alliageConnu(k))return 'recette inconnue';
  if(!hasStation(A.st))return 'il faut '+STATION[A.st].n;
  if(lv('forge')<A.lv)return 'Forge '+A.lv+' requise (tu as '+lv('forge')+')';
  const manque=A.de.find(([m,n])=>(S.mat[m]||0)<n);
  if(manque)return 'il faut '+manque[1]+' × '+matName(manque[0]);
  if(combustibleDispo()<A.feu)return 'il faut du combustible — charbon, anthracite, lignite, bitume';
  return null;
}
function allier(k){
  const A=ALLIAGE[k];if(!A)return;
  const bl=allierBlocage(k);
  if(bl)return toast(bl);
  A.de.forEach(([m,n])=>{S.mat[m]-=n;if(!S.mat[m])delete S.mat[m];});
  brulerCombustible(A.feu);
  S.mat[k]=(S.mat[k]||0)+A.rend;
  gainXp('forge',MAT[k].d*30);
  S.end=Math.max(0,S.end-4);
  log('Fondu : '+A.rend+' × '+matName(k));
  return true;
}
