/* Sensen Mini — 26b-peche.js
   La pêche : ce qu'on tire de l'eau (7.4 / A.2 / E.22)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   L'EAU N'AVAIT AUCUN USAGE, SAUF S'Y BATTRE.
   Un tiers des biomes touche l'eau — côte, marécage, marais corrompu —
   et l'on n'y faisait rien que la même chose qu'ailleurs : creuser la
   berge et taper sur ce qui passe. On y a maintenant deux bateaux, un
   vent, des tempêtes qui les clouent au port, et toujours rien à
   pêcher.

   La pêche est une TROISIÈME voie de subsistance, à côté de la chasse
   et de l'agriculture, et elle ne ressemble ni à l'une ni à l'autre :
     — elle ne demande aucun combat, donc elle nourrit un personnage
       blessé, affamé, à bout de souffle — ce que la chasse ne fait pas ;
     — elle ne demande aucun territoire, donc elle nourrit un vagabond —
       ce que l'agriculture ne fait pas ;
     — mais elle ne donne QUE de la nourriture et quelques matières, et
       elle prend du temps.
   Une barque double la prise : on pêche mieux au large que du bord.
   Et l'hiver ferme les eaux gelées, comme le GDD le demande (E.28).
   ================================================================== */

/* ce qu'on tire de l'eau, par biome — poids relatifs */
const PECHE={
  cote:      {poisson:10,coquillage:4,algue:3,sel:2,ambre:.5},
  marecage:  {poisson:8,anguille:4,algue:4,sangsue:2,tourbe:2},
  marcorr:   {poisson:3,anguille:5,sangsue:4,algue:2,onyx:.5},
  toundra:   {poisson:6,glace:5,coquillage:1},
  montagne:  {poisson:5,quartz:1},
  montcris:  {poisson:3,quartz:2,amethyste:.5},
  plaine:    {poisson:6,roseau:3,argile:2},
  foret:     {poisson:6,roseau:3,champignons:1},
  foretmana: {poisson:5,roseau:2,cristalmana:.3},
  taiga:     {poisson:6,roseau:2,tourbe:2},
  desert:    {poisson:2,sel:4,sable:3},
  cendres:   {poisson:1,soufre:3,cendre:3},
};
/* Trois prises ne sont pas des matières du catalogue : ce sont des vivres.
   On les traduit en nourriture, avec l'élément du lieu. */
const PECHE_FOOD={poisson:1,anguille:1,algue:1,sangsue:1};

/* Peut-on pêcher ici ? Il faut de l'eau, et qu'elle ne soit pas prise. */
function eauIci(c){
  c=c||here();
  if(surEau(c))return true;
  /* un cours d'eau se devine à ce que la case porte */
  return cellMats(c).includes('eaupure');
}
/* « Les lacs gelés : la pêche s'arrête » (E.28). Le gel, ici, c'est la
   température ressentie du lieu, pas une saison sur le calendrier — une
   côte tempérée en hiver reste pêchable, une toundra non. */
const eauGelee=()=>tempC(here())<-4;
function pecheBlocage(){
  if(!eauIci())return 'il faut de l\'eau — une côte, un marécage, ou une case qui en porte';
  if(eauGelee())return 'l\'eau est prise par le gel';
  const m=METEOFX[meteo(here())];
  if(m&&m.voile===0)return 'on ne pêche pas dans une tempête';
  return null;
}
/* Le rendement : la compétence, l'outil, et le bateau.
   Une barque double la prise — on pêche mieux au large que du bord. */
function pecheDelai(){
  const bateau=vehUtile()&&vehDef().eau?.55:1;
  return Math.max(1.2,(7-lv('peche')*.06)*bateau);
}
function pecheTirage(){
  const t=PECHE[here().b]||{poisson:5};
  const tot=Object.values(t).reduce((a,b)=>a+b,0);
  let r=Math.random()*tot;
  for(const k in t){r-=t[k];if(r<=0)return k;}
  return 'poisson';
}
let pechT=0;
function pecheTick(dt){
  const b=pecheBlocage();
  if(b){log('<span class="bd">'+b+'</span>');S.occ='repos';return;}
  pechT+=dt;
  const d=pecheDelai();
  if(pechT<d)return;
  pechT-=d;
  const k=pecheTirage();
  const n=1+Math.floor(lv('peche')/14);
  if(PECHE_FOOD[k]){
    /* une prise vivante : c'est de la nourriture, marquée par l'élément du lieu */
    const el=domi(cellVec(here()));
    addFood(foodKey(k,el,PECHEGRP[k]||'Vie'),n);
    float('+'+n,EL[el].c);
  } else if(MAT[k]){
    S.mat[k]=(S.mat[k]||0)+n;
    if(PLANTE[k])addFood(k,n);
    float('+'+n,EL[domi(matVec(k))].c);
  }
  gainXp('peche',6+(MAT[k]?MAT[k].d:2));
  gainStat('dex',8);
  S.end=Math.max(0,S.end-.8);
  noteRate('harv');
  questTick('harvest',n,MAT[k]?k:null);
  if(S.end<=0){S.resume='peche';S.occ='repos';log('Souffle coupé. La ligne attendra.');}
}
/* le groupe de potentiel de chaque prise vivante (A.9.1) */
const PECHEGRP={poisson:'Vie',anguille:'Éléments',algue:'Magie',sangsue:'Défense'};
