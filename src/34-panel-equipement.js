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
  /* sertissures des pièces portées */
  const worn=Object.keys(S.eq).filter(k=>S.eq[k]&&S.eq[k].slots);
  if(worn.length||(S.gems&&S.gems.length)){
    h+=grp('玉','SERTISSURES',(S.gems||[]).length+' gemme(s) taillée(s) en réserve');
    h+=worn.map(k=>gemBlock(S.eq[k],'eq:'+k)).join('')||'<p class="hint">Aucune pièce portée n\'a de sertissure.</p>';
  }
  /* le coffre : ce que le dos ne porte plus, attaché à sa cellule */
  const cap=coffreOf();
  if(cap){
    const l=coffreList();
    h+=grp('箱','COFFRE',l.length+' / '+cap+' · '+(here().town||BIOME[here().b].n));
    h+='<div class="meta" style="margin-bottom:6px">Un coffre appartient à sa cellule : ce qu\'on y range ne se reprend que sur place.</div>';
    h+='<div class="row" style="margin-bottom:8px"><button class="btn" data-rangetout="1" '+(S.items.length&&l.length<cap?'':'disabled')+'>Tout ranger</button></div>';
    if(l.length)h+='<div class="matlist">'+l.map((it,i)=>'<button class="mat" data-reprendre="'+i+'" '+(sacPlein()?'disabled':'')+'>'
      +'<b>'+(it.kind==='arme'?'刀':it.kind==='armure'?'甲':it.kind==='statue'?'像':'具')+'</b>'+it.nom
      +'<small>'+(it.rar?RARITY[it.rar].n+' · ':'')+'q'+it.q.toFixed(2)+(it.aff&&it.aff.length?' · '+it.aff.length+' affixe(s)':'')+'</small>'
      +'<small style="color:var(--jade)">'+(sacPlein()?'sac plein':'reprendre')+'</small></button>').join('')+'</div>';
    else h+='<p class="hint">Coffre vide.</p>';
  }
  h+=grp('袋','OBJETS',S.items.length+' / '+sacMax()+' en sac');
  h+='<div class="meta" style="margin-bottom:6px">Le dos porte 20 + Force×2 objets. Au-delà, le butin banal reste où il tombe — ou passe au creuset si tu as le Fondeur (自 VEILLE).'
   +(cap?'':' Un <b>coffre</b> (建 BÂTIR → bâtiment → coffre) garde le reste au chaud.')+'</div>';
  h+=S.items.map((it,i)=>'<div class="card"><h3><span>'+it.nom+'</span><i>'+(it.rar?RARITY[it.rar].n+' · ':'')+(it.kind==='armure'?'armure':it.kind)+'</i></h3>'
    +'<div class="meta">'+(it.kind==='statue'?'trophée de chasse — valeur '+it.val+' or':itemLine(it))+'</div>'
    +(it.parts.length?'<div class="meta">'+it.parts.map(p=>COMP[p.ct].n+' '+(p.f==='brut'?'':FORM[p.f].n+' ')+matName(p.mk)).join(' + ')+'</div>':'')
    +(it.aff&&it.aff.length?'<div class="meta" style="color:var(--jade)">'+it.aff.map(a=>AFF.find(x=>x.id===a.id).t(a.p)).join(' · ')+'</div>':'')
    +vecBar(itemVec(it))
    +(it.slots?gemBlock(it,'bag:'+i,true):'')
    +'<div class="row"><button class="btn pri" data-equip="'+i+'">Équiper</button>'
    +(cap?'<button class="btn" data-ranger="'+i+'">Ranger</button>':'')
    +'<button class="btn" data-scrap="'+i+'">Fondre · '+Math.round(itemValue(it)/3)+' or</button></div></div>').join('')
    ||'<p class="hint">Le sac d\'objets est vide.</p>';
  return h;
}
/* sertissures d'un objet : gemmes en place, emplacements libres, choix d'une gemme de réserve */
function gemBlock(it,where,inline){
  const gems=it.gems||[],free=it.slots-gems.length;
  let h=(inline?'':'<div class="card" data-gemcard="'+where+'"><h3><span>'+it.nom+'</span><i>'+it.slots+' sertissure'+(it.slots>1?'s':'')+'</i></h3>')
    +'<div class="meta">'+(gems.length?gems.map((g,i)=>'<span style="color:var(--terre)">'+gemLabel(g)+'</span> <button class="btn" data-unsocket="'+where+':'+i+'" style="padding:2px 6px">désertir</button>').join('<br>'):'aucune gemme sertie')
    +(free?'<br>'+free+' libre'+(free>1?'s':''):'')+'</div>';
  const cands=(S.gems||[]).map((g,gi)=>({g,gi})).filter(x=>!(GEMSPEC[x.g.spec].arme&&it.kind!=='arme'));
  if(free&&cands.length)h+='<div class="row" data-gemcard="'+where+'"><select data-gemsel="1" style="flex:1;min-width:120px">'+cands.map(x=>'<option value="'+x.gi+'">'+gemLabel(x.g)+'</option>').join('')+'</select>'
    +'<button class="btn pri" data-socket="'+where+'">Sertir</button></div>';
  return h+(inline?'':'</div>');
}


function modLabel(i){const m=S.modules[i];if(!m)return '—';
  const d=MODULE[m.id];
  return d.n+' · '+DOMAIN[m.dom].n+' · niv '+m.lv+' ('+d.t+')';}
