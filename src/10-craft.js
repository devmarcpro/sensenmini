/* Sensen Mini — 10-craft.js
   Transformation, façonnage, assemblage, équipement
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== CRAFT COMPOSITIONNEL (4.2.1 / A.3 / A.4 / A.4.7) ===== */
const quality=n=>Math.max(.1,(n/(n+25))*2*(0.85+Math.random()*0.30));
const hasStation=k=>!k||stationsHere().has(k);
const refKey=(f,m)=>f+':'+m;
function addRef(f,m,n){const k=refKey(f,m);S.ref[k]=(S.ref[k]||0)+n;}
function useRef(f,m,n){const k=refKey(f,m);if((S.ref[k]||0)<n)return false;S.ref[k]-=n;if(!S.ref[k])delete S.ref[k];return true;}
const recipeKnown=(ct,mk)=>BASEMAT.includes(mk)||!!S.recipes[ct+':'+mk];
function learnRecipe(ct,mk){
  const k=ct+':'+mk;
  S.recipes[k]=Math.min(5,(S.recipes[k]||0)+1);
  cutIn('巻',COMP[ct].n+' en '+matName(mk),S.recipes[k]>1?'recette approfondie — niveau '+S.recipes[k]:'recette apprise');
}
/* transformation : matière brute → forme travaillée */
function transform(f,mk){
  const F=FORM[f];
  if(!hasStation(F.st))return toast('Station manquante : '+STATION[F.st].n);
  if((S.mat[mk]||0)<F.cost)return toast('Il faut '+F.cost+' × '+matName(mk));
  S.mat[mk]-=F.cost;if(!S.mat[mk])delete S.mat[mk];
  addRef(f,mk,1);
  gainXp(STATION[F.st].sk,MAT[mk].d*15);
}
/* composant : forme travaillée → composant typé */
function makeComp(ct,f,mk){
  const C=COMP[ct];
  if(!hasStation(C.st))return toast('Station manquante : '+STATION[C.st].n);
  if(!recipeKnown(ct,mk))return toast('Recette inconnue');
  const cost=C.w>.5?2:1;
  if(f==='brut'){ if((S.mat[mk]||0)<cost*2)return toast('Il faut '+cost*2+' × '+matName(mk));
    S.mat[mk]-=cost*2;if(!S.mat[mk])delete S.mat[mk]; }
  else if(!useRef(f,mk,cost))return toast('Il faut '+cost+' × '+FORM[f].n+' de '+matName(mk));
  const skk=STATION[C.st].sk;
  const q=quality(lv(skk))*(1+(S.recipes[ct+':'+mk]||0)*0.03);
  const tier=Math.round(q*4)/4;
  const k=ct+'|'+f+'|'+mk+'|'+tier;
  const c=S.comp[k];
  if(c){c.q=(c.q*c.n+q)/(c.n+1);c.n++;}else S.comp[k]={ct,f,mk,q,n:1};
  gainXp(skk,MAT[mk].d*25);
}
function takeComp(k){const c=S.comp[k];if(!c)return null;const o={ct:c.ct,f:c.f,mk:c.mk,q:c.q};
  c.n--;if(!c.n)delete S.comp[k];return o;}
/* assemblage : composants → objet (A.4.7) */
function assembleFrom(kind,fn,picks){
  const def=kind==='arme'?FUNC[fn]:OUTIL[fn];
  if(sacPlein())return toast('Sac plein ('+S.items.length+'/'+sacMax()+') — fonds ou équipe avant d\'assembler');
  const parts=picks.map(k=>takeComp(k)).filter(Boolean);
  if(parts.length!==picks.length)return toast('Composant manquant');
  const jet=quality(lv('assemblage'));
  const wsum=parts.reduce((a,p)=>a+COMP[p.ct].w,0);
  const qmoy=parts.reduce((a,p)=>a+p.q*COMP[p.ct].w,0)/wsum;
  const facteur=Math.max(.5,Math.min(1.5,.5+jet/2));   // le maître tire le meilleur, le débutant gâche
  const q=+(qmoy*facteur).toFixed(2);
  const it=mkItem(kind,fn,parts,q);
  it.slots=kind==='arme'?craftSlots(q):0;
  S.items.push(it);
  gainXp('assemblage',parts.reduce((a,p)=>a+MAT[p.mk].d,0)*20);questTick('craft',1);
  cutIn('鍛',it.nom,QNAME(q)+' · qualité '+q.toFixed(2));
  return it;
}
function assembleArmor(slotK,picks){
  if(sacPlein())return toast('Sac plein ('+S.items.length+'/'+sacMax()+') — fonds ou équipe avant d\'assembler');
  const parts=picks.map(k=>takeComp(k)).filter(Boolean);
  if(parts.length!==picks.length)return toast('Composant manquant');
  const major=parts.find(p=>COMP[p.ct].cons);
  if(!major)return toast('Il faut une pièce majeure');
  const jet=quality(lv('assemblage'));
  const wsum=parts.reduce((a,p)=>a+COMP[p.ct].w,0);
  const qmoy=parts.reduce((a,p)=>a+p.q*COMP[p.ct].w,0)/wsum;
  const q=+(qmoy*Math.max(.5,Math.min(1.5,.5+jet/2))).toFixed(2);
  const it=mkItem('armure',slotK,parts,q);
  it.cons=COMP[major.ct].cons;
  it.nom=armorName(slotK,it.cons,major.mk);
  it.slots=craftSlots(q);
  S.items.push(it);
  gainXp('assemblage',parts.reduce((a,p)=>a+MAT[p.mk].d,0)*20);questTick('craft',1);
  cutIn('鍛',it.nom,QNAME(q)+' · qualité '+q.toFixed(2));
  return it;
}
function mkItem(kind,fn,parts,q){
  const wsum=parts.reduce((a,p)=>a+COMP[p.ct].w,0);
  /* dureté de base = moyenne pondérée AVANT qualité (A.4) */
  const dur=parts.reduce((a,p)=>a+MAT[p.mk].d*COMP[p.ct].w,0)/wsum;
  const de=parts.reduce((a,p)=>a+MAT[p.mk].de*COMP[p.ct].w,0)/wsum;
  const mana=parts.reduce((a,p)=>a+(MAT[p.mk].m||0)*COMP[p.ct].w,0)/wsum;
  /* l'élasticité : ce qui donne sa puissance à un arc, là où la lame veut de la dureté */
  const ela=parts.reduce((a,p)=>a+(MAT[p.mk].ela||8)*COMP[p.ct].w,0)/wsum;
  /* vecteur composite : chaque composant au prorata de son poids (5.2) */
  let v=[0,0,0,0,0];
  parts.forEach(p=>{const pv=formVec(p.f,p.mk);for(let i=0;i<5;i++)v[i]+=pv[i]*COMP[p.ct].w;});
  v=rnd4(norm(v));   /* quatre décimales suffisent, et la sauvegarde s'en porte bien mieux */
  const def=kind==='arme'?FUNC[fn]:kind==='outil'?OUTIL[fn]:null;
  return {id:'i'+(S.nid++),kind,fn:kind==='armure'?null:fn,slot:kind==='armure'?fn:(kind==='arme'||kind==='outil'?'main1':null),
    parts:parts.map(p=>({ct:p.ct,f:p.f,mk:p.mk})),q:+q.toFixed(2),
    dur:+(dur*q).toFixed(1),durBase:+dur.toFixed(1),de:+de.toFixed(1),mana:+mana.toFixed(1),ela:+ela.toFixed(1),vec:v,
    nom:(def?def.n:'Pièce')+' de '+matName(parts[0].mk)};
}
const itemVec=it=>it.vec||[.2,.2,.2,.2,.2];
/* « Cuirasse — Mailles de Fer », mais « Brassards — Cuir » quand la construction est le matériau */
const armorName=(sl,cons,mk)=>SLOTS.find(s2=>s2.k===sl).n+' — '+(CONS[cons].n===matName(mk)?CONS[cons].n:CONS[cons].n+' de '+matName(mk));
/* pour un composant, une pièce valide tirée parmi des matériaux candidats — mêmes règles que l'atelier.
   Sans candidat valide, on retombe sur la matière de base du composant. */
function partFor(ct,mats){
  const C=COMP[ct],ok=[];
  (mats||[]).forEach(mk=>{
    if(!MAT[mk])return;
    if(C.forms.includes('brut')&&C.raw.includes(mk)){ok.push({ct,f:'brut',mk});return;}
    const f=C.forms.find(f2=>f2!=='brut'&&FORM[f2]&&formOk(f2,mk));
    if(f)ok.push({ct,f,mk});});
  if(ok.length)return pick(ok);
  const f=C.forms.find(f2=>f2!=='brut'&&FORM[f2])||'brut';
  const base=f==='brut'?(C.raw[0]||'os'):f==='lingot'?'fer':f==='planche'?'chene':f==='taillee'?'pierre':f==='tissu'?'lin':f==='tanne'?'cuir':f==='brique'?'argile':'gres';
  return {ct,f,mk:base};
}
/* sertissures d'un objet d'atelier : l'atelier améliore, modestement (A.12) */
const craftSlots=q=>q>=1.6?2:q>=1?1:0;
/* valeur d'usage approximative, pour comparer deux objets du même genre */
function itemScore(it){
  if(it.kind==='arme'){const F=FUNC[it.fn];return F.d[0]*(F.d[1]+1)/2*F.spd*(it.durBase/20)*it.q*(1+(it.aff||[]).length*.12);}
  if(it.kind==='armure')return it.durBase*it.q*(1+(it.aff||[]).length*.12);
  return it.dur;
}
/* ===== CE QU'ON PEUT PORTER (A.4.2 : poids porté) =====
   La Force décide de ce que le dos supporte. Un sac plein ne bloque rien :
   le butin banal reste sur place — ou passe au creuset si le Fondeur est là. */
const sacMax=()=>20+st('force')*2;
const sacPlein=()=>S.items.length>=sacMax();
/* fond un objet : un tiers de sa valeur */
function scrapItem(i){const it=S.items[i];if(!it)return 0;const g=Math.round(itemValue(it)/3);S.or+=g;S.items.splice(i,1);return g;}
/* le Fondeur : fond le butin banal qui ne bat pas ce qu'on porte (ni les artefacts, ni le rare) */
function autoScrap(){
  let g=0,n=0;
  for(let i=S.items.length-1;i>=0;i--){const it=S.items[i];
    if(it.artefact||(it.rar||0)>=2||it.kind==='outil'||it.kind==='statue')continue;
    const worn=it.kind==='arme'?weapon():S.eq[it.slot];
    if(worn&&itemScore(it)<=itemScore(worn)){g+=scrapItem(i);n++;}
    else if(!worn&&S.items.filter(x=>x.kind===it.kind&&x.slot===it.slot).length>3){g+=scrapItem(i);n++;}
  }
  if(n)log('Fondeur : '+n+' objet'+(n>1?'s':'')+' fondu'+(n>1?'s':'')+', +'+g+' or');
}
function itemValue(it){
  if(it.val)return it.val;
  if(!it.parts||!it.parts.length)return 1;
  const wsum=it.parts.reduce((a,p)=>a+COMP[p.ct].w,0);
  const base=it.parts.reduce((a,p)=>a+MAT[p.mk].v*(COMP[p.ct].w/wsum)*3,0);
  return Math.round(base*1.5*it.q);
}
/* équipement */
/* ce que tient une main : 1 ou 2, et ce que ça interdit (5.1) */
const hands=it=>(it&&it.kind==='arme'&&FUNC[it.fn])?(FUNC[it.fn].h||1):1;
const isShield=it=>!!(it&&it.kind==='arme'&&FUNC[it.fn]&&FUNC[it.fn].shield);
const isDist=it=>!!(it&&it.kind==='arme'&&FUNC[it.fn]&&FUNC[it.fn].dist);
const twoHanded=()=>hands(S.eq.main1)===2;
/* la prise en main : ce qui décide de la compétence et du style de combat */
function grip(){
  const a=S.eq.main1,b=S.eq.main2;
  if(!a||a.kind!=='arme')return {k:'nu',n:'mains nues',sk:null};
  if(isDist(a))return {k:'dist',n:'tir',sk:a.fn};
  if(hands(a)===2)return {k:'deuxmains',n:'à deux mains',sk:'deuxmains'};
  if(isShield(b))return {k:'bouclier',n:'arme et bouclier',sk:'bouclier'};
  if(b&&b.kind==='arme')return {k:'dualwield',n:'deux armes',sk:'dualwield'};
  return {k:'simple',n:'une main',sk:null};
}
function equipItem(i){
  const it=S.items[i];if(!it)return;
  if(it.kind==='statue')return toast('Une statue se pose, ne se porte pas — vends-la, ou garde-la pour le prestige');
  let slot=it.slot;
  if(it.kind==='outil'||it.kind==='arme'){
    /* une arme à deux mains prend tout ; on ne met rien en seconde main tant qu'elle est là */
    if(hands(it)===2)slot='main1';
    else if(S.eq.main1&&!S.eq.main2&&hands(S.eq.main1)===1)slot='main2';
    else slot='main1';
  }
  const old=S.eq[slot];
  S.eq[slot]=it;S.items.splice(i,1);
  if(old)S.items.push(old);
  /* la main libérée n'existe plus si l'arme prend les deux */
  if(slot==='main1'&&hands(it)===2&&S.eq.main2){
    S.items.push(S.eq.main2);
    log('<span class="bd">'+S.eq.main2.nom+' rangé : '+it.nom+' prend les deux mains.</span>');
    delete S.eq.main2;
  }
  log('Équipé : '+it.nom+' ('+SLOTS.find(s2=>s2.k===slot).n+')');
}
function unequip(k){const it=S.eq[k];if(!it)return;delete S.eq[k];S.items.push(it);}
const eqOf=k=>S.eq[k]||null;
function armorOf(zk){
  const sl=SLOTS.find(x=>x.zone===zk),it=eqOf(sl.k);
  if(!it)return 0;                                  /* zone nue = 0 */
  return it.durBase/4*it.q*(1+lv('c_'+it.cons)/100);
}
function avgVec(){
  let v=[0,0,0,0,0],tot=0;
  ZK.forEach(zk=>{const sl=SLOTS.find(x=>x.zone===zk),it=eqOf(sl.k);
    if(it){const iv=itemVec(it);for(let i=0;i<5;i++)v[i]+=iv[i]*ZONE[zk].avg;tot+=ZONE[zk].avg;}});
  return tot?norm(v):[.2,.2,.2,.2,.2];
}


/* ===== STATIONS : construction sur place ===== */
function canBuildStation(k){
  return STATION[k].cost.every(([what,n])=>{
    if(what.startsWith('form:')){const f=what.slice(5);
      return Object.keys(S.ref).filter(r=>r.startsWith(f+':')).reduce((a,r)=>a+S.ref[r],0)>=n;}
    return matsOf(what).reduce((a,m)=>a+S.mat[m],0)>=n;});
}

/* ===== L'ATELIER COMME OCCUPATION (répétition tant qu'il y a matière) ===== */
function craftTime(mk,skk){return MAT[mk].d/(4*sf(lv(skk)));}
function startCraft(job){
  S.craft=job;S.occ='atelier';craftT=0;sceneMode='';
  log('À l\'ouvrage : '+(job.t==='form'?FORM[job.f].n:COMP[job.ct].n)+' de '+matName(job.mk));
}
function craftCan(){
  const j=S.craft;if(!j)return false;
  if(j.t==='form')return hasStation(FORM[j.f].st)&&(S.mat[j.mk]||0)>=FORM[j.f].cost;
  const C=COMP[j.ct],cost=C.w>.5?2:1;
  if(!hasStation(C.st))return false;
  return j.f==='brut'?(S.mat[j.mk]||0)>=cost*2:(S.ref[refKey(j.f,j.mk)]||0)>=cost;
}
function craftTick(dt){
  const j=S.craft;if(!j){S.occ='repos';return;}
  if(!craftCan()){S.occ='repos';S.resume=null;log('<span class="bd">Plus de matière — l\'ouvrage s\'arrête.</span>');return;}
  const skk=j.t==='form'?STATION[FORM[j.f].st].sk:STATION[COMP[j.ct].st].sk;
  craftT+=dt;
  const t=craftTime(j.mk,skk);
  if(craftT>=t){
    craftT-=t;
    if(j.t==='form')transform(j.f,j.mk);else makeComp(j.ct,j.f,j.mk);
    noteRate('craft');
    S.end=Math.max(0,S.end-1.2);knock();float('+1','#C9B88A');
    if(S.end<=0){S.resume='atelier';S.occ='repos';log('Bras morts. L\'ouvrage reprendra.');}
  }
}
