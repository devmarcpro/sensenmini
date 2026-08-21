/* Sensen Mini — 14b-consommables.js
   Bandage, torche, huile d'arme, ration de voyage (F.5)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   QUATRE OBJETS QUE LE CATALOGUE PROMET DEPUIS LE DÉBUT (F.5)
   Ce ne sont pas des potions : on n'en distille pas, on les FAIT — deux
   bandes de tissu, un bâton et de la résine. Ils coûtent peu et se
   fabriquent par lots ; ce qu'ils achètent, c'est de ne pas dépendre
   d'une boutique au mauvais moment.

   Chacun répond à un manque précis que rien d'autre ne couvre :
     — le BANDAGE arrête une plaie sans alambic ni herboriste ;
     — la TORCHE éclaire une cellule qu'on ne possède pas, là où la
       lanterne demande un bâtiment et le bâtiment un territoire ;
     — l'HUILE D'ARME ajoute du feu à des coups qui n'en portaient pas,
       sans changer d'arme ni de vecteur ;
     — la RATION nourrit sans le risque de la chair crue.
   ================================================================== */

const CONSO={
  bandage:{n:'Bandage',g:'布',lot:3,st:null,sk:'tissage',
    cout:[['form:tissu',1]],
    d:'arrête une plaie et rend un peu de vie — sans alambic ni herboriste',
    utile:()=>hasStatus(S,'saignement')||S.hp<maxHp()*.75,
    fais(){
      const soigne=soigner('saignement','le bandage serre la plaie');
      const h=Math.round(maxHp()*.08*(1+lv('tissage')*.01));
      S.hp=Math.min(maxHp(),S.hp+h);
      return (soigne?'plaie fermée · ':'')+'+'+h+' PV';
    }},
  torche:{n:'Torche',g:'松',lot:4,st:null,sk:'menuiserie',
    cout:[['bois',2],['vegetal',2]],
    d:'éclaire la cellule dix minutes — la nuit n\'y attire plus les prédateurs',
    utile:()=>isNight()&&!eclaireIci(),
    fais(){S.torche=600;return 'dix minutes de lumière';}},
  huile:{n:'Huile d\'arme',g:'油',lot:2,st:'alambic',sk:'alchimie',
    cout:[['vegetal',4],['form:tissu',1]],
    d:'cinq minutes durant, tes coups portent du feu en plus',
    utile:()=>!S.huile&&(S.occ==='combat'||S.occ==='donjon'),
    fais(){S.huile=300;return 'la lame fume';}},
  ration:{n:'Ration de voyage',g:'糧',lot:4,st:'cuisine',sk:'cuisine',
    cout:[['vegetal',3],['mineral',1]],
    d:'nourrit franchement, et sans le risque de la chair crue',
    utile:()=>S.faim<70,
    fais(){const g=Math.round(25*(1+lv('cuisine')*.008));
      S.faim=Math.min(100,S.faim+g);return '+'+g+' de faim';}},
};
const CONSK=Object.keys(CONSO);
const consoDe=k=>(S.conso&&S.conso[k])||0;

/* ===== FABRIQUER =====
   Par lots, parce qu'un bandage à la fois serait une corvée et non un choix. */
function consoBlocage(k){
  const D=CONSO[k];
  if(!D)return 'inconnu';
  if(D.st&&!hasStation(D.st))return 'il faut '+STATION[D.st].n;
  if(!D.cout.every(([w,n])=>w.startsWith('form:')
      ? Object.keys(S.ref).filter(r=>r.startsWith(w.slice(5)+':')).reduce((a,r)=>a+S.ref[r],0)>=n
      : matsOf(w).reduce((a,m)=>a+S.mat[m],0)>=n))
    return 'il manque '+costTxt(D.cout);
  return null;
}
function consoFaire(k){
  const b=consoBlocage(k);
  if(b)return toast(b);
  const D=CONSO[k];
  if(!payCost(D.cout))return toast('Il manque '+costTxt(D.cout));
  S.conso=S.conso||{};
  S.conso[k]=consoDe(k)+D.lot;
  gainXp(D.sk,40);
  log('<span class="in">'+D.n+' × '+D.lot+' — il t\'en reste '+S.conso[k]+'.</span>');
}
function consoUser(k){
  const D=CONSO[k];
  if(!D)return;
  if(!consoDe(k))return toast('Tu n\'en as plus');
  S.conso[k]--;
  if(!S.conso[k])delete S.conso[k];
  const dit=D.fais();
  cutIn(D.g,D.n,dit+' · reste '+consoDe(k));
}

/* ===== CE QUI COURT DANS LE TEMPS =====
   La torche brûle et l'huile s'évapore : les deux s'usent à la seconde, pas
   au coup — on les allume avant d'entrer, pas pendant. */
function tickConso(dt){
  if(S.torche>0){
    S.torche-=dt;
    if(S.torche<=0){S.torche=0;log('La torche s\'éteint.');}
  }
  if(S.huile>0){
    S.huile-=dt;
    if(S.huile<=0){S.huile=0;log('L\'huile a fini de brûler.');}
  }
}
const torcheAllumee=()=>(S.torche||0)>0;
