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
  /* ON NE COPIE QUE CE QU'ON SAIT. Le domaine sort de ce dont on porte deja
     un module, et c'est le PLUS PAUVRE qui vient : un scribe comble ses
     lacunes, il ne devine pas un art qu'il n'a jamais vu. La difficulte suit
     la lecture — ecrire au-dessus de son niveau produirait un livre qu'on ne
     saurait pas relire, ce qui serait une farce. */
  manuel:{n:'Manuel copié',g:'冊',lot:1,st:'scriptorium',sk:'lecture',
    cout:[['vegetal',8],['mineral',2]],
    d:'un livre écrit de ta main, dans un domaine que tu pratiques déjà',
    utile:()=>lv('lecture')>=5&&(S.modules||[]).length>0,
    fais(){
      const connus={};(S.modules||[]).forEach(m=>{
        if(m.dom)connus[m.dom]=(connus[m.dom]||0)+1;});
      const doms=Object.keys(connus).filter(d=>DOMAIN[d]);
      if(!doms.length)return 'aucun domaine pratiqué — le papier reste blanc';
      doms.sort((a,b)=>connus[a]-connus[b]);
      const dm=doms[0];
      const diff=Math.max(2,Math.min(12,2+Math.floor(lv('lecture')/6)));
      S.books.push({id:'b'+(S.nid++),dom:dm,diff});
      gainXp('lecture',diff*40);
      return DOMAIN[dm].n+' · difficulté '+diff;
    }},
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
  collecte('conso',k);
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
