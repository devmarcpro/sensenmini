/* Sensen Mini — 40-panel-batir.js
   Onglet pBatir */

function pBatir(){
  const c=here();
  let h='<p class="hint">Une cellule tient en seize parcelles. Une parcelle porte un bâtiment, une route, un champ, un mur ou une tourelle — et un bâtiment tient lui-même en seize emplacements, un par station ou par meuble. Tout se paie en matériaux, jamais en or.</p>';
  if(!c.claim){
    h+='<div class="card"><div class="meta" style="color:var(--zhu)">Cellule non revendiquée — rien ne tiendra ici.</div>'
     +'<div class="row"><button class="btn pri" data-claim="1">Revendiquer · '+claimCost()+' or</button></div></div>';
    return h;
  }
  const P=plots(c);
  h+=grp('区',(c.town||BIOME[c.b].n).toUpperCase(),ROLES[c.claim].n);
  h+='<div class="plotgrid">'+P.map((p,i)=>{
    const sel2=openPlot===i;
    if(!p)return '<button class="plot'+(sel2?' sel':'')+'" data-plot="'+i+'"><b>·</b><small>libre</small></button>';
    if(p.t==='batiment'){
      const n=p.slots.filter(x=>x).length;
      return '<button class="plot bat'+(sel2?' sel':'')+'" data-plot="'+i+'"><b>館</b><small>'+n+'/16</small></button>';}
    return '<button class="plot'+(sel2?' sel':'')+'" data-plot="'+i+'"><b>'+PLOT[p.t].g+'</b><small>'+PLOT[p.t].n+'</small></button>';
  }).join('')+'</div>';
  /* parcelle ouverte */
  if(openPlot!==null){
    const p=P[openPlot];
    h+=grp('画','PARCELLE '+(openPlot+1),p?(p.t==='batiment'?'Bâtiment':PLOT[p.t].n):'libre');
    if(!p){
      h+='<div class="matlist">'+PK.map(k=>{
        const ok=PLOT[k].cost.every(()=>true);
        return '<button class="mat" data-newplot="'+k+'"><b>'+PLOT[k].g+'</b>'+PLOT[k].n
         +'<small>'+PLOT[k].d+'</small><small style="color:var(--terre)">'+costTxt(PLOT[k].cost)+'</small></button>';
      }).join('')+'</div>';
    } else if(p.t!=='batiment'){
      h+='<div class="card"><div class="meta">'+PLOT[p.t].d+'</div>'
       +'<div class="row"><button class="btn" data-raze="'+openPlot+'">Raser</button></div></div>';
    } else {
      h+='<div class="card"><div class="meta">Confort : +'+buildingComfort(p)+' d\'humeur'
       +' ('+new Set(p.slots.filter(x=>x&&x.t==='meuble').map(x=>x.k)).size+' types de meubles'
       +(p.slots.filter(x=>x).length>=9?', bâtiment bien rempli +5':'')+')</div></div>';
      h+='<div class="plotgrid small">'+p.slots.map((sl,si)=>{
        if(!sl)return '<button class="plot'+(openSlot===si?' sel':'')+'" data-slot="'+si+'"><b>·</b><small>vide</small></button>';
        const d=sl.t==='station'?STATION[sl.k]:MEUBLE[sl.k];
        return '<button class="plot'+(openSlot===si?' sel':'')+'" data-slot="'+si+'"><b>'+d.g+'</b><small>'+d.n+'</small></button>';
      }).join('')+'</div>';
      if(openSlot!==null&&!p.slots[openSlot]){
        h+=grp('置','EMPLACEMENT '+(openSlot+1));
        h+='<div class="matlist">'+Object.keys(STATION).map(k=>
          '<button class="mat" data-put="station:'+k+'"><b>'+STATION[k].g+'</b>'+STATION[k].n
          +'<small>poids '+STATION[k].p+' · '+SKILLS[STATION[k].sk].n+'</small>'
          +'<small style="color:var(--terre)">'+costTxt(STATION[k].cost)+'</small></button>').join('')
         +MK2.map(k=>'<button class="mat" data-put="meuble:'+k+'"><b>'+MEUBLE[k].g+'</b>'+MEUBLE[k].n
          +'<small>'+MEUBLE[k].d+'</small><small style="color:var(--terre)">'+costTxt(MEUBLE[k].cost)+'</small></button>').join('')
         +'</div>';
      } else if(openSlot!==null){
        const sl=p.slots[openSlot],d=sl.t==='station'?STATION[sl.k]:MEUBLE[sl.k];
        h+='<div class="card"><h3><span>'+d.g+' '+d.n+'</span><i>'+sl.t+'</i></h3>'
         +'<div class="row"><button class="btn" data-clear="1">Démonter</button></div></div>';
      }
      h+='<div class="row"><button class="btn" data-raze="'+openPlot+'">Raser le bâtiment</button></div>';
    }
  }
  /* récapitulatif du territoire */
  h+=grp('計','TERRITOIRE',S.claims.length+' cellules');
  h+='<div class="card"><div class="meta">'+PK.map(k=>PLOT[k].g+' '+PLOT[k].n+' '+countPlot(k)).join(' · ')+'</div>'
   +'<div class="meta">lits '+beds()+' pour '+S.npcs.filter(n=>n.rec).length+' résidents · étals '+countSlot('etal')
   +' · halls '+countSlot('hall')+' · défense '+Math.round(defense())+'</div>'
   +'<div class="meta">stations posées : '+Object.keys(STATION).filter(k=>countSlot(k)).map(k=>STATION[k].n).join(', ')
   +(Object.keys(STATION).some(k=>countSlot(k))?'':'aucune')+'</div></div>';
  return h;
}
let openSlot=null;
