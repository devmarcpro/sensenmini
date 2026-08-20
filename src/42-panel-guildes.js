/* Sensen Mini — 42-panel-guildes.js
   Onglet pGuilde */

/* un gabarit décrit en clair, sans tirer la quête : « N » et une matière d'exemple */
const APERCU={need:'N',mat:'materiau'};
function pGuilde(){
  let h='<p class="hint">Cinq rangs, des quêtes tirées de gabarits — jamais écrites à la main : le pattern, la cible et le compte se remplissent au contexte. Le cumul est permis ; la taxe hebdomadaire de 5 % des gains en est le coût, et cet or sort du jeu, c\'est un des puits qui tiennent l\'inflation.</p>';
  /* quête en cours */
  if(S.quest){const q=S.quest,g=GUILDS.find(x=>x.k===q.g);
    const pret=q.cur>=q.need;
    h+=grp('任','QUÊTE EN COURS',g.n+' · '+RANKS[guildOf(q.g).rank]);
    h+='<div class="card"><h3><span>'+q.txt+'</span><i>'+Math.min(q.cur,q.need)+'/'+q.need+'</i></h3>'
     +'<div class="bar2"><span style="width:'+Math.min(100,q.cur/q.need*100)+'%;background:'+(pret?'#4FA96B':'#3E7CB1')+'"></span>'
     +'<em>'+(pret?'à remettre':Math.max(0,q.need-q.cur)+' restant'+(q.need-q.cur>1?'s':'')) +'</em></div>'
     +'<div class="meta">récompense '+q.or+' or · '+q.xp+' XP de guilde</div>'
     +'<div class="row">'+((q.type==='deliver'||pret)?'<button class="btn pri" data-deliver="1" '+(pret?'':'disabled')+'>Remettre</button>':'')
     +'<button class="btn" data-abandon="1">Abandonner</button></div></div>';}
  /* guildes */
  const hall=countSlot('hall');
  const t=townAt(S.pos[0],S.pos[1]);
  h+=grp('会','GUILDES',hall?'hall sur ton territoire — toutes joignables':(t&&t.halls&&t.halls.length?t.nom+' : '+t.halls.length+' hall(s)':'aucun hall ici'));
  h+='<div class="meta" style="margin-bottom:8px">Un gabarit ne s\'ouvre qu\'à partir d\'un certain rang : monter en donne de plus exigeants, et de meilleures récompenses. Chaque palier s\'accompagne d\'un présent de la guilde.</div>';
  h+=GUILDS.map(g=>{
    const gu=guildOf(g.k),need=guildRankNeed(gu.rank),ok=guildReachable(g.k);
    const ouverts=guildTemplates(g.k).length,tot=QTPL.filter(x=>x.g===g.k).length;
    const suiv=QTPL.filter(x=>x.g===g.k&&x.r>gu.rank).sort((a,b)=>a.r-b.r)[0];
    return '<div class="card'+(ok?'':' off')+'"><h3><span>'+g.g+' '+g.n+'</span><i>'+RANKS[gu.rank]+' · rang '+(gu.rank+1)+'/5</i></h3>'
     +'<div class="bar2"><span style="width:'+(gu.rank>=4?100:Math.min(100,gu.xp/need*100))+'%;background:#D9A441"></span>'
     +'<em>'+(gu.rank>=4?'maîtrise atteinte':Math.round(gu.xp)+' / '+need+' XP')+'</em></div>'
     +'<div class="meta">'+ouverts+' gabarit'+(ouverts>1?'s':'')+' sur '+tot+' ouvert'+(ouverts>1?'s':'')
     +(gu.faites?' · '+gu.faites+' quête'+(gu.faites>1?'s':'')+' accomplie'+(gu.faites>1?'s':''):'')
     +(suiv?' · au rang '+(suiv.r+1)+' : '+suiv.txt(APERCU).toLowerCase():'')+'</div>'
     +'<div class="meta">'+guildTemplates(g.k).map(x=>x.txt(APERCU)).join(' · ')+'</div>'
     +'<div class="row"><button class="btn pri" data-quest="'+g.k+'" '+(S.quest||!ok?'disabled':'')+'>'
     +(S.quest?'une quête en cours':ok?'Prendre une quête':'hall hors de portée')+'</button></div></div>';
  }).join('');
  /* où trouver des halls */
  const near=kingdomsNear().map(k=>kTowns(k).filter(x=>x.halls&&x.halls.length).map(x=>({t:x,k,d:Math.abs(x.x-S.pos[0])+Math.abs(x.y-S.pos[1])}))).flat()
    .sort((a,b)=>a.d-b.d).slice(0,4);
  if(near.length){
    h+=grp('旗','HALLS CONNUS','aucune ville ne les a tous');
    h+='<div class="matlist">'+near.map(o=>'<div class="mat"><b>旗</b>'+o.t.nom+' ('+o.t.x+','+o.t.y+')'
      +'<small>'+o.t.halls.map(x=>GUILDS.find(g=>g.k===x).n).join(', ')+'</small>'
      +'<small style="color:var(--dim)">à '+o.d+' cellule'+(o.d>1?'s':'')+' · '+o.k.nom+'</small></div>').join('')+'</div>';
  }
  h+='<div class="meta" style="margin-top:8px">Un <b>hall de guilde</b> bâti sur ton territoire (建 BÂTIR → bâtiment → hall) rend toutes les guildes joignables sans te déplacer.</div>';
  return h;
}
