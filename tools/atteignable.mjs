/* Sensen Mini — tools/atteignable.mjs
   node tools/atteignable.mjs [-v] [--mondes N]

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

   PLUSIEURS MONDES, ET C'EST ESSENTIEL. Un premier jet ne regardait qu'une
   seule graine et accusait deux guildes sur douze d'etre mortes. Mesure sur
   quarante mondes : les douze sortent, a quelques pour cent pres. Ce n'etait
   pas du contenu mort, c'etait UNE partie qui ne montre pas tout — et c'est
   le propos d'un monde engendre. Un outil d'audit qui crie au loup est pire
   qu'aucun outil : tout ce qui depend de la graine est donc mesure sur
   plusieurs mondes, et seul ce qu'aucun monde ne produit est declare mort.

   Il sort en echec quand du contenu declare est inatteignable, pour qu'on
   le voie passer en CI plutot que six mois plus tard. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const VERBOSE=argv.includes('-v');
const MONDES=(()=>{const i=argv.indexOf('--mondes');return i>=0?+argv[i+1]:6;})();
const files=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')&&!/^52-/.test(f)).sort();
const code=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');

function fakeEl(){return {style:{setProperty(){}},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
  setAttribute(){},getAttribute:()=>null,appendChild(){},remove(){},querySelectorAll:()=>[],querySelector:()=>null,
  addEventListener(){},closest:()=>null,getBoundingClientRect:()=>({x:0,y:0,width:0,height:0}),scrollIntoView(){},
  classList:{toggle(){},add(){},remove(){},contains:()=>false}};}

/* un monde entier, avec son personnage : sans lui, ni royaumes ni villes */
function monde(seed){
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
  let sd=seed>>>0;
  ctx.Math=Object.create(Math);
  ctx.Math.random=()=>{sd+=0x6D2B79F5;let t=sd;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  vm.runInContext(code,ctx,{filename:'sensen.js'});
  vm.runInContext('paint=()=>{};render=()=>{};log=()=>{};toast=()=>{};cutIn=()=>{};',ctx);
  vm.runInContext(`S.seed=${seed};cr.race='humain';cr.classe='guerrier';cr.el=0;cr.an=0;
    cr.pts=30;STATS.forEach(([k])=>cr.st[k]=5);cr.pos=defaultStart();
    applyBirth();starterKit();here().seen=true;`,ctx);
  return ctx;
}
const mondes=[];
for(let i=1;i<=MONDES;i++)mondes.push(monde(i*7919));
const un=mondes[0];
const G=e=>vm.runInContext('('+e+')',un);
const RUN=e=>vm.runInContext(e,un);
/* la meme sonde sur tous les mondes, reunie : ce qu'aucun ne produit est mort */
function partout(expr){
  const s=new Set();
  mondes.forEach(c=>vm.runInContext(expr,c).forEach(k=>s.add(k)));
  return s;
}

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

console.log('\nSensen Mini — ce que le monde peut reellement produire');
console.log(MONDES+' mondes engendres, graines distinctes\n');

/* ---------- 1. les cellules ---------- */
const SWEEP=`(()=>{
  const bio=new Set(),poi=new Set(),mats=new Set();
  for(let x=-90;x<90;x+=2)for(let y=-90;y<90;y+=2){
    const c=genCell(x,y);bio.add(c.b);if(c.poi)poi.add(c.poi);
    for(let d=0;d<=5;d++)cellMats(Object.assign({},c,{depth:d})).forEach(m=>mats.add(m));
    cellMats(Object.assign({},c,{poi:'filon',depth:3})).forEach(m=>mats.add(m));
  }
  return [...[...bio].map(b=>'b:'+b),...[...poi].map(p=>'p:'+p),...[...mats].map(m=>'m:'+m)];
})()`;
const W=partout(SWEEP);
const sous=(s,p)=>new Set([...s].filter(k=>k.startsWith(p)).map(k=>k.slice(p.length)));
const bio=sous(W,'b:'),poi=sous(W,'p:'),matsSauvages=sous(W,'m:');

bilan('biomes poses par le monde',Object.keys(G('BIOME')),bio,
  MONDES+' x 8 100 cellules balayees');
bilan('points d interet',Object.keys(G('POI')),poi);

/* ---------- 2. les matieres ---------- */
/* Une matiere s'obtient de trois facons : on la RECOLTE quelque part, on
   l'ALLIE a l'atelier, ou on l'ACHETE. Les trois comptent, et il faut les
   trois : les cultivars — pomme de terre, tomate, houblon — ne poussent
   dans aucun biome sauvage, et c'est voulu. On les seme apres les avoir
   achetes chez l'epicier, comme des semences. Un audit qui ignore les
   etals les declarerait morts a tort. */
const parAlliage=G('Object.keys(ALLIAGE)');
const ETALS=`(()=>{
  const vus=[];const villes=[];
  kingdomsNear().forEach(k=>kTowns(k).forEach(t=>villes.push(t)));
  for(let w=0;w<26;w++){
    S.week=w;
    villes.forEach(t=>{
      const st=shopStock(t);
      Object.keys(st).forEach(sk=>(st[sk]||[]).forEach(o=>{
        if(o.t==='mat'||o.t==='ref')vus.push('m:'+o.mk);
      }));
      (t.shops||[]).forEach(s=>vus.push('s:'+s));
      (t.halls||[]).forEach(h=>vus.push('h:'+h));
      vus.push('n:1');
    });
  }
  S.week=0;
  return vus;
})()`;
const E=partout(ETALS);
const matsEtal=sous(E,'m:'),boutiques=sous(E,'s:'),halls=sous(E,'h:');
const matsOk=new Set([...matsSauvages,...parAlliage,...matsEtal]);

bilan('matieres recoltables',Object.keys(G('MAT')),matsSauvages,
  'les cultivars ne poussent pas a l etat sauvage : on en achete la semence',true);
bilan('matieres obtenables',Object.keys(G('MAT')),matsOk,
  'recolte, alliages de l atelier, et les etals de tous les mondes sur six mois');

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
const D=partout(`(()=>{
  const o=[];
  for(let x=-90;x<90;x+=2)for(let y=-90;y<90;y+=2){
    const c=genCell(x,y);if(c.poi!=='donjon')continue;
    const d=genDungeon(c);o.push('t:'+d.theme);
    d.floors.forEach(f=>f.forEach(r=>o.push('s:'+r.t)));
  }
  return o;
})()`);
bilan('salles de donjon',Object.keys(G('ROOM')),sous(D,'s:'),'tous les donjons de tous les mondes');
bilan('themes de donjon',Object.keys(G('DJTHEME')),sous(D,'t:'));

/* ---------- 5. les boutiques et les guildes ---------- */
bilan('sortes de boutiques',G('BOUTIQUES'),boutiques);
bilan('etals approvisionnes',G('BOUTIQUES'),new Set(G('Object.keys(SHOPGEN)')),
  'une boutique sans generateur de stock est une porte fermee');
bilan('halls de guilde poses',G('GUILDS.map(g=>g.k)'),halls,
  'une guilde sans hall nulle part emporte toutes ses quetes');

/* Un gabarit est tirable si sa guilde tient un hall quelque part ET si son
   rang minimum est atteignable — les rangs vont de 0 a 4. */
const qtpl=G('QTPL.map(t=>({id:t.id,g:t.g,r:t.r}))');
bilan('gabarits de quete tirables',qtpl.map(t=>t.id),
  new Set(qtpl.filter(t=>halls.has(t.g)&&t.r<=4).map(t=>t.id)),
  'guilde presente dans le monde et rang minimum atteignable');

/* ---------- 6. sorts, statuts, meubles ---------- */
/* Un module de sort s'apprend en lisant : le livre porte un domaine, et
   l'on n'apprend que les modules de ce domaine. */
bilan('modules qu un livre enseigne',G('MK'),new Set(RUN(`(()=>{
  const dl=new Set(DK.filter(d=>DOMAIN[d].b==='grimoire'||DOMAIN[d].b==='manuel'));
  return MK.filter(id=>MODULE[id].d.some(d=>dl.has(d)));
})()`)),'seuls les domaines qui ont des livres se transmettent');

/* Les statuts : on lit le code plutot que de deviner. Un statut declare que
   personne ne pose est une icone qui n'apparaitra jamais. */
bilan('statuts que quelque chose pose',Object.keys(G('STATUS')),new Set([
  ...[...code.matchAll(/addStatus\([^,]+,\s*'([a-z]+)'/g)].map(m=>m[1]),
  ...Object.values(G('DOMSTAT')),
  ...G('MK.map(id=>MODULE[id].status&&MODULE[id].status.k).filter(Boolean)'),
  ...G('MK.map(id=>MODULE[id].soi&&MODULE[id].soi.k).filter(Boolean)'),
  ...G('Object.keys(PATTERN).map(k=>PATTERN[k].st).filter(Boolean)'),
]),'lu dans le code : appels a addStatus, statuts de sorts et de patterns');

/* Un meuble dont le cout demande une matiere introuvable ne se pose pas.
   Le cout se lit par CATEGORIE ('bois', 'roche') ou par forme travaillee. */
const meubles=G('Object.keys(MEUBLE)'),couts=G('Object.keys(MEUBLE).map(k=>MEUBLE[k].cost)');
const catsVivantes=new Set([...matsOk].map(m=>G('MAT["'+m+'"].c')));
bilan('meubles constructibles',meubles,new Set(meubles.filter((k,i)=>
  couts[i].every(([r])=>r.startsWith('form:')||catsVivantes.has(r)||matsOk.has(r)))),
  'chaque composante du cout doit s obtenir');

/* ---------- 7. les tirages sont-ils honnetes ? ---------- */
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
