/* Sensen Mini — 44-panel-veille.js
   Onglet pAuto */

function pAuto(){
  let h='<p class="hint">Tout ce que tu fais à la main se rachète. Le jeu doit tourner quand tu ne regardes pas — et à ton retour, l\'absence se résout par formules, à la cadence que tu tenais réellement, jamais par une simulation accélérée.</p>';
  h+=grp('自','AUTOMATISATIONS');
  h+=AK.map(k=>{const a=AUTOS[k],l=auto(k),c=autoCost(k),m=l>=a.max;
    return '<div class="card'+(l?' on':'')+'"><h3><span>'+a.g+' '+a.n+'</span><i>rang '+l+'/'+a.max+'</i></h3>'
     +'<div class="meta">'+a.d+'</div>'
     +'<div class="row"><button class="btn pri" data-auto="'+k+'" '+(m||S.or<c?'disabled':'')+'>'
     +(m?'au maximum':c+' or')+'</button></div></div>';}).join('');
  /* râtelier */
  const rk=rackElements();
  h+=grp('刀','RÂTELIER',Object.keys(rk).length+' / 5 éléments couverts');
  h+='<div class="card"><div class="meta">La Communion des cinq ne vaut que si tu portes de quoi tourner. '
   +'Chaque élément manquant casse la rotation et fait retomber le résolveur de ×2.40 à ×1.40.</div>'
   +'<div class="row">'+EL.map((e,i)=>'<span class="btn" style="border-color:'+(rk[i]?e.c:'var(--line)')
   +';color:'+(rk[i]?e.c:'var(--dim)')+'">'+e.g+' '+e.n+(rk[i]?'':' — manquant')+'</span>').join('')+'</div>'
   +'<div class="meta">'+(weapon()?'en main : '+weapon().nom+' ('+EL[domi(itemVec(weapon()))].n+')':'aucune arme en main')+'</div>'
   +'</div>';
  h+=rackList().map((it,i)=>'<div class="card"><h3><span>'+it.nom+'</span><i>'
    +EL[domi(itemVec(it))].g+' '+EL[domi(itemVec(it))].n+'</i></h3>'
    +'<div class="meta">'+FUNC[it.fn].d[0]+'d'+FUNC[it.fn].d[1]+' '+DT[FUNC[it.fn].t]
    +' · qualité '+it.q.toFixed(2)+' · dureté '+it.dur.toFixed(1)+'</div>'
    +'<div class="row"><button class="btn" data-draw="'+i+'">Dégainer · 5 endurance</button></div></div>').join('');
  /* cadence observée */
  const rt=S.rate||{};
  h+=grp('率','CADENCE OBSERVÉE','ce que la veille rendra');
  h+='<div class="card"><div class="meta">'
   +'combat '+(rt.kill||0).toFixed(1)+' créatures/min · récolte '+(rt.harv||0).toFixed(1)+'/min · '
   +'atelier '+(rt.craft||0).toFixed(1)+'/min · salles de donjon '+(rt.djroom||0).toFixed(1)+'/min</div>'
   +'<div class="meta">Hors-ligne : 60 % de cette cadence, plafonné à 8 h. Les semaines de territoire, elles, se résolvent toutes.</div>'
   +'<div class="meta">Occupation qui tournera : <b>'+({repos:'repos',combat:'combat',donjon:'donjon',recolte:'récolte de '+(S.target?matName(S.target):'—'),atelier:'atelier',explore:'exploration',dormir:'sommeil'}[S.occ]||S.occ)+'</b></div></div>';
  return h;
}
