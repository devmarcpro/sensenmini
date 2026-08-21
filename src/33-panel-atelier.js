/* Sensen Mini — 33-panel-atelier.js
   Onglet pAtelier */

function pAtelier(){
  let h='<p class="hint">Un objet n\'est pas une recette plate : deux composants majeurs porteurs des stats plus un slot de fixations. Le matériau est libre dans la limite des familles — et c\'est lui qui décide du vecteur Wu Xing de l\'objet. Plus la transformation est violente, plus le Feu entre.</p>';
  /* stations */
  h+=foldHead('atelier','st','台','STATIONS',carried()+' / '+capacity()+' porté','tr');
  if(foldOpen('atelier','st')){
  h+='<div class="matlist">'+Object.keys(STATION).map(k=>{
    const st2=STATION[k],ici=stationsHere().has(k),port=(S.carry||[]).includes(k);
    return '<button class="mat'+(ici?' sel':'')+'" data-carry="'+k+'">'
      +'<b>'+st2.g+'</b>'+st2.n+'<small>poids '+st2.p+' · '+SKILLS[st2.sk].n+' niv '+lv(st2.sk)+'</small>'
      +'<small style="color:'+(port?'var(--jade)':ici?'var(--terre)':'var(--dim)')+'">'
      +(port?'portée sur toi':ici?'sur cette cellule — toucher pour l\'emporter':'à bâtir dans un bâtiment')+'</small></button>';
  }).join('')+'</div>';
  h+='<div class="meta">Une station posée ne sert que sur sa cellule. Tu peux en emporter tant que le poids tient dans 30 + Force×5 = '+capacity()+'.</div>';
  /* transformations */
  /* Une matière par ligne déroulante plutôt qu'un bouton : avec cent cinquante
     matériaux, l'établi devenait un mur de trois cents boutons. */
  }
  h+=foldHead('atelier','tr','炉','TRANSFORMATION','brut → forme');
  if(foldOpen('atelier','tr')){
  let any=false,tr='';
  FK.forEach(f=>{
    const F=FORM[f];if(!hasStation(F.st))return;
    const mats=Object.keys(S.mat).filter(m=>formOk(f,m)&&S.mat[m]>=F.cost)
      .sort((a,b)=>MAT[b].d-MAT[a].d);
    if(!mats.length)return;any=true;
    const enCours=S.craft&&S.craft.t==='form'&&S.craft.f===f&&S.occ==='atelier';
    tr+='<div class="card" data-form="'+f+'"><h3><span>'+F.g+' '+F.n+'</span><i>'+STATION[F.st].n+' · '+F.cost+' unités'
      +(F.feu?' · +'+Math.round(F.feu*100)+'% Feu':'')+'</i></h3>'
      +'<select data-pick="1">'+mats.map(m=>'<option value="'+m+'"'+(enCours&&S.craft.mk===m?' selected':'')+'>'
        +matName(m)+' — '+S.mat[m]+' en sac · dureté '+MAT[m].d+'</option>').join('')+'</select>'
      +'<div class="row"><button class="btn'+(enCours?' pri':'')+'" data-tr="'+f+'">'
      +(enCours?'à l\'ouvrage':'Façonner')+'</button>'
      +'<span class="meta">'+mats.length+' matière'+(mats.length>1?'s':'')+' possible'+(mats.length>1?'s':'')+'</span></div></div>';});
  h+=any?tr:'<p class="hint">Aucune transformation possible : il faut la station et la matière.</p>';
  /* composants */
  }
  /* ===== FONTE (palier industriel, 4.2.2) =====
     Elle n'apparaît que si l'on connaît au moins une recette : tant qu'on n'a
     rien trouvé dans les ruines, chez un marchand de capitale ou à un haut
     rang de guilde, l'établi n'a pas à parler de ce qui n'existe pas encore. */
  const sues=ALK.filter(alliageConnu);
  if(sues.length){
    const pretes=sues.filter(k=>!allierBlocage(k)).length;
    h+=foldHead('atelier','al','鋳','FONTE',pretes+' / '+sues.length+' réalisable'+(pretes>1?'s':''),null);
    if(foldOpen('atelier','al',null)){
      h+='<div class="meta" style="margin-bottom:8px">Un composite est <b>statistiquement supérieur et élémentairement muet</b> : son vecteur Wu Xing est plat, donc les multiplicateurs s\'amortissent et la chaîne devient terne. Le fer pur d\'un forgeron reste meilleur pour un jeu d\'éléments — puissance brute contre expressivité. Combustible en réserve : <b>'+combustibleDispo().toFixed(1)+'</b>.</div>';
      h+=sues.map(k=>{
        const A=ALLIAGE[k],bl=allierBlocage(k);
        return '<div class="card'+(bl?' off':'')+'"><h3><span>'+A.g+' '+A.n+'</span>'
         +'<i>'+STATION[A.st].n+' · Forge '+A.lv+'</i></h3>'
         +'<div class="meta">'+A.d+'</div>'
         +'<div class="meta">'+A.de.map(([m,n])=>n+' × '+matName(m)).join(' + ')
         +' + '+A.feu+' de combustible → '+A.rend+' × '+matName(k)+'</div>'
         +vecBar(matVec(k))
         +'<div class="row"><button class="btn'+(bl?'':' pri')+'" data-allier="'+k+'" '+(bl?'disabled':'')+'>'
         +(bl||'Fondre')+'</button></div></div>';
      }).join('');
    }
  }
  h+=foldHead('atelier','co','部','COMPOSANTS','forme → composant');
  if(foldOpen('atelier','co')){
  let cp='',inconnues=0;
  Object.keys(COMP).forEach(ct=>{
    const C=COMP[ct];if(!hasStation(C.st))return;
    const opts=[];
    Object.keys(S.ref).forEach(rk=>{const p=rk.split(':');
      if(C.forms.includes(p[0])&&MAT[p[1]])opts.push([p[0],p[1],S.ref[rk]]);});
    C.raw.forEach(m=>{if(C.forms.includes('brut')&&(S.mat[m]||0)>=2)opts.push(['brut',m,S.mat[m]]);});
    const su=opts.filter(o=>recipeKnown(ct,o[1]));
    inconnues+=opts.length-su.length;
    if(!su.length)return;
    su.sort((a,b)=>MAT[b[1]].d-MAT[a[1]].d);
    const enCours=S.craft&&S.craft.t==='comp'&&S.craft.ct===ct&&S.occ==='atelier';
    cp+='<div class="card" data-comp="'+ct+'"><h3><span>'+C.g+' '+C.n+'</span><i>'+STATION[C.st].n+' · poids '+C.w
      +(C.cons?' · '+CONS[C.cons].n:'')+'</i></h3>'
      /* la liste et le bouton sur une seule ligne : douze composants a trois
         blocs chacun faisaient trois mille pixels de defilement sur telephone.
         Le compte des matieres disparait — la liste le dit deja. */
      +'<div class="row ligne"><select data-pick="1">'+su.map(([f,m,n])=>'<option value="'+f+'|'+m+'"'
        +(enCours&&S.craft.f===f&&S.craft.mk===m?' selected':'')+'>'
        +formeNom(f,m)+' — '+n+' · dureté '+MAT[m].d+'</option>').join('')+'</select>'
      +'<button class="btn'+(enCours?' pri':'')+'" data-mkc="'+ct+'">'
      +(enCours?'à l\'ouvrage':'Façonner')+'</button></div></div>';});
  h+=cp||'<p class="hint">Aucun composant façonnable pour l\'instant.</p>';
  if(inconnues)h+='<div class="meta">'+inconnues+' combinaison'+(inconnues>1?'s':'')+' de plus à ta portée, mais la recette manque — elles s\'apprennent au fil de la récolte, dans les caches de donjon et chez les artisans.</div>';
  /* assemblage */
  }
  h+=foldHead('atelier','as','組','ASSEMBLAGE','composants → objet');
  if(foldOpen('atelier','as')){
  h+='<div class="meta" style="margin-bottom:8px">Qualité finale = moyenne pondérée des composants × ton jet d\'Assemblage ('+QNAME(quality(lv('assemblage')))+' en moyenne). Un maître tire le meilleur de composants moyens ; un débutant gâche des composants excellents.</div>';
  /* Un établi n'étale pas ce qu'on ne peut pas faire : les recettes réalisables
     d'abord, les autres résumées en une ligne — on les retrouve dès qu'on a
     façonné la pièce qui manque. */
  const defs=[].concat(
    Object.keys(OUTIL).map(k=>['outil',k,OUTIL[k]]),
    Object.keys(FUNC).map(k=>['arme',k,FUNC[k]]));
  const faisables=[],manquants=[];
  defs.forEach(d=>{
    const need=d[2].comp.concat(['fixations']);
    (need.every(ct=>compsOfType(ct).length)?faisables:manquants).push(d);});
  faisables.forEach(([kind,k,def])=>{
    const need=def.comp.concat(['fixations']);
    h+='<div class="card" data-asm="'+kind+':'+k+'"><h3><span>'+def.n+'</span><i>'
      +(kind==='arme'?def.d[0]+'d'+def.d[1]+' · '+DT[def.t]+' · '+def.spd.toFixed(1)+' att/s · '+(def.h===2?'deux mains':'une main'):'outil · '+CAT[def.cat].n)+'</i></h3>';
    need.forEach((ct,i)=>{
      h+='<div class="meta">'+COMP[ct].n+' (poids '+COMP[ct].w+')</div>'
       +'<select data-slot="'+i+'">'+compsOfType(ct).map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>';});
    h+='<div class="row"><button class="btn pri" data-doasm="1">Assembler</button></div></div>';
  });
  /* armures : une seule carte, le slot se choisit dedans */
  const majors=ARMPARTS.map(ct=>compsOfType(ct)).flat();
  const sang=compsOfType('sangles'),fix=compsOfType('fixations');
  if(majors.length&&sang.length&&fix.length){
    h+='<div class="card" data-arm="'+(S.armSlot||'torse')+'"><h3><span>甲 Pièce d\'armure</span><i>zone '
      +ZONE[SLOTS.find(x=>x.k===(S.armSlot||'torse')).zone].n+' ×'+ZONE[SLOTS.find(x=>x.k===(S.armSlot||'torse')).zone].mult+'</i></h3>'
      +'<div class="meta">pièce majeure (elle décide de la construction) + sangles + fixations</div>'
      +'<div class="row" style="margin-bottom:6px">'+SLOTS.filter(s2=>s2.zone).map(sl=>
        '<button class="btn'+((S.armSlot||'torse')===sl.k?' pri':'')+'" data-armslot="'+sl.k+'">'+sl.g+' '+sl.n+'</button>').join('')+'</div>'
      +'<select data-slot="0">'+majors.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
      +'<select data-slot="1">'+sang.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
      +'<select data-slot="2">'+fix.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
      +'<div class="row"><button class="btn pri" data-doarm="1">Assembler</button></div></div>';
  } else h+='<div class="card"><div class="meta">Aucune armure assemblable : il faut une pièce majeure ('
    +ARMPARTS.map(ct=>COMP[ct].n).join(', ')+'), des sangles et des fixations.</div></div>';
  if(!faisables.length)h+='<p class="hint">Rien d\'assemblable pour l\'instant — façonne d\'abord des composants.</p>';
  if(manquants.length)h+='<div class="meta">Hors de portée faute de composants : '
    +manquants.map(d=>d[2].n+' ('+d[2].comp.filter(ct=>!compsOfType(ct).length).map(ct=>COMP[ct].n).join(', ')+')').join(' · ')+'</div>';
  }
  /* gemmes */
  const gm=GEMK.filter(k=>S.mat[k]>0);
  h+=foldHead('atelier','ge','玉','GEMMES',hasStation('tailleur')?'taille niv '+lv('taille'):'il faut un tailleur');
  if(foldOpen('atelier','ge')){
  h+='<div class="meta" style="margin-bottom:6px">Tailler choisit la spécialisation ; la qualité de taille place la valeur dans la fourchette. L\'affinité n\'a pas de nombre : elle déplace le vecteur. Plafond +15 par compétence.</div>';
  if(gm.length)h+=gm.map(mk=>'<div class="card"><h3><span>'+CAT[MAT[mk].c].g+' '+matName(mk)+' × '+S.mat[mk]+'</span><i>'+(GEMDEF[mk].el!==undefined?EL[GEMDEF[mk].el].g+' '+EL[GEMDEF[mk].el].n:GEMSPEC[GEMDEF[mk].spec].n)+'</i></h3>'
    +'<div class="row">'+gemSpecs(mk).map(sp=>'<button class="btn" data-cutgem="'+mk+':'+sp+'" '+(hasStation('tailleur')?'':'disabled')+' title="'+GEMSPEC[sp].d+'">'+GEMSPEC[sp].g+' '+GEMSPEC[sp].n+' · '+(sp==='affinite'?'+'+Math.round(gemValue(sp,quality(lv('taille')))*100)+'%':'+'+gemValue(sp,quality(lv('taille'))))+'</button>').join('')+'</div>'
    +'<div class="meta">'+gemSpecs(mk).map(sp=>GEMSPEC[sp].n+' : '+GEMSPEC[sp].d).join(' · ')+'</div></div>').join('');
  else h+='<p class="hint">Aucune gemme brute. Les montagnes cristallines, les cendres et les joailliers en ont.</p>';
  if(S.gems&&S.gems.length)h+='<div class="matlist">'+S.gems.map(g=>'<div class="mat"><b>玉</b>'+gemLabel(g)+'<small>à sertir dans 装 ÉQUIPEMENT</small></div>').join('')+'</div>';
  }
  /* recettes */
  const rk=Object.keys(S.recipes).filter(k=>{const p=k.split(':');return COMP[p[0]]&&MAT[p[1]];});
  h+=foldHead('atelier','re','巻','RECETTES APPRISES',rk.length+' · 5 niveaux chacune');
  if(foldOpen('atelier','re')){
    h+=rk.length?'<div class="matlist">'+rk.map(k=>{const p=k.split(':');
      return '<div class="mat"><b>巻</b>'+COMP[p[0]].n+'<small>'+matName(p[1])+' · niveau '+S.recipes[k]+'/5</small></div>';}).join('')+'</div>'
      :'<p class="hint">Aucune recette exotique apprise. Les matières de base se travaillent d\'office ; les autres s\'apprennent à la récolte, dans les caches de donjon et chez les artisans.</p>';
  }
  return h;
}
function itemLine(it){
  const def=it.kind==='arme'?FUNC[it.fn]:it.kind==='outil'?OUTIL[it.fn]:null;
  let l='qualité '+it.q.toFixed(2)+' '+QNAME(it.q)+' · dureté '+it.dur.toFixed(1)+' (base '+it.durBase.toFixed(1)+')';
  if(it.kind==='arme'){
    l+=' · '+def.d[0]+'d'+def.d[1]+' '+DT[def.t]+' · portée '+def.reach+' · '+(def.h===2?'deux mains':'une main');
    if(def.dist)l+=' · <b>élasticité '+(it.ela||0).toFixed(0)+'</b> — c\'est elle qui porte le trait, pas la dureté';
    if(def.shield)l+=' · bouclier';
  }
  if(it.kind==='outil')l+=' · mord jusqu\'à '+Math.floor(it.dur*2);
  if(it.kind==='armure')l+=' · '+CONS[it.cons].n+' · fort contre '+(CONS[it.cons].fort.map(t=>DT[t]).join(', ')||'—')
    +' · faible contre '+(CONS[it.cons].faible.map(t=>DT[t]).join(', ')||'—');
  return l;
}
