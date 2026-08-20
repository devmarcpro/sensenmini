/* Sensen Mini — 30-panel-monde.js
   Onglet pMonde */

function pMonde(){
  const R=5;
  let h='<p class="hint">Une seule génération continue : la carte n\'est qu\'une fenêtre sur le monde voxel. Le danger sort des couches de bruit, jamais de la distance — et il dérive chaque semaine selon ce que tu nettoies ou laisses pourrir.</p>';
  h+='<div class="map" style="grid-template-columns:repeat('+(R*2+1)+',1fr)">';
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
    const x=S.pos[0]+dx,y=S.pos[1]+dy,c=cell(x,y);
    if(Math.abs(dx)<=1&&Math.abs(dy)<=1)c.seen=true;
    const dgc=c.corr>66?'#C8332B':c.corr>33?'#D9A441':'#4FA96B';
    const kk=c.seen?kingdomAt(x,y):null;
    const tt=kk?kTowns(kk).find(t2=>t2.x===x&&t2.y===y):null;
    h+='<div class="cell'+(dx===0&&dy===0?' here':'')+(c.seen?'':' unknown')+'" data-go="'+x+','+y+'"'
      +' style="background:'+(c.seen?BIOME[c.b].c:'#0F1413')+'">'
      +(tt?'<span class="poi" style="color:#000">'+(tt.type==='capitale'?'城':tt.type==='ville'?'市':'村')+'</span>'
        :(c.seen&&c.poi?'<span class="poi">'+POI[c.poi].g+'</span>':''))
      +(kk?'<span class="kd" style="background:'+(myTowns().some(t2=>t2.x===x&&t2.y===y)?'#6FBFA0':'#C8332B')+'"></span>':'')
      +(c.seen?'<span class="dg" style="background:'+dgc+'"></span>':'?')+'</div>';
  }
  const kh=kingdomAt(S.pos[0],S.pos[1]);
  h+='</div><div class="legend">城 capitale · 市 ville · 村 village · filet gauche : territoire d\'un royaume<br>'
   +Object.keys(POI).map(k=>POI[k].g+' '+POI[k].n).join(' · ')
   +'<br>Filet inférieur : paisible · dangereuse · mortelle</div>';
  h+='<div class="row"><button class="btn'+(S.occ==='combat'?' pri':'')+'" data-occ="combat">戦 Combattre</button>'
   +'<button class="btn'+(S.occ==='explore'?' pri':'')+'" data-occ="explore">歩 Explorer</button>'
   +'<button class="btn'+(S.occ==='repos'?' pri':'')+'" data-occ="repos">休 Se reposer</button></div>';
  return h;
}
