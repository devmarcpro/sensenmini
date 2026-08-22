/* Sensen Mini — 10c-bijoux.js
   Parures : anneaux, amulettes, capes, accessoires — et leurs effets hors combat
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   SIX EMPLACEMENTS N'AVAIENT JAMAIS RIEN PU RECEVOIR.
   La fiche d'équipement en déclare quatorze (6.2). Huit se remplissent :
   les cinq zones d'armure, les deux mains, les munitions. Les six autres —
   deux anneaux, une amulette, le dos, deux accessoires — n'avaient AUCUNE
   source. Ni butin, ni boutique, ni atelier. Six lignes vides dans le
   panneau depuis le premier jour.

   L'annexe F.7 dit exactement ce qu'ils doivent porter, et ce ne sont pas
   des dégâts : « skill +2..+6 · stat +1..+3 · capacite_poids · faim_vitesse ·
   regen_sante · vitesse_deplacement · grant_tag : detection_filons,
   detection_tresors, vision_nocturne, pas_silencieux, immunite_poison ».

   C'est-à-dire : des effets qui ne changent pas la façon de FRAPPER, mais
   la façon de VIVRE. Une amulette qui coupe la faim d'un tiers ne gagne
   aucun combat ; elle change ce qu'on emporte et jusqu'où l'on va. Un
   anneau qui montre les filons transforme la carte. C'est l'autre moitié
   du jeu, et elle était vide.
   ================================================================== */

/* les compétences qu'une parure peut porter — celles dont le niveau se lit
   ailleurs qu'en combat, pour que l'effet se sente hors des coups */
const USK=['meditation','esquive','discretion','negociation','minage','forge',
  'leadership','dressage','lecture','athletisme','herboristerie','alchimie',
  'cuisine','agriculture','taille','assemblage'];

const AFFU=[
  {f:'MÉTIER',id:'usk',r:()=>({k:pick(USK.filter(k=>SKILLS[k])),n:ri(2,6)}),
   t:p=>'+'+p.n+' en '+(SKILLS[p.k]?SKILLS[p.k].n:p.k)},
  {f:'CORPS',id:'ustat',r:()=>({k:pick(STATS.map(s=>s[0])),n:ri(1,3)}),
   t:p=>'+'+p.n+' en '+(STATS.find(s=>s[0]===p.k)||[,p.k])[1]},
  /* ==================================================================
     ONZE EFFETS DE PARURE CONTRE TRENTE ET UN D'ARME.
     C'est l'axe UTILITAIRE du jeu — ce qu'on porte pour vivre, pas pour
     frapper — et il etait trois fois plus maigre que celui du combat.
     Cinq de plus, et chacun branche un chiffre qui existe deja et qu'aucun
     bijou n'atteignait : le prix de vente, le rendement d'un gisement, la
     patience d'une ligne de peche, la marge d'un lecteur, le butin d'or.
     ================================================================== */
  {f:'NEGOCE',id:'troc',r:()=>({p:ri(6,18)}),
   t:p=>'+'+p.p+' % sur ce que tu vends'},
  {f:'FILON',id:'veine',r:()=>({p:ri(10,30)}),
   t:p=>'+'+p.p+' % de matiere dans les gisements que tu ouvres'},
  {f:'LIGNE',id:'ligne',r:()=>({p:ri(10,25)}),
   t:p=>'la ligne mord '+p.p+' % plus vite'},
  {f:'LETTRE',id:'lettre',r:()=>({n:ri(1,3)}),
   t:p=>'+'+p.n+' aux jets de lecture'},
  {f:'BUTIN',id:'bourse',r:()=>({p:ri(10,25)}),
   t:p=>'+'+p.p+' % d or sur ce que tu abats'},
  {f:'CHARGE',id:'poids',r:()=>({n:ri(10,40)}),
   t:p=>'+'+p.n+' de place dans le sac'},
  {f:'CORPS',id:'faim',r:()=>({p:ri(10,30)}),
   t:p=>'la faim vient '+p.p+' % moins vite'},
  {f:'CORPS',id:'soin',r:()=>({p:ri(50,100)}),
   t:p=>'les plaies se referment '+p.p+' % plus vite'},
  {f:'ROUTE',id:'marche',r:()=>({p:ri(5,15)}),
   t:p=>'on marche '+p.p+' % plus vite'},
  /* Les dons. Ils ne se chiffrent pas : on les a ou on ne les a pas, et
     chacun ouvre une façon de jouer que rien d'autre n'ouvre. */
  {f:'DON',id:'filons',r:()=>({}),don:1,t:()=>'les filons apparaissent sur la carte'},
  {f:'DON',id:'tresors',r:()=>({}),don:1,t:()=>'les donjons apparaissent sur la carte'},
  {f:'DON',id:'nuitvue',r:()=>({}),don:1,t:()=>'la nuit ne t\'aveugle plus'},
  {f:'DON',id:'silence',r:()=>({}),don:1,t:()=>'tes pas ne font aucun bruit'},
  {f:'DON',id:'antipoison',r:()=>({}),don:1,t:()=>'le poison ne prend pas sur toi'},
];
const AFFUK=AFFU.map(a=>a.id);

/* ===== LES PARURES ===== */
/* Une parure n'a ni dégâts ni armure : elle n'est QUE ses effets. Sa
   qualité décide du nombre d'effets et de leur force, sa matière décide de
   son prix et de sa couleur. */
const PARURE={
  anneau:{n:'Anneau',g:'環',slot:'anneau1',aff:[1,2],mats:['argent','or','cuivre','bronze','laiton','platine']},
  amulette:{n:'Amulette',g:'珠',slot:'amulette',aff:[1,2],mats:['argent','or','jade','ambre','turquoise','lapis']},
  cape:{n:'Cape',g:'背',slot:'dos',aff:[1,1],mats:['laine','lin','coton','soie','cuir']},
  ceinture:{n:'Ceinture',g:'具',slot:'acc1',aff:[1,1],mats:['cuir','lin','chanvre','laine']},
  talisman:{n:'Talisman',g:'具',slot:'acc1',aff:[1,2],mats:['os','ammonite','jade','obsidienne','ambre','cristalmana']},
};
const PARK=Object.keys(PARURE);
/* Une gemme sertie ne se voit pas ici : une parure n'a pas de sertissure —
   elle EST déjà l'effet. C'est ce qui la distingue d'une arme. */
/* `budget` : un nombre d'effets IMPOSE, qui passe outre le plafond de la piece.
   Il n'a qu'un seul emploi et il vient du GDD (12.4) : le trophee garanti d'un
   monstre rare, « 3-4 effets au lieu de 0-2 ». On ne releve donc PAS le plafond
   des parures ordinaires — ajouter n'est pas remplacer : une amulette trouvee
   chez un marchand en porte toujours au plus deux, et c'est ce qui fait du
   trophee un trophee. */
function mkParure(kind,mk,q,budget){
  const P=PARURE[kind];
  if(!P)return null;
  const mat=MAT[mk]?mk:P.mats[0];
  const n=budget||Math.min(P.aff[1],Math.max(P.aff[0],Math.round(P.aff[0]+(q-1)*1.2)));
  /* les dons sont rares : ils ne sortent qu'au-dessus d'une certaine qualité,
     et jamais deux sur la même pièce — sinon un seul anneau règle tout */
  const pool=AFFU.filter(a=>!a.don||q>=1.35);
  const tirs=tirerN(pool,pool.length);
  const choisis=[];let donPris=false;
  for(const a of tirs){
    if(choisis.length>=n)break;
    /* jamais deux dons sur la meme piece : on PASSE le second, on ne s'arrete
       pas. Une version precedente tirait n+2 entrees et abandonnait sur un
       don en trop — une piece a qui l'on demandait quatre effets en portait
       parfois deux. Le budget est un contrat : on puise dans tout le pool
       jusqu'a l'avoir tenu. */
    if(a.don){if(donPris)continue;donPris=true;}
    choisis.push({id:a.id,p:a.r()});
  }
  const it={id:'i'+(S.nid++),kind:'parure',fn:kind,slot:P.slot,
    parts:[{ct:'fixations',f:'brut',mk:mat}],
    q:+q.toFixed(2),dur:+(MAT[mat].d*q).toFixed(1),durBase:MAT[mat].d,
    de:MAT[mat].de,mana:MAT[mat].m||0,ela:MAT[mat].ela||8,
    vec:rnd4(norm(matVec(mat))),aff:choisis,
    nom:P.n+' de '+matName(mat)};
  return it;
}
/* le prix d'une parure suit ce qu'elle porte, pas ce qu'elle pèse */
const parureValeur=it=>Math.round((MAT[it.parts[0].mk].v*2+30)*it.q*(1+(it.aff||[]).length*.6)
  +((it.aff||[]).some(a=>AFFU.find(x=>x.id===a.id)&&AFFU.find(x=>x.id===a.id).don)?140:0));

/* ===== CE QUE LES PARURES DONNENT =====
   Un seul calcul, refait au plus une fois par image. Les effets se lisent
   dans lv(), st(), sacMax(), la faim, la marche et la carte : autant de
   chemins chauds où l'on ne peut pas se permettre de reparcourir
   l'équipement à chaque appel. */
let utilSale=true,utilCache=null;
const salirUtil=()=>{utilSale=true;};
function util(){
  if(!utilSale&&utilCache)return utilCache;
  utilSale=false;
  const u={sk:{},stat:{},poids:0,faim:0,soin:0,marche:0,dons:{},
    troc:0,veine:0,ligne:0,lettre:0,bourse:0};
  for(const k in (S.eq||{})){
    const it=S.eq[k];
    if(!it||!it.aff)continue;
    it.aff.forEach(a=>{
      const d=AFFU.find(x=>x.id===a.id);
      if(!d)return;                      /* un affixe de combat : ce n'est pas ici */
      const p=a.p||{};
      if(a.id==='usk')u.sk[p.k]=(u.sk[p.k]||0)+p.n;
      else if(a.id==='ustat')u.stat[p.k]=(u.stat[p.k]||0)+p.n;
      else if(a.id==='poids')u.poids+=p.n;
      else if(a.id==='faim')u.faim+=p.p/100;
      else if(a.id==='soin')u.soin+=p.p/100;
      else if(a.id==='marche')u.marche+=p.p/100;
      else if(a.id==='troc')u.troc+=p.p/100;
      else if(a.id==='veine')u.veine+=p.p/100;
      else if(a.id==='ligne')u.ligne+=p.p/100;
      else if(a.id==='lettre')u.lettre+=p.n;
      else if(a.id==='bourse')u.bourse+=p.p/100;
      else if(d.don)u.dons[a.id]=true;
    });
  }
  /* on ne coupe jamais la faim ni la marche au-delà du raisonnable : deux
     anneaux ne doivent pas supprimer une contrainte, seulement l'alléger */
  u.faim=Math.min(.6,u.faim);
  u.marche=Math.min(.45,u.marche);
  /* les memes bornes que la faim et la marche : une parure allege, elle ne
     supprime pas — deux anneaux ne doivent pas doubler un gisement */
  u.troc=Math.min(.5,u.troc);u.veine=Math.min(.6,u.veine);
  u.ligne=Math.min(.5,u.ligne);u.bourse=Math.min(.6,u.bourse);
  utilCache=u;
  return u;
}
/* Deux tables d'affixes, une seule facon de les lire. Sans cela, chaque
   panneau doit savoir de quelle table vient l'effet qu'il affiche — et le
   jour ou l'on en oublie un, le panneau tombe au lieu de mal s'afficher. */
function affDef(id){
  return (typeof AFF!=='undefined'?AFF.find(x=>x.id===id):null)||AFFU.find(x=>x.id===id)||null;
}
const affTxt=a=>{const d=affDef(a.id);return d?d.t(a.p||{}):'';};
const affListe=it=>(it&&it.aff||[]).map(affTxt).filter(Boolean);
const don=k=>!!util().dons[k];
const utilSk=k=>util().sk[k]||0;
const utilStat=k=>util().stat[k]||0;
