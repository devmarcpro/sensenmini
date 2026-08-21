/* Sensen Mini — 32-panel-recolte.js
   Onglet pRecolte */

function pRecolte(){
  const c=here();
  let h='<p class="hint">Trois facteurs et rien d\'autre : ta compétence, la dureté du matériau, la dureté de ton outil. Un outil trop faible rebondit — le mur est physique, pas artificiel. Les matériaux bruts n\'ont pas de qualité, seulement des stats fixes.</p>';
  h+=grp('具','OUTILS','lus dans les mains et dans le sac');
  h+='<div class="matlist">'+['roche','bois','terre','vegetal'].map(cat=>{
    const t=toolFor(cat),k=TOOLKIND[cat];
    return '<div class="mat"><b>'+CAT[cat].g+'</b>'+OUTIL[k].n
     +'<small>'+t.n+'</small>'
     +'<small style="color:'+(t.dur>1?'var(--jade)':'var(--zhu)')+'">mord jusqu\'à dureté '+Math.floor(t.dur*t.q*2)+'</small></div>';
  }).join('')+'</div>';
  /* LA PECHE. Elle vit ici parce que c'est une recolte : la meme main, un
     autre milieu. On dit toujours POURQUOI elle est fermee — le gel, la
     tempete, l'absence d'eau — plutot que de griser un bouton en silence. */
  {
    const bl=pecheBlocage();
    h+=grp('漁','PÊCHE',bl?'fermée ici':'ouverte');
    h+='<div class="card"><div class="meta">'
      +(bl?'<span style="color:var(--zhu)">'+bl+'</span>'
         :'Une prise toutes les '+pecheDelai().toFixed(1)+' s'
          +(vehUtile()&&vehDef().eau?' — <b>depuis ta '+vehDef().n.toLowerCase()+'</b>, on pêche au large':'')
          +'. Ni combat ni territoire : elle nourrit un blessé comme un vagabond.')
      +'</div>'
      +'<div class="row"><button class="btn'+(S.occ==='peche'?' pri':'')+'" data-occ="peche" '+(bl?'disabled':'')+'>漁 Pêcher</button></div>'
      +'<div class="meta">Pêche niv '+lv('peche')
      +(PECHE[c.b]?' · ici : '+Object.keys(PECHE[c.b]).map(k=>MAT[k]?matName(k):k).join(', '):'')+'</div>'
      +'</div>';
  }
  h+=grp('掘','SUR PLACE',BIOME[c.b].n+' · strate '+c.depth);
  h+='<div class="matlist">'+cellMats(c).map(mk=>{
    const m=MAT[mk],ok=canHarvest(mk),t=harvestTime(mk),st2=stockOf(c,mk),sm=stockMax(c,mk);
    return '<button class="mat'+(S.target===mk?' sel':'')+'" data-harv="'+mk+'" '+(ok&&st2>0?'':'disabled')+'>'
     +'<b style="color:'+EL[domi(matVec(mk))].c+'">'+CAT[m.c].g+'</b>'+(m.col?'<span class="matsw" style="background:'+m.col+'"></span>':'')+m.n
     +'<small>'+CAT[m.c].n+' · dureté '+m.d+' · '+SKILLS[CAT[m.c].sk].n+'</small>'
     +'<small style="color:'+(st2>0?'var(--dim)':'var(--zhu)')+'">'+(st2>0?'gisement '+st2+' / '+sm:'épuisé — revient la semaine prochaine')+'</small>'
     +'<small style="color:'+(ok?'var(--jade)':'var(--zhu)')+'">'+(ok?t.toFixed(2)+' s / coup · '+m.v+' or l\'unité':'l\'outil rebondit')+'</small></button>';
  }).join('')+'</div>';
  h+='<div class="meta">Un gisement pris ne revient qu\'à la semaine : les cases sauvages et les claims « ressources naturelles » se régénèrent, les autres claims gardent ce qu\'on leur a pris.</div>';
  return h;
}

function compLabel(k){const c=S.comp[k];
  return COMP[c.ct].n+' · '+formeNom(c.f,c.mk)+' · q'+c.q.toFixed(2)+' ×'+c.n;}
function compsOfType(ct){return Object.keys(S.comp).filter(k=>S.comp[k].ct===ct).sort((a,b)=>S.comp[b].q-S.comp[a].q);}
