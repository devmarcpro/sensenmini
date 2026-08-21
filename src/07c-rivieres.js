/* Sensen Mini — 07c-rivieres.js
   Le réseau hydrographique de la carte (E.2.2)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   L'EAU N'EXISTAIT QU'AU BORD DE LA MER.
   Trois biomes sur vingt touchent l'eau — côte, marécage, marais
   corrompu. Partout ailleurs, aucune goutte : pas de pêche, pas de
   barque, pas d'irrigation contre la canicule, et une carte où l'eau
   n'est qu'une bordure.

   Le GDD décrit un vrai réseau (E.2.2) : des SOURCES nées en altitude,
   un TRAÇAGE par descente de pente jusqu'à la mer ou jusqu'à un bassin
   sans exutoire, une largeur qui croît avec la distance parcourue, et
   une fenêtre de recherche RÉGIONALE — parce qu'un monde infini n'a pas
   de bassin versant qu'on puisse précalculer.

   Tout cela se transpose tel quel à l'échelle de la case. Une rivière
   ne remonte jamais une crête, ne traverse jamais un sommet, et deux
   joueurs de la même graine trouvent le même fleuve au même endroit.

   LE COÛT EST LE VRAI SUJET. Tracer depuis chaque case coûterait des
   milliers d'appels de bruit par pas. On trace donc une RÉGION entière
   d'un coup, à la première question posée sur elle, et l'on garde le
   résultat. Une région de seize cases sur seize se paie une fois.
   ================================================================== */

const RIV_REGION=16;      /* le pavé qu'on trace d'un coup */
const RIV_MARGE=14;       /* la fenêtre où l'on cherche les sources autour */
const RIV_PAS=70;         /* la longueur maximale d'un cours d'eau, en cases */
const rivCache=new Map();

/* l'altitude d'une case, sans construire la cellule entière : c'est la seule
   chose dont le traçage a besoin, et il en demande des milliers */
const rivAlt=(x,y)=>noise(x,y,S.seed,1,5);
/* une source : haute, et tirée au sort de façon déterministe */
/* LE REJET BON MARCHE D'ABORD (E.2.2, G.1) : le hachage est une poignee
   d'operations entieres, le bruit en coute des dizaines. Tester l'altitude
   avant le tirage faisait calculer le bruit sur les dix-neuf cents cases de
   la fenetre au lieu d'une centaine — la suite d'outils est passee de treize
   a soixante-trois secondes, pour un resultat identique. */
const rivSource=(x,y)=>hash(x,y,S.seed,71)<.055&&rivAlt(x,y)>.72;

/* Le traçage d'un cours d'eau depuis sa source : descente de pente, pas à
   pas, jusqu'à la mer, jusqu'à une rivière déjà tracée, ou jusqu'à un creux
   sans issue — un bassin endoréique, qui est un vrai lac isolé. */
function rivTrace(sx,sy,marque,alt){
  const A=alt||rivAlt;
  let x=sx,y=sy,a=A(x,y);
  for(let i=0;i<RIV_PAS;i++){
    /* la largeur croît avec la distance parcourue : un ruisseau devient une
       rivière puis un fleuve, sans qu'on calcule aucun débit */
    /* Une source nait en montagne et la mer n'est pas loin : la plupart des
       cours d'eau font une quinzaine de cases. Un palier tous les vingt-deux
       pas ne produisait donc AUCUNE riviere navigable — que des ruisseaux.
       Un palier tous les huit : ruisseau jusqu'a huit cases, riviere
       jusqu'a seize, fleuve au-dela. */
    marque(x,y,1+Math.floor(i/8));
    if(a<.24)return;                       /* la mer : le cours s'y jette */
    let bx=x,by=y,ba=a;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const na=A(x+dx,y+dy);
      if(na<ba){ba=na;bx=x+dx;by=y+dy;}
    }
    if(bx===x&&by===y)return;               /* creux sans exutoire : un lac */
    x=bx;y=by;a=ba;
  }
}
/* la région d'une case, tracée une fois pour toutes */
function rivRegion(rx,ry){
  const cle=rx+':'+ry;
  const eu=rivCache.get(cle);
  if(eu)return eu;
  const m=new Map();
  const marque=(x,y,l)=>{
    /* on ne garde que ce qui tombe dans la région : le reste appartient aux
       voisines, qui le retrouveront en traçant depuis les mêmes sources */
    if(x>>4!==rx||y>>4!==ry)return;
    const k=x+','+y;
    const av=m.get(k)||0;
    if(l>av)m.set(k,l);
  };
  /* La descente revient sans cesse sur les memes voisines : sans memoire,
     un seul cours d'eau demande cinq cents calculs de bruit pour une
     quarantaine de cases reellement parcourues. On retient les altitudes le
     temps de la region. */
  const memo=new Map();
  const alt=(x,y)=>{const k=x+','+y;let v=memo.get(k);
    if(v===undefined){v=rivAlt(x,y);memo.set(k,v);}
    return v;};
  const x0=rx*RIV_REGION,y0=ry*RIV_REGION;
  for(let x=x0-RIV_MARGE;x<x0+RIV_REGION+RIV_MARGE;x++)
    for(let y=y0-RIV_MARGE;y<y0+RIV_REGION+RIV_MARGE;y++)
      if(hash(x,y,S.seed,71)<.055&&alt(x,y)>.72)rivTrace(x,y,marque,alt);
  /* la mémoire n'est pas infinie : on garde les dernières régions vues */
  if(rivCache.size>64)rivCache.delete(rivCache.keys().next().value);
  rivCache.set(cle,m);
  return m;
}
/* 0 : pas d'eau · 1 : un ruisseau · 2 : une rivière · 3 et plus : un fleuve */
function riviere(x,y){
  if(typeof x==='object'&&x){y=x.y;x=x.x;}
  const m=rivRegion(x>>4,y>>4);
  return m.get(x+','+y)||0;
}
const RIVN=['','ruisseau','rivière','fleuve'];
const rivNom=n=>RIVN[Math.min(3,n)]||'';
/* la riviere d'une cellule deja construite : le seul point d'entree du jeu */
const rivDe=c=>c?(c.riv!==undefined?c.riv:riviere(c.x,c.y)):0;
