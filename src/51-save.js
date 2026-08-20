/* Sensen Mini — 32-save.js
   Sauvegarde et rechargement
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== SAUVEGARDE ===== */
const KEY='sensen:mini:step2';
async function save(){S.t=Date.now();try{if(window.storage)await window.storage.set(KEY,JSON.stringify(S));}catch(e){}}
async function load(){
  try{if(!window.storage)return false;
    const r=await window.storage.get(KEY);if(!r||!r.value)return false;
    const d=JSON.parse(r.value);S=Object.assign(NEW(),d);
    SK.forEach(k=>{if(!S.sk[k])S.sk[k]={lv:0,xp:0,pot:80,base:80};});
    const el=(Date.now()-(d.t||Date.now()))/1000;
    if(el>90){
      const rap=offline(el);
      const h=Math.floor(el/3600),m=Math.round(el%3600/60);
      cutIn('留','Absence de '+(h?h+' h ':'')+m+' min',rap.length?rap[0]:'rien de notable');
      rap.forEach(x=>log('<span class="in">'+x+'</span>'));
    }
    return true;
  }catch(e){return false;}
}
