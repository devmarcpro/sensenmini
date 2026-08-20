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
function makeContext(seed){
  const els={};
  const document={getElementById:id=>els[id]||(els[id]=fakeEl()),querySelectorAll:()=>[],querySelector:()=>null,
    createElement:()=>fakeEl(),body:fakeEl(),documentElement:fakeEl(),addEventListener(){},
    visibilityState:'visible',fonts:{check:()=>true}};
  const ctx={document,console,Math,JSON,Date,performance:{now:()=>0},
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
    unescape:global.unescape,escape:global.escape,encodeURIComponent,decodeURIComponent,
    navigator:{},location:{protocol:'file:'},getComputedStyle:()=>({})};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  let s=seed>>>0;
  ctx.Math=Object.create(Math);
  ctx.Math.random=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  vm.runInContext(code,ctx,{filename:'sensen.js'});
  /* rendu neutralisé, journal capté */
  vm.runInContext(`
    var __log=[],__toast=[],__cut=[];
    cutIn=(k,t,s)=>__cut.push(k+' '+t+(s?' — '+s:''));
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
  eq(G(c,'stockOf(here(),"'+mk+'")'),max,'une cellule sauvage se régénère');
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
