/* Sensen Mini — 35-panel-magie.js
   Onglet pMagie */

function pMagie(){
  const w=weapon(),lvw=lv(w?w.fn:'epee');
  let h='<p class="hint">Les modules ne se craftent pas : ils se lisent. Un livre est consommé à la lecture, réussite ou échec. Les modificateurs altèrent le module suivant, façon Noita — et tout module lancé pose un segment dans la chaîne, exactement comme un coup d\'arme.</p>';
  /* mana */
  const cv=cellVec(here()),cd2=domi(cv);
  h+=grp('気','MANA',Math.round(S.mana)+' / '+maxMana());
  h+='<div class="card"><div class="meta">pool = 20 + Volonté×3 + Méditation×2 = 20 + '+(st('vol')*3)+' + '+(lv('meditation')*2)+'</div>'
   +'<div class="meta">régénération : '+(1+lv('meditation')*.2).toFixed(1)+' par proc · 1 chance sur 8 par seconde, 1 sur 2 au repos</div>'
   +'<div class="meta">lieu dominant <b style="color:'+EL[cd2].c+'">'+EL[cd2].g+' '+EL[cd2].n+'</b> — un module de cet élément coûte ×0.85 ici, celui qu\'il domine ×1.15</div>'
   +'<div class="row"><button class="btn'+(S.surchauffe?' pri':'')+'" data-surch="1">Surchauffe : '+(S.surchauffe?'AUTORISÉE':'refusée')+'</button></div>'
   +'<div class="meta">Lancer sans mana suffisant est permis : le déficit part en PV ×2, réduit par Contrôle du Mana (niv '+lv('mana')+').</div></div>';
  /* livres */
  h+=grp('本','LIVRES',S.books.length+' en sac');
  h+=S.books.length?S.books.map((b,i)=>{
    const dd=readDD(b),ch=Math.max(0,Math.min(100,Math.round((21-(dd-readBonus()))/20*100)));
    return '<div class="card"><h3><span>'+DOMAIN[b.dom].g+' '+(DOMAIN[b.dom].b==='grimoire'?'Grimoire':'Manuel')+' de '+DOMAIN[b.dom].n+'</span>'
     +'<i>difficulté '+b.diff+'</i></h3>'
     +'<div class="meta">DD '+dd+' · ton bonus '+readBonus().toFixed(1)+' · réussite ≈ '+ch+'% · '
     +(1+Math.floor(lv('lecture')/12))+' module(s) si tu réussis</div>'
     +'<div class="meta">Usage unique. En cas d\'échec : '+READFAIL.join(', ')+'.</div>'
     +'<div class="row"><button class="btn pri" data-read="'+i+'">Lire</button></div></div>';}).join('')
   :'<p class="hint">Aucun livre. Ils tombent au combat, d\'autant plus souvent que la corruption est haute, et se trouvent dans les sanctuaires 社.</p>';
  /* compétences */
  h+=grp('術','COMPÉTENCES',spellSlots()+' emplacements · '+moduleSlots()+' modules chacun');
  h+='<div class="meta" style="margin-bottom:8px">Les emplacements se débloquent avec le niveau d\'arme ('+(w?FUNC[w.fn].n:'—')+' niv '+lvw+') : 2 + niveau/20 compétences, 2 + niveau/25 modules.</div>';
  for(let i=0;i<spellSlots();i++){
    S.spells[i]=S.spells[i]||[];
    const sp=compileSpell(S.spells[i]);
    const el0=sp.casts.length?sp.casts[0].el:-1;
    h+='<div class="card" data-spell="'+i+'"><h3><span>術 Compétence '+(i+1)+'</span><i>'
      +(sp.casts.length?'coût '+Math.round(sp.mana*placeCost(el0))+' mana · '+sp.cd.toFixed(1)+' s':'vide')+'</i></h3>';
    for(let j=0;j<moduleSlots();j++){
      const cur=S.spells[i][j];
      h+='<select data-sp="'+i+'" data-j="'+j+'"><option value="">— vide —</option>'
        +S.modules.map((m,mi)=>MODULE[m.id].t==='passif'?'':'<option value="'+mi+'"'+(cur===mi?' selected':'')+'>'+modLabel(mi)+'</option>').join('')
        +'</select>';
    }
    if(sp.casts.length){
      h+='<div class="meta" style="margin-top:5px">'+sp.casts.map(c=>{
        const nm=MODULE[c.id].n;
        return nm+' ×'+c.count+(c.pow?' · puissance '+Math.round(c.pow):'')+(c.heal?' · soin '+Math.round(c.heal):'')
          +(c.shield?' · endurance +'+Math.round(c.shield):'')
          +(c.el>=0?' · '+EL[c.el].n:' · hors cycle')+(c.echo?' · écho '+Math.round(c.echo*100)+'%':'')
          +(c.hp?' · '+Math.round(c.hp*100)+'% PV par lancer':'');}).join('<br>')+'</div>';
      h+=vecBar(sp.casts[0].vec);
    }
    h+='</div>';
  }
  /* postures (manuels) */
  h+=grp('構','POSTURES',S.postures.length+' / '+moduleSlots()+' · modules de manuel');
  h+='<div class="card"><div class="meta">Les manuels ne s\'incantent pas : ils modifient le maniement. Ils occupent des emplacements de module sur l\'arme.</div>';
  for(let j=0;j<moduleSlots();j++){
    const cur=S.postures[j];
    h+='<select data-post="'+j+'"><option value="">— vide —</option>'
      +S.modules.map((m,mi)=>MODULE[m.id].t!=='passif'?'':'<option value="'+mi+'"'+(cur===mi?' selected':'')+'>'+modLabel(mi)+'</option>').join('')
      +'</select>';
  }
  const PA=passives();
  h+='<div class="meta" style="margin-top:6px">Effet cumulé : dégâts +'+Math.round(PA.dmg*100)+'% · perforation '+Math.round(PA.pierce*100)
   +'% · fenêtre de parade +'+Math.round(PA.win*100)+'% · garde '+Math.round(PA.gardecost*100)+'% · endurance +'+PA.regen.toFixed(1)+'/s'
   +(PA.riposte?' · riposte à la parade parfaite':'')+(PA.multi?' · multi-coup '+Math.round(PA.multi*100)+'%':'')+'</div></div>';
  /* modules connus */
  h+=grp('印','MODULES CONNUS',S.modules.length+'');
  h+=S.modules.length?'<div class="matlist">'+S.modules.map((m,i)=>{const d=MODULE[m.id];
    return '<div class="mat"><b style="color:'+(DOMAIN[m.dom].v&&Object.keys(DOMAIN[m.dom].v).length?EL[domi(domVec(m.dom))].c:'#B9A7D6')+'">'
     +DOMAIN[m.dom].g+'</b>'+d.n+'<small>'+DOMAIN[m.dom].n+' · '+d.t+' · niveau '+m.lv+'</small>'
     +'<small>'+(d.mana!==undefined?'mana '+Math.round(d.mana/sf(m.lv)):'passif')
     +(d.pow?' · puissance '+Math.round(d.pow*sf(m.lv)):'')+'</small></div>';}).join('')+'</div>'
   :'<p class="hint">Aucun module. Lis un livre.</p>';
  return h;
}
