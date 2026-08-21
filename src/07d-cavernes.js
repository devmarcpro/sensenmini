/* Sensen Mini — 07d-cavernes.js
   Le réseau karstique sous la carte (E.2.4)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   DESCENDRE NE DONNAIT QUE DES MATIÈRES PLUS DURES.
   Cinq strates, et la seule différence entre elles est le nom de la
   roche et sa dureté. On perce, on récolte, on perce plus bas. Il n'y
   a rien à TROUVER en profondeur — seulement à extraire.

   Le GDD décrit un réseau karstique (E.2.4) et la technique se
   transpose telle quelle, en deux dimensions au lieu de trois :

     — DEUX champs de bruit indépendants, et l'on n'est dans un tunnel
       que si les DEUX sont proches de zéro. Un seul champ à seuil
       unique donne du gruyère sans structure ; l'intersection de deux
       donne des galeries sinueuses qui se ramifient et se croisent.
       C'est la seule idée qui compte, et elle ne coûte rien de plus.

     — UN TROISIÈME champ, basse fréquence et seuillé haut, pose de
       rares GRANDES SALLES, indépendamment des galeries.

     — DES BORNES : jamais dans la première strate — « pas de trou
       béant visible depuis le ciel ».

   Ce que cela change : la profondeur a maintenant quelque chose à
   montrer. Une galerie donne les spéléothèmes que le catalogue portait
   sans que personne puisse les ramasser ailleurs qu'au karst ; une
   grande salle est un lieu, avec ce que cela suppose.
   ================================================================== */

/* Les deux « vers » : deux bruits que rien ne relie, et dont on ne garde
   que l'intersection. La profondeur entre dans la graine — un tunnel de
   la strate 2 n'est pas celui de la strate 4. */
const cavA=(x,y,d)=>noise(x,y,S.seed+d*977,81,4);
const cavB=(x,y,d)=>noise(x,y,S.seed+d*977,82,4);
const cavSalle=(x,y,d)=>noise(x,y,S.seed+d*613,83,2);

/* 0 : la roche pleine · 1 : une galerie · 2 : une grande salle */
function caverne(x,y,d){
  /* Appelee avec une CELLULE, la profondeur vient d'elle : c'est la seule
     facon d'ecrire caverne(here()) sans se tromper, et tout le jeu l'appelle
     ainsi. Un premier jet lisait le second argument meme dans ce cas, donc
     toujours la strate zero — la fonction rendait invariablement « roche
     pleine » et rien ne s'en apercevait. */
  if(typeof x==='object'&&x){const z=x;x=z.x;y=z.y;if(d===undefined)d=z.depth||0;}
  d=d===undefined?0:d;
  /* « jamais à moins de dix blocs de la surface » : la première strate
     reste pleine, sinon le sol s'ouvrirait sous les pieds. */
  if(d<2)return 0;
  if(cavSalle(x,y,d)>.88)return 2;
  const a=cavA(x,y,d),b=cavB(x,y,d);
  /* proches de zéro tous les deux — ici, proches de la moitié, parce que
     le bruit du jeu rend une valeur entre zéro et un */
  return (Math.abs(a-.5)<.085&&Math.abs(b-.5)<.085)?1:0;
}
const CAVN=['','galerie','grande salle'];
const cavNom=n=>CAVN[n]||'';

/* Les spéléothèmes : ce qui se forme aux parois d'une poche creusée. Le
   catalogue les portait déjà — stalactite, calcite, guano, salpêtre — et
   ils ne se ramassaient qu'au karst, en surface. Une galerie en donne
   partout, ce qui est leur place. */
const SPELEO=['stalactite','calcite','guano','salpetre','gypse','travertin','marbre'];
/* une grande salle donne davantage, et parfois ce qu'on ne trouve pas ailleurs */
const SPELEO_SALLE=['cristalmana','amethyste','quartz','fluorine','osfossile','ambre'];

/* Ce qu'une poche ajoute aux matières de la case : on ne remplace rien,
   on ajoute — la strate garde ce qu'elle a. */
function cavMats(c){
  const n=caverne(c);
  if(!n)return [];
  const l=SPELEO.filter(m=>MAT[m]);
  return n>=2?l.concat(SPELEO_SALLE.filter(m=>MAT[m])):l;
}
/* Une grande salle abrite parfois une eau dormante : on y pêche, au fond,
   ce qui est la seule pêche qui ne dépende ni du ciel ni de la saison. */
const cavEau=c=>caverne(c)>=2&&hash(c.x,c.y,S.seed+91,84)<.45;
