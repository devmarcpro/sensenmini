/* Sensen Mini — 01-core.js
   Constantes Wu Xing, aléatoire, bruit — les briques que tout le reste utilise
   Chargé dans l'ordre par index.html ; portée globale partagée. */

const EL=[{k:'bois',g:'木',n:'Bois',c:'#4FA96B'},{k:'feu',g:'火',n:'Feu',c:'#E4572E'},
          {k:'terre',g:'土',n:'Terre',c:'#D9A441'},{k:'metal',g:'金',n:'Métal',c:'#C9B88A'},
          {k:'eau',g:'水',n:'Eau',c:'#3E7CB1'}];
/* cycles : engendrement 生 (Bois→Feu→Terre→Métal→Eau) et domination 克 */
const gen=i=>(i+1)%5, dom=i=>(i+2)%5;
const V=o=>{const v=[0,0,0,0,0];for(const k in o)v[+k]=o[k];return v;};
const norm=v=>{const s=v.reduce((a,b)=>a+b,0)||1;return v.map(x=>x/s);};
/* un vecteur qu'on va garder en sauvegarde : quatre décimales, pas dix-sept */
const rnd4=v=>v.map(x=>Math.round(x*1e4)/1e4);
const domi=v=>v.indexOf(Math.max(...v));
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
/* MELANGER POUR DE VRAI. `liste.sort(() => Math.random() - .5)` a l'air d'un
   melange et n'en est pas un : un comparateur incoherent ne permet a aucun
   algorithme de tri de rendre une permutation uniforme. Mesure sur trente
   elements, les trois premiers tires : le premier declare sortait 21,5 % du
   temps, le dix-septieme 6,4 % — trois fois et demi d'ecart, decide par
   l'ORDRE DE DECLARATION et rien d'autre. Les affixes du butin, les gemmes
   du joaillier et les semences de l'epicier se tiraient ainsi. Fisher-Yates
   ne coute rien et ne ment pas. */
function melange(l){
  const a=l.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
/* n elements distincts d'une liste, sans repetition et sans biais */
const tirerN=(l,n)=>melange(l).slice(0,n);

/* ==================================================================
   UN COMPTE RECOPIE FINIT TOUJOURS PAR MENTIR.
   Le conseil des gestes en listait six quand la table en portait
   quatorze ; l'onglet COMBAT annoncait « trois postures » alors qu'il
   y en a quatre depuis longtemps. Ce sont des COPIES, et une copie ne
   se met pas a jour toute seule.

   La prose du jeu s'ecrit en toutes lettres — « trois postures » se
   lit mieux que « 3 postures » — mais le nombre doit venir de la
   table. Ces deux lignes suffisent a rendre les deux compatibles.
   ================================================================== */
const NOMBRES=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix',
  'onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf','vingt'];
const nomNombre=n=>NOMBRES[n]!==undefined?NOMBRES[n]:String(n);
const nomNombreCap=n=>{const s=nomNombre(n);return s.charAt(0).toUpperCase()+s.slice(1);};
