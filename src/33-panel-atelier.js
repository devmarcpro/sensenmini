/* Sensen Mini — 33-panel-atelier.js
   Onglet pAtelier */

function pAtelier(){
  let h='<p class="hint">Un objet n\'est pas une recette plate : deux composants majeurs porteurs des stats plus un slot de fixations. Le matériau est libre dans la limite des familles — et c\'est lui qui décide du vecteur Wu Xing de l\'objet. Plus la transformation est violente, plus le Feu entre.</p>';
  /* stations */
  h+=grp('台','STATIONS','portées : '+carried()+' / '+capacity()+' de capacité');
  h+='<div class="matlist">'+Object.keys(STATION).map(k=>{
    const st2=STATION[k],ici=stationsHere().has(k),port=(S.carry||[]).includes(k);
    return '<button class="mat'+(ici?' sel':'')+'" data-carry="'+k+'">'
      +'<b>'+st2.g+'</b>'+st2.n+'<small>poids '+st2.p+' · '+SKILLS[st2.sk].n+' niv '+lv(st2.sk)+'</small>'
      +'<small style="color:'+(port?'var(--jade)':ici?'var(--terre)':'var(--dim)')+'">'
      +(port?'portée sur toi':ici?'sur cette cellule — toucher pour l\'emporter':'à bâtir dans un bâtiment')+'</small></button>';
  }).join('')+'</div>';
  h+='<div class="meta">Une station posée ne sert que sur sa cellule. Tu peux en emporter tant que le poids tient dans 30 + Force×5 = '+capacity()+'.</div>';
  /* transformations */
  h+=grp('炉','TRANSFORMATION','matière brute → forme travaillée');
  let any=false,tr='';
  FK.forEach(f=>{
    const F=FORM[f];if(!hasStation(F.st))return;
    const mats=Object.keys(S.mat).filter(m=>formOk(f,m)&&S.mat[m]>=F.cost);
    if(!mats.length)return;any=true;
    tr+='<div class="card"><h3><span>'+F.g+' '+F.n+'</span><i>'+STATION[F.st].n+' · '+F.cost+' unités'
      +(F.feu?' · +'+Math.round(F.feu*100)+'% Feu au vecteur':'')+'</i></h3><div class="row">'
      +mats.map(m=>'<button class="btn'+(S.craft&&S.craft.t==='form'&&S.craft.f===f&&S.craft.mk===m&&S.occ==='atelier'?' pri':'')+'" data-tr="'+f+'" data-mat="'+m+'">'+matName(m)+' ('+S.mat[m]+')</button>').join('')
      +'</div></div>';});
  h+=any?tr:'<p class="hint">Aucune transformation possible : il faut la station et la matière.</p>';
  /* composants */
  h+=grp('部','COMPOSANTS','forme travaillée → composant typé');
  let cp='';
  Object.keys(COMP).forEach(ct=>{
    const C=COMP[ct];if(!hasStation(C.st))return;
    const opts=[];
    Object.keys(S.ref).forEach(rk=>{const p=rk.split(':');
      if(C.forms.includes(p[0]))opts.push([p[0],p[1],S.ref[rk]]);});
    C.raw.forEach(m=>{if(C.forms.includes('brut')&&(S.mat[m]||0)>=2)opts.push(['brut',m,S.mat[m]]);});
    if(!opts.length)return;
    cp+='<div class="card"><h3><span>'+C.g+' '+C.n+'</span><i>'+STATION[C.st].n+' · poids '+C.w
      +(C.cons?' · construction '+CONS[C.cons].n:'')+'</i></h3><div class="row">'
      +opts.map(([f,m,n])=>{const known=recipeKnown(ct,m);
        const act=S.craft&&S.craft.t==='comp'&&S.craft.ct===ct&&S.craft.f===f&&S.craft.mk===m&&S.occ==='atelier';
        return '<button class="btn'+(act?' pri':'')+'" data-mkc="'+ct+'" data-f="'+f+'" data-mat="'+m+'" '+(known?'':'disabled')+'>'
          +(known?(f==='brut'?'':FORM[f].n+' ')+matName(m)+' ('+n+')':'??? recette inconnue')+'</button>';}).join('')
      +'</div></div>';});
  h+=cp||'<p class="hint">Aucun composant façonnable pour l\'instant.</p>';
  /* assemblage */
  h+=grp('組','ASSEMBLAGE','composants → objet');
  h+='<div class="meta" style="margin-bottom:8px">Qualité finale = moyenne pondérée des composants × ton jet d\'Assemblage ('+QNAME(quality(lv('assemblage')))+' en moyenne). Un maître tire le meilleur de composants moyens ; un débutant gâche des composants excellents.</div>';
  const defs=[].concat(
    Object.keys(OUTIL).map(k=>['outil',k,OUTIL[k]]),
    Object.keys(FUNC).map(k=>['arme',k,FUNC[k]]));
  defs.forEach(([kind,k,def])=>{
    const need=def.comp.concat(['fixations']);
    const av=need.map(ct=>compsOfType(ct));
    const ok=av.every(a=>a.length);
    h+='<div class="card" data-asm="'+kind+':'+k+'"><h3><span>'+def.n+'</span><i>'
      +(kind==='arme'?def.d[0]+'d'+def.d[1]+' · '+DT[def.t]+' · '+def.spd.toFixed(1)+' att/s':'outil · '+CAT[def.cat].n)+'</i></h3>';
    need.forEach((ct,i)=>{
      h+='<div class="meta">'+COMP[ct].n+' (poids '+COMP[ct].w+')</div>';
      h+=av[i].length
        ? '<select data-slot="'+i+'">'+av[i].map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
        : '<div class="meta" style="color:var(--zhu)">manquant</div>';});
    h+='<div class="row"><button class="btn pri" data-doasm="1" '+(ok?'':'disabled')+'>Assembler</button></div></div>';
  });
  SLOTS.filter(s2=>s2.zone).forEach(sl=>{
    const majors=ARMPARTS.map(ct=>compsOfType(ct)).flat();
    const sang=compsOfType('sangles'),fix=compsOfType('fixations');
    const ok=majors.length&&sang.length&&fix.length;
    h+='<div class="card" data-arm="'+sl.k+'"><h3><span>'+sl.g+' '+sl.n+'</span><i>zone '+ZONE[sl.zone].n+' ×'+ZONE[sl.zone].mult+'</i></h3>'
      +'<div class="meta">pièce majeure (elle décide de la construction) + sangles + fixations</div>';
    if(ok){
      h+='<select data-slot="0">'+majors.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
       +'<select data-slot="1">'+sang.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
       +'<select data-slot="2">'+fix.map(ck=>'<option value="'+ck+'">'+compLabel(ck)+'</option>').join('')+'</select>'
       +'<div class="row"><button class="btn pri" data-doarm="1">Assembler</button></div>';
    } else h+='<div class="meta" style="color:var(--zhu)">il faut une pièce majeure, des sangles et des fixations</div>';
    h+='</div>';
  });
  /* gemmes */
  const gm=GEMK.filter(k=>S.mat[k]>0);
  h+=grp('玉','GEMMES',hasStation('tailleur')?'Taille de pierre niv '+lv('taille')+' → '+QNAME(quality(lv('taille'))):'il faut un tailleur de pierre');
  h+='<div class="meta" style="margin-bottom:6px">Tailler choisit la spécialisation ; la qualité de taille place la valeur dans la fourchette. L\'affinité n\'a pas de nombre : elle déplace le vecteur. Plafond +15 par compétence.</div>';
  if(gm.length)h+=gm.map(mk=>'<div class="card"><h3><span>'+CAT[MAT[mk].c].g+' '+matName(mk)+' × '+S.mat[mk]+'</span><i>'+(GEMDEF[mk].el!==undefined?EL[GEMDEF[mk].el].g+' '+EL[GEMDEF[mk].el].n:GEMSPEC[GEMDEF[mk].spec].n)+'</i></h3>'
    +'<div class="row">'+gemSpecs(mk).map(sp=>'<button class="btn" data-cutgem="'+mk+':'+sp+'" '+(hasStation('tailleur')?'':'disabled')+' title="'+GEMSPEC[sp].d+'">'+GEMSPEC[sp].g+' '+GEMSPEC[sp].n+' · '+(sp==='affinite'?'+'+Math.round(gemValue(sp,quality(lv('taille')))*100)+'%':'+'+gemValue(sp,quality(lv('taille'))))+'</button>').join('')+'</div>'
    +'<div class="meta">'+gemSpecs(mk).map(sp=>GEMSPEC[sp].n+' : '+GEMSPEC[sp].d).join(' · ')+'</div></div>').join('');
  else h+='<p class="hint">Aucune gemme brute. Les montagnes cristallines, les cendres et les joailliers en ont.</p>';
  if(S.gems&&S.gems.length)h+='<div class="matlist">'+S.gems.map(g=>'<div class="mat"><b>玉</b>'+gemLabel(g)+'<small>à sertir dans 装 ÉQUIPEMENT</small></div>').join('')+'</div>';
  /* recettes */
  const rk=Object.keys(S.recipes);
  if(rk.length){
    h+=grp('巻','RECETTES APPRISES','5 niveaux par recette');
    h+='<div class="matlist">'+rk.map(k=>{const p=k.split(':');
      return '<div class="mat"><b>巻</b>'+COMP[p[0]].n+'<small>'+matName(p[1])+' · niveau '+S.recipes[k]+'/5</small></div>';}).join('')+'</div>';
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
