/* Sensen Mini — 34-panel-equipement.js
   Onglet pEquip */

function pEquip(){
  let h='<p class="hint">Quatorze slots. L\'armure est permanente, l\'arme est situationnelle : le garde-fou n\'est pas une interdiction, c\'est la compétence de construction — porter des mailles quarante heures rend une plaque neuve objectivement moins protectrice.</p>';
  /* La silhouette du joueur a quitte la scene de combat — on sait ou l'on est,
     et la place vaut mieux pour ce qu'on a en face. Elle trouve ici son vrai
     usage : voir d'un coup d'oeil ce qu'on porte, piece par piece, avec la
     couleur de chaque materiau. */
  h+=grp('装','GRILLE',grip().n);
  h+='<div class="card"><div class="pdoll"><div class="cam">'+heroHtml(5.4)+'</div></div></div>';
  h+='<div class="matlist">'+SLOTS.map(sl=>{
    const it=eqOf(sl.k);
    /* LE CARQUOIS N'EST PAS UNE PIECE (10d). Les treize autres emplacements
       portent un objet ; celui-ci porte une RESERVE, qui se vide. On le dit
       ici parce que c'est ici que le joueur regarde ce qu'il porte — et
       parce que cette ligne est restee vide depuis le premier jour. */
    if(sl.k==='muni'){
      const D=S.carquois&&typeof MUNI==='object'?MUNI[S.carquois]:null;
      const n=D?muniDe(S.carquois):0;
      return '<div class="mat">'
        +'<b>'+(D?D.g:sl.g)+'</b>'+sl.n
        +'<small>'+(D?D.n+' × '+n:'rien d encoche')+'</small>'
        +'<small style="color:var(--jade)">'+(D?FUNC[D.pour].n+" · s encoche a l etabli":'—')+'</small></div>';
    }
    return '<button class="mat'+(it?'':'')+'" data-unslot="'+sl.k+'" '+(it?'':'disabled')+'>'
      +(it?iconeHtml(it,2.7,'coin'):'')
      +'<b>'+sl.g+'</b>'+sl.n+'<small>'+(it?it.nom:'vide')+'</small>'
      +(it&&it.kind==='parure'?'<small style="color:var(--jade)">'+affListe(it).join(' · ')+'</small>':'')
      +(it?'<small style="color:var(--jade)">q'+it.q.toFixed(2)+' · retirer</small>':'<small>—</small>')+'</button>';
  }).join('')+'</div>';
  h+=foldHead('eq','def','盾','DÉFENSE PAR ZONE','réduction plate, zone nue = 0',null);
  if(foldOpen('eq','def',null))h+='<div class="card">'+ZK.map(z=>'<div class="meta">'+ZONE[z].g+' '+ZONE[z].n+' ×'+ZONE[z].mult
    +' — réduction '+armorOf(z).toFixed(1)+(eqOf(SLOTS.find(x=>x.zone===z).k)?'':' <span style="color:var(--zhu)">nue</span>')+'</div>').join('')
    +'<div class="meta" style="margin-top:6px">Vecteur moyen du personnage (explosions, sorts de zone)</div>'+vecBar(avgVec())+'</div>';
  /* sertissures des pièces portées */
  const worn=Object.keys(S.eq).filter(k=>S.eq[k]&&S.eq[k].slots);
  if(worn.length||(S.gems&&S.gems.length)){
    h+=foldHead('eq','gem','玉','SERTISSURES',(S.gems||[]).length+' gemme(s) taillée(s) en réserve',null);
    if(foldOpen('eq','gem',null))h+=worn.map(k=>gemBlock(S.eq[k],'eq:'+k)).join('')||'<p class="hint">Aucune pièce portée n\'a de sertissure.</p>';
  }
  /* le coffre : ce que le dos ne porte plus, attaché à sa cellule */
  const cap=coffreOf();
  if(cap){
    const l=coffreList();
    h+=foldHead('eq','cof','箱','COFFRE',l.length+' / '+cap+' · '+(here().town||BIOME[here().b].n),null);
    if(foldOpen('eq','cof',null)){
    h+='<div class="meta" style="margin-bottom:6px">Un coffre appartient à sa cellule : ce qu\'on y range ne se reprend que sur place.</div>';
    h+='<div class="row" style="margin-bottom:8px"><button class="btn" data-rangetout="1" '+(S.items.length&&l.length<cap?'':'disabled')+'>Tout ranger</button></div>';
    if(l.length)h+='<div class="matlist">'+l.map((it,i)=>'<button class="mat" data-reprendre="'+i+'" '+(sacPlein()?'disabled':'')+'>'
      +iconeHtml(it,2.7,'coin')+'<b>'+(it.kind==='arme'?'刀':it.kind==='armure'?'甲':it.kind==='statue'?'像':'具')+'</b>'+it.nom
      +'<small>'+(it.rar?RARITY[it.rar].n+' · ':'')+'q'+it.q.toFixed(2)+(it.aff&&it.aff.length?' · '+it.aff.length+' affixe(s)':'')+'</small>'
      +'<small style="color:var(--jade)">'+(sacPlein()?'sac plein':'reprendre')+'</small></button>').join('')+'</div>';
    else h+='<p class="hint">Coffre vide.</p>';}
  }
  h+=grp('袋','OBJETS',S.items.length+' / '+sacMax()+' en sac');
  h+='<div class="meta" style="margin-bottom:6px">Le dos porte 20 + Force×2 objets. Au-delà, le butin banal reste où il tombe — ou passe au creuset si tu as le Fondeur (自 VEILLE).'
   +(cap?'':' Un <b>coffre</b> (建 BÂTIR → bâtiment → coffre) garde le reste au chaud.')+'</div>';
  /* Un sac de quarante objets faisait onze ecrans et demi sur petit
     telephone : chaque piece etalait sa composition, ses affixes, son
     vecteur et ses sertissures. On plie. Le nom, la rarete, la qualite et
     les deux gestes frequents — equiper, fondre — restent toujours
     visibles ; le detail ne s'ouvre que pour la piece qu'on regarde.
     Le repli est un accordeon : une seule fiche ouverte a la fois. */
  h+=S.items.map((it,i)=>{
    const ouv=foldOpen('obj',it.id,null);
    let s='<div class="card"><button class="objh'+(ouv?' on':'')+'" data-fold="obj:'+it.id+'">'
      +iconeHtml(it,2.8)
      +'<span>'+it.nom+'</span>'
      +'<i>'+(it.rar?RARITY[it.rar].n+' · ':'')+'q'+it.q.toFixed(2)
      +(it.aff&&it.aff.length?' · '+it.aff.length+' affixe'+(it.aff.length>1?'s':''):'')
      +(it.slots?' · '+it.slots+'◇':'')+'</i>'
      +'<em>'+(ouv?'▾':'▸')+'</em></button>';
    if(ouv){
      s+='<div class="meta">'+(it.kind==='statue'?'trophée de chasse — valeur '+it.val+' or':itemLine(it))+'</div>'
       +(it.parts.length?'<div class="meta">'+it.parts.map(p=>COMP[p.ct].n+' — '+formeNom(p.f,p.mk)).join(' + ')+'</div>':'')
       +(it.aff&&it.aff.length?'<div class="meta" style="color:var(--jade)">'+affListe(it).join(' · ')+'</div>':'')
       +vecBar(itemVec(it))
       +(it.slots?gemBlock(it,'bag:'+i,true):'');
    }
    s+='<div class="row"><button class="btn pri" data-equip="'+i+'">Équiper</button>'
      +(cap?'<button class="btn" data-ranger="'+i+'">Ranger</button>':'')
      +'<button class="btn" data-scrap="'+i+'">Fondre · '+Math.round(itemValue(it)/3)+' or</button></div>';
    return s+'</div>';
  }).join('')
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
