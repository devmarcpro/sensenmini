/* Sensen Mini — 10d-munitions.js
   Le carquois : ce qu'on encoche, et ce que ça change au bout du trait
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   UN EMPLACEMENT DÉCLARÉ QUE RIEN NE POUVAIT REMPLIR.
   La fiche d'équipement annonce quatorze emplacements. Le quatorzième,
   矢 MUNITIONS, était écrit dans EQS depuis le premier jour et AUCUN
   objet du jeu ne portait `slot:'muni'` — pas un butin, pas une recette,
   pas une boutique. Une ligne vide pour toujours, sous les yeux du
   joueur, dans le panneau qu'il ouvre le plus souvent.

   Or les armes de jet existent, elles : l'arc et la fronde portent
   `dist:1`, la Dextérité les sert au lieu de la Force, l'élasticité y
   remplace la dureté, et le vent dévie leurs projectiles. Tout était
   là sauf le projectile lui-même.

   CE QUE LA MUNITION AJOUTE, ET POURQUOI CE N'EST PAS UN BUFF DE PLUS.
   Une arme de mêlée est un choix qu'on fait une fois et qu'on porte.
   Le carquois est un choix qu'on refait chaque fois qu'il se vide : on
   encoche du fer contre ce qui porte armure, du barbelé contre ce qui
   régénère, du sifflant contre ce qu'on préfère voir partir. Le tireur
   gagne la seule chose qui lui manquait face au bretteur — une décision
   entre deux combats.

   ET ELLE SE VIDE. Un carquois vide ne casse pas l'arc : on tire encore,
   simplement sans rien de plus. La pénurie est le prix du privilège, et
   c'est ce qui empêche la flèche empoisonnée de devenir la seule
   réponse à tout — « une option qui gagne partout n'est pas une option ».
   ================================================================== */

const MUNI={
  flechepierre:{n:'Flèche à pointe de pierre',g:'矢',pour:'arc',lot:16,st:null,sk:'menuiserie',
    cout:[['bois',2],['roche',1],['vegetal',1]],dmg:0,pierce:0,
    d:"le trait ordinaire — il vole droit, et il ne fait rien de plus"},
  flecheferree:{n:'Flèche ferrée',g:'鏃',pour:'arc',lot:12,st:'enclume',sk:'forge',
    cout:[['bois',2],['form:lingot',1]],dmg:.18,pierce:.30,
    d:"pointe de fer — elle passe la maille là où la pierre s'écrase"},
  flechebarbelee:{n:'Flèche barbelée',g:'鉤',pour:'arc',lot:10,st:'enclume',sk:'forge',
    cout:[['bois',2],['form:lingot',1],['vegetal',2]],dmg:.08,pierce:0,
    eff:(t,f)=>addStatus(t,'saignement',7,Math.max(1,f*.30)),
    d:"elle entre facilement et ne ressort pas : la plaie reste ouverte"},
  flechevenin:{n:'Flèche à venin',g:'毒',pour:'arc',lot:8,st:'alambic',sk:'alchimie',
    cout:[['bois',2],['vegetal',4],['mineral',1]],dmg:0,pierce:0,
    eff:(t,f)=>addStatus(t,'poison',9,Math.max(1,f*.22)),
    d:"ce qu'on ne tue pas d'un trait, on le tue en attendant"},
  flechesifflante:{n:'Flèche sifflante',g:'鏑',pour:'arc',lot:10,st:null,sk:'menuiserie',
    cout:[['bois',2],['form:tanne',1]],dmg:0,pierce:0,
    eff:(t,f)=>{addStatus(t,'terreur',5,1);t.sif=1;},
    d:"le sifflement passe avant le trait — beaucoup préfèrent partir"},
  billeplomb:{n:'Bille de plomb',g:'鉛',pour:'fronde',lot:20,st:'forge',sk:'forge',
    cout:[['form:lingot',1],['mineral',2]],dmg:.28,pierce:.10,
    d:"lourde et muette : la fronde y gagne tout ce qu'elle n'avait pas"},
  billebraise:{n:'Bille de braise',g:'焔',pour:'fronde',lot:12,st:'alambic',sk:'alchimie',
    cout:[['mineral',3],['vegetal',2]],dmg:.10,pierce:0,
    eff:(t,f)=>addStatus(t,'brulure',6,Math.max(1,f*.28)),
    d:"une gangue qui éclate au choc — ce qui brûle ne se soigne pas en marchant"},
};
const MUNIK=Object.keys(MUNI);
const muniDe=k=>(S.munis&&S.munis[k])||0;

/* Ce qui bloque une fabrication, dit en clair — comme pour les consommables. */
function muniBlocage(k){
  const D=MUNI[k];
  if(!D)return 'inconnu';
  if(D.st&&!hasStation(D.st))return 'il faut '+STATION[D.st].n;
  if(!D.cout.every(([w,n])=>w.startsWith('form:')
      ? Object.keys(S.ref).filter(r=>r.startsWith(w.slice(5)+':')).reduce((a,r)=>a+S.ref[r],0)>=n
      : matsOf(w).reduce((a,m)=>a+S.mat[m],0)>=n))
    return 'il manque '+costTxt(D.cout);
  return null;
}
function muniFaire(k){
  const b=muniBlocage(k);
  if(b)return toast(b);
  const D=MUNI[k];
  if(!payCost(D.cout))return toast('Il manque '+costTxt(D.cout));
  S.munis=S.munis||{};
  S.munis[k]=muniDe(k)+D.lot;
  gainXp(D.sk,D.lot*6);
  if(typeof collecte==='function')collecte('muni',k);
  /* on encoche d'office si le carquois est vide : personne n'a envie de
     fabriquer des flèches PUIS de cliquer pour les mettre dedans */
  if(!S.carquois||!muniDe(S.carquois))S.carquois=k;
  toast(D.lot+' × '+D.n);
  return true;
}
/* Encocher : le carquois ne tient qu'une sorte à la fois. C'est ce qui fait
   du choix un choix — sinon on emporterait tout et on ne déciderait rien. */
function muniEncocher(k){
  if(!MUNI[k])return;
  if(!muniDe(k))return toast('tu n en as pas');
  S.carquois=k;
  toast('encoché : '+MUNI[k].n);
  return true;
}
/* Ce qui est réellement encoché ET utilisable avec l'arme en main. Une bille
   ne part pas d'un arc : la fronde et l'arc ne se prêtent pas leur réserve. */
function muniActive(w){
  if(!w||!S.carquois)return null;
  const D=MUNI[S.carquois];
  if(!D||D.pour!==w.fn||!muniDe(S.carquois))return null;
  return D;
}
/* On en consomme une par tir. Quand il n'en reste plus, l'arc tire quand même :
   un carquois vide n'a jamais cassé un arc. */
function muniConsommer(){
  const k=S.carquois;if(!k||!muniDe(k))return;
  S.munis[k]--;
  if(!S.munis[k]){delete S.munis[k];
    log('<span class="bd">Carquois vide — tu tires à mains nues sur ce qui reste.</span>');}
}
