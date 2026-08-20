/* Sensen Mini — 31-panel-cellule.js
   Onglet pCell */

function pCell(){
  const c=here(),v=cellVec(c),d=domi(v);
  let h='<div class="card"><h3><span>'+(c.town||BIOME[c.b].n)+'</span><i>'+c.x+','+c.y+'</i></h3>'
   +'<div class="meta">'+BIOME[c.b].n+(c.poi?' · '+POI[c.poi].n:'')+' · nettoyée '+c.cleared+' fois</div>'
   +'<div class="meta">corruption '+c.corr+' ('+(c.corr>66?'mortelle':c.corr>33?'dangereuse':'paisible')+') · fertilité '+BIOME[c.b].fert+'</div></div>';
  h+=grp('層','COUCHES DE BRUIT');
  h+='<div class="card"><div class="meta">altitude '+c.alt+' · température '+c.temp+' · humidité '+c.hum+'</div>'
   +'<div class="meta">mana '+c.mana+' · ressources '+c.res+' · végétation '+c.veg+'</div>'
   +'<div class="meta" style="margin-top:6px">Vecteur du lieu — dominante <b style="color:'+EL[d].c+'">'+EL[d].g+' '+EL[d].n+'</b></div>'
   +vecBar(v)+'</div>';
  if(c.poi==='donjon'){
    const d=c.dj;
    h+=grp('塔','DONJON',d?(d.majeur?'majeur':'mineur'):'entrée scellée');
    h+='<div class="card"><div class="meta">Le terrain de surface est remplacé par une entrée unique : ni claimable, ni cultivable. '
     +'À l\'intérieur, la difficulté et le butin ne suivent que la <b>profondeur</b> — la corruption de la région n\'y entre pas.</div>';
    if(d){
      h+='<div class="meta">'+d.nom+' — '+d.floors.length+' étages · '
       +d.floors.reduce((a,f)=>a+f.length,0)+' salles · '
       +(d.clear?'nettoyé':'exploré jusqu\'à l\'étage '+(d.f+1)+', salle '+(d.r+1))+'</div>'
       +'<div class="meta">contenu fixe : ce que tu vides ne revient pas</div>';
    } else h+='<div class="meta">Personne n\'y est encore descendu.</div>';
    if(c.djDone)h+='<div class="meta" style="color:var(--terre)">Vidé — la cellule redevient ordinaire dans '
      +Math.max(0,(c.djDone-S.day)).toFixed(2)+' jour</div>';
    h+='<div class="row"><button class="btn pri" data-dj="1" '+(d&&d.clear?'disabled':'')+'>'
     +(d&&d.clear?'donjon vidé':(d?'redescendre':'entrer'))+'</button></div></div>';
  }
  if(c.poi==='sanctuaire'){
    h+=grp('社','SANCTUAIRE');
    h+='<div class="card"><div class="meta">Un autel oublié. On y trouve des livres — une fois, puis il faut attendre une semaine.</div>'
     +'<div class="row"><button class="btn pri" data-shrine="1" '+((c.shrine||0)>S.week-1?'disabled':'')+'>'
     +((c.shrine||0)>S.week-1?'déjà fouillé cette semaine':'Fouiller l\'autel')+'</button></div></div>';
  }
  const mt=METEO[meteo(c)],T=tempC(c),Tf=feltTemp(),ts3=tempStress();
  h+=grp('天','CIEL',phase()+' · '+Math.floor(HOUR())+' h');
  h+='<div class="card"><h3><span>'+mt.g+' '+mt.n+'</span><i>'+(mt.extreme?'extrême':'')+'</i></h3>'
   +'<div class="meta">température du lieu '+Math.round(T)+'° · ressentie <b style="color:'
   +(ts3?(ts3.froid?'#3E7CB1':'#E4572E'):'var(--jade)')+'">'+Math.round(Tf)+'°</b>'
   +' · isolation portée '+armorIso().toFixed(1)+'</div>'
   +'<div class="meta">'+(ts3?(ts3.froid?'tu as froid':'tu cuis')+' — écart de '+Math.round(ts3.e)
     +'° hors de la zone de confort (5 à 30). Au-delà de 10°, tu perds des PV.'
     :'dans la zone de confort')+'</div>'
   +(foyerIci()?'<div class="meta" style="color:var(--terre)">un foyer brûle ici — le froid ne mord pas</div>':'')
   +(eclaireIci()?'<div class="meta" style="color:var(--terre)">la cellule est éclairée — la nuit n\'y attire plus les prédateurs</div>':'')
   +'<div class="meta">demain : '+METEO[meteo(c,S.day+1)].n+'</div>'
   +(isNight()?'<div class="meta" style="color:var(--zhu)">nuit — créatures plus denses et plus fortes, villages fermés</div>':'')
   +'<div class="row">'
   +(litIci()?'<button class="btn pri" data-sleep="1">Dormir</button>'
     +'<button class="btn" data-sleep="2" '+(isNight()?'':'disabled')+'>Sauter la nuit</button>'
     :'<span class="meta">pas de lit ici — bâtis-en un pour dormir</span>')
   +'</div></div>';
  h+=grp('戦','COMBAT','les créatures suivent la corruption');
  h+='<div class="card"><div class="meta">Ici : puissance ≈ '+(1+c.corr/26+c.depth*.6).toFixed(1)
   +' · le loot suit la corruption, jamais ton niveau. Nettoyer 15 créatures fait refluer le danger chaque semaine ('
   +(c.cleared||0)+'/3 purges).</div>'
   +'<div class="row"><button class="btn pri" data-occ="combat">Engager le combat</button></div>'
   +'<div class="meta" style="margin-top:8px">Seuil d\'endurance : la lame cesse de frapper en dessous, pour garder de quoi parer.</div>'
   +'<input type="range" min="0" max="80" step="5" value="'+S.thr+'" data-thr="1">'
   +'<div class="meta">seuil actuel : '+S.thr+'</div></div>';
  h+=grp('掘','STRATES','profondeur '+c.depth);
  h+='<div class="strata">'+STRATA.map((s,i)=>{
    const rk=MAT[s.rock],ok=canPierce(s.rock);
    return '<div class="str'+(i===c.depth?' cur':'')+'"><b>'+(i<=c.depth?'開':'閉')+'</b>'+s.n
     +'<i>'+s.prof+' · dureté '+rk.d+(i>c.depth?(ok?' · perçable ('+pierceNeed(i-1)+' blocs)':' · outil trop faible'):'')+'</i></div>';}).join('')+'</div>';
  if(c.depth<5){const rk=STRATA[c.depth+1].rock;
    h+='<div class="row"><button class="btn pri" data-occ="percer" '+(canPierce(rk)?'':'disabled')+'>Percer vers la strate '+(c.depth+1)+' · '+pierceNeed(c.depth)+' blocs de '+matName(rk)+'</button></div>';
    if(!canPierce(rk))h+='<div class="meta" style="color:var(--zhu)">Il faut un outil de dureté '+MAT[rk].d+' — chaque strate équipe pour la suivante.</div>';}
  return h;
}
