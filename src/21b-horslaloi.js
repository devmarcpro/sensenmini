/* Sensen Mini — 21b-horslaloi.js
   Vol, prime sur la tête, receleurs et anarchie (E.26 / 14.4 / 7.2)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   ON POUVAIT ENFREINDRE LA LOI, JAMAIS LA CHOISIR.
   Les royaumes ont des lois depuis longtemps, avec détection et
   sanction — mais on ne les enfreignait que par accident : traverser
   une frontière avec la mauvaise marchandise, vendre après la tombée
   du jour. Aucun geste du jeu ne disait « prends-le sans payer ».

   Le vol change la structure du jeu, pas seulement son économie. Il
   donne une réponse à « je n'ai pas les moyens » qui ne soit pas
   « reviens dans dix heures », et il la fait payer autrement qu'en or :
   par une PRIME, qui suit le royaume et non la cellule, qui grossit,
   et qui finit par envoyer des gardes sur la route.

   Trois pièces, et elles se tiennent :
     — voler, avec un jet de Discrétion contre la vigilance du lieu ;
     — la prime, qui s'accumule par royaume et qu'on peut solder ;
     — le receleur, qui rachète sans poser de question, à moitié prix.
   Et l'exception que le GDD demande explicitement : dans une ANARCHIE,
   il n'y a pas de gardes, donc pas de sanction possible. La loi n'y est
   mécaniquement pas applicable.
   ================================================================== */

/* ===== L'ANARCHIE N'A PAS DE GARDES ===== */
/* « Royaume sans gardes (anarchie, 14.4) → AUCUNE conséquence structurelle
   possible : la loi ne peut mécaniquement pas s'appliquer » (E.26). */
function sansGardes(ki){
  const i=ki===undefined?kingdomHere():ki;
  if(i===null||i===undefined)return true;          /* hors royaume : personne */
  const k=S.kingdoms[i];
  return !k||k.gov==='anarchie';
}

/* ===== LA PRIME ===== */
/* Elle vit par royaume, jamais par cellule : fuir la ville ne suffit pas,
   il faut quitter le pays — ou payer. */
const primeDe=ki=>(S.prime&&S.prime[ki])||0;
const primeIci=()=>{const i=kingdomHere();return i===null?0:primeDe(i);};
function primeAjout(n,pourquoi){
  const i=kingdomHere();
  if(i===null)return 0;
  if(sansGardes(i)){
    log('<span class="gd">Ici personne ne tient de registre — il n\'y a pas de gardes.</span>');
    return 0;
  }
  S.prime=S.prime||{};
  S.prime[i]=Math.round(primeDe(i)+n);
  const k=S.kingdoms[i];
  cutIn('罪','Recherché — '+k.nom,pourquoi+' · prime '+S.prime[i]+' or');
  return S.prime[i];
}
/* solder sa dette : le double de la prime, et l'on redevient quelconque */
function primePayer(){
  const i=kingdomHere();
  if(i===null)return toast('Aucun royaume ici');
  const p=primeDe(i);
  if(!p)return toast('Rien ne pèse sur ta tête ici');
  const t=townAt(S.pos[0],S.pos[1]);
  if(!t)return toast('Il faut une ville pour parler à quelqu\'un');
  const du=Math.round(p*2);
  if(S.or<du)return toast('Il faut '+du+' or — le double de la prime');
  S.or-=du;S.prime[i]=0;
  gainRep(6,S.kingdoms[i].race,i);
  cutIn('赦','Prime soldée','−'+du+' or · '+S.kingdoms[i].nom+' t\'oublie');
}
/* la prime décide de la fréquence des embuscades de gardes en voyage */
function primePatrouille(d){
  const i=kingdomHere();
  if(i===null||sansGardes(i))return;
  const p=primeDe(i);
  if(p<120)return;
  const risque=Math.min(.55,(p-120)/1400)*d;
  if(Math.random()>risque)return;
  /* une patrouille, ce sont des humains armés : le combat ordinaire suffit
     à les représenter, et la corruption locale n'y est pour rien */
  S.occ='combat';E=null;EE=[];respawnT=.25;sceneMode='';
  S.patrouille=1;
  cutIn('捕','Une patrouille te coupe la route',S.kingdoms[i].nom+' · prime '+p+' or');
}

/* ===== VOLER ===== */
/* La vigilance d'un lieu : la taille de la ville, la sévérité du régime, le
   plein jour. On ne vole pas une capitale à midi comme un hameau à la nuit. */
function vigilance(t){
  const i=kingdomHere(),k=i===null?null:S.kingdoms[i];
  return 10
    +(t?(t.type==='capitale'?5:t.type==='ville'?3:1):0)
    +(k?GOV[k.gov].law*1.4:0)
    +(isNight()?-3:0)
    +Math.max(0,repTier(repLocale())-2);      /* on surveille moins un notable */
}
function volerOffre(shopKey,idx){
  const t=townAt(S.pos[0],S.pos[1]);
  if(!t)return toast('Aucune ville ici');
  const off=(shopStock(t)[shopKey]||[])[idx];
  if(!off)return toast('Plus rien ici');
  if(!shopsOpen(t))return toast(isNight()?'L\'étal est rentré pour la nuit':'On ne te laisse pas approcher');
  if(off.t==='item'&&sacPlein())return toast('Sac plein — on ne vole pas ce qu\'on ne peut pas emporter');
  const dd=vigilance(t);
  const jet=d20()+lv('discretion')/2+st('dex')/4+(don('silence')?8:0);
  gainXp('discretion',60);
  if(jet>=dd){
    /* le vol réussit : la marchandise part, l'étal se vide comme après un achat */
    livrerOffre(off);
    /* la piece prise garde la marque : c'est elle qui rend le vol couteux
       meme quand il reussit */
    if(off.t==='item')marquerVole(off.it);
    (shopStock(t)[shopKey]||[]).splice(idx,1);
    S.vols=(S.vols||0)+1;
    gainXp('discretion',90);
    log('<span class="gd">Personne n\'a rien vu. '+off.label+' est à toi.</span>');
    return;
  }
  /* raté : la prime monte à la valeur de ce qu'on a tenté de prendre */
  const val=Math.max(20,off.p||30);
  gainRep(-8,S.kingdoms[kingdomHere()]?S.kingdoms[kingdomHere()].race:null,kingdomHere());
  if(sansGardes()){
    log('<span class="bd">On t\'a vu — et l\'on te regarde faire. Personne ici pour t\'arrêter.</span>');
    return;
  }
  primeAjout(val,'vol à l\'étal, jet '+jet.toFixed(1)+' contre DD '+dd);
  /* et l'on est chassé de l'étal sur-le-champ */
  t.stock.week=-1;
}
/* Un objet volé se reconnaît : aucun marchand honnête n'en veut, et le
   receleur en donne la moitié. C'est ce qui rend le vol coûteux même quand
   il réussit — on ne peut pas revendre au grand jour ce qu'on a pris. */
const marquerVole=it=>{if(it)it.vole=1;};
const objetsVoles=()=>(S.items||[]).filter(it=>it.vole);

/* ===== LE RECELEUR ===== */
/* Il n'a pas d'étal. On le trouve dans les camps — là où l'on ne demande
   rien à personne — et dans les villes où l'on est assez mal vu pour qu'on
   vous adresse la parole en coin. */
function receleurIci(){
  const c=here();
  if(c.poi==='camp')return true;
  const t=townAt(c.x,c.y);
  if(!t||t.abandonne)return false;
  return repTier(repLocale())<=1||sansGardes();
}
function recelerTout(){
  if(!receleurIci())return toast('Personne ici ne rachète ce genre de marchandise');
  const l=objetsVoles();
  if(!l.length)return toast('Rien de compromettant sur toi');
  let or=0;
  l.forEach(it=>{or+=Math.round(itemValue(it)*.5);});
  S.items=S.items.filter(it=>!it.vole);
  S.or+=or;
  gainXp('negociation',40+l.length*20);
  cutIn('闇','Marchandise écoulée',l.length+' pièce'+(l.length>1?'s':'')+' · +'+or+' or, moitié prix, aucune question');
}
/* un marchand honnête refuse : c'est la contrepartie du vol reussi */
const refuseVole=it=>!!(it&&it.vole)&&!receleurIci();
