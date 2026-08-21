/* Suite de vérification de la logique du jeu, sans navigateur.
   node tools/spec.mjs [--only <mot>] [-v]

   Charge tous les modules de src/ (hors 52-boot) dans un contexte isolé,
   comme le simulateur, puis exécute des cas nommés avec de vraies
   assertions. Chaque cas repart d'un personnage neuf et d'une graine
   fixe : deux exécutions donnent le même résultat.

   C'est le filet des règles — le pendant de tools/smoke.mjs, qui vérifie
   l'interface, et de tools/sim.mjs, qui mesure l'équilibrage. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:d;};
const ONLY=arg('--only',''),VERBOSE=argv.includes('-v');

/* ---------- contexte : même DOM factice que le simulateur ---------- */
const files=readdirSync(join(root,'src'))
  .filter(f=>f.endsWith('.js')&&!/^52-/.test(f)).sort();
const code=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');

function fakeEl(){
  const el={style:{setProperty(){}},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},querySelectorAll(){return [];},
    querySelector(){return null;},addEventListener(){},closest(){return null;},
    getBoundingClientRect(){return {x:0,y:0,width:0,height:0};},scrollIntoView(){},
    classList:{toggle(){},add(){},remove(){},contains(){return false;}}};
  return el;
}
/* un contexte vierge : le DOM factice, l'aléatoire seedé, mais aucun code chargé */
function nuContext(seed){
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
  return ctx;
}
function makeContext(seed){
  const ctx=nuContext(seed);
  vm.runInContext(code,ctx,{filename:'sensen.js'});
  /* rendu neutralisé, journal capté */
  vm.runInContext(`
    var __log=[],__toast=[],__cut=[];
    /* on garde ce que fait vraiment cutIn — la chronique en dépend — et l'on
       ne neutralise que l'affichage */
    cutIn=(k,t,s,hors)=>{if(!hors)chronique(k,t,s);__cut.push(k+' '+t+(s?' — '+s:''));};
    float=()=>{};knock=()=>{};shake=()=>{};flashHp=()=>{};sfx=()=>{};
    paint=()=>{};render=()=>{};buildScene=()=>{};renderCombat=()=>{};buildGate=()=>{};
    toast=t=>__toast.push(t);
    log=h=>__log.push(String(h).replace(/<[^>]+>/g,''));
  `,ctx);
  return ctx;
}
/* un personnage neuf, prêt à jouer */
function nouveau(seed,classe,race,opts){
  const ctx=makeContext(seed===undefined?42:seed);
  vm.runInContext(`
    S.seed=${seed===undefined?42:seed};
    cr.race='${race||'humain'}';cr.classe='${classe||'guerrier'}';cr.el=0;cr.an=0;
    cr.pts=30;STATS.forEach(([k])=>cr.st[k]=5);
    cr.pos=${opts&&opts.pos?JSON.stringify(opts.pos):'defaultStart()'};
    applyBirth();starterKit();here().seen=true;`,ctx);
  return ctx;
}
const G=(ctx,expr)=>vm.runInContext('('+expr+')',ctx);
const R=(ctx,stmts)=>vm.runInContext(stmts,ctx);

/* ---------- cadre de test ---------- */
const cas=[];
const test=(nom,fn)=>cas.push({nom,fn});
let courant=null;
function ok(cond,msg,detail){
  courant.n++;
  if(cond){if(VERBOSE)console.log('    · '+msg);return true;}
  courant.echecs.push(msg+(detail!==undefined?' — '+detail:''));
  return false;
}
const eq=(a,b,msg)=>ok(a===b,msg,'attendu '+JSON.stringify(b)+', obtenu '+JSON.stringify(a));
const near=(a,b,tol,msg)=>ok(Math.abs(a-b)<=tol,msg,'attendu ~'+b+' (±'+tol+'), obtenu '+a);
const gt=(a,b,msg)=>ok(a>b,msg,a+' devrait dépasser '+b);
const gte=(a,b,msg)=>ok(a>=b,msg,a+' devrait valoir au moins '+b);

/* ================= LES CAS ================= */

test('monde — génération déterministe et biomes cohérents',()=>{
  const a=nouveau(),b=nouveau();
  const ba=G(a,'[cell(3,7).b,cell(-12,5).b,cell(40,-40).b].join()');
  const bb=G(b,'[cell(3,7).b,cell(-12,5).b,cell(40,-40).b].join()');
  eq(ba,bb,'deux parties de même graine donnent le même monde');
  const biomes=G(a,'(()=>{const s={};for(let x=-30;x<30;x++)for(let y=-30;y<30;y++)s[cell(x,y).b]=1;return Object.keys(s).length;})()');
  gte(biomes,8,'au moins huit biomes apparaissent sur 3600 cellules');
  const mats=G(a,'cellMats(cell(0,0)).length');
  gt(mats,3,'une cellule offre plus de trois matériaux');
  eq(G(a,'cellMats(cell(0,0)).every(m=>!!MAT[m])'),true,'tous les matériaux cités existent');
});

test('matériaux — le catalogue est complet et cohérent',()=>{
  const c=nouveau();
  gte(G(c,'Object.keys(MAT).length'),150,'au moins 150 matériaux');
  eq(G(c,'Object.keys(MAT).every(k=>MAT[k].n&&CAT[MAT[k].c]&&MAT[k].d>=0&&MAT[k].v>=0)'),true,
    'chaque matériau a un nom, une catégorie connue, une dureté et une valeur');
  eq(G(c,'Object.keys(BIOME).every(b=>BIOME[b].mats.every(m=>!!MAT[m]))'),true,
    'aucun biome ne cite un matériau inconnu');
  eq(G(c,'STRAT_MATS.flat().every(m=>!!MAT[m])'),true,'aucune strate ne cite un matériau inconnu');
  eq(G(c,'STRATA.every(s=>!!MAT[s.rock])'),true,'chaque strate a une roche connue');
  /* l'élasticité, importée de F.1, distingue les bois d'arc */
  gt(G(c,'MAT.if.ela'),G(c,'MAT.ebene.ela'),'l\'if est plus élastique que l\'ébène');
  gt(G(c,'MAT.bambou.ela'),G(c,'MAT.fer.ela'),'le bambou est plus élastique que le fer');
  eq(G(c,'matName("nexistepas")'),'nexistepas','matName tolère une clé inconnue');
});

test('combat — la chaîne Wu Xing et son résolveur',()=>{
  const c=nouveau();
  R(c,'S.occ="combat";S.seg=[];S.bonus=0;spawn();');
  /* engendrement +0.35, hors ordre +0.20, même élément +0.10 */
  near(G(c,'transBonus(0,1)'),.35,1e-9,'Bois → Feu (engendrement) vaut +0,35');
  near(G(c,'transBonus(0,0)'),.10,1e-9,'même élément vaut +0,10');
  near(G(c,'transBonus(0,2)'),.20,1e-9,'hors ordre vaut +0,20');
  eq(G(c,'transBonus(null,3)'),0,'le premier segment ne rapporte rien');
  /* la chaîne se résout au cap et se vide */
  R(c,'S.seg=[];S.bonus=0;for(let i=0;i<capChain()-1;i++)pushSeg(i%5);');
  eq(G(c,'S.seg.length'),G(c,'capChain()-1'),'la chaîne se remplit');
  eq(G(c,'pushSeg(4)'),true,'le dernier segment déclenche le résolveur');
});

test('combat — groupe, dos et balayage',()=>{
  const c=nouveau();
  R(c,'S.occ="combat";const ci=here();ci.b="plaine";ci.corr=40;let n=0;do{spawn();n++;}while(EE.length<2&&n<400);');
  gte(G(c,'EE.length'),2,'une meute arrive en groupe');
  eq(G(c,'E===EE[foc]'),true,'la cible est bien celle qu\'on regarde');
  /* changer de cible */
  R(c,'refocus(1)');
  eq(G(c,'E===EE[1]'),true,'on change de cible');
  /* le dos coûte plus cher, la posture Arrêt l'atténue */
  R(c,'S.stance=0');const dos=G(c,'backMul()');
  R(c,'S.stance=2');const arret=G(c,'backMul()');
  gt(dos,1,'frapper dans le dos coûte plus cher');
  ok(arret<dos,'la posture Arrêt atténue le malus de dos','arrêt '+arret+' vs '+dos);
  /* un coup = un segment, même en balayant */
  R(c,`S.stance=0;S.seg=[];S.bonus=0;S.end=100;
    const p=FUNC.lance.comp.map(ct=>partFor(ct,['fer','chene']));p.push(partFor('fixations',['fer']));
    S.eq.main1=mkItem('arme','lance',p,1.2);
    EE.forEach(e=>{e.hp=e.max=99999;});
    attack(false);`);
  eq(G(c,'S.seg.length'),1,'un balayage ne pose qu\'un seul segment');
  gt(G(c,'EE.filter(e=>e.hp<e.max).length'),1,'le balayage touche plusieurs créatures');
});

test('combat — prises en main et leurs contreparties',()=>{
  const c=nouveau();
  R(c,`mkA=fn=>{const p=FUNC[fn].comp.map(ct=>partFor(ct,['fer','chene','cuir','frene']));
    p.push(partFor('fixations',['fer']));return mkItem('arme',fn,p,1.2);};
    poser=(a,b)=>{S.eq={};S.items=[];S.items.push(mkA(a));equipItem(0);if(b){S.items.push(mkA(b));equipItem(0);}};`);
  R(c,'poser("epee")');            eq(G(c,'grip().k'),'simple','épée seule : une main');
  R(c,'poser("epee","bouclier")'); eq(G(c,'grip().k'),'bouclier','épée et bouclier');
  const pBouclier=G(c,'parryWin()'),redBouclier=G(c,'gripBonus().red');
  R(c,'poser("epee","dague")');    eq(G(c,'grip().k'),'dualwield','deux armes');
  R(c,'poser("marteau")');         eq(G(c,'grip().k'),'deuxmains','marteau : deux mains');
  const pDeuxMains=G(c,'parryWin()');
  gt(pBouclier,pDeuxMains,'le bouclier élargit la parade, la hampe la rétrécit');
  gt(redBouclier,0,'le bouclier réduit les dégâts sur toutes les zones');
  R(c,'poser("arc")');
  eq(G(c,'grip().k'),'dist','arc : tir');
  eq(G(c,'parryWin()'),0,'on ne pare pas avec un arc');
  R(c,'poser("marteau","bouclier")');
  eq(G(c,'!!S.eq.main2'),false,'une arme à deux mains chasse la seconde main');
  /* le bois fait l'arc : élasticité, pas dureté */
  const arcIf=G(c,`(()=>{const p=FUNC.arc.comp.map(ct=>partFor(ct,['if','cuir']));p.push(partFor('fixations',['fer']));return mkItem('arme','arc',p,1.2).ela;})()`);
  const arcEbene=G(c,`(()=>{const p=FUNC.arc.comp.map(ct=>partFor(ct,['ebene','cuir']));p.push(partFor('fixations',['fer']));return mkItem('arme','arc',p,1.2).ela;})()`);
  gt(arcIf,arcEbene*1.8,'un arc d\'if porte bien plus loin qu\'un arc d\'ébène');
});

test('combat — le vocabulaire d\'attaque des créatures',()=>{
  const c=nouveau();
  eq(G(c,'CK.every(k=>(CREATURE[k].pat||["simple"]).every(p=>!!PATTERN[p]))'),true,
    'chaque créature n\'annonce que des gestes connus');
  R(c,'S.occ="combat";spawn();');
  const vus=G(c,'(()=>{const v={};for(let i=0;i<600;i++){spawn();EE.forEach(e=>{armePattern(e);v[e.pat]=1;});}return Object.keys(v).length;})()');
  gte(vus,4,'au moins quatre gestes différents apparaissent');
  /* la charge se lit de loin, le crachat ne se pare pas */
  R(c,'spawn();E.pat="lourd";E.wEff=E.wind*PATTERN.lourd.wm;');
  const fLourd=G(c,'parryWinVs(E)');
  R(c,'E.pat="simple";E.wEff=E.wind;');
  const fSimple=G(c,'parryWinVs(E)');
  gt(fLourd,fSimple,'une charge laisse une fenêtre de parade plus large');
  R(c,'E.pat="crachat";E.wEff=E.wind*PATTERN.crachat.wm;');
  eq(G(c,'parryWinVs(E)'),0,'un crachat ne se pare pas');
});

test('artisanat — la qualité suit la compétence',()=>{
  const c=nouveau(42,'artisan','nain');
  R(c,`S.mat.fer=400;S.mat.chene=400;S.carry=['etabli','forge','enclume','scierie'];`);
  const q=[];
  for(const niv of [0,25,50]){
    R(c,`['forge','menuiserie','assemblage'].forEach(k=>S.sk[k].lv=${niv});
      S.ref={};S.comp={};S.items=[];
      for(let i=0;i<14;i++)transform('lingot','fer');
      for(let i=0;i<4;i++)transform('planche','chene');
      for(let i=0;i<3;i++)makeComp('lame','lingot','fer');
      for(let i=0;i<3;i++)makeComp('manche','planche','chene');
      for(let i=0;i<3;i++)makeComp('fixations','lingot','fer');
      __ck=ct=>Object.keys(S.comp).filter(k=>S.comp[k].ct===ct);
      __it=assembleFrom('arme','epee',[__ck('lame')[0],__ck('manche')[0],__ck('fixations')[0]]);`);
    q.push(G(c,'__it?__it.q:0'));
  }
  gt(q[0],0,'on peut assembler dès le niveau 0');
  gt(q[1],q[0],'la qualité monte avec la compétence');
  gt(q[2],q[1],'et continue de monter');
  gte(G(c,'__it.slots'),1,'un objet de bonne qualité porte une sertissure');
});

test('gemmes — taille, sertissage, plafond',()=>{
  const c=nouveau(42,'artisan','nain');
  R(c,`S.carry.push('tailleur');S.mat.rubis=6;S.mat.ambre=2;S.sk.taille.lv=30;
    cutGem('rubis','degats');cutGem('rubis','affinite');cutGem('ambre','endurance');`);
  eq(G(c,'S.gems.length'),3,'trois gemmes taillées');
  R(c,`const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene']));p.push(partFor('fixations',['fer']));
    S.eq.main1=mkItem('arme','epee',p,1.2);S.eq.main1.slots=3;`);
  const v0=G(c,'S.eq.main1.vec[1]');
  R(c,'socketGem("eq:main1",1)');   /* l'affinité Feu */
  gt(G(c,'S.eq.main1.vec[1]'),v0,'sertir une affinité déplace le vecteur');
  R(c,'socketGem("eq:main1",0)');
  gt(G(c,'gemSum(S.eq.main1,"degats")'),0,'la gemme de dégâts compte');
  R(c,'unsocketGem("eq:main1",0)');
  eq(G(c,'S.eq.main1.gems.length'),1,'désertir retire la gemme');
  eq(G(c,'S.gems.length'),1,'et la détruit : elle ne revient pas en réserve');
});

test('récolte — gisements finis et régénération',()=>{
  const c=nouveau();
  const mk=G(c,'cellMats(here()).filter(canHarvest)[0]');
  const max=G(c,'stockMax(here(),"'+mk+'")');
  gt(max,0,'un gisement a un stock');
  R(c,'takeStock(here(),"'+mk+'",'+max+')');
  eq(G(c,'stockOf(here(),"'+mk+'")'),0,'on peut le vider');
  R(c,'regenStocks()');
  /* une case sauvage revient par quart : le plein prend un mois, pas huit jours */
  gt(G(c,'stockOf(here(),"'+mk+'")'),0,'une cellule sauvage se régénère');
  ok(G(c,'stockOf(here(),"'+mk+'")')<max,'mais pas d\'un coup');
  R(c,'for(let i=0;i<4;i++)regenStocks()');
  eq(G(c,'stockOf(here(),"'+mk+'")'),max,'un mois de repos la refait entièrement');
  /* une cellule revendiquée garde ce qu'on lui a pris, sauf en rôle ressources */
  R(c,'S.or=9999;claimCell();takeStock(here(),"'+mk+'",5);regenStocks();');
  ok(G(c,'stockOf(here(),"'+mk+'")')<max,'un claim ne se régénère pas tout seul');
  R(c,'here().claim="ressources";regenStocks();');
  eq(G(c,'stockOf(here(),"'+mk+'")'),max,'le rôle « ressources » garde la régénération');
});

test('agriculture et élevage — rendement hebdomadaire',()=>{
  const c=nouveau(42,'artisan','humain');
  R(c,`S.or=9999;claimCell();S.mat.limon=60;S.mat.baies=8;
    buildPlot(0,'champ');plantCrop(0,'baies');`);
  eq(G(c,'!!plots(here())[0].crop'),true,'le champ est semé');
  const av=G(c,'S.mat.baies||0');
  R(c,'S.week++;__r=[];weeklyFarms(__r);');
  gt(G(c,'S.mat.baies||0'),av,'le champ produit à la semaine');
  /* l'hiver endort */
  R(c,'S.day=95;');
  eq(G(c,'seasonIdx()'),3,'jour 95 : hiver');
  eq(G(c,'cropYield(here(),plots(here())[0])'),0,'rien ne pousse l\'hiver');
});

test('guildes — gabarits, rangs et suivi',()=>{
  const c=nouveau();
  gte(G(c,'QTPL.length'),25,'au moins 25 gabarits de quête');
  eq(G(c,'GUILDS.every(g=>QTPL.some(t=>t.g===g.k))'),true,'chaque guilde a au moins un gabarit');
  eq(G(c,'QTPL.every(t=>GUILDS.some(g=>g.k===t.g))'),true,'aucun gabarit orphelin');
  R(c,`S.or=9999;claimCell();S.mat.chene=200;S.mat.pierre=200;S.ref['lingot:fer']=20;
    buildPlot(0,'batiment');placeSlot(0,0,'meuble','hall');`);
  eq(G(c,'guildReachable("guerriers")'),true,'un hall chez soi rend les guildes joignables');
  /* une quête de catégorie ne compte que la bonne */
  R(c,`guildOf('guerriers').rank=2;S.quest=null;
    for(let i=0;i<60&&(!S.quest||S.quest.type!=='killcat');i++){S.quest=null;newQuest('guerriers');}`);
  if(ok(G(c,'!!S.quest&&S.quest.type==="killcat"'),'on tire une quête par catégorie')){
    R(c,'__cat=S.quest.cat;__c0=S.quest.cur;questTick("kill",1,{cat:"__faux"});');
    eq(G(c,'S.quest.cur'),G(c,'__c0'),'une mise à mort hors catégorie ne compte pas');
    R(c,'questTick("kill",1,{cat:__cat});');
    eq(G(c,'S.quest.cur'),G(c,'__c0+1'),'la bonne catégorie compte');
  }
  /* montée de rang et présent */
  R(c,`S.quest=null;guildOf('magie').rank=0;guildOf('magie').xp=0;const nb0=S.books.length;
    for(let i=0;i<12;i++){newQuest('magie');if(!S.quest)break;S.quest.cur=S.quest.need;completeQuest();}
    __books=S.books.length-nb0;`);
  gte(G(c,'guildOf("magie").rank'),1,'accomplir des quêtes fait monter en rang');
  gt(G(c,'__books'),0,'le palier s\'accompagne d\'un présent');
});

test('familles — liens, deuil, héritage, succession',()=>{
  const c=nouveau();
  /* on peuple plusieurs villages : un hameau de trois âmes ne prouve rien */
  R(c,`__vus=0;
    for(let x=-45;x<45&&__vus<6;x++)for(let y=-45;y<45&&__vus<6;y++){
      const tt=townAt(x,y);if(!tt||tt.pop<4)continue;
      S.pos=[x,y];ensureNpcs();__vus++;}`);
  gte(G(c,'__vus'),3,'on trouve plusieurs villages');
  const hab=G(c,'S.npcs.length');
  gt(hab,6,'les villages sont peuplés');
  gt(G(c,'S.npcs.filter(n=>n.fam&&n.fam.conjoint).length'),0,'des couples se forment');
  gt(G(c,'S.npcs.filter(n=>n.fam&&n.fam.parents.length).length'),0,'des enfants ont des parents');
  eq(G(c,'S.npcs.filter(n=>estEnfant(n)).every(n=>npcRole(n)!==JOBS[n.job].n)'),true,
    'un mineur n\'a pas de métier affiché');
  /* deuil et héritage */
  R(c,`__p=S.npcs.find(n=>n.fam&&n.fam.conjoint&&n.fam.enfants.length&&npcById(n.fam.conjoint));
    if(__p){__c=npcById(__p.fam.conjoint);__e=npcById(__p.fam.enfants[0]);
    __p.or=400;__m0=__c.mood;__or0=__e.or;npcDeath(__p,'test');}`);
  if(ok(G(c,'!!__p'),'un parent marié existe')){
    eq(G(c,'!!__c.veuf'),true,'le conjoint devient veuf');
    ok(G(c,'__c.mood')<G(c,'__m0'),'et porte le deuil');
    gt(G(c,'__e.or'),G(c,'__or0'),'les enfants héritent de la bourse');
  }
  /* succession d'un trône */
  R(c,`__k=kingdomsNear().find(k=>k.gov==='monarchie'&&k.ruler);
    if(__k){__r=[];rulerDies(__k,__r);}`);
  if(ok(G(c,'!!__k'),'une monarchie existe dans le secteur')){
    eq(G(c,'!!__k.ruler'),false,'le trône est vacant');
    gt(G(c,'__k.transition'),0,'une transition s\'ouvre');
    R(c,'__r2=[];rulerSucceeds(__k,__r2);');
    eq(G(c,'!!__k.ruler'),true,'un successeur monte sur le trône');
  }
  eq(G(c,'kingdomsNear().filter(k=>k.gov==="anarchie").every(k=>!k.ruler)'),true,
    'l\'anarchie ne couronne personne');
});

test('sac et coffres — le dos a une limite, le coffre un lieu',()=>{
  const c=nouveau();
  const cap=G(c,'sacMax()');
  gt(cap,10,'le sac a une capacité');
  R(c,'S.stats.force+=10;');
  gt(G(c,'sacMax()'),cap,'la Force augmente ce qu\'on porte');
  R(c,`S.or=9999;claimCell();S.mat.chene=200;S.mat.pierre=200;
    buildPlot(0,'batiment');placeSlot(0,0,'meuble','coffre');`);
  eq(G(c,'coffreOf()'),30,'un coffre garde trente objets');
  R(c,`mkA=fn=>{const p=FUNC[fn].comp.map(ct=>partFor(ct,['fer','chene']));p.push(partFor('fixations',['fer']));return mkItem('arme',fn,p,1);};
    S.items=[];for(let i=0;i<10;i++)S.items.push(mkA('epee'));rangerTout();`);
  eq(G(c,'S.items.length'),0,'« tout ranger » vide le sac');
  eq(G(c,'coffreList().length'),10,'et remplit le coffre');
  R(c,'__ici=S.pos.slice();S.pos=[S.pos[0]+3,S.pos[1]];');
  eq(G(c,'coffreOf()'),null,'ailleurs, pas de coffre');
  eq(G(c,'coffreList().length'),0,'et rien à reprendre');
  R(c,'S.pos=__ici;');
  eq(G(c,'coffreList().length'),10,'de retour, le coffre est intact');
});

test('sauvegarde — le monde se regénère, l\'aller-retour est fidèle',()=>{
  const c=nouveau();
  R(c,`for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)cell(x,y).seen=true;
    here().depth=3;here().kills=42;S.or=7777;S.nom='Témoin';
    S.or=9999;claimCell();S.or=7777;`);
  const complet=G(c,'JSON.stringify(S).length');
  const packe=G(c,'packSave().length');
  ok(packe<complet*.6,'le monde en écarts pèse moins de 60 % de l\'état brut',
    Math.round(packe/1024)+' ko contre '+Math.round(complet/1024)+' ko');
  const avant=G(c,'JSON.stringify({or:S.or,nom:S.nom,depth:here().depth,kills:here().kills,claims:S.claims.length,vus:Object.values(S.world).filter(x=>x.seen).length,biome:cell(5,5).b})');
  R(c,'__txt=exportSave();S=NEW();S.seed=1;importSave(__txt);');
  const apres=G(c,'JSON.stringify({or:S.or,nom:S.nom,depth:here().depth,kills:here().kills,claims:S.claims.length,vus:Object.values(S.world).filter(x=>x.seen).length,biome:cell(5,5).b})');
  eq(apres,avant,'l\'aller-retour ne perd rien');
  /* une sauvegarde d'avant la compression se recharge encore */
  R(c,`__v1=JSON.parse(decodeURIComponent(escape(atob(__txt.slice(8)))));delete __v1.v;
    __v1.world={'0,0':{x:0,y:0,b:'plaine',corr:10,corr0:10,seen:true,depth:1,cleared:0,claim:null,dug:0,alt:.5,temp:.5,hum:.5,mana:.5,res:.5,veg:.5}};
    S=NEW();unpackSave(__v1);`);
  eq(G(c,'S.or'),7777,'une sauvegarde d\'ancienne version se recharge');
  eq(G(c,'S.world["0,0"].depth'),1,'et son monde complet est conservé');
  /* une sauvegarde abîmée ne fait pas tomber le jeu */
  R(c,`S.mat={nexistepas:5,fer:3};S.modules=[{id:'inconnu',dom:'feu'}];S.items=[null,{}];
    S.spells=[[99]];S.carry=['nexistepas'];sanitize();`);
  eq(G(c,'!!S.mat.nexistepas'),false,'un matériau inconnu est jeté');
  eq(G(c,'S.mat.fer'),3,'les matériaux valides restent');
  eq(G(c,'S.modules.length'),0,'un module inconnu est jeté');
  eq(G(c,'S.carry.length'),0,'une station inconnue est jetée');
  /* ===== UNE PARTIE COMMENCÉE AVANT LES SYSTÈMES RÉCENTS =====
     Un joueur a sa sauvegarde ouverte pendant qu'on développe. Chaque champ
     ajouté depuis — l'épuisement d'une case, le bestiaire, les hameaux — doit
     donc manquer sans casser quoi que ce soit, et le jeu doit tourner comme
     si de rien n'était. C'est le test qui protège les parties en cours. */
  R(c,`S=NEW();S.seed=42;cr.race='humain';cr.classe='guerrier';cr.el=0;cr.an=0;
    cr.pts=30;STATS.forEach(([k])=>cr.st[k]=5);cr.pos=defaultStart();applyBirth();starterKit();
    S.or=4242;here().seen=true;
    /* on retire tout ce qui n'existait pas encore */
    delete S.bes;
    Object.values(S.world).forEach(z=>{delete z.vide;delete z.hameau;});
    globalThis.__vieux=exportSave();
    S=NEW();S.seed=1;importSave(__vieux);`);
  eq(G(c,'S.or'),4242,'une partie d\'avant ces systèmes se recharge');
  ok(!G(c,'!!S.bes')||G(c,'typeof S.bes==="object"'),'le bestiaire manquant ne gêne pas');
  const survit=G(c,`(()=>{const ko=[];
    try{noteBestiaire('loup','v');}catch(e){ko.push('bestiaire: '+e.message);}
    try{bestiaireVus();}catch(e){ko.push('compte: '+e.message);}
    try{vide(here());}catch(e){ko.push('épuisement: '+e.message);}
    try{regenStocks();}catch(e){ko.push('gisements: '+e.message);}
    try{weekly();}catch(e){ko.push('semaine: '+e.message);}
    try{townAt(S.pos[0],S.pos[1]);}catch(e){ko.push('village: '+e.message);}
    try{for(let i=0;i<200;i++)step(.1);}catch(e){ko.push('boucle: '+e.message);}
    try{pComps();pSac();pEquip();pSkills();pCell();}catch(e){ko.push('panneau: '+e.message);}
    return ko;})()`);
  eq(survit.length,0,'et tous les systèmes récents la supportent',survit.join(' | '));
  eq(G(c,'S.bes.loup.v'),1,'le bestiaire se met en route sur une partie ancienne');
  eq(G(c,'vide(here())'),1,'une case sans compteur d\'épuisement est réputée intacte');
  /* et elle se ré-exporte proprement, avec les nouveaux champs */
  R(c,'globalThis.__neuf=exportSave();S=NEW();importSave(__neuf);');
  eq(G(c,'S.or'),4242,'le second aller-retour ne perd rien non plus');
});

test('veille — cadence, repas et plafond',()=>{
  const c=nouveau();
  /* sans cadence observée, elle est calculée */
  R(c,'S.rate={};S.occ="recolte";S.target=cellMats(here()).filter(canHarvest)[0];');
  gt(G(c,'cadence("harv")'),0,'la cadence de récolte se calcule à défaut d\'observation');
  gt(G(c,'cadence("kill")'),0,'celle du combat aussi, à partir de l\'arme');
  const mats0=G(c,'Object.values(S.mat).reduce((a,b)=>a+b,0)');
  R(c,'__rap=offline(8*3600);');
  gt(G(c,'Object.values(S.mat).reduce((a,b)=>a+b,0)'),mats0,'une nuit de récolte rapporte');
  /* on mange sur ses réserves plutôt que de jeûner (au repos : rien n'en rajoute) */
  R(c,`S.faim=100;S.food={};S.vivres=0;addFood('__test:1:Vie',40);S.occ='repos';offline(8*3600);`);
  gt(G(c,'S.faim'),50,'on ne revient pas affamé quand le garde-manger est plein');
  ok(G(c,'S.food["__test:1:Vie"]||0')<40,'les réserves ont servi');
  /* rien à manger : on revient bel et bien affamé */
  R(c,`S.faim=100;S.food={};S.vivres=0;S.occ='repos';offline(8*3600);`);
  eq(G(c,'Math.round(S.faim)'),0,'sans réserves, on revient affamé');
  /* plafonné à huit heures */
  R(c,'__j0=S.day;offline(48*3600);__d1=S.day-__j0;__j0=S.day;offline(8*3600);__d2=S.day-__j0;');
  near(G(c,'__d1'),G(c,'__d2'),.01,'au-delà de huit heures, l\'absence est plafonnée');
});

test('économie — bourses finies, troc, et puits d\'or',()=>{
  const c=nouveau(42,'marchand','humain');
  R(c,`__t=null;for(let x=-40;x<40&&!__t;x++)for(let y=-40;y<40&&!__t;y++){const tt=townAt(x,y);if(tt&&tt.pop>=6)__t=tt;}
    S.pos=[__t.x,__t.y];S.day=Math.floor(S.day)+.5;ensureNpcs();
    cellMats(here()).forEach(m=>S.mat[m]=900);`);
  const or0=G(c,'S.or'),bourse0=G(c,'__t.or');
  R(c,'Object.keys(S.mat).forEach(m=>sellMat(m));');
  const or1=G(c,'S.or');
  gt(or1,or0,'vendre rapporte de l\'or');
  ok(G(c,'__t.or')<bourse0,'la bourse de la ville se vide');
  ok(or1-or0<=bourse0+1,'on ne tire pas plus d\'or que la ville n\'en a',
    'gagné '+(or1-or0)+' pour une bourse de '+bourse0);
  gt(G(c,'S.vivres||0'),0,'à sec, le marchand troque en vivres au lieu de refuser');
  ok(G(c,'Object.values(S.mat).reduce((a,b)=>a+b,0)')>0,'et l\'excédent reste en sac : il faut faire la tournée');
  /* la taxe de guilde détruit de l'or */
  R(c,`S.or=10000;guildOf('guerriers').gains=1000;guildOf('guerriers').rank=2;__o=S.or;__r=[];weeklyGuild(__r);`);
  ok(G(c,'S.or')<G(c,'__o'),'la taxe de guilde sort de l\'or du jeu');
});

test('royaume — claim, entretien, dette et villes',()=>{
  const c=nouveau();
  R(c,'S.or=200000;for(let i=0;i<8;i++){S.pos=[i,0];const ci=here();if(ci.poi==="donjon")ci.poi=null;claimCell();}');
  eq(G(c,'S.claims.length'),8,'huit cellules revendiquées');
  gt(G(c,'claimCost()'),130,'chaque claim coûte plus cher que le précédent');
  R(c,`S.gov='monarchie';S.tresor=0;S.dette=0;S.detteW=0;
    S.mat.chene=400;S.mat.pierre=400;S.mat.limon=400;S.ref['lingot:fer']=40;
    buildPlot(0,'batiment');placeSlot(0,0,'station','forge');`);
  eq(G(c,'countSlot("forge")'),1,'la forge est bien posée sur un claim');
  gt(G(c,'upkeep()'),0,'les structures spéciales coûtent un entretien');
  R(c,'__r=[];S.week++;weeklyKingdom(__r);');
  gt(G(c,'S.dette'),0,'sans trésor, la dette se creuse');
  R(c,'for(let i=0;i<3;i++){__r=[];S.week++;weeklyKingdom(__r);}');
  gte(G(c,'S.detteW'),2,'les semaines de dette s\'accumulent');
  eq(G(c,'defense()'),0,'à quatre semaines de dette, les gardes cessent');
  R(c,'S.or=5000;deposit(4000);__r=[];S.week++;weeklyKingdom(__r);');
  eq(G(c,'S.dette'),0,'déposer au trésor règle la dette');
  eq(G(c,'S.detteW'),0,'et remet le compteur à zéro');
});

test('conquête — assaut, allégeance, ville conquise retrouvée',()=>{
  const c=nouveau();
  R(c,`S.or=200000;S.sk.leadership.lv=60;S.stats.cha=20;S.gov='monarchie';
    __t=null;__k=null;
    for(const k of kingdomsNear()){const tt=kTowns(k).find(x=>x.type!=='capitale');if(tt){__t=tt;__k=k;break;}}
    if(__t){S.pos=[__t.x,__t.y];assaut();
      let n=0;while(S.assaut&&n<600){if(!E)spawn();E.hp=0;kill();n++;}
      S.occ='repos';EE=[];E=null;conquerir();}`);
  if(ok(G(c,'!!__t'),'une ville voisine existe')){
    eq(G(c,'myTowns().includes(__t)'),true,'elle rejoint le royaume');
    eq(G(c,'townAt(__t.x,__t.y)===__t'),true,'une ville conquise reste trouvable sur sa cellule');
    /* vidée puis réoccupée */
    R(c,'__t.pop=0;__t.abandonne=1;conquerir();');
    eq(G(c,'!!__t.abandonne'),false,'une ville vidée se réoccupe');
    gt(G(c,'__t.pop'),0,'et retrouve des habitants');
  }
});

test('progression — compétences et stats montent par l\'usage',()=>{
  const c=nouveau();
  const lv0=G(c,'lv("epee")'),pot0=G(c,'S.sk.epee.pot');
  R(c,'gainXp("epee",100000)');
  gt(G(c,'lv("epee")'),lv0,'l\'XP fait monter la compétence');
  ok(G(c,'S.sk.epee.pot')<pot0,'monter consomme le potentiel',
    pot0+' → '+G(c,'S.sk.epee.pot'));
  gte(G(c,'S.sk.epee.pot'),G(c,'S.sk.epee.base'),'mais jamais sous le plancher de race et classe');
  const f0=G(c,'S.stats.force'),fpot0=G(c,'S.sx.force.pot');
  R(c,'gainStat("force",200000)');
  gt(G(c,'S.stats.force'),f0,'les stats montent aussi');
  ok(G(c,'S.sx.force.pot')<fpot0,'et consomment leur potentiel',
    fpot0+' → '+G(c,'S.sx.force.pot'));
  /* la table le rend */
  R(c,`S.sx.force.pot=60;S.carry.push('cuisine');
    addFood(foodKey('viande',1,'Armes'),6);addFood('baies',4);addFood(foodKey('oeil',4,'Vie'),2);
    __p0=S.sx.force.pot;cook([foodKey('viande',1,'Armes'),'baies',foodKey('oeil',4,'Vie')]);`);
  gt(G(c,'S.sx.force.pot'),G(c,'__p0'),'un plat rend du potentiel de stat');
});

test('magie — chaque module se lance sans casser',()=>{
  const c=nouveau(42,'mage','elfe');
  gte(G(c,'MK.length'),50,'au moins cinquante modules');
  eq(G(c,'DK.every(d=>MK.some(k=>MODULE[k].d.includes(d)))'),true,'chaque domaine a des modules');
  const ratés=G(c,`(()=>{const ko=[];S.occ='combat';S.sk.mana.lv=50;
    MK.filter(k=>MODULE[k].t!=='passif').forEach(k=>{
      const dom=MODULE[k].d[0];
      S.modules=[{id:k,dom,lv:1,xp:0}];S.spells=[[0]];
      if(MODULE[k].t!=='effet'){S.modules.push({id:'projectile',dom:'feu',lv:1,xp:0});S.spells=[[0,1]];}
      spawn();S.mana=9999;
      try{castSpell(0);}catch(e){ko.push(k+': '+e.message);}
      S.buffs=[];S.summon=null;S.dodge=0;});
    return ko;})()`);
  eq(ratés.length,0,'aucun module ne lève d\'exception',ratés.join(' | '));
  /* les passifs se cumulent sans NaN */
  R(c,`S.modules=MK.filter(k=>MODULE[k].t==='passif').map(k=>({id:k,dom:MODULE[k].d[0],lv:3,xp:0}));
    S.postures=S.modules.map((m,i)=>i);__p=passives();`);
  eq(G(c,'Object.values(__p).every(v=>typeof v==="number"&&!Number.isNaN(v))'),true,
    'les passifs cumulés restent des nombres');
  /* Ne pas lever n'est pas suffisant : un module qui se lance, coûte du mana
     et ne fait RIEN est pire qu'un module absent — le joueur l'apprend, le
     place dans une posture, et paie pour du vide. On observe donc l'état du
     monde avant et après chaque lancer. */
  const inertes=G(c,`(()=>{
    const ko=[];S.occ='combat';S.sk.mana.lv=60;
    MK.filter(k=>MODULE[k].t!=='passif').forEach(k=>{
      const dom=MODULE[k].d[0];
      S.modules=[{id:k,dom,lv:2,xp:0}];S.spells=[[0]];
      if(MODULE[k].t!=='effet'){S.modules.push({id:'projectile',dom:'feu',lv:2,xp:0});S.spells=[[0,1]];}
      spawn();S.mana=9999;S.buffs=[];S.summon=null;S.dodge=0;
      /* la creature doit survivre au lancer : si elle meurt, le groupe se
         vide et la comparaison n'a plus rien a comparer */
      EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.st=[];});
      S.hp=Math.round(maxHp()*.5);S.end=40;S.mana=9999;
      const avant={hp:EE.map(e=>e.hp),st:EE.map(e=>(e.st||[]).length),
        moi:S.hp,mst:(S.st||[]).length,buffs:S.buffs.length,
        summon:!!S.summon,dodge:S.dodge||0,end:S.end};
      try{castSpell(0);}catch(e){return;}
      const bouge=EE.some((e,i)=>e.hp!==avant.hp[i])
        ||EE.some((e,i)=>(e.st||[]).length!==avant.st[i])
        ||S.hp!==avant.moi||(S.st||[]).length!==avant.mst
        ||S.buffs.length!==avant.buffs||(!!S.summon)!==avant.summon
        ||(S.dodge||0)!==avant.dodge||S.end!==avant.end;
      if(!bouge)ko.push(k);
      S.buffs=[];S.summon=null;S.dodge=0;S.st=[];
    });
    return ko;})()`);
  eq(inertes.length,0,'aucun des '+G(c,'MK.length')+' modules ne se lance pour rien',
    'sans effet observable : '+inertes.join(', '));
});

test('boutiques — étals hebdomadaires et achats',()=>{
  const c=nouveau(42,'marchand','humain');
  R(c,`__t=null;for(let x=-40;x<40&&!__t;x++)for(let y=-40;y<40&&!__t;y++){const tt=townAt(x,y);if(tt&&tt.shops.length>=3)__t=tt;}
    S.pos=[__t.x,__t.y];S.day=Math.floor(S.day)+.5;S.or=99999;__st=shopStock(__t);`);
  gt(G(c,'Object.keys(__st).length'),0,'la ville a des étals');
  eq(G(c,'Object.values(__st).flat().every(o=>o.p>0&&o.label&&o.t)'),true,
    'chaque article a un prix, un nom et un type');
  R(c,`__n0=Object.values(__st).flat().length;
    Object.keys(__st).forEach(k=>{if(__st[k].length)buyOffer(k,0);});
    __n1=Object.values(shopStock(__t)).flat().length;`);
  ok(G(c,'__n1')<G(c,'__n0'),'acheter retire l\'article de l\'étal');
  R(c,'__avant=__st;S.week+=1;S.day+=7;__st2=shopStock(__t);');
  ok(G(c,'__st2!==__avant'),'l\'étal se renouvelle à la semaine');
  /* la nuit et la mauvaise réputation ferment boutique */
  R(c,'S.day=Math.floor(S.day)+.98;');
  eq(G(c,'shopsOpen(__t)'),false,'les boutiques ferment la nuit');
});

test('chronique — le récit de la partie survit aux absences',()=>{
  const c=nouveau();
  eq(G(c,'(S.chron||[]).length'),0,'une partie neuve n\'a pas d\'histoire');
  R(c,'cutIn("試","Premier fait","détail");');
  eq(G(c,'S.chron.length'),1,'une annonce s\'inscrit');
  eq(G(c,'S.chron[0].t'),'Premier fait','avec son titre');
  gte(G(c,'S.chron[0].d'),0,'et sa date');
  /* les répétitions se comptent au lieu de s'empiler */
  R(c,'for(let i=0;i<4;i++)cutIn("試","Premier fait","détail");');
  eq(G(c,'S.chron.length'),1,'quatre répétitions ne font qu\'une entrée');
  eq(G(c,'S.chron[0].n'),5,'comptée cinq fois');
  /* plafond */
  R(c,'for(let i=0;i<300;i++)cutIn("試","Fait "+i,"");');
  eq(G(c,'S.chron.length'),CHRON(c),'la chronique est plafonnée');
  /* elle traverse la sauvegarde */
  R(c,'__t0=S.chron[0].t;__txt=exportSave();S=NEW();importSave(__txt);');
  eq(G(c,'S.chron[0].t'),G(c,'__t0'),'et survit à un aller-retour de sauvegarde');
});
const CHRON=c=>G(c,'CHRON_MAX');

test('panneaux — chaque onglet se rend, replié ou déplié',()=>{
  const c=nouveau();
  const onglets=['monde','cell','recolte','atelier','equip','magie','table','ville','pnj','comps','batir','royaume','guilde','sac','autos','skills','param'];
  /* sur une partie neuve et sur une partie avancée */
  for(const avance of [false,true]){
    if(avance)R(c,`S.or=99999;claimCell();
      cellMats(here()).concat(['fer','chene','cuir','pierre','rubis']).forEach(m=>{if(MAT[m])S.mat[m]=200;});
      S.carry=['etabli','forge','enclume','scierie','tissage','tailleur','cuisine'];
      FK.forEach(f=>Object.keys(S.mat).forEach(m=>{if(formOk(f,m))addRef(f,m,9);}));
      Object.keys(COMP).forEach(ct=>{S.comp[ct+'|brut|fer|1']={ct,f:'brut',mk:'fer',q:1,n:4};});
      const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene']));p.push(partFor('fixations',['fer']));
      for(let i=0;i<12;i++)S.items.push(mkItem('arme','epee',p,1));
      S.gems=[randomGem(here())];cutIn('試','Fait','détail');
      S.mat.chene=400;S.mat.pierre=400;buildPlot(0,'batiment');placeSlot(0,0,'meuble','coffre');`);
    const ko=G(c,`(()=>{const ko=[];
      const P={monde:pMonde,cell:pCell,recolte:pRecolte,atelier:pAtelier,equip:pEquip,magie:pMagie,
        table:pTable,ville:pVille,pnj:pPnj,comps:pComps,batir:pBatir,royaume:pRoyaume,
        guilde:pGuilde,sac:pSac,autos:pAuto,skills:pSkills,param:pParam};
      for(const k in P){try{const s=P[k]();if(typeof s!=='string'||!s.length)ko.push(k+': vide');}
        catch(e){ko.push(k+': '+e.message);}}
      return ko;})()`);
    eq(ko.length,0,'les dix-sept onglets se rendent'+(avance?' sur une partie avancée':' sur une partie neuve'),ko.join(' | '));
  }
  /* les sections repliables : une seule ouverte, et le choix se retient */
  R(c,'S.fold={};__a=pAtelier();');
  eq(G(c,'S.fold.atelier'),'tr','l\'établi s\'ouvre sur la transformation');
  R(c,'S.fold.atelier="co";__b=pAtelier();');
  ok(G(c,'__b.indexOf("data-fold=\\"atelier:co\\"")')>=0,'la tête de section porte son bouton');
  ok(G(c,'__b.length')<G(c,'__a.length')*3,'déplier une section ne fait pas exploser le panneau');
  R(c,'S.fold.atelier=null;__c=pAtelier();');
  ok(G(c,'__c.length')<G(c,'__a.length'),'tout replié, le panneau est plus court');
  /* Replier ne doit pas rendre un panneau muet : une tête repliée porte
     toujours de quoi décider si on l'ouvre — un compte, un niveau, une valeur.
     Sinon on remplace un mur de texte par une liste d'énigmes. */
  R(c,'S.fold={};globalThis.__s=pSac();globalThis.__k=pSkills();globalThis.__e=pEquip();');
  for(const [nom,src] of [['le sac se replie','__s'],['les compétences se replient','__k']]){
    const n=G(c,src+'.split("data-fold=").length-1');
    gt(n,1,nom+' par familles — '+n+' sections');
  }
  ok(G(c,'__s.indexOf("or")')>=0,'une famille de matières repliée annonce encore sa valeur');
  ok(G(c,'__k.indexOf("plus haute")')>=0||G(c,'__k.indexOf("aucune entamée")')>=0,
    'une famille de compétences repliée annonce encore son niveau');
  /* et les fiches d'objet se plient une par une, sans perdre les gestes fréquents */
  ok(G(c,'__e.indexOf("data-fold=\\"obj:")')>=0,'chaque objet du sac a sa tête repliable');
  ok(G(c,'__e.indexOf("data-equip=")')>=0,'équiper reste accessible sans déplier');
  ok(G(c,'__e.indexOf("data-scrap=")')>=0,'fondre aussi');
});

test('chargement — un module manquant est détecté au démarrage',()=>{
  /* Le jeu se charge en cinquante-six balises <script>. Sur un réseau
     capricieux, il suffit qu'une seule échoue pour démarrer amputé.
     `chargementComplet()` doit voir l'absence de N'IMPORTE lequel. */
  const tous=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')).sort();
  const charge=(liste)=>{
    const ctx=nuContext(42);
    try{vm.runInContext(liste.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n'),ctx);}catch(e){}
    try{return vm.runInContext('typeof chargementComplet==="function"?chargementComplet():false',ctx);}
    catch(e){return false;}
  };
  eq(charge(tous),true,'chargement complet : le contrôle passe');
  const rates=[];
  for(const f of tous){
    if(/^52-/.test(f))continue;               /* le fichier qui porte le contrôle lui-même */
    if(charge(tous.filter(x=>x!==f))!==false)rates.push(f);
  }
  eq(rates.length,0,'l\'absence de chacun des '+(tous.length-1)+' autres modules est détectée',
    'non détectés : '+rates.join(', '));
});

test('statuts — plafonds et anti-enchaînement',()=>{
  const c=nouveau();
  R(c,'S.st=[];S.cdStun=0;addStatus(S,"etourdi",10,1);');
  ok(G(c,'S.st.find(x=>x.k==="etourdi").t')<=2,'un contrôle dur est plafonné à deux secondes');
  R(c,'addStatus(S,"etourdi",2,1);');
  eq(G(c,'S.st.filter(x=>x.k==="etourdi").length'),1,'il ne se réapplique pas aussitôt');
  /* un poison hors combat ne tue pas */
  R(c,'S.occ="repos";S.hp=3;S.st=[];addStatus(S,"poison",20,50);for(let i=0;i<40;i++)tickStatus(S,.5,true);');
  gte(G(c,'S.hp'),1,'hors combat, un poison ronge sans tuer');
});

test('statuts — les cinq qui manquaient au catalogue',()=>{
  /* Le catalogue F.4 en declare quatorze. Huit etaient poses ; deux autres
     existaient sous forme de buffs. Ces cinq-la n'existaient nulle part, et
     chacun doit FAIRE quelque chose de mesurable — sinon c'est une icone. */
  const c=nouveau();

  /* --- HATE : la main va plus vite, et le ralentissement la freine --- */
  R(c,'S.st=[];');
  const vNorm=G(c,'wSpeed()');
  R(c,'addStatus(S,"hate",10,1);');
  gt(G(c,'wSpeed()'),vNorm*1.2,'la hâte accélère vraiment la main');
  R(c,'S.st=[];addStatus(S,"ralenti",10,1);');
  ok(G(c,'wSpeed()')<vNorm*.8,'et le ralentissement la freine — il ne faisait rien sur le joueur');

  /* --- BENI : +1 a tous les jets, donc la moyenne monte d'exactement un --- */
  R(c,'S.st=[];globalThis.__moy=n=>{let s=0;for(let i=0;i<20000;i++)s+=d20();return s/20000;};');
  const sans=G(c,'__moy()');
  R(c,'addStatus(S,"beni",100,1);');
  const avec=G(c,'__moy()');
  near(avec-sans,1,.1,'béni ajoute un point à chaque jet — '+sans.toFixed(2)+' puis '+avec.toFixed(2));

  /* --- INFECTION : elle se compte en jours, pas en secondes --- */
  R(c,'S.st=[];addStatus(S,"infection",4,1);for(let i=0;i<600;i++)tickStatus(S,1,true);');
  eq(G(c,'hasStatus(S,"infection")'),true,'une maladie ne se dissipe pas en dix minutes de combat');
  eq(G(c,'S.st.find(x=>x.k==="infection").t'),4,'son compte reste en jours');
  /* et elle coute de l'endurance, jour apres jour */
  R(c,'S.st=[];S.stats.endu=20;');
  const enduSain=G(c,'st("endu")');
  R(c,'addStatus(S,"infection",4,1);');
  ok(G(c,'st("endu")')<enduSain,'une infection ronge l\'endurance — '+enduSain+' puis '+G(c,'st("endu")'));
  /* le temps la fait passer */
  R(c,'tickJour(4);');
  eq(G(c,'hasStatus(S,"infection")'),false,'quatre jours plus tard, elle est passée');
  eq(G(c,'st("endu")'),enduSain,'et l\'endurance revient entière');
  /* un remède la lave d'un coup */
  R(c,'addStatus(S,"infection",6,1);soigner("infection","essai");');
  eq(G(c,'hasStatus(S,"infection")'),false,'un remède la lave sans attendre');

  /* --- GEL : on ne frappe plus, et la Force finit par rompre la glace --- */
  R(c,'S.st=[];S.cdStun=0;addStatus(S,"gel",10,1);');
  eq(G(c,'hasStatus(S,"gel")'),true,'le gel prend');
  ok(G(c,'S.st.find(x=>x.k==="gel").t')<=2,'et reste un contrôle dur, donc plafonné');
  R(c,'S.st=[];S.cdStun=0;S.stats.force=30;addStatus(S,"gel",2,1);'
    +'globalThis.__t=0;for(let i=0;i<400&&hasStatus(S,"gel");i++){__t+=.05;combatTick(.05);}');
  eq(G(c,'hasStatus(S,"gel")'),false,'un bras solide finit par briser la glace');

  /* --- CONFUSION : le geste part, mais la chaîne se brise --- */
  /* on mesure la regle sur un vrai combat : la chaine ne tient plus */
  R(c,'S.st=[];addStatus(S,"confusion",900,1);S.stats.force=200;S.hp=maxHp();S.end=100;'
    +'globalThis.__max=0;for(let i=0;i<3000;i++){combatTick(.05);if(S.seg.length>__max)__max=S.seg.length;}');
  ok(G(c,'__max')>0,'confus, on frappe encore');
  ok(G(c,'S.seg.length')<G(c,'capChain()'),'mais la chaîne ne tient plus jusqu\'au bout');
});

test('races — chaque bonus annoncé se retrouve dans le jeu',()=>{
  /* Une fiche de race est une promesse en prose. Elles se vérifient une par
     une, sinon l'une d'elles reste décorative — c'était le cas du Cendreux,
     « insensible à la chaleur mineure » nulle part dans le code. */
  const h=nouveau(42,'guerrier','humain');
  const e=nouveau(42,'guerrier','elfe');
  const n=nouveau(42,'guerrier','nain');
  const s=nouveau(42,'guerrier','sylvide');
  const cd=nouveau(42,'guerrier','cendreux');
  const ec=nouveau(42,'guerrier','echomorphe');
  /* on mesure l'XP BRUTE, a un niveau assez haut pour qu'aucun passage de
     niveau ne vienne arrondir l'ecart qu'on cherche */
  const xp=(ctx,sk)=>{R(ctx,'S.sk.'+sk+'.lv=50;S.sk.'+sk+'.xp=0;S.sk.'+sk+'.pot=100;S.repose=0;gainXp("'+sk+'",100);');
    return G(ctx,'S.sk.'+sk+'.xp');};
  /* humain : +10 % d'XP · échomorphe : −10 % */
  gt(xp(h,'epee'),xp(ec,'epee'),'l\'Humain apprend plus vite que l\'Échomorphe');
  /* Nain et Cendreux : le bonus de metier se mesure CONTRE EUX-MEMES.
     Comparer au Humain ne dirait rien, puisqu'il porte un +10 % global qui
     s'applique a tout — la premiere version de ce test s'y est trompee. */
  gt(xp(n,'forge'),xp(n,'epee')*1.1,"le Nain forge mieux qu'il ne se bat");
  gt(xp(n,'minage'),xp(n,'epee')*1.1,'et mine mieux aussi');
  gt(xp(cd,'forge'),xp(cd,'epee')*1.1,"le Cendreux forge mieux qu'il ne se bat");
  ok(Math.abs(xp(cd,'minage')-xp(cd,'epee'))<1,"mais il ne mine pas mieux : ce n'est pas son bonus");
  /* elfe : régénération de mana */
  R(e,'S.mana=0;S.occ="repos";S.faim=90;for(let i=0;i<400;i++)step(.1);');
  R(h,'S.mana=0;S.occ="repos";S.faim=90;for(let i=0;i<400;i++)step(.1);');
  gt(G(e,'S.mana'),G(h,'S.mana')*1.05,'l\'Elfe récupère son mana plus vite — '
    +Math.round(G(e,'S.mana'))+' contre '+Math.round(G(h,'S.mana')));
  /* sylvide : la faim tombe deux fois moins vite */
  R(s,'S.faim=100;S.occ="repos";for(let i=0;i<6000;i++)step(.1);');
  R(h,'S.faim=100;S.occ="repos";for(let i=0;i<6000;i++)step(.1);');
  gt(G(s,'S.faim'),G(h,'S.faim'),'le Sylvide a faim moins vite — '
    +Math.round(G(s,'S.faim'))+' contre '+Math.round(G(h,'S.faim')));
  /* cendreux : insensible à la chaleur mineure, mais pas au froid */
  const chaud=ctx=>G(ctx,'(()=>{const t0=feltTemp;feltTemp=()=>COMFORT[1]+8;'
    +'const r=tempStress();feltTemp=t0;return r?r.e:0;})()');
  const froid=ctx=>G(ctx,'(()=>{const t0=feltTemp;feltTemp=()=>COMFORT[0]-8;'
    +'const r=tempStress();feltTemp=t0;return r?r.e:0;})()');
  gt(chaud(h),0,'huit degrés de trop pèsent sur un Humain');
  eq(chaud(cd),0,'et pas du tout sur un Cendreux');
  const fort=ctx=>G(ctx,'(()=>{const t0=feltTemp;feltTemp=()=>COMFORT[1]+30;'
    +'const r=tempStress();feltTemp=t0;return r?r.e:0;})()');
  gt(fort(cd),0,'une vraie fournaise l\'atteint quand même — '+fort(cd));
  ok(fort(cd)<fort(h),'mais moins que les autres — '+fort(cd)+' contre '+fort(h));
  eq(froid(cd),froid(h),'le froid, lui, le prend en plein');
});

test('zonage — le rôle d\'une cellule tient sa promesse',()=>{
  const c=nouveau();
  /* La fiche du rôle « habitation » promettait que seules ses pièces logent
     les résidents. Elle ne le faisait pas : les lits comptaient partout. */
  R(c,'S.or=999999;S.mat.pierre=999;S.mat.chene=999;S.mat.lin=999;S.mat.limon=999;'
    +'claimCell();buildPlot(0,"batiment");placeSlot(0,0,"meuble","lit");'
    +'globalThis.__a=here();');
  eq(G(c,'beds()'),1,'un lit posé loge quelqu\'un');
  /* une seconde cellule, un second lit */
  /* on cherche une voisine libre : la case a deux pas peut porter un donjon */
  R(c,'for(let d=2;d<9;d++){S.pos=[__a.x+d,__a.y];if(!here().poi&&!here().claim)break;}here().seen=true;S.or=999999;'
    +'S.mat.pierre=999;S.mat.chene=999;S.mat.lin=999;'
    +'claimCell();buildPlot(0,"batiment");placeSlot(0,0,"meuble","lit");'
    +'globalThis.__b=here();');
  eq(G(c,'beds()'),2,'deux cellules, deux lits, sans zonage');
  /* dès qu'on désigne une habitation, elle seule loge */
  R(c,'__a.claim="habitation";');
  eq(G(c,'beds()'),1,'zonée, elle seule loge — l\'autre lit ne compte plus');
  R(c,'__b.claim="habitation";');
  eq(G(c,'beds()'),2,'deux habitations logent deux fois');
  /* et le confort suit le même chemin */
  R(c,'__a.claim="habitation";__b.claim="base";'
    +'placeSlot(0,1,"meuble","tapis");');   /* le tapis va sur __b, non zonée */
  const cf=G(c,'comfort()');
  R(c,'__b.claim="habitation";globalThis.__cf2=comfort();');
  gte(G(c,'__cf2'),cf,'le confort d\'une cellule non zonée ne compte pas non plus');
  /* sans aucun zonage, rien ne change pour qui l\'ignore */
  R(c,'__a.claim="base";__b.claim="base";');
  eq(G(c,'beds()'),2,'sans zonage, tout compte comme avant');
});

test('diplomatie — les quatre accords changent quelque chose',()=>{
  const c=nouveau();
  /* Trois des quatre ne faisaient rien : on négociait, on payait son jet, et
     le monde restait identique. Un traité décoratif est pire qu'aucun traité. */
  eq(G(c,'Object.keys(DIPLO).length'),4,'quatre accords existent');
  eq(G(c,'Object.keys(DIPLOEFFET).length'),4,'et chacun sait dire ce qu\'il change');
  eq(G(c,'Object.keys(DIPLO).every(k=>!!DIPLOEFFET[k])'),true,'sans en oublier un');
  /* accord commercial : la douane de moitié */
  R(c,'S.kingdoms=kingdomsNear();globalThis.__k=S.kingdoms[0];'
    +'__k.tarifs={metal:.30};__k.diplo=null;globalThis.__d0=douane(__k,"fer");'
    +'__k.diplo="commerce";globalThis.__d1=douane(__k,"fer");');
  gt(G(c,'__d1'),G(c,'__d0'),'un accord commercial allège la douane — '
    +G(c,'__d1').toFixed(2)+' contre '+G(c,'__d0').toFixed(2));
  /* non-agression : les raids se raréfient */
  R(c,'S.or=99999;claimCell();S.tresor=99999;'
    +'globalThis.__raids=(diplo)=>{S.kingdoms.forEach(k=>k.diplo=diplo);'
    +'let n=0;for(let i=0;i<400;i++){const r=[];weeklyKingdom(r);'
    +'if(r.some(x=>/raid/.test(x)))n++;S.tresor=99999;S.dette=0;}return n;};');
  const sans=G(c,'__raids(null)'),avec=G(c,'__raids("nonagression")');
  gt(sans,0,'sans pacte, les raids arrivent — '+sans+' sur 400 semaines');
  ok(avec<sans*.75,'avec un pacte, ils se raréfient — '+avec+' contre '+sans);
  /* le tribut achète la même paix : c'est ce qu'on paie */
  const tribut=G(c,'__raids("tribut")');
  ok(tribut<sans*.75,'le tribut aussi — '+tribut+' contre '+sans);
  /* alliance : des renforts à la défense */
  R(c,'S.kingdoms.forEach(k=>k.diplo=null);globalThis.__rap=[];'
    +'for(let i=0;i<200;i++){const r=[];weeklyKingdom(r);__rap=__rap.concat(r);S.tresor=99999;S.dette=0;}');
  eq(G(c,'__rap.some(x=>/renforts/.test(x))'),false,'sans alliance, aucun renfort');
  R(c,'S.kingdoms.forEach(k=>k.diplo="alliance");globalThis.__rap2=[];'
    +'for(let i=0;i<200;i++){const r=[];weeklyKingdom(r);__rap2=__rap2.concat(r);S.tresor=99999;S.dette=0;}');
  eq(G(c,'__rap2.some(x=>/renforts/.test(x))'),true,'avec une alliance, des renforts arrivent');
});

test('consignes — l\'ordre décide, et rien ne s\'interrompt en route',()=>{
  const c=nouveau();
  /* à l'arrêt, le plan ne touche à rien */
  R(c,'plan().on=false;S.occ="repos";S.faim=10;S.hp=1;for(let i=0;i<40;i++)step(.5);');
  eq(G(c,'S.occ'),'repos','à l\'arrêt, les consignes ne décident de rien');
  /* la première consigne vraie ET possible l'emporte, les suivantes sont ignorées */
  R(c,'S.plan={on:true,r:['
    +'{c:"faimbasse",v:50,a:"reposer",on:true},'
    +'{c:"toujours",v:0,a:"combattre",on:true}]};'
    +'S.faim=20;S.hp=maxHp();S.occ="explore";');
  eq(G(c,'planChoix().a'),'reposer','la première condition vraie l\'emporte');
  R(c,'S.faim=90;S.occ="explore";');
  eq(G(c,'planChoix().a'),'combattre','fausse, on passe à la suivante');
  /* une consigne éteinte est sautée */
  R(c,'S.faim=20;S.occ="explore";S.plan.r[0].on=false;');
  eq(G(c,'planChoix().a'),'combattre','une consigne éteinte ne compte pas');
  /* une action impossible laisse la main à la suivante : sinon une seule
     ligne mal placée gèlerait tout le plan */
  R(c,'S.plan={on:true,r:['
    +'{c:"toujours",v:0,a:"dormir",on:true},'
    +'{c:"toujours",v:0,a:"reposer",on:true}]};'
    +'S.day=Math.floor(S.day)+.5;S.occ="explore";');   /* plein jour : on ne dort pas */
  eq(G(c,'planChoix().a'),'reposer','une action impossible ne bloque pas le plan');
  /* et le tick l'applique vraiment */
  R(c,'S.occ="combat";E=null;EE=[];planT=99;step(.1);');
  eq(G(c,'S.occ'),'repos','le tick engage l\'action choisie');
  /* Rien ne s'interrompt en cours de route. On sonde planTick directement :
     passer par step() ne prouverait rien, puisqu'un atelier sans ouvrage et un
     sommeil en plein jour se terminent d'eux-mêmes avant même que les
     consignes soient consultées. */
  for(const [occ,nom] of [['atelier','un ouvrage'],['dormir','un sommeil'],['voyage','un voyage']]){
    R(c,'S.plan={on:true,r:[{c:"toujours",v:0,a:"combattre",on:true}]};'
      +'S.resume=null;S.occ="'+occ+'";planT=99;planTick(.1);');
    eq(G(c,'S.occ'),occ,nom+' ne s\'interrompt pas');
  }
  /* ni une reprise en attente */
  R(c,'S.occ="repos";S.resume="atelier";planT=99;planTick(.1);');
  eq(G(c,'S.occ'),'repos','une reprise en attente non plus');
  /* toutes les conditions et toutes les actions doivent tenir debout */
  const ko=G(c,`(()=>{const ko=[];
    S.occ='repos';S.hp=maxHp()*.5;S.faim=50;S.end=50;
    CONDK.forEach(k=>{try{CONDS[k].test(CONDS[k].def!==undefined?CONDS[k].def:0);}
      catch(e){ko.push('condition '+k+' : '+e.message);}});
    ACTK.forEach(k=>{
      try{if(ACTES[k].peut())ACTES[k].fais();}catch(e){ko.push('action '+k+' : '+e.message);}
      S.occ='repos';E=null;EE=[];});
    return ko;})()`);
  eq(ko.length,0,'les '+G(c,'CONDK.length')+' conditions et '+G(c,'ACTK.length')+' actions tiennent',
    ko.join(' | '));
  /* une sauvegarde citant une condition disparue ne bloque pas le plan */
  R(c,'S.plan={on:true,r:['
    +'{c:"nexistepas",v:0,a:"reposer",on:true},'
    +'{c:"toujours",v:0,a:"combattre",on:true}]};S.occ="explore";');
  eq(G(c,'planChoix().a'),'combattre','une consigne devenue invalide est simplement sautée');
  /* le plan de base est cohérent */
  R(c,'S.plan={on:true,r:planDefaut()};');
  eq(G(c,'planDefaut().every(r=>!!CONDS[r.c]&&!!ACTES[r.a])'),true,
    'le plan de base ne cite que des conditions et des actions connues');
  ok(G(c,'planDefaut().slice(-1)[0].c')==='toujours',
    'et se termine par une consigne sans condition — sinon le plan peut ne rien choisir');
  /* La DERNIERE action doit rester possible a peu pres partout. « Se battre »
     n'en est pas une : elle est impossible dans un village, et un personnage
     entre en ville se figeait alors sans que rien ne le dise. */
  R(c,'globalThis.__v=null;for(let x=-9;x<9&&!__v;x++)for(let y=-9;y<9&&!__v;y++){'
    +'const g=genCell(S.pos[0]+x,S.pos[1]+y);if(g.poi==="village")__v=[g.x,g.y];}'
    +'if(__v){S.pos=[__v[0],__v[1]];here().seen=true;}S.occ="repos";S.hp=maxHp();S.faim=90;');
  eq(G(c,'!!here().town'),true,'on se place dans un village');
  R(c,'S.plan={on:true,r:planDefaut()};');
  ok(!!G(c,'planChoix()'),'le plan de base trouve toujours quoi faire, meme en ville',
    'aucune consigne applicable');
  /* et l'on ne se bat pas dans les rues */
  eq(G(c,'ACTES.combattre.peut()'),false,'on ne se bat pas dans un village');
  eq(G(c,'CONDS.enville.test()'),true,"et le plan sait qu'on y est");
  /* le seuil se règle et reste dans ses bornes */
  R(c,'planRegler(0,"c","pvbas");planRegler(0,"v",9999);');
  ok(G(c,'S.plan.r[0].v')<=G(c,'CONDS.pvbas.max'),'un seuil ne dépasse pas son maximum');
  R(c,'planRegler(0,"v",-50);');
  gte(G(c,'S.plan.r[0].v'),G(c,'CONDS.pvbas.min'),'ni ne tombe sous son minimum');
});

test('paramètres — chaque triche fait ce qu\'elle dit',()=>{
  const c=nouveau();
  ok(G(c,'pParam()').length>500,'l\'onglet se rend');
  eq(G(c,'S.triche||0'),0,'on commence sans avoir triché');
  /* aucune ne doit lever, et chacune doit changer quelque chose */
  /* le personnage part a plat : sinon « soigner » et « rassasier » ne
     changeraient rien, faute de quoi que ce soit a remplir */
  R(c,'S.hp=3;S.end=5;S.mana=0;S.faim=8;SK.forEach(k=>{S.sk[k].pot=40;});'
    +'STATS.forEach(([k])=>{S.sx[k].pot=40;});');
  const ko=G(c,`(()=>{
    const ko=[];
    const photo=()=>JSON.stringify({or:S.or,hp:Math.round(S.hp),end:Math.round(S.end),
      mana:Math.round(S.mana),faim:Math.round(S.faim),
      sk:SK.reduce((a,x)=>a+S.sk[x].lv,0),skp:SK.reduce((a,x)=>a+S.sk[x].pot,0),
      st:STATS.reduce((a,x)=>a+(S.stats[x[0]]||0),0),stp:STATS.reduce((a,x)=>a+S.sx[x[0]].pot,0),
      rec:Object.keys(S.recipes||{}).length,mod:S.modules.length,carry:(S.carry||[]).length,
      mat:Object.keys(S.mat).length,eq:Object.keys(S.eq).length,items:S.items.length,
      vus:Object.values(S.world).filter(z=>z.seen).length,sem:S.week,
      auto:Object.keys(S.auto||{}).length});
    Object.keys(TRICHES).forEach(k=>{
      /* on remet le corps a plat avant chacune : sinon « soigner » ne trouve
         plus rien a soigner apres que « tout remplir » soit passe */
      S.hp=3;S.end=5;S.mana=0;S.faim=8;
      const avant=photo();
      try{appliquerTriche(k);}catch(e){ko.push(k+' lève : '+e.message);return;}
      const apres=photo();
      if(avant===apres)ko.push(k+' ne change rien');
    });
    return ko;})()`);
  eq(ko.length,0,'les '+G(c,'Object.keys(TRICHES).length')+' tricheries agissent sans casser'+(ko.length?' — '+ko.join(' | '):''),ko.join(' | '));
  gte(G(c,'S.triche'),G(c,'Object.keys(TRICHES).length'),'et chacune se compte');
  /* le jeu tourne encore après tout ça */
  const boum=G(c,'(()=>{try{for(let i=0;i<300;i++)step(.1);paint();return null;}catch(e){return String(e);}})()');
  eq(boum,null,'la partie tourne encore après toutes les tricheries — '+(boum||'aucune erreur'));
  /* une clé inconnue ne fait rien de fâcheux */
  R(c,'globalThis.__t0=S.triche;appliquerTriche("nexistepas");');
  eq(G(c,'S.triche'),G(c,'__t0'),'une triche inconnue ne compte pas');
});

test('matières — aucune n\'est inaccessible',()=>{
  const c=nouveau();
  /* Vingt-huit matières du catalogue n'étaient nulle part : ni dans un biome,
     ni dans une strate, et rien ne les produisait. Seize pour cent du
     catalogue en contenu mort. */
  const orphelines=G(c,`(()=>{
    const vu={};
    Object.keys(BIOME).forEach(b=>BIOME[b].mats.forEach(m=>vu[m]=1));
    STRAT_MATS.forEach(l=>l.forEach(m=>vu[m]=1));
    STRATA.forEach(s=>vu[s.rock]=1);
    ['fer','argent','or'].forEach(m=>vu[m]=1);
    CK.forEach(k=>(CREATURE[k].mats||[]).forEach(m=>vu[m]=1));
    if(typeof PARTS!=='undefined')PARTS.forEach(p=>vu[p.k]=1);
    if(typeof GEMK!=='undefined')GEMK.forEach(g=>vu[g]=1);
    Object.keys(MAT).filter(m=>MAT[m].crop).forEach(m=>vu[m]=1);
    ALK.forEach(k=>vu[k]=1);
    return Object.keys(MAT).filter(m=>!vu[m]);})()`);
  eq(orphelines.length,0,'toutes les matières ont une source',
    'introuvables : '+orphelines.slice(0,8).join(', '));
});

test('alliages — le palier industriel se gagne et se paie',()=>{
  const c=nouveau();
  /* on ne fond pas ce qu'on ne sait pas faire */
  eq(G(c,'ALK.some(alliageConnu)'),false,'on commence sans aucune recette');
  ok(G(c,'pAtelier()').indexOf('FONTE')<0,'et l\'établi n\'en parle pas');
  R(c,'apprendreAlliage("acier");');
  eq(G(c,'alliageConnu("acier")'),true,'une recette s\'apprend');
  ok(G(c,'pAtelier()').indexOf('FONTE')>=0,'et la section paraît');
  /* la station, la compétence, la matière, le combustible : quatre verrous */
  R(c,'S.carry=[];S.sk.forge.lv=60;S.mat={fer:20,charbon:20};');
  ok(/fourneau/i.test(G(c,'allierBlocage("acier")')||''),'sans haut fourneau, rien',
    G(c,'allierBlocage("acier")'));
  R(c,'S.carry=["hautfourneau"];S.sk.forge.lv=5;');
  ok(/Forge/.test(G(c,'allierBlocage("acier")')||''),'sans la compétence non plus');
  R(c,'S.sk.forge.lv=60;S.mat={charbon:20};');
  ok(/fer/i.test(G(c,'allierBlocage("acier")')||''),'sans la matière non plus');
  R(c,'S.mat={fer:20};');
  ok(/combustible/i.test(G(c,'allierBlocage("acier")')||''),'sans combustible non plus');
  /* tout réuni, la fonte produit et consomme */
  R(c,'S.mat={fer:20,charbon:20};globalThis.__f0=S.mat.fer;globalThis.__c0=S.mat.charbon;allier("acier");');
  eq(G(c,'allierBlocage("acier")'),null,'tout réuni, plus rien ne bloque');
  gt(G(c,'S.mat.acier||0'),0,'la fonte produit de l\'acier — '+G(c,'S.mat.acier'));
  ok(G(c,'S.mat.fer')<G(c,'__f0'),'elle consomme le minerai');
  ok(G(c,'S.mat.charbon')<G(c,'__c0'),'et le combustible');
  gt(G(c,'S.sk.forge.xp+S.sk.forge.lv'),0,'et elle fait progresser la Forge');
  /* l'anthracite en fait plus avec moins */
  R(c,'S.mat={charbon:10};globalThis.__ch=combustibleDispo();S.mat={anthracite:10};');
  gt(G(c,'combustibleDispo()'),G(c,'__ch'),'l\'anthracite vaut mieux que la houille');
  /* ===== L'ÉQUILIBRAGE PAR LE WU XING (4.2.2) =====
     Un composite doit être statistiquement supérieur ET élémentairement muet :
     c'est le nerf que le GDD n'écrit pas, parce que le vecteur le fait. */
  gt(G(c,'MAT.acier.d'),G(c,'MAT.fer.d'),'l\'acier est plus dur que le fer');
  const platitude=v=>Math.max(...v)-Math.min(...v);
  const vAcier=G(c,'matVec("acier")'),vFer=G(c,'matVec("fer")');
  ok(platitude(vAcier)<platitude(vFer),'mais son vecteur est plus plat — '
    +vAcier.map(x=>x.toFixed(2)).join('/')+' contre '+vFer.map(x=>x.toFixed(2)).join('/'));
  /* Ce que « élémentairement muet » veut dire, concrètement : les
     multiplicateurs s'amortissent. Le composite ne monte jamais aussi haut
     contre une cible bien choisie, et ne tombe jamais aussi bas contre une
     mauvaise. C'est l'expressivité qu'on échange contre la brutalité. */
  const ecart=k=>{
    const g=[0,1,2,3,4].map(e=>G(c,'vmult(matVec("'+k+'"),V({'+e+':1}),multOff)'));
    return {haut:Math.max.apply(null,g),bas:Math.min.apply(null,g)};
  };
  const eFer=ecart('fer'),eAcier=ecart('acier');
  ok(eAcier.haut<eFer.haut,'le composite ne monte pas aussi haut — '
    +eAcier.haut.toFixed(2)+' contre '+eFer.haut.toFixed(2));
  ok(eAcier.bas>eFer.bas,'ni ne tombe aussi bas — '
    +eAcier.bas.toFixed(2)+' contre '+eFer.bas.toFixed(2));
  /* une station de palier ne se bâtit pas sans son aînée */
  R(c,'S.or=99999;S.mat.pierre=999;S.mat.chene=999;S.mat.limon=999;S.ref["lingot:fer"]=99;S.mat.soufre=99;S.mat.fer=99;'
    +'S.carry=[];claimCell();buildPlot(0,"batiment");__toast.length=0;'
    +'placeSlot(0,0,"station","hautfourneau");');
  eq(G(c,'!!plots(here())[0].slots[0]'),false,'un haut fourneau ne se bâtit pas sans forge');
  R(c,'placeSlot(0,0,"station","forge");placeSlot(0,1,"station","hautfourneau");');
  eq(G(c,'!!plots(here())[0].slots[1]'),true,'avec la forge, il se bâtit');
});

test('bestiaire — le jeu retient ce qu\'on a croisé',()=>{
  const c=nouveau();
  eq(G(c,'bestiaireVus()'),0,'on commence sans rien connaître');
  ok(G(c,'pComps()').indexOf('0 / '+G(c,'CK.length'))>=0,'et le panneau le dit');
  /* croiser suffit à inscrire ; abattre et apprivoiser se comptent à part */
  R(c,'S.occ="combat";E=mkEnemy("loup",1,false,false);EE=[E];foc=0;');
  eq(G(c,'bestiaireVus()'),1,'croiser une créature l\'inscrit');
  eq(G(c,'S.bes.loup.v'),1,'et compte la rencontre');
  eq(G(c,'S.bes.loup.t'),0,'sans la compter comme abattue');
  R(c,'E.hp=0;kill(E);');
  eq(G(c,'S.bes.loup.t'),1,'l\'abattre se compte');
  R(c,'S.comps=[];S.sk.dressage.lv=80;S.stats.cha=80;'
    +'for(let i=0;i<40&&!S.comps.length;i++){E=mkEnemy("loup",1,false,false);EE=[E];E.hp=1;tameBeast();}');
  gte(G(c,'S.bes.loup.a'),1,'l\'apprivoiser aussi');
  /* le panneau montre la silhouette de ce qu'on connaît */
  R(c,'S.fold={};S.fold.bes="bete";globalThis.__p=pComps();');
  ok(G(c,'__p').indexOf('besvox')>=0,'la fiche porte une silhouette');
  ok(G(c,'__p').indexOf('class="bx"')>=0,'et la silhouette a de vrais pavés');
  ok(G(c,'__p').indexOf('Loup')>=0,'le loup y figure');
  ok(G(c,'__p').indexOf('Mammouth')<0,'ce qu\'on n\'a pas croisé n\'y figure pas');
  /* une espèce inconnue dans la sauvegarde ne casse rien */
  R(c,'S.bes.nexistepas={v:3,t:1,a:0};globalThis.__b=null;'
    +'try{globalThis.__p2=pComps();}catch(e){__b=String(e);}');
  eq(G(c,'__b'),null,'une espèce disparue de la table ne casse pas le panneau');
  eq(G(c,'bestiaireVus()'),1,'et n\'est pas comptée');
});

test('meubles — chacun apporte ce que sa fiche promet',()=>{
  const c=nouveau();
  R(c,'S.or=99999;S.mat.pierre=999;S.mat.chene=999;S.mat.limon=999;S.mat.lin=999;'
    +'S.mat.os=999;S.ref["lingot:fer"]=40;S.mat.quartz=999;'
    +'claimCell();buildPlot(0,"batiment");placeSlot(0,0,"meuble","lit");');
  const base=G(c,'comfort()');
  gt(base,0,'un logis avec un lit a du confort');
  /* chaque meuble en apporte, et ceux dont la fiche promet plus en donnent plus */
  const gain=k=>{
    R(c,'(()=>{const b=plots(here())[0];for(let i=1;i<b.slots.length;i++)b.slots[i]=null;})();'
      +'placeSlot(0,1,"meuble","'+k+'");');
    return G(c,'comfort()')-base;
  };
  const table=gain('table'),tapis=gain('tapis'),trophee=gain('trophee');
  gt(table,0,'une table apporte du confort — +'+table);
  gt(tapis,table,'un tapis en apporte plus qu\'une table — +'+tapis+' contre +'+table);
  gt(trophee,tapis,'un trophée plus encore — +'+trophee+' contre +'+tapis);
  /* et la fiche annonce le bon chiffre */
  ok(MEUBLE_DIT(G(c,'MEUBLE.tapis.d'),tapis),'la fiche du tapis annonce +'+tapis);
  ok(MEUBLE_DIT(G(c,'MEUBLE.trophee.d'),trophee),'celle du trophée annonce +'+trophee);
  /* aucun meuble ne doit être décoratif au point de ne rien apporter */
  const nuls=G(c,'Object.keys(MEUBLE)').filter(k=>{
    R(c,'(()=>{const b=plots(here())[0];for(let i=1;i<b.slots.length;i++)b.slots[i]=null;})();');
    R(c,'try{placeSlot(0,1,"meuble","'+k+'");}catch(e){}');
    const pose=G(c,'!!plots(here())[0].slots[1]');
    if(!pose)return false;                 /* trop cher pour ce test, pas un défaut */
    const g=G(c,'comfort()')-base;
    const service=/range|loge|éclaire|froid|boutique|quêtes/.test(G(c,'MEUBLE.'+k+'.d'));
    return g<=0&&!service;
  });
  eq(nuls.length,0,'aucun meuble ne coûte des matériaux pour rien',nuls.join(', '));
});
/* la fiche doit citer le confort qu'elle apporte : on cherche « +N » dedans */
const MEUBLE_DIT=(d,n)=>new RegExp('\\+'+n+'\\b').test(d);

test('affixes — chacun fait ce que sa fiche annonce',()=>{
  const c=nouveau();
  /* Un affixe qui s'affiche sans rien faire est pire qu'un affixe absent :
     le joueur choisit son équipement sur ce qu'il lit. On vérifie donc que
     chaque identifiant de la table est effectivement lu quelque part. */
  const morts=G(c,'AFF.map(a=>a.id)').filter(id=>{
    const src=readFileSync(join(root,'src','24-combat.js'),'utf8')
      +readFileSync(join(root,'src','25-modules.js'),'utf8')
      +readFileSync(join(root,'src','15-companions.js'),'utf8');
    /* la déclaration elle-même ne compte pas : on cherche un usage */
    const usages=src.split("id==='"+id+"'").length-1;
    return usages===0;
  });
  eq(morts.length,0,'aucun affixe déclaré n\'est lettre morte',
    'jamais appliqués : '+morts.join(', '));
  /* et « porte » change vraiment l'élément du coup */
  R(c,'S.occ="combat";S.seg=[];S.bonus=0;hitN=0;'
    +'E=mkEnemy("loup",1,false,false);EE=[E];foc=0;E.hp=1e9;E.max=1e9;'
    +'weapon().vec=[1,0,0,0,0];'                    /* arme purement Bois */
    +'weapon().aff=[{id:"porte",p:{n:1,e:4}}];');                     /* chaque coup porte Eau */
  R(c,'S.end=100;S.seg=[];attack(false);');
  eq(G(c,'S.seg[S.seg.length-1]'),4,'l\'affixe pose bien son élément dans la chaîne');
  R(c,'weapon().aff=[];S.end=100;S.seg=[];attack(false);');
  eq(G(c,'S.seg[S.seg.length-1]'),0,'sans lui, l\'arme retrouve le sien');
  /* un n de zéro ne doit pas faire de modulo par zéro */
  R(c,'weapon().aff=[{id:"porte",p:{n:0,e:2}}];S.end=100;S.seg=[];'
    +'globalThis.__b=null;try{attack(false);}catch(e){__b=String(e);}');
  eq(G(c,'__b'),null,'un cycle de zéro ne casse rien');
  ok(Number.isFinite(G(c,'E.hp')),'et les dégâts restent un nombre');
  /* Les conditionnels doivent vraiment mordre. On mesure le total infligé sur
     un grand nombre de coups : le hasard des dés se moyenne, l'effet reste. */
  R(c,'globalThis.__coups=(aff,avant)=>{'
    +'S.occ="combat";hitN=0;S.seg=[];S.bonus=0;'
    +'E=mkEnemy("loup",1,false,false);EE=[E];foc=0;E.hp=1e12;E.max=1e12;E.arm=0;'
    +'weapon().aff=aff;if(avant)avant();'
    +'const h0=E.hp;for(let i=0;i<400;i++){S.end=100;attack(false);}'
    +'return h0-E.hp;};');
  const nu=G(c,'__coups([])');
  gt(nu,0,'une arme sans affixe fait des dégâts');
  const nuit=G(c,'__coups([{id:"nuit",p:{p:60}}],()=>{S.day=Math.floor(S.day)+.92;})');
  gt(nuit,nu,'« la nuit » paie quand il fait nuit — '+Math.round(nuit)+' contre '+Math.round(nu));
  const seul=G(c,'__coups([{id:"seul",p:{p:60}}])');
  gt(seul,nu,'« en duel » paie face à une seule créature');
  const meute=G(c,'__coups([{id:"meute",p:{n:3,p:60}}])');
  ok(Math.abs(meute-nu)<nu*.25,'« en meute » ne paie pas en duel');
  const souffle=G(c,'(()=>{S.occ="combat";E=mkEnemy("loup",1,false,false);EE=[E];foc=0;'
    +'E.hp=1e12;weapon().aff=[{id:"souffle",p:{p:50}}];S.end=100;attack(false);return S.end;})()');
  const plein=G(c,'(()=>{S.occ="combat";E=mkEnemy("loup",1,false,false);EE=[E];foc=0;'
    +'E.hp=1e12;weapon().aff=[];S.end=100;attack(false);return S.end;})()');
  gt(souffle,plein,'« souffle » économise l\'endurance — '+souffle.toFixed(1)+' contre '+plein.toFixed(1));
  /* et les déclencheurs posent bien leur statut */
  R(c,'S.occ="combat";E=mkEnemy("loup",1,false,false);EE=[E];foc=0;E.hp=1e12;E.st=[];'
    +'weapon().aff=[{id:"gel",p:{d:3}},{id:"venin",p:{n:2,d:5}}];S.end=100;attack(false);');
  eq(G(c,'hasStatus(E,"ralenti")'),true,'« gel » ralentit vraiment');
  eq(G(c,'hasStatus(E,"poison")'),true,'« venin » empoisonne vraiment');
});

test('absence — de la seconde au siècle, rien ne casse',()=>{
  const c=nouveau();
  /* Le cœur d'un jeu idle : ce qui se passe pendant qu'on n'est pas là.
     Les valeurs extrêmes viennent de la vraie vie — horloge système reculée,
     onglet dormant des semaines, veille prolongée du téléphone. */
  R(c,'S.food={};addFood("viande:0:force",40);S.vivres=200;S.or=0;'
    +'S.occ="combat";noteRate("kill");noteRate("kill");');
  eq(G(c,'absence(0)'),false,'une absence nulle ne déclenche rien');
  eq(G(c,'absence(89)'),false,'moins de quatre-vingt-dix secondes non plus');
  eq(G(c,'absence(91)'),true,'au-delà, elle se résout');
  /* les valeurs impossibles ne doivent rien produire, surtout pas des NaN */
  for(const [v,nom] of [[-3600,'une absence négative'],[NaN,'une absence NaN'],
                        [Infinity,'une absence infinie']]){
    R(c,'globalThis.__j0=S.day;globalThis.__o0=S.or;globalThis.__f0=S.faim;');
    R(c,'try{absence('+(v===Infinity?'Infinity':v===v?v:'NaN')+');}catch(e){globalThis.__boum=String(e);}');
    ok(Number.isFinite(G(c,'S.day'))&&Number.isFinite(G(c,'S.or'))&&Number.isFinite(G(c,'S.faim')),
      nom+' ne produit pas de NaN','jour '+G(c,'S.day')+' or '+G(c,'S.or')+' faim '+G(c,'S.faim'));
  }
  /* une très longue absence est plafonnée, et ne fait pas boucler l'horloge */
  R(c,'S.day=10;S.week=Math.floor(S.day/WEEK);globalThis.__j1=S.day;');
  const t0=Date.now();
  R(c,'absence(3600*24*365*10);');
  const ms=Date.now()-t0;
  ok(ms<3000,'dix ans d\'absence se résolvent en moins de trois secondes — '+ms+' ms');
  /* S.day compte en JOURS DE JEU, dont chacun dure DAY secondes reelles.
     Le plafond de huit heures reelles vaut donc bien plus de cent jours de jeu. */
  const ecoule=(G(c,'S.day')-G(c,'__j1'))*G(c,'DAY');
  ok(ecoule<=8*3600+1,'et le temps resolu reste plafonne a huit heures reelles — '
    +(ecoule/3600).toFixed(2)+' h, soit '+((G(c,'S.day')-G(c,'__j1'))).toFixed(0)+' jours de jeu');
  ok(Number.isFinite(G(c,'S.or'))&&G(c,'S.or')>=0,'la bourse reste un nombre');
  ok(G(c,'S.faim')>=0&&G(c,'S.faim')<=100,'la faim reste dans ses bornes — '+G(c,'S.faim'));
  ok(G(c,'S.hp')>=1&&G(c,'S.hp')<=G(c,'maxHp()'),'les points de vie aussi — '+Math.round(G(c,'S.hp')));
  /* et l'on ne revient pas d'une absence avec un sac qui déborde */
  ok(G(c,'S.items.length')<=G(c,'sacMax()'),'le sac ne déborde pas au retour');
  /* sans réserves, on revient affamé mais vivant */
  R(c,'S.food={};S.vivres=0;S.faim=100;S.hp=maxHp();absence(3600*8);');
  ok(G(c,'S.hp')>=1,'sans réserves, la faim ne tue pas pendant l\'absence');
});

test('butin — la richesse suit le danger',()=>{
  const c=nouveau();
  /* Règle explicite du GDD (3.0) : « la richesse suit toujours le danger
     (loot ∝ corruption locale), jamais l'inverse ». Elle était écrite mais
     pas faite : la corruption pilotait la rareté et la fréquence, pas la
     qualité de la pièce. */
  R(c,'S.stats.force=200;globalThis.__q=(corr,depth)=>{'
    +'here().corr=corr;here().depth=depth;const l=[];'
    +'for(let i=0;i<300;i++){S.items=[];dropLoot(here(),false);if(S.items[0])l.push(S.items[0].q);}'
    +'S.items=[];return l.reduce((a,b)=>a+b,0)/Math.max(1,l.length);};');
  const paisible=G(c,'__q(0,0)'),mortelle=G(c,'__q(90,0)'),fond=G(c,'__q(90,5)');
  gt(paisible,0,'une case paisible laisse tomber quelque chose');
  gt(mortelle,paisible*1.15,'une terre corrompue rend mieux — q'+mortelle.toFixed(2)
    +' contre q'+paisible.toFixed(2));
  /* Un simple « strictement superieur » sur une moyenne de trois cents tirages
     ne prouve rien : il passait par chance alors que le plafond de risque
     rendait la profondeur STRICTEMENT sans effet. On exige donc un ecart que
     le bruit ne peut pas fabriquer. */
  gt(fond,mortelle*1.08,'et la profondeur ajoute encore — q'+fond.toFixed(2)
    +' contre q'+mortelle.toFixed(2)+' en surface');
  /* mais jamais sans borne : le plafond protège l'atelier */
  ok(fond<paisible*1.6,'le lieu ne rattrape pas ce qu\'un forgeron accompli sait faire',
    'q'+fond.toFixed(2)+' contre q'+paisible.toFixed(2));
  /* la rareté suit aussi, comme avant */
  R(c,'here().corr=0;here().depth=0;globalThis.__r=(corr)=>{here().corr=corr;let n=0;'
    +'for(let i=0;i<300;i++){S.items=[];dropLoot(here(),false);if(S.items[0]&&S.items[0].rar>=2)n++;}'
    +'S.items=[];return n;};');
  gt(G(c,'__r(90)'),G(c,'__r(0)'),'et les pièces rares y sont plus fréquentes');
});

test('libellés — une forme ne répète pas sa matière',()=>{
  const c=nouveau();
  /* FORM.tanne s'appelle « Cuir tanné » : on lisait « Cuir tanné de Cuir ». */
  eq(G(c,'formeNom("tanne","cuir")'),'Cuir tanné','le cuir tanné ne se dit pas deux fois');
  eq(G(c,'formeNom("lingot","fer")'),'Lingot de Fer','un lingot de fer se dit normalement');
  eq(G(c,'formeNom("brut","os")'),G(c,'matName("os")'),'une matière brute garde son nom nu');
  /* aucune combinaison du jeu ne doit produire une répétition */
  const bavards=G(c,'(()=>{const out=[];FK.forEach(f=>Object.keys(MAT).forEach(m=>{'
    +'const n=formeNom(f,m),mn=matName(m);'
    +'const parts=n.split(" de ");'
    +'if(parts.length>1&&parts[0].toLowerCase().includes(mn.toLowerCase()))out.push(n);}));'
    +'return out.slice(0,5);})()');
  eq(bavards.length,0,'aucune forme ne répète sa matière',bavards.join(' · '));
  /* et une clé inconnue ne casse rien */
  ok(G(c,'formeNom("nexistepas","fer")').length>0,'une forme inconnue reste lisible');
  ok(G(c,'formeNom("lingot","nexistepas")').length>0,'une matière inconnue aussi');
});

test('apprivoisement — ce qui se dompte, ce qui se dérobe, et les ordres',()=>{
  const c=nouveau();
  /* une créature qui ne s'apprivoise pas reste sauvage, quoi qu'on tente */
  R(c,'S.occ="combat";S.comps=[];S.sk.dressage.lv=60;S.stats.cha=60;'
    +'globalThis.__nt=CK.find(k=>!CREATURE[k].tame);'
    +'E=mkEnemy(__nt,1,false,false);EE=[E];E.hp=1;__toast.length=0;tameBeast();');
  eq(G(c,'S.comps.length'),0,'une créature non apprivoisable se refuse — '+G(c,'__nt'));
  ok(G(c,'__toast.length')>0,'et on le dit');
  /* une bête apprivoisable, affaiblie, face à un dresseur chevronné : ça finit par prendre */
  R(c,'S.comps=[];globalThis.__ok=null;'
    +'for(let i=0;i<60&&!S.comps.length;i++){E=mkEnemy("loup",1,false,false);EE=[E];E.hp=1;tameBeast();}');
  eq(G(c,'S.comps.length'),1,'un loup affaibli finit par se laisser prendre');
  const b=G(c,'(()=>{const x=S.comps[0];return {type:x.type,cre:x.cre,lv:x.lv,hp:x.hp,order:x.order};})()');
  eq(b.type,'bete','c\'est bien une bête');
  eq(b.cre,'loup','elle garde son espèce — de quoi lui rendre sa silhouette');
  gt(b.hp,0,'elle arrive en vie');
  /* les ordres changent ce qu'elle fait */
  R(c,'S.occ="combat";E=mkEnemy("cerf",3,false,false);EE=[E];');
  R(c,'S.comps[0].order="suivre";globalThis.__d0=compDmg(S.comps[0],E);');
  R(c,'S.comps[0].order="attaquer";globalThis.__d1=compDmg(S.comps[0],E);');
  R(c,'S.comps[0].order="tenir";globalThis.__d2=compDmg(S.comps[0],E);');
  eq(G(c,'__d0'),0,'« suivre » ne frappe pas');
  gt(G(c,'__d1'),0,'« attaquer » frappe');
  ok(G(c,'__d2')<G(c,'__d1'),'« tenir » frappe moins fort — il encaisse à ta place');
  /* le moral pèse : une bête maltraitée frappe moins */
  R(c,'S.comps[0].order="attaquer";S.comps[0].mood=100;globalThis.__h=compDmg(S.comps[0],E);'
    +'S.comps[0].mood=20;globalThis.__b=compDmg(S.comps[0],E);');
  ok(G(c,'__b')<G(c,'__h'),'une bête au moral bas frappe moins fort');
  /* l'escorte a un plafond, et il vient du Charisme et du Leadership (E.17) */
  R(c,'S.stats.cha=5;S.sk.leadership.lv=0;globalThis.__m0=escortMax();'
    +'S.stats.cha=40;S.sk.leadership.lv=40;globalThis.__m1=escortMax();');
  gt(G(c,'__m1'),G(c,'__m0'),'charisme et commandement ouvrent des places');
  /* et l'on ne collectionne pas les bêtes sans fin */
  R(c,'S.comps=[];for(let i=0;i<12;i++)S.comps.push({id:"z"+i,type:"bete",cre:"loup",nom:"z",el:0,lv:1,hp:1,max:1,order:"suivre",esc:false,dead:0,mode:"permanent"});'
    +'__toast.length=0;E=mkEnemy("loup",1,false,false);EE=[E];E.hp=1;tameBeast();');
  ok(G(c,'S.comps.length')<=12,'douze bêtes suffisent — '+G(c,'S.comps.length'));
});

test('cuisine — nourrit, soigne, et l\'harmonie des cinq paie',()=>{
  const c=nouveau();
  R(c,'S.carry=Object.keys(STATION);S.sk.cuisine.lv=20;');
  /* de quoi cuisiner : une viande par élément, ce que la chasse rapporte */
  R(c,'S.food={};for(let e=0;e<5;e++)addFood(foodKey("viande",e,MEATGRP[e]),4);'
    +'globalThis.__cinq=Object.keys(S.food).slice(0,5);');
  eq(G(c,'__cinq.length'),5,'on tient cinq ingrédients, un par élément');
  /* un plat à trois éléments */
  R(c,'S.faim=20;S.hp=10;globalThis.__f0=S.faim;cook(__cinq.slice(0,3));');
  gt(G(c,'S.faim'),G(c,'__f0'),'un plat nourrit');
  gt(G(c,'S.hp'),10,'et remet d\'aplomb');
  /* l'harmonie des cinq éléments rend davantage que trois */
  R(c,'S.food={};for(let e=0;e<5;e++)addFood(foodKey("viande",e,MEATGRP[e]),4);'
    +'S.faim=0;cook(Object.keys(S.food).slice(0,3));globalThis.__trois=S.faim;');
  R(c,'S.food={};for(let e=0;e<5;e++)addFood(foodKey("viande",e,MEATGRP[e]),4);'
    +'S.faim=0;cook(Object.keys(S.food).slice(0,5));globalThis.__cinqN=S.faim;');
  gt(G(c,'__cinqN'),G(c,'__trois'),'cinq éléments valent mieux que trois — '
    +Math.round(G(c,'__cinqN'))+' contre '+Math.round(G(c,'__trois')));
  /* ce qui manque ne se cuisine pas, et le poison reste au poison */
  R(c,'__toast.length=0;S.food={};cook(["viande:0:force"]);');
  ok(G(c,'__toast.length')>0,'un ingrédient absent est refusé');
  R(c,'__toast.length=0;globalThis.__tox=Object.keys(PLANTE).find(k=>PLANTE[k].tox);'
    +'if(__tox){addFood(__tox,2);cook([__tox]);}');
  ok(!G(c,'__tox')||G(c,'__toast.length')>0,'une plante toxique ne va pas dans la marmite');
  /* la faim ne dépasse pas son plafond */
  R(c,'S.food={};for(let e=0;e<5;e++)addFood(foodKey("viande",e,MEATGRP[e]),4);'
    +'S.faim=98;cook(Object.keys(S.food).slice(0,5));');
  ok(G(c,'S.faim')<=100,'la faim ne déborde pas — '+G(c,'S.faim'));
});

test('lecture — un livre s\'use, réussit ou rate, et enseigne son domaine',()=>{
  const c=nouveau();
  R(c,'S.books=[];S.modules=[];for(let i=0;i<40;i++)dropBook(4);');
  gte(G(c,'S.books.length'),1,'des livres tombent');
  const n0=G(c,'S.books.length');
  R(c,'globalThis.__dom=S.books[0].dom;readBook(0);');
  eq(G(c,'S.books.length'),n0-1,'lire consomme le livre, réussite ou non');
  /* la lecture progresse toujours, même sur un échec */
  gt(G(c,'S.sk.lecture.xp+S.sk.lecture.lv'),0,'déchiffrer fait progresser en lecture');
  /* avec assez de tentatives, on finit par apprendre — et dans le bon domaine */
  R(c,'S.sk.lecture.lv=40;S.stats.per=40;S.modules=[];'
    +'S.books=[];for(let i=0;i<60;i++)S.books.push({id:"b"+i,dom:__dom,diff:3});'
    +'while(S.books.length)readBook(0);');
  gt(G(c,'S.modules.length'),0,'un lecteur exercé finit par apprendre');
  eq(G(c,'S.modules.every(m=>MODULE[m.id].d.includes(m.dom))'),true,
    'chaque module appris relève bien du domaine de son livre');
  eq(G(c,'S.modules.every(m=>m.lv>=1)'),true,'et il est utilisable');
  /* relire le même domaine approfondit au lieu d'empiler des doublons */
  const distincts=G(c,'new Set(S.modules.map(m=>m.id+":"+m.dom)).size');
  eq(distincts,G(c,'S.modules.length'),'aucun doublon : relire approfondit');
  /* lire un index qui n'existe pas ne casse rien */
  R(c,'readBook(99);');
  ok(true,'lire un livre absent ne lève pas');
});

test('escorte — compagnons et bêtes ont une silhouette',()=>{
  const c=nouveau();
  /* un compagnon humain et une bête apprivoisée */
  R(c,'S.comps=[{id:"c1",type:"pnj",nom:"X",el:0,lv:3,hp:40,max:40,order:"attaquer",esc:true,dead:0,mode:"permanent"},'
    +'{id:"c2",type:"bete",cre:"loup",nom:"Y",el:2,lv:3,hp:40,max:40,order:"attaquer",esc:true,dead:0,mode:"permanent"}];');
  eq(G(c,'escortList().length'),2,'les deux suivent');
  const h1=G(c,'compHtml(S.comps[0])'),h2=G(c,'compHtml(S.comps[1])');
  ok(h1.length>200,'un compagnon humain a une silhouette');
  ok(h2.length>200,'une bête apprivoisée aussi');
  ok(h1!==h2,'et ce n\'est pas la même : un loup n\'a pas la carrure d\'un homme');
  /* la bête garde la silhouette de son espèce */
  ok(h2.split('class="bx"').length-1===G(c,'VOX[ARCH.loup[0]].length'),
    'le loup apprivoisé garde ses dix pavés de loup');
  /* et la carte du compagnon la porte, dans l'onglet COMPAGNONS */
  const pan=G(c,'pComps()');
  ok(pan.indexOf('besvox')>=0,'chaque compagnon montre sa silhouette sur sa carte');
  ok(pan.split('class="bx"').length-1>=20,'et ce sont de vrais pavés');
  R(c,'S.comps[1].dead=1;');
  ok(G(c,'pComps()').indexOf('besvox mort')>=0,'un compagnon mort s\'efface sans disparaître');
  R(c,'S.comps[1].dead=0;');
  /* une créature inconnue ne fait rien exploser */
  R(c,'S.comps[1].cre="nexistepas";');
  ok(G(c,'compHtml(S.comps[1])').length>100,'une espèce inconnue retombe sur une silhouette valide');
});

test('donjon — se génère, se descend, se vide, et referme la faille',()=>{
  const c=nouveau();
  /* on se pose sur une entrée : il en existe forcément une dans le voisinage */
  R(c,'globalThis.__d=null;for(let x=-14;x<14&&!__d;x++)for(let y=-14;y<14&&!__d;y++){'
    +'const g=genCell(S.pos[0]+x,S.pos[1]+y);if(g.poi==="donjon")__d=[g.x,g.y];}');
  ok(!!G(c,'__d'),'une entrée de donjon existe dans le voisinage');
  if(!G(c,'__d'))return;
  R(c,'S.pos=[__d[0],__d[1]];here().seen=true;S.hp=maxHp();enterDungeon();');
  eq(G(c,'S.occ'),'donjon','on y entre');
  const d=G(c,'(()=>{const x=dj();return {etages:x.floors.length,salles:x.floors[0].length,nom:x.nom,theme:x.theme};})()');
  gte(d.etages,2,'il a au moins deux étages');
  gte(d.salles,8,'et au moins huit salles par étage');
  eq(G(c,'!!DJTHEME[dj().theme]'),true,'son thème est connu — '+d.theme);
  /* la dernière salle du dernier étage est le gardien */
  eq(G(c,'(()=>{const x=dj();return x.floors[x.floors.length-1].slice(-1)[0].t;})()'),'boss',
    'le gardien ferme le dernier étage');
  /* la puissance croît en descendant */
  const p0=G(c,'djPower()');
  R(c,'dj().f=dj().floors.length-1;dj().r=0;');
  gt(G(c,'djPower()'),p0,'plus bas, plus dangereux');
  /* on descend tout : aucune salle ne doit lever d'exception */
  R(c,'dj().f=0;dj().r=0;S.hp=maxHp();'
    +'globalThis.__salles=0;globalThis.__boum=null;'
    +'try{for(let i=0;i<400&&!dj().clear;i++){S.hp=maxHp();djAdvance();__salles++;}}catch(e){__boum=String(e);}');
  eq(G(c,'__boum'),null,'aucune salle ne casse — '+(G(c,'__boum')||'aucune'));
  gt(G(c,'__salles'),10,'on traverse bien tout le donjon — '+G(c,'__salles')+' salles');
  eq(G(c,'dj().clear'),true,'le gardien tombé, le donjon est vidé');
  eq(G(c,'S.occ'),'repos','et l\'on en ressort');
  /* on n'y retourne pas */
  R(c,'__toast.length=0;enterDungeon();');
  eq(G(c,'S.occ'),'repos','un donjon vidé ne se rouvre pas');
  /* la faille se referme d\'elle-même */
  R(c,'S.day=here().djDone+.1;tickClock(0.001);');
  eq(G(c,'here().poi'),null,'la cellule redevient ordinaire');
  eq(G(c,'here().dj'),null,'et son donjon est oublié');
  /* et une faille nettoyée ailleurs se referme aussi, sans qu'on y retourne */
  R(c,'globalThis.__l=cell(__d[0]+40,__d[1]+40);__l.poi="donjon";__l.dj={clear:true};__l.djDone=S.day-1;weekly();');
  eq(G(c,'__l.poi'),null,'une faille nettoyée ailleurs se referme aussi');
});

test('dette — les paliers mordent, mais l\'ardoise reste payable',()=>{
  const c=nouveau();
  R(c,'S.or=99999;S.mat.pierre=999;S.mat.chene=999;S.mat.limon=999;'
    +'claimCell();buildPlot(0,"batiment");placeSlot(0,0,"station","etabli");');
  gt(G(c,'upkeep()'),0,'un territoire coûte à entretenir');
  /* cent semaines d'abandon : la dette doit se stabiliser, pas s'envoler */
  R(c,'S.tresor=0;S.dette=0;S.detteW=0;for(let i=0;i<100;i++)weekly();');
  const d=G(c,'S.dette'),up=G(c,'upkeep()');
  ok(d<=Math.max(up*8,50)+.001,'cent semaines d\'abandon plafonnent l\'ardoise — '
    +Math.round(d)+' pour un entretien de '+up);
  gt(d,0,'mais la dette existe bel et bien');
  gte(G(c,'S.detteW'),4,'et les semaines impayées se comptent toujours');
  /* le GDD l'exige : rien ne se detruit tout seul (A.8.1) */
  eq(G(c,'S.claims.length'),1,'le territoire n\'est jamais confisqué');
  eq(G(c,'plots(here()).filter(Boolean).length'),1,'aucune structure ne s\'écroule d\'elle-même');
  /* et régulariser remet tout d'aplomb */
  R(c,'S.or=99999;deposit(Math.ceil(S.dette)+100);weekly();');
  eq(G(c,'S.dette'),0,'déposer de quoi solde l\'ardoise');
  eq(G(c,'S.detteW'),0,'et les paliers retombent');
});

test('quêtes — se prennent, se suivent, se rendent, et font monter le rang',()=>{
  const c=nouveau();
  /* on se donne un hall pour ne pas dépendre d'une capitale à cent cases */
  R(c,'S.or=99999;S.mat.pierre=999;S.mat.chene=999;S.mat.limon=999;'
    +'S.ref["lingot:fer"]=30;claimCell();buildPlot(0,"batiment");'
    +'placeSlot(0,0,"meuble","hall");');
  gte(G(c,'countSlot("hall")'),1,'un hall se bâtit sur son territoire');
  R(c,'globalThis.__gk="guerriers";S.quest=null;newQuest(__gk);');
  const q=G(c,'S.quest?{type:S.quest.type,need:S.quest.need,or:S.quest.or,txt:S.quest.txt}:null');
  ok(!!q,'une quête se prend une fois le hall accessible',G(c,'JSON.stringify(__toast.slice(-1))'));
  if(!q)return;
  ok(q.need>0,'elle demande quelque chose de chiffré — '+q.txt);
  gt(q.or,0,'elle promet une récompense');
  eq(G(c,'(newQuest(__gk),S.quest.txt)'),q.txt,'on ne cumule pas deux quêtes');
  /* le monde signale, la quête retient — et ce qui ne la concerne pas glisse */
  R(c,'S.quest.type="killcat";S.quest.cat="humain";S.quest.cur=0;S.quest.need=3;');
  R(c,'questTick("kill",1,{cat:"bete"});');
  eq(G(c,'S.quest.cur'),0,'une bête ne compte pas pour un contrat sur des hommes');
  R(c,'questTick("harvest",5,"fer");');
  eq(G(c,'S.quest.cur'),0,'une récolte non plus');
  R(c,'questTick("kill",1,{cat:"humain"});');
  eq(G(c,'S.quest.cur'),1,'un hors-la-loi, si');
  /* elle se solde toute seule au compte */
  R(c,'globalThis.__or0=S.or;questTick("kill",2,{cat:"humain"});');
  eq(G(c,'S.quest'),null,'atteindre le compte la solde');
  gt(G(c,'S.or'),G(c,'__or0'),'et paie');
  gt(G(c,'guildOf(__gk).xp+guildOf(__gk).rank'),0,'la guilde retient ce qui a été fait');
  /* une livraison ne se solde qu'avec la matière en sac */
  R(c,'S.quest={g:__gk,tpl:"x",type:"deliver",cur:9,need:4,mat:"fer",or:10,xp:5,txt:"livrer"};'
    +'delete S.mat.fer;completeQuest();');
  ok(G(c,'!!S.quest'),'une livraison sans la matière ne passe pas');
  R(c,'S.mat.fer=10;completeQuest();');
  eq(G(c,'S.quest'),null,'avec la matière, elle passe');
  eq(G(c,'S.mat.fer||0'),6,'et la matière est bien prélevée');
  /* le rang monte quand l'XP le justifie */
  R(c,'const g=guildOf(__gk);g.rank=0;g.xp=guildRankNeed(0)+5;'
    +'S.quest={g:__gk,tpl:"x",type:"kill",cur:1,need:1,or:1,xp:0,txt:"x"};completeQuest();');
  gte(G(c,'guildOf(__gk).rank'),1,'assez d\'XP fait monter d\'un rang');
});

test('soin — travailler soigne, moins vite que se reposer',()=>{
  const c=nouveau();
  /* Le cas vécu en simulation : un mineur a passé cinquante semaines à un
     point de vie sur cent trente-six. Une famine du premier mois l'avait
     ramené à 1 (la faim ne tue pas, A.9), et la récolte ne rendait aucun
     point — seul un arrêt volontaire soignait. */
  R(c,'S.faim=90;S.hp=1;S.occ="recolte";S.target=cellMats(here()).filter(canHarvest)[0];'
    +'for(let i=0;i<600;i++)step(.1);');
  gt(G(c,'S.hp'),1,'soixante secondes de récolte rendent des points de vie');
  const enTravail=G(c,'S.hp');
  R(c,'S.faim=90;S.hp=1;S.occ="repos";S.resume=null;for(let i=0;i<600;i++)step(.1);');
  gt(G(c,'S.hp'),enTravail,'le repos soigne plus vite — '+Math.round(G(c,'S.hp'))+' contre '+Math.round(enTravail));
  /* affamé, on ne se soigne pas : la faim reste une contrainte */
  R(c,'S.faim=0;S.hp=10;S.occ="recolte";for(let i=0;i<600;i++)step(.1);');
  ok(G(c,'S.hp')<=10,'affamé, le travail ne soigne plus');
  gte(G(c,'S.hp'),1,'mais la faim ne tue toujours pas hors combat');
});

test('gisements — une case travaillée reste à sec, une case au repos revient',()=>{
  const c=nouveau();
  R(c,'S.pos=[0,0];here().claim=null;globalThis.__m=cellMats(here())[0];'
    +'globalThis.__max=stockMax(here(),__m);here().stock={};here().stock[__m]=0;');
  const max=G(c,'__max');
  gt(max,0,'un gisement a un plein');
  R(c,'regenStocks();');
  const apres=G(c,'stockOf(here(),__m)');
  gt(apres,0,'une semaine de repos en rend une part');
  ok(apres<max,'mais pas la totalité — '+apres+' sur '+max,
    'une mine qui se referme en une semaine n\'est pas une mine');
  /* quatre semaines suffisent à tout refaire */
  R(c,'for(let i=0;i<4;i++)regenStocks();');
  eq(G(c,'stockOf(here(),__m)'),max,'un mois de repos la refait entièrement');
  /* une case revendiquée en ressources se refait d'un coup : c'est ce qu'on achète */
  R(c,'here().claim="ressources";here().stock={};here().stock[__m]=0;regenStocks();');
  eq(G(c,'stockOf(here(),__m)'),max,'une case revendiquée en ressources se refait entièrement');
  /* et l'on ne peut plus vider une case indéfiniment sans la voir baisser */
  R(c,'here().claim=null;here().stock={};here().stock[__m]=__max;'
    +'globalThis.__pris=0;for(let s=0;s<8;s++){__pris+=takeStock(here(),__m,99999);regenStocks();}');
  ok(G(c,'__pris')<max*8,'huit semaines de raclage rendent moins que huit pleins — '
    +G(c,'__pris')+' contre '+(max*8));
});

test('hameaux — un village de la carte est un vrai village',()=>{
  const c=nouveau();
  /* le monde avait deux notions de village sans rapport : celle du terrain
     (genCell) et celle des royaumes (kTowns). townAt ne connaissait que la
     seconde, et l'on arrivait dans des villages nommés, vides de tout. */
  R(c,'globalThis.__v=null;for(let dx=-8;dx<=8&&!__v;dx++)for(let dy=-8;dy<=8&&!__v;dy++){'
    +'const g=genCell(S.pos[0]+dx,S.pos[1]+dy);if(g.poi==="village")__v=[g.x,g.y];}');
  ok(!!G(c,'__v'),'un village de terrain existe dans le voisinage');
  /* non visité : rien ne se matérialise, la sauvegarde ne gonfle pas */
  eq(G(c,'townAt(__v[0],__v[1])===null'),true,'un village jamais visité ne se matérialise pas');
  R(c,'cell(__v[0],__v[1]).seen=true;');
  const t=G(c,'(()=>{const t=townAt(__v[0],__v[1]);return t?{nom:t.nom,shops:t.shops.length,or:t.or}:null;})()');
  ok(!!t,'une fois la case connue, le village est une vraie ville');
  ok(t&&t.nom&&t.nom.length>1,'il porte le nom que la carte annonçait — '+(t&&t.nom));
  gte(t?t.shops:0,1,'il tient au moins un étal');
  gt(t?t.or:0,0,'il a une bourse');
  /* et il reste le même d'une visite à l'autre */
  R(c,'globalThis.__n1=townAt(__v[0],__v[1]).nom;');
  eq(G(c,'townAt(__v[0],__v[1]).nom===__n1'),true,'il ne change pas de nom entre deux visites');
  /* les étals s'y garnissent vraiment */
  R(c,'S.pos=[__v[0],__v[1]];here().seen=true;');
  gte(G(c,'Object.keys(shopStock(townAt(__v[0],__v[1]))).length'),1,'ses étals se garnissent');
});

test('boutiques — les enseignes varient, et la ville décide de la qualité',()=>{
  const c=nouveau();
  /* Le tirage des enseignes ne comparait que la LONGUEUR des noms : la
     moitié en fait huit, si bien que toutes les villes du monde tenaient
     les mêmes étals — et pas une ne vendait d'arme. */
  R(c,'globalThis.__ens={};for(let x=-30;x<30;x+=3)for(let y=-30;y<30;y+=3)'
    +'tirage(BOUTIQUES,x,y,58,2).forEach(s=>__ens[s]=(__ens[s]||0)+1);');
  eq(G(c,'Object.keys(__ens).length'),G(c,'BOUTIQUES.length'),
    'chaque enseigne finit par apparaître quelque part');
  ok(G(c,'(__ens.armurier||0)')>10,'l\'armurier n\'est pas systématiquement écarté',
    'occurrences : '+G(c,'JSON.stringify(__ens)'));
  /* la qualité suit le rang de la ville : hameau < ville < capitale */
  R(c,'globalThis.__q=(cap,n)=>{let s=0;for(let i=0;i<n;i++)s+=qVille({cap,prosp:1});return s/n;};');
  const h=G(c,'__q(6,400)'),v=G(c,'__q(14,400)'),k=G(c,'__q(26,400)');
  gt(v,h,'une ville vend mieux qu\'un hameau ('+v.toFixed(2)+' contre '+h.toFixed(2)+')');
  gt(k,v,'une capitale vend mieux qu\'une ville ('+k.toFixed(2)+' contre '+v.toFixed(2)+')');
  /* et une capitale doit dépasser l'équipement de départ, sinon le voyage ne paie pas */
  gt(k,1.2,'une capitale dépasse la qualité de départ — '+k.toFixed(2));
  /* les villages de la carte ne s'appellent plus tous pareil */
  R(c,'globalThis.__noms=new Set();for(let x=-40;x<40;x++)for(let y=-40;y<40;y++){'
    +'const g=genCell(x,y);if(g.poi==="village")__noms.add(g.town);}');
  gte(G(c,'__noms.size'),80,'les villages portent des noms variés — '+G(c,'__noms.size')+' distincts');
});

test('modules — tout ce qui est écrit est chargé, partout',()=>{
  /* Un module oublié quelque part ne se voit pas : le jeu marche dans le
     navigateur et l'outil tourne à vide, ou l'inverse. C'est arrivé — le
     simulateur chargeait par liste blanche de préfixes et laissait tomber
     chaque nouveau fichier, jusqu'à ce que la boucle appelle une fonction
     absente et que quatre bots sur quatre s'arrêtent à la première seconde. */
  const modules=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')).sort();
  gte(modules.length,50,'le jeu compte au moins cinquante modules');
  /* index.html les charge tous, dans l'ordre des noms */
  const html=readFileSync(join(root,'index.html'),'utf8');
  const oublies=modules.filter(f=>!html.includes('src/'+f));
  eq(oublies.length,0,'index.html charge chaque module','absents : '+oublies.join(', '));
  /* et l'ordre des balises suit l'ordre des noms : les préfixes numériques
     SONT l'ordre de chargement, un const déclaré plus loin n'existe pas avant */
  const dansHtml=[...html.matchAll(/src\/([0-9][^"]*\.js)/g)].map(m=>m[1]);
  const trie=dansHtml.slice().sort();
  eq(dansHtml.join(','),trie.join(','),'et dans l\'ordre de leurs préfixes',
    dansHtml.find((f,i)=>f!==trie[i])||'');
  /* les trois outils chargent la même chose que le jeu */
  for(const outil of ['spec.mjs','sim.mjs','courbe.mjs']){
    const src=readFileSync(join(root,'tools',outil),'utf8');
    /* la règle peut tenir sur deux lignes : on lit la ligne et sa suivante */
    const lg=src.split('\n');
    const idx=lg.findIndex(l=>l.includes("readdirSync(join(root,'src'))"));
    const ligne=idx<0?null:(lg[idx]+' '+(lg[idx+1]||''));
    ok(!!ligne,outil+' charge bien les modules du jeu');
    ok(!!ligne&&/f\.endsWith\('\.js'\)/.test(ligne)&&!/\^\(0\[1-9\]/.test(ligne),
      outil+' les prend tous, sans liste blanche à maintenir',ligne&&ligne.trim());
  }
});

test('publication — feuille de style et code du même âge',()=>{
  /* Le défaut vécu : le service worker rafraîchissait fichier par fichier et
     l'on chargeait le nouveau code avec l'ancienne feuille. Ces deux valeurs
     doivent bouger ensemble, sinon le garde-fou du démarrage ne sert à rien. */
  const css=readFileSync(join(root,'src','style.css'),'utf8');
  const boot=readFileSync(join(root,'src','52-boot.js'),'utf8');
  const rc=(/--css-rev:\s*([0-9]+)/.exec(css)||[])[1];
  const rb=(/const CSS_REV='([0-9]+)'/.exec(boot)||[])[1];
  ok(!!rc,'la feuille de style déclare sa révision');
  ok(!!rb,'le démarrage connaît la révision attendue');
  eq(rc,rb,'les deux révisions concordent',
    'style.css dit '+rc+', 52-boot.js attend '+rb+' — bouge les deux ensemble');
  /* le service worker ne doit plus servir le cache avant le réseau */
  const sw=readFileSync(join(root,'sw.js'),'utf8');
  eq(/const VERSION='sensen-mini-[0-9a-f]{8}'/.test(sw),true,
    'la version du cache est un condensé du contenu');
});

test('territoire — une case raclée se dépeuple, et se repeuple',()=>{
  const c=nouveau();
  R(c,'S.pos=[0,0];here().cleared=0;here().kills=0;here().vide=0;');
  eq(G(c,'vide(here())'),1,'une case intacte a tout son gibier');
  /* les trois premières purges ne coûtent rien : nettoyer reste gratuit */
  R(c,'here().kills=14;here().cleared=2;');
  eq(G(c,'vide(here())'),1,'nettoyer une case ne la vide pas');
  R(c,'here().cleared=3;here().vide=200;');
  eq(G(c,'vide(here())'),4,'raclée jusqu\'à l\'os, elle plafonne à quatre fois le délai');
  /* et le gibier revient si on laisse la case tranquille */
  R(c,'here().vide=120;for(let i=0;i<5;i++)weekly();');
  eq(G(c,'vide(here())'),1,'cinq semaines de répit la repeuplent entièrement');
  /* un donjon n'est pas un territoire de chasse : rien ne s'y raréfie */
  R(c,'here().vide=200;S.occ="donjon";EE=[];removeEnemy({});');
  ok(G(c,'respawnT')<=1.4,'sous terre, rien ne se raréfie');
});

test('bestiaire — chaque espèce est jouable, visible et à sa place',()=>{
  const c=nouveau();
  const cles=G(c,'CK');
  /* une espèce dont un matériau, un pattern ou un biome n'existe pas
     casse le butin, le télégraphe ou le peuplement — silencieusement */
  const matsInconnus=G(c,'CK.filter(k=>(CREATURE[k].mats||[]).some(m=>!MAT[m]))');
  eq(matsInconnus.length,0,'aucune créature ne lâche un matériau inconnu','fautives : '+matsInconnus.join(', '));
  const patsInconnus=G(c,'CK.filter(k=>(CREATURE[k].pat||[]).some(p=>!PATTERN[p]))');
  eq(patsInconnus.length,0,'aucune créature n\'annonce un geste inconnu','fautives : '+patsInconnus.join(', '));
  const biosInconnus=G(c,'CK.filter(k=>(CREATURE[k].bio||[]).some(b=>!BIOME[b]))');
  eq(biosInconnus.length,0,'aucune créature ne vit dans un biome inexistant','fautives : '+biosInconnus.join(', '));
  /* sans squelette explicite, une créature retombe sur sa catégorie et
     un crabe se retrouve à quatre pattes de loup */
  const sansSquelette=G(c,'CK.filter(k=>!ARCH[k])');
  eq(sansSquelette.length,0,'chaque espèce a son squelette voxel','sans squelette : '+sansSquelette.join(', '));
  const squelettesInconnus=G(c,'Object.keys(ARCH).filter(k=>!VOX[ARCH[k][0]])');
  eq(squelettesInconnus.length,0,'chaque squelette référencé existe','fautifs : '+squelettesInconnus.join(', '));
  const orphelins=G(c,'Object.keys(ARCH).filter(k=>!CREATURE[k])');
  eq(orphelins.length,0,'aucun squelette ne pointe vers une espèce disparue','orphelins : '+orphelins.join(', '));
  /* chaque biome doit pouvoir peupler une rencontre */
  const biomesVides=G(c,'Object.keys(BIOME).filter(b=>!CK.some(k=>CREATURE[k].bio.includes(b)))');
  eq(biomesVides.length,0,'aucun biome n\'est dépeuplé','vides : '+biomesVides.join(', '));
  /* la porte de puissance : les grosses bêtes ne tombent pas sur un débutant */
  R(c,'globalThis.__cel={b:"toundra",corr:0,depth:0,poi:null};'
    +'globalThis.__bas=[];for(let i=0;i<600;i++)__bas.push(creaturePool(__cel,false,false,1));');
  eq(G(c,'__bas.includes("mammouth")'),false,'un mammouth n\'apparaît pas dans une toundra tranquille');
  R(c,'globalThis.__ht=[];for(let i=0;i<600;i++)__ht.push(creaturePool(__cel,false,false,6));');
  eq(G(c,'__ht.includes("mammouth")'),true,'il apparaît là où la puissance le justifie');
  gte(cles.length,44,'le bestiaire compte au moins quarante-quatre espèces');
});

/* ================= exécution ================= */
let total=0,echecs=0;
const t0=Date.now();
for(const c of cas){
  if(ONLY&&!c.nom.toLowerCase().includes(ONLY.toLowerCase()))continue;
  courant={n:0,echecs:[]};
  let crash=null;
  try{c.fn();}catch(e){crash=e;}
  total+=courant.n;
  const ko=courant.echecs.length+(crash?1:0);
  echecs+=ko;
  console.log((ko?'ÉCHEC':'ok   ')+'  '+c.nom+'  ('+courant.n+' vérification'+(courant.n>1?'s':'')+')');
  courant.echecs.forEach(m=>console.log('        ✗ '+m));
  if(crash){
    console.log('        ✗ exception : '+crash.message);
    const src=(crash.stack||'').split('\n').find(l=>l.trim()&&!/^\s*at /.test(l)&&!l.includes(crash.message));
    if(src)console.log('          '+src.trim().slice(0,120));
  }
}
console.log('\n'+total+' vérifications · '+(echecs?echecs+' en échec':'toutes passent')+' · '+((Date.now()-t0)/1000).toFixed(1)+' s');
process.exit(echecs?1:0);
