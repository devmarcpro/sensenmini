/* Sensen Mini — 36-panel-table.js
   Onglet pTable */

let selFood=[];
function pTable(){
  let h='<p class="hint">Bien manger n\'est pas de la survie, c\'est de l\'optimisation de croissance. Monter une compétence consomme son potentiel ; la table le rend. La nutrition est le multiplicateur — et un plat couvrant les cinq éléments gagne l\'harmonie daoïste ×1.2.</p>';
  const ks=Object.keys(S.food).filter(k=>S.food[k]>0);
  h+=grp('材','GARDE-MANGER',ks.length+' ingrédients');
  if(!ks.length)h+='<p class="hint">Vide. Les créatures laissent leur propre viande — son groupe de compétences dérive de leur profil — et les plantes se récoltent.</p>';
  else h+='<div class="matlist">'+ks.map(k=>{const i=foodInfo(k);
    return '<button class="mat'+(selFood.includes(k)?' sel':'')+'" data-food="'+k+'">'
     +'<b style="color:'+EL[i.el].c+'">'+EL[i.el].g+'</b>'+i.n+' × '+S.food[k]
     +'<small>nutrition '+i.nutr+(i.grp?' · potentiel '+i.grp:'')+(i.alch?' · alchimie : '+BUFFN[i.alch]:'')+'</small>'
     +'<small><span class="btn" data-eatfood="'+k+'" style="padding:3px 7px;display:inline-block">manger cru (+'+Math.round(i.nutr*.5)+')</span></small></button>';
    }).join('')+'</div>';
  /* préparation */
  const infos=selFood.map(foodInfo);
  const els=new Set(infos.map(i=>i.el));
  const q=quality(lv('cuisine'));
  const harm=els.size>=5;
  const nutr=infos.reduce((a,i)=>a+i.nutr,0)*q*(harm?1.2:1);
  h+=grp('厨','PRÉPARATION',selFood.length+' ingrédients choisis');
  h+='<div class="card"><div class="meta">'+(selFood.length?infos.map(i=>i.n).join(' + '):'rien de choisi')+'</div>'
   +'<div class="meta">éléments couverts : '+[0,1,2,3,4].map(e=>els.has(e)
     ?'<b style="color:'+EL[e].c+'">'+EL[e].g+'</b>':'<span style="opacity:.3">'+EL[e].g+'</span>').join(' ')
   +(harm?' — <b style="color:var(--terre)">harmonie des cinq ×1.2</b>':'')+'</div>'
   +'<div class="meta">Cuisine niv '+lv('cuisine')+' → qualité moyenne '+QNAME(q)+' · nutrition estimée '+Math.round(nutr)+'</div>'
   +'<div class="row"><button class="btn pri" data-cook="1" '+(selFood.length&&hasStation('cuisine')?'':'disabled')+'>'
   +(hasStation('cuisine')?'Cuisiner':'cuisine manquante')+'</button>'
   +'<button class="btn" data-distill="1" '+(selFood.length&&hasStation('alambic')?'':'disabled')+'>'
   +(hasStation('alambic')?'Distiller':'alambic manquant')+'</button>'
   +'<button class="btn" data-clearfood="1">Vider la sélection</button></div>'
   +'<div class="meta">Distiller demande une partie de créature ; chaque plante ajoutée allonge et renforce l\'effet.</div></div>';
  /* potions */
  h+=grp('薬','POTIONS',S.potions.length+'');
  h+=S.potions.length?'<div class="matlist">'+S.potions.map((p,i)=>
    '<button class="mat" data-drink="'+i+'"><b>薬</b>'+p.n+'<small>+'+p.v+' '+BUFFN[p.k]+' · '+p.dur+' s</small>'
    +'<small style="color:var(--jade)">boire</small></button>').join('')+'</div>'
   :'<p class="hint">Aucune potion.</p>';
  if(S.buffs&&S.buffs.length){
    h+=grp('効','EFFETS EN COURS');
    h+='<div class="card">'+S.buffs.map(b=>'<div class="meta">'+b.n+' — +'+b.v+' '+BUFFN[b.k]
      +' · '+Math.ceil(b.t)+' s restantes</div>').join('')+'</div>';
  }
  /* potentiel par groupe */
  h+=grp('潜','POTENTIEL','moyenne '+Math.round(avgPot())+' / 200');
  h+='<div class="matlist">'+GROUPS.map(g=>{
    const ks2=SK.filter(k=>SKILLS[k].grp===g);
    if(!ks2.length)return '';
    const m=ks2.reduce((a,k)=>a+S.sk[k].pot,0)/ks2.length;
    return '<div class="mat"><b>潜</b>'+g+'<small>potentiel moyen '+Math.round(m)+'</small>'
     +'<small style="color:'+(m>110?'var(--jade)':m<70?'var(--zhu)':'var(--dim)')+'">'
     +(m>110?'progression accélérée':m<70?'progression ralentie':'normale')+'</small></div>';}).join('')+'</div>';
  return h;
}
