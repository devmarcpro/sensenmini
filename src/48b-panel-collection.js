/* Sensen Mini — 48b-panel-collection.js
   Onglet pCollection : ce que le monde contient, et ce qui manque

   Une collection dit ce qui MANQUE, pas ce qu'on a. C'est la seule
   façon dont elle donne une raison de repartir. Les cases vides
   s'affichent donc en clair, avec leur nom : une collection dont on
   ignore les trous ne se remplit jamais. */

function pCollection(){
  colBalayer();
  const T=colTotal();
  let h='<p class="hint">Tout ce que le monde contient, et ce que tu en as vu. Rien ne se coche à la main : chaque ligne se remplit en jouant. Ce qui est en gris, tu ne l\'as pas encore rencontré — c\'est là que se trouve le reste du jeu.</p>';

  /* la jauge d'ensemble */
  const pc=Math.round(T.pct*100);
  h+='<div class="card"><h3><span>蒐 COLLECTION</span><i>'+T.a+' / '+T.t+'</i></h3>'
   +'<div class="meta">'+pc+' % du jeu rencontré. Chaque entrée pèse pareil, quelle que soit sa famille — sinon les '+Object.keys(MAT).length+' matières écraseraient tout le reste et le chiffre ne dirait plus rien.</div>'
   +barre(T.pct)
   +'<div class="meta">Érudition : '+colFamilles()+' famille(s) achevée(s) — <b>+'
     +Math.round(colErudition()*100)+' % d\'XP sur tout ce que tu pratiques</b>. '
     +'Une collection ne rend pas de l\'or : elle rend ce qu\'on sait faire.</div>'
   +'</div>';

  /* les familles, de la plus complète à la moins — ce qui reste à faire
     se lit alors du bas vers le haut */
  const fams=COLK.map(k=>({k,pct:colPct(k),
    a:colAvoir(k).length,t:COLLECTION[k].tout().length}))
    .sort((x,y)=>y.pct-x.pct);

  fams.forEach(f=>{
    const D=COLLECTION[f.k];
    h+=foldHead('col',f.k,D.g,D.n.toUpperCase(),
      f.a+' / '+f.t+' · '+Math.round(f.pct*100)+' %',null);
    if(!foldOpen('col',f.k,null))return;
    if(COLBON[f.k])h+='<div class="card"><div class="meta">'
      +(f.pct>=1?'<b>Acquis : ':'À l\'achèvement : ')+COLBON[f.k]+(f.pct>=1?'</b>':'')+'</div></div>';
    const eus=colAvoir(f.k);
    const tout=D.tout();
    h+='<div class="card">'+barre(f.pct)+'</div>';
    h+='<div class="matlist">'+tout.map(k=>{
      const ok=eus.includes(k);
      let nom=k;try{nom=D.nom(k);}catch(e){}
      return '<div class="mat"'+(ok?'':' style="opacity:.42"')+'>'
       +'<b'+(ok?'':' style="color:var(--dim)"')+'>'+(ok?D.g:'？')+'</b>'+nom
       +'<small>'+(ok?'rencontré':'jamais rencontré')+'</small></div>';
    }).join('')+'</div>';
  });
  return h;
}
/* une barre pleine, sans image : deux div et une largeur */
function barre(p){
  const w=Math.round(Math.max(0,Math.min(1,p))*100);
  return '<div style="height:8px;background:var(--sumi);border:1px solid var(--line2);margin:6px 0">'
   +'<div style="height:100%;width:'+w+'%;background:var(--jade)"></div></div>';
}
