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
