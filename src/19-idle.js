/* Sensen Mini — 19-idle.js
   Automatisations, râtelier, cadence observée, hors-ligne
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   AUTOMATISATIONS ET VEILLE
   Un idle doit tourner sans toi. Ce que tu fais à la main se rachète,
   et ce que tu ne regardes pas se résout par formules — jamais par
   simulation accélérée (même principe que l'abstraction hors-site).
   ================================================================== */
const AUTOS={
  garde:{g:'護',n:'Garde réflexe',max:5,cost:600,r:2.1,
    d:'la garde se lève seule dans la fenêtre ; chaque rang ajoute 12 % de chances que ce soit une parade parfaite — doublées si la HAUTEUR est la bonne. Au cinquième rang, la garde suit d\'elle-même le télégraphe'},
  rotation:{g:'環',n:'Communion des cinq',max:1,cost:2600,r:1,
    d:'l\'élément de l\'arme tourne tout seul dans le cycle d\'engendrement — entretien 4 mana par frappe, aucun dégainage'},
  deto:{g:'重',n:'Détonateur',max:1,cost:1500,r:1,
    d:'place la frappe lourde en résolveur quand la chaîne est pleine à un segment près'},
  marmite:{g:'厨',n:'Marmite',max:1,cost:500,r:1,
    d:'cuisine un plat dès que la faim tombe sous 40 ou le potentiel moyen sous 70'},
  intendance:{g:'帳',n:'Intendance',max:1,cost:900,r:1,
    d:'vend seule les matériaux excédentaires quand tu passes dans un village ouvert'},
  veilleur:{g:'眠',n:'Veilleur',max:1,cost:1200,r:1,
    d:'te fait dormir quand la nuit tombe sur une cellule où tu as un lit'},
  fondeur:{g:'熔',n:'Fondeur',max:1,cost:700,r:1,
    d:'fond seul le butin commun et inhabituel qui ne vaut pas ce que tu portes — un tiers de sa valeur en or'},
};
const AK=Object.keys(AUTOS);
const auto=k=>(S.auto&&S.auto[k])||0;
const autoCost=k=>Math.round(AUTOS[k].cost*Math.pow(AUTOS[k].r,auto(k)));
function buyAuto(k){
  if(auto(k)>=AUTOS[k].max)return;
  const c=autoCost(k);
  if(S.or<c)return toast('Il faut '+c+' or');
  S.or-=c;S.auto[k]=auto(k)+1;
  cutIn(AUTOS[k].g,AUTOS[k].n,'rang '+auto(k)+'/'+AUTOS[k].max);
}
/* --- râtelier : changer d'arme en pleine chaîne est une mécanique voulue --- */
const rackList=()=>S.items.filter(it=>it.kind==='arme');
/* Le RATELIER (F.6). La Communion des cinq demandait de trimballer cinq
   armes dans le sac en permanence — cinq places prises sur vingt, rien que
   pour tenir une rotation. Un ratelier chez soi accueille jusqu'a cinq
   armes ; elles comptent pour la rotation ou que tu sois, parce que ce
   qu'entretient la Communion, c'est le CYCLE, pas le poids porte. */
const ratelierList=()=>((S.ratelier||[]).slice(0,5*(typeof meubleTerritoire==='function'?meubleTerritoire('ratelier'):0)));
function rackElements(){
  const set={};
  const w=weapon();if(w)set[domi(itemVec(w))]=1;
  rackList().forEach(it=>set[domi(itemVec(it))]=1);
  ratelierList().forEach(it=>set[domi(itemVec(it))]=1);
  return set;
}
/* poser une arme au ratelier : elle quitte le sac et garde sa place au cycle */
function poserRatelier(i){
  const it=S.items[i];
  if(!it||it.kind!=='arme')return toast('Seule une arme se pose au râtelier');
  const cap=5*(typeof meubleTerritoire==='function'?meubleTerritoire('ratelier'):0);
  if(!cap)return toast('Il faut un râtelier dans un bâtiment de ton territoire (建 BÂTIR)');
  S.ratelier=S.ratelier||[];
  if(S.ratelier.length>=cap)return toast('Râtelier plein — '+cap+' armes au plus');
  S.ratelier.push(it);S.items.splice(i,1);
  log('<span class="in">'+it.nom+' prend sa place au râtelier.</span>');
}
function reprendreRatelier(i){
  const it=(S.ratelier||[])[i];if(!it)return;
  if(sacPlein())return toast('Sac plein');
  S.ratelier.splice(i,1);S.items.push(it);
  log(it.nom+' quitte le râtelier.');
}
function drawFrom(el){
  const i=S.items.findIndex(it=>it.kind==='arme'&&domi(itemVec(it))===el);
  if(i<0||S.end<5)return false;
  const old=S.eq.main1;
  S.eq.main1=S.items[i];
  if(old)S.items[i]=old;else S.items.splice(i,1);
  S.end-=5;
  return true;
}
function rotateRack(){
  const w=weapon();if(!w)return;
  if(S.end<S.thr+18)return;      /* on ne dégaine pas si ça coupe le rythme */
  drawFrom(gen(domi(itemVec(w))));
}
/* --- cadence observée : le hors-ligne reprend ton rythme réel --- */
function noteRate(k){S.cnt=S.cnt||{};S.cnt[k]=(S.cnt[k]||0)+1;}
function rollRates(){
  S.rate=S.rate||{};S.cnt=S.cnt||{};
  /* UNE CADENCE VAUT POUR CE QU'ON FAISAIT, PAS POUR CE QU'ON FAIT.
     Le rythme etait garde par GENRE de geste : « harv » valait aussi bien
     pour la mousse que pour le fer. Un joueur qui coupait du bois dix
     minutes, passait au fer et fermait l'onglet repartait avec la cadence
     du BOIS appliquee au FER — trois fois trop, et l'inverse tout aussi
     faux dans l'autre sens. On note donc SUR QUOI la cadence a ete
     observee ; changer de matiere la perime, et l'on retombe sur le
     calcul exact, qui connait le temps d'un coup de pioche a la seconde. */
  if(S.cnt.harv>0)S.rate.harvSur=S.target||null;
  if(S.cnt.craft>0)S.rate.craftSur=S.craft?S.craft.mk:null;
  ['kill','harv','craft','djroom'].forEach(k=>{
    const v=S.cnt[k]||0;
    S.rate[k]=S.rate[k]===undefined?v:S.rate[k]*.5+v*.5;
    S.cnt[k]=0;});
}
/* --- la cadence effective (E.6) ---
   On reprend le rythme observé. À défaut — première nuit, occupation
   qu'on vient de changer — on le CALCULE : le temps d'un coup de pioche
   ou d'une pièce d'atelier est connu à la seconde près, et la vitesse
   d'un tueur se déduit de son arme. Mieux vaut une estimation prudente
   qu'un rapport vide. */
function cadence(k){
  const R=S.rate||{};
  const r=R[k];
  /* la cadence observee ne vaut que si elle a ete observee sur CE geste-la */
  /* la peche et le percement partagent la cadence « harv » sans avoir de
     matiere visee : la question ne se pose que pour la recolte */
  const bonne=k==='harv'?(S.occ!=='recolte'||R.harvSur===S.target)
             :k==='craft'?R.craftSur===(S.craft?S.craft.mk:null)
             :true;
  if(r>0&&bonne)return r;
  if(k==='harv'&&S.target&&canHarvest(S.target))return 60/harvestTime(S.target)*.8;
  if(k==='craft'&&S.craft&&craftCan()){
    const j=S.craft,skk=j.t==='form'?STATION[FORM[j.f].st].sk:STATION[COMP[j.ct].st].sk;
    return 60/craftTime(j.mk,skk)*.8;}
  if(k==='kill'){
    const w=weapon();if(!w)return 0;
    const c=here();
    const power=S.occ==='donjon'&&c.dj?djPower():1+c.corr/26+c.depth*.6;
    const hp=40*Math.pow(1.21,power);
    const F=FUNC[w.fn];
    const puis=isDist(w)?((w.ela||8)/45):(w.durBase/20);
    const dps=F.d[0]*(F.d[1]+1)/2*puis*w.q*sf(lv(w.fn))*F.spd*.45;
    if(dps<=0)return 0;
    return Math.max(.15,Math.min(6,60/Math.max(3,hp/dps)));}
  return 0;
}
/* --- résolution de l'absence (E.6 : formules, jamais de simulation) --- */
function offline(sec){
  const capH=8;
  const coupe=Math.min(sec,capH*3600);
  const min=coupe/60,eff=.6;
  const r=[];
  /* LE PLAFOND NE SE DISAIT NULLE PART. On revenait apres deux jours, la
     fenetre annoncait « Absence de 48 h », et les chiffres n'en couvraient
     que huit. Rien ne l'expliquait : le joueur en concluait, a raison de son
     point de vue, que le jeu ne travaille pas quand il est ferme. Huit
     heures est une regle, pas un bug — mais une regle tue ment. */
  if(sec>capH*3600+60)
    r.push('<span class="bd">'+capH+' h créditées sur '+Math.round(sec/3600)
      +' h d absence — au-dela, le monde t attend sans avancer</span>');
  S.day+=coupe/DAY;
  const w=Math.floor(S.day/WEEK);
  let nw=0;while(S.week<w&&nw<24){S.week++;weekly();nw++;}
  if(nw)r.push(nw+' semaine'+(nw>1?'s':'')+' de territoire résolues');
  /* la faim : on ne jeûne pas huit heures quand le garde-manger est plein.
     L'absence y pioche, exactement comme on le ferait à la main. */
  S.faim=Math.max(0,S.faim-coupe/90);
  if(S.faim<70){
    let repas=0;
    for(let i=0;i<500&&S.faim<95;i++){
      const k=Object.keys(S.food).find(x=>S.food[x]>0);
      if(k){useFood(k,1);S.faim=Math.min(100,S.faim+foodInfo(k).nutr*.5);repas++;continue;}
      if(S.vivres>0){S.vivres--;S.faim=Math.min(100,S.faim+28);repas++;continue;}
      break;
    }
    if(repas)r.push(repas+' repas pris sur les réserves');
    else if(S.faim<=0)r.push('<span class="bd">rien à manger — tu reviens affamé</span>');
  }
  const rt={kill:cadence('kill'),harv:cadence('harv'),craft:cadence('craft'),djroom:(S.rate||{}).djroom||0};
  const c=here();
  if((S.occ==='combat'||S.occ==='donjon')&&rt.kill>0){
    const n=Math.round(rt.kill*min*eff);
    if(n>0){
      const g=Math.round(n*(5+c.corr*.55+c.depth*5));
      S.or+=g;
      const xp=n*(20+c.corr*1.2);
      const wpn=weapon();
      if(wpn){gainXp(wpn.fn,xp);gainXp('el_'+EL[domi(itemVec(wpn))].k,xp);}
      gainXp('encaissement',xp*.3);
      for(let i=0;i<Math.min(n,60);i++){addFood(foodKey('viande',ri(0,4),MEATGRP[ri(0,4)]),1);}
      const loot=Math.floor(n*.03);
      for(let i=0;i<Math.min(loot,6);i++)dropLoot(c,false);
      r.push(n+' créatures abattues, +'+g+' or');
    }
  } else if(S.occ==='recolte'&&S.target&&rt.harv>0){
    const veut=Math.round(rt.harv*min*eff);
    const n=takeStock(c,S.target,veut);
    if(n>0){const m=MAT[S.target];
      S.mat[S.target]=(S.mat[S.target]||0)+n;
      if(PLANTE[S.target])addFood(S.target,n);
      gainXp(CAT[m.c].sk,n*m.d);
      r.push(n+' × '+matName(S.target)+' récoltés');}
    /* UN FILON QUI S'EPUISE PENDANT L'ABSENCE NE LE DISAIT PAS. On revenait
       avec un tiers de ce qu'on attendait, sans une ligne pour expliquer
       pourquoi, et la pioche continuait de battre une case a sec. */
    if(n<veut)r.push(n?"<span class=\"bd\">le filon s'est tari — il n'y avait plus que "+n+" à prendre</span>"
                      :"<span class=\"bd\">le filon était déjà à sec — rien à prendre</span>");
  } else if(S.occ==='atelier'&&S.craft&&rt.craft>0){
    const n=Math.round(rt.craft*min*eff);
    let fait=0;
    for(let i=0;i<n;i++){if(!craftCan())break;
      if(S.craft.t==='form')transform(S.craft.f,S.craft.mk);else makeComp(S.craft.ct,S.craft.f,S.craft.mk);
      fait++;}
    if(fait)r.push(fait+' pièces façonnées');
    if(fait<n)r.push('l\'ouvrage s\'est arrêté faute de matière');
  } else if(S.occ==='peche'&&rt.harv>0){
    /* ==================================================================
       PARTIR EN PECHANT NE RAPPORTAIT RIEN.
       Le resume d'absence connait quatre occupations : le combat, la
       recolte, l'atelier, l'exploration. Il en manquait DEUX, et pas les
       moindres — la PECHE, qui est une voie de subsistance entiere, et le
       PERCEMENT, qui est la seule facon de descendre. Un joueur qui ferme
       l'onglet la ligne a l'eau revenait les mains vides, la ou celui qui
       le fermait la pioche en main revenait charge. Rien ne le disait :
       aucune branche ne correspondait, et le rapport se taisait.
       ================================================================== */
    const n=Math.round(rt.harv*min*eff);
    let pris=0;
    for(let i=0;i<Math.min(n,400);i++){
      if(pecheBlocage())break;
      const k=pecheTirage(),q=1+Math.floor(lv('peche')/14);
      if(PECHE_FOOD[k])addFood(foodKey(k,domi(cellVec(c)),PECHEGRP[k]||'Vie'),q);
      else if(MAT[k]){S.mat[k]=(S.mat[k]||0)+q;if(PLANTE[k])addFood(k,q);}
      collecte('prise',k);gainXp('peche',6+(MAT[k]?MAT[k].d:2));
      pris+=q;
    }
    if(pris)r.push(pris+' prises remontées');
    else r.push('la ligne n\'a rien donné — l\'eau était fermée');
  } else if(S.occ==='percer'&&rt.harv>0){
    const next=Math.min(5,c.depth+1),rock=STRATA[next].rock;
    if(!canPierce(rock))r.push('la roche a rebondi — il faut un meilleur outil');
    else{
      const n=Math.round(rt.harv*min*eff);
      let blocs=0,strates=0;
      for(let i=0;i<Math.min(n,600);i++){
        c.dug=(c.dug||0)+1;S.mat[rock]=(S.mat[rock]||0)+1;blocs++;
        gainXp('minage',MAT[rock].d*1.5);
        if(c.dug>=pierceNeed(c.depth)){
          c.dug=0;c.depth=Math.min(5,c.depth+1);strates++;
          if(c.depth>=5)break;
        }
      }
      r.push(blocs+' blocs perces'+(strates?' · '+strates+' strate'+(strates>1?'s':'')+' franchie'+(strates>1?'s':''):''));
    }
  } else if(S.occ==='explore'){
    const n=Math.round(min/3*eff);let vu=0;
    for(let i=0;i<n;i++){const b=explorePulseSilent();if(b)vu++;}
    if(vu)r.push(vu+' cellules dévoilées');
  }
  /* ==================================================================
     LA MOITIE MANQUANTE DU MEME DEFAUT.
     J'ai corrige le fait que la collection ne s'inscrivait qu'en ouvrant
     l'onglet, en la balayant dans la boucle. Mais l'ABSENCE n'est pas la
     boucle : c'est un resume, qui abat des creatures, recolte, devoile des
     cellules et fait tomber du butin sans jamais passer par elle. Dans un
     jeu qui tourne quand on n'est pas la, c'est justement la que la moitie
     de la partie se joue — et rien ne s'y collectionnait.

     Et un titre decroche pendant qu'on dormait doit se DIRE au retour : le
     rapport d'absence est le seul endroit ou l'on regarde ce qui s'est
     passe. Un titre qui tombe en silence n'a jamais ete gagne. */
  if(typeof colBalayer==='function'){
    /* hfAcquis rend les titres DANS L'ORDRE DE LA TABLE, pas dans celui ou on
       les a gagnes : comparer les longueurs et couper la fin donnerait les
       mauvais noms des qu'un titre du milieu tombe. On compare les listes. */
    const avant=typeof hfAcquis==='function'?hfAcquis():[];
    colBalayer();
    if(typeof hfAcquis==='function'){
      const gagnes=hfAcquis().filter(k=>avant.indexOf(k)<0);
      if(gagnes.length)r.push('titre'+(gagnes.length>1?'s':'')+' décroché'+(gagnes.length>1?'s':'')
        +' : '+gagnes.map(k=>HAUTFAIT[k]?HAUTFAIT[k].n:k).join(', '));
    }
  }
  if(sec>capH*3600)r.push('(plafonné à '+capH+' h)');
  return r;
}
function explorePulseSilent(){
  const c=here();let found=null,best=99;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    const n=cell(c.x+dx,c.y+dy);if(n.seen)continue;
    const d=Math.abs(dx)+Math.abs(dy);if(d<best){best=d;found=n;}}
  if(!found)return false;
  found.seen=true;gainXp('perception_sk',12);return true;
}
