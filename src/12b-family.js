/* Sensen Mini — 12b-family.js
   Familles, générations, deuil et héritage (12.2 / 12.3 / E.25)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Les liens de famille ne sont pas décoratifs : ils pilotent la
   succession et la démographie. Un village se peuple de couples et
   d'enfants ; quand quelqu'un meurt, le conjoint porte le deuil, les
   enfants héritent de la bourse, et un rôle vacant se transmet selon
   la règle de sa structure — héritier, ou suivant dans la hiérarchie.
   ================================================================== */
const npcById=id=>S.npcs.find(n=>n.id===id)||null;
/* ce qu'on annonce d'un PNJ : un mineur n'a pas de métier, il a un âge */
const npcRole=n=>estEnfant(n)?(n.age<2?'nourrisson':'enfant'):JOBS[n.job].n;
/* un enfant ne porte pas le nom de son père : on retire jusqu'à trouver autre chose */
function nomDistinct(cult,pris){
  for(let i=0;i<12;i++){const nm=cultName(cult);if(!pris.includes(nm))return nm;}
  return cultName(cult)+' le Jeune';
}
function famInit(n){n.fam=n.fam||{conjoint:null,parents:[],enfants:[]};return n.fam;}
/* marier deux PNJ : même cellule, âges proches, pas déjà mariés */
function marier(a,b){
  famInit(a);famInit(b);
  if(a.fam.conjoint||b.fam.conjoint||a===b)return false;
  a.fam.conjoint=b.id;b.fam.conjoint=a.id;
  return true;
}
function filier(enfant,p1,p2){
  famInit(enfant);
  [p1,p2].forEach(p=>{if(!p)return;famInit(p);
    if(!enfant.fam.parents.includes(p.id))enfant.fam.parents.push(p.id);
    if(!p.fam.enfants.includes(enfant.id))p.fam.enfants.push(enfant.id);});
}
/* nouer les familles d'un village fraîchement peuplé, et lui donner ses enfants */
function linkFamilies(list){
  const libres=melange(list.filter(n=>n.age>=20));
  const couples=[];
  for(let i=0;i+1<libres.length;i+=2){
    if(Math.random()<.7&&Math.abs(libres[i].age-libres[i+1].age)<25&&marier(libres[i],libres[i+1]))
      couples.push([libres[i],libres[i+1]]);
  }
  /* les jeunes déjà présents rejoignent un foyer, puis les couples ont leurs propres enfants */
  list.filter(n=>n.age<24&&!(n.fam&&n.fam.parents.length)).forEach(j=>{
    const c=couples.find(p=>p[0].age-j.age>=17&&p[1].age-j.age>=15);
    if(c)filier(j,c[0],c[1]);
  });
  couples.forEach(([a,b])=>{
    const plus=Math.min(a.age,b.age)-17;
    if(plus<2)return;
    const n=Math.random()<.62?ri(1,2):0;
    for(let i=0;i<n;i++){
      const bb=mkNpc(a.cell,ri(1,Math.min(16,plus)));
      bb.race=a.race;bb.cult=a.cult;bb.ville=a.ville;
      bb.nom=nomDistinct(bb.cult,S.npcs.filter(x=>x.cell===a.cell).map(x=>x.nom));
      S.npcs.push(bb);filier(bb,a,b);
    }
  });
}
/* la parenté, en clair */
function famTxt(n){
  if(!n.fam)return '';
  const o=[];
  const c=n.fam.conjoint&&npcById(n.fam.conjoint);
  if(c)o.push((n.veuf?'veuf de ':'marié à ')+c.nom);
  else if(n.veuf)o.push('veuf');
  const enf=(n.fam.enfants||[]).map(npcById).filter(Boolean);
  if(enf.length)o.push(enf.length+' enfant'+(enf.length>1?'s':'')+' : '+enf.map(e=>e.nom+' ('+e.age+')').join(', '));
  const par=(n.fam.parents||[]).map(npcById).filter(Boolean);
  if(par.length)o.push('enfant de '+par.map(p=>p.nom).join(' et '));
  return o.join(' · ');
}
/* la mort d'un PNJ : deuil du conjoint, héritage aux enfants, la place se libère */
function npcDeath(n,cause){
  n.dead=1;
  const c=n.fam&&n.fam.conjoint&&npcById(n.fam.conjoint);
  if(c){c.veuf=1;c.mood=Math.max(10,c.mood-25);c.fam.conjoint=null;}
  const enf=(n.fam&&n.fam.enfants||[]).map(npcById).filter(Boolean);
  if(enf.length&&n.or>0){
    const part=Math.round(n.or/enf.length);
    enf.forEach(e=>{e.or=Math.min(e.orMax*2,e.or+part);e.mood=Math.max(10,e.mood-15);});
  }
  /* un compagnon recruté qui meurt de vieillesse s'en va aussi de l'escorte */
  const co=S.comps.find(x=>x.src===n.id);
  if(co&&!co.dead){co.dead=1;co.esc=false;}
  return n.nom+(cause?' — '+cause:'')+(c?', '+c.nom+' reste seul'+(c.race==='elfe'||c.race==='sylvide'?'e':''):'');
}
/* passage hebdomadaire : vieillesse, naissances, deuils (12.2 / E.25) */
function weeklyFamilies(r){
  if(!S.npcs.length)return;
  const morts=[];
  /* une année in-game tous les 17 passages : on vieillit */
  if(S.week%17===0){
    S.npcs.forEach(n=>{
      n.age++;
      const life=RACE[n.race].life;
      if(n.age>life*(1+ri(-15,15)/100)&&Math.random()<.3)morts.push(npcDeath(n,'mort de vieillesse'));
    });
  }
  /* naissances : un couple logé, dans une ville qui a de la place */
  const couples=S.npcs.filter(n=>!n.dead&&n.fam&&n.fam.conjoint&&n.age>=20&&n.age<RACE[n.race].life*.7
    &&npcById(n.fam.conjoint)&&!npcById(n.fam.conjoint).dead&&n.id<npcById(n.fam.conjoint).id);
  couples.forEach(p=>{
    if(Math.random()>.05)return;
    const conj=npcById(p.fam.conjoint);
    const t=S.npcs.filter(n=>!n.dead&&n.cell===p.cell).length;
    if(t>=12)return;
    const bb=mkNpc(p.cell,0);
    bb.rel=Math.round(((p.rel||0)+(conj.rel||0))/4);
    bb.race=p.race;bb.cult=p.cult;bb.ville=p.ville;
    bb.nom=nomDistinct(bb.cult,S.npcs.filter(x=>x.cell===p.cell).map(x=>x.nom));
    S.npcs.push(bb);filier(bb,p,conj);
    r.push('<span class="gd">'+bb.nom+' naît chez '+p.nom+' et '+conj.nom+'</span>');
  });
  /* les enfants grandissent : à la majorité, ils prennent un métier et une bourse */
  S.npcs.forEach(n=>{
    if(n.age!==MAJORITE||n.majeur)return;
    n.majeur=1;n.lv=ri(1,5);
    n.or=n.orMax=JOBS[n.job].wallet||30;
    r.push(n.nom+' entre dans l\'âge adulte — '+JOBS[n.job].n);
  });
  if(morts.length){
    r.push('<span class="bd">'+morts.slice(0,3).join(' · ')+'</span>');
    S.npcs=S.npcs.filter(n=>!n.dead);
  }
}
/* la cour d'un royaume, en une ligne — trône vide compris */
function rulerTxt(k){
  if(GOV[k.gov]&&k.gov==='anarchie')return 'aucun souverain — l\'anarchie n\'en veut pas';
  const R=k.ruler;
  if(!R){
    const p=k.pretendant;
    return '<b style="color:var(--zhu)">trône vacant</b>'+(k.transition>0?' — '+k.transition+' semaine'+(k.transition>1?'s':''):'')
      +(p?' · '+p.nom+', '+p.age+' ans, attend le couronnement':' · aucun héritier désigné');
  }
  const enf=(R.enfants||[]).filter(e=>e.age>=14);
  return R.titre+' '+R.nom+' ('+R.age+' ans)'
    +(R.conjoint?', épouse '+R.conjoint:'')
    +(R.heir?' · héritier : '+R.heir+(enf.length>1?' et '+(enf.length-1)+' autre'+(enf.length>2?'s':''):''):' · <b>sans héritier majeur</b>')
    +((R.enfants||[]).length&&!R.heir?' ('+R.enfants.length+' enfant'+(R.enfants.length>1?'s':'')+' trop jeune'+(R.enfants.length>1?'s':'')+')':'');
}
/* ===== SUCCESSION DES RÔLES (12.3) =====
   `heir` : l'aîné des enfants. `next_in_rank` : le mieux placé restant.
   Sans candidat, la vacance dure — et une conquête y trouve son heure. */
const SUCC={monarchie:'heir',theocratie:'next',republique:'next',ploutocratie:'next',dictature:'next',anarchie:null};
function rulerHeir(k){
  const R=k.ruler;
  if(!R||!R.enfants||!R.enfants.length)return null;
  const majeurs=R.enfants.filter(e=>e.age>=14).sort((a,b)=>b.age-a.age);
  return majeurs[0]||null;
}
/* la mort du souverain ouvre la transition (E.25 : 4 semaines pour un royaume) */
function rulerDies(k,r){
  const R=k.ruler,regle=SUCC[k.gov];
  if(!R)return;
  if(!regle){k.ruler=null;return;}
  const h=regle==='heir'?rulerHeir(k):null;
  if(h){k.pretendant=h;k.transition=4;
    r.push('<span class="bd">'+R.titre+' '+R.nom+' meurt — '+h.nom+', '+h.age+' ans, doit être couronné'+(h.age<18?' sous régence':'')+' ('+k.nom+')</span>');}
  else if(regle==='next'){k.pretendant=null;k.transition=3;
    r.push('<span class="bd">'+R.titre+' '+R.nom+' meurt — '+k.nom+' doit désigner un successeur</span>');}
  else{k.pretendant=null;k.transition=8;
    r.push('<span class="bd">'+R.titre+' '+R.nom+' meurt sans héritier — crise de succession à '+k.nom+'</span>');}
  k.ruler=null;
}
function rulerSucceeds(k,r){
  if(!SUCC[k.gov]){k.ruler=null;k.pretendant=null;return;}   /* l'anarchie ne couronne personne */
  const h=k.pretendant;
  if(h){
    k.ruler={nom:h.nom,age:Math.max(14,h.age),race:k.race,titre:TITRES[k.gov],lv:ri(8,22),
      conjoint:null,enfants:[],heir:null};
    k.pretendant=null;
    k.rep=Math.round(k.rep*.7);          /* un règne neuf ne doit rien à l'ancien */
    r.push('<span class="hi">'+k.ruler.titre+' '+k.ruler.nom+' monte sur le trône de '+k.nom+'</span>');
  } else {
    k.ruler=mkRuler(k);
    r.push('<span class="hi">'+k.ruler.titre+' '+k.ruler.nom+' prend la tête de '+k.nom+'</span>');
  }
}
