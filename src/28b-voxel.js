/* Sensen Mini — 28b-voxel.js
   Silhouettes voxel des créatures (GDD 12 / 12.1)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Le GDD décrit les créatures comme des assemblages : quelques
   squelettes, des parties rattachées à des points d'ancrage, et une
   recoloration par instance (12.1, G.5). Les parties sont purement
   cosmétiques — elles ne touchent à aucune statistique.

   On tient la même promesse sans un seul octet d'asset : chaque
   squelette est une liste de boîtes, chaque boîte est un pavé CSS 3D
   dont on ne dessine que les trois faces visibles depuis la caméra
   fixe. Une espèce = un squelette + une échelle. Une instance = une
   teinte (son élément dominant) + un gabarit (son rang).

   Une boîte : [x, y, z, largeur, hauteur, profondeur, teinte?]
   en unités ; y monte, x va vers l'avant du corps, z sur les côtés.
   La teinte optionnelle multiplie la luminosité (0.8 = une patte plus
   sombre, 1.25 = une crête plus claire) ; absente, la boîte prend la
   couleur de l'élément telle quelle.
   ================================================================== */
const VOX={
  /* canins, félins, cervidés : corps horizontal, quatre pattes, une queue */
  quadrupede:[[0,0,0,7,3.2,3.2],[4.4,1.4,0,2.8,2.8,2.8],
    [5.2,3,.9,.9,1.2,.9],[5.2,3,-.9,.9,1.2,.9],
    [-4.2,1.2,0,2.6,1,1,.85],[-5.8,2,0,1.4,1,1,.85],
    [2.4,-2.8,1.3,1.3,3,1.3,.8],[2.4,-2.8,-1.3,1.3,3,1.3,.8],
    [-2.4,-2.8,1.3,1.3,3,1.3,.8],[-2.4,-2.8,-1.3,1.3,3,1.3,.8]],
  /* cornus : le quadrupède, plus une ramure ou des cornes */
  cornu:[[0,0,0,7,3.2,3.2],[4.4,1.4,0,2.6,2.8,2.6],
    [5,3.4,.9,.7,2.2,.7,1.2],[5,3.4,-.9,.7,2.2,.7,1.2],
    [4.2,5,1.5,2,.7,.7,1.2],[4.2,5,-1.5,2,.7,.7,1.2],
    [-4.2,1.4,0,2,.9,.9,.85],
    [2.4,-3,1.3,1.1,3.4,1.1,.8],[2.4,-3,-1.3,1.1,3.4,1.1,.8],
    [-2.4,-3,1.3,1.1,3.4,1.1,.8],[-2.4,-3,-1.3,1.1,3.4,1.1,.8]],
  /* massifs : ours, sangliers, morses — larges, bas sur pattes */
  ursin:[[0,.4,0,7.4,4.4,4],[4.6,1.8,0,3,2.8,3],
    [5.2,3.6,1,1,1,1],[5.2,3.6,-1,1,1,1],
    [2.6,-2.6,1.6,1.8,2.4,1.8,.8],[2.6,-2.6,-1.6,1.8,2.4,1.8,.8],
    [-2.6,-2.6,1.6,1.8,2.4,1.8,.8],[-2.6,-2.6,-1.6,1.8,2.4,1.8,.8]],
  /* sauriens : long, plaqué au sol, crête dorsale */
  reptile:[[0,-1.2,0,8,2.2,3.6],[5.4,-1,0,3.6,2,2.8],
    [-5.6,-1.2,0,4,1.4,1.6,.85],[-8.6,-1.2,0,2.6,1,1,.85],
    [0,.4,0,6,.8,1,1.25],
    [2.8,-2.8,2,1.4,1.6,1.4,.8],[2.8,-2.8,-2,1.4,1.6,1.4,.8],
    [-2.6,-2.8,2,1.4,1.6,1.4,.8],[-2.6,-2.8,-2,1.4,1.6,1.4,.8]],
  /* serpents : une chaîne de segments qui s'affine, tête relevée */
  serpentin:[[4,1.6,0,2.6,1.8,2.2],[2.2,.4,.4,2.2,1.8,2],
    [.4,-1,1,2.2,1.8,2],[-1.6,-1.8,1.6,2.2,1.6,1.8,.9],
    [-3.6,-1.8,.6,2,1.4,1.6,.9],[-5.2,-1.8,-.8,1.8,1.2,1.4,.85],
    [-6.6,-1.8,-2.2,1.4,1,1.2,.85],[-7.6,-1.8,-3.4,1,.8,.8,.8]],
  /* arthropodes : scorpions, crabes — huit pattes, pinces, dard */
  arthropode:[[0,-1.4,0,4.4,1.8,3.4],[2.8,-1.4,0,2.2,1.6,2.4],
    [4.2,-1.2,1.4,1.8,1.2,1,.9],[4.2,-1.2,-1.4,1.8,1.2,1,.9],
    [-2.8,-.4,0,1.8,1.2,1.4,.85],[-4.2,.8,0,1.6,1.2,1.2,.85],
    [-5,2.2,0,1.2,1.6,1.2,1.2],
    [.8,-2.6,2.2,.7,1.6,.7,.8],[.8,-2.6,-2.2,.7,1.6,.7,.8],
    [-.6,-2.6,2.4,.7,1.6,.7,.8],[-.6,-2.6,-2.4,.7,1.6,.7,.8],
    [1.8,-2.6,2,.7,1.6,.7,.8],[1.8,-2.6,-2,.7,1.6,.7,.8]],
  /* volants : ailes déployées, corps compact, serres repliées */
  volant:[[0,0,0,3.2,3,2.8],[2.2,1.6,0,2.2,2.2,2.2],
    [3.8,1.4,0,1.4,.9,.9,1.2],
    [-.2,1,3.2,5.4,.9,3.6,.9],[-.2,1,-3.2,5.4,.9,3.6,.9],
    [-.2,1.8,5.8,3.4,.8,2.6,.8],[-.2,1.8,-5.8,3.4,.8,2.6,.8],
    [-2.6,-.4,0,2.6,1,1.2,.85],
    [.8,-2.4,.8,.8,1.6,.8,.8],[.8,-2.4,-.8,.8,1.6,.8,.8]],
  /* nuées : pas de corps, une constellation de points qui dérive */
  nuee:[[0,.4,0,1.2,1.2,1.2],[2.4,1.6,1,.9,.9,.9],[-2,2,-1.4,.9,.9,.9,.85],
    [1.4,-1.4,-2,.8,.8,.8,.85],[-1.8,-.8,2,1,1,1],[.6,3.2,-.6,.8,.8,.8,1.2],
    [-3,1,1.4,.7,.7,.7,.85],[2.8,-.4,-2.4,.7,.7,.7],[-.8,-2.4,.6,.8,.8,.8,.85],
    [3.2,2.6,.2,.6,.6,.6,1.2],[-2.6,-1.8,-1,.6,.6,.6,.85],[1,1.2,2.8,.7,.7,.7]],
  /* humains : torse, tête, deux bras, deux jambes — le squelette du GDD */
  humanoide:[[0,.6,0,3,4.2,2.2],[0,3.8,0,2.4,2.4,2.4],
    [0,-2.8,.9,1.4,3.6,1.4,.85],[0,-2.8,-.9,1.4,3.6,1.4,.85],
    [.4,.6,1.9,1.1,3.6,1.1,.9],[.4,.6,-1.9,1.1,3.6,1.1,.9]],
  /* humains coiffés : capuche, chapeau de paille, heaume */
  encapuchonne:[[0,.6,0,3,4.2,2.2],[0,3.8,0,2.4,2.4,2.4,.8],
    [0,5.2,0,3.2,.8,3.2,1.15],[-.6,4,0,1.4,2.6,2.8,1.1],
    [0,-2.8,.9,1.4,3.6,1.4,.85],[0,-2.8,-.9,1.4,3.6,1.4,.85],
    [.4,.6,1.9,1.1,3.6,1.1,.9],[.4,.6,-1.9,1.1,3.6,1.1,.9]],
  /* amorphes : une masse qui n'a pas de forme arrêtée */
  amorphe:[[0,0,0,3.2,3.2,3.2],[2.6,1.8,.9,2.2,2.2,2.2],[-2.2,1.4,-1.6,1.8,1.8,1.8],
    [1.4,-2,-2.2,1.5,1.5,1.5,.85],[-1.8,-1.6,2,2,2,2,.85],[.4,3.4,-.7,1.3,1.3,1.3,1.2],
    [-3,0,1.2,1.1,1.1,1.1],[2.2,-1,2.6,1.2,1.2,1.2],[-.6,-3.2,.4,1.4,1.4,1.4,.8]],
  /* cristallins : des prismes verticaux serrés autour d'un tronc */
  cristal:[[0,0,0,2.6,5,2.6],[2,-1.4,1.3,1.8,3,1.8,.85],[-1.8,-1.8,-1.1,1.5,2.4,1.5,.85],
    [.7,3,-1.5,1.3,2.2,1.3,1.2],[-1.3,1.6,1.8,1.1,2,1.1,1.2],[2.4,1.4,-1.6,1,1.6,1,1.2]],
};

/* Quelle espèce porte quel squelette, et à quelle échelle.
   Le squelette dit la silhouette, l'échelle dit la stature : un renard
   et un ours partagent des cousins mais pas la même place à l'écran. */
const ARCH={
  loup:['quadrupede',1],loupblanc:['quadrupede',1],renard:['quadrupede',.72],
  lynx:['quadrupede',.85],chameau:['quadrupede',1.2],
  cerf:['cornu',1],renne:['cornu',1],bouquetin:['cornu',.8],
  oursbrun:['ursin',1.15],ourspolaire:['ursin',1.2],sanglier:['ursin',.85],morse:['ursin',1.05],
  crocodile:['reptile',1.05],serpent:['serpentin',.95],scorpion:['arthropode',.9],
  aigle:['volant',.9],vautour:['volant',1],
  abeilles:['nuee',1],moustiques:['nuee',.85],
  bandit:['humanoide',1],chef:['humanoide',1.15],pillard:['humanoide',1.05],
  deserteur:['humanoide',1],braconnier:['encapuchonne',1],ermite:['encapuchonne',.95],
  rodeur:['encapuchonne',1.05],suaire:['encapuchonne',1.1],
  cendre:['amorphe',1],sylve:['amorphe',1.15],eclat:['cristal',1],
};
/* filet de sécurité : une créature sans entrée retombe sur sa catégorie */
const ARCHCAT={bete:'quadrupede',vermine:'nuee',humain:'humanoide',corrompu:'amorphe'};

function archOf(cre){
  const a=ARCH[cre];
  if(a)return a;
  const C=CREATURE[cre];
  return [(C&&ARCHCAT[C.cat])||'quadrupede',1];
}

/* Le HTML d'une silhouette. On ne pose que les trois faces qu'on voit :
   la caméra ne bouge jamais, les trois autres seraient du DOM mort. */
function voxelHtml(cre,mul){
  const [sq,ech]=archOf(cre);
  const U=5.4*ech*(mul||1);
  return (VOX[sq]||VOX.quadrupede).map(b=>{
    const w=b[3]*U,h=b[4]*U,d=b[5]*U,t=b[6];
    return '<div class="bx" style="width:'+w.toFixed(1)+'px;height:'+h.toFixed(1)+'px;'
      +(t?'filter:brightness('+t+');':'')
      +'transform:translate3d('+(b[0]*U-w/2).toFixed(1)+'px,'+(-b[1]*U-h/2).toFixed(1)+'px,'
      +(b[2]*U-d/2).toFixed(1)+'px)">'
      +'<i class="fr" style="transform:translateZ('+d.toFixed(1)+'px)"></i>'
      +'<i class="rt" style="width:'+d.toFixed(1)+'px;transform:rotateY(90deg) translateZ('+w.toFixed(1)+'px)"></i>'
      +'<i class="tp" style="height:'+d.toFixed(1)+'px;transform:rotateX(90deg)"></i>'
      +'</div>';
  }).join('');
}
/* Le gabarit d'une instance : le rang grossit la bête (G.5). */
const voxMul=e=>(e&&e.boss?1.45:e&&e.rare?1.18:1);
