/* Sensen Mini — 39-panel-compagnons.js
   Onglet pComps */

function pComps(){
  let h='<p class="hint">Les compagnons progressent par l\'usage comme toi, vieillissent comme toi et tombent comme toi. L\'ordre décide de tout : celui qui tient encaisse à ta place et frappe moins fort ; celui qui suit ne risque rien et n\'apprend rien.</p>';
  h+=grp('率','ESCORTE',escortUsed()+' / '+escortMax()+' places');
  h+='<div class="card"><div class="meta">Places d\'escorte = 1 + Charisme/5 + Leadership/10 = 1 + '
   +Math.floor(st('cha')/5)+' + '+Math.floor(lv('leadership')/10)+'. Le Leadership monte en menant.</div>'
   +'<div class="meta">Un <b>suiveur territorial</b> ne prend aucune place mais refuse de quitter tes cellules revendiquées.</div>'
   +'<div class="meta">'+ORDERS.map(o=>o.g+' <b>'+o.n+'</b> — '+o.d).join('<br>')+'</div></div>';
  if(!S.comps.length)h+='<p class="hint">Personne. Engage un PNJ dont la relation atteint 50, ou descends une créature sous 25 % de ses PV et tente un jet de Dressage.</p>';
  h+=S.comps.map((c,i)=>{
    const o=ORDERS.find(x=>x.k===c.order);
    return '<div class="card'+(c.dead?'':(c.esc?' on':''))+'"><h3><span>'+c.nom+'</span>'
     +'<i>'+(c.type==='bete'?'bête':'PNJ')+' · niveau '+c.lv+'</i></h3>'
     +'<div class="meta">PV '+Math.round(c.hp)+'/'+c.max+' · humeur '+Math.round(c.mood)
     +' · potentiel '+Math.round(c.pot)+' · élément '+EL[c.el].g+' '+EL[c.el].n+'</div>'
     +(c.eq?'<div class="meta">arme : '+c.eq.nom+' ('+QNAME(c.eq.q)+')</div>':'')
     +(c.weak&&S.day<c.weak?'<div class="meta" style="color:var(--zhu)">affaibli — −20 % jusqu\'à demain</div>':'')
     +(c.dead?'<div class="meta" style="color:var(--zhu)">mort. Sa dépouille te suit ; il ne reviendra pas seul.</div>'
       +'<div class="meta">'+(priestHere()||'aucun prêtre ici — cherche un village 村 ou un sanctuaire 社')+'</div>'
       +'<div class="row"><button class="btn pri" data-revive="'+i+'" '+(priestHere()?'':'disabled')+'>Rappeler · '+reviveCost(c)+' or</button></div>'
      :'<div class="row"><button class="btn'+(c.esc?' pri':'')+'" data-esc="'+i+'">'
       +(c.esc?'en escorte':'escorter')+'</button>'
       +'<button class="btn" data-ord="'+i+'">'+o.g+' '+o.n+'</button>'
       +'<button class="btn" data-mode="'+i+'">'+(c.mode==='territorial'?'territorial':'permanent')+'</button>'
       +(Object.keys(S.food).length?'<button class="btn" data-feed="'+i+'">Nourrir</button>':'')
       +'<button class="btn" data-free="'+i+'">Libérer</button></div>'
       +(c.type!=='bete'&&S.items.some(x=>x.kind==='arme')
         ?'<div class="row">'+S.items.map((x,xi)=>x.kind==='arme'
           ?'<button class="btn" data-arm="'+i+':'+xi+'">Donner '+x.nom+'</button>':'').join('')+'</div>':''))
     +'</div>';}).join('');
  return h;
}


let openPlot=null;
