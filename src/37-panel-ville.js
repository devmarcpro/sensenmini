/* Sensen Mini — 37-panel-ville.js
   Onglet pVille */

function pVille(){
  const t=townAt(S.pos[0],S.pos[1]),k=kingdomAt(S.pos[0],S.pos[1]);
  let h='';
  if(!k){
    h+='<p class="hint">Tu es dans la wilderness : ni loi, ni douane, ni impôt. La majorité du monde est comme ça — un royaume est un événement, pas une règle.</p>';
    const near=kingdomsNear().map(x=>({k:x,d:Math.abs(x.cap[0]-S.pos[0])+Math.abs(x.cap[1]-S.pos[1])}))
      .sort((a,b)=>a.d-b.d).slice(0,4);
    h+=grp('遠','ROYAUMES CONNUS DU SECTEUR');
    h+=near.map(o=>'<div class="card"><h3><span>'+o.k.nom+'</span><i>'+KSIZE[o.k.size].n+'</i></h3>'
      +'<div class="meta">'+GOV[o.k.gov].n+' · '+RACE[o.k.race].n+' · culture '+CULT[o.k.cult].n
      +' · capitale en '+o.k.cap.join(',')+' à '+o.d+' cellules</div>'
      +'<div class="meta">'+rulerTxt(o.k)+'</div></div>').join('');
    return h;
  }
  const mien=t&&myTowns().includes(t);
  h+=grp('国',k.nom.toUpperCase(),KSIZE[k.size].n);
  h+='<div class="card"><div class="meta">'+GOV[k.gov].n+' · race dominante '+RACE[k.race].n
   +' · culture '+CULT[k.cult].n+' · taxe '+Math.round(k.tax*100)+'%</div>'
   +'<div class="meta">'+rulerTxt(k)+'</div>'
   +(k.transition>0?'<div class="meta" style="color:var(--zhu)">Le trône est vide : conquérir ici est 25 % plus facile tant que dure la transition.</div>':'')
   +'<div class="meta">trésor '+Math.round(k.or)+' or · réputation '+Math.round(repKing(kingdomHere()))+'</div>'
   +'<div class="meta">douanes : '+(Object.keys(k.tarifs||{}).filter(c=>k.tarifs[c]>0).map(c=>CAT[c].n+' '+Math.round(k.tarifs[c]*100)+'%').join(' · ')||'aucune connue')+'</div></div>';
  if(!t){
    h+='<p class="hint">Territoire de '+k.nom+', mais pas de ville sur cette cellule. Les villes portent 城 市 村 sur la carte.</p>';
    return h;
  }
  h+=grp(t.type==='capitale'?'城':t.type==='ville'?'市':'村',t.nom.toUpperCase(),
    t.abandonne?'abandonné':(mien?'à toi':'sous '+k.nom));
  if(t.abandonne){
    h+='<div class="card"><div class="meta">Plus personne. Les bâtiments tiennent debout — un lieu pareil se réoccupe.</div>'
     +'<div class="row"><button class="btn pri" data-conq="1" '+(S.gov?'':'disabled')+'>'
     +(S.gov?'Réoccuper':'fonde ton royaume avant')+'</button></div></div>';
    return h;
  }
  h+='<div class="card"><div class="meta">population '+t.pop+' / '+t.cap+' · prospérité '+t.prosp.toFixed(2)
   +' · bourse '+Math.round(t.or)+' or'+(mien?' · loyauté '+Math.round(t.loyaute||60):'')+'</div>'
   +'<div class="meta">garnison '+garrison(t)+' défenseurs (seuil de reddition '+Math.round(garrison(t)*0+Math.round(t.pop*.35*2)*.25)+')</div>'
   +'<div class="meta">boutiques : '+(t.shops.length?t.shops.join(', '):'aucune')+'</div>'
   +'<div class="meta">halls de guilde : '+(t.halls.length?t.halls.map(x=>GUILDS.find(g=>g.k===x).n).join(', '):'aucun')
   +' — aucune ville n\'a tout</div></div>';
  if(!mien){
    h+='<div class="row"><button class="btn" data-assaut="1">Donner l\'assaut</button>'
     +'<button class="btn pri" data-conq="1" '+(S.gov?'':'disabled')+'>Exiger l\'allégeance</button></div>'
     +'<div class="meta">L\'assaut décime : chaque mort réduit la population. Sous 25 % de garnison, la ville peut céder — '
     +'jet 1d20 + Leadership/2 + Charisme/4 contre DD '+Math.max(6,t.pop*2)+'.</div>';
  }
  /* boutiques */
  if(t.shops&&t.shops.length){
    const open=shopsOpen(t),st=shopStock(t);
    t.shops.forEach(sk=>{const d=SHOPDEF[sk];if(!d)return;const list=st[sk]||[];
      h+=grp(d.g,d.n.toUpperCase(),open?(list.length?'arrivage de la semaine':'étal vide jusqu\'à la semaine prochaine'):(isNight()?'fermé la nuit':'on ne te sert pas'));
      h+='<div class="meta" style="margin-bottom:6px">'+d.d+'</div>';
      if(list.length)h+='<div class="matlist">'+list.map((o,i)=>'<button class="mat" data-buy="'+sk+':'+i+'" '+(open&&S.or>=o.p?'':'disabled')+'>'
        +(o.t==='item'?iconeHtml(o.it,2.7,'coin'):'')+'<b>'+d.g+'</b>'+o.label+'<small>'+o.sub+'</small><small style="color:'+(S.or>=o.p?'var(--terre)':'var(--zhu)')+'">'+o.p+' or</small></button>').join('')+'</div>';
    });
  }
  /* marché local */
  h+=grp('市','MARCHÉ',isNight()?'fermé pour la nuit':'ce qui abonde ici vaut moins');
  h+='<div class="meta" style="margin-bottom:6px">Bourse de la ville : <b>'+Math.round(t.or)+' / '+t.orMax+' or</b>'
   +' — elle se regarnit de 15 % par semaine. À sec, le marchand troque en vivres : <b>'+trocReste(t)+'</b> encore échangeables cette semaine.'
   +' Une seule ville n\'absorbe pas une saison de récolte : il faut faire la tournée, ou attendre.</div>';
  const ks=Object.keys(S.mat);
  if(!ks.length)h+='<p class="hint">Rien à vendre.</p>';
  else h+='<div class="matlist">'+ks.map(m=>{
    const f=townPrice(t,m),d=douane(k,m);
    return '<button class="mat" data-sellmat="'+m+'"><b style="color:'+EL[domi(matVec(m))].c+'">'
     +CAT[MAT[m].c].g+'</b>'+matName(m)+' × '+S.mat[m]
     +'<small>'+(f<.9?'abonde ici (×'+f.toFixed(2)+')':f>1.2?'recherché (×'+f.toFixed(2)+')':'prix normal')
     +(d<1?' · douane −'+Math.round((1-d)*100)+'%':'')+'</small>'
     +'<small style="color:var(--jade)">vendre '+priceMat(m,S.mat[m])+' or</small></button>';}).join('')+'</div>';
  return h;
}
