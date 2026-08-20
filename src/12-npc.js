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
  transporteur:{n:'Transporteur',sk:'athletisme'},
};
const JK=Object.keys(JOBS);
const LIKES=['les pierres polies','le vin doux','les histoires du sud','les outils bien faits','le silence',
  'les fruits secs','les vieilles chansons','les couteaux propres','la pluie','les chiens'];
const MOODW=['maussade','distant','neutre','avenant','chaleureux'];
const relTier=r=>r<0?0:r<20?1:r<50?2:r<75?3:r<90?4:5;
const TIERN=['inconnu','connaissance','familier','confident','proche','intime'];
function mkNpc(cellKey){
  const race=pick(['humain','humain','humain','elfe','nain','sylvide','cendreux','echomorphe']);
  const cult=pick(RACE[race].cult);
  const job=pick(JK);
  return {id:'n'+(S.nid++),nom:cultName(cult),race,cult,job,
    age:ri(17,Math.min(90,Math.round(RACE[race].life*.6))),
    sign:[ri(0,4),ri(0,11)],lv:ri(1,14),rel:0,mood:ri(45,85),
    cell:cellKey,or:JOBS[job].wallet||30,orMax:JOBS[job].wallet||30,
    likes:pick(LIKES),recipe:null,rec:false,talk:-1};
}
function ensureNpcs(){
  const c=here();
  const t=townAt(c.x,c.y);
  if(t&&!t.abandonne&&!c.npcDone){
    c.npcDone=true;
    const k=key(c.x,c.y),n=Math.min(8,Math.max(2,Math.round(t.pop/3)));
    const kg=kingdomsNear().find(x=>x.id===t.k);
    for(let i=0;i<n;i++){const p=mkNpc(k);
      if(kg&&Math.random()<.9){p.race=kg.race;p.cult=pick(RACE[kg.race].cult);p.nom=cultName(p.cult);}
      p.ville=t.nom;S.npcs.push(p);}
    return;
  }
  if(c.poi!=='village'||c.npcDone)return;
  c.npcDone=true;
  const k=key(c.x,c.y),n=ri(3,6);
  for(let i=0;i<n;i++)S.npcs.push(mkNpc(k));
}
const npcsHere=()=>(isNight()||repTier(repLocale())===0)?[]:S.npcs.filter(n=>n.cell===key(S.pos[0],S.pos[1]));
const npcsAll=()=>S.npcs.filter(n=>n.cell===key(S.pos[0],S.pos[1]));
/* ce qu'on sait du PNJ : la fiche s'ouvre par paliers (7.2) */
function npcInfo(n){
  const t=relTier(n.rel),o=[];
  if(t===0){o.push('une silhouette — il ne se confie pas');return o;}
  o.push(n.nom+' · '+RACE[n.race].n+' · '+JOBS[n.job].n);
  if(t>=2)o.push(n.age+' ans · signe '+EL[n.sign[0]].g+ANIMALS[n.sign[1]].g+' · '+MOODW[Math.min(4,Math.floor(n.mood/21))]);
  if(t>=3)o.push('niveau approximatif '+n.lv+' · '+SKILLS[JOBS[n.job].sk].n+' est son métier');
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
function talkTo(n){
  const day=Math.floor(S.day);
  if(n.talk===day)return toast('Vous avez déjà parlé aujourd\'hui');
  n.talk=day;
  const g=(1.2+st('cha')*.15)*astroMul(n);
  n.rel=Math.min(100,n.rel+g);
  gainXp('negociation',5);
  const k=npcKnows(n);
  log(n.nom+' : '+(k||'quelques mots polis.'));
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
function sellMat(k){
  const n=S.mat[k]||0;if(!n)return;
  const b=buyerHere();if(!b)return toast('Personne pour acheter ici');
  ctx2=k;if(controle('vente'))return;
  const prix=priceMat(k,n);
  if(b.or<prix){
    /* portefeuille fini : troc automatique plutôt que refus sec */
    const part=Math.floor(b.or/Math.max(1,priceMat(k,1)));
    if(part<1)return toast(b.nom+' est à sec');
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
  const prix=Math.round(itemValue(it)*repFactor());
  if(b.or<prix){
    const troc=Math.floor(b.or*.9);
    if(troc<1)return toast(b.nom+' est à sec');
    b.or-=troc;S.or+=troc;S.items.splice(i,1);
    gainXp('negociation',prix/4);
    return log(b.nom+' propose un troc : '+troc+' or pour '+it.nom);
  }
  b.or-=prix;S.or+=prix;S.items.splice(i,1);
  gainXp('negociation',prix/3);
  log('Vendu '+it.nom+' à '+b.nom+' — +'+prix+' or');
}
function recruit(n){
  if(n.rel<50)return toast('Relation insuffisante ('+Math.round(n.rel)+'/50)');
  n.rec=true;
  if(!S.comps.some(c=>c.src===n.id))S.comps.push(compFromNpc(n));
  gainXp('leadership',60);
  cutIn('従',n.nom+' te suit',JOBS[n.job].n+' · niveau '+n.lv);
}
