/* Sensen Mini — 22b-vehicules.js
   Véhicules : charrette, char à voile, draisine, barque, voilier (E.24)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE TEMPS DU MONDE EST LA VRAIE MONNAIE (E.24)
   Une heure de marche par cellule, et rien d'autre depuis le premier
   jour. Le monde est infini, la carte s'ouvre dans toutes les
   directions, et l'on s'y déplace toujours au même pas.

   Un véhicule change deux choses, et ce sont les deux qui décident de
   ce qu'on peut se permettre : le TEMPS d'un trajet et ce qu'on peut
   EMPORTER. Aller vendre à trois royaumes de là n'est pas une question
   de courage, c'est une question de savoir si l'on rentrera avant que
   la semaine ne passe et que les étals ne se renouvellent.

   Le GDD décrit des véhicules sculptés, pilotés dans le monde voxel.
   Ici il n'y a pas de pilotage : il reste ce qui compte à l'échelle de
   la carte — la vitesse de voyage, la charge, le terrain qu'on peut
   traverser, et le vent pour qui porte une voile.
   ================================================================== */

const VEHICULE={
  charrette:{n:'Charrette',g:'車',eau:0,vit:.72,cargo:26,pv:60,lv:6,
    st:'etabli',cout:[['bois',18],['form:lingot',4],['form:tanne',6]],
    d:'lente mais elle porte : vingt-six objets de plus, et la boue ne l\'arrête pas'},
  draisine:{n:'Draisine',g:'輪',eau:0,vit:.58,cargo:10,pv:70,lv:18,
    st:'enclume',cout:[['form:lingot',14],['bois',10],['form:tanne',3]],
    d:'mécanique, régulière, insensible au vent — la plus sûre des routes'},
  charavoile:{n:'Char à voile',g:'帆',eau:0,vit:.46,cargo:6,pv:40,lv:14,voile:1,
    st:'etabli',cout:[['bois',14],['form:tissu',10],['form:lingot',3]],
    d:'le plus rapide sur terrain découvert — et le plus dépendant du vent'},
  barque:{n:'Barque',g:'舟',eau:1,vit:.60,cargo:12,pv:45,lv:8,
    st:'etabli',cout:[['bois',16],['form:tanne',4],['vegetal',8]],
    d:'longe les côtes ; sur terre elle ne sert à rien'},
  voilier:{n:'Voilier',g:'船',eau:1,vit:.40,cargo:34,pv:95,lv:26,voile:1,
    st:'etabli',cout:[['bois',34],['form:tissu',18],['form:lingot',8],['form:tanne',6]],
    d:'la côte devient une route : moitié moins de temps, et trente-quatre objets de plus'},
};
const VEHK=Object.keys(VEHICULE);
/* Les biomes où l'on navigue. Une barque sur une plaine n'est pas lente :
   elle est inutilisable, et le dire vaut mieux que la ralentir. */
const BIOME_EAU={cote:1,marecage:1,marcorr:1};
/* On navigue sur la mer, dans un marais — et sur une riviere assez large.
   Un ruisseau ne porte pas une barque ; une riviere, oui (E.2.2). */
const surEau=c=>{const z=c||here();return !!BIOME_EAU[z.b]||rivDe(z)>=2;};

/* ===== LE VENT (E.24 / E.28) =====
   Il ne s'invente pas : il dérive du même bruit que la météo, donc il est
   déterministe, il tourne lentement, et deux joueurs de la même graine le
   trouvent au même endroit. Un char à voile face au vent avance à peine ;
   la Navigation ne supprime pas le malus, elle le rabote. */
function ventDir(c,day){
  const t=Math.floor((day===undefined?S.day:day)*2);
  return noise((c||here()).x,(c||here()).y,S.seed+t,47,5)*Math.PI*2;
}
const VENTN=['est','nord-est','nord','nord-ouest','ouest','sud-ouest','sud','sud-est'];
const ventNom=c=>VENTN[Math.round(ventDir(c)/(Math.PI/4))&7];
/* combien le vent aide ou gêne un trajet : 1 dans le dos, −1 en pleine face */
function ventFaveur(dx,dy,c){
  const n=Math.hypot(dx,dy);
  if(!n)return 0;
  const a=ventDir(c);
  return (Math.cos(a)*dx+Math.sin(a)*dy)/n;
}

/* ===== CE QU'ON POSSÈDE ===== */
const vehicule=()=>S.vehicule&&VEHICULE[S.vehicule.k]?S.vehicule:null;
const vehDef=()=>{const v=vehicule();return v?VEHICULE[v.k]:null;};
/* utilisable ici : un bateau veut de l'eau, une charrette n'en veut pas */
function vehUtile(c){
  const v=vehicule(),D=vehDef();
  if(!v||v.pv<=0)return false;
  /* une voile dans une tempete ne sert a rien du tout */
  if(D.voile&&meteoVoile(c)<=0)return false;
  return D.eau?surEau(c):!surEau(c);
}
/* ce que le véhicule ajoute au dos — et seulement là où il peut suivre */
const vehCargo=()=>vehUtile()?vehDef().cargo:0;

/* multiplicateur de temps pour un trajet donné. 1 = à pied. */
function vehVitesse(dx,dy,c){
  if(!vehUtile(c))return 1;
  const D=vehDef(),v=vehicule();
  let m=D.vit;
  /* l'usure compte : un essieu fendu ne va pas vite */
  m*= 1+(1-v.pv/D.pv)*.45;
  if(D.voile){
    /* « vent violent : vehicules a voiles ingouvernables » (E.24/E.28). Un
       zero ici veut dire qu'on ne prend pas la mer, pas qu'on y va lentement :
       vehUtile le refuse et l'on marche. */
    const mv2=meteoVoile(c);
    if(mv2<=0)return 1;
    const f=ventFaveur(dx,dy,c);
    /* face au vent, on tire des bords : jusqu'à +70 % de temps, moins ce que
       la Navigation sait reprendre */
    const malus=Math.max(0,-f)*.70*(1-Math.min(.6,lv('navigation')*.02));
    const aide=Math.max(0,f)*.20;
    m*=(1+malus-aide)/Math.max(.2,mv2);
  }
  return Math.max(.28,m);
}
/* le voyage abîme : la route use, la mer use davantage */
function vehUser(d){
  const v=vehicule();if(!v||!vehUtile())return;
  const D=vehDef();
  v.pv=Math.max(0,v.pv-d*(D.eau?.9:.6));
  if(v.pv<=0){
    /* « à 0 : épave récupérable (50 % des matériaux) » (E.24) */
    const rendu=[];
    D.cout.forEach(([r,n])=>{
      const k=r.startsWith('form:')?null:r;
      const moitie=Math.floor(n/2);
      if(k&&moitie>0){S.mat[k]=(S.mat[k]||0)+moitie;rendu.push(moitie+' × '+(CAT[k]?CAT[k].n:matName(k)));}
    });
    S.vehicule=null;
    cutIn(D.g,D.n+' — épave','ce qu\'il en reste : '+(rendu.join(', ')||'rien de récupérable'));
  } else if(v.pv<D.pv*.3&&!v.crie){
    v.crie=1;log('<span class="bd">'+D.n+' : l\'attelage fatigue — une réparation s\'impose.</span>');
  }
}
/* réparer coûte le quart du prix, en matières */
function vehReparer(){
  const v=vehicule(),D=vehDef();
  if(!v)return toast('Aucun véhicule');
  if(v.pv>=D.pv)return toast(D.n+' est en bon état');
  if(!hasStation(D.st))return toast('Il faut '+STATION[D.st].n);
    const quart=D.cout.map(([r,n])=>[r,Math.max(1,Math.round(n/4))]);
  if(!payCost(quart))return toast('Il manque : '+costTxt(quart));
  v.pv=D.pv;v.crie=0;
  gainXp('menuiserie',120);
  cutIn(D.g,D.n+' remis en état','points de structure au complet');
}
/* ===== CONSTRUIRE =====
   On ne sculpte pas (13) : un véhicule s'assemble à la station, avec des
   matières comptées par catégorie ou par forme travaillée, comme un meuble. */
function vehBlocage(k){
  const D=VEHICULE[k];
  if(!D)return 'inconnu';
  if(!hasStation(D.st))return 'il faut '+STATION[D.st].n;
  if(lv('menuiserie')<D.lv)return 'Menuiserie '+D.lv+' (tu en as '+lv('menuiserie')+')';
  /* on ne paie pas ici : on regarde seulement si l on pourrait */
  if(!D.cout.every(([w,n])=>w.startsWith('form:')
      ? Object.keys(S.ref).filter(r=>r.startsWith(w.slice(5)+':')).reduce((a,r)=>a+S.ref[r],0)>=n
      : matsOf(w).reduce((a,m)=>a+S.mat[m],0)>=n))
    return 'il manque '+costTxt(D.cout);
  return null;
}
function vehConstruire(k){
  const b=vehBlocage(k);
  if(b)return toast(b);
  const D=VEHICULE[k];
  if(!payCost(D.cout))return toast('Il manque : '+costTxt(D.cout));
  S.vehicule={k,pv:D.pv,crie:0};collecte('vehicule',k);
  gainXp('menuiserie',260+D.lv*20);
  gainXp('assemblage',120);
  cutIn(D.g,D.n,'construit — '+D.d);
}
function vehAbandonner(){
  const v=vehicule();if(!v)return;
  const D=vehDef();
  S.vehicule=null;
  log(D.n+' est laissé sur place.');
}
