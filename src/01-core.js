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
