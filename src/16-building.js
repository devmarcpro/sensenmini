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
  coffre:{n:'Coffre',g:'箱',cost:[['bois',5]],d:'meuble'},
  tapis:{n:'Tapis',g:'毯',cost:[['vegetal',6]],d:'meuble'},
  trophee:{n:'Trophée',g:'角',cost:[['fossile',3]],d:'meuble'},
  lanterne:{n:'Lanterne',g:'灯',cost:[['form:lingot',2],['mineral',2]],d:'éclaire la cellule — la nuit n\'y attire plus les prédateurs'},
  foyer:{n:'Foyer',g:'炉',cost:[['roche',10],['form:lingot',2]],d:'annule le froid sur la cellule'},
  etal:{n:'Étal',g:'店',cost:[['bois',6],['form:lingot',2]],d:'boutique passive — les PNJ achètent seuls'},
  hall:{n:'Hall de guilde',g:'旗',cost:[['form:lingot',8],['roche',12]],d:'prendre les quêtes de guilde sans se déplacer'},
};
const MK2=Object.keys(MEUBLE);
const SPECIAL=['etal','hall'];
function payCost(cost){
  const ok=cost.every(([w,n])=>{
    if(w.startsWith('form:')){const f=w.slice(5);
      return Object.keys(S.ref).filter(r=>r.startsWith(f+':')).reduce((a,r)=>a+S.ref[r],0)>=n;}
    return Object.keys(S.mat).filter(m=>MAT[m].c===w).reduce((a,m)=>a+S.mat[m],0)>=n;});
  if(!ok)return false;
  cost.forEach(([w,n])=>{
    if(w.startsWith('form:')){const f=w.slice(5);
      Object.keys(S.ref).filter(r=>r.startsWith(f+':')).forEach(r=>{
        if(n<=0)return;const t=Math.min(n,S.ref[r]);S.ref[r]-=t;n-=t;if(!S.ref[r])delete S.ref[r];});
    } else Object.keys(S.mat).filter(m=>MAT[m].c===w).forEach(m=>{
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
