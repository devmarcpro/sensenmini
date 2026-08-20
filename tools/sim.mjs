/* Simulateur de parties longues — sans navigateur.
   node tools/sim.mjs [--bot guerrier|mineur|mixte|tous] [--hours 8] [--seed 42] [--dt 0.1] [--json]
   Charge la logique du jeu (src/01..45) dans un contexte isolé avec un DOM
   factice, fait naître un personnage, puis laisse un bot jouer en accéléré :
   la boucle step(dt) tourne exactement comme dans le navigateur, seul le
   rendu est neutralisé. Relève or, PV, compétences, morts, objets par heure
   et signale exceptions, NaN et stagnation. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:d;};
const HOURS=+arg('--hours',8),DT=+arg('--dt',0.1),BOT=arg('--bot','tous'),SEED=+arg('--seed',42),JSON_OUT=argv.includes('--json');

/* ---------- DOM factice : tout ce que le rendu touche, sans effet ---------- */
function fakeEl(){
  const el={style:{},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},querySelectorAll(){return [];},
    querySelector(){return null;},addEventListener(){},closest(){return null;},getBoundingClientRect(){return {x:0,y:0,width:0,height:0};},
    scrollIntoView(){},classList:{toggle(){},add(){},remove(){},contains(){return false;}},
    setProperty(){}};
  el.style.setProperty=()=>{};
  return el;
}
function makeContext(seed){
  const els={};
  const document={
    getElementById:id=>els[id]||(els[id]=fakeEl()),
    querySelectorAll:()=>[],querySelector:()=>null,
    createElement:()=>fakeEl(),body:fakeEl(),documentElement:fakeEl(),
    addEventListener(){},visibilityState:'visible',fonts:{check:()=>true},
  };
  const ctx={document,console,Math,JSON,Date,performance:{now:()=>0},
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    navigator:{},location:{protocol:'file:'},
    getComputedStyle:()=>({}),
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  /* aléatoire reproductible : mulberry32 */
  let s=seed>>>0;
  ctx.Math=Object.create(Math);
  ctx.Math.random=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  return ctx;
}
const files=readdirSync(join(root,'src')).filter(f=>/^(0[1-9]|[1-3][0-9]|4[0-9]|10b|23b|23c|29b)-.*\.js$/.test(f)&&f.endsWith('.js')).sort();
const code=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');

function newGame(seed,classe,race){
  const ctx=makeContext(seed);
  vm.runInContext(code,ctx,{filename:'sensen.js'});
  /* neutraliser le rendu et compter les événements */
  vm.runInContext(`
    var __ev={};var __err=[];
    function __count(k){__ev[k]=(__ev[k]||0)+1;}
    var __trace=${JSON.stringify(arg('--trace','')).replace(/"/g,"'")}.split(',').filter(Boolean);var __tr=[];
    cutIn=function(k,t,sub){__count('cut:'+k);__ev.__lastCut=k+' '+t+(sub?' — '+sub:'');
      if(__trace.includes(k))__tr.push(((S.day-7/24)*DAY/3600).toFixed(2)+'h '+k+' '+t+(sub?' — '+sub:'')+' · PV '+Math.round(S.hp)+'/'+maxHp()+' · or '+S.or+' · '+(weapon()?weapon().nom+' q'+weapon().q:'—'));};
    float=function(){};knock=function(){};toast=function(t){__count('toast');__ev.__lastToast=t;};
    paint=function(){};render=function(){};buildScene=function(){};renderCombat=function(){};
    log=function(h){S.log.unshift(String(h).replace(/<[^>]+>/g,''));if(S.log.length>7)S.log.pop();};
  `,ctx);
  vm.runInContext(`S.seed=${seed};cr.race='${race}';cr.classe='${classe}';cr.el=1;cr.an=2;
    cr.pts=30+(CLASSE['${classe}'].pts||0);STATS.forEach(([k])=>cr.st[k]=5);
    /* répartition simple : force, endu, dex d'abord */
    for(const k of ['force','endu','dex','vol','per','cha']){while(cr.pts>0&&cr.st[k]<12){cr.st[k]++;cr.pts--;}}
    cr.pos=defaultStart();applyBirth();starterKit();here().seen=true;`,ctx);
  return ctx;
}
const G=(ctx,expr)=>vm.runInContext(expr,ctx);

/* ---------- bots : ce qu'un joueur ferait, en boucle ---------- */
const BOTS={
  /* combat sans relâche sur la cellule de départ ; mange cru ; lit ses livres ; équipe le meilleur butin */
  guerrier(ctx){
    G(ctx,`(()=>{
      if(S.books.length&&S.occ!=='combat')readBook(0);
      __eat();
      __equipBest();
      if(S.occ==='repos'&&!S.resume&&S.hp>=maxHp()*.9)S.occ='combat';
    })()`);
  },
  /* récolte ce que l'outil permet de plus dur ici, en boucle */
  mineur(ctx){
    G(ctx,`(()=>{
      __eat();
      if(S.occ==='repos'&&!S.resume){
        const c=here();
        let ms=cellMats(c).filter(m=>canHarvest(m)&&stockOf(c,m)>0);
        /* à manger d'abord si la faim guette, puis le plus dur qui reste */
        const ed=ms.filter(m=>MAT[m].nutr);
        if(S.faim<50&&ed.length&&!Object.keys(S.food).length)ms=ed;
        ms.sort((a,b)=>MAT[b].d-MAT[a].d);
        if(ms.length){S.target=ms[0];S.occ='recolte';harvT=0;}
        else{ /* tout est épuisé : la cellule voisine la plus proche */
          const d=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>cell(S.pos[0]+dx,S.pos[1]+dy))
            .find(n=>cellMats(n).some(m=>canHarvest(m)&&stockOf(n,m)>0));
          if(d){d.seen=true;travel(d.x,d.y);}
        }
      }
    })()`);
  },
  /* alterne : combat le jour, récolte la nuit ; va explorer si la cellule est calme ; entre dans les donjons découverts */
  mixte(ctx){
    G(ctx,`(()=>{
      if(S.books.length&&S.occ!=='combat'&&S.occ!=='donjon')readBook(0);
      __eat();
      __equipBest();
      if(S.occ==='donjon'||S.occ==='dormir'||S.resume)return;
      const c=here();
      /* la carte révèle le voisinage immédiat à chaque affichage : on fait pareil */
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)cell(S.pos[0]+dx,S.pos[1]+dy).seen=true;
      const full=S.hp>=maxHp()*.9;
      /* cellule purgée : on rompt le combat de temps en temps pour explorer */
      if(S.occ==='combat'&&c.cleared>=3&&Math.random()<.05){S.occ='explore';E=null;return;}
      const ok=x=>!(__djFail[key(x.x,x.y)]>=2);
      if(c.poi==='donjon'&&(!c.dj||!c.dj.clear)&&full&&S.occ!=='donjon'&&ok(c)){enterDungeon();return;}
      /* un donjon connu à portée ? on interrompt le combat pour y aller */
      const dj=Object.values(S.world).find(x=>x.seen&&x.poi==='donjon'&&!(x.dj&&x.dj.clear)&&!x.djDone&&ok(x)&&Math.abs(x.x-S.pos[0])+Math.abs(x.y-S.pos[1])<=3);
      if(dj&&full&&!(dj.x===S.pos[0]&&dj.y===S.pos[1])){travel(dj.x,dj.y);return;}
      if(S.occ!=='repos')return;
      if(c.cleared>=3&&Math.random()<.3){S.occ='explore';return;}
      if(full)S.occ='combat';
    })()`);
  },
  /* la boucle d'endgame : récolter, revendiquer, bâtir, cuisiner, dormir, recruter au village, assigner */
  batisseur(ctx){
    G(ctx,`(()=>{
      __eat();
      const c=here(),has=cat=>Object.keys(S.mat).filter(m=>MAT[m].c===cat).reduce((a,m)=>a+S.mat[m],0);
      const home=S.claims.length?S.world[S.claims[0]]:null;
      const atHome=home&&home.x===S.pos[0]&&home.y===S.pos[1];
      if(S.occ==='dormir'||S.resume)return;
      /* nuit au lit */
      if(isNight()&&atHome&&litIci()&&S.occ!=='dormir'){dormir(false);return;}
      /* cuisiner dès qu'on a une cuisine et trois éléments */
      if(atHome&&hasStation('cuisine')&&S.faim<70){const p2={};Object.keys(S.food).forEach(k=>{const i=foodInfo(k);if(!p2[i.el]&&S.food[k]>0)p2[i.el]=k;});
        const c5=Object.values(p2);if(c5.length>=3)cook(c5.slice(0,5));}
      /* 1. revendiquer la cellule de départ quand l'or suffit ; l'or vient du combat */
      if(!S.claims.length){
        if(c.poi==='donjon')return;
        if(S.or>=claimCost()){if(S.occ!=='repos'){S.occ='repos';E=null;}claimCell();return;}
        if(S.occ==='repos'&&S.hp>=maxHp()*.9)S.occ='combat';
        return;}
      /* l'entretien se paie sur le trésor : on y garde de quoi voir venir */
      if(atHome&&S.or>300&&S.tresor<upkeep()*3)deposit(Math.min(S.or-200,upkeep()*4));
      if(!atHome&&!__away){travel(home.x,home.y);return;}
      /* 2. bâtir : bâtiment, lit, cuisine, lanterne ; puis un second bâtiment avec établi/scierie */
      const P=plots(home);
      const need=[];
      if(!P[0])need.push(['bois',12],['roche',8]);
      else{const b=P[0];
        if(!b.slots.some(s=>s&&s.k==='lit'))need.push(['bois',4],['vegetal',2]);
        if(!b.slots.some(s=>s&&s.k==='cuisine'))need.push(['roche',8],['bois',6]);
        if(!b.slots.some(s=>s&&s.k==='scierie'))need.push(['bois',10],['roche',4]);
        if(!b.slots.some(s=>s&&s.k==='tailleur'))need.push(['roche',12],['bois',4]);
        if(!P[1])need.push(['roche',6]);}
      const lack=need.find(([cat,n])=>has(cat)<n);
      if(atHome&&!lack&&need.length){
        if(S.occ!=='repos'){S.occ='repos';E=null;}
        if(!P[0])buildPlot(0,'batiment');
        else{const b=P[0],free=()=>b.slots.findIndex(s=>!s);
          if(!b.slots.some(s=>s&&s.k==='lit'))placeSlot(0,free(),'meuble','lit');
          else if(!b.slots.some(s=>s&&s.k==='cuisine'))placeSlot(0,free(),'station','cuisine');
          else if(!b.slots.some(s=>s&&s.k==='scierie'))placeSlot(0,free(),'station','scierie');
          else if(!b.slots.some(s=>s&&s.k==='tailleur'))placeSlot(0,free(),'station','tailleur');
          else if(!P[1])buildPlot(1,'route');}
        return;}
      if(lack&&atHome){ /* récolter ce qui manque */
        const m=cellMats(home).find(mk=>MAT[mk].c===lack[0]&&canHarvest(mk)&&stockOf(home,mk)>0);
        if(m){if(S.occ!=='recolte'||S.target!==m){S.target=m;S.occ='recolte';harvT=0;}return;}
        /* rien de tel ici : on va le chercher dans un rayon de deux cellules */
        let n=null,bd=9;
        for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const x=cell(S.pos[0]+dx,S.pos[1]+dy),d=Math.abs(dx)+Math.abs(dy);
          if(d&&d<bd&&cellMats(x).some(mk=>MAT[mk].c===lack[0]&&canHarvest(mk)&&stockOf(x,mk)>0)){n=x;bd=d;}}
        if(n){__away=true;n.seen=true;travel(n.x,n.y);}
        else if(S.occ==='repos'&&S.hp>=maxHp()*.9)S.occ='combat';   /* faute de mieux, de l'or */
        return;}
      if(!atHome&&__away===true){ /* en déplacement pour des matériaux : récolter puis rentrer */
        const m=lack?cellMats(c).find(mk=>MAT[mk].c===lack[0]&&canHarvest(mk)&&stockOf(c,mk)>0):null;
        if(m){if(S.occ!=='recolte'||S.target!==m){S.target=m;S.occ='recolte';harvT=0;}return;}
        __away=false;return;}
      /* 3. tout est bâti : combattre pour l'or, et recruter quand un village est en vue */
      const vil=Object.values(S.world).find(x=>x.seen&&(x.poi==='village'||townAt(x.x,x.y))&&Math.abs(x.x-home.x)+Math.abs(x.y-home.y)<=4);
      const rec=S.npcs.filter(n=>n.rec);
      if(__away==='village'){
        if(S.pos[0]!==vil.x||S.pos[1]!==vil.y){__away=false;return;}
        if(isNight()){if(S.occ==='repos'&&S.hp>=maxHp()*.9)S.occ='combat';return;}
        if(S.occ!=='repos'){S.occ='repos';E=null;}
        ensureNpcs();
        const list=npcsHere();
        for(const n of list){if(n.rec)continue;talkTo(n);
          if(n.rel>=50){recruit(n);n.assign=pick(['mineur','bucheron','fermier','garde']);n.cell=S.claims[0];__count('recrue');}
          else if(S.or>giftCost(n)*2)giveGift(n);}
        if(S.npcs.filter(n=>n.rec).length>=4||S.or<120||!list.length)__away=false;
        return;}
      if(vil&&rec.length<4&&S.or>500&&!isNight()){__away='village';travel(vil.x,vil.y);return;}
      if(!vil){for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)cell(S.pos[0]+dx,S.pos[1]+dy).seen=true;
        if(S.occ==='repos'&&Math.random()<.2){S.occ='explore';return;}}
      if(S.occ==='repos'&&S.hp>=maxHp()*.9)S.occ='combat';
    })()`);
  },
};
/* équipe la meilleure arme et une pièce d'armure par zone, à partir du sac */
const HELPERS=`
const __score=itemScore;let __away=false;const __djFail={};
/* un bot qui meurt deux fois dans un donjon renonce à celui-là */
(()=>{const d0=down;down=function(){if(S.occ==='donjon'||S.resume==='donjon'){const k=key(S.pos[0],S.pos[1]);__djFail[k]=(__djFail[k]||0)+1;}return d0.apply(this,arguments);};})();
function __eat(){
  if(S.faim>=35)return;
  const f=Object.keys(S.food).find(k=>S.food[k]>0);if(f)return eatFood(f);
  const k=Object.keys(S.mat).find(m=>MAT[m].nutr&&S.mat[m]>0);if(k)eat(k);
}
function __equipBest(){
  const w=weapon();
  const bw=S.items.map((it,i)=>({it,i})).filter(x=>x.it.kind==='arme').sort((a,b)=>__score(b.it)-__score(a.it))[0];
  if(bw&&(!w||__score(bw.it)>__score(w)*1.05)){const idx=S.items.indexOf(bw.it);const old=S.eq.main1;S.eq.main1=bw.it;S.items.splice(idx,1);if(old)S.items.push(old);}
  ZK.forEach(zk=>{const sl=SLOTS.find(x=>x.zone===zk);const cur=S.eq[sl.k];
    const best=S.items.filter(it=>it.kind==='armure'&&it.slot===sl.k).sort((a,b)=>__score(b)-__score(a))[0];
    if(best&&(!cur||__score(best)>__score(cur)*1.05)){const idx=S.items.indexOf(best);S.eq[sl.k]=best;S.items.splice(idx,1);if(cur)S.items.push(cur);}});
}`;

function snapshot(ctx){
  return G(ctx,`(()=>{
    const top=SK.map(k=>[SKILLS[k].n,S.sk[k].lv]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]+' '+x[1]).join(', ');
    const w=weapon();
    return {h:+((S.day-7/24)*DAY/3600).toFixed(2),or:S.or,hp:Math.round(S.hp),maxHp:maxHp(),occ:S.occ,
      kills:__ev['kill']||0,deaths:__ev['cut:死']||0,items:S.items.length,books:S.books.length,modules:S.modules.length,
      mats:Object.values(S.mat).reduce((a,b)=>a+b,0),food:Object.values(S.food).reduce((a,b)=>a+b,0),
      weapon:w?w.nom+' q'+w.q+(w.aff&&w.aff.length?' +'+w.aff.length+'aff':''):'—',
      armor:ZK.filter(zk=>S.eq[SLOTS.find(x=>x.zone===zk).k]).length+'/5',
      top,corr:here().corr,depth:here().depth,pos:S.pos.join(','),comps:S.comps.length,
      week:S.week,faim:Math.round(S.faim)};})()`);
}

function run(botName,classe,race,hours,seed){
  const ctx=newGame(seed,classe,race);
  vm.runInContext(HELPERS,ctx);
  /* compter les kills en enveloppant kill() */
  vm.runInContext(`(()=>{const k0=kill;kill=function(){__count('kill');return k0.apply(this,arguments);};})()`,ctx);
  const bot=BOTS[botName];
  const snaps=[];const errors=[];
  const total=hours*3600;let t=0,botT=0,snapT=0;
  const nanCheck=()=>G(ctx,`[S.hp,S.end,S.mana,S.faim,S.or,S.day].some(x=>typeof x!=='number'||Number.isNaN(x))`);
  const t0=Date.now();
  while(t<total){
    try{G(ctx,`step(${DT})`);}
    catch(e){errors.push({h:+(t/3600).toFixed(2),msg:String(e.message||e).split('\n')[0]});if(errors.length>20)break;}
    t+=DT;botT+=DT;snapT+=DT;
    if(botT>=1){botT=0;try{bot(ctx);}catch(e){errors.push({h:+(t/3600).toFixed(2),msg:'bot: '+String(e.message||e)});if(errors.length>20)break;}}
    if(snapT>=1800){snapT=0;snaps.push(snapshot(ctx));
      if(nanCheck()){errors.push({h:+(t/3600).toFixed(2),msg:'NaN dans l\'état'});break;}}
  }
  snaps.push(snapshot(ctx));
  const ev=G(ctx,'JSON.stringify(__ev)');
  const trace=G(ctx,'JSON.stringify(__tr)');
  const extra=G(ctx,`JSON.stringify({claims:S.claims.length,plots:S.claims.reduce((a,k)=>a+((S.world[k].plots||[]).filter(Boolean).length),0),
    rec:S.npcs.filter(n=>n.rec).length,assign:S.npcs.filter(n=>n.rec&&n.assign).length,tresor:Math.round(S.tresor),dette:Math.round(S.dette),
    vivres:S.vivres||0,plats:S.plats||0,stations:[...stationsHere()].join('/'),log:S.log.slice(0,4)})`);
  return {bot:botName,classe,race,seed,hours,ms:Date.now()-t0,snaps,errors,events:JSON.parse(ev),trace:JSON.parse(trace),extra:JSON.parse(extra)};
}

const plan=BOT==='tous'?[['guerrier','guerrier','humain'],['mineur','artisan','nain'],['mixte','chasseur','elfe'],['batisseur','artisan','humain']]
  :[[BOT,BOT==='mineur'||BOT==='batisseur'?'artisan':BOT==='mixte'?'chasseur':'guerrier','humain']];
const results=plan.map(([b,c,r])=>run(b,c,r,HOURS,SEED));
if(JSON_OUT){console.log(JSON.stringify(results,null,1));process.exit(0);}
for(const r of results){
  console.log(`\n=== ${r.bot} (${r.classe} ${r.race}, seed ${r.seed}) — ${r.hours} h simulées en ${(r.ms/1000).toFixed(1)} s ===`);
  console.log('  h     or    PV      kills morts objets livres mod  mats  nourr  arme                         armure  top compétences');
  for(const s of r.snaps){
    console.log('  '+String(s.h).padEnd(5)+String(s.or).padStart(6)+'  '+(s.hp+'/'+s.maxHp).padEnd(8)+String(s.kills).padStart(5)+String(s.deaths).padStart(6)
      +String(s.items).padStart(7)+String(s.books).padStart(7)+String(s.modules).padStart(4)+String(s.mats).padStart(6)+String(s.food).padStart(7)
      +'  '+s.weapon.slice(0,28).padEnd(29)+s.armor.padEnd(8)+s.top);
  }
  const last=r.snaps[r.snaps.length-1];
  console.log('  fin : occ '+last.occ+' · pos '+last.pos+' · corruption '+last.corr+' · strate '+last.depth+' · semaine '+last.week+' · faim '+last.faim+' · compagnons '+last.comps);
  const cuts=Object.entries(r.events).filter(([k])=>k.startsWith('cut:')).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>k.slice(4)+'×'+v).join('  ');
  console.log('  événements : '+cuts);
  if(r.events.__lastToast)console.log('  dernier toast : '+r.events.__lastToast);
  const x=r.extra;
  console.log('  territoire : '+x.claims+' claims · '+x.plots+' parcelles · stations ici '+(x.stations||'—')+' · résidents '+x.rec+' ('+x.assign+' assignés) · trésor '+x.tresor+' · dette '+x.dette+' · vivres '+x.vivres+' · plats '+x.plats);
  console.log('  journal : '+x.log.join(' | '));
  if(r.trace.length){console.log('  trace :');r.trace.slice(0,30).forEach(l=>console.log('    '+l));}
  if(r.errors.length){console.log('  ERREURS :');r.errors.slice(0,8).forEach(e=>console.log('    h'+e.h+' '+e.msg));}
}
process.exit(results.some(r=>r.errors.length)?1:0);
