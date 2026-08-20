/* Sensen Mini — 43-panel-sac.js
   Onglet pSac */

function pSac(){
  const ks=Object.keys(S.mat).sort((a,b)=>MAT[a].c.localeCompare(MAT[b].c)||MAT[b].d-MAT[a].d);
  let h='';
  const val=ks.reduce((a,k)=>a+MAT[k].v*S.mat[k],0);
  h+=grp('袋','MATÉRIAUX',ks.length+' types · '+val+' or de valeur brute');
  const rks=Object.keys(S.ref);
  if(rks.length){
    h+=grp('錠','FORMES TRAVAILLÉES');
    h+='<div class="matlist">'+rks.map(k=>{const p=k.split(':'),F=FORM[p[0]];
      return '<div class="mat"><b>'+F.g+'</b>'+F.n+' de '+matName(p[1])+' × '+S.ref[k]
       +'<small>dureté '+MAT[p[1]].d+(F.feu?' · +'+Math.round(F.feu*100)+'% Feu':'')+'</small></div>';}).join('')+'</div>';
  }
  const cks=Object.keys(S.comp);
  if(cks.length){
    h+=grp('部','COMPOSANTS');
    h+='<div class="matlist">'+cks.map(k=>{const c=S.comp[k];
      return '<div class="mat"><b>'+COMP[c.ct].g+'</b>'+COMP[c.ct].n+' × '+c.n
       +'<small>'+(c.f==='brut'?'brut':FORM[c.f].n)+' de '+matName(c.mk)+' · q'+c.q.toFixed(2)+' '+QNAME(c.q)+'</small></div>';}).join('')+'</div>';
  }
  h+='<div class="matlist">'+ks.map(k=>{const m=MAT[k];
    return '<div class="mat"><b style="color:'+EL[domi(matVec(k))].c+'">'+CAT[m.c].g+'</b>'+m.n+' × '+S.mat[k]
     +'<small>dureté '+m.d+' · densité '+m.de+' · '+m.v+' or'+(m.m?' · mana '+m.m:'')+'</small>'
     +(m.nutr?'<small><button class="btn" data-eat="'+k+'" style="padding:3px 7px">manger cru (+'+Math.round(m.nutr*.5)+')</button></small>':'')
     +'</div>';}).join('')+'</div>';
  return h;
}
