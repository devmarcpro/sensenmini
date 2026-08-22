/* Sensen Mini — 19b-consignes.js
   Programmation des actions du joueur : consignes ordonnées
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LES CONSIGNES

   Les automatisations (19-idle.js) achètent des réflexes fixes : la
   garde se lève, la marmite mijote, le fondeur fond. Elles ne disent
   rien de ce que le personnage FAIT de sa journée — se battre, récolter,
   rentrer, dormir. C'était laissé à la main du joueur, ce qui est
   étrange dans un jeu qui se veut jouable en le regardant à peine.

   Une consigne se lit comme une phrase : SI telle chose, ALORS telle
   action. On les range dans l'ordre qu'on veut ; à chaque examen, la
   première dont la condition est vraie ET dont l'action est possible
   l'emporte. Les suivantes ne sont pas consultées — c'est ce qui rend
   l'ordre signifiant, et c'est tout le pouvoir qu'on donne au joueur.

   Rien ne se déclenche en pleine autre chose : un ouvrage à l'établi,
   un voyage, un sommeil se terminent avant qu'on reconsidère.
   ================================================================== */

/* ---------- les conditions ---------- */
/* `v` est le seuil réglable ; `def` sa valeur de départ. */
const CONDS={
  toujours:{n:'toujours',d:'sans condition — à mettre en dernier',
    test:()=>true},
  pvbas:{n:'PV sous',u:'%',def:40,min:5,max:95,
    d:'ce qu\'il reste de vie, en pourcentage',
    test:v=>S.hp/Math.max(1,maxHp())*100<v},
  pvplein:{n:'PV au-dessus de',u:'%',def:85,min:5,max:100,
    d:'de quoi repartir au combat',
    test:v=>S.hp/Math.max(1,maxHp())*100>=v},
  faimbasse:{n:'faim sous',u:'',def:45,min:5,max:95,
    d:'sous 25, on ne se soigne plus ; à zéro on tombe à un point de vie',
    test:v=>S.faim<v},
  endbasse:{n:'endurance sous',u:'',def:25,min:5,max:95,
    d:'le souffle : sans lui, les coups sortent à moitié',
    test:v=>S.end<v},
  manabasse:{n:'mana sous',u:'%',def:30,min:5,max:95,
    d:'pour qui vit de ses modules',
    test:v=>S.mana/Math.max(1,maxMana())*100<v},
  nuit:{n:'il fait nuit',d:'les bêtes nocturnes sortent, les boutiques ferment',
    test:()=>isNight()},
  jour:{n:'il fait jour',d:'',test:()=>!isNight()},
  sacplein:{n:'sac rempli à',u:'%',def:90,min:20,max:100,
    d:'au-delà, le butin banal reste par terre',
    test:v=>S.items.length/Math.max(1,sacMax())*100>=v},
  gibierrare:{n:'le gibier se fait rare ici',d:'la case a été trop chassée — le délai s\'étire',
    test:()=>vide(here())>=2},
  caseepuisee:{n:'plus rien à récolter ici',d:'',
    test:()=>!cellMats(here()).some(m=>canHarvest(m)&&stockOf(here(),m)>0)},
  ennemidur:{n:'la cible est rare ou gardienne',d:'',
    test:()=>!!(E&&(E.rare||E.boss))},
  ordonne:{n:'la bourse dépasse',u:' or',def:1000,min:50,max:100000,
    d:'de quoi aller dépenser',test:v=>S.or>=v},
  enville:{n:'on est dans un village',d:'on ne se bat pas dans les rues',
    test:()=>!!here().town},
  aucampement:{n:'on est chez soi',d:'sur une cellule revendiquée',
    test:()=>!!here().claim},
  /* Un plan ne vaut que par ce qu'il peut OBSERVER. Ces six-la sont nees
     des systemes des derniers jours : sans elles, la fievre, la prime et
     l'attelage restaient des choses qu'on devait surveiller a la main —
     c'est-a-dire des choses qui, dans un jeu qui tourne seul, ne seraient
     jamais surveillees. */
  malade:{n:'on est infecté',d:'la fièvre ronge l\'endurance chaque jour jusqu\'au soin',
    test:()=>hasStatus(S,'infection')},
  empoisonne:{n:'on est empoisonné ou en sang',d:'une plaie qui court hors combat',
    test:()=>hasStatus(S,'poison')||hasStatus(S,'saignement')},
  recherche:{n:'la prime ici dépasse',u:' or',def:150,min:0,max:20000,
    d:'au-delà de cent vingt, des patrouilles te cherchent sur les routes',
    test:v=>primeIci()>=v},
  vehiculeuse:{n:'l\'attelage est usé sous',u:'%',def:35,min:5,max:100,
    d:'un essieu fendu ne va pas vite — et une épave ne va nulle part',
    test:v=>{const veh=vehicule();return !!veh&&veh.pv/vehDef().pv*100<v;}},
  potiondispo:{n:'on a une fiole de',u:'',liste:1,def:'soin',
    d:'la fiole choisie est en réserve',
    test:v=>(S.potions||[]).some(p=>p.e===v)},
  regionraclee:{n:'la région est épuisée pour de bon',
    d:'plus rien à tirer ici ni chez les voisines — il faut partir loin',
    test:()=>{
      /* la case courante RACLEE A FOND, pas seulement entamee : c'est ce qui
         distingue « passer a cote » de « quitter la region ». Un seuil sur les
         voisines ne se declenchait jamais — le personnage les vide une par une
         et n'en a jamais plusieurs de vidées en meme temps. */
      if(vide(here())<3)return false;
      let n=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(vide(cell(S.pos[0]+dx,S.pos[1]+dy))>=2)n++;
      return n>=1;}},
  aubordeleau:{n:'il y a de l\'eau ici',d:'de quoi pêcher, si le gel ne la prend pas',
    test:()=>!pecheBlocage()},
  froid:{n:'on souffre du froid ou du chaud',d:'le climat mord — un abri, un foyer, une fiole',
    test:()=>!!tempStress()},
};
const CONDK=Object.keys(CONDS);

/* ---------- les actions ---------- */
/* `peut` dit si l'action a un sens ici et maintenant ; `fais` l'engage.
   Une action qui ne peut pas se faire laisse la main à la consigne
   suivante — sinon une seule ligne mal placée gèlerait tout le plan. */
const ACTES={
  combattre:{n:'se battre',g:'戦',d:'chercher et engager ce qui passe',
    peut:()=>S.occ!=='combat'&&S.occ!=='donjon'&&!here().town,
    fais:()=>{S.occ='combat';}},
  rompre:{n:'rompre le combat',g:'走',d:'se dégager — sans pénalité, c\'est un repli voulu',
    peut:()=>S.occ==='combat'&&!!E,
    fais:()=>{disengage(true);}},
  recolter:{n:'récolter',g:'掘',d:'le plus dur que l\'outil permet ici',
    peut:()=>cellMats(here()).some(m=>canHarvest(m)&&stockOf(here(),m)>0),
    fais:()=>{const l=cellMats(here()).filter(m=>canHarvest(m)&&stockOf(here(),m)>0)
        .sort((a,b)=>MAT[b].d-MAT[a].d);
      if(l.length){S.target=l[0];S.occ='recolte';harvT=0;}}},
  /* « CHANGER DE CASE » ne regarde que les huit voisines. Sur soixante jours,
     l'instrument de partie longue l'a mesure : le personnage tournait dans un
     mouchoir de poche et ne rencontrait plus une seule espece nouvelle apres
     le premier mois. Un monde infini qu'on ne traverse pas est un monde fini.
     « S'eloigner » part droit devant, plusieurs cases d'un coup, vers ce qu'on
     n'a jamais vu — et change de direction quand la route se ferme. */
  seloigner:{n:`s'éloigner`,g:`遠`,d:`quitter la région pour de bon, plusieurs cases d'un coup`,
    peut:()=>!!consigneLoin(),
    fais:()=>{const t=consigneLoin();if(t){t.seen=true;travel(t.x,t.y);}}},
  pecher:{n:'pêcher',g:'漁',d:'l\'eau nourrit sans combat et sans territoire',
    peut:()=>!pecheBlocage()&&S.occ!=='peche',
    fais:()=>{S.occ='peche';E=null;pechT=0;}},
  explorer:{n:'explorer',g:'歩',d:'lever le voile autour de soi',
    peut:()=>S.occ!=='explore',
    fais:()=>{S.occ='explore';E=null;}},
  reposer:{n:'se reposer',g:'休',d:'reprendre souffle et vie',
    peut:()=>S.occ!=='repos',
    fais:()=>{S.occ='repos';E=null;}},
  dormir:{n:'dormir',g:'眠',d:'il faut un lit sur la cellule, et la nuit',
    peut:()=>S.occ!=='dormir'&&isNight()&&litIci(),
    fais:()=>{dormir(false);}},
  manger:{n:'manger',g:'厨',d:'un plat si la cuisine est là, sinon ce qu\'on a',
    peut:()=>S.faim<95&&(Object.keys(S.food).some(k=>S.food[k]>0)||S.vivres>0
      ||Object.keys(S.mat).some(m=>MAT[m]&&MAT[m].nutr&&!MAT[m].tox&&S.mat[m]>0)),
    fais:()=>{
      /* un plat vaut mieux que du cru : il rend aussi du potentiel */
      if(hasStation('cuisine')){
        const p={};Object.keys(S.food).forEach(k=>{const i=foodInfo(k);if(!p[i.el]&&S.food[k]>0)p[i.el]=k;});
        const c5=Object.values(p);
        if(c5.length>=3){cook(c5.slice(0,5));return;}
      }
      const f=Object.keys(S.food).find(k=>S.food[k]>0);
      if(f)return eatFood(f);
      if(S.vivres>0){S.vivres--;S.faim=Math.min(100,S.faim+28);return;}
      const m=Object.keys(S.mat).find(x=>MAT[x]&&MAT[x].nutr&&!MAT[x].tox&&S.mat[x]>0);
      if(m)eat(m);}},
  fondre:{n:'fondre le pire du sac',g:'熔',d:'ce qui ne vaut pas ce qu\'on porte',
    peut:()=>S.items.length>0,
    fais:()=>{autoScrap();}},
  ranger:{n:'ranger au coffre',g:'箱',d:'il faut un coffre sur la cellule',
    peut:()=>!!coffreOf()&&S.items.length>0,
    fais:()=>{rangerTout();}},
  auvillage:{n:'aller au village',g:'村',d:'le plus proche qu\'on connaisse',
    peut:()=>!!consigneVillage(),
    fais:()=>{const v=consigneVillage();if(v)travel(v.x,v.y);}},
  chezsoi:{n:'rentrer chez soi',g:'家',d:'la première cellule revendiquée',
    peut:()=>{const h=consigneBase();return !!h&&!(h.x===S.pos[0]&&h.y===S.pos[1]);},
    fais:()=>{const h=consigneBase();if(h)travel(h.x,h.y);}},
  ailleurs:{n:'changer de case',g:'発',d:'une voisine où il reste du gibier ou de la matière',
    peut:()=>!!consigneVoisine(),
    fais:()=>{const n=consigneVoisine();if(n){n.seen=true;travel(n.x,n.y);}}},
  /* Ce que le plan pouvait faire s'arretait a la boucle de 2024 : se battre,
     recolter, manger, dormir. Tout ce qui a ete bati depuis — l'alchimie,
     l'attelage, la part d'ombre — restait hors de sa portee, donc hors de
     portee d'un jeu qui se joue seul. */
  utiliser:{n:'se servir d\'un consommable',g:'具',d:'bandage, torche, ration — celui qui sert ici',
    peut:()=>CONSK.some(k=>consoDe(k)>0&&CONSO[k].utile()),
    fais:()=>{const k=CONSK.find(x=>consoDe(x)>0&&CONSO[x].utile());if(k)consoUser(k);}},
  fabriquer:{n:'faire des consommables',g:'工',d:'ce qu\'il manque, si les matières sont là',
    peut:()=>CONSK.some(k=>consoDe(k)<2&&!consoBlocage(k)),
    fais:()=>{const k=CONSK.find(x=>consoDe(x)<2&&!consoBlocage(x));if(k)consoFaire(k);}},
  boire:{n:'boire une fiole',g:'薬',d:'la plus utile parmi celles qu\'on porte',
    peut:()=>(S.potions||[]).some(p=>p.e&&potionUtile(p)),
    fais:()=>{const i=(S.potions||[]).findIndex(p=>p.e&&potionUtile(p));
      if(i>=0)drink(i);}},
  soigner:{n:'se soigner',g:'癒',d:'remède contre la fièvre, antipoison contre le sang',
    peut:()=>!!consigneRemede(),
    fais:()=>{const i=consigneRemede();if(i>=0)drink(i);}},
  distiller:{n:'distiller',g:'蒸',d:'une plante d\'alchimie, s\'il y a un alambic',
    peut:()=>hasStation('alambic')&&Object.keys(S.food||{}).some(k=>ALCHPLANTE[k]&&S.food[k]>0),
    fais:()=>{const k=Object.keys(S.food).find(x=>ALCHPLANTE[x]&&S.food[x]>0);
      if(k)distill([k]);}},
  copier:{n:'copier un manuel',g:'書',d:'au scriptorium, dans le domaine le plus pauvre',
    peut:()=>typeof CONSO==='object'&&!!CONSO.manuel&&!consoBlocage('manuel')
      &&lv('lecture')>=5&&(S.modules||[]).length>0&&(S.books||[]).length<6,
    fais:()=>{consoFaire('manuel');const i=CONSK.indexOf('manuel');if(i>=0)consoUser('manuel');}},
  reparer:{n:'réparer l\'attelage',g:'車',d:'il faut la station et le quart des matières',
    peut:()=>{const veh=vehicule();return !!veh&&veh.pv<vehDef().pv&&hasStation(vehDef().st);},
    fais:()=>{vehReparer();}},
  solder:{n:'solder sa prime',g:'赦',d:'le double de la prime, dans une ville du royaume',
    peut:()=>primeIci()>0&&!!townAt(S.pos[0],S.pos[1])&&S.or>=primeIci()*2,
    fais:()=>{primePayer();}},
  receler:{n:'écouler la marchandise',g:'闇',d:'ce qui est marqué, à moitié prix',
    peut:()=>receleurIci()&&objetsVoles().length>0,
    fais:()=>{recelerTout();}},
  vendre:{n:'vendre les matières',g:'市',d:'ce qui abonde, dans une ville ouverte',
    peut:()=>{const t=townAt(S.pos[0],S.pos[1]);
      return !!t&&shopsOpen(t)&&Object.keys(S.mat).some(m=>S.mat[m]>=40&&MAT[m].v<=40);},
    fais:()=>{const m=Object.keys(S.mat).filter(x=>S.mat[x]>=40&&MAT[x].v<=40)
        .sort((a,b)=>S.mat[b]-S.mat[a])[0];
      if(m)sellMat(m);}},
  sabri:{n:'se mettre à l\'abri',g:'庇',d:'rentrer là où un foyer tient le froid',
    peut:()=>{const h=consigneBase();return !!tempStress()&&!!h&&!(h.x===S.pos[0]&&h.y===S.pos[1]);},
    fais:()=>{const h=consigneBase();if(h)travel(h.x,h.y);}},
};
const ACTK=Object.keys(ACTES);

/* ---------- ce que les actions ont besoin de savoir ---------- */
/* Une fiole n'est utile que si ce qu'elle repare est casse : boire un remede
   quand on n'a pas la fievre, c'est jeter la fiole. Le plan ne gaspille pas. */
function potionUtile(p){
  if(!p||!p.e)return false;
  if(p.e==='soin')return S.hp<maxHp()*.6;
  if(p.e==='remede')return hasStatus(S,'infection');
  if(p.e==='antipoison')return hasStatus(S,'poison');
  if(p.e==='mana')return S.mana<maxMana()*.4;
  if(p.e==='sommeil')return S.end<40||S.mana<maxMana()*.4;
  if(p.e==='fraicheur'){const t=tempStress();return !!t&&!t.froid;}
  if(p.e==='resistance'){const t=tempStress();return !!t&&!!t.froid;}
  if(p.e==='poisonlame')return !S.lame&&(S.occ==='combat'||S.occ==='donjon');
  return false;
}
/* la fiole qui repare precisement ce qui est casse, sinon rien */
function consigneRemede(){
  const l=S.potions||[];
  if(hasStatus(S,'infection')){const i=l.findIndex(p=>p.e==='remede');if(i>=0)return i;}
  if(hasStatus(S,'poison')){const i=l.findIndex(p=>p.e==='antipoison');if(i>=0)return i;}
  return -1;
}
const consigneBase=()=>(S.claims&&S.claims.length)?S.world[S.claims[0]]:null;
function consigneVillage(){
  let best=null,bd=99;
  for(const k in S.world){
    const c=S.world[k];
    if(!c.seen||!townAt(c.x,c.y))continue;
    const d=Math.abs(c.x-S.pos[0])+Math.abs(c.y-S.pos[1]);
    if(d&&d<bd){bd=d;best=c;}
  }
  return best;
}
/* Une case a plusieurs pas, dans la direction la MOINS explorée. On garde le
   cap d'une fois sur l'autre — partir au hasard revient a tourner en rond un
   peu plus large — et l'on ne change que lorsque le devant se remplit. */
function consigneLoin(){
  const dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  /* combien de cases deja vues dans chaque direction, a portee de marche */
  const vu=d=>{let n=0;
    for(let k=2;k<=6;k++){const z=S.world[key(S.pos[0]+d[0]*k,S.pos[1]+d[1]*k)];if(z&&z.seen)n++;}
    return n;};
  let best=null,bn=99;
  dirs.forEach(d=>{const n=vu(d);if(n<bn){bn=n;best=d;}});
  if(!best)return null;
  S.cap=best;
  for(let n=5;n>=2;n--){
    const t=cell(S.pos[0]+best[0]*n,S.pos[1]+best[1]*n);
    if(t.poi!=='donjon'&&!t.town)return t;
  }
  return null;
}
function consigneVoisine(){
  const ici=here();
  let best=null,bs=-1;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const n=cell(S.pos[0]+dx,S.pos[1]+dy);
    if(n.poi==='donjon')continue;
    /* on cherche mieux qu'ici : plus de gibier, ou de la matière à prendre */
    const gib=4-vide(n);
    const mat=cellMats(n).filter(m=>canHarvest(m)&&stockOf(n,m)>0).length;
    const sc=gib*2+Math.min(6,mat);
    if(sc>bs){bs=sc;best=n;}
  }
  /* Un village n'est pas un terrain de chasse : on n'y combat pas, et sa
     case parait pourtant excellente puisque personne ne l'a videe. Un
     personnage qui y entrait n'en ressortait jamais. */
  const iciSc=ici.town?-1:
    (4-vide(ici))*2+Math.min(6,cellMats(ici).filter(m=>canHarvest(m)&&stockOf(ici,m)>0).length);
  return best&&bs>iciSc?best:null;
}

/* ---------- le plan ---------- */
/* La DERNIÈRE consigne doit être un vrai dernier recours, c'est-à-dire une
   action qui reste possible à peu près partout. « Se battre » n'en est pas
   une : elle est impossible dans un village, et un personnage entré en ville
   se figeait alors sans que rien ne le dise — plus aucune consigne ne
   s'appliquait. « Explorer » ferme donc le plan. */
function planDefaut(){
  return [
    /* Une fievre ou un poison passent AVANT la faim : ils courent hors
       combat, ils ne s'arretent pas d'eux-memes, et une fiole ne sert a
       rien dans un sac. C'est la premiere chose qu'un plan doit regarder. */
    {c:'malade',v:0,a:'soigner',on:true},
    {c:'empoisonne',v:0,a:'soigner',on:true},
    {c:'faimbasse',v:45,a:'manger',on:true},
    {c:'pvbas',v:40,a:'reposer',on:true},
    {c:'nuit',v:0,a:'dormir',on:true},
    {c:'sacplein',v:90,a:'fondre',on:true},
    /* Quand le gibier se fait rare, on s'ELOIGNE au lieu de passer a la case
       d'a cote. L'instrument de partie longue a mesure la difference : avec
       « changer de case », le personnage tournait dans un mouchoir de poche et
       ne rencontrait plus une seule espece nouvelle apres le premier mois.
       Un monde infini qu'on ne traverse pas est un monde fini. */
    /* LE PLAN DE BASE PASSE A LA CASE D'A COTE, et « s'eloigner » reste a
       la main du joueur. La mesure sur soixante jours tranche : passer a cote
       donne 128 mises a mort, 13 especes et un equipement qui progresse
       jusqu'au bout ; partir loin donne 75, 16 especes, et un equipement qui
       plafonne a mi-partie faute de butin. Pour un jeu qui tourne seul, le
       rythme de la boucle passe avant le tourisme — et un joueur qui veut
       voir du pays remplace cette ligne par « s'eloigner », qui existe
       precisement pour cela. Le choix lui revient, chiffres a l'appui. */
    {c:'gibierrare',v:0,a:'ailleurs',on:true},
    {c:'regionraclee',v:0,a:'seloigner',on:true},
    /* on ne se bat pas dans les rues : sans cette ligne, entrer dans un
       village suffisait a figer le plan. Eteins-la si tu veux y flaner. */
    {c:'enville',v:0,a:'ailleurs',on:true},
    {c:'toujours',v:0,a:'combattre',on:true},
    {c:'toujours',v:0,a:'explorer',on:true},
  ];
}
function plan(){
  S.plan=S.plan||{on:false,r:planDefaut()};
  if(!Array.isArray(S.plan.r))S.plan.r=planDefaut();
  return S.plan;
}
/* Une consigne valide : condition et action connues. Une sauvegarde d'une
   version où l'une d'elles n'existait pas ne doit pas bloquer le plan. */
const consigneOk=r=>!!(r&&CONDS[r.c]&&ACTES[r.a]);

/* Ce que le plan choisirait maintenant — le panneau s'en sert pour montrer
   la ligne active, et le tick pour l'appliquer. */
function planChoix(){
  const P=plan();
  if(!P.on)return null;
  for(const r of P.r){
    if(!r.on||!consigneOk(r))continue;
    let vrai=false;
    try{vrai=CONDS[r.c].test(r.v);}catch(e){continue;}
    if(!vrai)continue;
    let possible=false;
    try{possible=ACTES[r.a].peut();}catch(e){continue;}
    if(!possible)continue;
    return r;
  }
  return null;
}
/* On ne reconsidère pas à chaque image : une fois par seconde et demie,
   et jamais au milieu de ce qui a un début et une fin. */
let planT=0,planDerniere='';
function planTick(dt){
  const P=plan();
  if(!P.on||!S.race)return;
  planT+=dt;
  if(planT<1.5)return;
  planT=0;
  /* ce qui ne s'interrompt pas */
  if(S.occ==='atelier'||S.occ==='voyage'||S.occ==='dormir'||S.resume)return;
  const r=planChoix();
  if(!r){
    /* Le silence est le pire des retours : le personnage s'arrête et rien
       n'explique pourquoi. On le dit une fois, et l'on se tait ensuite
       jusqu'à ce que quelque chose reparte. */
    if(planDerniere!=='—'){planDerniere='—';
      log('<span class="bd">Aucune consigne ne s\'applique — le personnage attend. '
        +'Ajoute une ligne « toujours » à la fin de ton plan (自 VEILLE).</span>');}
    return;
  }
  const sig=r.c+':'+r.v+':'+r.a;
  try{ACTES[r.a].fais();}catch(e){return;}
  /* on n'inonde pas le journal : seuls les changements se disent */
  if(sig!==planDerniere){
    planDerniere=sig;
    log('<span class="in">Consigne : '+CONDS[r.c].n+(CONDS[r.c].u!==undefined?' '+r.v+CONDS[r.c].u:'')
      +' → '+ACTES[r.a].n+'</span>');
  }
}
/* ---------- édition ---------- */
function planAjouter(){const P=plan();if(P.r.length<12)P.r.push({c:'toujours',v:0,a:'reposer',on:true});}
function planRetirer(i){const P=plan();P.r.splice(i,1);}
function planMonter(i){const P=plan();if(i<=0)return;const t=P.r[i-1];P.r[i-1]=P.r[i];P.r[i]=t;}
function planDescendre(i){const P=plan();if(i>=P.r.length-1)return;const t=P.r[i+1];P.r[i+1]=P.r[i];P.r[i]=t;}
function planRegler(i,champ,val){
  const P=plan(),r=P.r[i];if(!r)return;
  if(champ==='c'){r.c=val;const C=CONDS[val];r.v=C&&C.def!==undefined?C.def:0;}
  else if(champ==='a')r.a=val;
  else if(champ==='v'){const C=CONDS[r.c];
    /* une condition qui porte sur un choix garde une CHAINE : l arrondir a
       zero effacerait le choix a la premiere edition */
    if(C&&C.liste){r.v=String(val);return;}
    let n=Math.round(+val||0);
    if(C&&C.min!==undefined)n=Math.max(C.min,Math.min(C.max,n));
    r.v=n;}
  else if(champ==='on')r.on=!r.on;
}
