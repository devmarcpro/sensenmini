/* Sensen Mini — 38-panel-pnj.js
   Onglet pPnj */

function pPnj(){
  ensureNpcs();
  const list=npcsHere();
  let h='<p class="hint">L\'information est la vraie récompense de la relation, avant les prix. La fiche s\'ouvre par paliers ; à 75 un artisan t\'enseigne un tour de main que le donjon ne donne pas ; à 90 il te doit une faveur. Un PNJ hostile ne cache rien — il ne se confie simplement pas.</p>';
  const ki=kingdomHere(),LH=lawsHere();
  h+=grp('名','RÉPUTATION',REPT[repTier(repLocale())]+' ici · prix ×'+repMulPrix().toFixed(2));
  h+='<div class="card"><div class="meta">globale '+Math.round(repG())
   +(ki!==null?' · '+S.kingdoms[ki].nom+' '+Math.round(repKing(ki))
     +' · race '+RACE[S.kingdoms[ki].race].n+' '+Math.round(repRace(S.kingdoms[ki].race)):' · hors de tout royaume')
   +'</div><div class="meta">effective ici '+Math.round(repLocale())+' — les cadeaux prennent ×'
   +repMulRelation().toFixed(2)+', les prix ×'+repMulPrix().toFixed(2)+'</div>'
   +'<div class="meta">Un gain envers une race coûte un quart de ce gain à ses rivaux.</div></div>';
  if(ki!==null&&LH.laws.length){
    h+=grp('法','LOIS DE '+S.kingdoms[ki].nom.toUpperCase(),GOV[S.kingdoms[ki].gov].n);
    h+='<div class="card">'+LH.laws.map(l=>{
      const porte=l.mat&&(S.mat[l.mat]||0)>0;
      return '<div class="meta">'+(porte?'<b style="color:var(--zhu)">':'')+l.txt+(porte?'</b>':'')
       +' → '+l.c+(porte?' · <b>tu en portes '+S.mat[l.mat]+'</b>':'')+'</div>';}).join('')
     +'<div class="meta">Une infraction n\'a de conséquence que si elle est repérée : jet de Discrétion (niv '
     +lv('discretion')+') contre 13. Ce qui est interdit se vend ×1.6 ici — la contrebande paie qui sait se taire.</div></div>';
  }
  if(!list.length){
    h+='<p class="hint">Personne ici. Les villages sont marqués 村 sur la carte — 4 % des cellules.</p>';
    const rec=S.npcs.filter(n=>n.rec);
    if(rec.length)h+=grp('従','QUI TE SUIT')+rec.map(n=>'<div class="card"><h3><span>'+n.nom+'</span><i>'+JOBS[n.job].n+'</i></h3>'
      +'<div class="meta">niveau '+n.lv+' · humeur '+Math.round(n.mood)+' · en attente d\'un territoire où résider</div></div>').join('');
    return h;
  }
  h+=grp('村',(here().town||'VILLAGE').toUpperCase(),list.length+' habitants');
  h+=list.map(n=>{
    const t=relTier(n.rel),c=giftCost(n),am=astroMul(n);
    return '<div class="card"><h3><span>'+(t?n.nom:'Silhouette')+'</span>'
     +'<i>relation '+Math.round(n.rel)+' · '+TIERN[t]+'</i></h3>'
     +npcInfo(n).map(l=>'<div class="meta">'+l+'</div>').join('')
     +'<div class="meta">bourse '+Math.round(n.or)+' / '+n.orMax+' or'
     +(am!==1?' · affinité astrologique ×'+am:'')+(n.rec?' · te suit':'')+'</div>'
     +'<div class="row"><button class="btn" data-talk="'+n.id+'">Parler</button>'
     +'<button class="btn" data-gift="'+n.id+'">Offrir · '+c+' or</button>'
     +(n.rel>=50&&!n.rec?'<button class="btn pri" data-rec="'+n.id+'">Engager</button>':'')
     +'</div></div>';}).join('');
  /* commerce */
  const b=buyerHere();
  h+=grp('商','COMMERCE',b?b.nom+' · '+Math.round(b.or)+' or en bourse':'aucun acheteur');
  h+='<div class="meta" style="margin-bottom:8px">Prix = valeur × qualité × réputation. Les bourses sont finies et se rechargent de 15 % par semaine : un marchand à sec ne refuse pas, il propose un troc partiel.</div>';
  const ks=Object.keys(S.mat);
  if(ks.length)h+='<div class="matlist">'+ks.map(k=>'<button class="mat" data-sellmat="'+k+'">'
    +'<b style="color:'+EL[domi(matVec(k))].c+'">'+CAT[MAT[k].c].g+'</b>'+matName(k)+' × '+S.mat[k]
    +'<small>vendre pour '+priceMat(k,S.mat[k])+' or</small></button>').join('')+'</div>';
  if(S.items.length)h+='<div class="row" style="margin-top:8px">'+S.items.map((it,i)=>
    '<button class="btn" data-sellitem="'+i+'">'+it.nom+' · '+Math.round(itemValue(it)*repFactor())+' or</button>').join('')+'</div>';
  return h;
}
