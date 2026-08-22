/* Sensen Mini — 12-npc.js
   PNJ, relations à paliers, commerce
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== PNJ (7.1 / 7.2 / 12 / 14.5) ===== */
const JOBS={
  mineur:{n:'Mineur',sk:'minage'},bucheron:{n:'Bûcheron',sk:'bucheronnage'},
  fermier:{n:'Fermier',sk:'agriculture'},eleveur:{n:'Éleveur',sk:'dressage'},
  garde:{n:'Garde',sk:'epee'},vendeur:{n:'Marchand',sk:'negociation',wallet:300},
  forgeron:{n:'Forgeron',sk:'forge'},couturier:{n:'Couturier',sk:'tissage'},
  cuisinier:{n:'Cuisinier',sk:'cuisine'},herboriste:{n:'Herboriste',sk:'herboristerie'},
  /* il ne fabrique pas d'or : il porte ton surplus jusqu'a une ville connue
     et le vend au prix de cette ville, dans la limite de sa bourse */
  transporteur:{n:'Transporteur',sk:'athletisme'},
};
const JK=Object.keys(JOBS);
const LIKES=['les pierres polies','le vin doux','les histoires du sud','les outils bien faits','le silence',
  'les fruits secs','les vieilles chansons','les couteaux propres','la pluie','les chiens'];
const MOODW=['maussade','distant','neutre','avenant','chaleureux'];
const relTier=r=>r<0?0:r<20?1:r<50?2:r<75?3:r<90?4:5;
const TIERN=['inconnu','connaissance','familier','confident','proche','intime'];
function mkNpc(cellKey,age){
  const race=pick(['humain','humain','humain','elfe','nain','sylvide','cendreux','echomorphe']);
  const cult=pick(RACE[race].cult);
  const job=pick(JK);
  const a=age!==undefined?age:ri(17,Math.min(90,Math.round(RACE[race].life*.6)));
  /* un enfant n'a ni métier ni bourse : il apprend, et il grandira */
  const jeune=a<MAJORITE;
  return {id:'n'+(S.nid++),nom:cultName(cult),race,cult,job,
    age:a,
    sign:[ri(0,4),ri(0,11)],lv:jeune?1:ri(1,14),rel:0,mood:ri(45,85),
    cell:cellKey,or:jeune?0:(JOBS[job].wallet||30),orMax:jeune?12:(JOBS[job].wallet||30),
    likes:pick(LIKES),recipe:null,rec:false,talk:-1};
}
const MAJORITE=16;
const estEnfant=n=>n.age<MAJORITE;
function ensureNpcs(){
  const c=here();
  const t=townAt(c.x,c.y);
  if(t&&!t.abandonne&&!c.npcDone){
    c.npcDone=true;
    const k=key(c.x,c.y),n=Math.min(8,Math.max(2,Math.round(t.pop/3)));
    const kg=kingdomsNear().find(x=>x.id===t.k);
    const nes=[];
    for(let i=0;i<n;i++){const p=mkNpc(k);
      if(kg&&Math.random()<.9){p.race=kg.race;p.cult=pick(RACE[kg.race].cult);p.nom=cultName(p.cult);}
      p.ville=t.nom;S.npcs.push(p);nes.push(p);}
    linkFamilies(nes);
    return;
  }
  if(c.poi!=='village'||c.npcDone)return;
  c.npcDone=true;
  const k=key(c.x,c.y),n=ri(3,6);
  const nes=[];
  for(let i=0;i<n;i++){const p=mkNpc(k);S.npcs.push(p);nes.push(p);}
  linkFamilies(nes);
}
const npcsHere=()=>(isNight()||repTier(repLocale())===0)?[]:S.npcs.filter(n=>n.cell===key(S.pos[0],S.pos[1]));
const npcsAll=()=>S.npcs.filter(n=>n.cell===key(S.pos[0],S.pos[1]));
/* ce qu'on sait du PNJ : la fiche s'ouvre par paliers (7.2) */
function npcInfo(n){
  const t=relTier(n.rel),o=[];
  if(t===0){o.push('une silhouette — il ne se confie pas');return o;}
  o.push(n.nom+' · '+RACE[n.race].n+' · '+npcRole(n));
  if(t>=2)o.push(n.age+' ans · signe '+EL[n.sign[0]].g+ANIMALS[n.sign[1]].g+' · '+MOODW[Math.min(4,Math.floor(n.mood/21))]);
  if(t>=2){const f=famTxt(n);if(f)o.push(f);}
  if(t>=3)o.push(estEnfant(n)?'trop jeune pour un métier — il apprend en regardant'
    :'niveau approximatif '+n.lv+' · '+SKILLS[JOBS[n.job].sk].n+' est son métier');
  if(t>=4)o.push('aime '+n.likes+(n.recipe?' · t\'a enseigné : '+n.recipe:' · prêt à enseigner un tour de main'));
  if(t>=5)o.push('te doit une faveur personnelle');
  return o;
}
/* ce qu'il sait du monde : filtré par métier autant que par palier */
function npcKnows(n){
  const t=relTier(n.rel);
  if(t<2)return null;
  const j=n.job;
  if(t>=2){
    if(j==='vendeur')return 'Les prix montent quand la réputation baisse : ici, ton facteur est ×'+repFactor().toFixed(2)+'.';
    if(j==='mineur'||j==='forgeron')return 'La roche durcit avec la profondeur — sans outil à la hauteur, elle rebondit.';
    if(j==='garde')return 'La corruption locale est de '+here().corr+'. Nettoie les foyers, elle reflue.';
    return 'Le pays alentour : '+BIOME[here().b].n+', fertilité '+BIOME[here().b].fert+'.';
  }
  return null;
}
const repFactor=()=>Math.max(.5,Math.min(2,(1+repLocale()/200)/repMulPrix()));
/* compatibilité astrologique : un modificateur de VITESSE, jamais un seuil */
function astroMul(n){
  if(!S.born)return 1;
  const tr=TRINE.find(t=>t.includes(S.born[1]));
  if(tr&&tr.includes(n.sign[1])&&n.sign[1]!==S.born[1])return 1.25;
  if((n.sign[1]+6)%12===S.born[1])return .8;
  return 1;
}
function giftCost(n){return Math.max(12,Math.round(n.lv*8*(1+n.rel/35)*repFactor()));}
function giveGift(n){
  const c=giftCost(n);
  if(S.or<c)return toast('Il te faut '+c+' or');
  S.or-=c;
  let g=(5+lv('negociation')*.25+st('cha')*.5)*astroMul(n)*repMulRelation();
  n.rel=Math.min(100,n.rel+g);
  n.mood=Math.min(100,n.mood+2);
  gainXp('negociation',18);
  gainRep(.6,n.race,kingdomHere());
  const t=relTier(n.rel);
  if(t>=4&&!n.recipe)teachRecipe(n);
  log(n.nom+' accepte le présent — relation '+Math.round(n.rel)+' ('+TIERN[t]+')');
}
/* ===== DIALOGUE (E.23) : un menu contextuel, pas un arbre =====
   La réplique d'ambiance sort d'un pool de gabarits à conditions (métier,
   humeur, heure, météo à venir, réputation, relation, événements récents),
   tirage pondéré et anti-répétition. La profondeur vient des conditions. */
const DIAL=[
  /* réputation et relation */
  {id:'hostile',w:5,c:n=>repTier(repLocale())<=1,t:n=>pick(['Passe ton chemin.','On sait qui tu es. Fais vite.','Je n\'ai rien à te dire.'])},
  {id:'honore',w:3,c:n=>repTier(repLocale())>=4,t:n=>pick(['C\'est un honneur. Tout le village parle de toi.','Si tu as besoin de quoi que ce soit…','Les enfants veulent savoir si tu as vraiment vidé la faille.'])},
  {id:'intime',w:4,c:n=>relTier(n.rel)>=4,t:n=>pick(['Entre, tu es chez toi.','Je gardais ça pour toi.','Tu sais que tu peux compter sur moi.'])},
  {id:'inconnu',w:2,c:n=>relTier(n.rel)<=1,t:n=>pick(['On ne se connaît pas, je crois.','Encore un voyageur.','Hm.'])},
  /* humeur */
  {id:'maussade',w:3,c:n=>n.mood<35,t:n=>pick(['Mauvaise journée. Ne me demande pas.','Tout va de travers en ce moment.','Laisse-moi.'])},
  {id:'chaleureux',w:3,c:n=>n.mood>80,t:n=>pick(['Quelle belle journée !','Je ne me suis jamais senti aussi bien.','Viens, assieds-toi.'])},
  /* heure et météo */
  {id:'aube',w:2,c:n=>phase()==='aube',t:n=>pick(['Tu es matinal.','Le jour se lève à peine et tu es déjà là.'])},
  {id:'crepuscule',w:2,c:n=>phase()==='crépuscule',t:n=>pick(['Rentre avant la nuit, les bêtes sortent.','Le soir tombe. On ferme bientôt.'])},
  {id:'extreme',w:6,c:n=>METEO[meteo(here(),S.day+1)].extreme,t:n=>'Le ciel se prépare : '+METEO[meteo(here(),S.day+1)].n.toLowerCase()+' demain. Abrite-toi.'},
  {id:'pluie',w:2,c:n=>['pluie','orage'].includes(meteo(here())),t:n=>pick(['Cette pluie fait du bien aux champs.','Encore un jour de pluie.'])},
  {id:'froid',w:3,c:n=>tempC(here())<3,t:n=>pick(['Quel froid. Couvre-toi.','Par ce froid, un foyer vaut de l\'or.'])},
  {id:'hiver',w:2,c:n=>seasonIdx()===3,t:n=>pick(['Rien ne pousse l\'hiver. On vit sur les réserves.','Encore deux lunes et le printemps.'])},
  /* lieu et monde */
  {id:'corr',w:3,c:n=>here().corr>60,t:n=>pick(['La corruption monte. On entend des choses, la nuit.','Personne ne va plus vers les ruines.'])},
  {id:'calme',w:2,c:n=>here().cleared>=3,t:n=>pick(['Depuis que tu nettoies les environs, on dort mieux.','Les routes sont plus sûres qu\'avant.'])},
  {id:'vacance',w:5,c:n=>{const k=kingdomAt(S.pos[0],S.pos[1]);return k&&k.transition>0;},t:n=>pick(['Le trône est vide. Tout le monde retient son souffle.','Sans souverain, les gardes font ce qu\'ils veulent.'])},
  {id:'loi',w:2,c:n=>lawsHere().laws.length>0,t:n=>'Ici, '+pick(lawsHere().laws).txt+' est interdit. Je dis ça pour toi.'},
  /* métiers */
  {id:'forgeron',w:3,c:n=>n.job==='forgeron',t:n=>pick(['Le fer chante quand il est bien chauffé.','Un bon lingot, c\'est la moitié de la lame.','Apporte-moi de l\'argent et je te montrerai quelque chose.'])},
  {id:'mineur',w:3,c:n=>n.job==='mineur',t:n=>pick(['Plus on creuse, plus la roche durcit. Et plus elle paie.','Sous le calcaire, il y a de la pierre. Sous la pierre, le basalte.'])},
  {id:'vendeur',w:3,c:n=>n.job==='vendeur',t:n=>pick(['Les prix, c\'est la réputation qui les fait.','Ma bourse se vide vite. Reviens la semaine prochaine.'])},
  {id:'garde',w:3,c:n=>n.job==='garde',t:n=>pick(['Pas de grabuge.','La nuit, on double les rondes.'])},
  {id:'fermier',w:3,c:n=>n.job==='fermier',t:n=>pick(['Ici la terre est '+(BIOME[here().b].fert>.7?'généreuse':'ingrate')+'.','Deux graines, un champ, une semaine : c\'est tout le secret.'])},
  {id:'cuisinier',w:3,c:n=>n.job==='cuisinier',t:n=>pick(['Cinq éléments dans l\'assiette, et le corps s\'en souvient.','La viande du marécage a un goût de fer.'])},
  {id:'herboriste',w:3,c:n=>n.job==='herboriste',t:n=>pick(['Les herbes se cueillent à l\'aube.','Un œil de bête et trois herbes : de quoi voir la nuit.'])},
  {id:'bucheron',w:3,c:n=>n.job==='bucheron',t:n=>pick(['Le chêne, c\'est le manche. L\'ébène, c\'est le luxe.','On ne coupe pas une forêt de mana sans y laisser quelque chose.'])},
  {id:'eleveur',w:3,c:n=>n.job==='eleveur',t:n=>pick(['Une bête apprivoisée mange autant qu\'un homme.','Mets-les dans un enclos, elles te le rendront.'])},
  {id:'transporteur',w:3,c:n=>n.job==='transporteur',t:n=>pick(['Une heure par cellule, à pied. Les routes aident.','J\'ai vu des royaumes que tu n\'imagines pas.'])},
  {id:'couturier',w:3,c:n=>n.job==='couturier',t:n=>pick(['Le lin respire, la laine tient chaud.','La soie, c\'est la forêt de mana qui la donne.'])},
  /* générique */
  {id:'poli',w:1,c:n=>true,t:n=>pick(['Bonne journée.','Que les cinq te gardent.','On fait aller.','Tu as vu le ciel, ce matin ?'])},
];
/* rumeur : à partir de « familier », un PNJ révèle parfois un lieu proche encore inconnu */
function rumeur(n){
  if(relTier(n.rel)<2||n.rumW===S.week||Math.random()>.25)return null;
  let best=null,bd=99;
  for(let dx=-6;dx<=6;dx++)for(let dy=-6;dy<=6;dy++){const c=cell(S.pos[0]+dx,S.pos[1]+dy);
    if(c.seen||!c.poi)continue;const d=Math.abs(dx)+Math.abs(dy);if(d<bd){bd=d;best=c;}}
  if(!best)return null;
  best.seen=true;n.rumW=S.week;
  const ns=best.y<S.pos[1]?'nord':best.y>S.pos[1]?'sud':'',eo=best.x>S.pos[0]?'est':best.x<S.pos[0]?'ouest':'';
  const dir=ns&&eo?'au '+ns+'-'+eo:ns?'au '+ns:'à l\''+eo;
  return 'On dit qu\'il y a '+(best.poi==='village'?'un village':best.poi==='donjon'?'une ruine qu\'on évite':best.poi==='camp'?'un camp de maraudeurs':best.poi==='sanctuaire'?'un vieil autel':'un filon')+' '+dir+', à '+bd+' cellule'+(bd>1?'s':'')+'. — '+POI[best.poi].n+' révélé sur la carte.';
}
function talkTo(n){
  const day=Math.floor(S.day);
  if(n.talk===day)return toast('Vous avez déjà parlé aujourd\'hui');
  n.talk=day;
  const g=(1.2+st('cha')*.15)*astroMul(n)*(d20()+st('cha')/2>=14?1.5:1);   /* jet de Charisme pour bonus */
  n.rel=Math.min(100,n.rel+g);
  gainXp('negociation',5);
  gainStat('cha',g*30);                      /* le Charisme se travaille en parlant */
  n.said=n.said||[];
  let pool=DIAL.filter(d=>!n.said.includes(d.id)&&d.c(n));
  if(!pool.length)pool=DIAL.filter(d=>d.c(n));            /* plutôt se répéter que se taire */
  const tot=pool.reduce((a,d)=>a+d.w,0);let r=Math.random()*tot,d=pool[0];
  for(const x of pool){r-=x.w;if(r<=0){d=x;break;}}
  if(d){n.said.push(d.id);if(n.said.length>3)n.said.shift();}
  const k=npcKnows(n),ru=rumeur(n);
  log('<b>'+n.nom+'</b> : « '+(d?d.t(n):'…')+' »'+(ru?' '+ru:k&&Math.random()<.5?' '+k:''));
}
/* entraîneur (A.1 / 6.4) : 20 or × niveau actuel → +10 de potentiel dans la compétence de son métier.
   Un PNJ ne forme que qui il connaît un peu, et jamais au-delà de ce qu'il sait lui-même. */
const trainSkill=n=>JOBS[n.job].sk;
const trainCost=n=>Math.max(20,20*lv(trainSkill(n)))*(repMulPrix()||1)|0;
function trainWith(n){
  if(relTier(n.rel)<1)return toast('Il ne te connaît pas assez pour t\'apprendre quoi que ce soit');
  const sk=trainSkill(n);
  if(lv(sk)>=n.lv+5)return toast(n.nom+' n\'a plus rien à t\'apprendre en '+SKILLS[sk].n);
  const c=trainCost(n);
  if(S.or<c)return toast('Il faut '+c+' or');
  if(S.sk[sk].pot>=200)return toast('Potentiel déjà au maximum');
  S.or-=c;n.or=Math.min(n.orMax*2,n.or+c);
  S.sk[sk].pot=Math.min(200,S.sk[sk].pot+10);
  n.rel=Math.min(100,n.rel+1);
  gainXp(sk,c*.5);
  log(n.nom+' t\'entraîne : '+SKILLS[sk].n+' — potentiel '+Math.round(S.sk[sk].pot)+' (−'+c+' or)');
}
/* 75+ : l'artisan enseigne une recette exotique — 3e source du craft (4.2.1) */
function teachRecipe(n){
  const compsFor=m=>Object.keys(COMP).filter(ct=>COMP[ct].raw.includes(m)
    ||COMP[ct].forms.some(f=>f!=='brut'&&FORM[f]&&formOk(f,m)));
  const exotic=Object.keys(MAT).filter(m=>!BASEMAT.includes(m)&&compsFor(m).length
    &&!Object.keys(S.recipes).some(r=>r.endsWith(':'+m)));
  if(!exotic.length)return;
  const mk2=pick(exotic);
  const ct=pick(compsFor(mk2));
  n.recipe=COMP[ct].n+' en '+matName(mk2);
  learnRecipe(ct,mk2);
}
/* ===== COMMERCE (7.1 / A.8 / A.8.1) ===== */
function buyerHere(){
  const t=townAt(S.pos[0],S.pos[1]);
  if(t&&!t.abandonne&&!isNight()&&repTier(repLocale())>0)
    return {nom:'le marché de '+t.nom,get or(){return t.or;},set or(v){t.or=v;},ville:t};
  return npcsHere().filter(n=>relTier(n.rel)>=1||n.job==='vendeur')
    .sort((a,b)=>b.or-a.or)[0]||npcsHere()[0];}
function priceMat(k,n){
  const t=townAt(S.pos[0],S.pos[1]),kg=kingdomAt(S.pos[0],S.pos[1]);
  return Math.round(MAT[k].v*n*repFactor()*prixContrebande(k)
    *(t?townPrice(t,k):1)*douane(kg,k)*(1+lv('negociation')*.008));}
/* ===== LE TROC (A.8.1 / 7.6) =====
   « Un marchand à sec REFUSE d'acheter en or au-delà de son stock — il
   propose un troc en objets de valeur équivalente plutôt qu'un refus
   sec : le débouché est préservé. » Un village n'a pas d'or infini, mais
   il a toujours des vivres — et des vivres nourrissent un royaume.
   Le troc a lui aussi sa limite hebdomadaire : ce que la ville produit. */
const TROC_OR=6;                                  /* un vivre vaut six pièces (cf. l'épicier) */
function trocReste(t){
  if(t.trocSem!==S.week){t.trocSem=S.week;t.trocRest=Math.max(5,Math.round(t.pop*4*t.prosp));}
  return t.trocRest;
}
function trocMat(b,k){
  const t=b.ville;
  const dispo=t?trocReste(t):0;
  if(dispo<1)return toast(b.nom+' est à sec et n\'a plus de vivres à échanger — une autre ville, ou la semaine prochaine');
  const parU=Math.max(1,priceMat(k,1));
  const u=Math.min(S.mat[k]||0,Math.floor(dispo*TROC_OR/parU));
  const v=Math.min(dispo,Math.floor(priceMat(k,u)/TROC_OR));
  if(u<1||v<1)return toast(b.nom+' est à sec, et le troc ne couvre pas si peu');
  S.mat[k]-=u;if(!S.mat[k])delete S.mat[k];
  S.vivres=(S.vivres||0)+v;t.trocRest-=v;
  gainXp('negociation',v*2);
  log(b.nom+' n\'a plus d\'or — troc : '+u+' × '+matName(k)+' contre <b>'+v+' vivres</b> ('+(dispo-v)+' encore échangeables cette semaine)');
}
function sellMat(k){
  const n=S.mat[k]||0;if(!n)return;
  const b=buyerHere();if(!b)return toast('Personne pour acheter ici');
  ctx2=k;if(controle('vente'))return;
  const prix=priceMat(k,n);
  if(b.or<prix){
    /* portefeuille fini : il prend ce qu'il peut payer, le reste passe au troc */
    const part=Math.floor(b.or/Math.max(1,priceMat(k,1)));
    if(part<1)return trocMat(b,k);
    const p2=Math.min(Math.round(b.or),priceMat(k,part));
    b.or-=p2;S.or+=p2;S.mat[k]-=part;if(!S.mat[k])delete S.mat[k];
    gainXp('negociation',p2/3);
    return log(b.nom+' n\'a plus que '+Math.round(b.or)+' or — il prend '+part+' × '+matName(k)+' pour '+p2+' or');
  }
  b.or-=prix;S.or+=prix;delete S.mat[k];
  gainXp('negociation',prix/3);
  log('Vendu '+n+' × '+matName(k)+' à '+b.nom+' — +'+prix+' or');
}
function sellItem(i){
  const it=S.items[i];if(!it)return;
  const b=buyerHere();if(!b)return toast('Personne pour acheter ici');
  /* C'est ce qui rend le vol couteux meme quand il reussit : on ne revend
     pas au grand jour ce qu'on a pris. Il faut un receleur, et il donne la
     moitie. */
  if(refuseVole(it))return toast(it.nom+' est trop reconnaissable — il faut un receleur (un camp, ou une ville où l\'on te regarde de travers)');
  const prix=Math.round(itemValue(it)*repFactor());
  if(b.or<prix){
    const paye=Math.floor(b.or*.9);
    const t=b.ville,dispo=t?trocReste(t):0;
    /* ce qu'il ne peut payer, il l'échange en vivres — jusqu'à ce que la ville n'en ait plus */
    const v=Math.min(dispo,Math.floor((prix-paye)/TROC_OR));
    if(paye<1&&v<1)return toast(b.nom+' est à sec, et n\'a plus rien à échanger cette semaine');
    b.or-=paye;S.or+=paye;S.items.splice(i,1);
    if(v>0){S.vivres=(S.vivres||0)+v;t.trocRest-=v;}
    gainXp('negociation',prix/4);
    return log(b.nom+' complète en nature : '+paye+' or'+(v?' et '+v+' vivres':'')+' pour '+it.nom);
  }
  b.or-=prix;S.or+=prix;S.items.splice(i,1);
  gainXp('negociation',prix/3);
  log('Vendu '+it.nom+' à '+b.nom+' — +'+prix+' or');
}
function recruit(n){
  if(estEnfant(n))return toast('On n\'emmène pas un enfant à l\'aventure');
  if(n.rel<50)return toast('Relation insuffisante ('+Math.round(n.rel)+'/50)');
  n.rec=true;
  if(!S.comps.some(c=>c.src===n.id))S.comps.push(compFromNpc(n));
  gainXp('leadership',60);
  cutIn('従',n.nom+' te suit',npcRole(n)+' · niveau '+n.lv);
}
