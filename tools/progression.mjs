/* Sensen Mini — tools/progression.mjs
   node tools/progression.mjs [--jours N] [--graines N]

   SEPTIEME INSTRUMENT : la partie longue.

   Un jeu qui tourne seul se juge sur des SEMAINES, pas sur huit heures.
   Le simulateur mesure une session ; la courbe d'equipement mesure un
   palier. Aucun des deux ne repond aux questions qui decident si un idle
   tient : est-ce que ca monte encore au bout de dix jours ? est-ce que
   l'or s'accumule sans jamais servir ? est-ce qu'une competence file
   trois fois plus vite que les autres, si bien que tout le reste devient
   decoratif ?

   Cet outil fait tourner le BOT DES CONSIGNES — celui qui ne decide rien,
   qui n'obeit qu'au moteur de regles du jeu — sur des journees entieres,
   et regarde les pentes. Il n'a pas de valeur juste en tete : il cherche
   des FORMES fautives.

     · une courbe qui s'aplatit  → le joueur n'a plus rien a gagner
     · une courbe qui s'emballe  → plus rien ne le retient
     · une competence qui double toutes les autres → les autres sont mortes
     · un or qui ne redescend jamais → il n'y a pas de puits (7.6)

   Il sort en echec sur ces formes-la, pour qu'un desequilibre de fond se
   voie avant six mois de parties. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i>=0?+argv[i+1]:d;};
const JOURS=arg('--jours',60),GRAINES=arg('--graines',3),DT=arg('--dt',0.25);
const VERBOSE=argv.includes('-v');

const files=readdirSync(join(root,'src')).filter(f=>f.endsWith('.js')&&!/^52-/.test(f)).sort();
const code=files.map(f=>readFileSync(join(root,'src',f),'utf8')).join('\n');

function fakeEl(){return {style:{setProperty(){}},children:[],dataset:{},innerHTML:'',textContent:'',className:'',hidden:false,
  setAttribute(){},getAttribute:()=>null,appendChild(){},remove(){},querySelectorAll:()=>[],querySelector:()=>null,
  addEventListener(){},closest:()=>null,getBoundingClientRect:()=>({x:0,y:0,width:0,height:0}),scrollIntoView(){},
  classList:{toggle(){},add(){},remove(){},contains:()=>false}};}

function partie(seed){
  const els={};
  const ctx={document:{getElementById:id=>els[id]||(els[id]=fakeEl()),querySelectorAll:()=>[],querySelector:()=>null,
      createElement:()=>fakeEl(),body:fakeEl(),documentElement:fakeEl(),addEventListener(){},
      visibilityState:'visible',fonts:{check:()=>true}},
    console:{log(){},warn(){},error(){}},JSON,Date,performance:{now:()=>0},
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
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
  vm.runInContext(`
    float=()=>{};knock=()=>{};shake=()=>{};flashHp=()=>{};sfx=()=>{};
    paint=()=>{};render=()=>{};buildScene=()=>{};renderCombat=()=>{};buildGate=()=>{};
    toast=()=>{};log=()=>{};cutIn=(k,t,s,hors)=>{if(!hors)chronique(k,t,s);};
    S.seed=${seed};cr.race='humain';cr.classe='guerrier';cr.el=0;cr.an=0;
    /* Un personnage doit DEPENSER ses trente points : les laisser en
       reserve, c'est mesurer un joueur qui n'a pas fini sa creation. Sans
       endurance, il reste sous son seuil de souffle en permanence et ne
       frappe presque jamais — un premier jet mesurait ainsi une demi-mort
       par jour et croyait le jeu vide. */
    cr.pts=30+(CLASSE[cr.classe].pts||0);STATS.forEach(([k])=>cr.st[k]=5);
    for(const k of ['force','endu','dex','vol','per','cha']){while(cr.pts>0&&cr.st[k]<12){cr.st[k]++;cr.pts--;}}
    cr.pos=defaultStart();
    applyBirth();starterKit();here().seen=true;
    /* le bot qui ne decide rien : il allume les consignes et se tait */
    S.plan={on:true,r:planDefaut()};
    /* la seule chose qu'il fait a la main : porter ce qu'il ramasse */
    globalThis.__equipBest=()=>{
      for(let i=S.items.length-1;i>=0;i--){
        const it=S.items[i];
        if(it.kind==='statue')continue;
        /* UN OUTIL NE SE PORTE PAS. Il occupe la main principale comme une
           arme, et son score se mesure sur une autre echelle — une pioche
           d'acier "battait" donc une epee et la chassait de la main. La
           recolte n'en a pas besoin : toolFor() regarde aussi le sac. */
        if(it.kind==='outil')continue;
        const porte=it.kind==='arme'?weapon():S.eq[it.slot];
        if(!porte||itemScore(it)>itemScore(porte))equipItem(i);
      }
    };
  `,ctx);
  return ctx;
}

/* ---------- une mesure ---------- */
function mesure(ctx){
  return vm.runInContext(`(()=>{
    const niv=SK.map(k=>S.sk[k].lv);
    const eq=[weapon()].concat(ZK.map(z=>S.eq[SLOTS.find(x=>x.zone===z).k]))
      .filter(Boolean).reduce((a,it)=>a+itemScore(it),0);
    return {
      jour:+S.day.toFixed(2),
      or:S.or,
      niveaux:SK.reduce((a,k)=>a+S.sk[k].lv,0),
      meilleure:Math.max(0,...niv),
      exercees:niv.filter(x=>x>0).length,
      equip:+eq.toFixed(1),
      objets:S.items.length,
      tues:Object.keys(S.bes||{}).reduce((a,k)=>a+(S.bes[k].t||0),0),
      especes:Object.keys(S.bes||{}).length,
      morts:S.deaths||0,
      cases:Object.keys(S.world).length,
      modules:S.modules.length,
      mats:Object.values(S.mat).reduce((a,b)=>a+b,0),
    };})()`,ctx);
}

/* ---------- la course ---------- */
function courir(seed){
  const ctx=partie(seed);
  const jalons=[];
  /* UN JOUR DU JEU NE FAIT PAS VINGT-QUATRE HEURES REELLES : quatre minutes
     suffisent (DAY=240). Un premier jet comptait 24x3600 pas par jalon et
     simulait donc quatorze cents jours par ligne — tout avait plafonne des
     la premiere, et le tableau semblait fige. On avance jusqu'a ce que le
     jour du JEU change, ce qui est la seule horloge qui compte ici. */
  const cible=vm.runInContext('S.day',ctx);
  for(let j=1;j<=JOURS;j++){
    let garde=0;
    while(vm.runInContext('S.day',ctx)<cible+j&&garde++<400000){
      try{vm.runInContext('step('+DT+');globalThis.__t=(globalThis.__t||0)+1;if(__t%40===0)__equipBest();',ctx);}
      catch(e){return {seed,erreur:e.message,jalons};}
    }
    jalons.push(mesure(ctx));
  }
  return {seed,jalons};
}

console.log('\nSensen Mini — la partie longue');
console.log(GRAINES+' parties de '+JOURS+' jours, jouees par le moteur de regles seul\n');

const courses=[];
for(let i=0;i<GRAINES;i++){
  const r=courir(1000+i*7919);
  if(r.erreur){console.log('ERREUR graine '+r.seed+' : '+r.erreur);process.exit(1);}
  courses.push(r);
}

/* moyenne des graines, jalon par jalon */
const moy=[];
for(let j=0;j<JOURS;j++){
  const l=courses.map(c=>c.jalons[j]).filter(Boolean);
  if(!l.length)break;
  const m={};
  Object.keys(l[0]).forEach(k=>{m[k]=l.reduce((a,x)=>a+x[k],0)/l.length;});
  moy.push(m);
}

const col=(x,n)=>String(typeof x==='number'?Math.round(x):x).padStart(n);
console.log('  jour       or   niveaux  meilleure  exercees   equip     tues  especes  morts   cases');
moy.forEach((m,j)=>{
  console.log('  '+col(j+1,4)+col(m.or,9)+col(m.niveaux,10)+col(m.meilleure,11)
    +col(m.exercees,10)+col(m.equip,8)+col(m.tues,9)+col(m.especes,9)+col(m.morts,7)+col(m.cases,8));
});

/* ---------- les formes fautives ---------- */
let alertes=0;
const dit=(mauvais,titre,detail)=>{
  console.log('\n'+(mauvais?'ALERTE':'ok    ')+'  '+titre);
  if(detail)console.log('        '+detail);
  if(mauvais)alertes++;
};
const dernier=moy[moy.length-1],milieu=moy[Math.floor(moy.length/2)],premier=moy[0];

/* 1. ca monte encore a la fin ? */
const pente=(a,b,k)=>b[k]>0?(b[k]-a[k])/Math.max(1,a[k]):0;
const penteFin=pente(milieu,dernier,'niveaux');
dit(penteFin<0.06,'la progression continue jusqu au bout',
  'niveaux cumules : '+Math.round(premier.niveaux)+' → '+Math.round(milieu.niveaux)
  +' → '+Math.round(dernier.niveaux)+' (seconde moitie : +'+Math.round(penteFin*100)+' %)');

/* 2. l equipement suit-il, ou plafonne-t-il ? */
const penteEq=pente(milieu,dernier,'equip');
dit(penteEq<0.04,'l equipement progresse encore dans la seconde moitie',
  'score porte : '+premier.equip.toFixed(1)+' → '+milieu.equip.toFixed(1)+' → '+dernier.equip.toFixed(1)
  +' (+'+Math.round(penteEq*100)+' %)');

/* 3. l or a-t-il un puits ? Un idle sans puits finit par n avoir plus de
      decision a prendre : tout est achetable, donc rien ne se choisit. */
const orParJour=dernier.or/JOURS;
const orAccel=(dernier.or-milieu.or)/Math.max(1,milieu.or-premier.or);
dit(orAccel>3.5,'l or ne s emballe pas',
  'bourse : '+Math.round(premier.or)+' → '+Math.round(milieu.or)+' → '+Math.round(dernier.or)
  +' or (acceleration ×'+orAccel.toFixed(2)+', '+Math.round(orParJour)+' or/jour)');

/* 4. une competence qui ecrase les autres */
const ecart=dernier.meilleure/Math.max(1,dernier.niveaux/Math.max(1,dernier.exercees));
dit(ecart>4.5,'aucune competence n ecrase les autres',
  'meilleure '+Math.round(dernier.meilleure)+' contre une moyenne de '
  +(dernier.niveaux/Math.max(1,dernier.exercees)).toFixed(1)+' sur '+Math.round(dernier.exercees)
  +' exercees (×'+ecart.toFixed(2)+')');

/* 5. le monde continue-t-il de montrer du neuf ? */
dit(dernier.especes<=milieu.especes,'le bestiaire continue de s ouvrir',
  Math.round(premier.especes)+' → '+Math.round(milieu.especes)+' → '+Math.round(dernier.especes)+' especes rencontrees');

/* 6. mourir arrive-t-il, sans etre la regle ? */
dit(dernier.morts>JOURS*1.5,'on ne meurt pas en boucle',
  Math.round(dernier.morts)+' chutes en '+JOURS+' jours');

console.log('');
if(alertes){console.log(alertes+' alerte'+(alertes>1?'s':'')+' sur la forme de la partie longue.\n');process.exit(1);}
console.log('La partie longue tient : ca monte encore, rien ne s emballe.\n');
