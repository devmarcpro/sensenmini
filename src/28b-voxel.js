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
  /* crustacés : large, plat, sans queue. Emprunter le squelette du scorpion
     leur collait un dard qu'ils n'ont pas — la silhouette mentait. */
  crustace:[[0,-1,0,4.6,2,5.6],[0,.4,0,3.6,.9,4.4,1.15],
    [2.6,-1.2,1.1,1.4,1.2,1.2,.92],[2.6,-1.2,-1.1,1.4,1.2,1.2,.92],
    [3.8,-1.2,1.7,2,1.6,1.6,.86],[3.8,-1.2,-1.7,2,1.6,1.6,.86],
    [5.2,-1.2,2.1,1.4,1,.9,.78],[5.2,-1.2,-2.1,1.4,1,.9,.78],
    [1.3,.9,1,.6,1,.6,.6],[1.3,.9,-1,.6,1,.6,.6],
    [1,-2.6,2.6,.7,1.6,.7,.8],[1,-2.6,-2.6,.7,1.6,.7,.8],
    [-.4,-2.6,2.9,.7,1.6,.7,.8],[-.4,-2.6,-2.9,.7,1.6,.7,.8],
    [-1.8,-2.6,2.6,.7,1.6,.7,.8],[-1.8,-2.6,-2.6,.7,1.6,.7,.8]],
  /* volants : perchés, pas en vol. Une aile déployée part sur l'axe des z,
     perpendiculaire à la caméra — la perspective l'écrase en une lame
     illisible. Repliée le long du corps, elle se lit d'un coup d'œil. */
  volant:[[0,0,0,3.4,4,3],
    [.6,3,0,2.4,2.2,2.4],[2,3,0,1.2,1,.9,1.25],[1.5,3.9,0,1.1,.6,2.2,.8],
    [-.4,.6,1.9,2.8,3.4,1.1,.92],[-.4,.6,-1.9,2.8,3.4,1.1,.92],
    [-1.8,-.4,1.9,2.2,2.4,1,.78],[-1.8,-.4,-1.9,2.2,2.4,1,.78],
    [-3,-1.8,0,3.4,1,2.2,.85],[-4.8,-2.8,0,2.6,.8,1.6,.75],
    [.8,-2.8,1,1,1.6,1,.8],[.8,-2.8,-1,1,1.6,1,.8],
    [1.4,-3.5,1,1.8,.7,1.2,.7],[1.4,-3.5,-1,1.8,.7,1.2,.7]],
  /* nuées : pas de corps, une constellation de points qui dérive */
  nuee:[[0,.4,0,1.2,1.2,1.2],[2.4,1.6,1,.9,.9,.9],[-2,2,-1.4,.9,.9,.9,.85],
    [1.4,-1.4,-2,.8,.8,.8,.85],[-1.8,-.8,2,1,1,1],[.6,3.2,-.6,.8,.8,.8,1.2],
    [-3,1,1.4,.7,.7,.7,.85],[2.8,-.4,-2.4,.7,.7,.7],[-.8,-2.4,.6,.8,.8,.8,.85],
    [3.2,2.6,.2,.6,.6,.6,1.2],[-2.6,-1.8,-1,.6,.6,.6,.85],[1,1.2,2.8,.7,.7,.7]],
  /* humains : le squelette humanoïde du GDD — torse, épaules, cou, tête,
     bras coudés, jambes et pieds, et la lame que tout bandit porte bas */
  humanoide:[[0,.4,0,2.6,3.6,2.6],[0,2.6,0,2.4,1.2,3.8,.9],
    [0,3.6,0,1,.8,1,.78],[.2,5,0,2.2,2,2.2],[-.4,5.4,0,2.6,.9,2.6,.82],
    [.2,.2,1.7,1.2,1.4,1.2,.94],[.2,.2,-1.7,1.2,1.4,1.2,.94],
    [.6,-1.6,1.7,1.1,2.6,1.1,.88],[.6,-1.6,-1.7,1.1,2.6,1.1,.88],
    [0,-2.4,.7,1.3,2.4,1.3,.86],[0,-2.4,-.7,1.3,2.4,1.3,.86],
    [0,-4.4,.7,1.2,2,1.2,.8],[0,-4.4,-.7,1.2,2,1.2,.8],
    [.5,-5.6,.7,2,.8,1.3,.7],[.5,-5.6,-.7,2,.8,1.3,.7],
    [1.6,-2.2,1.7,.5,4,.5,1.3],[1.4,-.2,1.7,1.2,.7,.9,1.15]],
  /* humains coiffés : capuche rabattue, chapeau de paille, heaume —
     et pas de lame en main : braconniers, ermites et suaires n'en portent pas */
  encapuchonne:[[0,.4,0,2.6,3.6,2.6],[0,2.6,0,2.6,1.2,3.8,.9],
    [0,3.6,0,1,.8,1,.78],[.2,5,0,2.2,2,2.2,.72],
    [-.3,5.5,0,3,1,3,1.12],[-1.3,4.6,0,1.2,2.6,3,1.05],
    [.2,.2,1.7,1.2,1.4,1.2,.94],[.2,.2,-1.7,1.2,1.4,1.2,.94],
    [.6,-1.6,1.7,1.1,2.6,1.1,.88],[.6,-1.6,-1.7,1.1,2.6,1.1,.88],
    [0,-2.4,.7,1.3,2.4,1.3,.86],[0,-2.4,-.7,1.3,2.4,1.3,.86],
    [0,-4.4,.7,1.2,2,1.2,.8],[0,-4.4,-.7,1.2,2,1.2,.8],
    [.5,-5.6,.7,2,.8,1.3,.7],[.5,-5.6,-.7,2,.8,1.3,.7]],
  /* amorphes : une masse qui n'a pas de forme arrêtée */
  amorphe:[[0,0,0,3.2,3.2,3.2],[2.6,1.8,.9,2.2,2.2,2.2],[-2.2,1.4,-1.6,1.8,1.8,1.8],
    [1.4,-2,-2.2,1.5,1.5,1.5,.85],[-1.8,-1.6,2,2,2,2,.85],[.4,3.4,-.7,1.3,1.3,1.3,1.2],
    [-3,0,1.2,1.1,1.1,1.1],[2.2,-1,2.6,1.2,1.2,1.2],[-.6,-3.2,.4,1.4,1.4,1.4,.8]],
  /* cristallins : un tronc effilé et des prismes qui s'en détachent.
     La pointe s'affine vers le haut — c'est ce rétrécissement, plus que
     le nombre d'éclats, qui fait lire « cristal » et non « tas de cubes ». */
  cristal:[[0,-2.4,0,3.4,1.6,3.4,.7],
    [0,-.6,0,2.8,2.4,2.8,.9],[0,1.4,0,2,2.2,2,1.05],[0,3.2,0,1.1,1.8,1.1,1.2],
    [2,-1.4,1.2,1.6,3,1.6,.82],[2.6,.4,1.2,.9,1.6,.9,1],
    [-1.9,-1.6,-1.1,1.4,2.6,1.4,.78],[-2.3,.1,-1.1,.8,1.4,.8,.95],
    [-1.2,-1.2,1.9,1.2,2.2,1.2,.86],[1.3,-1.8,-2,1.1,1.8,1.1,.74]],
};

/* ==================================================================
   CE QU'ON RÉCOLTE
   Les scènes de récolte et d'atelier montraient un cube unique, recoloré
   selon la matière. Abattre un chêne, creuser un filon et arracher des
   herbes se ressemblaient donc trait pour trait. Une catégorie = un sujet.
   ================================================================== */
const VOXMAT={
  /* un tronc et sa frondaison */
  bois:[[0,-3,0,1.8,5,1.8,.72],[0,-5.4,0,3.4,.8,3.4,.6],
    [0,1.4,0,5.4,2.6,5.4],[0,3.4,0,3.8,1.6,3.8,1.15],
    [-2.6,.4,1.4,2,1.6,2,.88],[2.4,.8,-1.6,2.2,1.8,2.2,.88],
    [1.2,2.6,2.2,1.8,1.4,1.8,1.05]],
  /* une masse rocheuse où affleure le métal */
  metal:[[0,-2.4,0,6.4,2.6,5.4,.62],[-1,0,-.6,4.6,2.4,4,.7],
    [1.4,.6,1,2.6,2.2,2.6,.78],
    [2,1.6,1.2,1.4,1.2,1.4,1.3],[-1.6,1.2,-1.6,1.1,1,1.1,1.25],
    [.2,2.2,-.4,.9,.9,.9,1.35],[-2.8,.4,1.6,1,.9,1,1.2]],
  /* un bloc anguleux, sans veine */
  roche:[[0,-2.2,0,6,2.8,5.2,.66],[-.6,.4,-.4,4.4,2.6,3.8,.82],
    [1,2.2,.8,2.6,1.8,2.4],[-1.8,2,-1.2,1.6,1.2,1.6,.9],
    [2.6,-.6,-2,1.8,1.6,1.6,.74]],
  /* un monticule meuble */
  terre:[[0,-2.6,0,6.6,2,6,.7],[0,-1,0,4.8,1.6,4.4,.85],
    [.4,.2,-.2,3,1.2,2.8],[-1.4,.4,1.2,1.6,.8,1.6,1.1]],
  /* une touffe basse */
  vegetal:[[0,-2.8,0,3.4,1,3.4,.6],
    [0,-1,0,2.6,2.4,2.6],[-1.8,-.6,1,1.4,2.6,1.4,.9],[1.8,-.8,-1.2,1.4,2.2,1.4,.9],
    [.6,1.2,.6,1.8,1.8,1.8,1.15],[-1.2,.8,-1.6,1.2,1.6,1.2,1.05],
    [2.2,.4,1.4,1,1.4,1,.95]],
  /* une flaque, un bassin */
  liquide:[[0,-2.8,0,6.4,.9,6,.7],[0,-2,0,4.6,.9,4.4,.95],
    [.6,-1.3,-.4,2.6,.8,2.4,1.2],[-1.6,-1.3,1.4,1.4,.7,1.4,1.1]],
  /* des cristaux dans leur gangue */
  mineral:[[0,-2.4,0,5.4,2.2,4.8,.6],[-.8,-.6,-.4,3.6,2,3.2,.72],
    [1.2,.8,.8,1.6,2.4,1.6,1.1],[-1.4,.6,-1.2,1.2,1.8,1.2,1.25],
    [2.2,.2,-1.4,1,1.4,1,1.15]],
  gemme:[[0,-2.6,0,4.4,1.6,4,.58],
    [0,-.4,0,2,2.8,2,1.1],[1.6,-1,1.2,1.4,2,1.4,.9],[-1.5,-1.2,-1,1.2,1.6,1.2,1.25],
    [.4,1.6,-.8,1,1.4,1,1.3]],
  /* des os pris dans la roche */
  fossile:[[0,-2.6,0,5.8,2,5.2,.64],[-.6,-.8,0,4,1.6,3.4,.76],
    [-2,.4,.6,4.4,.8,.8,1.2],[1.4,.4,-.8,2.6,.8,.8,1.15],
    [1.6,1.2,.8,.8,.8,2.6,1.25],[-.4,1,-1.6,.7,.7,.7,1.1]],
  /* nuage, givre, ce qui tombe du ciel */
  meteo:[[0,.4,0,4.4,1.8,3.6,1.05],[2.4,1.2,.8,2.4,1.6,2.2,1.2],
    [-2.2,.8,-1,2,1.4,2,.95],[.6,2,-.6,1.8,1.2,1.8,1.3],
    [-.8,-1.6,.8,1,1,1,.8],[1.4,-2.4,-.6,.8,.8,.8,.7]],
};
/* Le sujet d'une récolte : la catégorie décide de la forme, la matière de
   la couleur. Un chêne n'a plus la même silhouette qu'un filon de fer. */
function matHtml(mk,coul){
  const C=MAT[mk]&&MAT[mk].c;
  return boitesHtml(VOXMAT[C]||VOXMAT.roche,5.4,coul||'#7E9187',1);
}

/* Quelle espèce porte quel squelette, et à quelle échelle.
   Le squelette dit la silhouette, l'échelle dit la stature : un renard
   et un ours partagent des cousins mais pas la même place à l'écran. */
const ARCH={
  loup:['quadrupede',1],loupblanc:['quadrupede',1],renard:['quadrupede',.72],
  lynx:['quadrupede',.85],chameau:['quadrupede',1.2],
  cerf:['cornu',1],renne:['cornu',1],bouquetin:['cornu',.8],
  oursbrun:['ursin',1.15],ourspolaire:['ursin',1.2],sanglier:['ursin',.85],morse:['ursin',1.05],
  crocodile:['reptile',1.05],serpent:['serpentin',.95],scorpion:['arthropode',.9],
  aigle:['volant',1],vautour:['volant',1.05],
  abeilles:['nuee',1],moustiques:['nuee',.85],
  bandit:['humanoide',1],chef:['humanoide',1.15],pillard:['humanoide',1.05],
  deserteur:['humanoide',1],braconnier:['encapuchonne',1],ermite:['encapuchonne',.95],
  rodeur:['encapuchonne',1.05],suaire:['encapuchonne',1.1],
  cendre:['amorphe',1],sylve:['amorphe',1.15],eclat:['cristal',1],
  crabe:['crustace',.8],crabetour:['crustace',1.45],
  goeland:['volant',.75],harfang:['volant',.85],heron:['volant',.9],
  phoque:['ursin',.85],mammouth:['ursin',1.55],
  glouton:['quadrupede',.8],salamandre:['reptile',.7],sangsues:['nuee',.9],
  naufrageur:['humanoide',1],mercenaire:['humanoide',1.1],colosse:['humanoide',1.5],
  cauchemar:['amorphe',1.35],
};
/* filet de sécurité : une créature sans entrée retombe sur sa catégorie */
const ARCHCAT={bete:'quadrupede',vermine:'nuee',humain:'humanoide',corrompu:'amorphe'};

function archOf(cre){
  const a=ARCH[cre];
  if(a)return a;
  const C=CREATURE[cre];
  return [(C&&ARCHCAT[C.cat])||'quadrupede',1];
}

/* Teinter une couleur à la main plutôt qu'avec un filtre CSS.

   Ce détail décide de tout le rendu : la propriété CSS « filter » aplatit
   le contexte 3D de l'élément qui la porte. Un pavé aplati sort de l'ordre
   de profondeur — il se dessine à son rang dans le DOM au lieu de sa place
   dans l'espace, et la bête part en morceaux flottants. On calcule donc
   chaque teinte nous-mêmes, et pas un seul filtre ne touche la silhouette.

   t < 1 assombrit vers le noir, t > 1 éclaircit vers le blanc. */
function teinte(hex,t){
  const n=parseInt(hex.slice(1),16);
  let r=n>>16&255,v=n>>8&255,b=n&255;
  const m=t<=1?x=>x*t:x=>x+(255-x)*Math.min(1,t-1);
  r=Math.round(m(r));v=Math.round(m(v));b=Math.round(m(b));
  return '#'+((1<<24)+(r<<16)+(v<<8)+b).toString(16).slice(1);
}

/* Poser une liste de pavés. On ne dessine que les trois faces qu'on voit :
   la caméra ne bouge jamais, les trois autres seraient du DOM mort.

   La septième valeur d'un pavé est soit un nombre — une teinte relative à
   la couleur de base — soit une couleur explicite, ce dont le joueur a
   besoin puisque chaque pièce d'armure a la sienne.

   sens vaut -1 pour retourner la silhouette : les deux combattants doivent
   se faire face, et négocier x est plus honnête qu'un scaleX(-1) qui
   échangerait les faces éclairée et ombrée. */
function boitesHtml(liste,U,base,sens){
  const s=sens||1;
  return liste.map(b=>{
    const w=b[3]*U,h=b[4]*U,d=b[5]*U,t=b[6];
    const c=typeof t==='string'?t:(t?teinte(base,t):base);
    /* Les trois faces, posées depuis le coin arrière-haut-gauche du pavé.
       La face de droite demande rotateY(-90deg) et non +90 : en CSS, un
       rotateY(90deg) envoie l'axe +x du calque vers -z, si bien que la face
       se posait derrière le pavé au lieu d'à côté. Sur un cube quasi
       régulier le décalage passe inaperçu ; sur un pavé profond — une
       épaule, un tronc d'arbre — la face part en dalle détachée. */
    return '<div class="bx" style="width:'+w.toFixed(1)+'px;height:'+h.toFixed(1)+'px;'
      +'transform:translate3d('+(s*b[0]*U-w/2).toFixed(1)+'px,'+(-b[1]*U-h/2).toFixed(1)+'px,'
      +(b[2]*U-d/2).toFixed(1)+'px)">'
      +'<i style="background:'+c+';transform:translateZ('+d.toFixed(1)+'px)"></i>'
      +'<i style="background:'+teinte(c,.58)+';width:'+d.toFixed(1)+'px;'
        +'transform:translate3d('+w.toFixed(1)+'px,0,0) rotateY(-90deg)"></i>'
      +'<i style="background:'+teinte(c,1.3)+';height:'+d.toFixed(1)+'px;'
        +'transform:rotateX(90deg)"></i>'
      +'</div>';
  }).join('');
}
function voxelHtml(cre,mul,coul,sens){
  const [sq,ech]=archOf(cre);
  return boitesHtml(VOX[sq]||VOX.quadrupede,5.4*ech*(mul||1),coul||'#7E9187',sens);
}
/* Le gabarit d'une instance : le rang grossit la bête (G.5). */
const voxMul=e=>(e&&e.boss?1.45:e&&e.rare?1.18:1);

/* ==================================================================
   LE JOUEUR
   Même squelette humanoïde, mais chaque pièce prend la couleur de ce
   qu'elle porte réellement : l'élément dominant du casque, de la
   cuirasse, des jambières. Sans armure, on voit la peau et l'étoffe.
   L'arme suit la prise en main (10-craft, grip()) — une lame courte,
   une longue à deux mains, un arc, un bâton, un bouclier au bras.
   ================================================================== */
const PEAU={humain:'#C0A084',elfe:'#B6C7A6',nain:'#BE9A78',
  sylvide:'#9DBE86',cendreux:'#A39892',echomorphe:'#B2AEC4'};
const ETOFFE='#8A8574';

/* la couleur d'une pièce : son élément dominant, ou l'étoffe si nue */
function coulPiece(it,defaut){
  return it?teinte(EL[domi(itemVec(it))].c,.92):defaut;
}
function heroHtml(U){
  U=U||5.2;
  const peau=PEAU[S.race]||PEAU.humain;
  const tor=coulPiece(S.eq.torse,ETOFFE),jam=coulPiece(S.eq.jambes,teinte(ETOFFE,.88));
  const bra=coulPiece(S.eq.bras,peau),pie=coulPiece(S.eq.pieds,teinte(ETOFFE,.7));
  const g=grip(),arme=S.eq.main1,sec=S.eq.main2;
  const b=[
    [0,.4,0,2.6,3.6,2.6,tor],[0,2.6,0,2.4,1.2,3.8,teinte(tor,.9)],
    [0,3.6,0,1,.8,1,teinte(peau,.85)],[.2,5,0,2.2,2,2.2,peau],
    [.2,.2,1.7,1.2,1.4,1.2,bra],[.2,.2,-1.7,1.2,1.4,1.2,bra],
    [.6,-1.6,1.7,1.1,2.6,1.1,teinte(bra,.94)],[.6,-1.6,-1.7,1.1,2.6,1.1,teinte(bra,.94)],
    [0,-2.4,.7,1.3,2.4,1.3,jam],[0,-2.4,-.7,1.3,2.4,1.3,jam],
    [0,-4.4,.7,1.2,2,1.2,teinte(jam,.9)],[0,-4.4,-.7,1.2,2,1.2,teinte(jam,.9)],
    [.5,-5.6,.7,2,.8,1.3,pie],[.5,-5.6,-.7,2,.8,1.3,pie],
  ];
  /* le casque recouvre la tête ; sans casque, une tignasse */
  if(S.eq.tete)b.push([.2,5.2,0,2.5,2.2,2.5,coulPiece(S.eq.tete)],
                      [1.3,5.1,0,.7,1.4,1.6,teinte(coulPiece(S.eq.tete),.7)]);
  else b.push([-.4,5.4,0,2.6,.9,2.6,teinte(peau,.68)]);
  /* la cape flotte derrière — c'est elle qui donne de l'allure à la silhouette */
  if(S.eq.dos)b.push([-1.5,.6,0,.9,5.4,3.2,coulPiece(S.eq.dos)],
                     [-2.1,-2.2,0,.8,1.4,2.6,teinte(coulPiece(S.eq.dos),.82)]);
  /* l'arme : sa longueur dit la prise, sa couleur dit son matériau */
  const cArme=arme?teinte(EL[domi(itemVec(arme))].c,1.02):null;
  if(g.k==='dist'){
    /* l'arc se tient devant, en travers : trois segments et la corde */
    b.push([1.9,.4,1.9,.7,2.6,.7,cArme],[2.5,2.2,1.9,.7,1.4,.7,teinte(cArme,.9)],
           [2.5,-1.4,1.9,.7,1.4,.7,teinte(cArme,.9)],[1.5,.4,1.9,.3,5.6,.3,'#E6E2D6']);
  }else if(g.k==='deuxmains'){
    b.push([1.9,-.6,1.2,.6,7,.6,cArme],[1.7,-2.6,1.2,1.6,.7,1.1,teinte(cArme,.8)]);
  }else if(arme){
    b.push([1.6,-2.2,1.7,.5,4,.5,cArme],[1.4,-.2,1.7,1.2,.7,.9,teinte(cArme,.85)]);
  }
  /* la main gauche : un bouclier, ou la seconde lame */
  if(g.k==='bouclier')b.push([1.2,-.4,-2.1,.6,4,3.4,coulPiece(sec)]);
  else if(g.k==='dualwield')b.push([1.5,-2,-1.7,.5,3.4,.5,coulPiece(sec)]);
  return boitesHtml(b,U,peau,1);
}

/* La signature de la tenue : tant qu'elle ne bouge pas, on ne recompose rien. */
const heroSig=()=>[S.race,grip().k].concat(
  ["tete","torse","bras","jambes","pieds","dos","main1","main2"]
    .map(k=>{const it=S.eq[k];return it?(it.nom||"?")+domi(itemVec(it)):"-";})).join("|");
