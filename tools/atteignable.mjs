/* Sensen Mini — tools/atteignable.mjs
   node tools/atteignable.mjs [-v]

   CINQUIEME INSTRUMENT : l'audit du contenu mort.

   spec.mjs verifie que les regles font ce qu'elles disent. Il ne peut rien
   dire d'un contenu que le jeu n'atteint JAMAIS : une matiere qui n'est
   dans aucun biome, une creature qu'aucun pool ne tire, une salle de
   donjon qu'aucun theme ne pose. Ce contenu passe toutes les
   verifications — il n'est simplement jamais joue.

   Cet outil ne teste pas des regles : il ENUMERE le monde. Il balaie tous
   les biomes, toutes les profondeurs, tous les themes, le jour et la nuit,
   du niveau de puissance le plus bas au plus haut, et note ce qui peut
   sortir. Ce qui ne sort d'aucune combinaison est mort.

   Il sort en echec quand du contenu declare est inatteignable, pour qu'on
   le voie passer en CI plutot que six mois plus tard. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const VERBOSE=process.argv.includes('-v');
const files=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')&&!/^52-/.test(f)).sort();
const code=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');

function fakeEl(){return {style:{setProperty(){}},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
  setAttribute(){},getAttribute:()=>null,appendChild(){},remove(){},querySelectorAll:()=>[],querySelector:()=>null,
  addEventListener(){},closest:()=>null,getBoundingClientRect:()=>({x:0,y:0,width:0,height:0}),scrollIntoView(){},
  classList:{toggle(){},add(){},remove(){},contains:()=>false}};}
const els={};
const ctx={document:{getElementById:id=>els[id]||(els[id]=fakeEl()),querySelectorAll:()=>[],querySelector:()=>null,
    createElement:()=>fakeEl(),body:fakeEl(),documentElement:fakeEl(),addEventListener(){},
    visibilityState:'visible',fonts:{check:()=>true}},
  console,JSON,Date,performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},
  addEventListener(){},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
  unescape:global.unescape,escape:global.escape,encodeURIComponent,decodeURIComponent,
  navigator:{},location:{protocol:'file:'},getComputedStyle:()=>({})};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
let sd=12345;
ctx.Math=Object.create(Math);
ctx.Math.random=()=>{sd+=0x6D2B79F5;let t=sd;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
vm.runInContext(code,ctx,{filename:'sensen.js'});
vm.runInContext('paint=()=>{};render=()=>{};log=()=>{};toast=()=>{};cutIn=()=>{};',ctx);
/* un personnage neuf : sans lui, ni royaumes ni villes n existent */
vm.runInContext(`S.seed=42;cr.race='humain';cr.classe='guerrier';cr.el=0;cr.an=0;
  cr.pts=30;STATS.forEach(([k])=>cr.st[k]=5);cr.pos=defaultStart();
  applyBirth();starterKit();here().seen=true;`,ctx);
const G=e=>vm.runInContext('('+e+')',ctx);
const RUN=e=>vm.runInContext(e,ctx);

/* ---------- le rapport ---------- */
let alertes=0;
function bilan(titre,declares,vus,note,mou){
  const morts=declares.filter(k=>!vus.has(k));
  const pc=Math.round((declares.length-morts.length)/Math.max(1,declares.length)*100);
  console.log((morts.length?(mou?'note':'MORT'):'ok  ')+'  '+titre.padEnd(34)
    +String(declares.length-morts.length).padStart(4)+' / '+String(declares.length).padEnd(4)+'  '+pc+' %');
  if(morts.length){
    if(!mou)alertes++;
    console.log('      '+(mou?'hors de portee ici : ':'inatteignable : ')+morts.join(', '));
  }
  if(note&&(morts.length||VERBOSE))console.log('      ('+note+')');
  return morts;
}

console.log('\nSensen Mini — ce que le monde peut reellement produire\n');

/* ---------- 1. les cellules du monde ---------- */
/* On balaie un large carre : c'est le seul moyen honnete de savoir quels
   biomes et quels points d'interet la generation pose vraiment. */
const N=RUN(`(()=>{
  const bio=new Set(),poi=new Set(),mats=new Set();
  for(let x=-140;x<140;x+=2)for(let y=-140;y<140;y+=2){
    const c=genCell(x,y);bio.add(c.b);if(c.poi)poi.add(c.poi);
    for(let d=0;d<=5;d++)cellMats(Object.assign({},c,{depth:d})).forEach(m=>mats.add(m));
    cellMats(Object.assign({},c,{poi:'filon',depth:3})).forEach(m=>mats.add(m));
  }
  return {bio:[...bio],poi:[...poi],mats:[...mats]};
})()`);

bilan('biomes poses par le monde',Object.keys(G('BIOME')),new Set(N.bio),
  '19 600 cellules balayees sur 280 x 280');
bilan('points d interet',Object.keys(G('POI')),new Set(N.poi));

/* ---------- 2. les matieres ---------- */
/* Une matiere s'obtient de trois facons : on la RECOLTE quelque part, on
   l'ALLIE a l'atelier, ou on l'ACHETE. Les trois comptent, et il faut les
   trois : les cultivars — pomme de terre, tomate, houblon — ne poussent
   dans aucun biome sauvage, et c'est voulu. On les seme apres les avoir
   achetes chez l'epicier, comme des semences. Un audit qui ignore les
   etals les declarerait morts a tort. */
const parAlliage=G('Object.keys(ALLIAGE)');
const ETAL=RUN(`(()=>{
  const vus=new Set();let n=0;
  const villes=[];
  kingdomsNear().forEach(k=>kTowns(k).forEach(t=>villes.push(t)));
  for(let w=0;w<26;w++){
    S.week=w;
    villes.forEach(t=>{
      const st=shopStock(t);n++;
      Object.keys(st).forEach(sk=>(st[sk]||[]).forEach(o=>{
        if(o.t==='mat')vus.add(o.mk);
        if(o.t==='ref')vus.add(o.mk);
      }));
    });
  }
  S.week=0;
  return {vus:[...vus],n};
})()`);
bilan('matieres recoltables',Object.keys(G('MAT')),new Set(N.mats),
  'les cultivars ne poussent pas a l etat sauvage : on en achete la semence',true);
bilan('matieres obtenables',Object.keys(G('MAT')),
  new Set([...N.mats,...parAlliage,...ETAL.vus]),
  'recolte, alliages de l atelier, et '+ETAL.n+' etals sur six mois');

/* ---------- 3. les creatures ---------- */
const C=RUN(`(()=>{
  const vus=new Set();
  for(const b of Object.keys(BIOME))for(const corr of [0,10,30,60,100])for(const nuit of [0,1])
    for(const p of [1,3,6,10,16,24,40]){
      for(let i=0;i<40;i++)vus.add(creaturePool({x:0,y:0,b,corr,depth:0,poi:null},false,!!nuit,p));
      for(let i=0;i<40;i++)vus.add(creaturePool({x:0,y:0,b,corr,depth:0,poi:'camp'},false,!!nuit,p));
    }
  for(const th of Object.keys(DJTHEME))for(const p of [1,6,16,40])
    for(let i=0;i<200;i++)vus.add(creaturePool({x:0,y:0,b:'plaine',corr:40,depth:2,dj:{theme:th}},true,false,p));
  return [...vus];
})()`);
bilan('creatures qu un pool peut tirer',G('CK'),new Set(C),
  'tous biomes x corruption x nuit x puissance, plus les quatre themes de donjon');

/* ---------- 4. le donjon ---------- */
/* Un donjon s'engendre a partir d'une cellule : le theme depend du biome,
   et le tirage des salles depend du theme. On les prend tous. */
const D=RUN(`(()=>{
  const salles=new Set(),themes=new Set();
  const cs=[];
  for(let x=-140;x<140;x+=2)for(let y=-140;y<140;y+=2){
    const c=genCell(x,y);if(c.poi==='donjon')cs.push(c);
  }
  cs.forEach(c=>{
    const d=genDungeon(c);themes.add(d.theme);
    d.floors.forEach(f=>f.forEach(r=>salles.add(r.t)));
  });
  return {salles:[...salles],themes:[...themes],n:cs.length};
})()`);
bilan('salles de donjon',Object.keys(G('ROOM')),new Set(D.salles),D.n+' donjons du monde engendres');
bilan('themes de donjon',Object.keys(G('DJTHEME')),new Set(D.themes));

/* ---------- 5. les boutiques ---------- */
/* Les villes appartiennent aux royaumes ; les hameaux de la carte se
   materialisent a la demande. Les deux tiennent des boutiques, et les deux
   comptent. */
const B=RUN(`(()=>{
  const vus=new Set();
  let n=0;
  kingdomsNear().forEach(k=>kTowns(k).forEach(t=>{n++;(t.shops||[]).forEach(s=>vus.add(s));}));
  let h=0;
  for(let x=-90;x<90;x++)for(let y=-90;y<90;y++){
    const c=genCell(x,y);if(c.poi!=='village')continue;
    const t=hameauAt(x,y);if(!t)continue;h++;
    (t.shops||[]).forEach(s=>vus.add(s));
  }
  return {vus:[...vus].filter(Boolean),n,h};
})()`);
bilan('sortes de boutiques',G('BOUTIQUES'),new Set(B.vus),
  B.n+' villes de royaume et '+B.h+' hameaux de la carte');
bilan('etals approvisionnes',G('BOUTIQUES'),new Set(G('Object.keys(SHOPGEN)')),
  'une boutique sans generateur de stock est une porte fermee');

/* ---------- 6. les tirages sont-ils honnetes ? ---------- */
/* Etre atteignable ne suffit pas : un affixe tire trois fois plus souvent
   qu'un autre est du contenu a moitie mort. On mesure l'ecart entre le plus
   frequent et le plus rare sur un grand nombre de tirages. Au-dela de deux,
   ce n'est plus du hasard, c'est un biais. */
function uniforme(titre,expr,n,note){
  const c=RUN(`(()=>{const c={};for(let i=0;i<${n};i++)(${expr}).forEach(k=>c[k]=(c[k]||0)+1);return c;})()`);
  const v=Object.values(c);
  if(!v.length){console.log('MORT  '+titre.padEnd(34)+'aucun tirage');alertes++;return;}
  const mx=Math.max(...v),mn=Math.min(...v),ecart=mx/Math.max(1,mn);
  const mauvais=ecart>2;
  if(mauvais)alertes++;
  console.log((mauvais?'BIAIS':'ok   ')+' '+titre.padEnd(34)
    +String(v.length).padStart(4)+' faces  ecart x'+ecart.toFixed(2));
  if(mauvais)console.log('      le plus frequent sort '+ecart.toFixed(1)+' fois plus que le plus rare');
  if(note&&(mauvais||VERBOSE))console.log('      ('+note+')');
}
console.log('');
uniforme('affixes du butin','tirerN(AFF,3).map(a=>a.id)',20000,
  'l ordre de declaration ne doit rien decider');
uniforme('gemmes du joaillier','tirerN(GEMK,3)',20000);
uniforme('semences de l epicier',
  'tirerN(Object.keys(MAT).filter(k=>MAT[k].crop&&MAT[k].nutr>0&&!MAT[k].tox),3)',20000);

console.log('');
if(alertes){
  console.log(alertes+' alerte'+(alertes>1?'s':'')+' — du contenu declare n est jamais joue.\n');
  process.exit(1);
}
console.log('Aucun contenu mort : tout ce qui est declare peut sortir.\n');
