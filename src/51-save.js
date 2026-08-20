/* Sensen Mini — 51-save.js
   Sauvegarde, rechargement, résolution de l'absence
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== SAUVEGARDE ===== */
const KEY='sensen:mini:step2';

/* Stockage : window.storage dans l'environnement Claude, localStorage dans un
   navigateur classique. Les deux exposent get/set asynchrones ici. */
const STORE=window.storage
  ? {get:k=>window.storage.get(k).then(r=>r&&r.value),set:(k,v)=>window.storage.set(k,v)}
  : {get:async k=>localStorage.getItem(k),set:async(k,v)=>localStorage.setItem(k,v)};

/* ----- le monde ne se stocke pas, il se regénère (G.1) -----
   `genCell` est déterministe : la graine suffit à retrouver chaque cellule.
   On n'enregistre donc que ce qui S'ÉCARTE du monde généré — vu ou non,
   creusé, revendiqué, bâti, nettoyé, sa corruption qui a dérivé. Une
   cellule seulement traversée pèse alors une quinzaine d'octets au lieu
   de deux cent cinquante. */
function packWorld(){
  const out={};
  for(const k in S.world){
    const c=S.world[k];
    if(!c||c.x===undefined)continue;
    const base=genCell(c.x,c.y),d={};
    for(const f in c){
      if(f==='x'||f==='y')continue;
      const a=JSON.stringify(c[f]),b=JSON.stringify(base[f]);
      if(a!==b)d[f]=c[f];
    }
    if(Object.keys(d).length)out[k]=d;
  }
  return out;
}
function unpackWorld(p){
  const w={};
  if(!p)return w;
  for(const k in p){
    const xy=k.split(',');
    const x=+xy[0],y=+xy[1];
    if(!isFinite(x)||!isFinite(y))continue;
    w[k]=Object.assign(genCell(x,y),p[k]);
  }
  return w;
}
/* la sauvegarde : l'état tel quel, le monde en écarts */
function packSave(){
  S.t=Date.now();
  const w=S.world;
  S.world=packWorld();S.v=2;
  const j=JSON.stringify(S);
  S.world=w;
  return j;
}
function unpackSave(d){
  S=Object.assign(NEW(),d);
  /* v2 : le monde est stocké en écarts. Les sauvegardes d'avant sont complètes. */
  if(d.v>=2)S.world=unpackWorld(d.world);
  sanitize();
}
async function save(){try{await STORE.set(KEY,packSave());}catch(e){}}
async function load(){
  try{
    const v=await STORE.get(KEY);if(!v)return false;
    const d=JSON.parse(v);
    unpackSave(d);
    absence((Date.now()-(d.t||Date.now()))/1000);
    return true;
  }catch(e){return false;}
}
/* une sauvegarde d'une version antérieure, ou retouchée à la main, ne doit pas
   faire tomber le jeu : on complète ce qui manque et on jette ce qu'on ne connaît plus. */
function sanitize(){
  SK.forEach(k=>{if(!S.sk[k])S.sk[k]={lv:0,xp:0,pot:80,base:80};});
  S.sx=S.sx||NEWSX();
  STATS.forEach(([k])=>{if(!S.sx[k])S.sx[k]={xp:0,pot:100,base:100};
    if(!(S.stats[k]>0))S.stats[k]=5;});
  if(!S.race)return;
  Object.keys(S.mat||{}).forEach(k=>{if(!MAT[k]||!(S.mat[k]>0))delete S.mat[k];});
  Object.keys(S.food||{}).forEach(k=>{if(!(S.food[k]>0))delete S.food[k];});
  Object.keys(S.ref||{}).forEach(k=>{const p=k.split(':');if(!FORM[p[0]]||!MAT[p[1]]||!(S.ref[k]>0))delete S.ref[k];});
  Object.keys(S.comp||{}).forEach(k=>{const c=S.comp[k];if(!c||!COMP[c.ct]||!MAT[c.mk]||!(c.n>0))delete S.comp[k];});
  S.items=(S.items||[]).filter(it=>it&&it.kind);
  S.coffres=S.coffres||{};
  for(const k in S.coffres){
    S.coffres[k]=(S.coffres[k]||[]).filter(it=>it&&it.kind);
    if(!S.coffres[k].length)delete S.coffres[k];
  }
  S.modules=(S.modules||[]).filter(m=>m&&MODULE[m.id]&&DOMAIN[m.dom]);
  S.books=(S.books||[]).filter(b=>b&&DOMAIN[b.dom]);
  S.gems=(S.gems||[]).filter(g=>g&&GEMSPEC[g.spec]);
  S.comps=(S.comps||[]).filter(c=>c&&c.nom);
  S.spells=(S.spells||[[],[]]).map(sp=>(sp||[]).filter(i=>S.modules[i]));
  S.postures=(S.postures||[]).filter(i=>S.modules[i]);
  S.carry=(S.carry||[]).filter(k=>STATION[k]);
  if(S.quest&&!GUILDS.some(g=>g.k===S.quest.g))S.quest=null;
}
/* ----- export / import : la partie sous forme de texte, d'un appareil à l'autre ----- */
function exportSave(){return 'SENSEN1:'+btoa(unescape(encodeURIComponent(packSave())));}
function importSave(txt){
  try{
    txt=(txt||'').trim();
    const raw=txt.startsWith('SENSEN1:')?decodeURIComponent(escape(atob(txt.slice(8)))):txt;
    const d=JSON.parse(raw);
    if(!d||!d.sk||!d.race)return toast('Ce texte n\'est pas une sauvegarde Sensen');
    unpackSave(d);
    E=null;sceneMode='';tab='monde';
    save();paint();
    cutIn('保','Sauvegarde chargée',S.nom+' · semaine '+S.week);
    absence((Date.now()-(d.t||Date.now()))/1000);
  }catch(e){toast('Sauvegarde illisible');}
}
function newGame(){
  S=NEW();E=null;sceneMode='';tab='monde';
  try{localStorage.removeItem(KEY);}catch(e){}
  $('gate').hidden=false;buildGate();$('log').innerHTML='';paint();
}
/* Résout une absence de `sec` secondes par formules (19-idle.js) et l'annonce.
   Appelée au rechargement, mais aussi quand l'onglet revient au premier plan :
   sur téléphone, le navigateur gèle la boucle dès que l'app est masquée. */
function absence(sec){
  if(!(sec>90)||!S.race)return false;
  const rap=offline(sec);
  const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);
  cutIn('留','Absence de '+(h?h+' h ':'')+m+' min',rap.length?rap[0]:'rien de notable');
  rap.forEach(x=>log('<span class="in">'+x+'</span>'));
  return true;
}
