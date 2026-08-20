/* Sensen Mini — 16-building.js
   Parcelles 4×4, bâtiments 4×4, stations portées
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   CONSTRUCTION (4 / 7.5 / E.5) — abstraction en deux grilles
   Une cellule = 4×4 parcelles. Une parcelle = un bâtiment, une route,
   un champ, un mur, une tourelle. Un bâtiment = 4×4 emplacements, et
   un emplacement porte une station ou un meuble.
   ================================================================== */
const PLOT={
  route:{n:'Route',g:'道',cost:[['roche',6]],d:'relie les parcelles — trafic de l\'étal et défense mieux tenue'},
  batiment:{n:'Bâtiment',g:'館',cost:[['bois',12],['roche',8]],d:'16 emplacements pour stations et meubles'},
  champ:{n:'Champ',g:'田',cost:[['terre',6]],d:'rendement agricole des fermiers, modulé par la fertilité'},
  mur:{n:'Mur',g:'壁',cost:[['roche',14]],d:'+15 de défense contre les raids'},
  tourelle:{n:'Tourelle',g:'砲',cost:[['form:lingot',6],['roche',10]],d:'+24 de défense — hors service si la dette dure'},
};
const PK=Object.keys(PLOT);
const MEUBLE={
  lit:{n:'Lit',g:'床',cost:[['bois',4],['vegetal',2]],d:'loge un résident'},
  table:{n:'Table',g:'机',cost:[['bois',3]],d:'meuble — +1 humeur par type distinct dans le bâtiment'},
  coffre:{n:'Coffre',g:'箱',cost:[['bois',5]],d:'range 30 objets sur cette cellule — ce que le dos ne porte plus'},
  grandcoffre:{n:'Grand coffre',g:'櫃',cost:[['bois',10],['form:lingot',2]],d:'range 60 objets sur cette cellule'},
  tapis:{n:'Tapis',g:'毯',cost:[['vegetal',6]],d:'meuble'},
  trophee:{n:'Trophée',g:'角',cost:[['fossile',3]],d:'meuble'},
  lanterne:{n:'Lanterne',g:'灯',cost:[['form:lingot',2],['mineral',2]],d:'éclaire la cellule — la nuit n\'y attire plus les prédateurs'},
  foyer:{n:'Foyer',g:'炉',cost:[['roche',10],['form:lingot',2]],d:'annule le froid sur la cellule'},
  etal:{n:'Étal',g:'店',cost:[['bois',6],['form:lingot',2]],d:'boutique passive — les PNJ achètent seuls'},
  hall:{n:'Hall de guilde',g:'旗',cost:[['form:lingot',8],['roche',12]],d:'prendre les quêtes de guilde sans se déplacer'},
};
const MK2=Object.keys(MEUBLE);
const SPECIAL=['etal','hall'];
/* les clés inconnues sont ignorées : une sauvegarde importée ne doit pas faire tomber le jeu */
const matsOf=cat=>Object.keys(S.mat).filter(m=>MAT[m]&&MAT[m].c===cat);
function payCost(cost){
  const ok=cost.every(([w,n])=>{
    if(w.startsWith('form:')){const f=w.slice(5);
      return Object.keys(S.ref).filter(r=>r.startsWith(f+':')).reduce((a,r)=>a+S.ref[r],0)>=n;}
    return matsOf(w).reduce((a,m)=>a+S.mat[m],0)>=n;});
  if(!ok)return false;
  cost.forEach(([w,n])=>{
    if(w.startsWith('form:')){const f=w.slice(5);
      Object.keys(S.ref).filter(r=>r.startsWith(f+':')).forEach(r=>{
        if(n<=0)return;const t=Math.min(n,S.ref[r]);S.ref[r]-=t;n-=t;if(!S.ref[r])delete S.ref[r];});
    } else matsOf(w).forEach(m=>{
        if(n<=0)return;const t=Math.min(n,S.mat[m]);S.mat[m]-=t;n-=t;if(!S.mat[m])delete S.mat[m];});
  });
  return true;
}
const costTxt=c=>c.map(([w,n])=>n+' '+(w.startsWith('form:')?FORM[w.slice(5)].n:CAT[w].n)).join(' + ');
function plots(c){if(!c.plots)c.plots=Array.from({length:16},()=>null);return c.plots;}
function buildPlot(i,k){
  const c=here();
  if(!c.claim)return toast('Cellule non revendiquée');
  if(c.claim==='ressources')return toast('Rien ne tient sur une case de ressources naturelles — la régénération l\'efface');
  if(c.claim==='champs'&&(k==='tourelle'||k==='batiment'))return toast('Trop lourd pour des champs : routes, murs et parcelles agricoles seulement');
  const P=plots(c);
  if(P[i])return toast('Parcelle occupée');
  if(!payCost(PLOT[k].cost))return toast('Matériaux insuffisants : '+costTxt(PLOT[k].cost));
  P[i]=k==='batiment'?{t:'batiment',slots:Array.from({length:16},()=>null)}:{t:k};
  gainXp(k==='batiment'?'menuiserie':'taille',140);
  questTick('build',1);
  log('Bâti : '+PLOT[k].n+' (parcelle '+(i+1)+')');
}
function razePlot(i){
  const c=here(),P=plots(c);
  if(!P[i])return;
  log(PLOT[P[i].t]?'Rasé : '+PLOT[P[i].t].n:'Rasé');
  P[i]=null;
}
function placeSlot(pi,si,kind,k){
  const c=here(),P=plots(c),b=P[pi];
  if(!b||b.t!=='batiment')return;
  if(b.slots[si])return toast('Emplacement occupé');
  const cost=kind==='station'?STATION[k].cost:MEUBLE[k].cost;
  if(!payCost(cost))return toast('Matériaux insuffisants : '+costTxt(cost));
  b.slots[si]={t:kind,k};
  gainXp(kind==='station'?STATION[k].sk:'menuiserie',110);
  questTick('build',1);
  log('Installé : '+(kind==='station'?STATION[k].n:MEUBLE[k].n));
}
/* ===== AGRICULTURE ET ÉLEVAGE (7.4 / E.6) =====
   Un champ se sème avec deux unités d'une plante ; il produit chaque semaine,
   par formule : fertilité du biome × pluie × saison × fermier présent. La
   canicule flétrit, l'hiver endort. Le bétail — bêtes apprivoisées mises en
   enclos — rend viande et parties à la même cadence. */
const SEEDABLE=()=>Object.keys(MAT).filter(k=>MAT[k].crop);
function plantCrop(i,mk){
  const c=here(),P=plots(c),p=P[i];
  if(!p||p.t!=='champ')return toast('Il faut un champ');
  if(!SEEDABLE().includes(mk))return toast('Ça ne se sème pas');
  if((S.mat[mk]||0)<2)return toast('Il faut 2 × '+matName(mk)+' pour semer');
  S.mat[mk]-=2;if(!S.mat[mk])delete S.mat[mk];
  p.crop={mk,w:S.week};
  gainXp('agriculture',60);
  log('Semé : '+matName(mk)+' (parcelle '+(i+1)+') — première récolte à la semaine');
}
function cropYield(c,p){
  const si=seasonIdx();
  if(si===3)return 0;                                         /* l'hiver endort */
  const m=meteo(c),pluie=(METEO[m].pousse||0)+season().pousse;
  const fermier=S.npcs.some(n=>n.rec&&n.assign==='fermier'&&n.cell===key(c.x,c.y));
  let y=6*(BIOME[c.b].fert+.15)*(1+pluie)*(fermier?1.5:1)*(1+lv('agriculture')*.02);
  if(m==='canicule')y*=.3;
  return Math.max(1,Math.round(y));
}
function weeklyFarms(r){
  if(!S.claims.length)return;
  const prod={};let n=0;
  S.claims.forEach(k=>{const c=S.world[k];if(!c||!c.plots)return;
    c.plots.forEach(p=>{if(!p||p.t!=='champ'||!p.crop)return;
      const y=cropYield(c,p);if(!y)return;
      S.mat[p.crop.mk]=(S.mat[p.crop.mk]||0)+y;if(PLANTE[p.crop.mk])addFood(p.crop.mk,y);
      prod[p.crop.mk]=(prod[p.crop.mk]||0)+y;n++;
      gainXp('agriculture',y*3);});});
  if(n)r.push('champs : '+Object.keys(prod).map(k=>'+'+prod[k]+' '+matName(k)).join(', '));
  /* bétail */
  const enclos=countPlot('champ');
  const betail=S.comps.filter(c=>c.type==='bete'&&c.mode==='betail'&&!c.dead);
  if(betail.length){
    if(!enclos){r.push('<span class="bd">le bétail n\'a pas d\'enclos — rien ne vient</span>');return;}
    let viande=0,parts=0;
    betail.slice(0,enclos*3).forEach(b=>{                      /* trois bêtes par champ */
      const q=1+Math.floor(b.lv/6);
      addFood(foodKey('viande',b.el,MEATGRP[b.el]),q);viande+=q;
      if(Math.random()<.35){const d=pick(PARTS.slice(1));addFood(foodKey(d.k,d.el,d.grp),1);parts++;}
      b.mood=Math.min(100,b.mood+2);
      compXp(b,20);});
    gainXp('dressage',betail.length*15);
    r.push('élevage : +'+viande+' viande'+(parts?', +'+parts+' partie'+(parts>1?'s':''):''));
    if(betail.length>enclos*3)r.push('<span class="bd">'+(betail.length-enclos*3)+' bête(s) sans enclos</span>');
  }
}
/* --- lecture du bâti --- */
function eachBuilding(fn){
  S.claims.forEach(kk=>{const c=S.world[kk];if(!c||!c.plots)return;
    c.plots.forEach(p=>{if(p&&p.t==='batiment')fn(p,c);});});
}
function countPlot(k){let n=0;
  S.claims.forEach(kk=>{const c=S.world[kk];if(!c||!c.plots)return;
    c.plots.forEach(p=>{if(p&&p.t===k)n++;});});
  return n;}
function countSlot(k){let n=0;eachBuilding(b=>b.slots.forEach(sl=>{if(sl&&sl.k===k)n++;}));return n;}
const beds=()=>countSlot('lit');
/* ===== LES COFFRES (F.6) =====
   Le sac a un fond ; le coffre est l'endroit où poser le reste. Il est
   ATTACHÉ À SA CELLULE : ce qu'on y range n'est repris que sur place. */
function coffreOf(c){
  c=c||here();
  if(!c.plots)return null;
  let n=0;
  c.plots.forEach(p=>{if(p&&p.t==='batiment')p.slots.forEach(sl=>{
    if(sl&&sl.k==='coffre')n+=30;if(sl&&sl.k==='grandcoffre')n+=60;});});
  return n||null;
}
const coffreKey=()=>key(S.pos[0],S.pos[1]);
/* lire n'écrit rien : un coffre n'existe dans la sauvegarde que s'il contient quelque chose */
const coffreList=()=>(S.coffres&&S.coffres[coffreKey()])||[];
function coffreEcrire(){S.coffres=S.coffres||{};const k=coffreKey();return S.coffres[k]=S.coffres[k]||[];}
function ranger(i){
  const cap=coffreOf();
  if(!cap)return toast('Aucun coffre ici — bâtis-en un dans un bâtiment');
  const l=coffreEcrire();
  if(l.length>=cap)return toast('Coffre plein ('+l.length+'/'+cap+')');
  const it=S.items[i];if(!it)return;
  S.items.splice(i,1);l.push(it);
  log('Rangé : '+it.nom);
}
function reprendre(i){
  const l=coffreEcrire(),it=l[i];if(!it)return;
  if(sacPlein())return toast('Sac plein ('+S.items.length+'/'+sacMax()+')');
  l.splice(i,1);S.items.push(it);
  if(!l.length)delete S.coffres[coffreKey()];
  log('Repris : '+it.nom);
}
function rangerTout(){
  const cap=coffreOf();if(!cap)return toast('Aucun coffre ici');
  const l=coffreEcrire();let n=0;
  for(let i=S.items.length-1;i>=0&&l.length<cap;i--){
    l.push(S.items[i]);S.items.splice(i,1);n++;
  }
  if(!l.length)delete S.coffres[coffreKey()];
  log(n?'Rangé '+n+' objet'+(n>1?'s':'')+' dans le coffre':'Rien à ranger');
}
/* humeur d'un bâtiment : +1 par type de meuble distinct (max 10), +5 si bien rempli (7.5) */
function buildingComfort(b){
  const types=new Set(b.slots.filter(sl=>sl&&sl.t==='meuble').map(sl=>sl.k));
  return Math.min(10,types.size)+(b.slots.filter(sl=>sl).length>=9?5:0);
}
function comfort(){let best=0;eachBuilding(b=>{if(b.slots.some(sl=>sl&&sl.k==='lit'))best=Math.max(best,buildingComfort(b));});return best;}
/* stations : celles du bâti de la cellule courante, plus celles que tu portes */
const capacity=()=>30+st('force')*5;
const carried=()=>(S.carry||[]).reduce((a,k)=>a+STATION[k].p,0);
function stationsHere(){
  const set=new Set(S.carry||[]);
  const c=here();
  if(c.plots)c.plots.forEach(p=>{if(p&&p.t==='batiment')p.slots.forEach(sl=>{if(sl&&sl.t==='station')set.add(sl.k);});});
  return set;
}
function toggleCarry(k){
  S.carry=S.carry||[];
  const i=S.carry.indexOf(k);
  if(i>=0){S.carry.splice(i,1);return;}
  if(!stationsHere().has(k))return toast('Il faut la construire d\'abord');
  if(carried()+STATION[k].p>capacity())
    return toast('Trop lourd : '+STATION[k].p+' pour une capacité de '+capacity()+' (30 + Force×5)');
  S.carry.push(k);
}
