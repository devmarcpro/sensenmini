/* Sensen Mini — 49-hautsfaits.js
   Les titres : ce qu'on a FAIT, et non ce qu'on a vu
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LA COLLECTION COMPTE CE QU'ON A RENCONTRÉ. RIEN NE COMPTAIT CE
   QU'ON A ACCOMPLI.

   Vingt-sept familles disent au joueur ce qu'il n'a pas encore VU —
   une matière, une bête, un lieu. Aucune ne dit ce qu'il n'a pas
   encore FAIT. Or les deux ne se remplissent pas de la même façon :
   voir demande d'aller quelque part, accomplir demande d'y rester.
   Un joueur qui a croisé les soixante-trois créatures et n'en a
   jamais abattu mille n'a pas fait le même jeu.

   Un titre n'est pas une récompense. Il ne donne rien — il NOMME.
   C'est la seule forme d'objectif qui ne déséquilibre rien : on ne
   peut pas farmer un nom, on ne peut que devenir celui qui le porte.
   (Ce qui PAIE, c'est l'érudition de la collection ; ces deux choses
   ne doivent pas se confondre, sinon les titres deviennent une
   monnaie et cessent d'être des titres.)

   Une règle de construction, et elle est stricte : la condition d'un
   titre ne lit QUE de l'état durable — des morts au bestiaire, un
   niveau, un rang de guilde, un compte de jours. Jamais un compteur
   qu'on remet à zéro, jamais une chose qui ne peut pas arriver. La
   suite le vérifie en construisant un état maximal et en exigeant
   que les quarante titres tombent : un titre inatteignable est pire
   qu'un titre absent, parce qu'il se voit et ne s'obtient pas.
   ================================================================== */

/* quelques lectures d'état, écrites une fois */
const hfMorts=()=>Object.values(S.bes||{}).reduce((a,b)=>a+(b.t||0),0);
const hfDomptees=()=>Object.values(S.bes||{}).filter(b=>(b.a||0)>0).length;
const hfCases=()=>Object.keys(S.world||{}).filter(k=>S.world[k]&&S.world[k].seen).length;
const hfRang=()=>Object.values(S.guilds||{}).reduce((a,g)=>Math.max(a,g.rank||0),0);
const hfModules=()=>(S.modules||[]).reduce((a,m)=>a+(m.lv||0),0);
const hfDomaines=()=>new Set((S.modules||[]).map(m=>m.dom)).size;
const hfStations=()=>{let n=(S.carry||[]).length;
  (S.claims||[]).forEach(ck=>{const c=(S.world||{})[ck];
    if(c&&c.plots)c.plots.forEach(p=>{if(p&&p.t==='batiment')p.slots.forEach(sl=>{
      if(sl&&sl.t==='station')n++;});});});
  return n;};
const hfPrime=()=>Object.values(S.prime||{}).reduce((a,v)=>a+(v||0),0);
const hfFamilles=()=>typeof colFamilles==='function'?colFamilles():0;
const hfPct=()=>typeof colTotal==='function'?colTotal().pct:0;

const HAUTFAIT={
  /* ----- le fer ----- */
  sang:      {n:'Premier sang',g:'血',d:'abattre une créature',            quand:()=>hfMorts()>=1},
  cent:      {n:'Cent bêtes',g:'百',d:'abattre cent créatures',            quand:()=>hfMorts()>=100},
  mille:     {n:'Mille bêtes',g:'千',d:'abattre mille créatures',          quand:()=>hfMorts()>=1000},
  dixmille:  {n:'Dix mille',g:'万',d:'abattre dix mille créatures',        quand:()=>hfMorts()>=10000},
  chasseur:  {n:'Chasseur',g:'狩',d:'croiser vingt espèces',               quand:()=>bestiaireVus()>=20},
  naturaliste:{n:'Naturaliste',g:'誌',d:'croiser quarante espèces',        quand:()=>bestiaireVus()>=40},
  gardien:   {n:'Tueur de gardien',g:'主',d:'abattre un gardien de donjon',
    quand:()=>Object.keys((S.col&&S.col.gardien)||{}).length>=1},
  relique:   {n:'Porteur de relique',g:'遺',d:'trouver une pièce nommée',
    quand:()=>Object.keys(S.arte||{}).length>=1},

  /* ----- la main ----- */
  forgeron:  {n:'Forgeron',g:'鍛',d:'forge au niveau trente',              quand:()=>lv('forge')>=30},
  maitrefer: {n:'Maître du fer',g:'鉄',d:'forge au niveau soixante',       quand:()=>lv('forge')>=60},
  charpentier:{n:'Charpentier',g:'木',d:'menuiserie au niveau trente',     quand:()=>lv('menuiserie')>=30},
  tisserand: {n:'Tisserand',g:'織',d:'tissage au niveau trente',           quand:()=>lv('tissage')>=30},
  alchimiste:{n:'Alchimiste',g:'薬',d:'alchimie au niveau trente',         quand:()=>lv('alchimie')>=30},
  cuisinier: {n:'Cuisinier',g:'厨',d:'cuisine au niveau trente',           quand:()=>lv('cuisine')>=30},
  batisseur: {n:'Bâtisseur',g:'築',d:'disposer de huit stations',          quand:()=>hfStations()>=8},

  /* ----- l'arme ----- */
  lame:      {n:'Lame',g:'剣',d:'une arme au niveau quarante',
    quand:()=>Object.keys(FUNC).some(f=>lv(f)>=40)},
  maitrearme:{n:'Maître d\'armes',g:'武',d:'trois armes au niveau trente',
    quand:()=>Object.keys(FUNC).filter(f=>lv(f)>=30).length>=3},
  bouclier:  {n:'Mur',g:'盾',d:'bouclier au niveau trente',                quand:()=>lv('bouclier')>=30},
  encaisseur:{n:'Enclume',g:'耐',d:'encaissement au niveau trente',        quand:()=>lv('encaissement')>=30},
  ombre:     {n:'Ombre',g:'影',d:'esquive au niveau trente',               quand:()=>lv('esquive')>=30},

  /* ----- l'esprit ----- */
  lecteur:   {n:'Lecteur',g:'読',d:'lecture au niveau trente',             quand:()=>lv('lecture')>=30},
  scribe:    {n:'Scribe',g:'書',d:'lecture au niveau cinquante',           quand:()=>lv('lecture')>=50},
  apprenti:  {n:'Apprenti',g:'術',d:'dix niveaux de modules',              quand:()=>hfModules()>=10},
  mage:      {n:'Mage',g:'呪',d:'quarante niveaux de modules',             quand:()=>hfModules()>=40},
  cinqvoies: {n:'Les cinq voies',g:'五',d:'un module dans cinq domaines',  quand:()=>hfDomaines()>=5},
  mediant:   {n:'Méditant',g:'禅',d:'méditation au niveau trente',         quand:()=>lv('meditation')>=30},

  /* ----- le monde ----- */
  arpenteur: {n:'Arpenteur',g:'歩',d:'découvrir deux cents cases',         quand:()=>hfCases()>=200},
  cartographe:{n:'Cartographe',g:'図',d:'découvrir mille cases',           quand:()=>hfCases()>=1000},
  navigateur:{n:'Navigateur',g:'航',d:'navigation au niveau vingt',        quand:()=>lv('navigation')>=20},
  peche:     {n:'Pêcheur',g:'漁',d:'pêche au niveau trente',               quand:()=>lv('peche')>=30},
  saison:    {n:'Une année',g:'年',d:'survivre une année entière',         quand:()=>S.day>=365},
  ancien:    {n:'Ancien',g:'古',d:'survivre cinq années',                  quand:()=>S.day>=1825},

  /* ----- les hommes ----- */
  affilie:   {n:'Affilié',g:'会',d:'atteindre le rang deux dans une guilde',quand:()=>hfRang()>=2},
  maitreguilde:{n:'Maître de guilde',g:'長',d:'atteindre le rang cinq',    quand:()=>hfRang()>=5},
  seigneur:  {n:'Seigneur',g:'領',d:'tenir trois cases',                   quand:()=>(S.claims||[]).length>=3},
  riche:     {n:'Riche',g:'富',d:'dix mille pièces en poche',              quand:()=>S.or>=10000},
  nabab:     {n:'Nabab',g:'豪',d:'cent mille pièces en poche',             quand:()=>S.or>=100000},
  horslaloi: {n:'Hors-la-loi',g:'咎',d:'être recherché quelque part',      quand:()=>hfPrime()>0},
  meneur:    {n:'Meneur',g:'率',d:'trois compagnons à la fois',            quand:()=>(S.comps||[]).length>=3},
  dompteur:  {n:'Dompteur',g:'馴',d:'apprivoiser cinq espèces',            quand:()=>hfDomptees()>=5},

  /* ----- la collection elle-même ----- */
  curieux:   {n:'Curieux',g:'蒐',d:'un quart du jeu rencontré',            quand:()=>hfPct()>=.25},
  erudit:    {n:'Érudit',g:'博',d:'la moitié du jeu rencontrée',           quand:()=>hfPct()>=.5},
  encyclopediste:{n:'Encyclopédiste',g:'全',d:'trois familles achevées',   quand:()=>hfFamilles()>=3},
};
const HFK=Object.keys(HAUTFAIT);

/* ===== LES DÉCROCHER =====
   On relit tout de temps en temps plutôt que d'inscrire à chaque geste :
   une condition qui se lit en une microseconde n'a pas besoin d'être
   notifiée depuis quarante endroits, et cela rattrape les parties
   commencées avant les titres. */
function hfBalayer(){
  S.hf=S.hf||{};
  HFK.forEach(k=>{
    if(S.hf[k])return;
    let ok=false;try{ok=!!HAUTFAIT[k].quand();}catch(e){ok=false;}
    if(!ok)return;
    S.hf[k]=1;
    const H=HAUTFAIT[k];
    if(typeof cutIn==='function')cutIn(H.g,'Titre — '+H.n,H.d);
    if(typeof collecte==='function')collecte('titre',k);
  });
}
const hfAcquis=()=>HFK.filter(k=>(S.hf||{})[k]);
