/* Sensen Mini — 43-panel-sac.js
   Onglet pSac */

function pSac(){
  const ks=Object.keys(S.mat).sort((a,b)=>MAT[a].c.localeCompare(MAT[b].c)||MAT[b].d-MAT[a].d);
  let h='';
  const val=ks.reduce((a,k)=>a+MAT[k].v*S.mat[k],0);
  h+=grp('袋','MATÉRIAUX',ks.length+' types · '+val+' or de valeur brute');
  const rks=Object.keys(S.ref);
  if(rks.length){
    h+=foldHead('sacx','ref','錠','FORMES TRAVAILLÉES',rks.length+(rks.length>1?' sortes':' sorte'),null);
    if(foldOpen('sacx','ref',null)){
    h+='<div class="matlist">'+rks.map(k=>{const p=k.split(':'),F=FORM[p[0]];
      return '<div class="mat"><b>'+F.g+'</b>'+formeNom(p[0],p[1])+' × '+S.ref[k]
       +'<small>dureté '+MAT[p[1]].d+(F.feu?' · +'+Math.round(F.feu*100)+'% Feu':'')+'</small></div>';}).join('')+'</div>';}
  }
  const cks=Object.keys(S.comp);
  if(cks.length){
    h+=foldHead('sacx','comp','部','COMPOSANTS',cks.length+(cks.length>1?' sortes':' sorte'),null);
    if(foldOpen('sacx','comp',null)){
    h+='<div class="matlist">'+cks.map(k=>{const c=S.comp[k];
      return '<div class="mat"><b>'+COMP[c.ct].g+'</b>'+COMP[c.ct].n+' × '+c.n
       +'<small>'+formeNom(c.f,c.mk)+' · q'+c.q.toFixed(2)+' '+QNAME(c.q)+'</small></div>';}).join('')+'</div>';}
  }
  /* par catégorie, du plus dur au plus tendre ; la pastille porte la couleur réelle du matériau */
  const cats=[...new Set(ks.map(k=>MAT[k].c))];
  /* Dix categories et cent soixante-seize matieres faisaient dix ecrans de
     defilement sur petit telephone. On plie par categorie : la premiere est
     ouverte, les autres a un doigt. Le compte et la valeur restent lisibles
     sur l'en-tete repliee — c'est souvent tout ce qu'on venait verifier. */
  cats.forEach((c,ci)=>{
    const l=ks.filter(k=>MAT[k].c===c);
    const vc=l.reduce((a,k)=>a+MAT[k].v*S.mat[k],0);
    const tot=l.reduce((a,k)=>a+S.mat[k],0);
    h+=foldHead('mat',c,CAT[c].g,CAT[c].n.toUpperCase(),
      l.length+(l.length>1?' types':' type')+' · '+tot+' unité'+(tot>1?'s':'')+' · '+vc+' or',ci===0?c:null);
    if(!foldOpen('mat',c,ci===0?c:null))return;
    h+='<div class="matlist">'+l.map(k=>{const m=MAT[k];
      return '<div class="mat"><b style="color:'+EL[domi(matVec(k))].c+'">'+CAT[m.c].g+'</b>'+(m.col?'<span class="matsw" style="background:'+m.col+'"></span>':'')+m.n+' × '+S.mat[k]
       +'<small>dureté '+m.d+' · densité '+m.de+' · '+m.v+' or'+(m.m?' · mana '+m.m:'')+(m.iso>=6?' · isolant':'')+(m.lum?' · lumineux':'')+'</small>'
       +(m.nutr?'<small><button class="btn" data-eat="'+k+'" style="padding:3px 7px">manger cru (+'+Math.round(m.nutr*.5)+')'+(m.tox?' — toxique':'')+'</button></small>':'')
       +'</div>';}).join('')+'</div>';});
  return h;
}
