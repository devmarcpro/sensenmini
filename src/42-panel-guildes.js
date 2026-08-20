/* Sensen Mini — 42-panel-guildes.js
   Onglet pGuilde */

function pGuilde(){
  let h='<p class="hint">Cinq rangs, des quêtes tirées de gabarits. Le cumul est permis : la taxe hebdomadaire de 5 % des gains en est le coût, et cet or sort du jeu — c\'est un des puits qui empêchent l\'inflation.</p>';
  if(S.quest){const q=S.quest,g=GUILDS.find(x=>x.k===q.g);
    h+=grp('任','QUÊTE EN COURS',g.n);
    h+='<div class="card"><h3><span>'+q.txt+'</span><i>'+Math.min(q.cur,q.need)+'/'+q.need+'</i></h3>'
     +'<div class="meta">récompense '+q.or+' or · '+q.xp+' XP de guilde</div>'
     +'<div class="row">'+(q.type==='deliver'?'<button class="btn pri" data-deliver="1">Livrer</button>':'')
     +'<button class="btn" data-abandon="1">Abandonner</button></div></div>';}
  h+=grp('会','GUILDES',(countSlot('hall')?'hall sur ton territoire — quêtes à distance':'il faut être sur place'));
  h+='<div class="matlist">'+GUILDS.map(g=>{const gu=S.guilds[g.k]||{rank:0,xp:0};
    const need=100*Math.pow(2,gu.rank);
    return '<button class="mat" data-quest="'+g.k+'" '+(S.quest?'disabled':'')+'>'
     +'<b>'+g.g+'</b>'+g.n+'<small>'+RANKS[gu.rank]+' · '+Math.round(gu.xp)+'/'+need+' XP</small>'
     +'<small style="color:var(--terre)">'+(S.quest?'quête en cours':'prendre une quête')+'</small></button>';}).join('')+'</div>';
  return h;
}


let selFood=[];
