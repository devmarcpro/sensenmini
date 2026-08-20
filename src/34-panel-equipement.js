/* Sensen Mini — 34-panel-equipement.js
   Onglet pEquip */

function pEquip(){
  let h='<p class="hint">Quatorze slots. L\'armure est permanente, l\'arme est situationnelle : le garde-fou n\'est pas une interdiction, c\'est la compétence de construction — porter des mailles quarante heures rend une plaque neuve objectivement moins protectrice.</p>';
  h+=grp('装','GRILLE');
  h+='<div class="matlist">'+SLOTS.map(sl=>{
    const it=eqOf(sl.k);
    return '<button class="mat'+(it?'':'')+'" data-unslot="'+sl.k+'" '+(it?'':'disabled')+'>'
      +'<b>'+sl.g+'</b>'+sl.n+'<small>'+(it?it.nom:'vide')+'</small>'
      +(it?'<small style="color:var(--jade)">q'+it.q.toFixed(2)+' · retirer</small>':'<small>—</small>')+'</button>';
  }).join('')+'</div>';
  h+=grp('盾','DÉFENSE PAR ZONE','réduction plate, zone nue = 0');
  h+='<div class="card">'+ZK.map(z=>'<div class="meta">'+ZONE[z].g+' '+ZONE[z].n+' ×'+ZONE[z].mult
    +' — réduction '+armorOf(z).toFixed(1)+(eqOf(SLOTS.find(x=>x.zone===z).k)?'':' <span style="color:var(--zhu)">nue</span>')+'</div>').join('')
    +'<div class="meta" style="margin-top:6px">Vecteur moyen du personnage (explosions, sorts de zone)</div>'+vecBar(avgVec())+'</div>';
  h+=grp('袋','OBJETS',S.items.length+' en sac');
  h+=S.items.map((it,i)=>'<div class="card"><h3><span>'+it.nom+'</span><i>'+(it.kind==='armure'?'armure':it.kind)+'</i></h3>'
    +'<div class="meta">'+itemLine(it)+'</div>'
    +'<div class="meta">'+it.parts.map(p=>COMP[p.ct].n+' '+(p.f==='brut'?'':FORM[p.f].n+' ')+matName(p.mk)).join(' + ')+'</div>'
    +vecBar(itemVec(it))
    +'<div class="row"><button class="btn pri" data-equip="'+i+'">Équiper</button>'
    +'<button class="btn" data-scrap="'+i+'">Fondre · '+Math.round(itemValue(it)/3)+' or</button></div></div>').join('')
    ||'<p class="hint">Le sac d\'objets est vide.</p>';
  return h;
}


function modLabel(i){const m=S.modules[i];if(!m)return '—';
  const d=MODULE[m.id];
  return d.n+' · '+DOMAIN[m.dom].n+' · niv '+m.lv+' ('+d.t+')';}
