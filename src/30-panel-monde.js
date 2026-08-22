/* Sensen Mini — 30-panel-monde.js
   Onglet pMonde */

/* L'ATTELAGE. Il vit dans le panneau du monde parce qu'il ne sert qu'a une
   chose : decider d'un trajet. On y lit le vent, l'usure, ce que le vehicule
   ajoute au dos, et l'on y construit. */
/* ce qu'un attelage refuse : on le dit AVANT de le batir, pas apres */
function vehTerrain(D){
  const l=[];
  if(D.eau)l.push("sur l'eau seulement");
  else{
    l.push(D.tout?'toutes terres, montagne comprise':'terrain roulant — ni montagne, ni crêtes, ni marais');
    if(D.neige)l.push('à son aise sur la neige, pénible ailleurs');
  }
  if(D.voile)l.push('dépend du vent');
  if(D.bete)l.push('exige une bête apprivoisée');
  return l.join(' · ');
}
function blocVehicule(){
  const v=vehicule(),D=vehDef();
  let h=foldHead('monde','veh','車','ATTELAGE',v?D.n+' · '+Math.round(v.pv)+'/'+D.pv:'aucun');
  if(!foldOpen('monde','veh'))return h;
  h+='<div class="card">';
  if(v){
    const ici=vehUtile();
    h+='<h3><span>'+D.g+' '+D.n+'</span><i>'+Math.round(v.pv)+' / '+D.pv+'</i></h3>'
     +'<div class="meta">'+D.d+'</div>'
     +'<div class="meta">'+(ici
        ? 'utilisable ici · voyage <b>×'+vehVitesse(1,0).toFixed(2)+'</b> vers l\'est, <b>×'
          +vehVitesse(0,1).toFixed(2)+'</b> vers le nord · <b>+'+D.cargo+'</b> de charge'
        : '<span style="color:var(--zhu)">inutilisable ici — '+vehTerrain(D)+'</span>')+'</div>'
     +(D.voile?'<div class="meta">vent de '+ventNom()+' · Navigation '+lv('navigation')+' — plus elle monte, moins le vent contraire coûte</div>':'')
     +'<div class="row"><button class="btn" data-vehrep="1" '+(v.pv<D.pv?'':'disabled')+'>Réparer · '
       +costTxt(D.cout.map(([r,n])=>[r,Math.max(1,Math.round(n/4))]))+'</button>'
     +'<button class="btn" data-vehdrop="1">Abandonner</button></div>';
  } else {
    h+='<div class="meta">Rien à l\'attelage. Une heure de marche par cellule, et tout ce que tu portes sur le dos.</div>';
  }
  h+='</div>';
  h+='<div class="matlist">'+VEHK.map(k=>{
    const D2=VEHICULE[k],b=vehBlocage(k);
    return '<button class="mat" data-vehbuild="'+k+'" '+(b?'disabled':'')+'><b>'+D2.g+'</b>'+D2.n
      +'<small>'+D2.d+'</small>'
      +'<small>voyage ×'+D2.vit.toFixed(2)+' · +'+D2.cargo+' de charge · '+D2.pv+' de structure · '
        +vehTerrain(D2)+'</small>'
      +'<small>'+costTxt(D2.cout)+' · Menuiserie '+D2.lv+'</small>'
      +'<small style="color:'+(b?'var(--zhu)':'var(--jade)')+'">'+(b||'construire')+'</small></button>';
  }).join('')+'</div>';
  return h;
}
/* ==================================================================
   LA CARTE N'AVAIT QU'UNE PLACE : DANS L'ONGLET MONDE.
   Sur un ecran d'ordinateur coupe en deux, elle doit vivre A GAUCHE,
   en permanence, pendant qu'on agit a droite — sinon on regarde ses
   menus en tournant le dos au monde. Elle sort donc du panneau et
   devient une piece qu'on monte des deux cotes, sans etre ecrite deux
   fois : ce sont les MEMES cellules, les memes clics, le meme rendu.
   ================================================================== */
const grandEcran=()=>typeof window==='object'&&window.matchMedia
  ?window.matchMedia('(min-width:1080px)').matches:false;
function carteHtml(R){
  R=R||5;
  let h='';
  h+='<div class="map" style="grid-template-columns:repeat('+(R*2+1)+',1fr)">';
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
    const x=S.pos[0]+dx,y=S.pos[1]+dy,c=cell(x,y);
    if(Math.abs(dx)<=1&&Math.abs(dy)<=1)c.seen=true;
    const dgc=c.corr>66?'#C8332B':c.corr>33?'#D9A441':'#4FA96B';
    const kk=c.seen?kingdomAt(x,y):null;
    const tt=kk?kTowns(kk).find(t2=>t2.x===x&&t2.y===y):null;
    h+='<div class="cell'+(dx===0&&dy===0?' here':'')+(c.seen?'':' unknown')+'" data-go="'+x+','+y+'"'
      +' style="background:'+(c.seen?BIOME[c.b].c:'#0F1413')+'">'
      /* « detection_filons » et « detection_tresors » (F.7). Un don ne
         revele pas la case — le brouillard reste — il en revele le POINT
         D'INTERET. On voit qu'il y a un filon la-bas sans savoir ce qu'on
         traversera pour y aller. Cela change une exploration au hasard en
         une exploration dirigee, et c'est une facon de jouer entiere. */
      +(tt?'<span class="poi" style="color:#000">'+(tt.type==='capitale'?'城':tt.type==='ville'?'市':'村')+'</span>'
        :((c.seen||(c.poi==='filon'&&don('filons'))||(c.poi==='donjon'&&don('tresors')))&&c.poi
          ?'<span class="poi"'+(c.seen?'':' style="opacity:.55"')+'>'+POI[c.poi].g+'</span>':''))
      +(kk?'<span class="kd" style="background:'+(myTowns().some(t2=>t2.x===x&&t2.y===y)?'#6FBFA0':'#C8332B')+'"></span>':'')
      +(c.seen?'<span class="dg" style="background:'+dgc+'"></span>':'?')+'</div>';
  }
  h+='</div>';
  return h;
}
/* ==================================================================
   TROIS ONGLETS POUR UNE SEULE INTENTION.
   Aller sur un autel dans MONDE, ouvrir CELLULE pour le fouiller,
   ouvrir MAGIE pour lire le grimoire qu'on vient d'y trouver : trois
   pages pour un geste et sa suite. Le jeu savait tout faire, il le
   faisait dire par trois endroits differents.

   Sous la carte vit desormais ce que la CASE OU L'ON EST permet, et
   rien d'autre : entrer dans le donjon, fouiller l'autel, faire le
   geste du lieu, pecher, lire le livre qu'on tient. Ce sont les MEMES
   boutons — memes attributs, meme code d'entree — pas des doublons :
   l'onglet CELLULE garde ses explications, la scene garde les gestes.

   Une regle stricte, sans quoi la barre redeviendrait un menu : on
   n'y met que ce qui est possible ICI, MAINTENANT. Une barre qui
   affiche huit boutons grises ne fait gagner aucun clic.
   ================================================================== */
function gestesIci(){
  const c=here(),g=[];
  if(c.poi==='donjon'){
    const d=c.dj;
    if(!(d&&d.clear))g.push(['dj="1"','塔',d?'redescendre':'entrer dans le donjon']);
  }
  if(c.poi==='sanctuaire'&&!((c.shrine||0)>S.week-1))
    g.push(['shrine="1"','社',"fouiller l'autel"]);
  if(typeof LIEU==='object'&&LIEU[c.poi]&&lieuPret(c))
    g.push(['lieu="1"',LIEU[c.poi].g,LIEU[c.poi].geste.toLowerCase()]);
  /* LE LIVRE QU'ON VIENT DE TROUVER : c'est le second onglet qu'on
     s'epargne. On lit le plus facile — celui qu'on ouvrirait a la main. */
  if((S.books||[]).length&&S.occ!=='combat'){
    let i=0;for(let k=1;k<S.books.length;k++)if(S.books[k].diff<S.books[i].diff)i=k;
    const b=S.books[i];
    g.push(['read="'+i+'"','読','lire '+(DOMAIN[b.dom]?DOMAIN[b.dom].n.toLowerCase():'')+' (DD '+readDD(b)+')']);
  }
  if(typeof pecheBlocage==='function'&&!pecheBlocage()&&S.occ!=='peche'&&S.occ!=='combat')
    g.push(['occ="peche"','漁','pêcher']);
  /* RECOLTER SANS PASSER PAR L'ONGLET. Le choix de la matiere restait un
     detour oblige alors que neuf fois sur dix on veut LA MEILLEURE qu'on
     puisse prendre ici — la plus dure que l'outil morde, qui est aussi la
     plus payante. L'onglet RECOLTE garde le choix fin ; la carte offre le
     geste evident. */
  if(S.occ!=='recolte'&&S.occ!=='combat'&&S.occ!=='percer'){
    const pris=cellMats(c).filter(m=>MAT[m]&&canHarvest(m)&&stockOf(c,m)>0);
    if(pris.length){
      pris.sort((a,b)=>MAT[b].d-MAT[a].d);
      g.push(['harv="'+pris[0]+'"','掘','récolter '+matName(pris[0])]);
    }
  }
  /* percer : la descente est un geste de la case, pas un reglage */
  if(S.occ!=='percer'&&S.occ!=='combat'&&c.depth<5){
    const rk=STRATA[Math.min(5,c.depth+1)].rock;
    if(typeof canPierce==='function'&&canPierce(rk))
      g.push(['occ="percer"','鑿','percer vers la strate '+(c.depth+1)]);
  }
  return g;
}
const gestesHtml=()=>{const g=gestesIci();
  return g.length?'<div class="row" style="margin-top:6px">'
    +g.map(([a,gl,n])=>'<button class="btn" data-'+a+'>'+gl+' '+n+'</button>').join('')+'</div>':'';};

/* les trois occupations : elles suivent la carte, ou qu'elle soit */
const carteActions=()=>'<div class="row"><button class="btn'+(S.occ==='combat'?' pri':'')+'" data-occ="combat">戦 Combattre</button>'
  +'<button class="btn'+(S.occ==='explore'?' pri':'')+'" data-occ="explore">歩 Explorer</button>'
  +'<button class="btn'+(S.occ==='repos'?' pri':'')+'" data-occ="repos">休 Se reposer</button></div>';
const carteLegende=()=>'<div class="legend">城 capitale · 市 ville · 村 village · filet gauche : territoire d\'un royaume<br>'
  +Object.keys(POI).map(k=>POI[k].g+' '+POI[k].n).join(' · ')
  +'<br>Filet inférieur : paisible · dangereuse · mortelle</div>';
function pMonde(){
  let h='<p class="hint">Une seule génération continue : la carte n\'est qu\'une fenêtre sur le monde voxel. Le danger sort des couches de bruit, jamais de la distance — et il dérive chaque semaine selon ce que tu nettoies ou laisses pourrir.</p>';
  /* sur grand ecran la carte est deja a gauche, en permanence : la repeter
     ici serait un doublon qu'il faudrait tenir a jour deux fois */
  if(!grandEcran())h+=carteActions()+gestesHtml()+carteHtml(5)+carteLegende();
  else h+='<p class="hint">La carte et les trois occupations sont à gauche, toujours visibles — tu n\'as plus à quitter un menu pour voir où tu es.</p>';
  h+=blocVehicule();
  return h;
}
