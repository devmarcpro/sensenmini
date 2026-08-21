/* Sensen Mini — 28c-icones.js
   Icônes d'objets : la même mécanique de pavés que les créatures
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LES ICÔNES

   Un objet se présentait par un glyphe unique : 刀 pour toute arme, 甲
   pour toute armure. Une épée, une hallebarde et un arc se ressemblaient
   donc trait pour trait dans le sac, et l'on lisait le nom faute de
   pouvoir regarder.

   Une icône se compose ici comme une créature — quelques pavés, trois
   faces visibles, aucun octet d'asset. La FORME vient de ce que l'objet
   est (une épée n'est pas un marteau), la COULEUR de sa matière
   principale. Deux épées de matières différentes se distinguent donc du
   premier coup d'œil, et une hache se reconnaît sans lire.

   Les icônes sont vues petites : cinq à dix pavés suffisent, et il vaut
   mieux une silhouette franche qu'un détail qu'on ne verra pas.
   ================================================================== */

/* Une boîte : [x, y, z, largeur, hauteur, profondeur, teinte?] — même
   convention que VOX. Les objets sont posés debout, la lame vers le haut. */
const ICONE={
  /* ---- armes de mêlée : lame ou tête, garde, manche ---- */
  epee:[[0,2.6,0,.7,5.4,.22],[0,5.6,0,.5,1.2,.2,1.2],
    [0,-.4,0,2.2,.5,.5,.8],[0,-2.2,0,.5,3.2,.5,.62],[0,-4,0,.9,.6,.9,.7]],
  dague:[[0,1.6,0,.65,3.4,.2],[0,3.6,0,.45,.9,.18,1.2],
    [0,-.6,0,1.4,.4,.4,.8],[0,-2,0,.45,2.4,.45,.62]],
  masse:[[0,3.6,0,2,2,2],[0,5,0,1,.9,1,1.2],
    [0,4.6,1.2,.6,.6,.6,.85],[0,4.6,-1.2,.6,.6,.6,.85],
    [0,0,0,.55,5,.55,.62],[0,-3,0,.9,.7,.9,.7]],
  marteau:[[0,3.8,0,3,1.8,1.6],[1.9,3.8,0,.8,1.2,1.2,1.2],[-1.9,3.8,0,.8,1.2,1.2,.85],
    [0,0,0,.6,6,.6,.62],[0,-3.6,0,1,.7,1,.7]],
  hache:[[.9,4,0,2.2,2.6,.35],[.2,4.4,0,1,1.4,.5,1.15],
    [0,.6,0,.6,6,.6,.62],[0,-3,0,1,.7,1,.7]],
  hallebarde:[[0,6.4,0,.6,2,.2],[1,4.8,0,2,2.2,.35],[-.9,4.6,0,1.2,.8,.3,.85],
    [0,.2,0,.55,8.4,.55,.62],[0,-4.6,0,.9,.7,.9,.7]],
  lance:[[0,5.6,0,.8,2.6,.4],[0,7.2,0,.4,.9,.25,1.2],[0,4,0,1.2,.4,.5,.85],
    [0,.4,0,.5,8,.5,.62],[0,-4.2,0,.8,.6,.8,.7]],
  trident:[[0,6.2,0,.45,2.4,.25],[1.1,5.8,0,.45,1.8,.25,.9],[-1.1,5.8,0,.45,1.8,.25,.9],
    [0,4.6,0,2.6,.5,.4,.85],[0,.6,0,.5,7.6,.5,.62],[0,-4,0,.8,.6,.8,.7]],
  baton:[[0,5.4,0,1.6,1.6,1.6,1.25],[0,6.8,0,.8,.8,.8,1.35],
    [0,1,0,.55,8.4,.55,.7],[0,-3.6,0,.9,.6,.9,.62]],
  /* ---- armes de jet : l'arc en travers, la fronde en poche ---- */
  arc:[[0,3.6,0,.6,2.6,.6],[0,-3.6,0,.6,2.6,.6],
    [.9,1.4,0,.6,2.8,.6,.9],[.9,-1.4,0,.6,2.8,.6,.9],
    [1.4,0,0,.5,2.4,.5,.8],[-.3,0,0,.25,7.4,.25,1.25]],
  fronde:[[0,3.4,0,1.6,.6,1.2,.85],[-.9,1.2,0,.3,4,.3,1.1],[.9,1.2,0,.3,4,.3,1.1],
    [0,-1.2,0,2,1.4,.8],[0,-2.6,0,1.2,.6,.6,.8]],
  bouclier:[[0,.6,0,4,5.4,.5],[0,3.8,0,3,.9,.5,1.15],[0,-2.6,0,3,.9,.5,1.15],
    [0,.6,-.6,1.2,3,.6,.75],[0,.6,.5,1,1,.4,1.3]],
  /* ---- outils ---- */
  pioche:[[0,4.4,0,4.6,.7,.5],[2.4,3.9,0,.7,1.2,.4,.85],[-2.4,3.9,0,.7,1.2,.4,.85],
    [0,.8,0,.55,6.4,.55,.62],[0,-3.2,0,.9,.7,.9,.7]],
  hachebois:[[.9,4,0,2,2.4,.35],[.2,4.2,0,.9,1.2,.5,1.15],
    [0,.8,0,.55,5.6,.55,.62],[0,-2.8,0,.9,.7,.9,.7]],
  pelle:[[0,4.2,0,2.4,2.2,.4],[0,5.6,0,1.6,.6,.4,1.15],
    [0,.8,0,.5,5.6,.5,.62],[0,-2.6,0,1.4,.7,.7,.7]],
  serpe:[[.8,4.2,0,2.4,.6,.3],[1.8,3.2,0,.5,2,.3,.9],
    [0,.8,0,.5,5.6,.5,.62],[0,-2.6,0,.9,.7,.9,.7]],
  /* ---- armures : une silhouette par zone ---- */
  tete:[[0,1.4,0,3.2,2.6,3],[0,3,0,3.6,.7,3.4,1.15],
    [1.4,1.2,0,.6,1.6,2,.75],[0,-.4,0,2.6,.7,2.6,.8]],
  torse:[[0,.6,0,3.6,4.4,2.4],[0,3.2,0,4.4,1,3,1.1],
    [0,-2,0,3,.8,2.2,.8],[1.6,.6,0,.5,3.4,2.2,.78]],
  bras:[[0,1.6,1.2,1.4,3.6,1.4],[0,1.6,-1.2,1.4,3.6,1.4,.85],
    [0,-1,1.2,1.6,1,1.6,1.1],[0,-1,-1.2,1.6,1,1.6,.9]],
  jambes:[[0,1.4,1,1.6,4.4,1.6],[0,1.4,-1,1.6,4.4,1.6,.85],
    [0,3.8,0,3.4,.9,2.6,1.1]],
  pieds:[[.4,-.6,1,2.6,1.4,1.4],[.4,-.6,-1,2.6,1.4,1.4,.85],
    [-.6,.8,1,1.6,1.6,1.4,1.05],[-.6,.8,-1,1.6,1.6,1.4,.9]],
  /* ---- accessoires ---- */
  anneau:[[0,1.6,0,.5,.5,2.6,1.1],[0,-1.6,0,.5,.5,2.6,1.1],
    [0,0,1.4,.5,3.2,.5,.9],[0,0,-1.4,.5,3.2,.5,.9],
    [0,2.4,0,1,.9,1,1.3]],
  amulette:[[0,3,0,.3,.3,3.2,.85],[0,1.4,1.5,.3,3,.3,.85],[0,1.4,-1.5,.3,3,.3,.85],
    [0,-1,0,1.8,2.2,1.2,1.2],[0,-2.4,0,1,1,.8,1.3]],
  dos:[[0,1.6,0,3.6,5,.6],[0,4,0,2.2,.8,1,1.15],
    [1.4,-.4,0,.9,3.4,.5,.85],[-1.4,-.4,0,.9,3.4,.5,.85]],
  muni:[[.9,1.6,0,.35,4.4,.35],[.9,4.2,0,.5,.8,.25,1.2],[.9,-1.2,0,.5,.7,.6,.85],
    [-.9,1.2,0,.35,4.4,.35,.9],[-.9,3.8,0,.5,.8,.25,1.1],
    [0,-2.4,0,2.6,1.2,1.6,.7]],
  acc:[[0,0,0,2.6,2.6,2.6],[0,2,0,1.4,1.2,1.4,1.2],[1.6,-.8,0,.9,.9,.9,.85]],
  /* ---- statue : un socle, la bête au-dessus se dessine à part ---- */
  statue:[[0,-2.6,0,3.6,1.2,3.6,.7],[0,-1.4,0,2.6,1.2,2.6,.85],
    [0,1.2,0,1.8,3.4,1.8],[0,3.4,0,2.2,1,2.2,1.15]],
};

/* La couleur d'un objet : celle de sa matière principale si on la connaît,
   sinon celle de son élément dominant. Le composant le plus lourd décide —
   c'est la lame qu'on voit, pas les fixations. */
function couleurObjet(it){
  if(it&&it.parts&&it.parts.length){
    let best=null,bw=-1;
    it.parts.forEach(p=>{const w=(COMP[p.ct]&&COMP[p.ct].w)||0;if(w>bw){bw=w;best=p;}});
    if(best&&MAT[best.mk]&&MAT[best.mk].col)return MAT[best.mk].col;
  }
  return EL[domi(itemVec(it||{}))].c;
}
/* Quelle forme pour cet objet. */
function formeObjet(it){
  if(!it)return 'acc';
  if(it.kind==='statue')return 'statue';
  if((it.kind==='arme'||it.kind==='outil')&&ICONE[it.fn])return it.fn;
  if(it.kind==='armure'){
    const sl=SLOTS.find(x=>x.k===it.slot);
    if(sl&&sl.zone&&ICONE[sl.zone])return sl.zone;
  }
  if(it.slot&&ICONE[it.slot])return it.slot;
  if(it.slot==='anneau1'||it.slot==='anneau2')return 'anneau';
  if(it.slot==='acc1'||it.slot==='acc2')return 'acc';
  return it.kind==='arme'?'epee':'acc';
}
/* Le HTML d'une icône. `u` règle la taille : 2.4 pour une vignette de liste,
   4 pour une fiche. */
function iconeObjet(it,u){
  const f=formeObjet(it);
  return boitesHtml(ICONE[f]||ICONE.acc,u||2.6,couleurObjet(it),1);
}
/* La vignette complète, prête à poser dans une carte ou une liste. */
function iconeHtml(it,u,cls){
  return '<span class="ico'+(cls?' '+cls:'')+'"><span class="cam">'+iconeObjet(it,u)+'</span></span>';
}
