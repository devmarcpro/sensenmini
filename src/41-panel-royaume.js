/* Sensen Mini — 41-panel-royaume.js
   Onglet pRoyaume */

function pRoyaume(){
  const rec=S.npcs.filter(n=>n.rec),c=here();
  let h='<p class="hint">La destination d\'une partie : passer d\'aventurier à bâtisseur. Hors de ta présence, rien n\'est simulé — tout se résout par formules à la semaine, et le journal te rend compte.</p>';
  h+=grp('領','TERRITOIRE',S.claims.length+' cellules');
  h+='<div class="card"><div class="meta">trésor '+Math.round(S.tresor)+' or'
   +(S.dette>0?' · <span style="color:var(--zhu)">dette '+Math.round(S.dette)+'</span>':'')
   +' · résidents '+rec.length+' ('+nAssign()+' assignés) · structures '+nStruct()+'</div>'
   +'<div class="meta">entretien hebdomadaire '+upkeep()+' or · défense '+Math.round(defense())
   +(S.gov?' · '+GOV[S.gov].n:' · campement, non reconnu')+'</div>'
   +'<div class="meta">vivres en réserve : '+(S.vivres||0)+'</div>'
   +'<div class="row"><button class="btn pri" data-claim="1" '+(c.claim?'disabled':'')+'>'
   +(c.claim?'cellule déjà revendiquée':'Revendiquer ici · '+claimCost()+' or')+'</button>'
   +'<button class="btn" data-withdraw="1" '+(S.tresor>=1?'':'disabled')+'>Retirer le trésor</button>'
   +'<button class="btn" data-deposit="100" '+(S.or>=1?'':'disabled')+'>Déposer 100</button>'
   +'<button class="btn" data-deposit="all" '+(S.or>=1?'':'disabled')+'>Tout déposer</button>'
   +'<button class="btn" data-eatv="1" '+(S.vivres>0?'':'disabled')+'>Manger un vivre</button></div></div>';
  if(myTowns().length){
    const pop=myTowns().reduce((a,t)=>a+t.pop,0);
    h+=grp('民','SUJETS',pop+' habitants dans '+myTowns().length+' villes');
    h+='<div class="card"><div class="meta">Impôt : <b>'+Math.round(S.tax*100)+' %</b> — au-delà de 18 %, la loyauté baisse de 4 par semaine et les habitants partent.</div>'
     +'<input type="range" min="0" max="35" step="1" value="'+Math.round(S.tax*100)+'" data-tax="1">'
     +'<div class="meta">revenu hebdomadaire estimé : '
     +myTowns().reduce((a,t)=>a+Math.round(t.pop*3*t.prosp*S.tax*10),0)+' or</div></div>';
    h+=myTowns().map(t=>'<div class="card"><h3><span>'+t.nom+'</span><i>'+t.type+'</i></h3>'
      +'<div class="meta">population '+t.pop+'/'+t.cap+' · loyauté '+Math.round(t.loyaute||60)
      +' · prospérité '+t.prosp.toFixed(2)+' · impôt '+Math.round(t.pop*3*t.prosp*S.tax*10)+' or/semaine</div>'
      +'<div class="meta">'+(t.loyaute<20?'<b style="color:var(--zhu)">la ville se vide</b>':'stable')+'</div></div>').join('');
  }
  if(S.claims.length){
    h+=grp('区','ZONAGE','le rôle est mécanique, pas décoratif');
    h+=S.claims.map(k=>{const cc=S.world[k];
      return '<div class="card"><h3><span>'+(cc.town||BIOME[cc.b].n)+'</span><i>'+cc.x+','+cc.y+'</i></h3>'
       +'<select data-role="'+k+'">'+Object.keys(ROLES).map(r=>'<option value="'+r+'"'
       +(cc.claim===r?' selected':'')+'>'+ROLES[r].n+'</option>').join('')+'</select>'
       +'<div class="meta">'+ROLES[cc.claim].d+'</div></div>';}).join('');
  }
  h+=grp('築','CONSTRUCTION','seize parcelles par cellule');
  h+='<div class="card"><div class="meta">'+PK.map(k=>PLOT[k].g+' '+PLOT[k].n+' '+countPlot(k)).join(' · ')+'</div>'
   +'<div class="meta">lits '+beds()+' · étals '+countSlot('etal')+' · halls '+countSlot('hall')
   +' · confort du meilleur logement +'+comfort()+'</div>'
   +'<div class="meta">Tout se bâtit dans l\'onglet 建, en matériaux.</div></div>';
  if(rec.length){
    h+=grp('職','POSTES','rendement = compétence × humeur × richesse du lieu');
    h+=rec.map(n=>'<div class="card"><h3><span>'+n.nom+'</span><i>'+JOBS[n.job].n+' · niv '+n.lv+'</i></h3>'
      +'<div class="meta">humeur '+Math.round(n.mood)+' ('+(n.home?'logé':'sans logement, −6 par semaine')+') · '
      +'facteur de rendement ×'+Math.max(.4,Math.min(1.2,n.mood/100*1.5)).toFixed(2)+'</div>'
      +'<select data-assign="'+n.id+'"><option value="">— sans affectation —</option>'
      +JK.map(j=>'<option value="'+j+'"'+(n.assign===j?' selected':'')+'>'+JOBS[j].n+' ('+SKILLS[JOBS[j].sk].n+')</option>').join('')
      +'</select>'
      +'<select data-acell="'+n.id+'"><option value="">— cellule —</option>'
      +S.claims.map(k=>'<option value="'+k+'"'+(n.cell===k?' selected':'')+'>'
      +((S.world[k].town||BIOME[S.world[k].b].n)+' ('+k+')')+'</option>').join('')+'</select></div>').join('');
  }
  if(!S.gov&&(S.claims.length+myTowns().length*3)>=8&&rec.length>=5){
    h+=grp('国','FONDER LE ROYAUME','8 cellules et 5 résidents : le seuil est atteint');
    h+='<div class="matlist">'+GK2.map(g=>'<button class="mat" data-gov="'+g+'"><b>国</b>'+GOV[g].n
      +'<small>'+GOV[g].d+'</small><small>taxe ×'+GOV[g].tax+' · défense ×'+GOV[g].def+'</small></button>').join('')+'</div>';
  } else if(!S.gov){
    h+='<div class="meta" style="margin-top:10px">Campement aux yeux du monde. Royaume reconnu à 8 cellules et 5 résidents ('
      +S.claims.length+'/8, '+rec.length+'/5) — ensuite viennent la gouvernance, les lois et la diplomatie.</div>';
  }
  h+=grp('外','ROYAUMES VOISINS','îlots de civilisation dans la wilderness');
  S.kingdoms=kingdomsNear();
  h+=S.kingdoms.map((k,i)=>'<div class="card"><h3><span>'+k.nom+'</span><i>'+GOV[k.gov].n+'</i></h3>'
    +'<div class="meta">race dominante '+RACE[k.race].n+' · réputation '+Math.round(k.rep)
    +' · trésor '+Math.round(k.or)+(k.diplo?' · <b>'+DIPLO[k.diplo]+'</b>':'')+'</div>'
    +'<div class="meta">lois : '+(k.laws.length?k.laws.map(l=>l.t+' → '+l.c).join(' · ')
      :'aucune — la loi y est décorative par construction')+'</div>'
    +(S.gov?'<div class="row">'+Object.keys(DIPLO).map(t=>'<button class="btn" data-diplo="'+i+'" data-dt="'+t+'">'
      +DIPLO[t]+'</button>').join('')+'</div>':'')+'</div>').join('');
  return h;
}
