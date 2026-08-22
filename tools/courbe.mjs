/* Courbe de progression de l'équipement — sans navigateur.
   node tools/courbe.mjs [--tirages 400] [--seed 42]

   La question que ni la spec ni le simulateur ne savaient trancher : au
   fil d'une partie, l'équipement monte-t-il vraiment, et par quelle voie ?
   Trois sources coexistent — le butin, la boutique, l'atelier — et rien ne
   disait laquelle porte la progression, ni si l'une d'elles décroche.

   On ne fait donc pas jouer un bot : on échantillonne les trois sources à
   plusieurs niveaux de puissance, de ville et de compétence, et l'on
   compare avec itemScore, la même mesure que le jeu utilise pour décider
   si un objet vaut mieux qu'un autre.

   C'est le quatrième instrument, à côté de spec (les règles), smoke
   (l'interface) et sim (le rythme d'une partie). */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:d;};
/* QUATRE CENTS TIRAGES NE SUFFISAIENT PAS. Le seuil « une terre mortelle
   rapporte quinze pour cent de plus » se jugeait sur une moyenne dont la
   marge etait, de l'aveu meme du commentaire d'a cote, de l'ordre de dix
   pour cent : il restait cinq points entre le bruit et l'alerte. Il a suffi
   que j'ajoute cinq effets de parure — donc que je change l'ordre des
   tirages, sans toucher au butin — pour que l'alerte tombe. Une mesure qu'un
   changement etranger fait basculer ne mesure pas ce qu'elle croit.
   A deux mille cinq cents tirages, elle est stable sur trois graines. */
const N=+arg('--tirages',2500),SEED=+arg('--seed',42),JSON_OUT=argv.includes('--json');

/* ---------- contexte isolé, DOM factice, aléatoire seedé ---------- */
function fakeEl(){
  return {style:{setProperty(){}},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},querySelectorAll(){return [];},
    querySelector(){return null;},addEventListener(){},closest(){return null;},
    getBoundingClientRect(){return {x:0,y:0,width:0,height:0};},scrollIntoView(){},
    classList:{toggle(){},add(){},remove(){},contains(){return false;}}};
}
function contexte(seed){
  const els={};
  const document={getElementById:id=>els[id]||(els[id]=fakeEl()),querySelectorAll:()=>[],querySelector:()=>null,
    createElement:()=>fakeEl(),body:fakeEl(),documentElement:fakeEl(),addEventListener(){},
    visibilityState:'visible',fonts:{check:()=>true}};
  const ctx={document,console,Math,JSON,Date,performance:{now:()=>0},
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
    unescape:global.unescape,escape:global.escape,encodeURIComponent,decodeURIComponent,
    navigator:{},location:{protocol:'file:'},getComputedStyle:()=>({})};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  let s=seed>>>0;
  ctx.Math=Object.create(Math);
  ctx.Math.random=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  const files=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')&&!/^52-/.test(f)).sort();
  vm.runInContext(files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n'),ctx,{filename:'sensen.js'});
  vm.runInContext(`cutIn=()=>{};float=()=>{};knock=()=>{};toast=()=>{};log=()=>{};
    paint=()=>{};render=()=>{};buildScene=()=>{};renderCombat=()=>{};sfx=()=>{};`,ctx);
  vm.runInContext(`S.seed=${seed};cr.race='humain';cr.classe='guerrier';cr.el=0;cr.an=0;cr.pts=30;
    STATS.forEach(([k])=>cr.st[k]=5);cr.pos=defaultStart();applyBirth();starterKit();here().seen=true;
    /* un dos sans fond : on mesure ce qui tombe, pas ce qu'on peut porter */
    S.stats.force=200;`,ctx);
  return ctx;
}
const ctx=contexte(SEED);
const G=e=>vm.runInContext('('+e+')',ctx);
const R=e=>vm.runInContext(e,ctx);

const stats=l=>{
  if(!l.length)return {n:0,med:0,p90:0,max:0};
  const t=l.slice().sort((a,b)=>a-b);
  return {n:t.length,med:t[Math.floor(t.length/2)],moy:t.reduce((a,b)=>a+b,0)/t.length,
    p90:t[Math.floor(t.length*.9)],max:t[t.length-1]};
};
const f1=x=>x.toFixed(1).padStart(6);

/* ---------- 1. le butin ---------- */
/* On place le joueur dans une case de corruption donnée et l'on tire N fois. */
function butin(corr,depth){
  R(`S.items=[];globalThis.__sc=[];
     here().corr=${corr};here().depth=${depth};
     for(let i=0;i<${N};i++){S.items=[];dropLoot(here(),false);
       const it=S.items[0];if(it&&it.kind==='arme')__sc.push(itemScore(it));}
     S.items=[];`);
  return stats(G('__sc'));
}
/* la même chose pour une créature rare — ce que le jeu appelle un beau jour */
function butinRare(corr,depth){
  R(`S.items=[];globalThis.__sc=[];
     here().corr=${corr};here().depth=${depth};
     for(let i=0;i<${Math.round(N/2)};i++){S.items=[];dropLoot(here(),true);
       const it=S.items[0];if(it&&it.kind==='arme')__sc.push(itemScore(it));}
     S.items=[];`);
  return stats(G('__sc'));
}

/* ---------- 2. la boutique ---------- */
/* cap : 6 hameau · 14 ville · 26 capitale (rangVille) */
function boutique(cap,prosp){
  R(`globalThis.__sc=[];
     for(let i=0;i<${Math.round(N/4)};i++){
       const t={x:0,y:0,cap:${cap},prosp:${prosp},nom:'X',type:'x',or:500,orMax:500,
                shops:['armurier'],halls:[]};
       SHOPGEN.armurier(t).forEach(o=>{if(o.t==='item'&&o.it.kind==='arme'&&!FUNC[o.it.fn].shield)__sc.push(itemScore(o.it));});
     }`);
  return stats(G('__sc'));
}

/* ---------- 3. l'atelier ---------- */
/* Un forgeron de compétence L assemble une épée dans la matière donnée. */
function atelier(niveau,mk){
  R(`globalThis.__sc=[];
     /* on mesure le plafond de la voie : l'atelier au complet, les recettes
        sues, la matiere en reserve. Ce qui reste variable, c'est la
        competence et la durete du materiau — les deux leviers du joueur. */
     S.carry=Object.keys(STATION);
     S.recipes={};['lame','manche','fixations'].forEach(ct=>{
       S.recipes[ct+':${mk}']=1;S.recipes[ct+':chene']=1;S.recipes[ct+':fer']=1;});
     for(let i=0;i<${Math.round(N/2)};i++){
       /* ==================================================================
          LA SONDE ENTRAINAIT LE FORGERON QU'ELLE MESURAIT.
          Le niveau etait pose UNE FOIS avant la boucle — et chaque piece
          forgee donne de l'XP. Au bout de mille assemblages, le
          « debutant » etait devenu maitre, et la ligne « debutant » du
          tableau montrait un forgeron de plus en plus habile. La preuve
          tenait dans le nombre de tirages : a quatre cents tirages la
          mediane du debutant sortait a 11,9, a quatre mille elle sortait a
          22,1. Une mesure qui depend du nombre d'echantillons n'est pas une
          mesure. On repose le niveau A CHAQUE assemblage.
          ================================================================== */
       SK.forEach(k=>{S.sk[k].lv=${niveau};S.sk[k].xp=0;});
       S.comp={};S.items=[];S.ref={};
       addRef('lingot','${mk}',6);addRef('planche','chene',6);addRef('lingot','fer',6);
       makeComp('lame','lingot','${mk}');makeComp('manche','planche','chene');makeComp('fixations','lingot','fer');
       const picks=['lame','manche','fixations'].map(ct=>Object.keys(S.comp).find(k=>S.comp[k].ct===ct));
       if(picks.every(Boolean)){
         const it=assembleFrom('arme','epee',picks);
         if(it)__sc.push(itemScore(it));
       }
     }
     S.comp={};S.items=[];S.ref={};`);
  return stats(G('__sc'));
}

/* ---------- rapport ---------- */
const dep=G('(()=>{const w=weapon();return w?{nom:w.nom,q:w.q,sc:itemScore(w)}:null;})()');
const out={depart:dep,butin:[],boutique:[],atelier:[]};

console.log('\n=== COURBE D\'ÉQUIPEMENT (graine '+SEED+', '+N+' tirages) ===');
console.log('Repère — arme de départ : '+dep.nom+' q'+dep.q+' · score '+dep.sc.toFixed(1));
console.log('\nLe score est celui du jeu (itemScore) : degats moyens x cadence x durete x qualite,');
console.log('majore de 12 % par affixe. C\'est lui qui decide si un objet vaut mieux qu\'un autre.');

console.log('\n-- BUTIN ------------------------------------------- median   p90    max');
for(const [corr,depth,nom] of [[0,0,'case paisible'],[30,0,'corruption 30'],[70,0,'corruption 70'],
                               [30,3,'corr 30, strate 3'],[70,5,'corr 70, strate 5']]){
  const s=butin(corr,depth),r=butinRare(corr,depth);
  out.butin.push({nom,corr,depth,commun:s,rare:r});
  console.log('  '+nom.padEnd(48)+f1(s.med)+f1(s.p90)+f1(s.max));
  console.log('  '+('  dont creature rare ou gardien').padEnd(48)+f1(r.med)+f1(r.p90)+f1(r.max));
}

console.log('\n-- BOUTIQUE (armurier) ----------------------------- median   p90    max');
for(const [cap,prosp,nom] of [[6,.6,'hameau pauvre'],[6,1.0,'hameau prospere'],
                              [14,.9,'ville'],[26,1.2,'capitale prospere']]){
  const s=boutique(cap,prosp);
  out.boutique.push({nom,cap,prosp,s});
  console.log('  '+nom.padEnd(48)+f1(s.med)+f1(s.p90)+f1(s.max));
}

console.log('\n-- ATELIER (epee, competences au meme niveau) ------ median   p90    max');
for(const [niv,mk,nom] of [[5,'fer','debutant (5), fer'],[20,'fer','confirme (20), fer'],
                           [40,'fer','maitre (40), fer'],[40,'acier','maitre (40), acier'],
                           [60,'mithril','virtuose (60), mithril'],[80,'adamant','legende (80), adamant']]){
  const s=atelier(niv,mk);
  out.atelier.push({nom,niv,mk,s});
  console.log('  '+nom.padEnd(48)+f1(s.med)+f1(s.p90)+f1(s.max));
}

/* ---------- lecture ---------- */
console.log('\n-- LECTURE ----------------------------------------------------------');
/* Deux lectures differentes, et il faut les distinguer.
   Le PLAFOND est ce sur quoi on peut compter : la mediane du meilleur cas.
   C'est lui qui decide de la hierarchie des voies, parce qu'il ne bouge pas
   d'un tirage a l'autre. Le SOMMET est la queue de distribution — le beau
   jour — et il sert seulement a dire jusqu'ou le hasard peut monter. */
const bMax=Math.max(...out.butin.map(b=>b.rare.med));
const sMax=Math.max(...out.boutique.map(b=>b.s.med));
const aMax=Math.max(...out.atelier.map(a=>a.s.med));
const sommetButin=Math.max(...out.butin.map(b=>b.rare.p90));
/* on achete le meilleur article de l'etal, pas l'article moyen : la
   comparaison a l'arme de depart se fait donc sur le sommet */
const sommetBoutique=Math.max(...out.boutique.map(b=>b.s.p90));
const bMin=out.butin[0].commun.med,sMin=out.boutique[0].s.med,aMin=out.atelier[0].s.med;
const ligne=(n,mn,mx)=>'  '+n.padEnd(12)+'de '+mn.toFixed(1).padStart(6)+' a '+mx.toFixed(1).padStart(7)
  +'  (x'+(mx/Math.max(.01,mn)).toFixed(1)+')';
console.log(ligne('butin',bMin,bMax));
console.log(ligne('boutique',sMin,sMax));
console.log(ligne('atelier',aMin,aMax));
const alertes=[];
if(sommetBoutique<dep.sc)alertes.push('la meilleure boutique du monde ne bat pas l\'arme de depart');
if(aMax<bMax)alertes.push('l\'atelier plafonne sous le butin : forger ne sert a rien');
if(sommetButin<dep.sc*2)alertes.push('le butin ne double meme pas l\'arme de depart sur toute la courbe');
if(out.boutique[3].s.med<out.boutique[0].s.med*1.2)alertes.push('une capitale ne vend pas mieux qu\'un hameau');
if(out.atelier[5].s.med<out.atelier[0].s.med*3)alertes.push('la competence et la matiere pesent trop peu a l\'atelier');
/* « La richesse suit toujours le danger » (GDD 3.0) : une terre mortelle doit
   rapporter visiblement mieux qu'une case paisible, pas a un affixe pres. */
/* la MOYENNE, pas la mediane : le score d'une arme depend surtout du type
   tire au sort (des, cadence) et du materiau, deux variables lumpues qui
   font sauter la mediane d'un tirage a l'autre. La moyenne dit ce que le
   joueur ramasse vraiment sur la duree. */
const paisible=out.butin[0].commun.moy,mortelle=out.butin[2].commun.moy;
/* Seuil a 1,15 et non 1,28, qui est le vrai coefficient : le score d'une
   arme varie enormement d'un tirage a l'autre, et quelques centaines
   d'echantillons laissent a la moyenne une marge de l'ordre de dix pour
   cent. Le seuil doit attraper une vraie regression — le butin plat qu'on
   avait avant, a +9 % — sans se declencher sur du bruit. */
if(mortelle<paisible*1.15)alertes.push('le butin ne suit pas le danger : corruption 70 rapporte '
  +mortelle.toFixed(1)+' contre '+paisible.toFixed(1)+' en case paisible');
/* « Descendre est toujours un choix qui paie » (GDD, donjons et strates) */
const surface=out.butin[2].commun.moy,fond=out.butin[4].commun.moy;
if(fond<surface*1.10)alertes.push('descendre ne paie pas : la strate 5 rapporte '
  +fond.toFixed(1)+' contre '+surface.toFixed(1)+' en surface');
if(alertes.length){console.log('');alertes.forEach(a=>console.log('  ALERTE : '+a));}
else console.log('\n  aucune alerte : les trois voies montent, et l\'atelier reste la plus haute.');
console.log('');
if(JSON_OUT)console.log(JSON.stringify(out,null,1));
/* la CI doit s'arreter la-dessus : une voie qui decroche est une regression */
if(alertes.length)process.exit(1);

