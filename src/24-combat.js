/* Sensen Mini — 24-combat.js
   Chaîne Wu Xing, endurance, zones, garde et parade, butin
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   COMBAT (5.1 / 5.2 / 5.3 / A.4.6 / A.6.1 / 6.2)
   Placement et rythme : la géométrie décide du toucher, le mouvement
   décide du coup, la chaîne Wu Xing décide de la puissance.
   ================================================================== */
const multOff=(a,t)=>t===dom(a)?1.5:a===dom(t)?.65:t===gen(a)?.8:1;
const multDef=(a,d)=>d===dom(a)?1.20:a===dom(d)?.85:d===gen(a)?.95:1;
function vmult(va,vd,f){let m=0;
  for(let a=0;a<5;a++){if(!va[a])continue;for(let d=0;d<5;d++){if(!vd[d])continue;m+=va[a]*vd[d]*f(a,d);}}
  return m;}
const roll=(n,f)=>{let s2=0;for(let i=0;i<n;i++)s2+=1+Math.floor(Math.random()*f);return s2;};
/* « Beni : +1 a tous les jets » (F.4). Un seul point, mais sur CHAQUE jet —
   pieges, lecture, discretion, critiques. C'est la benediction d'un autel,
   et elle vaut le detour par la salle. */
const d20=()=>ri(1,20)+(typeof hasStatus==='function'&&hasStatus(S,'beni')?1:0);
/* coups contextuels : c'est le déplacement qui choisit la frappe */
const STANCE=[
  {g:'止',n:'Standard',dmg:1.00,spd:1.00,end:8, t:null,       win:1.0, d:'à l\'arrêt — le coup de référence'},
  {g:'進',n:'Estoc',   dmg:1.15,spd:0.95,end:8, t:'percant',  win:.85, d:'en avançant — perforant, allonge +1'},
  {g:'退',n:'Arrêt',   dmg:0.75,spd:1.45,end:6, t:null,       win:1.6, d:'en reculant — rapide, peu coûteux, garde ouverte'},
  {g:'駆',n:'Charge',  dmg:1.45,spd:0.70,end:15,t:'contondant',win:.7, d:'en sprintant — contondant, recul'},
];
const MOBN=['Rôdeur','Éclat','Racine','Brume','Gardien','Cendre','Veine','Sylve','Écho','Carcasse','Suaire','Ronce'];
const MOBS=['de pierre','noueuse','mordante','fêlé','errante','de fer','muette','de jade','affamé','ancienne','sans nom','du seuil'];
const EPITH=['Ancestral','Prismatique','Doré','Argenté','Immémorial','Sans-Nom','Borgne','Écorché','des Brumes','Blanc','Vieux','Balafré'];
const AFF=[
  {f:'RYTHMIQUE',id:'porte',r:()=>({n:ri(2,4),e:ri(0,4)}),t:p=>'une attaque sur '+p.n+' porte '+EL[p.e].n},
  {f:'RYTHMIQUE',id:'des',r:()=>({n:ri(3,5),k:ri(1,3)}),t:p=>'une attaque sur '+p.n+' gagne +'+p.k+' dés'},
  {f:'RYTHMIQUE',id:'perce',r:()=>({n:ri(4,7),p:ri(50,100)}),t:p=>'tous les '+p.n+' coups : ignore '+p.p+'% d\'armure'},
  {f:'CONDITIONNEL',id:'bas',r:()=>({s:ri(30,60),k:ri(1,3)}),t:p=>'sous '+p.s+'% PV : +'+p.k+' dés'},
  {f:'CONDITIONNEL',id:'contre',r:()=>({e:ri(0,4),p:ri(15,35)}),t:p=>'contre les cibles '+EL[p.e].n+' : +'+p.p+'%'},
  {f:'CONDITIONNEL',id:'corr',r:()=>({s:ri(40,70),p:ri(15,30)}),t:p=>'corruption ≥ '+p.s+' : +'+p.p+'%'},
  {f:'WU XING',id:'vecaff',r:()=>({e:ri(0,4),p:ri(20,40)}),t:p=>'+'+p.p+'% '+EL[p.e].n+' au vecteur'},
  {f:'DÉCLENCHEUR',id:'parade',r:()=>({k:ri(3,8)}),t:p=>'à la parade : rend '+p.k+' endurance'},
  {f:'DÉCLENCHEUR',id:'saigne',r:()=>({n:ri(3,6),d:ri(3,5)}),t:p=>'au coup : saigne '+p.n+'/s pendant '+p.d+' s'},
  {f:'DÉCLENCHEUR',id:'assomme',r:()=>({n:ri(4,8),d:ri(1,2)}),t:p=>'un coup sur '+p.n+' : étourdit '+p.d+' s'},
  {f:'DÉCLENCHEUR',id:'brule',r:()=>({n:ri(2,5),d:ri(2,4)}),t:p=>'au coup : brûle '+p.n+'/s pendant '+p.d+' s'},
  {f:'MÉCANIQUE',id:'vol',r:()=>({p:ri(3,8)}),t:p=>'vol de vie '+p.p+'%'},
  /* Sept de plus, sur les mêmes accroches que les douze premiers — aucun
     n'invente de règle, tous se branchent là où le combat décide déjà
     quelque chose. Une arme lit mieux quand ses effets parlent de la
     situation : la nuit, le nombre en face, la chaîne en cours. */
  {f:'CONDITIONNEL',id:'nuit',r:()=>({p:ri(12,28)}),t:p=>'la nuit : +'+p.p+'%'},
  {f:'CONDITIONNEL',id:'seul',r:()=>({p:ri(14,30)}),t:p=>'en duel, une seule créature en face : +'+p.p+'%'},
  {f:'CONDITIONNEL',id:'meute',r:()=>({n:ri(2,3),p:ri(12,26)}),t:p=>'à '+p.n+' créatures ou plus en face : +'+p.p+'%'},
  {f:'DÉCLENCHEUR',id:'gel',r:()=>({d:ri(2,4)}),t:p=>'au coup : ralentit '+p.d+' s'},
  {f:'DÉCLENCHEUR',id:'venin',r:()=>({n:ri(2,4),d:ri(4,7)}),t:p=>'au coup : empoisonne '+p.n+'/s pendant '+p.d+' s'},
  {f:'MÉCANIQUE',id:'souffle',r:()=>({p:ri(10,22)}),t:p=>'coûte '+p.p+'% d\'endurance en moins'},
  {f:'WU XING',id:'harmonie',r:()=>({p:ri(15,35)}),t:p=>'sur une chaîne résolue : +'+p.p+'% de plus'},
];
const RARITY=[{n:'commun',c:'#7E9187',a:0},{n:'inhabituel',c:'#6FBFA0',a:1},
              {n:'rare',c:'#3E7CB1',a:2},{n:'exceptionnel',c:'#D9A441',a:3}];
const NAME_A=['Fervente','Longue','Brève','Muette','Noire','Claire','Ancienne'];
const NAME_B=['de braise','de givre','du colosse','des racines','du filon','de la crue','des cendres'];

/* ==================================================================
   GROUPE D'ENGAGEMENT (multi-ennemis)
   Le GDD laissait quatre questions ouvertes ; voici ce qui est tranché.
   · Jusqu'à quatre créatures engagées à la fois. Une meute, une salle
     gardée, un camp : ce sont de vraies créatures, pas un gros sac de PV.
   · Tu frappes celle que tu REGARDES (E, la cible). On en change au tap.
   · LE DOS : celles que tu ne regardes pas frappent +30 % et ne peuvent
     pas être parées — seule la cible l'est. La posture 退 Arrêt, qui
     recule et garde le groupe en vue, ramène ce malus à +10 %.
   · LE BALAYAGE : une arme d'allonge ≥ 2 (lance, hallebarde, trident)
     ou le passif Balayage touche aussi les autres, à moitié.
   · UN COUP = UN SEGMENT, quel que soit le nombre de cibles touchées.
     Sinon un balayage sur quatre remplit la chaîne d'un coup et toute
     l'économie de la jauge s'effondre.
   ================================================================== */
let E=null,EE=[],foc=0,atkT=0,decay=0,hitN=0,dpsA=0,dps=0,dpsT=0;
const MAXENG=4;
/* la cible est toujours EE[foc] ; on la recale après chaque mort */
function refocus(i){
  if(i!==undefined&&EE[i])foc=i;
  if(foc>=EE.length)foc=0;
  E=EE[foc]||null;
  return E;
}
const engaged=()=>EE.filter(e=>e&&e.hp>0);
/* dos : ce que coûte de tourner le dos à une créature (posture 退 exceptée) */
const backMul=()=>(S.stance===2?1.10:1.30);
const maxHp=()=>Math.round(40+st('endu')*8+lv('encaissement')*4+(typeof gemVie==='function'?gemVie():0));
const weapon=()=>S.eq.main1&&S.eq.main1.kind==='arme'?S.eq.main1:null;
const stanceNow=()=>STANCE[S.stance||0];
function wSpeed(){
  const w=weapon();if(!w)return 1.2;
  const F=FUNC[w.fn];
  return F.spd*Math.pow(20/Math.max(5,w.de),0.75/2)*stanceNow().spd*(1+(st('dex')-5)*.015)*(1+passives().spd)
    *(hasStatus(S,'hate')?1.25:1)*(hasStatus(S,'ralenti')?.75:1);
}
/* la fenêtre de parade : l'esquive l'ouvre, le bouclier la double presque,
   et l'arc la ferme — on ne pare pas une massue avec une corde (5.1) */
function parryWin(){
  const g=grip();
  if(g.k==='dist')return 0;                       /* on ne pare pas avec une corde */
  const bo=g.k==='bouclier'?(1.35+lv('bouclier')*.02)   /* le bois large rattrape ce que la lame rate */
    :g.k==='deuxmains'?.85:1;                     /* une hampe est lente à ramener */
  return 0.25*(1+lv('esquive')*0.01+passives().win)*stanceNow().win*bo;
}
/* ce que la prise en main ajoute : le bouclier défend, les deux mains frappent,
   les deux armes font tourner la chaîne plus vite (5.2) */
function gripBonus(){
  const g=grip(),b=S.eq.main2;
  const o={dmg:1,red:0,parry:1,off:null};
  if(g.k==='deuxmains')o.dmg=1.18+lv('deuxmains')*.008;
  else if(g.k==='bouclier'&&b){
    o.red=b.durBase/5*b.q*(1+lv('bouclier')*.02);      /* réduction sur TOUTES les zones */
    o.dmg=.94;}
  else if(g.k==='dualwield'&&b){o.dmg=1.0;o.off=b;}
  return o;
}
const capChain=()=>S.capBase||5;

/* une créature, seule : le gabarit d'espèce autour de la puissance du lieu */
function mkEnemy(ck,power,rare,boss,suffixe){
  const C=CREATURE[ck];
  let v;
  if(C.vec)v=norm(V(C.vec));
  else{const e1=ri(0,4),mixed=Math.random()<.45;v=mixed?norm(V({[e1]:.7,[(e1+ri(1,4))%5]:.3})):V({[e1]:1});}
  let hp=Math.round(40*Math.pow(1.21,power)*C.hp),dmg=4.2*Math.pow(1.13,power)*C.dmg;
  let nom=C.cat==='corrompu'&&!C.vec?C.n+' '+pick(MOBS):C.n;
  if(rare){hp*=2.6;dmg*=1.7;}
  /* UN GARDIEN NOMME, et non une bete ordinaire six fois plus grosse. Le
     thème du donjon decide lequel ; un donjon majeur a le sien. Sa mecanique
     compte plus que ses chiffres — voir 17b-gardiens.js. */
  let gard=null;
  if(boss){
    const D=typeof gardienDe==='function'?gardienDe(dj()):null;
    if(D){
      gard=D===GARDIEN_MAJEUR?'__majeur':Object.keys(GARDIEN).find(k=>GARDIEN[k]===D);
      hp*=D.hp;dmg*=D.dmg;nom=D.n;
    } else {hp*=6;dmg*=1.7;nom='Gardien — '+nom;}
  }
  const e={hp,max:hp,rare,boss,gard,vec:v,cre:ck,
    /* un gardien nomme ne prend pas d'epithete : « Vieux Le Fendu » n'est
       le nom de personne */
    nom:(rare&&!gard?pick(EPITH)+' ':'')+nom+(suffixe||''),
    dmg,arm:Math.round((1+power*.55)*C.arm*(gard?(gardienDe(dj())||{arm:1}).arm:1)),
    gangue:gard&&(gardienDe(dj())||{}).trait==='carapace'?1:0,
    dt:C.dt||pick(['tranchant','percant','contondant']),
    delay:(boss?C.delay*.8:C.delay),wind:boss?C.wind*.85:C.wind,
    drop:C.mats.length?pick(C.mats):null,fuit:C.fuit,venin:C.venin,nuee:C.nuee,brule:C.brule,affaiblit:C.affaiblit,
    or:C.or||0,lootM:C.loot||1,livre:C.livre||0,embuscade:C.embuscade,
    st:[],cdStun:0,stg:0,pats:C.pat||['simple'],pat:'simple'};
  /* chacune a son propre télégraphe : une embuscade est déjà à mi-course */
  e.tt=e.embuscade?e.delay*.7:0;e.w=-1;
  noteBestiaire(ck,'v');
  return e;
}
/* le geste choisi pour ce cycle, et ce qu'il change */
function armePattern(e){
  e.pat=pick(e.pats||['simple']);
  const P=PATTERN[e.pat];
  e.wEff=e.wind*P.wm;
  return P;
}
/* la fenêtre de parade contre CE geste : une charge se lit de loin,
   un crachat ne se pare pas du tout */
function parryWinVs(e){
  const P=patOf(e);
  if(P.dist)return 0;
  return parryWin()*(P.win||1);
}
function spawn(){
  const c=here();
  const inDj=S.occ==='donjon'&&c.dj&&!c.dj.clear;
  const room=inDj?djRoom():null;
  if(inDj&&room&&room.mobs<=0){djAdvance();return;}
  /* « vision_nocturne » (F.7). La nuit fait deux choses ici : elle change le
     peuplement — plus de predateurs, moins de gibier — et elle fait venir les
     betes par une de plus. Qui voit dans le noir n'y perd plus rien : pour lui
     la case se peuple comme en plein jour. Ce n'est pas un bonus de degats,
     c'est une nuit qui cesse d'etre un mur. */
  const nuit=isNight()&&!inDj&&!eclaireIci()&&!don('nuitvue');
  const power=inDj?djPower():1+c.corr/26*(nuit?1.1:1)+c.depth*0.6;
  const rare=Math.random()<0.02;
  const boss=inDj&&room&&room.t==='boss';
  /* Un gardien a son espece a lui : c'est ce qui le rend reconnaissable
     d'un donjon a l'autre, silhouette comprise. */
  const gd=boss&&typeof gardienDe==='function'?gardienDe(c.dj):null;
  const ck=gd&&CREATURE[gd.cre]?gd.cre:creaturePool(c,inDj,nuit,power),C=CREATURE[ck];
  /* combien : une meute vient en meute, une salle gardée envoie sa garde,
     un camp est un camp. Le gardien vient seul — il suffit à lui-même. */
  let n=1;
  if(!boss){
    if(C.pack)n=ri(C.pack[0],C.pack[1]);
    if(inDj&&room&&room.t==='garde')n=Math.max(n,ri(2,3));
    if(c.poi==='camp'&&C.cat==='humain')n=Math.max(n,ri(1,3));
    if(nuit&&n<MAXENG&&Math.random()<.25)n++;
    n=Math.min(MAXENG,Math.max(1,Math.min(n,room?room.mobs:n)));
  }
  EE=[];
  for(let i=0;i<n;i++)EE.push(mkEnemy(ck,power,i===0&&rare,boss,n>1?' '+'ⅠⅡⅢⅣ'[i]:''));
  foc=0;refocus();hitN=0;
  /* la salle lâche tout son groupe d'un coup : elle se vide d'autant */
  if(inDj&&room)room.mobs=Math.max(0,room.mobs-n);
  if(n>1)log('<span class="bd">'+n+' '+CREATURE[ck].n.toLowerCase()+'s t\'encerclent.</span>');
}
/* une bête acculée peut fuir : pas de butin, un peu d'XP de perception */
function fuite(e){
  e=e||E;
  if(!e||!e.fuit||e.boss||e.rare)return false;
  if(e.hp>e.max*.4||Math.random()>.35)return false;
  log(e.nom+' s\'enfuit.');gainXp('perception_sk',15);
  removeEnemy(e);
  return true;
}
/* L'épuisement d'une case : de 1 (giboyeuse) à 4 (raclée jusqu'à l'os).
   Il n'entre en jeu qu'après trois purges — le temps de nettoyer un
   endroit reste sans pénalité. */
const vide=c=>1+Math.min(3,(c&&c.vide||0)/40);
/* retire une créature du groupe ; sans groupe, on relance le compte à rebours */
function removeEnemy(e){
  const i=EE.indexOf(e);
  if(i>=0)EE.splice(i,1);
  if(!EE.length){E=null;S.seg=[];S.bonus=0;
    /* le délai d'une case épuisée s'étire jusqu'à quatre fois ; sous terre,
       rien ne se raréfie — un donjon n'est pas un territoire de chasse */
    if(S.occ==='combat')respawnT=((isNight()&&!eclaireIci())?1.2:2.2)*vide(here());
    if(S.occ==='donjon')respawnT=1.3;
    return;}
  refocus(Math.min(foc,EE.length-1));
}
/* Rompre le contact (走) : jamais refusé, mais un dos tourné se paie.
   `force` : le repli automatique sous 25 % de PV. On fuit parce qu'on doit —
   ajouter une pénalité à une retraite qu'on n'a pas choisie serait injuste. */
function disengage(force){
  const list=force?[]:engaged();
  if(list.length){
    const dd=10+list.length*2;
    const jet=d20()+lv('discretion')/2+st('dex')/4;
    gainXp('discretion',20+list.length*10);
    if(jet<dd){
      let tot=0;
      list.forEach(e=>{const d=Math.max(1,e.dmg*.5*vmult(e.vec,avgVec(),multDef));S.hp-=d;tot+=d;});
      float('-'+Math.round(tot)+' 背','#C8332B');
      log('<span class="bd">Tu romps mal : '+Math.round(tot)+' de dégâts en te retournant (jet '+jet.toFixed(1)+' contre DD '+dd+').</span>');
      if(S.hp<=0){down();return;}
    } else log('<span class="gd">Tu te dégages proprement.</span>');
  }
  EE=[];E=null;S.seg=[];S.bonus=0;S.guard=false;
  S.occ=S.occ==='donjon'?'repos':'repos';sceneMode='';
}
/* --- jauge de chaîne (A.4.6) --- */
const transBonus=(prev,e)=>prev===null?0:prev===e?.10:e===gen(prev)?.35:.20;
function pushSeg(e){
  const prev=S.seg.length?S.seg[S.seg.length-1]:null;
  S.bonus+=transBonus(prev,e);S.seg.push(e);decay=0;
  return S.seg.length>=capChain();
}
function attack(heavy){
  const w=weapon();if(!E||!w)return;
  const F=FUNC[w.fn],sd=stanceNow();
  const PA=passives();
  let cost=(heavy?18:sd.end)*(1+PA.endcost);
  (w.aff||[]).forEach(a=>{if(a.id==='souffle')cost*=1-a.p.p/100;});
  if(heavy&&S.end<cost)return;
  const gasping=S.end<cost;
  S.end=Math.max(0,S.end-cost);endLock=1.5;
  let v=itemVec(w),e=domi(v);
  /* « Une attaque sur N porte tel élément ». L'affixe se tirait sur le butin
     et s'affichait sur la fiche de l'objet, mais n'était appliqué nulle part :
     le joueur lisait une promesse que le jeu ne tenait pas. Le coup porte
     désormais vraiment cet élément — il entre dans la chaîne Wu Xing, décide
     le matchup, et profite de la compétence d'élément correspondante. */
  (w.aff||[]).forEach(a=>{
    if(a.id==='porte'&&a.p.n>0&&hitN%a.p.n===0){e=a.p.e;v=V({[a.p.e]:1});}
  });
  /* Communion des cinq : l'élément tourne, payé en mana d'entretien (5.2).
     Elle se paie en mana et se choisit : elle prime sur l'affixe. */
  if(auto('rotation')&&S.seg.length&&S.mana>=4){
    const want=gen(S.seg[S.seg.length-1]);
    if(want!==e){S.mana-=4;e=want;v=V({[want]:1});}
  }
  /* Confus, on frappe quand meme — mais le geste ne s'inscrit pas dans la
     suite : la chaine se brise, et c'est bien pire que de perdre un coup.
     Un tiers du temps, comme le catalogue le demande (F.4). */
  if(hasStatus(S,'confusion')&&Math.random()<.3){
    S.seg=[];S.bonus=0;
    float('confus','#C08BC0');
  }
  /* UN COUP = UN SEGMENT, même si le balayage touche quatre créatures */
  const resolver=pushSeg(e);
  let extra=0;
  (w.aff||[]).forEach(a=>{
    if(a.id==='des'&&hitN%a.p.n===0)extra+=a.p.k;
    if(a.id==='bas'&&S.hp/maxHp()<a.p.s/100)extra+=a.p.k;});
  /* dégâts = dés × (dureté base / 20) × qualité × compétence × éléments × domination.
     Sur une arme de jet, c'est l'ÉLASTICITÉ qui remplace la dureté : un arc d'if
     porte loin, un arc d'ébène ne porte pas — le bois fait l'arme (A.4.1 / F.1). */
  const puis=isDist(w)?((w.ela||8)/45):(w.durBase/20);
  let base=roll(F.d[0]+extra,F.d[1])*puis*w.q*sf(lv(w.fn));
  base+=gemSum(w,'degats')*sf(lv(w.fn));                 /* gemmes : des dégâts plats, jamais une règle */
  const crit=d20()>=F.crit-PA.crit;if(crit)base*=1.8;
  /* « projectiles devies » (E.28) : le vent ne gene que ce qui vole */
  if(isDist(w))base*=meteoDist();
  const GB=gripBonus(),tir=isDist(w);
  /* à l'arc, c'est la Dextérité qui porte le trait, pas la Force (E.3) */
  base*=sd.dmg*(heavy?2.6*(1+PA.heavy):1)*(1+PA.dmg+buffOf('dmg')*.12)
    *(1+(st(tir?'dex':'force')-5)*.03)*GB.dmg;
  if(gasping)base*=.6;
  base*=v.reduce((a,p,i)=>a+p*(1+lv('el_'+EL[i].k)/100),0);
  base*=1+.05*S.seg.length;
  const enFace=engaged().length;
  (w.aff||[]).forEach(a=>{
    if(a.id==='corr'&&here().corr>=a.p.s)base*=1+a.p.p/100;
    if(a.id==='nuit'&&isNight())base*=1+a.p.p/100;
    if(a.id==='seul'&&enFace<=1)base*=1+a.p.p/100;
    if(a.id==='meute'&&enFace>=a.p.n)base*=1+a.p.p/100;});
  if(resolver){
    base*=1+S.bonus;
    /* l'harmonie ne paie que le coup qui ferme la chaîne */
    (w.aff||[]).forEach(a=>{if(a.id==='harmonie')base*=1+a.p.p/100;});
  }
  let pierce=PA.pierce;(w.aff||[]).forEach(a=>{if(a.id==='perce'&&hitN%a.p.n===0)pierce=Math.min(1,pierce+a.p.p/100);});
  const dtype=sd.t||F.t;
  hitN++;
  /* balayage : une hampe qui fauche, ou le passif du manuel — jamais un arc */
  const swp=tir?(PA.sweep||0):Math.max(F.reach>=2?.4:0,PA.sweep||0);
  const cibles=[[E,1]];
  if(swp)engaged().forEach(x=>{if(x!==E)cibles.push([x,swp]);});
  let premier=true,mortes=[];
  cibles.forEach(([tgt,part])=>{
    if(!tgt||tgt.hp<=0)return;
    let d=base*part;
    if(PA.execute&&tgt.hp<tgt.max*.3)d*=1+PA.execute;
    const em=vmult(v,tgt.vec,multOff);d*=em;
    (w.aff||[]).forEach(a=>{if(a.id==='contre'&&tgt.vec[a.p.e]>0)d*=1+a.p.p/100*tgt.vec[a.p.e];});
    /* armure : une part des dégâts, pas un seuil — une dague rapide n'est pas annulée par un cuir épais */
    const armEff=tgt.arm*(1-pierce);
    const dmg=Math.max(1,d*(1-armEff/(armEff+10)));
    const applied=Math.min(dmg,tgt.hp);      /* XP plafonnée aux PV restants (5.3) */
    tgt.hp-=dmg;dpsA+=dmg;
    let tag=premier?(resolver?'連':crit?'!':em>1.2?'剋':''):'薙';
    float((tag?tag+' ':'')+Math.round(dmg),EL[e].c,premier&&(resolver||crit));
    gainXp('el_'+EL[e].k,applied);gainXp(w.fn,applied);gainXp('t_'+dtype,applied);
    /* la Force vient du bras qui frappe, la Dextérité de la main qui vise (6.4) */
    gainStat(tir?'dex':'force',applied*.35);
    (w.aff||[]).forEach(a=>{
      if(a.id==='vol')S.hp=Math.min(maxHp(),S.hp+applied*a.p.p/100);
      if(a.id==='saigne')addStatus(tgt,'saignement',a.p.d,a.p.n);
      if(a.id==='brule')addStatus(tgt,'brulure',a.p.d,a.p.n);
      if(a.id==='assomme'&&hitN%a.p.n===0)addStatus(tgt,'etourdi',a.p.d,1);
      if(a.id==='gel')addStatus(tgt,'ralenti',a.p.d,1);
      if(a.id==='venin')addStatus(tgt,'poison',a.p.d,a.p.n);});
    /* le poison de lame (F.9) : il ne vient pas de l arme mais de ce qu on a
       etale dessus, et il vaut ce qu on n arrive pas a tuer autrement */
    if(S.lame>0)addStatus(tgt,'poison',6,Math.max(1,maxHp()*.010));
    /* « Huile d arme : prochain combat, +1d4 feu par coup » (F.5). Elle ne
       change ni l arme ni son vecteur : elle AJOUTE du feu a des coups qui
       n en portaient pas, ce qu aucune gemme ne fait sans serti. */
    if(S.huile>0){const f=roll(1,4);tgt.hp-=f;dpsA+=f;
      if(Math.random()<.25)addStatus(tgt,'brulure',3,Math.max(1,f*.4));}
    /* la frappe lourde chancelle, le résolveur enracine */
    if(heavy)addStatus(tgt,'etourdi',1+PA.staggerE,1);
    if(resolver){addStatus(tgt,'enracine',2.5,1);if(PA.weaken)addStatus(tgt,'affaibli',4,1);}
    if(premier&&PA.multi&&Math.random()<PA.multi&&tgt.hp>0){
      tgt.hp-=dmg*.6;dpsA+=dmg*.6;float('連撃',EL[e].c);}
    if(resolver||heavy)tgt.stg=Math.max(tgt.stg||0,.6);
    if(tgt.hp<=0)mortes.push(tgt);
    premier=false;
  });
  knock();
  if(typeof sfx==='function'){sfx(resolver?'resolve':crit?'crit':'hit');if(resolver||heavy)shake(resolver);}
  if(resolver){
    log('<span class="hi">Chaîne résolue ×'+(1+S.bonus).toFixed(2)+(cibles.length>1?' — '+cibles.length+' cibles':'')+'</span>');
    S.seg=[];S.bonus=0;questTick('chain',1);}
  mortes.forEach(m=>kill(m));
  /* la prise en main s'apprend en s'en servant */
  const gsk=grip().sk;
  if(gsk&&SKILLS[gsk])gainXp(gsk,base*.35);
  /* DEUX ARMES : la seconde frappe moins fort, mais elle POSE SON PROPRE SEGMENT.
     C'est la contrepartie du bouclier — l'un défend, l'autre fait tourner la chaîne. */
  if(GB.off&&E&&E.hp>0&&!heavy&&Math.random()<.35+lv('dualwield')*.02){
    const ov=itemVec(GB.off),oe=domi(ov);
    const ores=pushSeg(oe);
    let od=roll(FUNC[GB.off.fn].d[0],FUNC[GB.off.fn].d[1])*(GB.off.durBase/20)*GB.off.q*sf(lv(GB.off.fn))*.45;
    od*=vmult(ov,E.vec,multOff);
    if(ores)od*=1+S.bonus;
    const oarm=E.arm*(1-PA.pierce);
    od=Math.max(1,od*(1-oarm/(oarm+10)));
    E.hp-=od;dpsA+=od;
    float((ores?'連 ':'副 ')+Math.round(od),EL[oe].c,ores);
    gainXp('dualwield',od*.6);gainXp(GB.off.fn,Math.min(od,E.hp+od));
    if(ores){log('<span class="hi">Chaîne résolue par la seconde main ×'+(1+S.bonus).toFixed(2)+'</span>');
      S.seg=[];S.bonus=0;questTick('chain',1);}
    if(E.hp<=0)kill(E);
  }
  if(E&&E.hp>0)fuite(E);
}
/* --- coup de la créature : la zone sort de la géométrie (6.2) --- */
function pickZone(){
  const tot=ZK.reduce((a,k)=>a+ZONE[k].w,0);
  let r=Math.random()*tot;
  for(const k of ZK){r-=ZONE[k].w;if(r<=0)return k;}
  return 'torse';
}
function resolveHit(q,atk){
  atk=atk||E;
  if(!atk)return;
  const P=patOf(atk);
  /* un geste en plusieurs temps : on résout chaque coup, puis on remet le télégraphe */
  if((P.hits||1)>1&&!atk.enCours){
    atk.enCours=1;
    for(let i=0;i<P.hits;i++){if(!atk||atk.hp<=0||!E)break;resolveHit(q,atk);}
    if(atk)atk.enCours=0;
    return;
  }
  const dos=atk!==E;                     /* dans le dos : impossible à parer, et ça frappe plus fort */
  if(dos&&q===2)q=1;
  if(P.dist&&q===2)q=1;                  /* on ne pare pas un projectile */
  const tgt=pickTarget();
  if(tgt&&q!==2){
    hitCompanion(tgt,atk.dmg*P.dm*vmult(atk.vec,V({[tgt.el]:1}),multDef));
    if(!P.aoe){atk.w=-1;atk.tt=0;return;}
  }
  /* un balayage n'épargne personne : il prend l'escorte ET toi */
  if(P.aoe){
    escortList().filter(c=>c!==tgt&&c.order!=='suivre').forEach(c=>
      hitCompanion(c,atk.dmg*P.dm*.6*vmult(atk.vec,V({[c.el]:1}),multDef)));
  }
  const zk=pickZone(),z=ZONE[zk];
  const sl=SLOTS.find(x=>x.zone===zk),it=eqOf(sl.k);
  /* la rage d'un gardien : chaque blessure le rend plus dangereux (17b) */
  const raw=atk.dmg*(atk.rage||1)*P.dm*z.mult*vmult(atk.vec,avgVec(),multDef)*(hasStatus(atk,'affaibli')?.7:1)*(dos?backMul():1);
  if(S.dodge&&q!==2){S.dodge=0;float('影 esquive','#B9A7D6');gainXp('esquive',raw);atk.w=-1;atk.tt=0;return;}
  const G=grip(),GB=gripBonus();
  if(q===2){                                    /* parade parfaite */
    S.end=Math.min(100,S.end+10);atk.stg=.6;
    const w=weapon(),PA=passives();
    (w&&w.aff||[]).forEach(a=>{if(a.id==='parade')S.end=Math.min(100,S.end+a.p.k);});
    if(PA.riposte){const rip=atk.max*.06;atk.hp-=rip;dpsA+=rip;float('返撃','#6FBFA0');if(atk.hp<=0)kill(atk);}
    if(it)gainXp('c_'+it.cons,raw);
    gainXp('encaissement',raw);gainXp('esquive',raw*.4);
    gainStat('dex',raw*.5);                 /* une parade parfaite, c'est de la main */
    /* LE BOUCLIER dans un jeu de rotation : une parade parfaite POSE SON ÉLÉMENT
       dans la chaîne. Il ne casse plus le cycle — il y participe, en défendant. */
    if(G.k==='bouclier'&&S.eq.main2){
      const be=domi(itemVec(S.eq.main2));
      const bres=pushSeg(be);
      gainXp('bouclier',raw*1.2);
      float('盾 '+EL[be].g,EL[be].c,bres);
      if(bres){log('<span class="hi">Chaîne résolue au bouclier ×'+(1+S.bonus).toFixed(2)+'</span>');
        const bd=raw*2*(1+S.bonus);atk.hp-=bd;dpsA+=bd;
        S.seg=[];S.bonus=0;questTick('chain',1);
        if(atk.hp<=0){kill(atk);return;}}
    }
    float('返 '+z.g,'#6FBFA0');if(typeof sfx==='function')sfx('parry');
  } else {
    const inc=raw*(q===1?.20:1);
    const cost=q===1?(12+inc/4)*(1+passives().gardecost):0;
    const red=(it?armorOf(zk)*consMult(it.cons,atk.dt):0)+buffOf('def')*2+passives().def+GB.red;
    if(GB.red>0)gainXp('bouclier',Math.min(GB.red,inc)*.8);
    const fin=Math.max(1,inc-red);
    const evite=raw-fin;
    if(it&&evite>0)gainXp('c_'+it.cons,evite);   /* l'armure gagne ce qu'elle épargne */
    if(evite>0)gainXp('encaissement',evite*.5);
    gainStat('endu',fin*1.2);               /* l'Endurance vient des coups reçus */
    S.hp-=fin;S.end=Math.max(0,S.end-cost);
    float('-'+Math.round(fin)+(dos?' 背':' ')+(P.g!=='一'?P.g:z.g),'#C8332B');
    if(P.st&&Math.random()<.55)addStatus(S,P.st,3.5,Math.max(1,fin*.12));
    if(typeof sfx==='function'){sfx('hurt');flashHp();if(q===0&&fin>maxHp()*.12)shake(false);}
    /* certaines créatures marquent : saignement fréquent, venin, brûlure, étourdissement rare et borné */
    if(q===0){
      if(Math.random()<(atk.boss?.35:.14))addStatus(S,'saignement',3,Math.max(1,fin*.12));
      if(atk.venin&&Math.random()<.4)addStatus(S,'poison',6,Math.max(1,maxHp()*.007));
      if(atk.brule&&Math.random()<.5)addStatus(S,'brulure',3,Math.max(1,fin*.15));
      if(atk.affaiblit&&Math.random()<.4)addStatus(S,'affaibli',5,1);
      if(atk.rare&&Math.random()<.25)addStatus(S,'etourdi',1.4,1);
    }
    if(q===1&&S.end<=0){endLock=2.4*(1+passives().stagger);log('<span class="bd">Garde rompue — chancellement</span>');}
    if(S.hp<=0)down();
  }
  atk.w=-1;atk.tt=0;
}
const consMult=(c,t)=>CONS[c].fort.includes(t)?.8:CONS[c].faible.includes(t)?1.25:1;
/* mort (A.10) : −10 % de l'or porté, aucune compétence perdue, réveil au dernier lit — sinon sur place */
function down(){
  /* « Autel domestique : resurrection a domicile » (F.6). Ici la mort ne
     coute pas une resurrection mais un dixieme de la bourse ; un autel chez
     soi en reprend la moitie. C'est le seul batiment qui rende quelque chose
     quand on echoue, et cela vaut d'etre construit avant de descendre. */
  const autels=typeof meubleTerritoire==='function'?meubleTerritoire('autelmaison'):0;
  const perte=Math.floor(S.or*(autels?.05:.1));S.or-=perte;
  S.hp=maxHp();S.end=100;S.seg=[];S.bonus=0;E=null;EE=[];foc=0;S.st=[];
  S.occ='repos';S.resume=null;sceneMode='';
  const lit=S.claims.map(k=>S.world[k]).find(c=>c&&c.plots&&c.plots.some(p=>p&&p.t==='batiment'&&p.slots.some(sl=>sl&&sl.k==='lit')));
  let ou='';
  if(lit&&(lit.x!==S.pos[0]||lit.y!==S.pos[1])){S.pos=[lit.x,lit.y];S.target=null;ou=' · réveil dans ton lit, '+(lit.town||BIOME[lit.b].n);}
  S.deaths=(S.deaths||0)+1;if(typeof sfx==='function')sfx('down');
  cutIn('死','Tu tombes','−'+perte+' or'+(autels?' (autel domestique : moitié moins)':'')+' · aucune compétence perdue'+ou);
}
function kill(who){
  const K=who||E;
  if(!K||K.dead)return;
  K.dead=1;
  if(K.cre)noteBestiaire(K.cre,'t');
  const c=here();
  /* les bêtes ne portent pas de bourse : quelques pièces au mieux — les humains, si (7.6) */
  const g=Math.round((1+c.corr*.08+c.depth*1.5)*(K.rare?4:1)*(K.boss?6:1)*(1+(K.or||0)));
  S.or+=g;
  if(K.drop)S.mat[K.drop]=(S.mat[K.drop]||0)+1+(K.rare?2:0);
  if(K.cre&&CREATURE[K.cre].cat!=='humain'&&CREATURE[K.cre].cat!=='corrompu')creatureDrops(K);
  /* la statue 1:1 — trophée de chasse ultime (F.3) */
  if(Math.random()<.0005&&K.cre){const C=CREATURE[K.cre];
    S.items.push({id:'i'+(S.nid++),kind:'statue',nom:'Statue de '+C.n.toLowerCase()+' (1:1)',parts:[],q:1,dur:0,durBase:0,de:0,mana:0,vec:[.2,.2,.2,.2,.2],rar:3,val:C.lv*40+40,slots:0});
    cutIn('像','Statue de '+C.n.toLowerCase(),'la créature elle-même, changée en pierre — trophée, prestige, et '+(C.lv*40+40)+' or chez un érudit');}
  if(K.livre&&Math.random()<.5)dropBook(2);
  c.kills=(c.kills||0)+1;
  if(c.kills%5===0){c.cleared++;
    if(c.cleared===3)cutIn('浄',(c.town||BIOME[c.b].n)+' se calme','la corruption reflue chaque semaine');}
  /* Une fois la case purgée, chaque bête abattue vide un peu plus les
     environs. C'était le trou de la boucle : on pouvait rester au même
     endroit indéfiniment, à un or par créature, sans que rien ne le dise
     ni ne pousse à lever le camp. Le gibier se raréfie, et revient si on
     laisse l'endroit tranquille (voir weekly()). */
  if(c.cleared>=3){
    const av=vide(c);c.vide=(c.vide||0)+1;
    if(av<2&&vide(c)>=2)cutIn('疎',(c.town||BIOME[c.b].n)+' se dépeuple',
      'à force d\'y chasser, il n\'y reste plus grand-chose — va voir ailleurs, ou laisse la case respirer quelques semaines');
  }
  float('+'+g+' or','#D9A441');if(typeof sfx==='function')sfx('kill');
  log(K.nom+' tombe. <span class="gd">+'+g+' or</span>');
  questTick('kill',1,{cat:K.cre&&CREATURE[K.cre]?CREATURE[K.cre].cat:'corrompu',rare:K.rare,boss:K.boss});noteRate('kill');
  if(K.rare||K.boss||Math.random()<(.003+c.corr/2500)*(K.lootM||1))dropLoot(c,K.rare);
  if(Math.random()<.006)maybeScroll(pick(cellMats(c)));
  if(Math.random()<.004+c.corr/9000)dropBook(Math.round(c.corr/12));
  /* l'assaut d'une ville : chaque mort compte dans la garnison */
  if(S.assaut&&S.occ==='combat'){
    const t=S.assaut;
    t.pop=Math.max(0,t.pop-1);
    if(t.pop<=0){t.abandonne=1;S.assaut=null;S.occ='repos';EE=[];E=null;sceneMode='';
      cutIn('滅',t.nom+' est décimé','les bâtiments restent, la population n\'est plus');return;}
    if(garrison(t)<Math.round(t.pop*.35*2)*.25){
      S.assaut=null;S.occ='repos';EE=[];E=null;sceneMode='';
      cutIn('降','La garnison de '+t.nom+' est brisée','tu peux exiger son allégeance');return;}
  }
  removeEnemy(K);
  /* la salle de donjon n'est franchie qu'une fois le groupe entier à terre */
  if(!EE.length&&S.occ==='donjon'&&c.dj&&!c.dj.clear){
    const room=djRoom();
    if(room&&room.mobs<=0){djAdvance();return;}
  }
}
/* --- loot paramétré (A.12) : l'atelier améliore, le donjon transforme --- */
function dropLoot(c,rare){
  /* la rareté suit la corruption et la profondeur, jamais le niveau du joueur (A.12) */
  const rar=rare?ri(2,3):(Math.random()<.05+c.corr/300+c.depth*.04?2:1);
  /* les matériaux du lieu, plus un fond commun : chaque composant reçoit une matière qui lui convient */
  const mats=cellMats(c).concat(['fer','chene','cuir','os']);
  /* Une trouvaille sur six est une PARURE. Elle ne remplace ni l'arme ni
     l'armure : elle va dans l'un des six emplacements qui n'avaient jamais
     rien recu, et ce qu'elle donne ne se joue pas en combat. */
  if(Math.random()<.17){
    const kind=pick(PARK),P=PARURE[kind];
    const dispo=P.mats.filter(m=>mats.includes(m));
    const mk=dispo.length&&Math.random()<.6?pick(dispo):pick(P.mats);
    const it2=mkParure(kind,mk,+((0.85+Math.random()*0.6+(rare?.35:0))*Math.min(1.6,1+c.corr/250+c.depth*.04)).toFixed(2));
    if(it2){
      it2.rar=rar;
      if(!sacPlein()){
        S.items.push(it2);questTick('loot',1,rar);
        cutIn('環',it2.nom,RARITY[rar].n+' · '+affListe(it2).join(' · '),false,it2);
      }
      return;
    }
  }
  /* « La richesse suit toujours le danger » (3.0) — c'était écrit, ce n'était
     pas fait. La corruption pilotait la RARETÉ (donc les affixes) et la
     fréquence des trouvailles, mais la qualité de la pièce était tirée à plat :
     une épée ramassée dans une case paisible valait celle d'une terre
     mortelle, à un affixe près. La courbe d'équipement l'a montré — médiane 9,8
     à corruption zéro contre 10,7 à soixante-dix, soit rien. Le lieu pèse
     désormais sur la qualité, sans jamais rattraper ce qu'un forgeron
     accompli sait faire de ses mains. */
  /* Le plafond mentait sur ses propres regles. Il tombait a 1,30 alors que
     corruption et profondeur pouvaient monter a 1,50 : au-dela de soixante-
     quinze de corruption, plus rien n'augmentait, et la profondeur — l'autre
     axe de danger — ne comptait alors plus DU TOUT, puisque le plafond etait
     deja atteint sans elle. Descendre au fond d'une terre mortelle ne payait
     pas un gramme de plus que d'y rester en surface. Le plafond ne sert plus
     que de garde-fou contre une sauvegarde abimee ; les deux axes courent
     jusqu'au bout, et la profondeur pese desormais autant qu'elle coute. */
  const risque=Math.min(1.60,1+c.corr/250+c.depth*.04);
  const qLoot=()=>+((0.7+Math.random()*0.9+(rare?.3:0))*risque).toFixed(2);
  let it;
  if(Math.random()<.5){
    const fn=pick(Object.keys(FUNC));
    const parts=FUNC[fn].comp.map(ct=>partFor(ct,mats));
    parts.push(partFor('fixations',mats));
    it=mkItem('arme',fn,parts,qLoot());
  } else {
    const sl=pick(SLOTS.filter(x=>x.zone)).k;
    const ct=pick(ARMPARTS);
    const major=partFor(ct,mats);
    const parts=[major,partFor('sangles',mats),partFor('fixations',mats)];
    it=mkItem('armure',sl,parts,qLoot());
    it.cons=COMP[ct].cons;
    it.nom=armorName(sl,it.cons,major.mk);
  }
  it.rar=rar;
  /* sertissures tirées au loot (A.12) : commun 0 · inhabituel 0-1 · rare 1-2 · exceptionnel 2-3 dont une occupée */
  it.slots=rar===0?0:rar===1?ri(0,1):rar===2?ri(1,2):ri(2,3);
  if(rar===3&&typeof randomGem==='function'){const g=randomGem(c);if(g&&!(GEMSPEC[g.spec].arme&&it.kind!=='arme')){it.gems=[g];applyGemVec(it);applyGemQ(it);}}
  it.aff=tirerN(AFF,RARITY[rar].a).map(a=>({id:a.id,p:a.r()}));
  it.aff.forEach(a=>{if(a.id==='vecaff'){const v=it.vec.slice();v[a.p.e]+=a.p.p/100;it.vec=rnd4(norm(v));}});
  if(rar>=2)it.nom=pick(NAME_A)+' '+it.nom+' '+pick(NAME_B);
  /* le sac a un fond : au-delà, le banal reste par terre, ou part au creuset */
  if(sacPlein()){
    const porte=it.kind==='arme'?weapon():S.eq[it.slot];
    const mieux=!porte||itemScore(it)>itemScore(porte);
    if(!mieux){
      if(auto('fondeur')){const g=Math.round(itemValue(it)/3);S.or+=g;
        log('Sac plein — '+it.nom+' passe au creuset (+'+g+' or)');}
      else log('<span class="bd">Sac plein ('+S.items.length+'/'+sacMax()+') — '+it.nom+' reste sur place.</span>');
      return;
    }
    /* il vaut mieux que ce qu'on porte : on fait de la place en fondant le pire du sac */
    const pire=S.items.map((x,i)=>({x,i})).filter(x=>!x.x.artefact&&x.x.kind!=='statue')
      .sort((a,b)=>itemScore(a.x)-itemScore(b.x))[0];
    if(pire){const g=scrapItem(pire.i);log('Sac plein — '+pire.x.nom+' fondu pour faire place (+'+g+' or)');}
  }
  S.items.push(it);questTick('loot',1,rar);
  cutIn('宝',it.nom,RARITY[rar].n+' · '+(it.aff.length?it.aff.length+' affixe(s)':'sans affixe')+(it.slots?' · '+it.slots+' sertissure'+(it.slots>1?'s':''):''),false,it);
}
