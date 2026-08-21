/* Sensen Mini — 24b-sequence.js
   L'enchaînement programmé : ce qu'on fait, dans quel ordre, à chaque combat
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE PLAN DIT QUOI FAIRE ; L'ENCHAÎNEMENT DIT COMMENT FRAPPER.
   Les consignes décident d'aller se battre, de manger, de rentrer. Une
   fois le combat engagé, tout se jouait tout seul et toujours pareil :
   on frappait dès qu'il y avait du souffle, on lançait chaque sort dès
   qu'il était prêt, et l'ordre ne se décidait nulle part.

   Or l'ordre EST le jeu. La chaîne Wu Xing récompense une suite
   d'éléments qui s'engendrent ; la frappe lourde vaut d'être placée en
   résolveur ; un sort coûte du mana qu'on veut dépenser au bon moment.
   Tout cela existait et personne ne pouvait l'écrire.

   Un enchaînement est une LISTE DE GESTES rejouée en boucle à chaque
   combat :
       épée de fer · estoc · boule de feu · marteau · charge ×2 · vague
   Chaque geste attend d'être payable — le souffle pour un coup, le mana
   pour un sort — et l'on passe au suivant dès qu'il est parti. Un geste
   impossible pour de bon (l'arme est perdue, le sort désappris) est
   sauté sans bloquer le reste : une ligne morte ne doit pas figer un
   enchaînement, exactement comme une consigne impossible ne fige pas un
   plan.
   ================================================================== */

const GESTES={
  coup:{n:'un coup',g:'打',d:'une frappe ordinaire — le souffle habituel',
    peut:()=>!!weapon()&&S.end>=S.thr,
    fais:()=>{attack(false);return true;}},
  lourd:{n:'une charge',g:'重',d:'la frappe lourde — chère, et c\'est elle qu\'on place en résolveur',
    peut:()=>!!weapon()&&S.end>=S.thr+22,
    fais:()=>{attack(true);return true;}},
  garde:{n:'lever la garde',g:'守',d:'un temps d\'arrêt : le souffle revient plus vite qu\'il ne part',
    peut:()=>true,
    fais:()=>{S.guard=true;return true;}},
  relacher:{n:'baisser la garde',g:'開',d:'reprendre l\'initiative',
    peut:()=>true,
    fais:()=>{S.guard=false;return true;}},
  /* les deux gestes qui prennent un argument */
  arme:{n:'prendre',g:'刀',arg:'arme',d:'dégainer une arme précise — 5 d\'endurance',
    absent:g=>seqArme(g)===-1,
    /* seqArme rend un INDICE : zero est un indice valide, et  est
       faux. Une arme rangee en tete de sac ne se degainait donc jamais. */
    peut:g=>seqArme(g)!==-1,
    fais:g=>{const i=seqArme(g);if(i<0)return false;
      S.end=Math.max(0,S.end-5);equipItem(i);return true;}},
  sort:{n:'lancer',g:'呪',arg:'sort',d:'une compétence assemblée, si le mana suffit',
    absent:g=>{const i=seqSort(g);return i<0||!compileSpell(S.spells[i]||[]).casts.length;},
    peut:g=>{const i=seqSort(g);if(i<0)return false;
      const sp=compileSpell(S.spells[i]||[]);
      return !!sp.casts.length&&(S.mana>=sp.mana||!!S.surchauffe);},
    fais:g=>{const i=seqSort(g);return i>=0&&castSpell(i);}},
  attendre:{n:'attendre',g:'待',arg:'temps',d:'laisser passer un temps — pour laisser revenir le souffle ou le mana',
    peut:()=>true,
    fais:()=>true},
};
const GESTK=Object.keys(GESTES);

/* ===== CE QUE LES GESTES DÉSIGNENT =====
   Une arme se désigne par sa FONCTION (épée, marteau, arc) et non par son
   identité : on garde son enchaînement quand on change d'épée, et c'est le
   comportement qu'on attend. La meilleure de cette fonction est prise, du
   sac ou du râtelier. */
function seqArme(g){
  const fn=g&&g.v;
  if(!fn)return -1;
  if(weapon()&&weapon().fn===fn)return -2;      /* déjà en main : rien à faire */
  let best=-1,bs=-1;
  S.items.forEach((it,i)=>{
    if(it.kind!=='arme'||it.fn!==fn)return;
    const s=itemScore(it);
    if(s>bs){bs=s;best=i;}
  });
  return best;
}
const seqSort=g=>{const i=+((g&&g.v)||0);return (S.spells[i]&&S.spells[i].length)?i:-1;};

/* ===== L'ENCHAÎNEMENT ===== */
function seq(){
  S.seq=S.seq||{on:false,i:0,r:[]};
  if(!Array.isArray(S.seq.r))S.seq.r=[];
  return S.seq;
}
const seqValide=g=>!!(g&&GESTES[g.t]);
/* ce qu'un geste dit de lui-même, en clair */
function seqTxt(g){
  if(!seqValide(g))return '—';
  const D=GESTES[g.t];
  if(g.t==='arme')return D.n+' '+(FUNC[g.v]?FUNC[g.v].n.toLowerCase():'?');
  if(g.t==='sort')return D.n+' la compétence '+((+g.v||0)+1);
  if(g.t==='attendre')return D.n+' '+(g.v||1)+' s';
  return D.n+(g.n>1?' ×'+g.n:'');
}

/* ===== LE MOTEUR =====
   Appelé à chaque tick de combat, à la place de la frappe automatique.
   Il rend `true` s'il a pris la main : la boucle laisse alors tomber son
   comportement d'origine. */
let seqT=0,seqRep=0,seqSaut=0;
function seqReset(){const S2=seq();S2.i=0;seqT=0;seqRep=0;seqSaut=0;}
function seqTick(dt){
  const Q=seq();
  if(!Q.on||!Q.r.length||!E)return false;
  seqT+=dt;
  /* un geste par battement d'arme : c'est le rythme du combat, pas le nôtre */
  const iv=1/Math.max(.2,wSpeed());
  if(seqT<iv)return true;
  seqT-=iv;
  /* on avance dans la liste jusqu'à trouver un geste payable ; si l'on fait
     un tour complet sans rien pouvoir, on laisse le tick tranquille plutôt
     que de boucler à vide */
  for(let essai=0;essai<Q.r.length+1;essai++){
    if(Q.i>=Q.r.length){Q.i=0;seqRep=0;}
    const g=Q.r[Q.i];
    if(!seqValide(g)){Q.i++;continue;}
    const D=GESTES[g.t];
    /* un geste peut se répéter : « deux charges de marteau » */
    const n=Math.max(1,Math.min(9,g.n||1));
    if(g.t==='attendre'){
      seqRep++;
      if(seqRep>=Math.max(1,Math.min(9,+g.v||1))){Q.i++;seqRep=0;}
      return true;
    }
    /* Ce qui N'EXISTE PAS se saute tout de suite : une arme perdue, une
       compétence désapprise. Attendre ne la fera pas revenir. */
    if(D.absent&&D.absent(g)){Q.i++;seqRep=0;seqSaut=0;continue;}
    let ok=false;
    try{ok=D.peut(g);}catch(e){ok=false;}
    if(!ok){
      /* Ce qui MANQUE se laisse attendre : le souffle revient, le mana aussi.
         C'est la différence entre « pas encore » et « jamais », et elle
         compte — sauter une charge parce qu'il manquait deux points
         d'endurance ferait mentir l'enchaînement qu'on a écrit.
         Douze battements de patience, puis on passe : sinon un geste qu'on
         ne pourra JAMAIS payer — une charge au-dessus de son endurance
         maximale — figerait tout le reste. */
      seqSaut++;
      if(seqSaut<12)return true;
      seqSaut=0;Q.i++;seqRep=0;continue;
    }
    seqSaut=0;
    /* « prendre l'épée » quand elle est déjà en main ne coûte rien et passe */
    if(g.t==='arme'&&seqArme(g)===-2){Q.i++;seqRep=0;continue;}
    let fait=false;
    try{fait=D.fais(g);}catch(e){fait=false;}
    if(!fait){Q.i++;seqRep=0;continue;}
    seqRep++;
    if(seqRep>=n){Q.i++;seqRep=0;}
    return true;
  }
  return true;
}

/* ===== ECRIRE UN ENCHAINEMENT ===== */
function seqAjout(){
  const Q=seq();
  if(Q.r.length>=14)return toast('Quatorze gestes au plus — au-delà on ne s\'y retrouve plus');
  Q.r.push({t:'coup',v:null,n:1});
}
function seqRegler(i,champ,val){
  const Q=seq(),g=Q.r[i];
  if(!g)return;
  if(champ==='t'){
    g.t=val;
    /* chaque geste a son argument par defaut : une epee, la premiere
       competence, une seconde d'attente */
    if(val==='arme')g.v=FK2&&FK2.length?FK2[0]:'epee';
    else if(val==='sort')g.v=0;
    else if(val==='attendre')g.v=1;
    else g.v=null;
    g.n=1;
  }
  else if(champ==='v')g.v=(g.t==='sort'||g.t==='attendre')?Math.max(0,Math.round(+val||0)):String(val);
  else if(champ==='n')g.n=Math.max(1,Math.min(9,Math.round(+val||1)));
}
const seqSuppr=i=>{const Q=seq();Q.r.splice(i,1);Q.i=0;};
const seqMonte=i=>{const Q=seq();if(i<1)return;const g=Q.r[i];Q.r[i]=Q.r[i-1];Q.r[i-1]=g;Q.i=0;};
const seqDescend=i=>{const Q=seq();if(i>=Q.r.length-1)return;const g=Q.r[i];Q.r[i]=Q.r[i+1];Q.r[i+1]=g;Q.i=0;};
/* l'enchainement de depart : celui que l'exemple decrit, et qui montre a quoi
   la chose sert sans qu'on ait a le deviner */
function seqDefaut(){
  return [
    {t:'arme',v:'epee',n:1},
    {t:'coup',v:null,n:2},
    {t:'sort',v:0,n:1},
    {t:'lourd',v:null,n:1},
    {t:'garde',v:null,n:1},
    {t:'attendre',v:2,n:1},
  ];
}

/* ===== ECRIRE CELUI D'UN COMPAGNON ===== */
function compSeqAjout(i){
  const c=S.comps[i];if(!c)return;
  c.seq=Array.isArray(c.seq)?c.seq:[];
  if(c.seq.length>=6)return toast('Six ordres au plus pour un compagnon');
  c.seq.push({o:c.order||'attaquer',n:1});
}
function compSeqRegler(i,j,champ,val){
  const c=S.comps[i];if(!c||!Array.isArray(c.seq))return;
  const g=c.seq[j];if(!g)return;
  if(champ==='o'&&ORDK.includes(val))g.o=val;
  else if(champ==='n')g.n=Math.max(1,Math.min(9,Math.round(+val||1)));
}
function compSeqSuppr(i,j){
  const c=S.comps[i];if(!c||!Array.isArray(c.seq))return;
  c.seq.splice(j,1);c.si=0;c.sn=0;
}

/* ===== LES COMPAGNONS =====
   Même machine, en plus court. Un compagnon n'a pas d'armes ni de sorts :
   il a des ORDRES, et jusqu'ici un seul, figé pour toute la partie. Un
   enchaînement lui en fait tourner plusieurs — tenir deux battements, puis
   frapper trois, puis se replier — ce qui est la seule façon de lui faire
   encaisser une charge et frapper ensuite. */
function compSeq(c){
  if(!c)return null;
  if(!Array.isArray(c.seq)||!c.seq.length)return null;
  return c.seq;
}
function compSeqOrdre(c){
  const l=compSeq(c);
  if(!l)return c.order;
  c.si=(c.si||0)%l.length;
  const g=l[c.si];
  if(!g||!ORDK.includes(g.o)){c.si=(c.si+1)%l.length;return c.order;}
  return g.o;
}
/* avancer d'un cran : appelé une fois par frappe du compagnon */
function compSeqAvance(c){
  const l=compSeq(c);
  if(!l)return;
  c.sn=(c.sn||0)+1;
  const g=l[c.si||0];
  const n=Math.max(1,Math.min(9,(g&&g.n)||1));
  if(c.sn>=n){c.sn=0;c.si=((c.si||0)+1)%l.length;}
}
