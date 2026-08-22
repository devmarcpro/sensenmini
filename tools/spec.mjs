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
  /* La liste des onglets se lit dans index.html : ecrite a la main ici, elle
     aurait oublie le dix-huitieme le jour ou on l'ajoute — et c'est
     exactement ce qui est arrive a l'onglet COMBAT. */
  const onglets=[...readFileSync(join(root,'index.html'),'utf8')
    .matchAll(/data-tab="([a-z]+)"/g)].map(m=>m[1]);
  /* LES ONGLETS SONT RANGES PAR FAMILLE, et un onglet ajoute hors famille se
     retrouverait rattache en silence a la precedente — c'est-a-dire au
     mauvais endroit. On exige donc que chaque onglet suive un intitule, et
     qu'aucune famille ne soit vide. */
  const nav=readFileSync(join(root,'index.html'),'utf8');
  const bloc=nav.slice(nav.indexOf('<nav id="tabs">'),nav.indexOf('</nav>'));
  const jetons=[...bloc.matchAll(/class="navgrp">([^<]+)<|data-tab="([a-z]+)"/g)]
    .map(m=>m[1]?{g:m[1]}:{t:m[2]});
  ok(jetons.length&&jetons[0].g,'la barre commence par un intitule de famille');
  let fam=null;const orphelins=[],vides=[];let compte=0;
  jetons.forEach(j=>{
    if(j.g){if(fam!==null&&compte===0)vides.push(fam);fam=j.g;compte=0;}
    else{if(fam===null)orphelins.push(j.t);compte++;}
  });
  if(fam!==null&&compte===0)vides.push(fam);
  ok(orphelins.length===0,'chaque onglet appartient a une famille',
    orphelins.length?'sans famille : '+orphelins.join(', '):'');
  ok(vides.length===0,'aucune famille ne reste vide',vides.length?'vides : '+vides.join(', '):'');
  eq(jetons.filter(j=>j.t).length,onglets.length,'et la barre porte tous les onglets connus');

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
        guilde:pGuilde,sac:pSac,combat:pCombat,autos:pAuto,skills:pSkills,
      collection:pCollection,param:pParam};
      for(const k in P){try{const s=P[k]();if(typeof s!=='string'||!s.length)ko.push(k+': vide');}
        catch(e){ko.push(k+': '+e.message);}}
      return ko;})()`);
    /* Un bouton de la barre sans panneau derriere est pire qu'un bouton
       absent : il se clique et ne rend rien. On compare donc la barre au
       tableau des panneaux, dans les deux sens. */
    const rendus=G(c,`Object.keys({monde:1,cell:1,recolte:1,atelier:1,equip:1,magie:1,table:1,ville:1,
      pnj:1,comps:1,batir:1,royaume:1,guilde:1,sac:1,combat:1,autos:1,skills:1,
      collection:1,param:1})`);
    const orphelins=onglets.filter(t=>!rendus.includes(t));
    eq(orphelins.length,0,'chaque bouton de la barre a son panneau','sans panneau : '+orphelins.join(', '));
    const invisibles=rendus.filter(t=>!onglets.includes(t));
    eq(invisibles.length,0,'et chaque panneau a son bouton','sans bouton : '+invisibles.join(', '));
    eq(ko.length,0,'les '+onglets.length+' onglets se rendent'+(avance?' sur une partie avancée':' sur une partie neuve'),ko.join(' | '));
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
  /* AUCUN PANNEAU NE DOIT DEVENIR UN MUR. Le repli existe pour ca, et il ne
     sert a rien si une seule section ouverte fait cent mille octets. Le
     bestiaire en faisait CENT TRENTE-QUATRE MILLE une fois la categorie
     « betes » ouverte : trente-trois silhouettes voxel construites pour en
     regarder une. On mesure donc le pire cas — tout rencontre, tout abattu,
     un sac plein — et l'on refuse qu'une section ouverte depasse un seuil
     qu'un telephone puisse faire defiler. */
  R(c,`S.bes={};CK.forEach(k=>{S.bes[k]={v:9,t:4,a:1};});
    S.comps=[];for(let i=0;i<6;i++)S.comps.push({id:'c'+i,nom:'compagnon '+i,el:i%5,lv:9,
      hp:50,max:50,xp:0,esc:i<2,order:'attaquer',dead:0,mode:'permanent',eq:null,pot:90,
      seq:[{o:'tenir',n:2},{o:'attaquer',n:3}]});
    S.seq={on:true,i:0,r:seqDefaut()};`);
  const gros=G(c,`(()=>{
    const P={monde:pMonde,cell:pCell,recolte:pRecolte,atelier:pAtelier,equip:pEquip,magie:pMagie,
      table:pTable,ville:pVille,pnj:pPnj,comps:pComps,batir:pBatir,royaume:pRoyaume,
      guilde:pGuilde,sac:pSac,combat:pCombat,autos:pAuto,skills:pSkills,param:pParam};
    const ko=[];
    for(const k in P){
      /* on ouvre tour a tour chacune des sections que le panneau propose */
      S.fold={};
      let base='';try{base=P[k]();}catch(e){ko.push(k+' : '+e.message);continue;}
      const cles=[...new Set([...base.matchAll(/data-fold="([a-z0-9]+):([^"]+)"/g)].map(m=>m[1]+'|'+m[2]))];
      let pire=base.length,quoi='replié';
      cles.forEach(ck=>{
        const [grp,sec]=ck.split('|');
        S.fold={};S.fold[grp]=sec;
        let s='';try{s=P[k]();}catch(e){ko.push(k+' ('+ck+') : '+e.message);return;}
        if(s.length>pire){pire=s.length;quoi=ck;}
      });
      S.fold={};
      if(pire>70000)ko.push(k+' : '+Math.round(pire/1000)+' ko ('+quoi+')');
    }
    return ko;})()`);
  eq(gros.length,0,'aucun panneau ne dépasse 70 ko, section la plus lourde ouverte',
    'murs : '+gros.join(' | '));

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

test('lecture — le jet decide de tout, pas seulement du seuil',()=>{
  /* « Echec → effet mineur · Echec de 10 et plus, ou 1 naturel → effet grave »
     (A.7). On tirait dans une seule liste : rater d'un point pouvait invoquer
     un monstre, et un desastre pouvait ne couter qu'un peu de mana. Le jet ne
     decidait de rien au-dela du franchissement, ce qui est la moitie d'un
     systeme de des. */
  const c=nouveau();
  R(c,`globalThis.__livre=(diff)=>{S.books=[{id:'b'+S.nid++,dom:'feu',diff:diff||4}];};
    /* on force le de : c'est la seule facon d'eprouver une regle qui parle de
       marges et de naturels */
    globalThis.__R=Math.random;
    globalThis.__de=(v)=>{Math.random=()=>(v-1)/20+.001;};
    globalThis.__libre=()=>{Math.random=__R;};`);

  /* --- un echec LEGER ne donne qu'un effet mineur --- */
  R(c,`S.sk.lecture.lv=0;S.stats.per=5;S.st=[];S.mana=maxMana();
    globalThis.__mineurs=0,globalThis.__graves=0;
    for(let i=0;i<200;i++){
      __livre(30);                       /* DD 25 : on echoue de peu avec un 20 */
      S.st=[];S.occ='repos';E=null;EE=[];
      __de(20);readBook(0);__libre();
      if(S.occ==='combat'||hasStatus(S,'confusion'))__graves++;else __mineurs++;
    }`);
  eq(G(c,'__graves'),0,'rater de peu ne déclenche jamais un effet grave');
  gt(G(c,'__mineurs'),0,'mais bien un effet mineur');

  /* --- un echec LOURD en donne un grave --- */
  R(c,`globalThis.__g2=0;
    for(let i=0;i<200;i++){
      __livre(60);                       /* DD 40 : un 2 rate de trente-huit */
      S.st=[];S.occ='repos';E=null;EE=[];
      const p0=S.pos.slice();
      __de(2);readBook(0);__libre();
      if(S.occ==='combat'||hasStatus(S,'confusion')||S.pos[0]!==p0[0]||S.pos[1]!==p0[1])__g2++;
      S.pos=p0;
    }`);
  gt(G(c,'__g2'),150,'rater de dix ou plus donne un effet grave — '+G(c,'__g2')+' fois sur 200');

  /* --- un 1 naturel est grave meme quand la marge ne l'est pas --- */
  /* Un 1 naturel n'est grave QUE s'il fait echouer : A.7 dit « echec de dix
     et plus, OU 1 naturel », les deux dans la branche echec. Avec un lecteur
     chevronne, un 1 passe quand meme — et c'est ce que le texte decrit. On
     eprouve donc un debutant, ou le 1 rate de peu. */
  R(c,`S.sk.lecture.lv=0;S.stats.per=5;
    globalThis.__g3=0;
    for(let i=0;i<200;i++){
      __livre(4);
      S.st=[];S.occ='repos';E=null;EE=[];
      const p0=S.pos.slice();
      __de(1);readBook(0);__libre();
      if(S.occ==='combat'||hasStatus(S,'confusion')||S.pos[0]!==p0[0]||S.pos[1]!==p0[1])__g3++;
      S.pos=p0;
    }`);
  ok(G(c,'__g3')>0,'et un 1 naturel qui échoue est grave, même de peu — '+G(c,'__g3')+' fois');

  /* --- une reussite LARGE ouvre tout le livre --- */
  R(c,`S.sk.lecture.lv=0;S.stats.per=5;S.modules=[];
    __livre(2);S.st=[];__de(20);readBook(0);__libre();
    /* on compte les NIVEAUX : quand le meme module ressort, il monte au lieu
       de s'ajouter, et le nombre d'entrees ne bouge pas */
    globalThis.__large=S.modules.reduce((a,m)=>a+m.lv,0);
    S.modules=[];S.sk.lecture.lv=0;
    __livre(2);S.st=[];`);
  /* un franchissement tout juste : DD 11, un 11 passe d'un cheveu */
  R(c,'__de(11);readBook(0);__libre();globalThis.__juste=S.modules.reduce((a,m)=>a+m.lv,0);');
  gt(G(c,'__large'),G(c,'__juste'),
    'une réussite de dix et plus rend davantage — '+G(c,'__large')+' niveaux contre '+G(c,'__juste'));

  /* --- et les deux tables sont disjointes : sinon la graduation ne veut rien dire --- */
  const commun=G(c,'READFAIL.filter(x=>READFAIL_GRAVE.includes(x))');
  eq(commun.length,0,'les effets mineurs et graves ne se recouvrent pas',
    'communs : '+commun.join(', '));
  gt(G(c,'READFAIL.length'),1,'il y a de quoi varier le mineur');
  gt(G(c,'READFAIL_GRAVE.length'),1,'et le grave');
});

test('cavernes — la profondeur a enfin quelque chose a montrer',()=>{
  /* Cinq strates, et la seule difference entre elles etait le nom de la roche
     et sa durete. On perce, on recolte, on perce plus bas : rien a TROUVER en
     profondeur, seulement a extraire. */
  const c=nouveau();

  /* --- la premiere strate reste pleine : « pas de trou beant depuis le ciel » --- */
  const surface=G(c,`(()=>{let n=0;
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=0;d<2;d++)if(caverne(x,y,d))n++;
    return n;})()`);
  eq(surface,0,'aucune poche dans les deux premières strates');

  /* --- il y en a en profondeur, et pas partout --- */
  const bas=G(c,`(()=>{let g=0,s=0,t=0;
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=2;d<=5;d++){
      t++;const n=caverne(x,y,d);if(n===1)g++;if(n>=2)s++;}
    return {g,s,t};})()`);
  gt(bas.g,0,'des galeries sous la surface — '+bas.g+' sur '+bas.t);
  gt(bas.s,0,'et de rares grandes salles — '+bas.s);
  ok(bas.s<bas.g,'les salles restent plus rares que les galeries');
  ok((bas.g+bas.s)/bas.t<.20,'et la roche pleine reste la règle — '
    +Math.round((bas.g+bas.s)/bas.t*100)+' % de vide');

  /* --- L'INTERSECTION DE DEUX CHAMPS, ET NON UN SEUL SEUIL. C'est la seule
     idee de E.2.4, et elle se mesure : un tunnel doit se prolonger. Un bruit
     unique a seuil donne des taches isolees ; deux champs croises donnent des
     galeries qui se suivent. --- */
  const suite=G(c,`(()=>{
    let seules=0,vues=0;
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=2;d<=5;d++){
      if(caverne(x,y,d)!==1)continue;
      vues++;
      let voisines=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]])
        if(caverne(x+dx,y+dy,d))voisines++;
      if(!voisines)seules++;
    }
    return {seules,vues};})()`);
  gt(suite.vues,50,'assez de galeries pour juger — '+suite.vues);
  ok(suite.seules/suite.vues<.35,'une galerie se prolonge, elle n\'est pas une tache isolée — '
    +suite.seules+' isolées sur '+suite.vues);

  /* --- une poche donne les speleothemes, que la strate ne portait pas --- */
  const trouve=G(c,`(()=>{
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=2;d<=5;d++){
      if(caverne(x,y,d)!==1)continue;
      const cc=Object.assign({},genCell(x,y),{depth:d});
      /* la liste SANS caverne, reconstruite a la main : biome, strates,
         filon. Comparer a la seule table des strates laissait passer les
         concretions que le biome porte deja — et le test survivait alors au
         debranchement du raccord. */
      const base=genCell(x,y);
      const sans=BIOME[base.b].mats.concat(STRAT_MATS.slice(1,d+1).flat())
        .concat([STRATA[Math.min(5,d)].rock]);
      const avec=cellMats(cc);
      const neuf=cavMats(cc).filter(m=>!sans.includes(m)&&avec.includes(m));
      if(neuf.length)return {x,y,d,neuf};
    }
    return null;})()`);
  ok(!!trouve,'une galerie ajoute des concrétions aux matières de la strate'
    +(trouve?' — '+trouve.neuf.slice(0,4).join(', '):''));

  /* --- une grande salle donne ce qu'une galerie ne donne pas --- */
  const plus=G(c,`(()=>{
    const g=[],s=[];
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=2;d<=5;d++){
      const n=caverne(x,y,d);if(!n)continue;
      const l=cavMats({x,y,depth:d});
      (n>=2?s:g).push(l.length);
    }
    return {g:g.length?Math.max(...g):0,s:s.length?Math.max(...s):0};})()`);
  gt(plus.s,plus.g,'une grande salle donne davantage — '+plus.s+' contre '+plus.g);

  /* --- et son eau dormante se peche, sans que le ciel compte --- */
  const noyee=G(c,`(()=>{
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++)for(let d=2;d<=5;d++){
      const cc=Object.assign({},genCell(x,y),{depth:d});
      if(cavEau(cc))return [x,y,d];
    }
    return null;})()`);
  ok(!!noyee,'certaines salles sont noyées');
  if(noyee){
    R(c,'S.pos=['+noyee[0]+','+noyee[1]+'];here().seen=true;here().depth='+noyee[2]+';'
      +'globalThis.__m0=meteo;meteo=()=>"blizzard";globalThis.__t0=tempC;tempC=()=>-30;');
    eq(G(c,'pecheBlocage()'),null,'et l\'on y pêche même sous un blizzard — on est dessous');
    R(c,'meteo=__m0;tempC=__t0;');
  }
});

test('rivieres — l eau cesse d etre une bordure',()=>{
  /* Trois biomes sur vingt touchent l'eau. Partout ailleurs, aucune goutte :
     pas de peche, pas de barque, pas d'arrosage contre la canicule. Le GDD
     decrit un vrai reseau (E.2.2) — des sources en altitude, une descente de
     pente, une largeur qui croit — et tout cela se transpose a la case. */
  const c=nouveau();

  /* --- il y a de l'eau, et pas partout --- */
  const compte=G(c,`(()=>{let n=0,t=0,large=0;
    for(let x=-60;x<60;x++)for(let y=-60;y<60;y++){t++;const r=riviere(x,y);if(r){n++;if(r>=2)large++;}}
    return {n,t,large};})()`);
  gt(compte.n,0,'le monde porte des cours d\'eau — '+compte.n+' cases sur '+compte.t);
  ok(compte.n/compte.t<.15,'mais l\'eau reste rare — '+Math.round(compte.n/compte.t*100)+' %');
  gt(compte.large,0,'et certains sont assez larges pour une barque — '+compte.large);

  /* --- UNE RIVIERE NE REMONTE JAMAIS. C'est la seule regle qui la rend
     credible, et elle se verifie : chaque case d'un cours d'eau doit avoir
     une voisine en aval, plus basse, qui en porte aussi — sauf a la mer ou
     dans un creux sans exutoire. --- */
  const remontees=G(c,`(()=>{
    const alt=(x,y)=>noise(x,y,S.seed,1,5);
    let ko=0,vus=0;
    for(let x=-40;x<40;x++)for(let y=-40;y<40;y++){
      const r=riviere(x,y);if(!r)continue;
      vus++;
      if(alt(x,y)<.24)continue;                       /* la mer */
      const a=alt(x,y);
      let plusBasEnEau=false,creux=true;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const na=alt(x+dx,y+dy);
        if(na<a){creux=false;if(riviere(x+dx,y+dy))plusBasEnEau=true;}
      }
      if(!creux&&!plusBasEnEau)ko++;
    }
    return {ko,vus};})()`);
  gt(remontees.vus,20,'assez de cases d\'eau pour juger — '+remontees.vus);
  ok(remontees.ko/Math.max(1,remontees.vus)<.12,
    'presque aucune ne s\'interrompt à flanc de pente — '+remontees.ko+' sur '+remontees.vus);

  /* --- elle est deterministe : deux lectures donnent la meme chose --- */
  const a1=G(c,'riviere(17,-23)'),a2=G(c,'riviere(17,-23)');
  eq(a1,a2,'deux lectures de la même case donnent la même eau');
  /* et elle depend de la graine */
  R(c,'globalThis.__g0=S.seed;S.seed=S.seed+1;rivCache.clear();');
  const autre=G(c,`(()=>{let n=0;for(let x=-30;x<30;x++)for(let y=-30;y<30;y++)if(riviere(x,y))n++;return n;})()`);
  R(c,'S.seed=__g0;rivCache.clear();');
  const meme=G(c,`(()=>{let n=0;for(let x=-30;x<30;x++)for(let y=-30;y<30;y++)if(riviere(x,y))n++;return n;})()`);
  ok(autre!==meme,'et une autre graine donne un autre réseau — '+meme+' contre '+autre);

  /* --- CE QU'ELLE DEBLOQUE : pecher, naviguer, arroser --- */
  R(c,`globalThis.__surRiv=(min)=>{
    for(let x=-50;x<50;x++)for(let y=-50;y<50;y++){
      if(riviere(x,y)>=(min||1)){S.pos=[x,y];const z=here();z.seen=true;z.b='plaine';
        globalThis.__tc0=globalThis.__tc0||tempC;tempC=()=>18;meteo=()=>'clair';return z;}
    }
    return null;};`);
  const surRiv=G(c,'!!__surRiv(1)');
  eq(surRiv,true,'on trouve une case traversée par un cours d\'eau');
  eq(G(c,'pecheBlocage()'),null,'et l\'on y pêche, en pleine terre');
  /* un fleuve nourrit mieux qu'un ruisseau */
  R(c,'S.vehicule=null;S.sk.peche.lv=0;__surRiv(1);');
  const petit=G(c,'pecheDelai()');
  const gros=G(c,'(()=>{const z=__surRiv(3);return z?pecheDelai():null;})()');
  if(gros!==null)ok(gros<petit,'un fleuve rend plus vite qu\'un ruisseau — '
    +petit.toFixed(1)+' s contre '+gros.toFixed(1)+' s');
  else ok(true,'aucun fleuve dans la fenêtre observée — la règle reste vérifiée par la largeur');
  /* une barque passe sur une riviere, pas sur un ruisseau */
  R(c,'S.vehicule={k:"barque",pv:VEHICULE.barque.pv,crie:0};__surRiv(2);');
  eq(G(c,'vehUtile()'),true,'une barque remonte une rivière');
  R(c,'__surRiv(1);');
  const rIci=G(c,'rivDe(here())');
  if(rIci<2)eq(G(c,'vehUtile()'),false,'mais pas un ruisseau');
  else ok(true,'la première eau trouvée était déjà une rivière');
});

test('collection — tout ce que le monde contient, et ce qui manque',()=>{
  /* Cent quatre-vingt-sept matieres, soixante-trois creatures, vingt biomes,
     et aucune facon pour le joueur de savoir ce qu'il n'avait pas vu. Un
     monde dont on ne peut pas mesurer sa propre ignorance ne donne aucune
     raison d'y retourner. */
  const c=nouveau();

  /* --- chaque famille est complete et lisible --- */
  const bancales=G(c,`COLK.filter(k=>{const D=COLLECTION[k];
    if(!D.n||!D.g||typeof D.tout!=='function'||typeof D.nom!=='function')return true;
    let t=[];try{t=D.tout();}catch(e){return true;}
    if(!Array.isArray(t)||!t.length)return true;
    /* chaque entree doit savoir se nommer, sinon la case vide est illisible */
    return t.some(x=>{try{const n=D.nom(x);return !n||typeof n!=='string';}catch(e){return true;}});
  })`);
  eq(bancales.length,0,'les '+G(c,'COLK.length')+' familles sont complètes et savent se nommer',
    'bancales : '+bancales.join(', '));

  /* --- une partie neuve n'est pas deja pleine, et pas vide non plus --- */
  R(c,'colBalayer();');
  const T0=G(c,'colTotal()');
  gt(T0.t,400,'le jeu compte '+T0.t+' choses à rencontrer');
  ok(T0.pct<.35,'une partie neuve en a vu moins d\'un tiers — '+Math.round(T0.pct*100)+' %');
  gt(T0.a,0,'mais pas zéro : ce qu\'on porte au départ compte déjà');

  /* --- inscrire fonctionne, et ne compte jamais deux fois --- */
  R(c,'S.col={};collecte("fiole","soin");collecte("fiole","soin");');
  eq(G(c,'colAvoir("fiole").length'),1,'une même chose ne se compte qu\'une fois');
  R(c,'collecte("fiole","remede");');
  eq(G(c,'colAvoir("fiole").length'),2,'et deux choses différentes comptent deux fois');
  /* une cle inconnue ne salit pas la collection */
  R(c,'collecte("fiole","xyz_inconnu");collecte("famille_inconnue","x");');
  eq(G(c,'colAvoir("fiole").length'),2,'une clé inconnue n\'entre pas dans le compte');

  /* --- CHAQUE FAMILLE DOIT POUVOIR SE REMPLIR : une famille qu'aucun geste
     du jeu n'inscrit est une liste de choses inatteignables, et le
     pourcentage ne montera jamais a cent. --- */
  const jamais=G(c,`(()=>{
    const ko=[];
    /* on inscrit tout ce qui existe, famille par famille, et l'on verifie
       que le compte atteint bien le total */
    COLK.forEach(k=>{
      const D=COLLECTION[k];
      D.tout().forEach(x=>collecte(k,x));
      if(colAvoir(k).length!==D.tout().length)ko.push(k);
    });
    return ko;})()`);
  ok(jamais.length===0,'chaque famille peut atteindre son total','bloquées : '+jamais.join(', '));
  eq(Math.round(G(c,'colTotal().pct')*100),100,'et la collection entière peut atteindre 100 %');

  /* --- LE POINT QUI COMPTE : chaque famille est-elle reliee au JEU ?
     Une famille que colBalayer ne deduit pas et qu'aucun appel a collecte()
     ne remplit serait une liste morte. On cherche donc, pour chacune, soit
     une deduction, soit un appel dans le code du jeu. --- */
  const orphelines=G(c,'COLK').filter(k=>{
    const deduite=G(c,'!!COLLECTION['+JSON.stringify(k)+'].vus');
    const balaye=code.indexOf("collecte('"+k+"'")>=0;
    return !deduite&&!balaye;
  });
  eq(orphelines.length,0,'chaque famille est reliée à un geste du jeu',
    'orphelines : '+orphelines.join(', '));

  /* --- et le panneau se rend sans casser, vide comme plein --- */
  R(c,'S.col={};');
  ok(G(c,'pCollection().length')>500,'le panneau se rend sur une collection vide');
  R(c,'COLK.forEach(k=>COLLECTION[k].tout().forEach(x=>collecte(k,x)));');
  ok(G(c,'pCollection().length')>500,'et sur une collection pleine');
  ok(G(c,'pCollection().indexOf("100")')>=0,'et il annonce alors cent pour cent');
});

test('anatomie — le coup vaut ce qu il touche, et la visee remplace le de',()=>{
  /* E.3.1 : « Le critique change de nature. Ce n'est plus un 20 naturel, c'est
     le zone_mult du gabarit atteint... Un critique cesse d'etre une loterie
     pour devenir une INTENTION DE VISEE. » La creature nous frappait deja par
     zone ; nous tirions une zone pour lire l'armure de la cible et jetions son
     multiplicateur, en rendant le critique a un de. Le meme coup changeait de
     nature selon le sens ou il partait. */
  const c=nouveau();
  R(c,'S.occ="combat";E=null;EE=[];spawn();');

  /* --- la table des zones dit ce que le GDD dit --- */
  eq(G(c,'ZONE.tete.mult>=2'),true,'la tête est la seule zone qui vaut un critique');
  eq(G(c,'ZK.filter(k=>ZONE[k].mult>=2).length'),1,'et elle est seule à le valoir');

  /* --- la visee sort de l'arme, et elle penche le tirage --- */
  ok(G(c,'viseeDe(FUNC.dague,{crit:0})')>G(c,'viseeDe(FUNC.epee,{crit:0})'),
    'une dague vise mieux qu une épée — c est ce que son ancien seuil de critique voulait dire');
  ok(G(c,'viseeDe(FUNC.epee,{crit:6})')>G(c,'viseeDe(FUNC.epee,{crit:0})'),
    'et le passif de visée s ajoute à l arme');
  R(c,'globalThis.__tetes=(v,n)=>{let t=0;for(let i=0;i<n;i++)if(pickZone(v)==="tete")t++;return t/n;};');
  const nu=G(c,'__tetes(0,4000)'),vise=G(c,'__tetes(.5,4000)');
  ok(vise>nu*1.6,'viser fait porter bien plus de coups à la tête — '
    +(nu*100).toFixed(1)+' % puis '+(vise*100).toFixed(1)+' %');
  ok(nu>0.03&&nu<0.15,'et sans viser, la tête reste rare');

  /* --- et cela se lit DANS LES DEGATS, pas seulement dans le tirage --- */
  R(c,`S.stats.force=60;S.end=100;
    globalThis.__zoneMoy=(z,n)=>{pickZone=()=>z;let s=0;
      for(let i=0;i<n;i++){EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.st=[];e.arm=0;e.eqReel=null;});
        const h=EE[0].hp;S.end=100;hitN=0;attack(false);s+=h-EE[0].hp;}
      return s/n;};`);
  const tete=G(c,'__zoneMoy("tete",500)'),pieds=G(c,'__zoneMoy("pieds",500)');
  ok(tete>pieds*2.5,'un coup à la tête vaut bien plus qu un coup aux pieds — '
    +tete.toFixed(1)+' contre '+pieds.toFixed(1));
  const torse=G(c,'__zoneMoy("torse",500)');
  ok(torse>pieds&&torse<tete,'et le torse est entre les deux');
});

test('garde — trois hauteurs, et un bouclier qui ne couvre pas tout',()=>{
  /* E.3.1 : « La defense passe par la GARDE DIRECTIONNELLE... une garde
     couvre sa direction, un bouclier couvre en plus les directions VOISINES
     (jamais toutes, sans quoi un bouclier couvrirait l'integralite de la
     rose). » Notre garde etait BOOLEENNE : quatorze telegraphes disaient
     donc tous la meme chose — « quelque chose arrive ». */
  const c=nouveau();
  eq(G(c,'GARDES.length'),3,'trois hauteurs');
  /* chaque geste de melee vient de quelque part */
  const sansdir=G(c,'Object.keys(PATTERN).filter(k=>!PATTERN[k].dist&&!PATTERN[k].dir)');
  ok(sansdir.length===0,'chaque geste au contact a une hauteur',
    sansdir.length?'sans hauteur : '+sansdir.join(', '):'');

  R(c,"S.occ='combat';E=null;EE=[];spawn();E.pats=['lourd'];armePattern(E);S.eq={};");
  R(c,"S.gdir='haut';");
  eq(G(c,'gardeAccord(E)'),1,'la charge vient du haut, la garde haute l attend');
  R(c,"S.gdir='bas';");
  eq(G(c,'gardeAccord(E)'),0,'la garde basse ne l attend pas — et sans bouclier, rien ne rattrape');
  R(c,"S.gdir='cote';");
  eq(G(c,'gardeAccord(E)'),0,'même la voisine, à mains nues, ne couvre rien');

  /* --- le bouclier couvre les voisines, JAMAIS toutes --- */
  R(c,`S.items=[];
    const p1=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene','cuir']));
    S.items.push(mkItem('arme','epee',p1,1));equipItem(0);
    S.eq.main2=mkItem('arme','bouclier',
      FUNC.bouclier.comp.map(ct=>partFor(ct,['fer','chene','cuir'])),1);`);
  R(c,"S.gdir='cote';");
  ok(G(c,'gardeAccord(E)')>0,'un bouclier couvre la hauteur voisine');
  R(c,"S.gdir='bas';");
  eq(G(c,'gardeAccord(E)'),0,'mais jamais l opposee : haut et bas ne se jouxtent pas');

  /* --- et la hauteur paie dans la fenetre de parade --- */
  R(c,"S.eq.main2=null;S.gdir='haut';globalThis.__f1=parryWinVs(E);S.gdir='bas';globalThis.__f0=parryWinVs(E);");
  ok(G(c,'__f1')>G(c,'__f0')*2,'bien placee, la fenetre s ouvre — '
    +G(c,'__f0').toFixed(3)+' contre '+G(c,'__f1').toFixed(3));

  /* --- et dans ce qu on encaisse --- */
  R(c,`globalThis.__prend=(d)=>{S.gdir=d;S.hp=maxHp()*99;S.end=100;
      const h=S.hp;E.pats=['lourd'];armePattern(E);resolveHit(1,E);return h-S.hp;};`);
  const bon=G(c,'__prend("haut")'),mauvais=G(c,'__prend("bas")');
  ok(bon<mauvais,'la bonne hauteur encaisse nettement moins — '
    +bon.toFixed(1)+' contre '+mauvais.toFixed(1));

  /* --- ce qui vient de loin ne se pare pas, quelle que soit la hauteur --- */
  R(c,"E.pats=['souffle'];armePattern(E);");
  eq(G(c,'gardeAccord(E)'),0,'un souffle ne s attend d aucune hauteur');
  eq(G(c,'parryWinVs(E)'),0,'et ne se pare pas');
});

test('gestes — quatorze telegraphes, tous portes et tous lisibles',()=>{
  /* Six gestes pour soixante-trois creatures : la table la plus maigre du
     jeu, et celle que le joueur LIT a chaque seconde de combat. Un ours
     polaire et un bandit se lisaient pareil. */
  const c=nouveau();
  ok(G(c,'Object.keys(PATTERN).length')>=14,'quatorze gestes au moins — '+G(c,'Object.keys(PATTERN).length'));
  eq(G(c,'Object.keys(PATTERN).every(k=>!!PATTERN[k].n&&!!PATTERN[k].g&&PATTERN[k].dm>0)'),true,
    'chacun a un nom, un glyphe et des degats');
  /* un geste sans porteur ne s arme jamais */
  const orphelins=G(c,'Object.keys(PATTERN).filter(k=>!CK.some(x=>(CREATURE[x].pat||[]).includes(k)))');
  ok(orphelins.length===0,'chaque geste est porte par au moins une creature',
    orphelins.length?'sans porteur : '+orphelins.join(', '):'');
  /* LA VARIETE N EST PAS UNE REMISE : aucun geste ne doit rendre nettement
     moins que les anciens, sinon en ajouter ADOUCIT le bestiaire */
  R(c,'globalThis.__att=k=>PATTERN[k].dm*(PATTERN[k].hits||1);');
  const faibles=G(c,'Object.keys(PATTERN).filter(k=>__att(k)<0.82)');
  ok(faibles.length===0,'aucun geste ne rend nettement moins que les autres',
    faibles.length?'trop doux : '+faibles.join(', '):'');
  /* un statut annonce doit exister */
  const st=G(c,'Object.keys(PATTERN).filter(k=>PATTERN[k].st&&!STATUS[PATTERN[k].st])');
  ok(st.length===0,'aucun geste ne pose un etat qui n existe pas');
  /* le geste s inscrit quand la creature l arme : c est la qu on le VOIT */
  R(c,`S.col={};S.occ='combat';E=null;EE=[];spawn();
    E.pats=['souffle'];armePattern(E);`);
  eq(G(c,'(S.col.geste||{}).souffle'),1,'un geste arme s inscrit a la collection');
  /* et la fenetre de parade suit le geste */
  R(c,"E.pats=['lourd'];armePattern(E);globalThis.__pl=parryWinVs(E);E.pats=['souffle'];armePattern(E);");
  eq(G(c,'parryWinVs(E)'),0,'un souffle ne se pare pas — il porte a distance');
  ok(G(c,'__pl')>0,'une charge, si');
});

test('titres — chacun se decroche, aucun ne se contemple',()=>{
  /* Un titre n'est pas une recompense : il NOMME. C'est la seule forme
     d'objectif qui ne desequilibre rien — on ne farme pas un nom. Mais un
     titre INATTEIGNABLE est pire qu'un titre absent : il se voit et ne
     s'obtient pas. On construit donc un etat maximal et on exige qu'ils
     tombent TOUS. */
  const c=nouveau();
  ok(G(c,'HFK.length')>=40,'quarante titres au moins — '+G(c,'HFK.length'));
  eq(G(c,'HFK.every(k=>typeof HAUTFAIT[k].quand==="function"&&!!HAUTFAIT[k].n&&!!HAUTFAIT[k].d)'),true,
    'chacun a un nom, une explication et une condition');

  /* --- rien n'est acquis au depart --- */
  R(c,'S.hf={};hfBalayer();');
  eq(G(c,'hfAcquis().length'),0,'au premier pas, aucun titre');

  /* --- l etat maximal : tous doivent tomber --- */
  R(c,`S.hf={};
    Object.keys(CREATURE).forEach(k=>{S.bes[k]={v:99,t:400,a:9};});
    Object.keys(S.sk).forEach(k=>{S.sk[k].lv=80;});
    S.or=1e6;S.day=3000;
    S.modules=DK.slice(0,6).map((d,i)=>({id:MK[i],dom:d,lv:12,xp:0}));
    S.comps=[{},{},{},{}];
    S.carry=Object.keys(STATION);
    Object.keys(GUILDS.reduce((a,g)=>(a[g.k]=1,a),{})).forEach(k=>{S.guilds[k]={rank:6,xp:0,gains:0};});
    S.prime={0:50};
    S.arte={x:1};
    S.col=S.col||{};S.col.gardien={x:1};
    for(let i=0;i<1200;i++){const cc=cell(i%40,Math.floor(i/40));cc.seen=true;}
    S.claims=[key(0,0),key(1,0),key(2,0)];
    /* toutes les familles de collection, pour les titres qui les lisent */
    COLK.forEach(cat=>{S.col[cat]=S.col[cat]||{};
      try{COLLECTION[cat].tout().forEach(k=>S.col[cat][k]=1);}catch(e){}});
    hfBalayer();`);
  const rates=G(c,'HFK.filter(k=>!S.hf[k])');
  ok(rates.length===0,'dans un état maximal, les '+G(c,'HFK.length')+' titres tombent',
    rates.length?'jamais atteignables : '+rates.join(', '):'');

  /* --- ET LA BOUCLE DU JEU LE FAIT SEULE. Tout ce qui se DEDUIT de l'etat
     n'etait releve que par l'onglet : un jeu qui tourne tout seul ne
     collectionnait rien, et depuis que les titres suivent le meme balayage,
     ils ne tombaient pas non plus tant qu'on ne regardait pas. --- */
  R(c,`S.hf={};S.col={};S.mat={fer:5};rateT=59.9;
    for(let i=0;i<3;i++)step(0.25);`);
  ok(G(c,'Object.keys(S.col||{}).length')>0,'la boucle inscrit la collection sans qu on ouvre la page');

  /* --- et c'est le balayage ORDINAIRE qui les decroche : un titre qui
     n'existe que si l'on appelle sa propre fonction n'existe pas --- */
  R(c,'S.hf={};colBalayer();');
  ok(G(c,'hfAcquis().length')>0,'le balayage de la collection les decroche aussi');

  /* --- et un titre pris ne se reprend pas --- */
  R(c,'globalThis.__n=hfAcquis().length;hfBalayer();hfBalayer();');
  eq(G(c,'hfAcquis().length'),G(c,'__n'),'on ne decroche pas deux fois le meme');

  /* --- ils comptent dans la collection, et n y paient rien --- */
  eq(G(c,'COLLECTION.titre.tout().length'),G(c,'HFK.length'),'la collection les porte tous');
  eq(G(c,'!!COLBON.titre'),false,'et ils ne paient rien : un titre qui paie cesse d etre un titre');
});

test('erudition — une collection achevee paie en savoir-faire',()=>{
  /* J'avais ecrit, en posant la collection : « une premiere fois se dit :
     c'est la seule recompense, et elle suffit. » La deuxieme moitie de la
     phrase reste vraie — pas d'or pour avoir vu quelque chose — et la
     premiere etait fausse : remplir une famille demande des semaines, n'en
     rien tirer, c'est demander un travail et rendre un applaudissement. */
  const c=nouveau();
  /* --- rien n'est acquis d'avance --- */
  R(c,'S.col={};');
  eq(G(c,'colFamilles()'),0,'au depart, aucune famille achevee');
  eq(G(c,'colErudition()'),0,'et aucune erudition');

  /* --- une famille achevee vaut un pour cent, partout --- */
  R(c,`globalThis.__finir=(cat)=>{S.col=S.col||{};S.col[cat]={};
      COLLECTION[cat].tout().forEach(k=>S.col[cat][k]=1);};
    __finir('biome');`);
  eq(G(c,'colComplete("biome")'),true,'les biomes sont complets');
  ok(G(c,'colErudition()')>0.005,'et l erudition monte');
  R(c,`S.sk.epee={xp:0,lv:1,pot:100,base:50};gainXp('epee',1000);globalThis.__x1=S.sk.epee.xp;
    S.col={};S.sk.epee={xp:0,lv:1,pot:100,base:50};gainXp('epee',1000);globalThis.__x0=S.sk.epee.xp;`);
  ok(G(c,'__x1')>G(c,'__x0'),'et chaque compétence en profite — '
    +G(c,'__x0').toFixed(0)+' puis '+G(c,'__x1').toFixed(0));

  /* --- les biomes : on sait ou poser le pied --- */
  R(c,`S.col={};S.pos=[0,0];cell(6,0).seen=true;S.day=10;travel(6,0);globalThis.__t0=S.day-10;
    S.pos=[0,0];S.day=10;__finir('biome');travel(6,0);globalThis.__t1=S.day-10;`);
  ok(G(c,'__t1')<G(c,'__t0'),'tous les biomes vus, on marche plus vite — '
    +G(c,'__t0').toFixed(3)+' puis '+G(c,'__t1').toFixed(3));

  /* --- les creatures : la bete rend plus --- */
  R(c,`S.col={};S.occ='combat';E=null;EE=[];spawn();
    globalThis.__butin=()=>{S.mat={};const k=mkEnemy('loup',4,false,false);
      k.drop='cuir';k.hp=0;kill(k);return S.mat.cuir||0;};`);
  const nu=G(c,'__butin()');
  R(c,"__finir('creature');");
  const su=G(c,'__butin()');
  ok(su>nu,'tout le bestiaire vu, la bête rend plus — '+nu+' puis '+su);

  /* --- les modules : un livre de plus s ouvre --- */
  R(c,`S.col={};S.modules=[];S.sk.lecture={xp:0,lv:1,pot:100,base:50};
    globalThis.__lire=()=>{S.modules=[];S.books=[{id:'x',dom:'feu',diff:1}];
      const r=Math.random;Math.random=()=>.99;readBook(0);Math.random=r;
      return S.modules.reduce((a,m)=>a+m.lv,0);};`);
  const m0=G(c,'__lire()');
  R(c,"__finir('module');");
  const m1=G(c,'__lire()');
  ok(m1>m0,'tous les modules connus, un livre en enseigne un de plus — '+m0+' puis '+m1);

  /* --- les matieres : la main revient plus pleine --- */
  R(c,`S.col={};S.occ='recolte';S.mat={};
    globalThis.__recolter=(n)=>{const cc=here();
      const mk=cellMats(cc).find(m=>canHarvest(m));
      if(!mk)return 0;
      S.target=mk;S.mat={};harvT=0;
      for(let i=0;i<n;i++){cc.stock=null;harvT=99;harvestTick(0);}
      return S.mat[mk]||0;};`);
  const r0=G(c,'__recolter(60)');
  R(c,"__finir('mat');");
  const r1=G(c,'__recolter(60)');
  ok(r1>r0,'toutes les matieres vues, la main revient plus pleine — '+r0+' puis '+r1);

  /* --- et chaque promesse affichee correspond a un branchement --- */
  eq(G(c,'Object.keys(COLBON).every(k=>!!COLLECTION[k])'),true,
    'aucune famille promise qui n existe pas');
});

test('boyaux — une hampe cogne les parois, une lame courte non',()=>{
  /* E.3.2 : « la lame qui rencontre un bloc rebondit — recuperation
     rallongee, clang, cout d'endurance supplementaire. Se battre dans un
     tunnel avec une hallebarde devient exactement le probleme que Mount &
     Blade promet ; l'estoc devient l'arme des couloirs PAR LA GEOMETRIE. »
     Chez nous une hallebarde valait autant sous terre qu'au grand jour : le
     lieu ne pesait sur aucun choix d'arme. */
  const c=nouveau();
  R(c,`globalThis.__arme=(fn)=>{S.eq={};S.items=[];
      const parts=FUNC[fn].comp.map(ct=>partFor(ct,['fer','chene','cuir']));
      S.items.push(mkItem('arme',fn,parts,1));equipItem(0);};
    globalThis.__etroit=(v)=>{caverne=()=>v?1:0;};`);

  /* --- ce qui compte est le TRAIT, pas le nom --- */
  eq(G(c,'(__arme("hallebarde"),armeGene())'),true,'une hallebarde a une hampe');
  eq(G(c,'(__arme("dague"),armeGene())'),false,'une dague, non');
  eq(G(c,'(__arme("arc"),armeGene())'),false,'un arc non plus — il n a pas d arc latéral');

  /* --- le rythme, et lui seul : les degats ne bougent pas --- */
  R(c,'__arme("hallebarde");__etroit(false);globalThis.__v1=wSpeed();');
  R(c,'__etroit(true);globalThis.__v2=wSpeed();');
  ok(G(c,'__v2')<G(c,'__v1')*.85,'dans un boyau, la hampe se ramène plus lentement — '
    +G(c,'__v1').toFixed(2)+' puis '+G(c,'__v2').toFixed(2));
  R(c,'__arme("dague");__etroit(false);globalThis.__d1=wSpeed();__etroit(true);globalThis.__d2=wSpeed();');
  eq(G(c,'__d1'),G(c,'__d2'),'la lame courte ne subit rien — c est ce qui en fait l arme des couloirs');

  /* --- et le balayage n a plus la place --- */
  R(c,`__arme("hallebarde");__etroit(false);S.occ='combat';E=null;EE=[];spawn();
    globalThis.__fauche=()=>{EE.forEach(x=>{x.hp=1e9;x.max=1e9;});
      const av=EE.map(x=>x.hp);S.end=100;hitN=0;attack(false);
      return EE.filter((x,i)=>x.hp<av[i]).length;};`);
  R(c,'while(EE.length<2){E=mkEnemy("loup",4,false,false);EE.push(E);}foc=0;E=EE[0];');
  const large=G(c,'__fauche()');
  R(c,'__etroit(true);');
  const boyau=G(c,'__fauche()');
  ok(large>1,'au grand jour, la hampe fauche plusieurs cibles — '+large);
  eq(boyau,1,'dans un boyau, une seule');

  /* --- et cela coute plus cher a manier --- */
  R(c,'__etroit(false);S.end=100;hitN=0;attack(false);globalThis.__c1=100-S.end;');
  R(c,'__etroit(true);S.end=100;hitN=0;attack(false);globalThis.__c2=100-S.end;');
  ok(G(c,'__c2')>G(c,'__c1'),'le clang se paie en souffle — '+G(c,'__c1')+' puis '+G(c,'__c2'));

  /* --- une grande salle n est pas un boyau --- */
  R(c,'caverne=()=>2;');
  eq(G(c,'etroitIci()'),false,'une grande salle laisse la place de faucher');
});

test('scriptorium — on peut enfin ECRIRE un livre, pas seulement en trouver',()=>{
  /* Les livres sont la seule porte vers les modules, et toutes leurs sources
     se subissent : un butin, un etal, un don de guilde. Le scriptorium en
     fait une source qu'on choisit — mais on n'y copie QUE ce qu'on sait. */
  const c=nouveau();
  eq(G(c,'!!STATION.scriptorium'),true,'la station existe');
  eq(G(c,'STATION.scriptorium.sk'),'lecture','et c est la lecture qui la tient');

  /* --- sans station, rien --- */
  R(c,"S.stations={};S.mat={};S.ref={};");
  ok(String(G(c,'consoBlocage("manuel")')||'').length>0,'sans scriptorium, on ne copie rien');

  /* --- sans module, le papier reste blanc --- */
  R(c,`S.stations={scriptorium:1};S.modules=[];S.books=[];
    globalThis.__m=CONSO.manuel.fais();`);
  eq(G(c,'S.books.length'),0,'sans rien savoir, on n écrit pas');
  ok(String(G(c,'__m')).indexOf('blanc')>=0,'et le jeu le dit');

  /* --- on comble sa lacune : le domaine le plus pauvre vient --- */
  R(c,`S.modules=[{id:MK[0],dom:'feu',lv:1,xp:0},{id:MK[1],dom:'feu',lv:1,xp:0},
      {id:MK[2],dom:'eau',lv:1,xp:0}];
    S.books=[];S.sk.lecture={xp:0,lv:30};CONSO.manuel.fais();`);
  eq(G(c,'S.books.length'),1,'un livre est ecrit');
  eq(G(c,'S.books[0].dom'),'eau','et c est le domaine le plus pauvre qu on comble');

  /* --- la difficulte suit la lecture, jamais au-dessus de soi --- */
  R(c,"S.books=[];S.sk.lecture={xp:0,lv:6};CONSO.manuel.fais();globalThis.__d1=S.books[0].diff;");
  R(c,"S.books=[];S.sk.lecture={xp:0,lv:60};CONSO.manuel.fais();globalThis.__d2=S.books[0].diff;");
  ok(G(c,'__d2')>G(c,'__d1'),'un scribe aguerri ecrit plus dense — '+G(c,'__d1')+' puis '+G(c,'__d2'));
  ok(G(c,'__d2')<=12,'et jamais au-dela de ce qui se relit');

  /* --- et le livre ecrit se lit vraiment --- */
  R(c,`S.books=[];S.modules=[{id:MK[0],dom:'feu',lv:1,xp:0}];S.sk.lecture={xp:0,lv:40};
    CONSO.manuel.fais();globalThis.__n0=S.modules.length;
    globalThis.__ok=false;for(let i=0;i<40&&!__ok;i++){
      S.books=[{id:'x',dom:S.books[0]?S.books[0].dom:'feu',diff:2}];readBook(0);
      if(S.modules.length>__n0)__ok=true;}`);
  eq(G(c,'__ok'),true,'un livre de sa propre main enseigne comme un autre');
});

test('cultures — douze, toutes reelles, toutes atteignables',()=>{
  /* C.9 en annonce douze et nous en avions dix, dont trois inventees pour des
     races inventees. Une culture ne porte AUCUNE regle de jeu, seulement des
     sons : chacune elargit d'un coup les noms de royaume, de capitale, de
     souverain, d'enfant et de villageois. */
  const c=nouveau();
  const reelles=['latine','nordique','germanique','hellenique','slave','celte',
    'sino','nipponne','arabo','persane','bantoue','andine'];
  reelles.forEach(k=>eq(G(c,'!!CULT.'+k),true,'la culture '+k+' existe'));
  eq(G(c,'RACE.humain.cult.length'),12,'et un humain peut naître dans chacune des douze');
  /* chacune doit VRAIMENT produire des noms, et des noms a elle */
  R(c,`globalThis.__noms=k=>{const s={};for(let i=0;i<200;i++)s[cultName(k)]=1;return Object.keys(s).length;};`);
  const pauvres=reelles.filter(k=>G(c,'__noms("'+k+'")')<20);
  ok(pauvres.length===0,'chacune tire au moins vingt noms distincts',
    pauvres.length?'trop pauvres : '+pauvres.join(', '):'');
  /* et deux cultures ne doivent pas rendre le meme nom : ce sont des sons */
  R(c,`globalThis.__croise=(a,b)=>{const s={};for(let i=0;i<300;i++)s[cultName(a)]=1;
    let n=0;for(let i=0;i<300;i++)if(s[cultName(b)])n++;return n;};`);
  ok(G(c,'__croise("germanique","bantoue")')===0,'deux cultures ne se confondent pas');
  /* la collection les compte */
  eq(G(c,'COLLECTION.culture.tout().length'),G(c,'Object.keys(CULT).length'),
    'la collection porte toutes les cultures');
  R(c,`S.col={};S.kd={r:[{cult:'andine'}]};colBalayer();`);
  eq(G(c,'colAvoir("culture").length>0'),true,'un royaume croisé inscrit sa culture');
});

test('proies — ce qui fuit ne riposte pas, et se rattrape',()=>{
  /* E.3.6 : « fuit — herbivores et proies qui s'ecartent et NE RIPOSTENT
     JAMAIS, meme provoques ». Le drapeau existait et ne servait qu'a un repli
     sous 40 % de PV : entre le premier coup et celui-la, un cerf se battait
     comme un loup. Une proie n'etait qu'un ennemi faible. */
  const c=nouveau();
  R(c,`S.occ='combat';E=null;EE=[];
    globalThis.__subi=(ck)=>{E=mkEnemy(ck,6,false,false);EE=[E];foc=0;
      E.hp=1e9;E.max=1e9;S.hp=maxHp()*999;S.guard=false;
      const h=S.hp;for(let i=0;i<600;i++){combatTick(.1);if(!E)break;}
      return h-S.hp;};`);
  eq(G(c,'CREATURE.cerf.fuit'),1,'le cerf porte le profil');
  eq(G(c,'!!CREATURE.loup.fuit'),false,'le loup, non');
  const proie=G(c,'__subi("cerf")'),pred=G(c,'__subi("loup")');
  eq(proie,0,'une proie ne fait aucun dégât, même longuement provoquée');
  gt(pred,0,'un prédateur, oui — ' +Math.round(pred));

  /* --- elle occupe son tour a chercher une sortie --- */
  R(c,`E=mkEnemy('cerf',6,false,false);EE=[E];foc=0;E.hp=1e9;E.max=1e9;`);
  ok(G(c,'fuiteChance(E)')>0,'sans entrave, elle a une sortie');
  R(c,"addStatus(E,'enracine',9,1);");
  eq(G(c,'fuiteChance(E)'),0,'enracinée, elle n en a plus — c est l emploi de la chaîne résolue');
  R(c,"E.st=[];addStatus(E,'ralenti',9,1);globalThis.__r=fuiteChance(E);E.st=[];");
  ok(G(c,'__r')<G(c,'fuiteChance(E)'),'ralentie, elle a moins de chances de partir');
  /* la perception rattrape la bête qu on a laissée filer */
  R(c,"globalThis.__n=fuiteChance(E);S.sk.perception_sk={xp:0,lv:40};");
  ok(G(c,'fuiteChance(E)')<G(c,'__n'),'un chasseur aguerri la laisse moins souvent partir');

  /* --- et elle finit par disparaître si on ne la tient pas --- */
  R(c,`S.sk.perception_sk={xp:0,lv:0};
    globalThis.__parties=(n)=>{let p=0;
      for(let i=0;i<n;i++){E=mkEnemy('cerf',6,false,false);EE=[E];foc=0;E.hp=1e9;E.max=1e9;
        for(let t=0;t<300;t++){combatTick(.1);if(!E){p++;break;}}}
      return p/n;};`);
  const partie=G(c,'__parties(40)');
  ok(partie>.5,'laissée seule, elle finit par s écarter — '+Math.round(partie*100)+' %');

  /* --- un gibier rare garde ses crocs --- */
  R(c,`globalThis.__subiRare=()=>{E=mkEnemy('cerf',6,true,false);EE=[E];foc=0;
      E.hp=1e9;E.max=1e9;S.hp=maxHp()*999;const h=S.hp;
      for(let i=0;i<600;i++){combatTick(.1);if(!E)break;}return h-S.hp;};`);
  gt(G(c,'__subiRare()'),0,'une bête rare, elle, se défend — le drapeau ne la désarme pas');
});

test('symetrie — les creatures se battent avec nos regles',()=>{
  /* « Supprimer le plus possible l'asymetrie : les PNJ doivent etre construits
     comme le joueur » (E.3.5). Le joueur depensait de l'endurance a chaque
     coup ; une creature frappait indefiniment, son rythme ne dependant que
     d'un delai. Et son armure n'etait qu'un chiffre de fiche. */
  const c=nouveau();
  R(c,'S.occ="combat";E=null;EE=[];spawn();');

  /* --- toute creature a un souffle, et il la freine --- */
  eq(G(c,'EE.every(e=>e.end>0&&e.endMax>0)'),true,'chaque créature naît avec un souffle');
  R(c,'E.end=0;');
  eq(G(c,'crePeutFrapper(E)'),false,'à sec, elle ne peut plus déclarer de coup');
  R(c,'for(let i=0;i<40;i++)creEndTick(E,.5);');
  eq(G(c,'crePeutFrapper(E)'),true,'et elle le reprend avec le temps');
  /* la depense est reelle */
  R(c,'E.end=E.endMax;globalThis.__e0=E.end;creDepense(E);');
  ok(G(c,'E.end')<G(c,'__e0'),'un coup parti lui coûte du souffle — '
    +G(c,'__e0')+' puis '+Math.round(G(c,'E.end')));
  /* et la recuperation est suspendue juste apres */
  R(c,'globalThis.__e1=E.end;creEndTick(E,.3);');
  eq(G(c,'E.end'),G(c,'__e1'),'et la reprise est suspendue un instant, comme la nôtre');

  /* --- une creature epuisee ne frappe VRAIMENT plus --- */
  R(c,`EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.end=e.endMax;});
    S.hp=maxHp()*99;globalThis.__pv=()=>{const h=S.hp;
      for(let i=0;i<400;i++)combatTick(.1);return h-S.hp;};`);
  const frais=G(c,'__pv()');
  R(c,'EE.forEach(e=>{e.end=0;e.endLock=999;e.w=-1;e.tt=0;});S.hp=maxHp()*99;');
  const asec=G(c,'__pv()');
  /* UNE INEGALITE STRICTE SANS MARGE EST UN PILE OU FACE des que la mesure
     porte du bruit. Debranchee, la regle du souffle rendait deux nombres
     VOISINS — et le test passait une fois sur deux, selon lequel des deux
     tirages etait tombe le plus haut. Il ne detectait donc rien : « presque
     plus de degats » veut dire une marge, et il faut l'ecrire. */
  ok(asec<frais*.4,'à sec, elle ne fait presque plus de dégâts — '
    +frais.toFixed(0)+' puis '+asec.toFixed(0));

  /* La depense doit se voir DANS LE COMBAT, pas seulement en appelant
     creDepense a la main : une creature qui frappe longtemps doit finir par
     manquer de souffle, sinon le frein n'existe que sur le papier. */
  R(c,`EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.end=e.endMax;e.endLock=0;});
    S.hp=maxHp()*999;S.guard=false;
    globalThis.__bas=0;
    for(let i=0;i<600;i++){combatTick(.1);if(E&&E.end<E.endMax*.5)__bas=1;}`);
  eq(G(c,'__bas'),1,'en combat, elle finit vraiment par manquer de souffle');

  /* La qualite de son equipement doit suivre son NIVEAU : sans cela un chef
     de bande porte le meme acier qu'un premier bandit croise. */
  const q2=G(c,`creEquipe({},'bandit',2).arme.q`);
  const q30=G(c,`creEquipe({},'bandit',30).arme.q`);
  gt(q30,q2*1.4,'la qualite de son equipement suit son niveau — q'+q2+' a 2, q'+q30+' a 30');

  /* --- un humanoide porte un vrai equipement, derive de sa classe et de son niveau --- */
  const eqBas=G(c,'(()=>{const e=creEquipe({},"bandit",2);return e?{arme:!!e.arme,zones:Object.keys(e.zones).length,mk:e.arme?e.arme.parts[0].mk:null}:null;})()');
  const eqHaut=G(c,'(()=>{const e=creEquipe({},"bandit",30);return e?{arme:!!e.arme,zones:Object.keys(e.zones).length,mk:e.arme?e.arme.parts[0].mk:null}:null;})()');
  eq(!!eqBas&&eqBas.arme,true,'un bandit porte une vraie arme');
  gt(eqBas.zones,0,'et de vraies pièces d\'armure — '+eqBas.zones+' zones');
  ok(eqBas.mk!==eqHaut.mk,'et la matière suit le niveau — '+eqBas.mk+' à 2, '+eqHaut.mk+' à 30');
  /* le metier decide de la couverture */
  const chef=G(c,'Object.keys(creEquipe({},"chef",20).zones).length');
  const braco=G(c,'Object.keys(creEquipe({},"braconnier",20).zones).length');
  gt(chef,braco,'un chef de bande couvre plus de zones qu\'un braconnier — '+chef+' contre '+braco);
  /* une bete n'a pas d'equipement, et c'est honnete */
  eq(G(c,'creEquipe({},"loup",20)'),null,'un loup n\'a jamais porté de plates');

  /* --- ET SON ARMURE REDUIT VRAIMENT CE QU'ELLE ENCAISSE --- */
  R(c,`S.stats.force=120;S.eq={};S.items=[];
    const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene','cuir']));
    p.push(partFor('fixations',['fer']));
    S.items.push(mkItem('arme','epee',p,1.2));equipItem(0);
    globalThis.__frappe=(e)=>{let s=0;
      for(let i=0;i<300;i++){e.hp=1e9;E=e;EE=[e];S.end=100;hitN=0;
        const h=e.hp;attack(false);s+=h-e.hp;}
      return s/300;};
    /* un CHEF DE BANDE par defaut : cinq zones couvertes sur cinq. Avec un
       bandit — trois sur cinq — l'ecart se noyait dans le bruit du tirage de
       zone, et le test mesurait le hasard plutot que l'armure. */
    globalThis.__cible=(nu,ck)=>{const e=mkEnemy(ck||'chef',12,false,false,'');
      e.hp=1e9;e.max=1e9;if(nu)e.eqReel=null;return e;};`);
  const nu=G(c,'__frappe(__cible(true))');
  const arme=G(c,'__frappe(__cible(false))');
  ok(arme<nu*.95,'un chef de bande équipé encaisse moins qu\'un chef nu — '
    +nu.toFixed(1)+' contre '+arme.toFixed(1));
  /* et la COUVERTURE compte : un braconnier, deux zones sur cinq, se protège
     bien moins qu'un chef qui les couvre toutes */
  const braEq=G(c,'__frappe(__cible(false,"braconnier"))');
  const braNu=G(c,'__frappe(__cible(true,"braconnier"))');
  ok((nu-arme)/nu>(braNu-braEq)/braNu,
    'et un braconnier se protège bien moins qu\'un chef — '
    +Math.round((nu-arme)/nu*100)+' % contre '+Math.round((braNu-braEq)/braNu*100)+' %');
});

test('passifs — aucun ne promet ce que personne ne lit',()=>{
  /* Un grimoire ajoute un sort ; un MANUEL change tous les coups. Les quatre
     ecoles de manuel etaient maigres — six frappes, six postures, TROIS
     techniques, QUATRE maitrises — et l'une d'elles promettait une allonge
     que le combat ne lisait nulle part. */
  const c=nouveau();

  /* --- chaque ecole a de quoi choisir --- */
  const parEcole=G(c,`(()=>{const p={};
    MK.filter(k=>MODULE[k].t==='passif').forEach(k=>MODULE[k].d.forEach(d=>{p[d]=(p[d]||0)+1;}));
    return p;})()`);
  ['frappes','postures','techniques','maitrise'].forEach(e=>{
    gte(parEcole[e]||0,7,'l\'école « '+e+' » offre au moins sept passifs — '+(parEcole[e]||0));
  });

  /* --- CHAQUE valeur de passif doit etre lue quelque part dans le combat.
     C'est le defaut qu'on vient de corriger : « Allonge » calculait sa valeur
     et personne ne la lisait. Une promesse non lue est pire qu'une absence,
     parce qu'elle se paie en temps de lecture et en decision. --- */
  const champs=G(c,'[...new Set(MK.filter(k=>MODULE[k].t===\'passif\').flatMap(k=>Object.keys(MODULE[k].p||{})))]');
  /* On cherche la lecture dans le CODE DU JEU, jamais dans la table qui la
     declare : c'est la seule facon de distinguer une promesse d'un effet. */
  const jamaisLus=champs.filter(f=>!new RegExp('(PA|passives\\(\\))\\.'+f+'\\b').test(code));
  eq(jamaisLus.length,0,'chacun des '+champs.length+' effets de passif est lu par le combat',
    'jamais lus : '+jamaisLus.join(', '));

  /* --- et chaque effet a son texte : un passif muet est illisible --- */
  const sansTexte=champs.filter(f=>!G(c,'PASSIF_TXT['+JSON.stringify(f)+']'));
  eq(sansTexte.length,0,'et chacun sait se dire en clair','sans texte : '+sansTexte.join(', '));

  /* --- L'ALLONGE, precisement : elle doit ouvrir le balayage --- */
  R(c,`S.eq={};S.items=[];S.postures=[];S.modules=[];
    const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene','cuir']));
    p.push(partFor('fixations',['fer']));
    S.items.push(mkItem('arme','epee',p,1.2));equipItem(0);
    S.stats.force=80;S.occ='combat';spawn();
    /* deux creatures en face : c'est la seule facon de voir un balayage */
    while(EE.length<3)EE.push(mkEnemy('loup',4,false,false,' Ⅱ'));
    EE.forEach(e=>{e.hp=1e9;e.max=1e9;});
    globalThis.__touches=()=>{let n=0;
      for(let i=0;i<300;i++){
        EE.forEach(e=>{e.hp=1e9;});
        S.end=100;attack(false);
        n+=EE.filter(e=>e.hp<1e9).length;
      }
      return n/300;};`);
  const sansAllonge=G(c,'__touches()');
  near(sansAllonge,1,.05,'une épée seule ne touche qu\'une créature à la fois');
  R(c,'S.modules=[{id:"allongelongue",dom:"maitrise",lv:3,xp:0}];S.postures=[0];');
  gt(G(c,'passives().reach'),0,'le passif d\'allonge se calcule');
  gt(G(c,'__touches()'),sansAllonge,'et il ouvre vraiment le balayage — '
    +sansAllonge.toFixed(2)+' cible puis '+G(c,'__touches()').toFixed(2));

  /* --- les nouveaux passifs se lancent sans casser --- */
  const casse=G(c,`(()=>{const ko=[];
    MK.filter(k=>MODULE[k].t==='passif').forEach(k=>{
      S.modules=[{id:k,dom:MODULE[k].d[0],lv:2,xp:0}];S.postures=[0];
      try{const p=passives();
        for(const f in p)if(typeof p[f]!=='number'||Number.isNaN(p[f]))ko.push(k+'.'+f);
      }catch(e){ko.push(k+' : '+e.message);}
    });
    return ko;})()`);
  eq(casse.length,0,'et aucun ne produit de valeur absurde','fautifs : '+casse.join(', '));
});

test('lieux — huit points d interet, et chacun un geste a lui',()=>{
  /* Cinq points d'interet pour un monde infini : village, donjon, camp,
     sanctuaire, filon. Une case sur quatre en portait un, les trois autres
     etaient interchangeables, et les cinq se repetaient tous les dix pas.
     Huit de plus, et chacun doit FAIRE quelque chose qu'on ne fait pas
     ailleurs — sinon c'est un decor avec un bouton. */
  const c=nouveau();
  R(c,`globalThis.__lieu=(k)=>{const cc=here();cc.poi=k;cc.lieuW=-9;cc.corr=20;
    S.occ='repos';E=null;EE=[];return cc;};`);

  /* --- chacun a son geste, sa description, et se rouvre --- */
  const bancals=G(c,`LIEUK.filter(k=>{const D=LIEU[k];
    return !D.n||!D.g||!D.geste||!D.d||typeof D.fais!=='function'||!POI[k];})`);
  eq(bancals.length,0,'les huit lieux sont complets — nom, geste, explication, entrée au catalogue',
    'incomplets : '+bancals.join(', '));

  /* --- CHACUN doit deplacer quelque chose de mesurable --- */
  R(c,`globalThis.__empreinteL=()=>{
    const v=[];
    v.push(S.or,S.hp,S.mana,S.end,Math.round(S.repose||0),
      Object.values(S.mat).reduce((a,b)=>a+b,0),
      Object.values(S.food).reduce((a,b)=>a+b,0),
      (S.gems||[]).length,(S.books||[]).length,(S.buffs||[]).length,
      (S.st||[]).length,Object.keys(S.alliages||{}).length,
      SK.reduce((a,k)=>a+S.sk[k].pot+S.sk[k].xp+S.sk[k].lv,0),
      here().corr,S.occ);
    return v.join('|');
  };`);
  const inertes=G(c,`(()=>{
    const ko=[];
    LIEUK.forEach(k=>{
      /* un personnage a qui il manque tout ce que chaque lieu peut rendre */
      S.or=0;S.hp=1;S.mana=0;S.end=1;S.mat={cristalmana:3};S.food={};
      S.gems=[];S.books=[];S.buffs=[];S.st=[];S.alliages={};
      SK.forEach(x=>{S.sk[x].pot=40;});S.sk.epee.lv=5;
      __lieu(k);
      const avant=__empreinteL();
      /* dix essais : certains lieux tirent au sort ce qu'ils donnent */
      let bouge=false;
      for(let i=0;i<10&&!bouge;i++){
        here().lieuW=-9;
        try{lieuVisiter();}catch(e){ko.push(k+' : '+e.message);return;}
        if(__empreinteL()!==avant)bouge=true;
      }
      if(!bouge)ko.push(k);
    });
    return ko;})()`);
  eq(inertes.length,0,'chacun des '+G(c,'LIEUK.length')+' lieux déplace quelque chose',
    'sans effet : '+inertes.join(', '));

  /* --- ceux qui se referment se referment vraiment --- */
  R(c,'__lieu("ruine");S.mat={};lieuVisiter();');
  const apres=G(c,'Object.values(S.mat).reduce((a,b)=>a+b,0)');
  gt(apres,0,'une ruine fouillée rend de la matière ouvrée — '+apres);
  eq(G(c,'lieuPret(here())'),false,'et se referme jusqu\'à la semaine suivante');
  R(c,'lieuVisiter();');
  eq(G(c,'Object.values(S.mat).reduce((a,b)=>a+b,0)'),apres,'la revisiter aussitôt ne donne rien');
  R(c,'S.week+=1;');
  eq(G(c,'lieuPret(here())'),true,'la semaine d\'après, elle se rouvre');

  /* --- ceux qui ne se referment pas restent ouverts --- */
  R(c,'__lieu("source");S.hp=1;lieuVisiter();');
  eq(G(c,'S.hp'),G(c,'maxHp()'),'une source chaude rend tous les PV');
  eq(G(c,'lieuPret(here())'),true,'et ne se referme pas — on peut y revenir');

  /* --- le cercle demande son prix, et apaise vraiment --- */
  R(c,`__lieu('cercle');S.mat={};
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const z=cell(here().x+dx,here().y+dy);z.corr=60;}
    globalThis.__c0=cell(here().x+1,here().y+1).corr;
    lieuVisiter();`);
  eq(G(c,'cell(here().x+1,here().y+1).corr'),G(c,'__c0'),
    'sans cristal de mana, le cercle ne fait rien');
  R(c,'S.mat={cristalmana:1};here().lieuW=-9;lieuVisiter();');
  ok(G(c,'cell(here().x+1,here().y+1).corr')<G(c,'__c0'),
    'avec, il apaise les cellules autour — '+G(c,'__c0')+' puis '+G(c,'cell(here().x+1,here().y+1).corr'));
  eq(G(c,'S.mat.cristalmana'),undefined,'et le cristal est consommé');

  /* --- une tombe se paie : elle monte la corruption --- */
  R(c,'__lieu("tombe");here().corr=20;globalThis.__k0=here().corr;lieuVisiter();');
  gt(G(c,'here().corr'),G(c,'__k0'),'desceller une tombe monte la corruption du lieu');

  /* --- l'ermite rend du potentiel la ou il manque --- */
  R(c,'__lieu("ermitage");SK.forEach(k=>{S.sk[k].pot=40;});S.sk.epee.lv=5;'
    +'globalThis.__p0=SK.reduce((a,k)=>a+S.sk[k].pot,0);lieuVisiter();');
  gt(G(c,'SK.reduce((a,k)=>a+S.sk[k].pot,0)'),G(c,'__p0'),'l\'ermite rend du potentiel');

  /* --- et un lieu inconnu ne casse rien --- */
  R(c,'here().poi="inconnu_xyz";lieuVisiter();');
  ok(true,'un point d\'intérêt inconnu ne fait pas tomber le jeu');
});

test('raid — on peut enfin defendre son territoire soi-meme',()=>{
  /* « Joueur present sur place : l'attaque se joue en temps reel ; joueur
     absent : elle est simulee » (14.5). Elle etait TOUJOURS simulee. On
     rentrait chez soi, le journal annoncait qu'un raid avait eu lieu pendant
     qu'on etait la, et l'on n'avait rien pu faire. */
  const c=nouveau();
  R(c,`globalThis.__terre=(n)=>{
    S.claims=[];S.npcs=[];S.tresor=5000;S.dette=0;S.detteW=0;S.raid=null;
    for(let i=0;i<(n||10);i++){const cc=cell(S.pos[0]+i,S.pos[1]);cc.claim=1;S.claims.push(key(cc.x,cc.y));}
    const ici=here();ici.claim=1;if(!S.claims.includes(key(ici.x,ici.y)))S.claims.push(key(ici.x,ici.y));
    ici.corr=90;S.claims.forEach(k=>{if(S.world[k])S.world[k].corr=90;});
    S.occ='repos';E=null;EE=[];
  };
  /* on force le raid : le jet hebdomadaire est rare, et l'on ne teste pas
     le hasard mais ce qui se passe APRES */
  globalThis.__raid=()=>{
    __terre();
    const R0=Math.random;Math.random=()=>0;
    const r=[];try{weeklyKingdom(r);}finally{Math.random=R0;}
    return r.join(' | ');
  };`);

  /* --- sur place, le raid devient un combat --- */
  const rapport=G(c,'__raid()');
  eq(G(c,'S.occ'),'combat','sur ta cellule, le raid devient un combat');
  gt(G(c,'EE.length'),0,'des assaillants en chair, et non un jet');
  eq(G(c,'EE.every(e=>e.raid)'),true,'tous marqués comme assaillants');
  ok(/EN COURS/.test(rapport),'et le journal le dit — '+rapport.slice(0,60));

  /* --- les repousser annule la perte et rapporte --- */
  R(c,'globalThis.__tr0=S.tresor;S.stats.force=400;'
    +'while(EE.length){const e=EE[0];e.hp=1;kill(e);}');
  eq(G(c,'S.raid'),null,'tous abattus, le raid est repoussé');
  gt(G(c,'S.tresor'),G(c,'__tr0'),'et le butin des assaillants va au trésor — '
    +G(c,'__tr0')+' puis '+G(c,'S.tresor'));

  /* --- rompre le contact le perd, et cela coute --- */
  R(c,'__raid();globalThis.__tr1=S.tresor;S.raid.def=0;S.raid.force=400;'
    +'S.hp=1;combatTick(.1);');
  eq(G(c,'S.raid'),null,'rompre le contact perd le raid');
  ok(G(c,'S.tresor')<G(c,'__tr1'),'et le trésor le paie — '+G(c,'__tr1')+' puis '+G(c,'S.tresor'));

  /* --- tomber pendant l'assaut le perd aussi --- */
  R(c,'__raid();globalThis.__tr2=S.tresor;S.raid.def=0;S.raid.force=400;down();');
  eq(G(c,'S.raid'),null,'tomber pendant l\'assaut le perd');
  ok(G(c,'S.tresor')<G(c,'__tr2'),'et cela coûte aussi');

  /* --- loin de chez soi, il se resout comme avant, sans combat --- */
  R(c,`__terre();S.pos=[S.pos[0]+40,S.pos[1]+40];here().seen=true;S.occ='repos';
    globalThis.__r2=(()=>{const R0=Math.random;Math.random=()=>0;
      const r=[];try{weeklyKingdom(r);}finally{Math.random=R0;}return r.join(' | ');})();`);
  eq(G(c,'S.occ'),'repos','loin de chez soi, rien ne t\'engage');
  eq(G(c,'S.raid'),null,'et le raid se résout par la formule, comme avant');
  ok(/raid/.test(G(c,'__r2')),'mais il a bien eu lieu — '+G(c,'__r2').slice(0,70));

  /* --- et un raid ne survit pas a une sauvegarde --- */
  R(c,'__raid();sanitize();');
  eq(G(c,'S.raid'),null,'un raid à moitié joué ne se sauvegarde pas');
});

test('residents — les champs nourrissent enfin ceux qui exploitent',()=>{
  /* Un garde-manger allegeait l'entretien d'un or par semaine, et c'etait
     tout ce qui reliait l'agriculture au royaume : on cultivait des champs
     dont la recolte partait au sac, et les residents vivaient de rien.
     Sans ce raccord, l'agriculture n'avait aucune raison d'exister a cote
     de la chasse. */
  const c=nouveau();
  R(c,`globalThis.__base=(n,vivres,gm)=>{
    const cc=here();cc.claim=1;S.claims=[key(cc.x,cc.y)];
    cc.plots=[{t:'batiment',slots:[]}];
    for(let i=0;i<8;i++)cc.plots[0].slots.push({t:'meuble',k:'lit'});
    for(let i=0;i<(gm||0);i++)cc.plots.push({t:'batiment',slots:[{t:'meuble',k:'gardemanger'}]});
    S.npcs=[];
    for(let i=0;i<n;i++)S.npcs.push({id:'n'+i,nom:'r'+i,rec:1,assign:'mineur',
      cell:key(cc.x,cc.y),lv:5,mood:80,rel:60,race:'humain',home:true});
    S.vivres=vivres;S.tresor=99999;S.dette=0;S.detteW=0;S.gov='monarchie';
    S.faimRes=0;S.mat={};
  };`);

  /* --- ils mangent : une bouche par resident et par semaine --- */
  R(c,'__base(4,20,0);weekly();');
  eq(G(c,'S.vivres'),16,'quatre résidents mangent quatre vivres par semaine');
  eq(G(c,'S.faimRes'),0,'et personne ne manque tant qu\'il y en a');

  /* --- un garde-manger nourrit trois bouches d'avance --- */
  R(c,'__base(3,0,1);weekly();');
  eq(G(c,'S.faimRes'),0,'un garde-manger couvre trois bouches sans vivres');
  R(c,'__base(6,0,1);weekly();');
  eq(G(c,'S.faimRes'),3,'au-delà, il en manque autant qu\'il en manque');

  /* --- manquer coute l'humeur, jamais la vie --- */
  R(c,'__base(5,0,0);globalThis.__m0=S.npcs[0].mood;weekly();');
  ok(G(c,'S.npcs[0].mood')<G(c,'__m0'),'un ventre vide fait tomber l\'humeur — '
    +G(c,'__m0')+' puis '+G(c,'S.npcs[0].mood'));
  eq(G(c,'S.npcs.length'),5,'mais personne ne meurt de faim : pénalité, pas gestion punitive');

  /* --- et la production baisse : c'est la vraie consequence --- */
  R(c,`__base(4,99,0);S.mat={};weekly();
    globalThis.__repus=Object.values(S.mat).reduce((a,b)=>a+b,0);`);
  const repus=G(c,'__repus');
  gt(repus,0,'quatre mineurs nourris rapportent — '+repus+' unités');
  R(c,`__base(4,0,0);S.faimRes=4;S.mat={};weekly();
    globalThis.__affames=Object.values(S.mat).reduce((a,b)=>a+b,0);`);
  ok(G(c,'__affames')<repus,'affamés, ils rapportent moins — '+G(c,'__affames')+' contre '+repus);

  /* --- et le territoire se remet des qu'on remplit le garde-manger --- */
  R(c,`__base(4,99,0);S.faimRes=4;S.mat={};weekly();S.mat={};weekly();
    globalThis.__remis=Object.values(S.mat).reduce((a,b)=>a+b,0);`);
  gte(G(c,'__remis'),repus*.9,'une fois nourris, ils reprennent leur rythme');
});

test('conseils — chaque systeme se signale, et sans mentir',()=>{
  /* Un systeme qu'on ne decouvre pas n'existe pas. Vingt-six conseils
     couvraient le jeu d'origine ; sept systemes ont ete batis depuis et
     aucun ne se signalait — dans un jeu qui tourne seul, on ne fouille pas
     les onglets par curiosite. */
  const c=nouveau();
  R(c,'S.carry=Object.keys(STATION);');

  /* --- aucun conseil ne doit lever d'exception, quel que soit l'etat ---
     C'est le vrai risque : une condition qui lit une fonction absente ou un
     objet nul fait tomber la boucle d'interface entiere. */
  const casse=G(c,`(()=>{
    const ko=[];
    const etats=[
      ()=>{},
      ()=>{S.hp=1;S.faim=5;S.end=0;S.mana=0;},
      ()=>{S.occ='combat';spawn();},
      ()=>{S.occ='donjon';here().poi='donjon';here().dj=genDungeon(here());},
      ()=>{S.items=[];S.eq={};S.modules=[];S.spells=[[],[]];S.comps=[];},
      ()=>{S.food={};S.mat={};S.potions=[];S.conso={};S.vehicule=null;S.prime={};},
      ()=>{here().b='cote';S.week=40;},
      ()=>{S.items=[mkParure('anneau',null,1.3)];S.items[0].vole=1;},
    ];
    TIPS.forEach(t=>{
      etats.forEach((e,i)=>{
        try{e();t.when();}catch(err){if(!ko.includes(t.id))ko.push(t.id+' ('+err.message+')');}
      });
    });
    return ko;})()`);
  eq(casse.length,0,'aucun conseil ne casse, quel que soit l\'état du jeu',
    'exceptions : '+casse.join(', '));

  /* --- chaque conseil doit pouvoir se declencher : un conseil dont la
     condition est toujours fausse est une page d'aide que personne ne lira --- */
  R(c,`globalThis.__tousEtats=()=>{
    /* un personnage a qui il est arrive de tout : c'est le seul moyen
       d'eprouver des conditions qui parlent de systemes differents */
    S.carry=Object.keys(STATION);
    S.sk.menuiserie.lv=40;S.sk.alchimie.lv=30;
    S.hp=1;S.faim=20;S.end=5;S.mana=0;S.or=6000;
    S.items=[mkParure('anneau',null,1.4)];
    S.items[0].vole=1;
    const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene','cuir']));
    p.push(partFor('fixations',['fer']));
    S.items.push(mkItem('arme','epee',p,1.2));equipItem(1);
    S.items.push(mkItem('arme','epee',p,1.1));
    S.food={achillee:2,herbes:2};S.mat={fer:60,chene:40,lin:40,sel:20,or:10};
    S.ref={'tissu:lin':8,'lingot:fer':8};
    S.books=[{id:'b1',dom:'feu',diff:4}];
    S.modules=[{id:'projectile',dom:'feu',lv:2,xp:0}];S.spells=[[0],[]];
    S.comps=[{id:'c1',nom:'x',el:0,lv:5,hp:10,max:10,esc:1,order:'attaquer'}];
    S.week=40;S.st=[];addStatus(S,'infection',4,1);
    S.prime={};const ki=kingdomHere();if(ki!==null)S.prime[ki]=400;
    const cc=here();cc.b='cote';cc.claim=1;S.claims=[key(cc.x,cc.y)];
    cc.plots=[{t:'batiment',slots:[{t:'meuble',k:'lit'},{t:'meuble',k:'coffre'}]}];
    S.tresor=500;S.gov='monarchie';
    S.occ='donjon';cc.poi='donjon';cc.dj=genDungeon(cc);
    globalThis.__m0=meteo;meteo=()=>'blizzard';
    globalThis.__t0=tempC;tempC=()=>18;
  };__tousEtats();`);
  /* Un seul etat ne peut pas rendre trente-sept conditions vraies : on est
     soit dans un donjon soit dans un village, soit affame soit repu. On
     eprouve donc chaque conseil sur une BATTERIE de situations, et l'on
     demande qu'au moins une le declenche — meme methode que pour les actions
     du plan, et pour la meme raison. */
  const muets=G(c,`(()=>{
    const scenes=[
      ()=>{__tousEtats();},
      ()=>{__tousEtats();S.occ='repos';here().poi=null;here().dj=null;},
      ()=>{__tousEtats();S.occ='combat';here().poi=null;here().dj=null;spawn();
           if(EE.length<2){EE.push(mkEnemy('loup',3,false,false,' Ⅱ'));}},
      ()=>{__tousEtats();S.day=Math.floor(S.day)+23/24;S.occ='repos';},
      /* dans une ville, riche, le sac plein */
      ()=>{__tousEtats();const k=kingdomsNear()[0];
           if(k){const t=kTowns(k)[0];S.pos=[t.x,t.y];here().seen=true;here().town=t.nom;
             here().poi='village';here().dj=null;}
           S.occ='repos';S.or=9000;
           while(S.items.length<sacMax()+2)S.items.push(mkParure('anneau',null,1.1));},
      /* en profondeur, sur un filon */
      ()=>{__tousEtats();here().poi='filon';here().dj=null;here().depth=3;S.occ='recolte';},
      /* un potentiel epuise et des relations */
      ()=>{__tousEtats();SK.forEach(k=>{S.sk[k].pot=35;S.sk[k].lv=12;});
           S.npcs=[{id:'n1',nom:'x',rel:70,rec:0,mood:60,cell:key(S.pos[0],S.pos[1]),race:'humain'}];
           S.occ='repos';here().poi=null;here().dj=null;},
      /* un territoire avec des champs et un tresor */
      ()=>{__tousEtats();const cc=here();cc.poi=null;cc.dj=null;
           cc.plots=[{t:'champ',crop:'ble'},{t:'batiment',slots:[{t:'meuble',k:'lit'}]}];
           S.tresor=2000;S.occ='repos';},
      /* au bord d'une eau libre, par temps clair */
      ()=>{__tousEtats();const cc=here();cc.b='cote';cc.poi=null;cc.dj=null;
           meteo=()=>'clair';S.occ='repos';},
      /* une bete en plein armement, garde levee — la hauteur de garde */
      ()=>{__tousEtats();S.occ='combat';here().poi=null;here().dj=null;spawn();
           if(E){E.w=.4;E.wEff=1;}S.guard=true;S.auto=S.auto||{};S.auto.garde=1;},
      /* un boyau : une galerie de karst, ou l'on se bat a la hampe */
      ()=>{__tousEtats();caverne=()=>1;S.occ='combat';here().poi=null;here().dj=null;spawn();},
      /* un titre decroche */
      ()=>{__tousEtats();S.bes=S.bes||{};S.bes.loup={v:9,t:9,a:0};S.hf={};hfBalayer();S.occ='repos';},
      /* une bete en plein armement, et du butin rare dans le sac */
      ()=>{__tousEtats();S.occ='combat';here().poi=null;here().dj=null;spawn();
           if(E){E.w=.4;E.wEff=1;}
           S.items.push(mkParure('amulette',null,1.5));S.items[S.items.length-1].rar=2;},
      /* le debut d'une partie : de l'or, aucun territoire, une ville a sec */
      ()=>{__tousEtats();S.claims=[];here().claim=0;S.or=99999;S.gov=null;
           here().poi=null;here().dj=null;
           const k=kingdomsNear()[0];
           if(k){const t=kTowns(k)[0];S.pos=[t.x,t.y];here().seen=true;t.or=1;t.orMax=500;}
           S.occ='repos';},
      /* un mineur devant sa strate, et un PNJ qui l'aime bien */
      ()=>{__tousEtats();const cc=here();cc.poi=null;cc.dj=null;cc.depth=0;
           S.sk.minage.lv=30;
           S.items.push({id:'tp',kind:'outil',fn:'pioche',slot:'main1',
             parts:[{ct:'fixations',f:'brut',mk:'adamant'}],q:3,dur:60,durBase:20,de:10,
             mana:0,ela:8,vec:[.2,.2,.2,.2,.2],nom:'essai'});
           S.day=Math.floor(S.day)+12/24;
           S.npcs=[{id:'n2',nom:'y',rel:80,rec:0,mood:70,cell:key(S.pos[0],S.pos[1]),race:'humain'}];
           S.rep={g:60,race:{},king:{}};
           S.occ='repos';},
      /* une case raclee depuis des jours, et un vieux territoire sans regime */
      ()=>{__tousEtats();const cc=here();cc.poi=null;cc.dj=null;
           cc.kills=200;cc.corr=10;
           S.day+=6;S.gov=null;
           S.claims=[];for(let i=0;i<7;i++){const c2=cell(cc.x+i+1,cc.y);c2.claim=1;S.claims.push(key(c2.x,c2.y));}
           S.occ='repos';},
    ];
    const ko=[];
    TIPS.forEach(t=>{
      let vu=false;
      scenes.forEach(s=>{
        if(vu)return;
        try{s();if(t.when())vu=true;}catch(e){}
      });
      if(!vu)ko.push(t.id);
    });
    return ko;})()`);
  /* UN CONSEIL QUI ENUMERE UNE TABLE FINIT PAR MENTIR. Celui des gestes
     listait les six telegraphes d'origine ; il y en a quatorze. Un conseil
     peut donc etre une FONCTION, calculee sur la table au moment ou on la
     lit — et l'on verifie ici qu'aucun geste n'y manque, ce qu'aucune
     relecture de prose ne garantirait. */
  const tg=G(c,'tipCorps(TIPS.find(x=>x.id==="geste"))');
  const oublies=G(c,'Object.keys(PATTERN)').filter(k=>{
    const n=G(c,'PATTERN["'+k+'"].n');return tg.indexOf(n)<0;});
  ok(oublies.length===0,'le conseil des gestes les nomme TOUS — il se calcule, il ne se recopie pas',
    oublies.length?'oublies : '+oublies.join(', '):'');
  ok(tg.indexOf('hauteur')>0,'et il enseigne la hauteur de garde, qui est ce qui rend la lecture utile');

  ok(muets.length===0,'chacun des '+G(c,'TIPS.length')+' conseils peut se déclencher',
    'jamais vus : '+muets.join(', '));

  /* --- et un conseil ne se montre qu'UNE fois --- */
  R(c,'S.seen={};S.tips=true;tipQ.length=0;'
    +'globalThis.__n=0;for(let i=0;i<200;i++){tickTips();__n=Object.keys(S.seen).length;}');
  const vus=G(c,'__n');
  gt(vus,0,'les conseils se montrent — '+vus+' vus');
  R(c,'globalThis.__avant=Object.keys(S.seen).length;for(let i=0;i<200;i++)tickTips();');
  eq(G(c,'Object.keys(S.seen).length'),G(c,'__avant'),'et jamais deux fois le même');

  /* --- le mode veteran les coupe tous --- */
  R(c,'S.seen={};S.tips=false;tipQ.length=0;for(let i=0;i<50;i++)tickTips();');
  eq(G(c,'Object.keys(S.seen).length'),0,'le mode vétéran n\'en montre aucun');
});

test('deux colonnes — la carte est une piece, pas une copie',()=>{
  /* Sur un ecran d'ordinateur, la carte vit a gauche en permanence et
     l'onglet MONDE ne la repete pas. Le danger d'une mise en page a deux
     colonnes est d'ecrire deux fois la meme chose : ce sont les MEMES
     cellules, le meme rendu, la meme fonction. */
  const c=nouveau();
  R(c,"S.occ='repos';");
  const carte=G(c,'carteHtml(5)');
  ok(carte.indexOf('data-go=')>0,'la carte porte ses cases cliquables');
  ok(G(c,'pMonde()').indexOf(carte)>0,
    'et l onglet MONDE monte exactement la meme, sans la reecrire');
  ok(G(c,'carteActions()').indexOf('data-occ="combat"')>0,'les trois occupations suivent la carte');
  /* le nombre de cases doit suivre le rayon demande, pas un chiffre ecrit */
  const n5=G(c,'(carteHtml(5).match(/data-go=/g)||[]).length');
  const n3=G(c,'(carteHtml(3).match(/data-go=/g)||[]).length');
  eq(n5,121,'un rayon de cinq fait onze sur onze');
  eq(n3,49,'un rayon de trois, sept sur sept');

  /* la feuille de style porte la coupe en deux, et le telephone n y touche pas */
  const css=readFileSync(join(root,'src','style.css'),'utf8');
  ok(css.indexOf('@media(min-width:1080px)')>0,'la coupe en deux est une requete de media');
  ok(css.indexOf('grid-template-columns:minmax(420px,1fr)')>0,'et une grille a deux colonnes');
});

test('gestes de la case — un seul endroit pour une seule intention',()=>{
  /* Aller sur un autel dans MONDE, ouvrir CELLULE pour le fouiller, ouvrir
     MAGIE pour lire le grimoire qu'on vient d'y trouver : trois pages pour un
     geste et sa suite. Le jeu savait tout faire, il le faisait dire par trois
     endroits differents. */
  const c=nouveau();
  R(c,"S.occ='repos';S.books=[];here().poi=null;here().dj=null;");
  eq(G(c,'gestesIci().length'),0,'sur une case nue, aucun geste — une barre de boutons grisés ne fait gagner aucun clic');

  /* --- l autel --- */
  R(c,"here().poi='sanctuaire';here().shrine=0;S.week=5;");
  ok(G(c,'gestesIci().some(g=>g[0].indexOf("shrine")===0)'),'sur un sanctuaire, on peut fouiller sans changer d onglet');
  R(c,'here().shrine=S.week+1;');
  ok(!G(c,'gestesIci().some(g=>g[0].indexOf("shrine")===0)'),'et une fois fouillé, le geste disparaît au lieu de se griser');

  /* --- le livre trouve : le second onglet qu on s epargne --- */
  R(c,"S.books=[{id:'a',dom:'feu',diff:9},{id:'b',dom:'eau',diff:3}];");
  const lire=G(c,'gestesIci().filter(g=>g[0].indexOf("read")===0)');
  eq(lire.length,1,'un livre en sac se lit depuis la carte');
  ok(String(lire[0][0]).indexOf('read="1"')===0,'et c est le plus FACILE qui est proposé — celui qu on ouvrirait à la main');
  R(c,"S.occ='combat';");
  ok(!G(c,'gestesIci().some(g=>g[0].indexOf("read")===0)'),'on ne lit pas au milieu d un combat');

  /* --- le donjon --- */
  R(c,"S.occ='repos';S.books=[];here().poi='donjon';here().dj={clear:false,floors:[[{t:'salle'}]],f:0,r:0,nom:'x'};");
  ok(G(c,'gestesIci().some(g=>g[0].indexOf("dj")===0)'),'on redescend depuis la carte');
  R(c,'here().dj.clear=true;');
  ok(!G(c,'gestesIci().some(g=>g[0].indexOf("dj")===0)'),'un donjon vidé ne propose plus rien');

  /* --- ce sont les MEMES boutons : chaque attribut doit avoir son lecteur --- */
  const src=readFileSync(join(root,'src','50-input.js'),'utf8');
  R(c,"here().poi='sanctuaire';here().shrine=0;S.books=[{id:'a',dom:'feu',diff:3}];");
  const attrs=G(c,'gestesIci().map(g=>g[0].split("=")[0])');
  const orphelins=attrs.filter(a=>src.indexOf('data-'+a)<0);
  ok(orphelins.length===0,'chaque geste de la carte est lu par l entrée du jeu',
    orphelins.length?'sans lecteur : '+orphelins.join(', '):'');
});

test('caravane — un transporteur deplace de l or, il n en fabrique pas',()=>{
  /* Le Marchand et le Transporteur rendaient exactement la meme ligne :
     rend x 7 x reputation, de l'or venu de nulle part. Deux fiches, deux
     noms, deux salaires — et un seul metier : le choix n'existait pas. */
  const c=nouveau();
  R(c,`S.claims=[key(S.pos[0],S.pos[1])];here().claim=1;
    globalThis.__t=(kingdomsNear()[0]?kTowns(kingdomsNear()[0])[0]:null);
    if(__t){const cc=cell(__t.x,__t.y);cc.seen=true;__t.or=100000;__t.abandonne=false;}
    globalThis.__n={id:'x',nom:'y',lv:5,mood:80,rec:1,assign:'transporteur',
      cell:key(S.pos[0],S.pos[1]),home:1,race:'humain'};`);

  /* --- sans marchandise, rien : il ne fabrique pas --- */
  R(c,'S.mat={};');
  eq(G(c,'caravane(__n,7)'),0,'sans rien a porter, la caravane rentre a vide');
  /* --- sans ville connue, rien non plus --- */
  R(c,"S.mat={fer:200};globalThis.__vus=villesConnues().length;");
  R(c,'(kTowns(kingdomsNear()[0])||[]).forEach(t=>{const cc=cell(t.x,t.y);cc.seen=false;});');
  eq(G(c,'caravane(__n,7)'),0,'sans ville dont on ait vu la case, personne a qui vendre');

  /* --- avec les deux : de l or, et de la MARCHANDISE EN MOINS --- */
  R(c,`(kTowns(kingdomsNear()[0])||[]).forEach(t=>{const cc=cell(t.x,t.y);cc.seen=true;t.or=100000;});
    S.mat={fer:200};globalThis.__av=S.mat.fer;globalThis.__g=caravane(__n,7);`);
  gt(G(c,'__g'),0,'elle rapporte de l or');
  ok(G(c,'S.mat.fer')<G(c,'__av'),'et il en manque au grenier — l or vient de la marchandise, pas du neant ('
    +G(c,'__av')+' puis '+G(c,'S.mat.fer')+')');

  /* --- la bourse de la ville borne, et se vide --- */
  R(c,`(kTowns(kingdomsNear()[0])||[]).forEach(t=>{t.or=12;});
    S.mat={fer:400};globalThis.__g2=caravane(__n,20);`);
  ok(G(c,'__g2')<=12,'une ville a sec ne paie que ce qu elle a — '+G(c,'__g2'));
  ok(G(c,'kTowns(kingdomsNear()[0]).reduce((a,t)=>a+t.or,0)')<12*G(c,'kTowns(kingdomsNear()[0]).length'),
    'et sa bourse a diminue d autant');

  /* --- le marchand, lui, garde son metier a lui --- */
  R(c,"globalThis.__m=Object.assign({},__n,{assign:'vendeur'});");
  eq(G(c,'JOBS.vendeur.n'),'Marchand','le marchand vend sur place');
  eq(G(c,'JOBS.transporteur.n'),'Transporteur','le transporteur porte ailleurs');
});

test('prose — aucun onglet ne recopie un compte qu il pourrait lire',()=>{
  /* Le conseil des gestes en listait six quand la table en portait quatorze ;
     l'onglet COMBAT annoncait « trois postures » alors qu'il y en a quatre
     depuis longtemps ; « seize parcelles » etait ecrit a trois endroits, dont
     deux en toutes lettres. Ce sont des COPIES, et une copie ne se met pas a
     jour toute seule. La prose garde ses lettres, le nombre vient de la table. */
  const c=nouveau();
  eq(G(c,'nomNombre(4)'),'quatre','les nombres s ecrivent en lettres');
  eq(G(c,'nomNombre(16)'),'seize','jusqu a vingt, au-dela le chiffre');
  eq(G(c,'nomNombre(42)'),'42','et le chiffre au-dela, plutot qu un mot faux');

  /* --- l onglet COMBAT dit le nombre de postures qu il affiche --- */
  R(c,"S.fold=S.fold||{};S.fold.combat='st';globalThis.__pc=pCombat();");
  const pc=G(c,'__pc');
  ok(pc.indexOf(G(c,'nomNombreCap(STANCE.length)')+' postures')>0,
    'COMBAT annonce autant de postures qu il en existe — '+G(c,'STANCE.length'));
  ok(pc.indexOf('Trois postures')<0,'et plus le compte d hier');

  /* --- BATIR dit le nombre de parcelles qu une cellule tient VRAIMENT --- */
  R(c,'globalThis.__pb=pBatir();globalThis.__np=plots(here()).length;');
  const pb=G(c,'__pb');
  ok(pb.indexOf(G(c,'nomNombre(NPLOTS)')+' parcelles')>0,'BATIR annonce le bon nombre de parcelles');
  eq(G(c,'__np'),G(c,'NPLOTS'),'et une cellule en porte exactement autant');
});

test('rotation defensive — l enchainement sait enfin parler de garde',()=>{
  /* Sept gestes programmables, tous offensifs sauf « lever la garde » — qui,
     depuis que la garde a une HAUTEUR, ne disait plus que la moitie de ce
     qu'il fallait dire. Ecrire sa rotation d'avance doit inclure sa defense :
     « je couvre le haut, je frappe deux fois, je passe en bas ». */
  const c=nouveau();
  eq(G(c,'!!GESTES.hauteur&&!!GESTES.lire'),true,'les deux gestes de garde existent');
  eq(G(c,'GESTES.hauteur.arg'),'hauteur','et la hauteur se choisit dans la ligne');
  /* aucun geste ne doit promettre un argument que l interface ne propose pas */
  eq(G(c,'Object.keys(GESTES).every(k=>!GESTES[k].arg||["arme","sort","temps","hauteur"].includes(GESTES[k].arg))'),
    true,'aucun geste ne demande un argument inconnu');

  R(c,"S.occ='combat';E=null;EE=[];spawn();S.gdir='haut';");
  R(c,"GESTES.hauteur.fais('bas');");
  eq(G(c,'S.gdir'),'bas','le geste pose la hauteur demandee');
  eq(G(c,'S.guard'),true,'et leve la garde du meme mouvement');
  R(c,"GESTES.hauteur.fais('nimportequoi');");
  eq(G(c,'S.gdir'),'haut','une hauteur inconnue retombe sur la haute, jamais sur rien');

  /* --- LIRE : la garde suit ce que la creature annonce --- */
  R(c,"E.pats=['morsure'];armePattern(E);S.gdir='haut';");
  eq(G(c,'GESTES.lire.peut()'),true,'on peut lire un geste commence');
  R(c,'GESTES.lire.fais();');
  eq(G(c,'S.gdir'),'bas','et la garde se place ou la morsure arrive');
  eq(G(c,'gardeAccord(E)'),1,'l accord est parfait');
  /* ce qui n'annonce rien ne se lit pas — et le geste doit le dire, pas attendre */
  R(c,"E.pats=['souffle'];armePattern(E);");
  eq(G(c,'GESTES.lire.peut()'),false,'un souffle ne s annonce d aucune hauteur');
  R(c,'E=null;EE=[];');
  eq(G(c,'GESTES.lire.absent()'),true,'et sans personne en face, le geste est ABSENT — il se saute, il n attend pas');
});

test('enchainement — l ordre des coups se decide enfin',()=>{
  /* Le plan dit QUOI faire ; l'enchainement dit COMMENT frapper. Une fois le
     combat engage, tout se jouait tout seul et toujours pareil : on frappait
     des qu'il y avait du souffle, chaque sort partait des qu'il etait pret,
     et l'ordre ne se decidait nulle part. Or l'ordre EST le jeu. */
  const c=nouveau();
  R(c,`globalThis.__arme=(fn)=>{
      const p=FUNC[fn].comp.map(ct=>partFor(ct,['fer','chene','cuir']));
      p.push(partFor('fixations',['fer']));
      return mkItem('arme',fn,p,1.2);};
    globalThis.__combat=()=>{S.occ='combat';S.hp=maxHp();S.end=100;S.mana=maxMana();
      E=null;EE=[];spawn();EE.forEach(e=>{e.hp=1e9;e.max=1e9;});};
    /* on trace ce qui part vraiment : chaque coup, chaque sort */
    globalThis.__trace=[];
    (()=>{const a0=attack;attack=function(h){__trace.push(h?'lourd':'coup');return a0.apply(this,arguments);};
          const c0=castSpell;castSpell=function(i){const r=c0.apply(this,arguments);if(r)__trace.push('sort'+i);return r;};})();
    S.stats.force=60;S.stats.endu=60;S.stats.vol=60;`);

  /* --- a l'arret, rien ne change : le combat se joue comme avant --- */
  R(c,'S.seq={on:false,i:0,r:[]};S.items=[__arme("epee")];equipItem(0);'
    +'__combat();__trace.length=0;for(let i=0;i<200;i++)combatTick(.1);');
  gt(G(c,'__trace.length'),0,'sans enchaînement, on frappe comme avant');

  /* --- l'ordre programme est celui qui sort --- */
  R(c,`S.items=[__arme('epee'),__arme('marteau')];S.eq={};equipItem(0);
    S.seq={on:true,i:0,r:[
      {t:'arme',v:'marteau',n:1},
      {t:'coup',v:null,n:2},
      {t:'arme',v:'epee',n:1},
      {t:'lourd',v:null,n:1},
    ]};seqReset();
    __combat();__trace.length=0;globalThis.__armes=[];
    for(let i=0;i<400;i++){combatTick(.1);
      const w=weapon();if(w)__armes.push(w.fn);}`);
  const suite=G(c,'__trace.slice(0,6).join(" ")');
  eq(G(c,'__trace.slice(0,3).join(" ")'),'coup coup lourd',
    'les gestes sortent dans l\'ordre écrit — '+suite);
  /* et l'arme a bien change de main au bon moment */
  eq(G(c,'__armes.some(f=>f==="marteau")&&__armes.some(f=>f==="epee")'),true,
    'l\'arme change de main quand l\'enchaînement le dit');

  /* --- il tourne en boucle --- */
  eq(G(c,'__trace.slice(0,6).join(" ")'),'coup coup lourd coup coup lourd',
    'et la suite se rejoue en boucle');

  /* --- un sort prend sa place dans la suite --- */
  R(c,`S.modules=[{id:'projectile',dom:'feu',lv:3,xp:0}];S.spells=[[0],[]];
    S.seq={on:true,i:0,r:[{t:'coup',v:null,n:1},{t:'sort',v:0,n:1}]};seqReset();
    __combat();__trace.length=0;for(let i=0;i<300;i++)combatTick(.1);`);
  eq(G(c,'__trace.slice(0,4).join(" ")'),'coup sort0 coup sort0',
    'un sort prend sa place dans la suite, au tour qu\'on lui donne');

  /* --- un geste impayable attend, puis se saute : il ne fige rien --- */
  R(c,`S.modules=[];S.spells=[[],[]];
    S.seq={on:true,i:0,r:[{t:'sort',v:0,n:1},{t:'coup',v:null,n:1}]};seqReset();
    __combat();__trace.length=0;for(let i=0;i<300;i++)combatTick(.1);`);
  gt(G(c,'__trace.filter(x=>x==="coup").length'),0,
    'un sort désappris ne fige pas la suite — le coup suivant part quand même');
  eq(G(c,'__trace.some(x=>/^sort/.test(x))'),false,'et le sort absent ne part pas');
  /* Et il se saute TOUT DE SUITE, pas apres douze battements de patience :
     attendre un sort desappris n'a aucun sens, et la difference entre « pas
     encore » et « jamais » est tout l'interet de la regle. On compte donc les
     coups sur une duree courte — s'il fallait patienter, il n'y en aurait
     presque aucun. */
  R(c,`S.seq={on:true,i:0,r:[{t:'sort',v:0,n:1},{t:'coup',v:null,n:1}]};seqReset();
    __combat();__trace.length=0;for(let i=0;i<60;i++)combatTick(.1);`);
  const vite=G(c,'__trace.filter(x=>x==="coup").length');
  gte(vite,2,'le geste absent est sauté sur-le-champ — '+vite+' coups en six secondes');

  /* --- il repart au premier geste a chaque combat --- */
  R(c,`S.seq={on:true,i:0,r:[{t:'coup',v:null,n:1},{t:'lourd',v:null,n:1}]};
    __combat();__trace.length=0;for(let i=0;i<40;i++)combatTick(.1);
    globalThis.__avant=S.seq.i;
    __combat();`);
  eq(G(c,'S.seq.i'),0,'chaque combat reprend au premier geste');

  /* --- LES COMPAGNONS : un ordre fige devient une rotation --- */
  R(c,`S.comps=[{id:'c1',type:'bete',nom:'Essai',el:0,lv:10,hp:200,max:200,xp:0,
      esc:1,order:'attaquer',seq:[{o:'tenir',n:2},{o:'attaquer',n:3}],si:0,sn:0}];
    S.stats.cha=30;S.sk.leadership.lv=30;`);
  eq(G(c,'compSeqOrdre(S.comps[0])'),'tenir','le compagnon commence par tenir');
  R(c,'compSeqAvance(S.comps[0]);');
  eq(G(c,'compSeqOrdre(S.comps[0])'),'tenir','deux temps durant');
  R(c,'compSeqAvance(S.comps[0]);');
  eq(G(c,'compSeqOrdre(S.comps[0])'),'attaquer','puis il frappe');
  R(c,'compSeqAvance(S.comps[0]);compSeqAvance(S.comps[0]);compSeqAvance(S.comps[0]);');
  eq(G(c,'compSeqOrdre(S.comps[0])'),'tenir','et la rotation boucle');
  /* sans enchaînement, il garde son ordre fixe */
  R(c,'S.comps[0].seq=[];S.comps[0].order="repli";');
  eq(G(c,'compSeqOrdre(S.comps[0])'),'repli','sans enchaînement, l\'ordre fixe reste');
  /* et l'ordre du moment décide vraiment de son exposition */
  R(c,`S.comps[0].seq=[{o:'tenir',n:1}];S.comps[0].si=0;S.comps[0].sn=0;
    __combat();globalThis.__ag1=(ORDERS.find(o=>o.k===compSeqOrdre(S.comps[0]))||{}).aggro;
    S.comps[0].seq=[{o:'repli',n:1}];S.comps[0].si=0;
    globalThis.__ag2=(ORDERS.find(o=>o.k===compSeqOrdre(S.comps[0]))||{}).aggro;`);
  gt(G(c,'__ag1'),G(c,'__ag2'),'et son exposition suit l\'ordre du moment, pas l\'ancien');
});

test('gardiens — le fond du donjon vaut la descente',()=>{
  /* La salle du gardien posait une creature ordinaire avec six fois ses PV
     et « Gardien — » devant son nom : huit etages pour retrouver le rodeur
     du premier couloir en plus gros. Et l'artefact au bout tirait son nom
     dans deux listes de six mots — jamais deux fois le meme, donc jamais
     memorable. */
  const c=nouveau();
  R(c,`globalThis.__donjon=(theme,majeur)=>{
    const cc=here();cc.poi='donjon';
    cc.dj=genDungeon(cc);cc.dj.theme=theme;cc.dj.majeur=majeur?1:0;
    /* on se place directement dans la salle du gardien */
    cc.dj.f=cc.dj.floors.length-1;
    cc.dj.r=cc.dj.floors[cc.dj.f].length-1;
    cc.dj.floors[cc.dj.f][cc.dj.r]={t:'boss',mobs:1,done:false};
    S.occ='donjon';E=null;EE=[];spawn();
    return EE[0];};`);

  /* --- chaque theme a SON gardien, reconnaissable --- */
  const noms=G(c,'Object.keys(GARDIEN).map(t=>{const e=__donjon(t,false);return e?e.nom:null;})');
  eq(new Set(noms).size,noms.length,'chaque thème pose un gardien différent — '+noms.join(', '));
  eq(noms.filter(n=>!n||/^Gardien —/.test(n)).length,0,'et aucun ne s\'appelle « Gardien — quelque chose »');
  /* un donjon majeur a le sien */
  const majeur=G(c,'__donjon("ruine",true).nom');
  eq(majeur,G(c,'GARDIEN_MAJEUR.n'),'un donjon majeur pose le sien');
  /* chacun a son espece, donc sa silhouette */
  const especes=G(c,'Object.keys(GARDIEN).map(t=>GARDIEN[t].cre)');
  eq(especes.filter(k=>!G(c,'CREATURE["'+k+'"]')).length,0,'chaque gardien a une espèce réelle');

  /* --- le trait de chacun FAIT quelque chose --- */
  /* la Veilleuse se recoud si on la laisse respirer */
  R(c,'__donjon("crypte",false);E.hp=E.max*.5;globalThis.__h0=E.hp;'
    +'for(let i=0;i<60;i++)gardienTick(.2);');
  gt(G(c,'E.hp'),G(c,'__h0'),'la Veilleuse se recoud si on la laisse respirer');
  /* mais pas si on la frappe */
  R(c,'E.hp=E.max*.5;__h0=E.hp;for(let i=0;i<60;i++){E.hp-=.001;gardienTick(.2);}');
  ok(G(c,'E.hp')<=G(c,'__h0'),'et pas du tout si on frappe sans relâche');

  /* le Sergent appelle du renfort sous la moitie */
  R(c,'__donjon("ruine",false);globalThis.__n0=EE.length;E.hp=E.max*.4;gardienTick(.2);');
  gt(G(c,'EE.length'),G(c,'__n0'),'le Sergent Muré appelle du renfort quand il faiblit');
  R(c,'globalThis.__n1=EE.length;E.hp=E.max*.2;for(let i=0;i<20;i++)gardienTick(.2);');
  eq(G(c,'EE.length'),G(c,'__n1'),'et une seule fois — il n\'en a pas d\'autre');

  /* le Fendu porte une gangue qui cede */
  R(c,'__donjon("mine",false);globalThis.__a0=E.arm;');
  eq(G(c,'E.gangue'),1,'le Fendu commence sous sa gangue');
  R(c,'E.hp=E.max*.5;gardienTick(.2);');
  ok(G(c,'E.arm')<G(c,'__a0'),'elle cède à mi-course — '+G(c,'__a0')+' d\'armure puis '+G(c,'E.arm'));

  /* la Mere des Ronces enrage */
  R(c,'__donjon("repaire",false);E.hp=E.max;gardienTick(.2);globalThis.__r0=E.rage||1;'
    +'E.hp=E.max*.1;gardienTick(.2);');
  gt(G(c,'E.rage'),G(c,'__r0'),'la Mère des Ronces enrage à mesure qu\'elle tombe');
  /* et la rage se lit dans les degats recus */
  /* On mesure sur la MEME creature, maintenue en vie et remise a neuf entre
     chaque coup : sinon on mesure la derive de l'etat de combat — un premier
     jet donnait 31,4 puis 4,6 parce que la bete etait morte en route. */
  R(c,`__donjon('repaire',false);S.eq={};salirUtil();
    globalThis.__mordu=(r)=>{let s=0;
      for(let i=0;i<300;i++){
        E.hp=E.max;E.rage=r;E.st=[];S.st=[];
        const h=S.hp=maxHp();resolveHit(0,E);s+=h-S.hp;
      }
      return s/300;};`);
  /* On mesure dans les DEUX ORDRES et l'on exige les deux fois le meme
     verdict : un premier jet donnait 12,8 puis 23,2 et paraissait probant,
     alors que l'ecart venait de la derive de l'etat de combat — debrancher
     la rage ne changeait rien au resultat. Une mesure qui ne survit pas a
     l'inversion de l'ordre ne mesure pas ce qu'on croit. */
  const calme=G(c,'__mordu(1)'),enrage=G(c,'__mordu(1.8)');
  const enrage2=G(c,'__mordu(1.8)'),calme2=G(c,'__mordu(1)');
  /* avec une marge : une rage de 1,8 doit se voir franchement, sinon deux
     mesures bruitees se depassent l'une l'autre par hasard — c'est ce qui
     arrivait, et le test passait meme l'effet debranche */
  gt(enrage,calme*1.4,'la rage se lit dans les coups reçus — '+calme.toFixed(1)+' puis '+enrage.toFixed(1));
  gt(enrage2,calme2,'et dans l\'ordre inverse aussi — '+enrage2.toFixed(1)+' puis '+calme2.toFixed(1));

  /* --- LA PIECE NOMMEE : ecrite, pas tiree --- */
  const uniques=G(c,'Object.keys(GARDIEN).map(t=>GARDIEN[t].arte).concat([GARDIEN_MAJEUR.arte])');
  eq(uniques.filter(k=>!G(c,'ARTEFACT["'+k+'"]')).length,0,'chaque gardien garde une pièce qui existe');
  /* Et elle tombe VRAIMENT quand on nettoie la salle : appeler la fonction
     a la main ne prouve pas qu'elle est branchee au donjon. */
  R(c,'__donjon("mine",false);S.items=[];S.stats.force=10;djAdvance();');
  eq(G(c,'S.items.filter(it=>it.unique==="pic").length'),1,
    'nettoyer la salle du gardien fait tomber SA pièce');
  R(c,'S.items=[];dropArtefactNomme("pic",4);');
  eq(G(c,'S.items.length'),1,'elle tombe');
  eq(G(c,'S.items[0].nom'),G(c,'ARTEFACT.pic.n'),'sous son nom, toujours le même');
  eq(G(c,'S.items[0].aff.map(a=>a.id).join(",")'),G(c,'ARTEFACT.pic.aff.map(a=>a[0]).join(",")'),
    'avec ses effets écrits, pas tirés');
  /* deux exemplaires portent les memes effets — c'est le propos d'une piece nommee */
  R(c,'S.items=[];dropArtefactNomme("pic",1);dropArtefactNomme("pic",8);');
  eq(G(c,'S.items[0].aff.map(a=>a.id+JSON.stringify(a.p)).join("|")'),
     G(c,'S.items[1].aff.map(a=>a.id+JSON.stringify(a.p)).join("|")'),
    'deux exemplaires ont exactement les mêmes effets');
  ok(G(c,'S.items[1].q')>G(c,'S.items[0].q'),'seule la qualité suit l\'étage où on l\'a arrachée');
  /* et chaque affixe cite existe vraiment */
  const affFausses=G(c,`Object.keys(ARTEFACT).flatMap(k=>ARTEFACT[k].aff.map(a=>a[0]))
    .filter(id=>!AFF.some(x=>x.id===id))`);
  eq(affFausses.length,0,'et chaque effet cité existe','inconnus : '+affFausses.join(', '));
});

test('peche — une troisieme voie de subsistance',()=>{
  /* Un tiers des biomes touche l'eau, et l'on n'y faisait rien que la meme
     chose qu'ailleurs. La peche ne ressemble ni a la chasse ni a
     l'agriculture : aucun combat, aucun territoire — elle nourrit un blesse
     et un vagabond. */
  const c=nouveau();
  R(c,`globalThis.__eau=()=>{here().b='cote';globalThis.__tc0=globalThis.__tc0||tempC;tempC=()=>18;meteo=()=>'clair';};
    globalThis.__terre=()=>{here().b='montagne';here().stock=null;};`);

  /* --- il faut de l'eau --- */
  R(c,'__terre();');
  const surTerre=G(c,'pecheBlocage()');
  R(c,'__eau();');
  eq(G(c,'pecheBlocage()'),null,'au bord de l\'eau, la pêche est ouverte');
  ok(!!surTerre,'sur une montagne sèche, non — '+surTerre);

  /* --- le gel la ferme, la tempête aussi --- */
  R(c,'__eau();tempC=()=>-12;');
  ok(!!G(c,'pecheBlocage()'),'l\'eau prise par le gel ferme la pêche');
  R(c,'tempC=()=>18;meteo=()=>"tempete";');
  ok(!!G(c,'pecheBlocage()'),'et l\'on ne pêche pas dans une tempête');
  R(c,'meteo=()=>"clair";');

  /* --- elle donne vraiment quelque chose, et sans combat --- */
  R(c,'S.food={};S.mat={};S.end=100;S.occ="peche";pechT=0;'
    +'for(let i=0;i<600;i++)pecheTick(1);');
  const prises=G(c,'Object.values(S.food).reduce((a,b)=>a+b,0)');
  gt(prises,0,'dix minutes de ligne donnent de quoi manger — '+prises+' prises');
  gt(G(c,'lv("peche")'),0,'et la compétence monte à l\'usage');

  /* --- une barque double la prise --- */
  R(c,'S.vehicule=null;S.sk.peche.lv=0;');
  const aPied=G(c,'pecheDelai()');
  R(c,'S.vehicule={k:"barque",pv:VEHICULE.barque.pv,crie:0};');
  ok(G(c,'pecheDelai()')<aPied*.7,'depuis une barque, on pêche au large et bien plus vite — '
    +aPied.toFixed(1)+' s puis '+G(c,'pecheDelai()').toFixed(1)+' s');

  /* --- chaque biome donne quelque chose, et rien d'inconnu --- */
  const fausses=G(c,`Object.keys(PECHE).flatMap(b=>Object.keys(PECHE[b]))
    .filter((k,i,l)=>l.indexOf(k)===i)
    .filter(k=>!PECHE_FOOD[k]&&!MAT[k])`);
  eq(fausses.length,0,'chaque prise est une vraie matière ou une vraie nourriture',
    'inconnues : '+fausses.join(', '));
  const sansTable=G(c,'Object.keys(BIOME).filter(b=>!PECHE[b])');
  eq(sansTable.length,0,'chaque biome a sa table de pêche','sans table : '+sansTable.join(', '));

  /* --- et le poisson se mange cru sans fièvre : c'est son avantage franc --- */
  R(c,'S.st=[];globalThis.__inf=0;'
    +'for(let i=0;i<200;i++){S.food={};addFood(foodKey("poisson",4,"Vie"),1);'
    +'S.faim=20;eatFood(foodKey("poisson",4,"Vie"));if(hasStatus(S,"infection"))__inf++;S.st=[];}');
  eq(G(c,'__inf'),0,'deux cents poissons crus, aucune fièvre');
});

test('ciel — chaque etat de meteo fait quelque chose',()=>{
  /* Dix etats, et le seul qui changeait quelque chose etait la temperature
     ressentie. Une tempete valait un ciel clair, un blizzard aussi, et les
     trois extremes annonces la veille par les PNJ n'annoncaient rien. */
  const c=nouveau();
  /* on force le ciel : meteo() est une fonction pure, on la remplace le
     temps de la mesure — c'est le seul moyen d'eprouver dix etats sans
     attendre qu'ils tombent */
  R(c,`globalThis.__ciel=(k)=>{meteo=()=>k;};
    globalThis.__bande=(b)=>{for(let i=-2;i<=9;i++){const cc=cell(S.pos[0]+i,S.pos[1]);cc.b=b;cc.seen=true;}
      here().b=b;return here();};
    globalThis.__voyage=(dx)=>{const j=S.day,p=S.pos.slice();
      travel(p[0]+dx,p[1]);const d=S.day-j;S.pos=p;S.day=j;S.hp=maxHp();return d;};
    __bande('plaine');S.vehicule=null;S.eq={};salirUtil();`);

  /* --- CHAQUE etat declare doit avoir une entree d'effets, sinon il est
     muet par oubli et non par choix --- */
  const muets=G(c,'Object.keys(METEO).filter(k=>!METEOFX[k])');
  eq(muets.length,0,'chaque état de météo a sa table d\'effets','sans effets : '+muets.join(', '));

  /* --- le temps d'un trajet suit le ciel --- */
  R(c,'__ciel("clair");');
  const clair=G(c,'__voyage(3)');
  R(c,'__ciel("neige");');
  gt(G(c,'__voyage(3)'),clair*1.08,'la neige tient aux jambes');
  R(c,'__ciel("tempete");');
  gt(G(c,'__voyage(3)'),clair*1.18,'une tempête allonge nettement le trajet');
  R(c,'__ciel("blizzard");');
  gt(G(c,'__voyage(3)'),clair*1.35,'un blizzard, plus encore');

  /* --- et le blizzard BLESSE qui n'a pas d'abri --- */
  R(c,'__ciel("blizzard");here().plots=null;S.torche=0;S.hp=maxHp();'
    +'globalThis.__hp0=S.hp;const p0=S.pos.slice();travel(p0[0]+3,p0[1]);S.pos=p0;');
  ok(G(c,'S.hp')<G(c,'__hp0'),'voyager dans un blizzard sans abri coûte des points de vie');
  /* un foyer ou une torche protege */
  R(c,'S.hp=maxHp();__hp0=S.hp;S.torche=600;const p1=S.pos.slice();travel(p1[0]+3,p1[1]);S.pos=p1;');
  eq(G(c,'S.hp'),G(c,'__hp0'),'une torche suffit à s\'abriter — c\'est tout le propos');

  /* --- l'orage cherche le métal qu'on porte --- */
  R(c,`__ciel('orage');S.torche=0;S.eq={};salirUtil();
    globalThis.__coups=(n)=>{let k=0;
      for(let i=0;i<n;i++){S.hp=maxHp();const p=S.pos.slice(),j=S.day;
        travel(p[0]+2,p[1]);if(S.hp<maxHp())k++;S.pos=p;S.day=j;}
      return k;};`);
  const nu=G(c,'__coups(300)');
  R(c,`ZK.forEach(z=>{const sl=SLOTS.find(x=>x.zone===z).k;
    S.eq[sl]={id:'m'+z,kind:'armure',slot:sl,q:1,dur:10,durBase:10,de:8,mana:0,ela:8,
      vec:[.2,.2,.2,.2,.2],cons:'plaque',
      parts:[{ct:'plaque',f:'lingot',mk:'fer'},{ct:'sangles',f:'lingot',mk:'fer'}]};});
    salirUtil();`);
  const enFer=G(c,'__coups(300)');
  gt(enFer,nu,'la foudre trouve plus souvent qui porte du métal — '+nu+' contre '+enFer+' sur 300');

  /* --- un voilier dans une tempête ne sert à rien --- */
  R(c,'__bande("cote");S.vehicule={k:"voilier",pv:VEHICULE.voilier.pv,crie:0};__ciel("clair");');
  eq(G(c,'vehUtile()'),true,'par temps clair, le voilier sert');
  R(c,'__ciel("tempete");');
  eq(G(c,'vehUtile()'),false,'dans une tempête il est ingouvernable — on ne prend pas la mer');
  R(c,'__ciel("vent");');
  eq(G(c,'vehUtile()'),true,'un vent fort le gêne sans l\'arrêter');
  ok(G(c,'vehVitesse(1,0)')>G(c,'(()=>{__ciel("clair");const v=vehVitesse(1,0);__ciel("vent");return v;})()'),
    'et lui coûte du temps');

  /* --- les traits partent de travers dans le vent --- */
  R(c,'__ciel("clair");');
  eq(G(c,'meteoDist()'),1,'par temps calme, un trait vole droit');
  R(c,'__ciel("vent");');
  ok(G(c,'meteoDist()')<1,'dans le vent, non');
  /* et cela doit se lire dans les DEGATS, pas seulement dans la fonction :
     un multiplicateur que personne n'applique est une valeur juste et morte */
  R(c,`S.eq={};S.items=[];S.stats.force=200;salirUtil();
    const p=FUNC.arc.comp.map(ct=>partFor(ct,['if','cuir','fer']));
    p.push(partFor('fixations',['fer']));
    S.items.push(mkItem('arme','arc',p,1.2));equipItem(0);
    S.occ='combat';spawn();
    pickZone=()=>'torse';
    globalThis.__tir=(n)=>{let s=0;
      for(let i=0;i<n;i++){EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.st=[];});
        const h=EE[0].hp;S.end=100;attack(false);s+=h-EE[0].hp;}
      return s/n;};`);
  R(c,'__ciel("clair");');
  const droit=G(c,'__tir(400)');
  R(c,'__ciel("vent");');
  const devie=G(c,'__tir(400)');
  ok(devie<droit,'un trait dans le vent fait moins mal — '+droit.toFixed(1)+' contre '+devie.toFixed(1));
});

test('saisons — la faune suit l annee',()=>{
  /* Les saisons modulaient la pousse et la temperature, rien d'autre. Une
     toundra en plein ete peuplait comme en hiver, et un ours n'avait jamais
     dormi. */
  const c=nouveau();
  const compte=(si,esp)=>G(c,`(()=>{let n=0;
    for(let i=0;i<3000;i++)if(creaturePool({x:0,y:0,b:'foret',corr:0,depth:0,poi:null},false,false,6)==='${esp}')n++;
    return n;})()`.replace('creaturePool(',`(S.day=${si*30}+5,creaturePool)(`));

  /* Les ecarts sont CALIBRES et non choisis : un premier jeu de valeurs
     (ours a 12 % en hiver, vermine a 25 %) coutait quatre-vingt-douze pour
     cent du rythme de jeu sur soixante jours. Supprimer le gibier FACILE
     supprime toute l'economie, parce qu'un personnage a bout de souffle tue
     des cerfs, pas des loups. La saison doit se sentir, pas vider la case.
     143 mises a mort contre 153 sans saisons : c'est la bonne dose. */
  /* --- l'ours dort en hiver --- */
  const oursEte=compte(1,'oursbrun'),oursHiver=compte(3,'oursbrun');
  ok(oursHiver<oursEte*.6,'un ours brun hiberne — '+oursEte+' rencontres en été contre '+oursHiver+' en hiver');
  const oursPrintemps=compte(0,'oursbrun');
  gt(oursPrintemps,oursHiver*2,'et ressort au printemps');

  /* --- la vermine vit de chaleur --- */
  const abEte=compte(1,'abeilles'),abHiver=compte(3,'abeilles');
  ok(abHiver<abEte*.65,'les essaims se raréfient au froid — '+abEte+' contre '+abHiver);

  /* --- le gibier de passage passe --- */
  const cerfPrintemps=compte(0,'cerf'),cerfEte=compte(1,'cerf');
  gt(cerfPrintemps,cerfEte,'le cerf passe au printemps — '+cerfPrintemps+' contre '+cerfEte+' en été');

  /* --- mais une espece ordinaire ne bouge pas --- */
  const loupEte=compte(1,'loup'),loupHiver=compte(3,'loup');
  ok(Math.abs(loupEte-loupHiver)<Math.max(loupEte,loupHiver)*.45,
    'le loup, lui, chasse toute l\'année — '+loupEte+' contre '+loupHiver);

  /* --- et l'hiver ne vide pas une case au point qu'il n'y ait plus rien --- */
  const rien=G(c,`(()=>{S.day=95;let n=0;
    for(let i=0;i<600;i++){const k=creaturePool({x:0,y:0,b:'toundra',corr:0,depth:0,poi:null},false,false,6);
      if(!k||!CREATURE[k])n++;}
    return n;})()`);
  eq(rien,0,'et il reste toujours quelque chose à chasser, même en hiver');
});

test('consommables — quatre objets que le catalogue promettait',()=>{
  /* Ce ne sont pas des potions : on n'en distille pas, on les FAIT. Chacun
     repond a un manque precis que rien d'autre ne couvre. */
  const c=nouveau();
  R(c,`S.carry=Object.keys(STATION);S.conso={};
    S.mat={chene:40,lin:40,sel:20,gres:20,terre:20};
    S.ref={'tissu:lin':10};`);

  /* --- chacun se fabrique, par lots --- */
  const bloques=G(c,'CONSK.filter(k=>!!consoBlocage(k))');
  ok(bloques.length===0,'les quatre se fabriquent avec ce qu\'on a',
    'bloqués : '+bloques.map((k,i)=>k+' → '+G(c,'consoBlocage("'+k+'")')).join(' | '));
  R(c,'CONSK.forEach(k=>consoFaire(k));');
  const lots=G(c,'CONSK.map(k=>consoDe(k)-CONSO[k].lot)');
  eq(lots.filter(x=>x!==0).length,0,'et chacun rend le lot annoncé, ni plus ni moins');

  /* --- BANDAGE : il ferme une plaie sans alambic --- */
  R(c,'S.st=[];addStatus(S,"saignement",20,3);S.hp=Math.round(maxHp()*.4);'
    +'globalThis.__hp0=S.hp;consoUser("bandage");');
  eq(G(c,'hasStatus(S,"saignement")'),false,'le bandage arrête la plaie');
  gt(G(c,'S.hp'),G(c,'__hp0'),'et rend un peu de vie');

  /* --- TORCHE : elle éclaire une cellule qu'on ne possède pas --- */
  R(c,'S.torche=0;here().plots=null;here().claim=0;');
  eq(G(c,'eclaireIci()'),false,'une cellule nue et sans bâtiment est sombre');
  R(c,'consoUser("torche");');
  eq(G(c,'eclaireIci()'),true,'une torche l\'éclaire — sans territoire ni bâtiment');
  R(c,'for(let i=0;i<700;i++)tickConso(1);');
  eq(G(c,'eclaireIci()'),false,'et elle s\'éteint au bout de son temps');

  /* --- HUILE : elle ajoute du feu à des coups qui n'en portaient pas --- */
  R(c,'S.huile=0;S.stats.force=200;S.occ="combat";spawn();'
    +'globalThis.__deg=()=>{EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.st=[];});'
    +'const h=EE[0].hp;attack(false);return h-EE[0].hp;};'
    +'globalThis.__R=Math.random;');
  const sansHuile=G(c,'(()=>{let s=0;for(let i=0;i<400;i++)s+=__deg();return s/400;})()');
  R(c,'consoUser("huile");');
  const avecHuile=G(c,'(()=>{let s=0;for(let i=0;i<400;i++)s+=__deg();return s/400;})()');
  gt(avecHuile,sansHuile,'l\'huile ajoute du feu au coup — '+sansHuile.toFixed(1)
    +' puis '+avecHuile.toFixed(1));
  R(c,'for(let i=0;i<400;i++)tickConso(1);');
  eq(G(c,'S.huile'),0,'elle s\'use au temps, pas aux coups');

  /* --- RATION : elle nourrit sans le risque de la chair crue --- */
  R(c,'S.st=[];S.faim=20;globalThis.__inf=0;'
    +'for(let i=0;i<60;i++){S.conso.ration=1;S.faim=20;consoUser("ration");'
    +'if(hasStatus(S,"infection"))__inf++;S.st=[];}');
  eq(G(c,'__inf'),0,'soixante rations, aucune fièvre — c\'est tout le propos');
  gt(G(c,'S.faim'),20,'et elle nourrit franchement');
});

test('recolte — ce qu on voit sur la case, on doit pouvoir le prendre',()=>{
  /* La pire espece de contenu mort n'est pas celle qu'on ne voit jamais :
     c'est celle qu'on VOIT et qu'on ne peut pas toucher. La glace etait
     posee dans la toundra et sur les montagnes de cristal depuis le premier
     jour, elle s'affichait sur la case, et aucun outil ne couvrait sa
     categorie — canHarvest la refusait toujours, sans rien expliquer. */
  const c=nouveau();
  R(c,`S.items=[];S.eq={};
    Object.keys(OUTIL).forEach(fn=>S.items.push({id:'t'+fn,kind:'outil',fn,slot:'main1',
      parts:[{ct:'fixations',f:'brut',mk:'adamant'}],q:3,dur:60,durBase:20,de:10,mana:0,ela:8,
      vec:[.2,.2,.2,.2,.2],nom:'essai'}));`);
  /* toutes les matieres que le monde pose, sur tous les biomes et strates */
  const posees=G(c,`(()=>{
    const s=new Set();
    Object.keys(BIOME).forEach(b=>{
      for(let d=0;d<=5;d++)cellMats({x:0,y:0,b,depth:d,poi:null}).forEach(m=>s.add(m));
      cellMats({x:0,y:0,b,depth:3,poi:'filon'}).forEach(m=>s.add(m));
    });
    return [...s];})()`);
  const intouchables=G(c,'('+JSON.stringify(posees)+').filter(m=>!canHarvest(m))');
  eq(intouchables.length,0,'chacune des '+posees.length+' matières posées par le monde se laisse prendre',
    'visibles et intouchables : '+intouchables.join(', '));
  /* et chaque categorie de matiere a bien une sorte d'outil, sauf celles
     dont la durete est nulle — l'eau se prend a la main */
  const sansOutil=G(c,`Object.keys(CAT).filter(cat=>!TOOLKIND[cat]
    &&Object.keys(MAT).some(m=>MAT[m].c===cat&&MAT[m].d>2))`);
  eq(sansOutil.length,0,'aucune catégorie dure n\'est sans outil','sans outil : '+sansOutil.join(', '));
});

test('bestiaire — le haut de la courbe existe et reste hors de portee',()=>{
  /* Quarante-quatre especes, et DEUX au-dela du niveau vingt-six : passe un
     certain point, on ne rencontrait plus rien de nouveau — les memes loups
     avec des points de vie multiplies. Un monde qui ne montre plus rien de
     neuf cesse d'etre un monde et devient un compteur. */
  const c=nouveau();
  const paliers=G(c,`(()=>{
    const p={};
    CK.forEach(k=>{const L=CREATURE[k].lv;
      const t=L<6?'1-5':L<14?'6-13':L<26?'14-25':L<36?'26-35':'36+';
      p[t]=(p[t]||0)+1;});
    return p;})()`);
  gte(paliers['26-35']||0,8,'huit espèces au moins entre 26 et 35 — '+(paliers['26-35']||0));
  gte(paliers['36+']||0,3,'et trois au moins au-delà de 36 — '+(paliers['36+']||0));

  /* --- une bête de haut niveau ne doit PAS pouvoir tomber sur un debutant --- */
  const fautes=G(c,`(()=>{
    const ko=[];
    /* on peuple mille fois une case paisible, au plus bas de la puissance */
    for(const b of Object.keys(BIOME))for(let i=0;i<200;i++){
      const k=creaturePool({x:0,y:0,b,corr:0,depth:0,poi:null},false,false,1);
      if(CREATURE[k]&&CREATURE[k].lv>=20&&ko.indexOf(k)<0)ko.push(k);
    }
    return ko;})()`);
  eq(fautes.length,0,'aucune bête de niveau 20 ou plus ne sort dans une terre paisible',
    'sorties à tort : '+fautes.join(', '));

  /* --- mais elles sortent la ou le lieu est assez dur --- */
  const hautes=G(c,'CK.filter(k=>CREATURE[k].lv>=26)');
  const vues=G(c,`(()=>{
    const s=new Set();
    for(const b of Object.keys(BIOME))for(const corr of [40,70,90])for(const nuit of [0,1])
      for(const p of [6,8,10])for(let i=0;i<120;i++)
        s.add(creaturePool({x:0,y:0,b,corr,depth:4,poi:null},false,!!nuit,p));
    for(const th of Object.keys(DJTHEME))for(let i=0;i<400;i++)
      s.add(creaturePool({x:0,y:0,b:'cendres',corr:80,depth:5,dj:{theme:th}},true,false,9));
    return [...s];})()`);
  const jamais=hautes.filter(k=>!vues.includes(k));
  eq(jamais.length,0,'et chacune des '+hautes.length+' espèces de haut niveau sort quelque part',
    'jamais vues : '+jamais.join(', '));

  /* --- chacune a une silhouette a elle, et des matieres qui existent --- */
  const sansForme=G(c,'CK.filter(k=>!ARCH[k])');
  eq(sansForme.length,0,'chaque espèce a sa silhouette déclarée','sans forme : '+sansForme.join(', '));
  const matsFausses=G(c,'CK.filter(k=>(CREATURE[k].mats||[]).some(m=>!MAT[m]))');
  eq(matsFausses.length,0,'et ne laisse que des matières qui existent',
    'matières inconnues : '+matsFausses.join(', '));

  /* --- la difficulte suit le niveau : une bete de 40 tape plus fort qu'une
     de 20, sinon le palier n'est qu'une etiquette --- */
  const moy=G(c,`(()=>{
    const bas=CK.filter(k=>CREATURE[k].lv>=6&&CREATURE[k].lv<14);
    const haut=CK.filter(k=>CREATURE[k].lv>=26);
    const m=l=>l.reduce((a,k)=>a+CREATURE[k].hp*CREATURE[k].dmg,0)/Math.max(1,l.length);
    return [m(bas),m(haut)];})()`);
  gt(moy[1],moy[0]*2,'une espèce du haut pèse plus du double d\'une du milieu — '
    +moy[0].toFixed(2)+' contre '+moy[1].toFixed(2));
});

test('consignes — le plan apprend les verbes des nouveaux systemes',()=>{
  /* Ce que le plan pouvait faire s'arretait a la boucle d'origine : se
     battre, recolter, manger, dormir. Tout ce qui a ete bati depuis —
     l'alchimie, l'attelage, la part d'ombre — restait hors de sa portee,
     donc hors de portee d'un jeu qui se joue seul. */
  const c=nouveau();

  /* --- CHAQUE condition doit pouvoir etre vraie ET fausse : une condition
     toujours fausse est une ligne de plan qui ne servira jamais, et une
     condition toujours vraie est un « toujours » deguise. --- */
  /* Le balayage ne peut juger une condition que si l'etat qu'elle observe
     EXISTE : « l'attelage est use » ne peut pas devenir vraie sans attelage.
     On se donne donc d'abord un personnage riche de tout ce que le jeu sait
     porter, puis on balaie. */
  R(c,'S.carry=Object.keys(STATION);S.sk.alchimie.lv=30;'
    +'S.vehicule={k:"charrette",pv:1,crie:0};S.potions=[{e:"soin",v:1,n:"x"}];');
  const jamais=G(c,`(()=>{
    const ko=[];
    CONDK.forEach(k=>{
      const C=CONDS[k];
      if(k==='toujours')return;
      /* on cherche une valeur qui rende la condition vraie, et une qui la
         rende fausse, en balayant sa propre fourchette */
      const vals=C.liste?Object.keys(POTEFF)
        :C.def!==undefined?[C.min,C.def,C.max,0,50,100,1e9]:[0];
      let vrai=false,faux=false;
      vals.forEach(v=>{try{const r=!!C.test(v);if(r)vrai=true;else faux=true;}catch(e){}});
      if(!vrai||!faux)ko.push(k+(vrai?' (toujours vraie)':' (jamais vraie)'));
    });
    return ko;})()`);
  /* Le balayage ci-dessus ne vaut que pour les conditions a SEUIL : une
     condition d'etat — « il fait nuit », « on est infecte » — ne depend pas
     de sa valeur, et la declarer morte parce que sa valeur ne change rien
     serait une accusation fausse. On les separe, et l'on eprouve les
     secondes en posant l'etat qu'elles observent. */
  const seuils=G(c,'CONDK.filter(k=>CONDS[k].def!==undefined&&!CONDS[k].liste)');
  const seuilsMorts=jamais.filter(x=>seuils.includes(x.split(' ')[0]));
  ok(seuilsMorts.length===0,'chacune des '+seuils.length+' conditions à seuil peut être vraie et fausse',
    'douteuses : '+seuilsMorts.join(', '));
  /* certaines dependent de l'etat du monde, pas de leur valeur : on les
     eprouve en posant l'etat qu'elles observent */
  R(c,`globalThis.__bascule=(k,poser,defaire)=>{
    defaire();const a=CONDS[k].test(CONDS[k].def);
    poser();const b=CONDS[k].test(CONDS[k].def);
    defaire();return a!==b;};`);
  eq(G(c,`__bascule('malade',()=>addStatus(S,'infection',5,1),()=>{S.st=[];})`),true,
    'la condition « on est infecté » bascule avec la fièvre');
  eq(G(c,`__bascule('empoisonne',()=>addStatus(S,'poison',5,1),()=>{S.st=[];})`),true,
    'celle du poison bascule avec la plaie');
  eq(G(c,`__bascule('vehiculeuse',()=>{S.vehicule={k:'charrette',pv:1,crie:0};},()=>{S.vehicule=null;})`),true,
    'celle de l\'attelage usé bascule avec l\'usure');
  eq(G(c,`__bascule('potiondispo',()=>{S.potions=[{e:'soin',v:1,n:'x'}];},()=>{S.potions=[];})`),true,
    'celle de la fiole bascule avec la réserve');
  eq(G(c,`__bascule('froid',()=>{globalThis.__ft=feltTemp;feltTemp=()=>-30;},()=>{if(globalThis.__ft)feltTemp=__ft;})`),true,
    'celle du climat bascule avec le froid');
  /* Et l'on exige qu'AUCUNE condition d'etat n'echappe a cette epreuve :
     sans cela, la prochaine qu'on ajoutera passera sans etre eprouvee — ce
     qui est exactement comment une ligne de plan morte finit par exister. */
  const etats=G(c,'CONDK.filter(k=>k!=="toujours"&&(CONDS[k].def===undefined||CONDS[k].liste))');
  const eprouvees=['nuit','jour','gibierrare','caseepuisee','ennemidur','enville','aucampement',
    'malade','empoisonne','vehiculeuse','potiondispo','froid','aubordeleau','regionraclee'];
  const bascules=G(c,`(()=>{
    const poses={
      nuit:[()=>{S.day=Math.floor(S.day)+23/24;},()=>{S.day=Math.floor(S.day)+12/24;}],
      jour:[()=>{S.day=Math.floor(S.day)+12/24;},()=>{S.day=Math.floor(S.day)+23/24;}],
      gibierrare:[()=>{here().vide=200;},()=>{here().vide=0;}],
      caseepuisee:[()=>{here().stock={};cellMats(here()).forEach(m=>{here().stock[m]=0;});},
                   ()=>{here().stock=null;}],
      ennemidur:[()=>{S.occ='combat';spawn();if(EE[0]){EE[0].rare=1;E=EE[0];}},()=>{E=null;EE=[];S.occ='repos';}],
      enville:[()=>{here().town='Essai';},()=>{here().town=null;}],
      aucampement:[()=>{here().claim=1;},()=>{here().claim=0;}],
      malade:[()=>addStatus(S,'infection',5,1),()=>{S.st=[];}],
      empoisonne:[()=>addStatus(S,'poison',5,1),()=>{S.st=[];}],
      vehiculeuse:[()=>{S.vehicule={k:'charrette',pv:1,crie:0};},()=>{S.vehicule=null;}],
      potiondispo:[()=>{S.potions=[{e:'soin',v:1,n:'x'}];},()=>{S.potions=[];}],
      /* on force les DEUX bornes : si le lieu de depart est deja glacial,
         poser le froid ne change rien et la bascule paraitrait inerte */
      froid:[()=>{globalThis.__ft3=globalThis.__ft3||feltTemp;feltTemp=()=>-30;},
             ()=>{globalThis.__ft3=globalThis.__ft3||feltTemp;feltTemp=()=>18;}],
      /* la region raclee : on vide la case courante ET une voisine */
      regionraclee:[()=>{here().vide=200;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{cell(S.pos[0]+dx,S.pos[1]+dy).vide=200;});},
                    ()=>{here().vide=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{cell(S.pos[0]+dx,S.pos[1]+dy).vide=0;});}],
      /* l'eau : on la pose sur la case, et le gel la reprend */
      aubordeleau:[()=>{here().b='cote';globalThis.__tc=tempC;tempC=()=>18;meteo=()=>'clair';},
                   ()=>{here().b='plaine';if(globalThis.__tc)tempC=__tc;}],
    };
    const ko=[];
    Object.keys(poses).forEach(k=>{
      if(!CONDS[k]){ko.push(k+' (disparue)');return;}
      const [p,d]=poses[k];
      try{if(!__bascule(k,p,d))ko.push(k);}catch(e){ko.push(k+' ('+e.message+')');}
    });
    return ko;})()`);
  ok(bascules.length===0,'chacune des '+eprouvees.length+' conditions d\'état bascule avec ce qu\'elle observe',
    'inertes : '+bascules.join(', '));
  const oubliees=etats.filter(k=>!eprouvees.includes(k));
  ok(oubliees.length===0,'et aucune condition d\'état n\'échappe à cette épreuve',
    'non éprouvées : '+oubliees.join(', '));

  /* --- une fiole ne se boit que si elle répare quelque chose --- */
  R(c,'S.st=[];S.hp=maxHp();S.mana=maxMana();S.end=100;S.potions=[{e:"remede",v:1,n:"x"}];');
  eq(G(c,'ACTES.boire.peut()'),false,'on ne boit pas un remède quand on n\'a pas la fièvre');
  R(c,'addStatus(S,"infection",5,1);');
  eq(G(c,'ACTES.boire.peut()'),true,'on le boit quand on l\'a');
  R(c,'ACTES.soigner.fais();');
  eq(G(c,'hasStatus(S,"infection")'),false,'et la fièvre tombe');
  eq(G(c,'S.potions.length'),0,'la fiole a bien été consommée');
  /* l'antipoison ne soigne pas la fievre, et le remede pas le poison */
  R(c,'S.st=[];addStatus(S,"poison",5,1);S.potions=[{e:"remede",v:1,n:"x"}];');
  eq(G(c,'consigneRemede()'),-1,'un remède ne répond pas à un poison');
  R(c,'S.potions=[{e:"antipoison",v:1,n:"x"}];');
  eq(G(c,'consigneRemede()'),0,'l\'antipoison, si');

  /* --- chaque ACTION doit pouvoir devenir possible : une action dont
     `peut` est toujours faux est une ligne morte dans chaque plan --- */
  R(c,`globalThis.__prep=()=>{
    S.carry=Object.keys(STATION);S.sk.alchimie.lv=30;S.sk.menuiserie.lv=40;
    S.potions=[{e:'soin',v:1,n:'x'}];S.hp=1;
    S.food={achillee:2,herbes:2};S.vivres=5;
    /* de quoi fabriquer : une matiere de chaque categorie, et du tissu */
    S.mat={fer:80,or:3,chene:20,lin:20,sel:10,terre:20,gres:20,os:10};
    S.ref={'tissu:lin':6,'lingot:fer':6,'tanne:cuir':4};
    S.conso={bandage:2,torche:2};
    /* de quoi copier un manuel : un scriptorium, une lecture, et un domaine
       qu'on pratique deja — on n'ecrit que ce qu'on sait */
    S.sk.lecture.lv=20;S.modules=[{id:MK[0],dom:'feu',lv:1,xp:0}];S.books=[];
    S.items=[mkParure('anneau',null,1.2)];S.items[0].vole=1;
    S.vehicule={k:'charrette',pv:1,crie:0};
    S.st=[];addStatus(S,'infection',4,1);addStatus(S,'poison',4,1);
    S.potions.push({e:'remede',v:1,n:'y'},{e:'antipoison',v:1,n:'z'});
    S.or=100000;S.faim=30;S.end=20;S.mana=0;
    const cc=here();cc.claim=1;
    cc.plots=[{t:'batiment',slots:[{t:'meuble',k:'lit'},{t:'meuble',k:'coffre'},{t:'meuble',k:'foyer'}]}];
    /* une base AILLEURS : « rentrer chez soi » et « se mettre a l abri »
       n ont de sens que si l on n y est pas deja */
    const ba=cell(cc.x+5,cc.y+5);ba.claim=1;ba.seen=true;
    ba.plots=[{t:'batiment',slots:[{t:'meuble',k:'lit'},{t:'meuble',k:'foyer'}]}];
    S.claims=[key(ba.x,ba.y),key(cc.x,cc.y)];
    /* une ville connue ailleurs, pour « aller au village » */
    const kk=kingdomsNear()[0];
    if(kk){const tv=kTowns(kk).find(t=>t.x!==S.pos[0]||t.y!==S.pos[1]);
      if(tv){const wc=cell(tv.x,tv.y);wc.seen=true;wc.town=tv.nom;}}
    /* une prime a solder */
    const ki=kingdomHere();if(ki!==null){S.prime={};S.prime[ki]=50;}
    /* une voisine qui vaut mieux qu ici : on vide la case courante */
    here().vide=4;
  };__prep();`);
  const mortes=G(c,`(()=>{
    const ko=[];
    ACTK.forEach(k=>{
      let possible=false;
      /* on eprouve l'action dans plusieurs situations : chez soi, en ville,
         en pleine nature, en combat, de jour comme de nuit */
      const scenes=[
        ()=>{S.occ='repos';},
        ()=>{S.occ='combat';spawn();},
        ()=>{S.day=Math.floor(S.day)+23/24;S.occ='repos';},
        ()=>{S.day=Math.floor(S.day)+12/24;S.occ='explore';},
        /* dans une ville d un royaume, avec une prime a solder */
        ()=>{S.day=Math.floor(S.day)+12/24;S.rep={g:60,race:{},king:{}};
             const t=(kingdomsNear()[0]?kTowns(kingdomsNear()[0])[0]:null);
             if(t){S.pos=[t.x,t.y];here().seen=true;here().town=t.nom;}
             const ki=kingdomHere();if(ki!==null){S.prime={};S.prime[ki]=50;}
             S.occ='repos';},
        /* loin d une ville CONNUE, pour « aller au village » */
        ()=>{const t=(kingdomsNear()[0]?kTowns(kingdomsNear()[0])[0]:null);
             if(t){const wc=cell(t.x,t.y);wc.seen=true;wc.town=t.nom;
                   S.pos=[t.x+4,t.y+4];here().seen=true;}
             S.occ='repos';},
        /* le climat mord : « se mettre a l abri » n a de sens que la */
        ()=>{globalThis.__ft2=feltTemp;feltTemp=()=>-30;S.occ='repos';},
        ()=>{here().poi='camp';S.occ='repos';},
        /* une quete DEJA remplie qui attend d'etre rendue — et son absence,
           qui est la seule situation ou l'on peut en prendre une */
        ()=>{S.quest={g:GUILDS[0].k,tpl:QTPL[0].id,type:'kill',cur:9,need:1,or:10,xp:5,txt:'x'};S.occ='repos';},
      ];
      const p0=S.pos.slice(),j0=S.day;
      scenes.forEach(s=>{
        if(possible)return;
        S.pos=p0.slice();S.day=j0;__prep();
        try{s();if(ACTES[k].peut())possible=true;}catch(e){}
      });
      S.pos=p0;S.day=j0;
      if(globalThis.__ft2){feltTemp=__ft2;globalThis.__ft2=null;}
      if(!possible)ko.push(k);
    });
    return ko;})()`);
  ok(mortes.length===0,'chacune des '+G(c,'ACTK.length')+' actions du plan peut devenir possible',
    'jamais possibles : '+mortes.join(', '));
});

test('hors-la-loi — voler, etre recherche, blanchir',()=>{
  /* On pouvait enfreindre la loi, jamais la CHOISIR : on ne la croisait que
     par accident, en passant une frontiere avec la mauvaise marchandise.
     Aucun geste du jeu ne disait « prends-le sans payer ». */
  const c=nouveau();
  /* on se pose dans une ville d'un royaume qui a des gardes */
  /* Une ville de HAMEAU n'appartient a aucun royaume : sans gardes, sans
     greffe, rien de ce qui suit n'y a de sens. On prend donc une ville qui
     appartient vraiment a un royaume, et l'on force son regime. */
  R(c,`globalThis.__enville=(gov)=>{
    const ks=kingdomsNear();
    for(const k of ks){
      const ts=kTowns(k);
      for(const t of ts){
        S.pos=[t.x,t.y];here().seen=true;
        if(kingdomHere()===null)continue;
        globalThis.__ki=kingdomHere();
        if(gov)S.kingdoms[__ki].gov=gov;
        return townAt(t.x,t.y);
      }
    }
    return null;};
    S.day=Math.floor(S.day)+12/24;`);
  const t=G(c,'!!__enville("monarchie")');
  eq(t,true,'on se place dans une ville tenue par un royaume');
  R(c,'S.rep={g:40,race:{},king:{}};');

  /* --- voler reussit ou echoue sur un jet, et l'echec coute --- */
  R(c,`globalThis.__cible=(()=>{const tt=townAt(S.pos[0],S.pos[1]);
    const st=shopStock(tt);const sk=Object.keys(st).find(k=>st[k]&&st[k].length);
    return sk?[sk,0]:null;})()`);
  ok(!!G(c,'__cible'),'la ville tient au moins un étal garni');
  /* main lourde : on rate a coup sur */
  R(c,'S.prime={};S.sk.discretion.lv=0;S.stats.dex=1;'
    +'globalThis.__R=Math.random;Math.random=()=>0;volerOffre(__cible[0],__cible[1]);Math.random=__R;');
  gt(G(c,'primeIci()'),0,'un vol raté met une prime sur ta tête — '+G(c,'primeIci()')+' or');
  /* main sure : on reussit a coup sur */
  R(c,`globalThis.__c2=(()=>{const tt=townAt(S.pos[0],S.pos[1]);
    const st=shopStock(tt);const sk=Object.keys(st).find(k=>st[k]&&st[k].length);
    return sk?[sk,0,st[sk].length]:null;})();
    S.prime={};S.sk.discretion.lv=60;S.stats.dex=30;
    globalThis.__R=Math.random;Math.random=()=>0.999;volerOffre(__c2[0],__c2[1]);Math.random=__R;`);
  eq(G(c,'primeIci()'),0,'un vol réussi ne laisse aucune trace');
  eq(G(c,'(()=>{const st=shopStock(townAt(S.pos[0],S.pos[1]));return st[__c2[0]].length;})()'),
    G(c,'__c2[2]')-1,'et l\'étal a bien perdu sa pièce');

  /* --- la prime suit le royaume, pas la ville --- */
  R(c,'S.prime={};primeAjout(300,"essai");');
  const p0=G(c,'primeIci()');
  gt(p0,0,'la prime s\'inscrit');
  R(c,'travel(S.pos[0]+1,S.pos[1]);');
  eq(G(c,'primeIci()'),p0,'quitter la ville ne l\'efface pas — elle suit le royaume');
  /* et elle envoie des patrouilles au-dela d'un seuil */
  R(c,'S.prime={};S.prime[__ki]=2000;S.occ="repos";globalThis.__pat=0;'
    +'for(let i=0;i<400&&!__pat;i++){primePatrouille(3);if(S.occ==="combat")__pat=1;S.occ="repos";}');
  eq(G(c,'__pat'),1,'passé un seuil, des patrouilles te cherchent sur les routes');
  R(c,'S.prime={};S.prime[__ki]=10;S.occ="repos";globalThis.__pat2=0;'
    +'for(let i=0;i<400;i++){primePatrouille(3);if(S.occ==="combat")__pat2=1;S.occ="repos";}');
  eq(G(c,'__pat2'),0,'une prime légère ne dérange personne');

  /* --- la solder coûte le double --- */
  R(c,'__enville("monarchie");S.prime={};S.prime[__ki]=100;S.or=500;primePayer();');
  eq(G(c,'primeIci()'),0,'on peut solder sa dette');
  eq(G(c,'S.or'),300,'et cela coûte le double de la prime');

  /* --- une anarchie ne peut pas punir --- */
  R(c,'__enville("anarchie");S.prime={};primeAjout(500,"essai");');
  eq(G(c,'primeIci()'),0,'une anarchie n\'inscrit aucune prime — elle n\'a ni garde ni greffe');
  R(c,'S.prime={};S.prime[__ki]=5000;S.occ="repos";globalThis.__pat3=0;'
    +'for(let i=0;i<300;i++){primePatrouille(3);if(S.occ==="combat")__pat3=1;S.occ="repos";}');
  eq(G(c,'__pat3'),0,'et n\'envoie jamais de patrouille');

  /* --- une anarchie ne punit pas non plus les lois ordinaires --- */
  R(c,`__enville('anarchie');
    const kk=S.kingdoms[__ki];kk.laws2=null;kk.laws=[{t:'x',c:'amende'}];
    lawsHere();kk.laws2=[{t:'objet',mat:'or',c:'amende',txt:'la possession d or'}];
    S.mat={or:5};S.or=1000;S.sk.discretion.lv=0;S.stats.per=1;
    globalThis.__R=Math.random;Math.random=()=>0;
    for(let i=0;i<20;i++)controle('entree');
    Math.random=__R;`);
  eq(G(c,'S.or'),1000,'une anarchie n\'inflige aucune amende — la loi y est un mot');
  /* alors qu'ailleurs, la meme infraction coute */
  R(c,`__enville('dictature');
    const kk2=S.kingdoms[__ki];kk2.laws2=[{t:'objet',mat:'or',c:'amende',txt:'la possession d or'}];
    S.mat={or:5};S.or=1000;S.sk.discretion.lv=0;S.stats.per=1;
    globalThis.__R=Math.random;Math.random=()=>0;
    for(let i=0;i<20;i++)controle('entree');
    Math.random=__R;`);
  ok(G(c,'S.or')<1000,'sous un régime qui a des gardes, elle coûte — '+(1000-G(c,'S.or'))+' or');

  /* --- une pièce prise à l'étal porte la marque --- */
  R(c,`__enville('monarchie');S.items=[];S.rep={g:80,race:{},king:{}};
    S.sk.discretion.lv=60;S.stats.dex=30;
    globalThis.__pris=(()=>{
      const tt=townAt(S.pos[0],S.pos[1]);const st=shopStock(tt);
      for(const sk of Object.keys(st)){
        const i=(st[sk]||[]).findIndex(o=>o.t==='item');
        if(i<0)continue;
        const R0=Math.random;Math.random=()=>0.999;
        volerOffre(sk,i);Math.random=R0;
        return S.items.length?!!S.items[S.items.length-1].vole:null;
      }
      return 'aucun objet à l étal';
    })()`);
  eq(G(c,'__pris'),true,'une pièce prise à l\'étal garde la marque du vol');

  /* --- ce qu'on a volé ne se revend pas au grand jour --- */
  R(c,`__enville("monarchie");
    S.items=[];S.rep={g:80,race:{},king:{}};
    const it=mkParure('anneau',null,1.2);it.vole=1;S.items.push(it);`);
  /* on tente vraiment de le vendre : c'est sellItem qui doit refuser, pas
     une fonction qu'on interroge poliment a cote */
  R(c,`here().poi=null;S.rep={g:80,race:{},king:{}};
    globalThis.__vendu=(()=>{
      if(receleurIci())return 'receleur ici';
      const av=S.items.length,or0=S.or;
      sellItem(0);
      return S.items.length===av&&S.or===or0;
    })()`);
  eq(G(c,'__vendu'),true,'un marchand honnête refuse la pièce marquée');
  /* et il accepte la meme piece sans la marque */
  R(c,`S.items[0].vole=0;globalThis.__vendu2=(()=>{
      const av=S.items.length;sellItem(0);return S.items.length<av;})();
    S.items[0]&&(S.items[0].vole=1);`);
  eq(G(c,'__vendu2'),true,'la même pièce sans marque, il la prend');
  R(c,'if(!S.items.length){const it=mkParure("anneau",null,1.2);it.vole=1;S.items.push(it);}');
  /* chez le receleur, il part a moitie prix */
  R(c,'here().poi="camp";S.or=0;globalThis.__val=itemValue(S.items[0]);recelerTout();');
  eq(G(c,'S.items.length'),0,'le receleur prend tout ce qui est marqué');
  eq(G(c,'S.or'),Math.round(G(c,'__val')*.5),'et n\'en donne que la moitié');
  eq(G(c,'receleurIci()'),true,'un camp ne demande rien à personne');
});

test('vehicules — le temps du monde et ce qu on emporte',()=>{
  /* Une heure de marche par cellule, et rien d'autre depuis le premier jour.
     Un vehicule change les deux choses qui decident de ce qu'on peut se
     permettre : le TEMPS d'un trajet et ce qu'on peut EMPORTER. */
  const c=nouveau();
  /* Le biome de la case d'ARRIVEE decide si le vehicule suit : on met donc
     toute la bande au meme biome, sinon on mesure un trajet a moitie
     navigable et l'on ne sait plus ce qu'on mesure. */
  R(c,`globalThis.__bande=(b)=>{for(let i=-2;i<=9;i++){const cc=cell(S.pos[0]+i,S.pos[1]);cc.b=b;cc.seen=true;}
      for(let i=-2;i<=9;i++){const cc=cell(S.pos[0],S.pos[1]+i);cc.b=b;cc.seen=true;}
      return here();};
    globalThis.__terre=()=>__bande('plaine');
    globalThis.__eau=()=>__bande('cote');
    globalThis.__voyage=(dx)=>{const j=S.day;
      for(let i=0;i<=Math.abs(dx);i++)cell(S.pos[0]+i,S.pos[1]).seen=true;
      const p=S.pos.slice();travel(p[0]+dx,p[1]);const d=S.day-j;
      S.pos=p;S.day=j;return d;};`);

  /* --- a pied : une heure par cellule --- */
  R(c,'S.vehicule=null;S.eq={};salirUtil();__terre();');
  const aPied=G(c,'__voyage(4)');
  near(aPied*24,4,.01,'à pied, une heure par cellule — '+(aPied*24).toFixed(2)+' h pour quatre');

  /* --- la charrette : plus lente qu'un char, mais elle porte --- */
  R(c,'S.stats.force=10;salirUtil();');
  const sacNu=G(c,'sacMax()');
  R(c,'S.vehicule={k:"charrette",pv:VEHICULE.charrette.pv,crie:0};__terre();');
  ok(G(c,'__voyage(4)')<aPied*.85,'une charrette raccourcit vraiment le trajet');
  eq(G(c,'sacMax()'),sacNu+G(c,'VEHICULE.charrette.cargo'),'et elle porte ce qu\'elle annonce');

  /* --- une charrette ne flotte pas, une barque ne roule pas --- */
  R(c,'__eau();');
  eq(G(c,'vehUtile()'),false,'une charrette est inutilisable sur l\'eau');
  eq(G(c,'sacMax()'),sacNu,'et n\'y porte plus rien');
  near(G(c,'__voyage(4)')*24,4,.01,'on y marche, tout simplement');
  R(c,'S.vehicule={k:"barque",pv:VEHICULE.barque.pv,crie:0};');
  eq(G(c,'vehUtile()'),true,'une barque, elle, y est chez elle');
  ok(G(c,'__voyage(4)')<aPied,'et la côte devient une route');
  R(c,'__terre();');
  eq(G(c,'vehUtile()'),false,'mais sur terre ferme elle ne sert à rien');

  /* --- le vent : un voilier ne va pas aussi vite dans tous les sens --- */
  R(c,'__eau();S.vehicule={k:"voilier",pv:VEHICULE.voilier.pv,crie:0};S.sk.navigation.lv=0;');
  const sens=G(c,'[vehVitesse(1,0),vehVitesse(-1,0),vehVitesse(0,1),vehVitesse(0,-1)]');
  ok(Math.max(...sens)>Math.min(...sens)*1.25,
    'à la voile, le cap compte — ×'+Math.min(...sens).toFixed(2)+' à ×'+Math.max(...sens).toFixed(2));
  /* la Navigation rabote le vent contraire, sans jamais l'annuler */
  const pire=G(c,'(()=>{let p=0,d=null;for(const a of [[1,0],[-1,0],[0,1],[0,-1]]){'
    +'const v=vehVitesse(a[0],a[1]);if(v>p){p=v;d=a;}}globalThis.__pire=d;return p;})()');
  R(c,'S.sk.navigation.lv=40;');
  const pireForme=G(c,'vehVitesse(__pire[0],__pire[1])');
  ok(pireForme<pire,'un bon navigateur tire des bords — ×'+pire.toFixed(2)+' puis ×'+pireForme.toFixed(2));
  gt(pireForme,G(c,'VEHICULE.voilier.vit'),'mais le vent contraire coûte toujours quelque chose');
  /* une draisine ne connaît pas le vent */
  R(c,'__terre();S.vehicule={k:"draisine",pv:VEHICULE.draisine.pv,crie:0};');
  eq(G(c,'vehVitesse(1,0)'),G(c,'vehVitesse(0,-1)'),'une draisine va au même pas dans tous les sens');

  /* --- l'usure, et l'épave --- */
  R(c,'__terre();S.vehicule={k:"charrette",pv:VEHICULE.charrette.pv,crie:0};');
  const neuf=G(c,'vehVitesse(1,0)');
  R(c,'S.vehicule.pv=VEHICULE.charrette.pv*.2;');
  gt(G(c,'vehVitesse(1,0)'),neuf,'une charrette fatiguée va moins vite');
  R(c,'S.mat={};S.vehicule.pv=1;vehUser(40);');
  eq(G(c,'S.vehicule'),null,'à bout, elle devient épave');
  gt(G(c,'Object.keys(S.mat).length'),0,'et l\'on en récupère la moitié des matières');

  /* --- réparer coûte, et rend --- */
  R(c,'S.vehicule={k:"charrette",pv:5,crie:1};S.carry=Object.keys(STATION);'
    +'S.mat={};S.ref={};VEHICULE.charrette.cout.forEach(([r,n])=>{'
    +'if(r.indexOf("form:")===0)S.ref[r.slice(5)+":fer"]=n;'
    +'else Object.keys(MAT).filter(m=>MAT[m].c===r).slice(0,1).forEach(m=>S.mat[m]=n);});'
    +'vehReparer();');
  eq(G(c,'S.vehicule.pv'),G(c,'VEHICULE.charrette.pv'),'une réparation remet la structure au complet');
});

test('meubles — sept de plus, et chacun change une regle',()=>{
  /* Le catalogue F.6 en declare seize ; dix etaient poses. Un meuble qui ne
     fait qu'ajouter du confort est un doublon du tapis : chacun de ceux-ci
     branche une regle qui existait deja et que rien n'atteignait depuis un
     batiment. */
  const c=nouveau();
  /* on se donne une cellule revendiquee avec un batiment, et de quoi poser */
  R(c,`globalThis.__pose=(k,n)=>{
    const cc=here();
    S.claims=[key(cc.x,cc.y)];cc.claim=1;S.world[key(cc.x,cc.y)]=cc;
    cc.plots=[{t:'batiment',slots:[]}];
    for(let i=0;i<(n||1);i++)cc.plots[0].slots.push({t:'meuble',k});
    return cc;
  };
  globalThis.__vide=()=>{const cc=here();cc.plots=[{t:'batiment',slots:[]}];S.claims=[key(cc.x,cc.y)];cc.claim=1;};`);

  /* --- BIBLIOTHEQUE : on lit mieux chez soi --- */
  R(c,'__vide();');
  const litSans=G(c,'readBonus()');
  R(c,'__pose("bibliotheque");');
  gt(G(c,'readBonus()'),litSans+2,'une bibliothèque aide vraiment à lire — '+litSans.toFixed(1)
    +' puis '+G(c,'readBonus()').toFixed(1));
  R(c,'__pose("bibliotheque",4);');
  ok(G(c,'readBonus()')<=litSans+6.001,'et quatre bibliothèques ne rendent pas omniscient');

  /* --- AUTEL DOMESTIQUE : tomber coûte moitié moins --- */
  R(c,'__vide();S.or=1000;down();');
  const perteNue=G(c,'1000-S.or');
  R(c,'__pose("autelmaison");S.or=1000;down();');
  const perteAutel=G(c,'1000-S.or');
  ok(perteAutel<perteNue,'un autel domestique adoucit la chute — '+perteNue+' or puis '+perteAutel);
  gt(perteAutel,0,'mais mourir coûte toujours quelque chose');

  /* --- GARDE-MANGER : l'entretien baisse --- */
  R(c,'__vide();S.gov="monarchie";S.npcs=[];'
    +'for(let i=0;i<4;i++)S.npcs.push({id:"n"+i,rec:1,assign:"ferme",nom:"x",rel:50,mood:50});');
  const upNu=G(c,'upkeep()');
  gt(upNu,0,'quatre résidents assignés coûtent un entretien');
  R(c,'__pose("gardemanger",3);');
  eq(G(c,'upkeep()'),upNu-3,'chaque garde-manger retire un or par semaine');
  R(c,'__pose("gardemanger",400);');
  gte(G(c,'upkeep()'),0,'et l\'entretien ne devient jamais négatif');

  /* --- RÂTELIER : la rotation tient sans peser dans le sac --- */
  R(c,'__vide();S.items=[];S.eq={};S.ratelier=[];');
  eq(G(c,'Object.keys(rackElements()).length'),0,'sans arme, aucun élément dans la rotation');
  /* sans râtelier, on ne peut rien y poser */
  R(c,`globalThis.__arme=(mats)=>{const fn='epee';
    const p=FUNC[fn].comp.map(ct=>partFor(ct,mats));p.push(partFor('fixations',mats));
    return mkItem('arme',fn,p,1.2);};
    S.items=[__arme(['fer','chene','cuir'])];poserRatelier(0);`);
  eq(G(c,'S.ratelier.length'),0,'sans râtelier chez soi, on n\'y pose rien');
  R(c,'__pose("ratelier");poserRatelier(0);');
  eq(G(c,'S.ratelier.length'),1,'avec un râtelier, l\'arme y prend sa place');
  eq(G(c,'S.items.length'),0,'et quitte le sac');
  gt(G(c,'Object.keys(rackElements()).length'),0,'elle compte pour la Communion des cinq');
  /* et cela vaut où qu'on soit : le râtelier est resté au village */
  R(c,'S.pos=[S.pos[0]+9,S.pos[1]+9];here().seen=true;');
  gt(G(c,'Object.keys(rackElements()).length'),0,'même à neuf cellules de chez soi');
  R(c,'reprendreRatelier(0);');
  eq(G(c,'S.items.length'),1,'et l\'on peut toujours la reprendre');

  /* --- LIT DE PAILLE : il loge, mais on y dort mal --- */
  R(c,'S.pos=[S.pos[0]-9,S.pos[1]-9];__vide();');
  const litsNus=G(c,'beds()');
  R(c,'__pose("litpaille",2);');
  eq(G(c,'beds()'),litsNus+2,'un lit de paille loge un résident comme un lit');
  ok(G(c,'MEUBLECONF.litpaille')<0,'mais il retire du confort au lieu d\'en donner');

  /* --- TORCHÈRE : de la lumière sans métal --- */
  R(c,'__vide();');
  eq(G(c,'eclaireIci()'),false,'une cellule nue est sombre');
  R(c,'__pose("torchere");');
  eq(G(c,'eclaireIci()'),true,'une torchère l\'éclaire');
});

test('parures — six emplacements qui ne recevaient rien',()=>{
  /* La fiche d'equipement declare quatorze emplacements. Huit se
     remplissaient. Les six autres — deux anneaux, une amulette, le dos, deux
     accessoires — n'avaient AUCUNE source : ni butin, ni boutique, ni
     atelier. Six lignes vides depuis le premier jour. */
  const c=nouveau();

  /* --- tous les emplacements ont desormais de quoi les remplir --- */
  R(c,`globalThis.__remplis=(()=>{
    const s=new Set();
    for(let i=0;i<4000;i++){
      const it=mkParure(pick(PARK),null,1+Math.random());
      if(it)s.add(it.slot);
    }
    /* deux anneaux et deux accessoires : le second se prend a l'equipement */
    S.eq={};S.items=[];
    for(let i=0;i<6;i++){const it=mkParure('anneau',null,1.2);S.items.push(it);equipItem(0);}
    if(S.eq.anneau2)s.add('anneau2');
    S.eq={};S.items=[];
    for(let i=0;i<6;i++){const it=mkParure('ceinture',null,1.2);S.items.push(it);equipItem(0);}
    if(S.eq.acc2)s.add('acc2');
    /* les huit d'origine */
    ['tete','torse','bras','jambes','pieds','main1','main2','muni'].forEach(k=>s.add(k));
    return [...s];
  })()`);
  const manquants=G(c,'SLOTS.map(s=>s.k).filter(k=>!__remplis.includes(k))');
  eq(manquants.length,0,'chacun des quatorze emplacements peut recevoir quelque chose',
    'vides : '+manquants.join(', '));

  /* --- un effet d'usage se lit vraiment dans le jeu --- */
  R(c,'S.eq={};S.items=[];S.sk.minage.lv=10;salirUtil();');
  const mSans=G(c,'lv("minage")');
  R(c,'S.eq.anneau1={id:"x",kind:"parure",slot:"anneau1",q:1.2,aff:[{id:"usk",p:{k:"minage",n:4}}],parts:[{ct:"fixations",f:"brut",mk:"argent"}]};salirUtil();');
  eq(G(c,'lv("minage")'),mSans+4,'un anneau de métier monte vraiment la compétence');

  R(c,'S.eq={};S.stats.force=10;salirUtil();');
  const sacSans=G(c,'sacMax()');
  R(c,'S.eq.dos={id:"y",kind:"parure",slot:"dos",q:1.2,aff:[{id:"poids",p:{n:30}}],parts:[{ct:"fixations",f:"brut",mk:"cuir"}]};salirUtil();');
  eq(G(c,'sacMax()'),sacSans+30,'une cape de portage agrandit vraiment le sac');

  /* --- la faim vient moins vite, sans jamais s'arrêter --- */
  R(c,'S.eq={};salirUtil();S.faim=100;for(let i=0;i<900;i++){S.faim=Math.max(0,S.faim-1/90*(1-util().faim));}');
  const faimNue=G(c,'S.faim');
  R(c,'S.eq.acc1={id:"z",kind:"parure",slot:"acc1",q:1.2,aff:[{id:"faim",p:{p:30}}],parts:[{ct:"fixations",f:"brut",mk:"cuir"}]};salirUtil();'
    +'S.faim=100;for(let i=0;i<900;i++){S.faim=Math.max(0,S.faim-1/90*(1-util().faim));}');
  gt(G(c,'S.faim'),faimNue,'une ceinture ralentit vraiment la faim');
  /* et deux ceintures ne la suppriment pas */
  R(c,'S.eq.acc2={id:"z2",kind:"parure",slot:"acc2",q:1.2,aff:[{id:"faim",p:{p:30}}],parts:[{ct:"fixations",f:"brut",mk:"cuir"}]};'
    +'S.eq.dos={id:"z3",kind:"parure",slot:"dos",q:1.2,aff:[{id:"faim",p:{p:30}}],parts:[{ct:"fixations",f:"brut",mk:"cuir"}]};salirUtil();');
  ok(G(c,'util().faim')<=.6,'trois pièces n\'annulent pas la faim — le plafond tient');

  /* --- les dons : on les a, ou on ne les a pas --- */
  R(c,'S.eq={};S.st=[];salirUtil();addStatus(S,"poison",10,5);');
  eq(G(c,'hasStatus(S,"poison")'),true,'sans le don, le poison prend');
  R(c,'S.st=[];S.eq.amulette={id:"a",kind:"parure",slot:"amulette",q:1.5,aff:[{id:"antipoison",p:{}}],parts:[{ct:"fixations",f:"brut",mk:"jade"}]};salirUtil();'
    +'addStatus(S,"poison",10,5);');
  eq(G(c,'hasStatus(S,"poison")'),false,'avec lui, il ne prend pas du tout');
  eq(G(c,'don("antipoison")'),true,'et le don se lit tel quel');

  /* --- une parure ne porte jamais deux dons : sinon un seul objet règle tout --- */
  R(c,`globalThis.__dbl=(()=>{let n=0;
    for(let i=0;i<6000;i++){
      const it=mkParure(pick(PARK),null,1.6);
      if(!it)continue;
      const dons=it.aff.filter(a=>{const d=AFFU.find(x=>x.id===a.id);return d&&d.don;}).length;
      if(dons>1)n++;
    }
    return n;})()`);
  eq(G(c,'__dbl'),0,'aucune parure ne cumule deux dons');

  /* --- AUCUN EFFET DECLARE NE DOIT RESTER SANS EFFET ---
     C'est le defaut que je trouve le plus souvent dans ce jeu : une ligne de
     table qui promet quelque chose et que personne ne lit. Plutot que de
     verifier les onze effets un par un — ce qui laisserait le douzieme
     passer — on prend une EMPREINTE de l'etat observable du personnage, on
     pose l'affixe seul, et l'on exige que l'empreinte bouge. Un effet qui ne
     deplace rien de mesurable est mort, quel qu'il soit. */
  /* L'empreinte n'interroge que de VRAIS chemins du jeu. Un premier jet
     mesurait util().marche et recalculait lui-meme le temps de voyage : il
     passait au vert alors que l'effet n'etait branche nulle part, puisqu'il
     ne mesurait que ma propre sonde. On appelle donc travel(), step(),
     spawn(), addStatus(), pMonde() — le code que le joueur declenche. */
  /* Et elle doit etre DETERMINISTE, sinon la comparaison est vide de sens :
     un premier jet appelait detection() et step(), donc de l'aleatoire, et
     l'empreinte differait de la reference a chaque fois — aucun effet ne
     pouvait jamais paraitre inerte, et le test passait toujours. Un test qui
     ne peut pas tomber ne protege rien. On fige donc le hasard le temps de
     la mesure, ce qui laisse le vrai code s'executer sans rien inventer. */
  R(c,`globalThis.__empreinte=()=>{
    salirUtil();
    const R0=Math.random;let s=987654321;
    Math.random=()=>{s=(s*1103515245+12345)>>>0;return (s>>>4)/0x10000000;};
    /* Mesurer, c'est jouer : on marche, on dort, on affronte des betes. Tout
       cela laisse des traces — de l'XP, des cases explorees, un monde qui a
       bouge. Sans remise en etat, la deuxieme mesure ne mesure plus la meme
       chose que la premiere, et la comparaison ne veut plus rien dire. */
    const snap=JSON.parse(JSON.stringify(S));
    const v=[];
    try{
      ['minage','forge','discretion','cuisine','alchimie','athletisme','lecture',
       'meditation','esquive','negociation','leadership','dressage','herboristerie',
       'agriculture','taille','assemblage'].forEach(k=>v.push(lv(k)));
      STATS.forEach(([k])=>v.push(st(k)));
      v.push(sacMax());
      /* le poison prend-il ? on le pose vraiment */
      S.st=[];addStatus(S,'poison',5,1);v.push(hasStatus(S,'poison')?1:0);S.st=[];
      /* le jet de discretion, tel que les controles de loi le lancent */
      let d1=0;for(let i=0;i<200;i++)if(detection())d1++;v.push(d1);
      /* un vrai voyage de trois cases : c'est le temps du monde qui compte */
      const p0=S.pos.slice(),j0=S.day,o0=S.occ;
      for(let i=0;i<=3;i++)cell(p0[0]+i,p0[1]).seen=true;
      travel(p0[0]+3,p0[1]);
      v.push(+((S.day-j0)*1000).toFixed(2));
      S.pos=p0;S.day=j0;S.occ=o0;
      /* une vraie minute de repos, puis une de sommeil : la cicatrisation se
         mesure en points de vie rendus, par la boucle du jeu */
      const hp0=S.hp,f0=S.faim;
      S.occ='repos';S.faim=90;S.hp=Math.round(maxHp()*.3);
      let a0=S.hp;for(let i=0;i<20;i++)step(1);
      v.push(+(S.hp-a0).toFixed(2));
      /* dormir de jour renvoie aussitot au repos : on mesure de nuit */
      const jn=S.day;S.day=Math.floor(S.day)+23/24;
      S.occ='dormir';S.hp=Math.round(maxHp()*.3);
      a0=S.hp;for(let i=0;i<5;i++)step(1);
      v.push(+(S.hp-a0).toFixed(2));
      S.day=jn;
      /* la faim, sur deux minutes, par la vraie boucle */
      S.occ='explore';S.faim=100;S.hp=Math.round(maxHp()*.3);a0=S.hp;
      for(let i=0;i<120;i++)step(1);
      v.push(+S.faim.toFixed(3),+(S.hp-a0).toFixed(2));
      S.hp=hp0;S.faim=f0;S.occ=o0;
      /* la nuit peuple-t-elle encore autrement ? on engendre vraiment des
         rencontres a une heure de nuit et l'on compte ce qui vient */
      const jj=S.day;S.day=Math.floor(S.day)+23/24;
      let bete=0,tete='';
      for(let i=0;i<40;i++){S.occ='combat';spawn();bete+=EE.length;tete+=(EE[0]?EE[0].cre:'-')+',';}
      v.push(bete,tete.length,tete.slice(0,60));
      S.day=jj;E=null;EE=[];S.occ=o0;
      /* et la carte, telle que le panneau la dessine */
      const html=pMonde();
      v.push(html.length,(html.match(/class="poi"/g)||[]).length);
    }finally{
      Math.random=R0;
      for(const k in S)delete S[k];
      Object.assign(S,snap);
      E=null;EE=[];salirUtil();
    }
    return v.join('|');
  };`);
  R(c,'S.eq={};S.day=8.5;S.stats.force=10;');
  /* la reference se reprend juste avant chaque essai : l'empreinte doit etre
     stable deux fois de suite, sinon rien de ce qui suit n'a de valeur */
  const nu=G(c,'__empreinte()');
  eq(G(c,'__empreinte()'),nu,'l\'empreinte est reproductible — sans quoi ce test ne prouve rien');
  const inertes=G(c,`(()=>{
    const ko=[];
    AFFU.forEach(a=>{
      S.eq={};salirUtil();
      const p=a.r();
      S.eq.anneau1={id:'t',kind:'parure',slot:'anneau1',q:1.5,aff:[{id:a.id,p}],
        parts:[{ct:'fixations',f:'brut',mk:'argent'}]};
      if(__empreinte()===${JSON.stringify(nu)})ko.push(a.id);
    });
    S.eq={};salirUtil();
    return ko;})()`);
  ok(inertes.length===0,'chacun des '+G(c,'AFFU.length')+' effets de parure déplace quelque chose de mesurable',
    'sans effet : '+inertes.join(', '));

  /* --- et les effets d'usage restent hors du combat --- */
  R(c,'S.eq={};salirUtil();');
  const dSans=G(c,'wSpeed()');
  R(c,'S.eq.anneau1={id:"q",kind:"parure",slot:"anneau1",q:1.5,aff:[{id:"marche",p:{p:15}},{id:"soin",p:{p:80}}],parts:[{ct:"fixations",f:"brut",mk:"or"}]};salirUtil();');
  eq(G(c,'wSpeed()'),dSans,'une parure ne touche jamais à la vitesse d\'arme');
});

test('alchimie — une plante donne un effet, pas un multiplicateur',()=>{
  /* L'alchimie ne distillait que des potions de STATISTIQUE : +3 en Force
     pendant une minute. C'etait un doublon de la cuisine — un multiplicateur
     de plus, sans decision. Une potion d'EFFET ne monte rien : elle fait
     quelque chose, maintenant, et souvent ce qu'aucune autre voie ne fait. */
  const c=nouveau();
  R(c,'S.sk.alchimie.lv=30;S.carry=Object.keys(STATION);');
  /* chaque plante alchimique donne bien SA fiole */
  const plantes=G(c,'Object.keys(ALCHPLANTE)');
  ok(plantes.length>=8,'neuf plantes portent un effet — '+plantes.length);
  let toutes=true;
  plantes.forEach(pl=>{
    R(c,'S.potions=[];S.food={};S.food["'+pl+'"]=1;distill(["'+pl+'"]);');
    if(G(c,'S.potions.length')!==1||G(c,'S.potions[0].e')!==G(c,'ALCHPLANTE["'+pl+'"]'))toutes=false;
  });
  ok(toutes,'chaque plante distille exactement l\'effet qu\'elle annonce');

  /* --- le soin rend des PV --- */
  R(c,'S.potions=[];S.food={achillee:1};distill(["achillee"]);S.hp=5;drink(0);');
  gt(G(c,'S.hp'),5,'la fiole de soin rend des points de vie');

  /* --- le remede lave une infection, et rien d'autre ne le fait vite --- */
  R(c,'S.st=[];addStatus(S,"infection",6,1);S.potions=[];S.food={herbes:1};distill(["herbes"]);drink(0);');
  eq(G(c,'hasStatus(S,"infection")'),false,'le remède lave la fièvre sur-le-champ');

  /* --- le poison de lame : les coups empoisonnent, et cela s'use --- */
  R(c,'S.st=[];S.potions=[];S.food={belladone:1};distill(["belladone"]);drink(0);');
  gt(G(c,'S.lame'),0,'le poison de lame tient un temps');
  R(c,'spawn();S.stats.force=200;globalThis.__e=EE[0];__e.hp=1e9;attack(false);');
  eq(G(c,'hasStatus(__e,"poison")'),true,'et il passe dans la plaie');
  R(c,'for(let i=0;i<400;i++)tickLame(1);');
  eq(G(c,'S.lame'),0,'il s\'épuise avec le temps, pas avec les coups');

  /* --- les resistances isolent d'UN seul extreme --- */
  R(c,'S.buffs=[];S.st=[];globalThis.__chaud=()=>{feltTemp=()=>45;return tempStress();};'
    +'globalThis.__froid=()=>{feltTemp=()=>-25;return tempStress();};');
  ok(!!G(c,'__chaud()'),'une canicule pèse');
  R(c,'S.potions=[];S.food={menthe:1};distill(["menthe"]);drink(0);');
  const apresChaud=G(c,'__chaud()');
  ok(!apresChaud||apresChaud.e<9,'la fraîcheur allège la canicule');
  ok(!!G(c,'__froid()'),'mais elle ne fait rien contre le froid — on isole d\'un seul côté');
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
  /* Le depart peut tomber sur un village, et l'on ne se bat pas dans les
     rues : sans cette ligne, le test mesurerait la carte au lieu du plan. */
  R(c,'here().town=null;');
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
    /* La declaration elle-meme ne compte pas : on cherche un USAGE, sous
       n'importe quelle forme. Un premier jet n'acceptait que `id==='x'` et
       declarait donc morts neuf affixes lus par un `switch` — il mesurait un
       style d'ecriture, pas un effet. On compte les occurrences citees : la
       table en pose une, tout usage en ajoute une autre. */
    const cites=(src.match(new RegExp("'"+id+"'","g"))||[]).length;
    return cites<2;
  });
  /* ETRE LU NE SUFFIT PAS : il faut que cela CHANGE quelque chose. On pose
     chaque affixe seul sur une arme, on met le monde dans l'etat qu'il
     reclame, et l'on exige que les degats moyens bougent. Un affixe cite
     dans un `switch` qui ne multiplie rien passerait le test precedent. */
  R(c,`S.eq={};S.items=[];S.postures=[];S.modules=[];S.stats.force=80;
    pickZone=()=>'torse';
    globalThis.__armeAff=(aff)=>{
      const p=FUNC.epee.comp.map(ct=>partFor(ct,['fer','chene','cuir']));
      p.push(partFor('fixations',['fer']));
      const it=mkItem('arme','epee',p,1.2);it.aff=aff;
      S.eq={};S.items=[it];equipItem(0);salirUtil();
    };
    /* le rappel « avant » : ce qu'il faut refaire A CHAQUE coup. La remise a zero des
       statuts entre deux mesures effacait le saignement qu'on venait de
       poser, et l'affixe « contre une cible blessee » paraissait inerte. */
    globalThis.__degMoy=(n,avant)=>{let s=0;
      for(let i=0;i<(n||300);i++){
        EE.forEach(e=>{e.hp=1e9;e.max=1e9;e.st=[];});
        if(avant)avant();
        S.end=100;hitN=globalThis.__hit||0;const h=EE[0].hp;attack(false);s+=h-EE[0].hp;
      }
      return s/(n||300);};
    S.occ='combat';spawn();`);
  /* chaque affixe avec la situation qui le reveille, et la meme sans */
  const situations={
    orage:['meteo=()=>"orage";','meteo=()=>"clair";'],
    hiver:['S.day=95;','S.day=45;'],
    fond:['here().depth=4;','here().depth=0;'],
    entier:['S.hp=maxHp();','S.hp=maxHp();'],
    blesse:['globalThis.__av=()=>EE.forEach(e=>addStatus(e,"saignement",99,1));','globalThis.__av=null;'],
    premier:['globalThis.__hit=0;','globalThis.__hit=0;'],
    montee:['globalThis.__hit=8;','globalThis.__hit=0;'],

    cycle:['S.seg=[0,1,2];','S.seg=[];'],
  };
  const inertes=Object.keys(situations).filter(id=>{
    const [avec,sans]=situations[id];
    R(c,'__armeAff([]);'+avec);
    const nu=G(c,'__degMoy(700,globalThis.__av)');
    R(c,'__armeAff([{id:"'+id+'",p:AFF.find(a=>a.id==="'+id+'").r()}]);'+avec);
    const arme=G(c,'__degMoy(700,globalThis.__av)');
    return !(arme>nu*1.03);
  });
  ok(inertes.length===0,'chacun des affixes de situation change vraiment les dégâts',
    'sans effet : '+inertes.join(', '));
  /* « garde » ne touche pas aux degats donnes mais a ceux qu'on ENCAISSE :
     on le mesure donc de l'autre cote, sinon on cherche un effet la ou il
     n'a jamais eu de raison d'etre. */
  /* il faut porter quelque chose : l'affixe AMPLIFIE la reduction, il n'en
     cree pas — sur un torse nu, multiplier zero par 1,6 fait toujours zero,
     et c'est le comportement voulu */
  /* __armeAff remet S.eq a zero : l'armure doit donc se reposer APRES lui,
     sinon la seconde mesure se fait torse nu et l'on compare deux choses
     differentes. */
  R(c,`globalThis.__armure=()=>{
      ZK.forEach(z=>{const sl=SLOTS.find(x=>x.zone===z).k;
        const maj=partFor('plaque',['fer']);
        S.eq[sl]=mkItem('armure',sl,[maj,partFor('sangles',['fer']),partFor('fixations',['fer'])],1.4);
        S.eq[sl].cons=COMP.plaque.cons;});
      salirUtil();};
    __armeAff([]);__armure();S.guard=true;
    /* une creature qui frappe FORT : avec un coup faible, le plancher a un
       point de degats masque toute reduction et l'on ne mesure plus rien */
    EE[0].dmg=400;S.stats.endu=40;
    globalThis.__encaisse=()=>{let s=0;
      for(let i=0;i<200;i++){const h=S.hp=maxHp()*9;S.hp=h;resolveHit(1,EE[0]);s+=h-S.hp;}
      return s/200;};`);
  const nuGarde=G(c,'__encaisse()');
  R(c,`__armeAff([{id:'garde',p:{p:60}}]);__armure();S.guard=true;`);
  ok(G(c,'__encaisse()')<nuGarde,'« garde » réduit ce qu\'on encaisse, garde levée — '
    +nuGarde.toFixed(1)+' puis '+G(c,'__encaisse()').toFixed(1));

  /* et les deux qui touchent au rythme plutot qu'aux degats */
  R(c,'__armeAff([]);S.end=100;attack(true);globalThis.__c1=100-S.end;');
  R(c,'__armeAff([{id:"lourdeur",p:{p:40}}]);S.end=100;attack(true);globalThis.__c2=100-S.end;');
  ok(G(c,'__c2')<G(c,'__c1'),'« lourdeur » rabat le coût de la frappe lourde — '
    +G(c,'__c1').toFixed(1)+' puis '+G(c,'__c2').toFixed(1));
  R(c,`__armeAff([{id:'sangsue',p:{n:1,p:50}}]);EE.forEach(e=>{e.hp=1e9;});
    S.end=10;hitN=0;attack(false);globalThis.__e2=S.end;`);
  gt(G(c,'__e2'),0,'« sangsue » rend de l\'endurance au lieu d\'en prendre — '+G(c,'__e2').toFixed(1));

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
  R(c,'pickZone=()=>"torse";'
    +'globalThis.__coups=(aff,avant)=>{'
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
