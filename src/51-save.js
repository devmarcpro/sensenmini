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

async function save(){S.t=Date.now();try{await STORE.set(KEY,JSON.stringify(S));}catch(e){}}
async function load(){
  try{
    const v=await STORE.get(KEY);if(!v)return false;
    const d=JSON.parse(v);S=Object.assign(NEW(),d);
    SK.forEach(k=>{if(!S.sk[k])S.sk[k]={lv:0,xp:0,pot:80,base:80};});
    absence((Date.now()-(d.t||Date.now()))/1000);
    return true;
  }catch(e){return false;}
}
/* ----- export / import : la partie sous forme de texte, d'un appareil à l'autre ----- */
function exportSave(){S.t=Date.now();return 'SENSEN1:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))));}
function importSave(txt){
  try{
    txt=(txt||'').trim();
    const raw=txt.startsWith('SENSEN1:')?decodeURIComponent(escape(atob(txt.slice(8)))):txt;
    const d=JSON.parse(raw);
    if(!d||!d.sk||!d.race)return toast('Ce texte n\'est pas une sauvegarde Sensen');
    S=Object.assign(NEW(),d);
    SK.forEach(k=>{if(!S.sk[k])S.sk[k]={lv:0,xp:0,pot:80,base:80};});
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
