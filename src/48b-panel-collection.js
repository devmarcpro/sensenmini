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

  /* CE QUI RAPPROCHE LE PLUS DES CENT POUR CENT.
     L'onglet disait tout ce qui manque, et c'etait le probleme : trente et
     une familles, sept cent quatre-vingts entrees, et pour savoir par ou
     reprendre il fallait deplier famille apres famille jusqu'a trouver
     celle a qui il ne manquait que deux lignes. Le joueur qui vise cent
     pour cent a une intention simple — « qu'est-ce qui est le plus pres
     d'etre fini ? » — et elle coutait vingt clics.
     Elle en coute zero : c'est la premiere chose qu'on lit. */
  const reste=COLK.map(k=>({k,m:COLLECTION[k].tout().length-colAvoir(k).length}))
    .filter(f=>f.m>0).sort((x,y)=>x.m-y.m);
  if(reste.length){
    const p3=reste.slice(0,3);
    h+='<div class="card"><h3><span>近 LE PLUS PRÈS DU BOUT</span><i>'
      +(COLK.length-reste.length)+' / '+COLK.length+' achevées</i></h3>'
      +p3.map(f=>'<div class="meta"><b>'+COLLECTION[f.k].g+' '+COLLECTION[f.k].n+'</b> — il en manque '
        +f.m+(OU[f.k]?' · '+OU[f.k]:'')+'</div>').join('')
      +"<div class=\"meta\">Chaque famille achevée vaut de l'érudition, et l'érudition vaut de l'XP partout.</div>"
      +'</div>';
  }else{
    h+='<div class="card"><h3><span>全 TOUT EST LÀ</span><i>'+COLK.length+' / '+COLK.length+'</i></h3>'
      +"<div class=\"meta\">Rien ne manque nulle part. Il n'y a plus rien à voir pour la première fois.</div></div>";
  }

  /* NE MONTRER QUE CE QUI MANQUE. Une famille de cent quatre-vingt-sept
     matieres dont on en a cent soixante-dix : les dix-sept qui restent sont
     noyees. Un bouton, et la liste ne garde que le gris. */
  /* SON PROPRE TIROIR. Les familles sont un accordeon — une seule ouverte a
     la fois, S.fold.col porte laquelle. Ranger le filtre dans le meme tiroir
     l'aurait rendu exclusif des familles : l'activer aurait referme celle
     qu'on regardait. Il a donc le sien. */
  const seulManque=foldOpen('colfiltre','on',false);
  h+='<button class="grp fold'+(seulManque?' on':'')+'" data-fold="colfiltre:on">'
    +"<b>濾</b><span>N'AFFICHER QUE CE QUI MANQUE</span><em>"
    +(seulManque?'les cases vues sont masquées':'tout est affiché')+'</em><i>'
    +(seulManque?'▾':'▸')+'</i></button>';

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
    /* OU CHERCHER CE QUI MANQUE. L'onglet disait ce qui manque et rien de
       plus : pour une matiere cela suffit — on sait ou pousse un chene — mais
       devant une piece nommee, un geste de creature ou une taille de gemme,
       le joueur voit un trou sans savoir quel geste le comblerait. */
    if(OU[f.k])h+='<div class="card"><div class="meta">Où : '+OU[f.k]+'</div></div>';
    if(COLBON[f.k])h+='<div class="card"><div class="meta">'
      +(f.pct>=1?'<b>Acquis : ':'À l\'achèvement : ')+COLBON[f.k]+(f.pct>=1?'</b>':'')+'</div></div>';
    const eus=colAvoir(f.k);
    const tout=D.tout();
    h+='<div class="card">'+barre(f.pct)+'</div>';
    h+='<div class="matlist">'+tout.filter(k=>!seulManque||!eus.includes(k)).map(k=>{
      const ok=eus.includes(k);
      let nom=k;try{nom=D.nom(k);}catch(e){}
      return '<div class="mat"'+(ok?'':' style="opacity:.42"')+'>'
       +'<b'+(ok?'':' style="color:var(--dim)"')+'>'+(ok?D.g:'？')+'</b>'+nom
       +'<small>'+(ok?'rencontré':'jamais rencontré')+'</small></div>';
    }).join('')+'</div>';
    if(seulManque&&f.pct>=1)h+='<div class="meta">Cette famille est achevée — rien à afficher.</div>';
  });
  return h;
}
/* une barre pleine, sans image : deux div et une largeur */
function barre(p){
  const w=Math.round(Math.max(0,Math.min(1,p))*100);
  return '<div style="height:8px;background:var(--sumi);border:1px solid var(--line2);margin:6px 0">'
   +'<div style="height:100%;width:'+w+'%;background:var(--jade)"></div></div>';
}
