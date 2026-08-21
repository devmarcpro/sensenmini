/* Sensen Mini — 24c-symetrie.js
   Les créatures se battent avec les mêmes règles que le joueur (E.3.5)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   L'ASYMÉTRIE ÉTAIT TOTALE, ET ELLE NE SE VOYAIT PAS.
   Le joueur dépense de l'endurance à chaque coup, s'essouffle, doit
   choisir entre frapper et tenir sa garde. Une créature, elle, frappait
   indéfiniment : son rythme ne dépendait que d'un délai, jamais d'un
   souffle. Deux minutes de combat, et le joueur seul était à sec.

   Et son armure n'était qu'un chiffre de fiche. Un bandit « arm:0.9 »
   portait la même chose qu'un loup — alors qu'il laisse du cuir en
   butin, qu'il vient d'un camp, et qu'un chef de bande devrait porter
   mieux qu'un premier bandit croisé.

   Deux règles, reprises du GDD (E.3.5, « supprimer le plus possible
   l'asymétrie ») et transposées à l'échelle de ce jeu :

     — TOUTE CRÉATURE A UN SOUFFLE. Chaque coup PARTI le dépense, touché
       ou non ; à sec, elle ne déclare pas de coup et doit récupérer.
       C'est le frein qui manquait, et il change le combat : appuyer sur
       une bête essoufflée devient une décision, reculer devient une
       tactique, et un long combat n'est plus une course où seul le
       joueur fatigue.

     — UN HUMANOÏDE PORTE UN VRAI ÉQUIPEMENT, dérivé de sa CLASSE et de
       son NIVEAU et non d'un chiffre écrit à la main. Le palier de
       matière suit le niveau ; le profil d'armure suit le métier. Ce
       qu'il porte décide de ce qu'il encaisse — et de ce qu'il laisse.
   ================================================================== */

/* Le souffle d'une créature : même forme que celui du joueur, à son
   échelle. Une bête vive en a peu et le reprend vite ; un colosse en a
   beaucoup et le reprend lentement. */
const creEndMax=e=>Math.round(40+(e.lvC||1)*3+(e.max/40)*6);
/* ce qu'un coup lui coûte : sa fenêtre d'armement dit son poids */
const creEndCost=e=>Math.max(6,Math.round(10*(e.wind||1)));

function creEndInit(e){
  e.endMax=creEndMax(e);
  e.end=e.endMax;
  e.endLock=0;
  return e;
}
/* peut-elle déclarer un coup ? À sec, non — et c'est tout le propos. */
const crePeutFrapper=e=>!e||e.end===undefined||e.end>=creEndCost(e);
function creDepense(e){
  if(!e||e.end===undefined)return;
  e.end=Math.max(0,e.end-creEndCost(e));
  e.endLock=1.2;
}
/* la récupération : suspendue un instant après une dépense, comme celle
   du joueur, et deux fois plus lente si elle tient sa garde */
function creEndTick(e,dt){
  if(!e||e.end===undefined)return;
  if(e.endLock>0){e.endLock=Math.max(0,e.endLock-dt);return;}
  /* La reprise doit etre PLUS LENTE que la depense, sinon le frein n'en est
     pas un. Un premier reglage rendait 7,7 par seconde pour un coup a 10
     toutes les trois secondes : la creature n'etait jamais essoufflee, et la
     regle n'existait que sur le papier. */
  e.end=Math.min(e.endMax,e.end+(1.2+e.endMax*.022)*dt);
}

/* ===== L'ÉQUIPEMENT D'UN HUMANOÏDE =====
   Le TYPE d'arme reste celui de l'espèce — un garde porte une lance, un
   chef une hache : c'est son identité. Seule la MATIÈRE vient du palier
   de niveau. Et le profil d'armure vient de la classe : un bandit n'est
   pas un mercenaire, un ermite n'est pas un chef de bande. */
const PALIER_METAL=[['cuivre',0],['fer',6],['bronze',12],['acier',20],['aciertrempe',30],['mithril',42]];
const PALIER_BOIS=[['pin',0],['chene',8],['frene',16],['if',26],['ebene',36],['boisfer',46]];
const PALIER_TISSU=[['paille',0],['lin',8],['laine',16],['coton',26],['soie',36],['soie',46]];
const palier=(table,lv)=>{let m=table[0][0];table.forEach(([k,n])=>{if(lv>=n&&MAT[k])m=k;});return m;};

/* Le profil d'armure par métier. `lourd` : la part de plaque ; `zones` :
   combien des cinq zones sont couvertes. Un villageois n'est pas nu, il
   est mal protégé — ce n'est pas la même chose. */
const PROFIL={
  chef:      {lourd:1,  zones:5, arme:'hache'},
  mercenaire:{lourd:1,  zones:5, arme:'epee'},
  garde:     {lourd:.9, zones:5, arme:'lance'},
  pillard:   {lourd:.7, zones:4, arme:'hache'},
  bandit:    {lourd:.5, zones:3, arme:'epee'},
  deserteur: {lourd:.6, zones:3, arme:'epee'},
  braconnier:{lourd:.2, zones:2, arme:'arc'},
  naufrageur:{lourd:.3, zones:2, arme:'masse'},
  rodeur:    {lourd:.3, zones:3, arme:'dague'},
  ermite:    {lourd:0,  zones:2, arme:'baton'},
  suaire:    {lourd:.2, zones:3, arme:'dague'},
  defaut:    {lourd:.4, zones:3, arme:'epee'},
};
const profilDe=ck=>PROFIL[ck]||PROFIL.defaut;

/* Ce que porte une créature, forgé pour de vrai — mêmes fonctions que le
   joueur, donc mêmes stats, donc même lecture. */
function creEquipe(e,ck,lv){
  const C=CREATURE[ck];
  if(!C||C.cat!=='humain')return null;
  const P=profilDe(ck);
  const q=Math.max(.5,Math.min(1.8,.5+lv/25));
  const metal=palier(PALIER_METAL,lv),bois=palier(PALIER_BOIS,lv),tissu=palier(PALIER_TISSU,lv);
  const mats=[metal,bois,'cuir',tissu];
  const eq={arme:null,zones:{}};
  /* l'arme : le type vient de l'espèce, la matière du palier */
  const fn=FUNC[P.arme]?P.arme:'epee';
  try{
    const parts=FUNC[fn].comp.map(ct=>partFor(ct,mats));
    parts.push(partFor('fixations',mats));
    eq.arme=mkItem('arme',fn,parts,q);
  }catch(x){eq.arme=null;}
  /* l'armure : autant de zones que le métier en couvre, et la construction
     suit le profil — plaque pour qui se bat, matelassé pour qui fuit */
  const zk=ZK.slice(0,Math.max(0,Math.min(ZK.length,P.zones)));
  zk.forEach(z=>{
    const ct=P.lourd>=.7?'plaque':P.lourd>=.4?'anneaux':'rembourrage';
    const mk=P.lourd>=.4?metal:tissu;
    try{
      const sl=SLOTS.find(x=>x.zone===z).k;
      const major=partFor(ct,[mk].concat(mats));
      const it=mkItem('armure',sl,[major,partFor('sangles',mats),partFor('fixations',mats)],q);
      it.cons=COMP[ct].cons;
      eq.zones[z]=it;
    }catch(x){}
  });
  return eq;
}
/* la réduction qu'une créature oppose sur une zone — la même formule que
   celle du joueur, lue sur ce qu'elle porte vraiment */
function creArmure(e,zone){
  if(!e||!e.eqReel)return e?e.arm:0;
  const it=e.eqReel.zones[zone||'torse'];
  /* La resistance naturelle de la bete reste ; l'equipement s'AJOUTE la ou il
     couvre, et la ou il ne couvre pas on frappe sur la peau. Une premiere
     version remplacait l'une par l'autre : moyennee sur les cinq zones, elle
     rendait un bandit equipe exactement aussi dur qu'un bandit nu — l'armure
     etait la, mesurable, et ne changeait rien. */
  if(!it)return e.arm*.55;                /* zone nue : sa peau, et c'est tout */
  return e.arm+it.durBase*it.q*.30;
}
/* ce qu'elle laisse quand elle tombe : ce qu'elle portait, abîmé */
function creButin(e){
  if(!e||!e.eqReel)return null;
  const l=[e.eqReel.arme].concat(Object.values(e.eqReel.zones)).filter(Boolean);
  if(!l.length)return null;
  const it=pick(l);
  /* une pièce prise sur un mort n'est jamais intacte */
  const copie=JSON.parse(JSON.stringify(it));
  copie.id='i'+(S.nid++);
  copie.q=+(copie.q*(.55+Math.random()*.3)).toFixed(2);
  copie.dur=+(copie.durBase*copie.q).toFixed(1);
  return copie;
}
