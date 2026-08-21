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

/* Les vehicules : chacun doit etre constructible un jour, c'est-a-dire que
   sa station existe, que sa competence plafonne quelque part d'atteignable
   et que chaque matiere de son cout s'obtienne. Un vehicule qui demande une
   forme qu'aucune station ne produit est une entree de catalogue. */
const vehOk=new Set(G('VEHK').filter((k,i)=>{
  const D=G('VEHICULE[VEHK['+i+']]');
  if(!G('!!STATION["'+D.st+'"]'))return false;
  return D.cout.every(([r])=>r.startsWith('form:')?G('!!FORM["'+r.slice(5)+'"]'):G('!!CAT["'+r+'"]'));
}));
bilan('vehicules constructibles',G('VEHK'),vehOk,
  'station connue, et chaque matiere du cout comptable');
/* et chacun doit avoir un terrain ou il serve : un bateau veut de l eau */
const vehTerrain=new Set(G('VEHK').filter((k,i)=>{
  const D=G('VEHICULE[VEHK['+i+']]');
  return D.eau?[...bio].some(b=>G('!!BIOME_EAU["'+b+'"]')):[...bio].some(b=>!G('!!BIOME_EAU["'+b+'"]'));
}));
bilan('vehicules qui ont un terrain',G('VEHK'),vehTerrain,
  'un bateau sans eau nulle part ne sert a rien');

/* Les parures, et surtout : les emplacements d'equipement. Six d'entre eux
   n'avaient aucune source — c'est exactement le genre de trou qu'un audit
   doit tenir ferme une fois bouche. */
const parureAff=RUN(`(()=>{
  const aff=new Set(),slots=new Set();
  for(let i=0;i<20000;i++){
    const it=mkParure(pick(PARK),null,1+Math.random()*.7);
    if(!it)continue;
    slots.add(it.slot);
    it.aff.forEach(a=>aff.add(a.id));
  }
  return {aff:[...aff],slots:[...slots]};
})()`);
bilan('effets de parure tirables',G('AFFUK'),new Set(parureAff.aff),
  'vingt mille parures engendrees, toutes qualites');
/* Le second anneau et le second accessoire ne se tirent pas : ils se
   prennent a l equipement, quand le premier est deja occupe. */
const slotsOk=new Set([...parureAff.slots,'anneau2','acc2',
  ...G('SLOTS.filter(s=>s.zone||s.hand).map(s=>s.k)'),'muni']);
bilan('emplacements qu on peut remplir',G('SLOTS.map(s=>s.k)'),slotsOk,
  'les six emplacements de parure n avaient aucune source jusqu ici');

/* Une potion d'effet s'obtient de deux facons : on la distille depuis une
   plante, ou on l'achete. Une fiole qu'aucune plante ne donne et qu'aucun
   etal ne tient serait une entree de catalogue et rien d'autre. */
const effetsPlante=new Set(Object.values(G('ALCHPLANTE')));
const effetsEtal=partout(`(()=>{
  const vus=[];const villes=[];
  kingdomsNear().forEach(k=>kTowns(k).forEach(t=>villes.push(t)));
  for(let w=0;w<26;w++){
    S.week=w;
    villes.forEach(t=>{const st=shopStock(t);
      Object.keys(st).forEach(sk=>(st[sk]||[]).forEach(o=>{
        if(o.t==='potion'&&o.pot&&o.pot.e)vus.push(o.pot.e);}));});
  }
  S.week=0;return vus;
})()`);
bilan('fioles d effet obtenables',Object.keys(G('POTEFF')),
  new Set([...effetsPlante,...effetsEtal]),
  'distillees depuis une plante, ou achetees a l alchimiste et a l herboriste');
/* Et les plantes qui les portent doivent elles-memes pousser quelque part. */
bilan('plantes alchimiques recoltables',Object.keys(G('ALCHPLANTE')),matsOk,
  'une recette dont l ingredient n existe pas est une recette morte');

/* Un meuble dont le cout demande une matiere introuvable ne se pose pas.
   Le cout se lit par CATEGORIE ('bois', 'roche') ou par forme travaillee. */
const meubles=G('Object.keys(MEUBLE)'),couts=G('Object.keys(MEUBLE).map(k=>MEUBLE[k].cost)');
const catsVivantes=new Set([...matsOk].map(m=>G('MAT["'+m+'"].c')));
bilan('meubles constructibles',meubles,new Set(meubles.filter((k,i)=>
  couts[i].every(([r])=>r.startsWith('form:')||catsVivantes.has(r)||matsOk.has(r)))),
  'chaque composante du cout doit s obtenir');

/* ---------- 6b. les tables qu on n avait jamais regardees ----------
   Sept tables de contenu n'etaient couvertes par rien : les postures et
   techniques qu'on apprend, les specialites de gemme, les outils, les
   constructions d'armure, les roles de territoire, les metiers de PNJ et
   les automatismes. Chacune se lit d'une facon differente, et c'est
   precisement pour cela qu'aucune n'avait ete verifiee. */

/* Une POSTURE s'apprend dans un manuel : son domaine doit avoir des livres. */
const domsLivres=new Set(G(`DK.filter(d=>DOMAIN[d].b==='grimoire'||DOMAIN[d].b==='manuel')`));
bilan('passifs qu un manuel enseigne',
  G(`MK.filter(id=>MODULE[id].t==='passif')`),
  new Set(G(`MK.filter(id=>MODULE[id].t==='passif'&&MODULE[id].d.some(d=>${JSON.stringify([...domsLivres])}.includes(d)))`)),
  'un passif dont le domaine n a pas de livre ne s apprend jamais');

/* Une GEMME se taille depuis une pierre : chaque specialite doit pouvoir
   sortir d'une taille, et chaque gemme brute doit exister. */
/* gemSpecs(mk) dit ce qu'une pierre donnee accepte : l'union sur toutes les
   pierres du jeu est l'ensemble des tailles reellement realisables. */
const gemVues=RUN(`(()=>{
  const s=new Set();
  GEMK.forEach(mk=>{if(MAT[mk])gemSpecs(mk).forEach(x=>s.add(x));});
  return [...s];
})()`);
bilan('specialites de gemme taillables',Object.keys(G('GEMSPEC')),new Set(gemVues),
  'une taille qu aucune pierre n accepte ne se realise jamais');
bilan('gemmes brutes qui existent',G('GEMK'),
  new Set(G('GEMK.filter(k=>!!MAT[k])')),
  'une gemme sans matiere derriere ne se ramasse pas');

/* Un OUTIL doit pouvoir se forger : sa fonctionnalite a des composants et
   une station qui les produit. */
bilan('outils fabricables',Object.keys(G('OUTIL')),
  new Set(G(`Object.keys(OUTIL).filter(k=>OUTIL[k].comp&&OUTIL[k].comp.every(ct=>!!COMP[ct]))`)),
  'chaque composant de l outil doit exister');
/* ETRE DANS UN BIOME NE SUFFIT PAS : il faut aussi qu'un outil puisse la
   prendre. Une matiere listee dans une toundra, visible sur la case, et que
   canHarvest() refuse toujours, est du contenu mort d'une espece plus
   sournoise que les autres — le joueur la VOIT, et ne comprend pas. On
   equipe donc le meilleur outil de chaque sorte et l'on demande a la regle
   elle-meme si la matiere se laisse prendre. */
const prenables=RUN(`(()=>{
  /* un outil parfait de chaque sorte : si meme lui echoue, personne ne peut */
  S.items=[];S.eq={};
  Object.keys(OUTIL).forEach(fn=>{
    S.items.push({id:'t'+fn,kind:'outil',fn,slot:'main1',parts:[{ct:'fixations',f:'brut',mk:'adamant'}],
      q:3,dur:60,durBase:20,de:10,mana:0,ela:8,vec:[.2,.2,.2,.2,.2],nom:'essai'});
  });
  return Object.keys(MAT).filter(m=>canHarvest(m));
})()`);
bilan('matieres qu un outil peut prendre',[...matsSauvages],new Set(prenables),
  'une matiere posee dans un biome que canHarvest refuse toujours est visible et intouchable');

/* Une CONSTRUCTION d'armure doit etre atteignable par un composant. */
bilan('constructions d armure',Object.keys(G('CONS')),
  new Set(G(`Object.keys(COMP).map(ct=>COMP[ct].cons).filter(Boolean)`)),
  'une construction qu aucun composant ne porte ne se montera jamais');

/* Les ROLES de territoire, les METIERS de PNJ, les AUTOMATISMES et les
   ORDRES de compagnon : ils se lisent dans le code, pas dans une table. */
/* Une cle de table se DECLARE sans guillemets (`base:{...}`) et se LIT avec
   (`claim==='base'`). Compter les occurrences citees suffit donc, et il ne
   faut surtout pas exiger deux occurrences : la premiere version le faisait
   et accusait a tort deux roles sur quatre. */
const citee=k=>new RegExp("['\"]"+k+"['\"]").test(code);
bilan('roles de territoire employes',Object.keys(G('ROLES')),
  new Set(Object.keys(G('ROLES')).filter(citee)),
  'un role qu aucune regle ne lit ne fait rien');
bilan('automatismes branches',Object.keys(G('AUTOS')),
  new Set([...code.matchAll(/auto\('([a-z]+)'\)/g)].map(m=>m[1])),
  'lu dans le code : chaque automatisme doit etre interroge quelque part');
/* Les ordres ne se lisent pas par leur nom : la boucle fait
   `ORDERS.find(x=>x.k===c.order)` puis se sert de `dmg` et `aggro`. Un ordre
   est donc vivant si ces deux champs sont consommes ET si sa paire est
   distincte de celle des autres — deux ordres identiques, c'est un ordre. */
const ordreLu=/\.dmg\b/.test(code)&&/\.aggro\b/.test(code)&&/c\.order/.test(code);
const paires=G('ORDERS.map(o=>o.dmg+":"+o.aggro)');
bilan('ordres de compagnon distincts',G('ORDK'),
  new Set(ordreLu?G('ORDK').filter((k,i)=>paires.indexOf(paires[i])===i):[]),
  'un ordre qui pese comme un autre, ou que la boucle ne lit pas, ne change rien');
bilan('metiers de PNJ employes',Object.keys(G('JOBS')),
  new Set([...code.matchAll(/job===?'([a-z]+)'|JOBS\[([a-z.]+)\]/g)].map(m=>m[1]).filter(Boolean)
    .concat(G('S.npcs.map(n=>n.job).filter(Boolean)'))),
  'un metier qu aucune regle ne lit est un mot sur une fiche',true);

/* Les POSTURES de combat : chacune doit etre selectionnable et peser. */
bilan('postures de combat',G('STANCE.map(s=>s.k||s.n)'),
  new Set(G('STANCE.map(s=>s.k||s.n)')),
  'les trois postures se choisissent au meme endroit');

/* Les gardiens nommes et leurs pieces : chaque theme de donjon doit en
   poser un, chaque gardien doit garder une piece qui existe, et chaque
   effet cite doit etre un vrai affixe. Une piece nommee est ECRITE — si
   elle cite un effet disparu, elle tombe sans rien faire. */
bilan('themes qui ont un gardien',Object.keys(G('DJTHEME')),
  new Set(Object.keys(G('GARDIEN'))),
  'un theme sans gardien retombe sur une bete agrandie');
bilan('gardiens dont l espece existe',Object.keys(G('GARDIEN')).concat(['majeur']),
  new Set(G('Object.keys(GARDIEN).filter(t=>!!CREATURE[GARDIEN[t].cre])')
    .concat(G('!!CREATURE[GARDIEN_MAJEUR.cre]')?['majeur']:[])),
  'un gardien sans espece n a pas de silhouette');
bilan('pieces nommees gardees',Object.keys(G('ARTEFACT')),
  new Set(G('Object.keys(GARDIEN).map(t=>GARDIEN[t].arte).concat([GARDIEN_MAJEUR.arte])')),
  'une piece que personne ne garde ne tombera jamais');
bilan('effets cites par les pieces nommees',
  G('[...new Set(Object.keys(ARTEFACT).flatMap(k=>ARTEFACT[k].aff.map(a=>a[0])))]'),
  new Set(G('AFF.map(a=>a.id)')),
  'un effet disparu ferait tomber une piece qui ne fait rien');

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
