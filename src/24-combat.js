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
const d20=()=>ri(1,20);
/* coups contextuels : c'est le déplacement qui choisit la frappe */
const STANCE=[
  {g:'止',n:'Standard',dmg:1.00,spd:1.00,end:8, t:null,       win:1.0, d:'à l\'arrêt — le coup de référence'},
  {g:'進',n:'Estoc',   dmg:1.15,spd:0.95,end:8, t:'percant',  win:.85, d:'en avançant — perforant, allonge +1'},
  {g:'退',n:'Arrêt',   dmg:0.75,spd:1.45,end:6, t:null,       win:1.6, d:'en reculant — rapide, peu coûteux, garde ouverte'},
  {g:'駆',n:'Charge',  dmg:1.45,spd:0.70,end:15,t:'contondant',win:.7, d:'en sprintant — contondant, recul'},
];
const MOBN=['Rôdeur','Éclat','Racine','Brume','Gardien','Cendre','Veine','Sylve','Écho','Carcasse','Suaire','Ronce'];
const MOBS=['de pierre','noueuse','mordante','fêlé','errante','de fer','muette','de jade','affamé','ancienne','sans nom','du seuil'];
const EPITH=['Ancestral','Prismatique','Doré','Argenté','Immémorial','Sans-Nom'];
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
];
const RARITY=[{n:'commun',c:'#7E9187',a:0},{n:'inhabituel',c:'#6FBFA0',a:1},
              {n:'rare',c:'#3E7CB1',a:2},{n:'exceptionnel',c:'#D9A441',a:3}];
const NAME_A=['Fervente','Longue','Brève','Muette','Noire','Claire','Ancienne'];
const NAME_B=['de braise','de givre','du colosse','des racines','du filon','de la crue','des cendres'];

let E=null,atkT=0,teleT=0,wind=-1,stagger=0,decay=0,hitN=0,dpsA=0,dps=0,dpsT=0;
const maxHp=()=>Math.round(40+st('endu')*8+lv('encaissement')*4);
const weapon=()=>S.eq.main1&&S.eq.main1.kind==='arme'?S.eq.main1:null;
const stanceNow=()=>STANCE[S.stance||0];
function wSpeed(){
  const w=weapon();if(!w)return 1.2;
  const F=FUNC[w.fn];
  return F.spd*Math.pow(20/Math.max(5,w.de),0.75/2)*stanceNow().spd*(1+(st('dex')-5)*.015);
}
const parryWin=()=>0.25*(1+lv('esquive')*0.01+passives().win)*stanceNow().win;
const capChain=()=>S.capBase||5;

function spawn(){
  const c=here();
  const inDj=S.occ==='donjon'&&c.dj&&!c.dj.clear;
  const room=inDj?djRoom():null;
  if(inDj&&room&&room.mobs<=0){djAdvance();return;}
  const nuit=isNight()&&!inDj&&!eclaireIci();
  const power=inDj?djPower():1+c.corr/26*(nuit?1.1:1)+c.depth*0.6;
  const rare=Math.random()<0.02;
  const e1=ri(0,4),mixed=Math.random()<.45;
  const v=mixed?norm(V({[e1]:.7,[(e1+ri(1,4))%5]:.3})):V({[e1]:1});
  let hp=Math.round(26*Math.pow(1.19,power)),dmg=4.2*Math.pow(1.12,power);
  if(rare){hp*=2.6;dmg*=1.7;}
  const boss=inDj&&room&&room.t==='boss';
  if(boss){hp*=6;dmg*=1.7;}
  E={hp,max:hp,rare,boss,vec:v,
    nom:(boss?'Gardien — ':'')+(rare?pick(EPITH)+' ':'')+pick(MOBN)+' '+pick(MOBS),
    dmg,arm:Math.round(1+power*.55),
    dt:pick(['tranchant','percant','contondant']),
    delay:boss?2.4:2.9,wind:boss?1.1:1.35,
    drop:pick(['os','cuir','ecaille'])};
  teleT=0;wind=-1;stagger=0;hitN=0;E.st=[];E.cdStun=0;
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
  const cost=heavy?18:sd.end;
  if(heavy&&S.end<cost)return;
  const gasping=S.end<cost;
  S.end=Math.max(0,S.end-cost);endLock=1.5;
  let v=itemVec(w),e=domi(v);
  /* Communion des cinq : l'élément tourne, payé en mana d'entretien (5.2) */
  if(auto('rotation')&&S.seg.length&&S.mana>=4){
    const want=gen(S.seg[S.seg.length-1]);
    if(want!==e){S.mana-=4;e=want;v=V({[want]:1});}
  }
  const resolver=pushSeg(e);
  let extra=0;
  (w.aff||[]).forEach(a=>{
    if(a.id==='des'&&hitN%a.p.n===0)extra+=a.p.k;
    if(a.id==='bas'&&S.hp/maxHp()<a.p.s/100)extra+=a.p.k;});
  /* dégâts = dés × (dureté base / 20) × qualité × compétence × éléments × domination */
  let base=roll(F.d[0]+extra,F.d[1])*(w.durBase/20)*w.q*sf(lv(w.fn));
  const crit=d20()>=F.crit;if(crit)base*=1.8;
  base*=sd.dmg*(heavy?2.6:1)*(1+PA.dmg+buffOf('dmg')*.12)*(1+(st('force')-5)*.03);
  if(gasping)base*=.6;
  base*=v.reduce((a,p,i)=>a+p*(1+lv('el_'+EL[i].k)/100),0);
  const em=vmult(v,E.vec,multOff);base*=em;
  base*=1+.05*S.seg.length;
  (w.aff||[]).forEach(a=>{
    if(a.id==='contre'&&E.vec[a.p.e]>0)base*=1+a.p.p/100*E.vec[a.p.e];
    if(a.id==='corr'&&here().corr>=a.p.s)base*=1+a.p.p/100;});
  let tag='';
  if(resolver){base*=1+S.bonus;tag='連';}else if(crit)tag='!';else if(em>1.2)tag='剋';
  let pierce=PA.pierce;(w.aff||[]).forEach(a=>{if(a.id==='perce'&&hitN%a.p.n===0)pierce=Math.min(1,pierce+a.p.p/100);});
  const dtype=sd.t||F.t;
  const dmg=Math.max(1,base-E.arm*(1-pierce));
  const applied=Math.min(dmg,E.hp);      /* XP plafonnée aux PV restants (5.3) */
  hitN++;E.hp-=dmg;dpsA+=dmg;
  float((tag?tag+' ':'')+Math.round(dmg),EL[e].c,resolver||crit);knock();
  gainXp('el_'+EL[e].k,applied);gainXp(w.fn,applied);gainXp('t_'+dtype,applied);
  (w.aff||[]).forEach(a=>{
    if(a.id==='vol')S.hp=Math.min(maxHp(),S.hp+applied*a.p.p/100);
    if(a.id==='saigne'&&E)addStatus(E,'saignement',a.p.d,a.p.n);
    if(a.id==='brule'&&E)addStatus(E,'brulure',a.p.d,a.p.n);
    if(a.id==='assomme'&&E&&hitN%a.p.n===0)addStatus(E,'etourdi',a.p.d,1);});
  /* la frappe lourde chancelle, le résolveur enracine */
  if(E&&heavy)addStatus(E,'etourdi',1,1);
  if(E&&resolver)addStatus(E,'enracine',2.5,1);
  if(resolver){
    log('<span class="hi">Chaîne résolue ×'+(1+S.bonus).toFixed(2)+' — '+Math.round(dmg)+'</span>');
    S.seg=[];S.bonus=0;}
  if(E&&E.hp<=0)kill();
  else if(resolver||heavy)stagger=Math.max(stagger,.6);
  if(E&&PA.multi&&Math.random()<PA.multi){E.hp-=dmg*.6;dpsA+=dmg*.6;float('連撃',EL[e].c);
    if(E.hp<=0)kill();}
}
/* --- coup de la créature : la zone sort de la géométrie (6.2) --- */
function pickZone(){
  const tot=ZK.reduce((a,k)=>a+ZONE[k].w,0);
  let r=Math.random()*tot;
  for(const k of ZK){r-=ZONE[k].w;if(r<=0)return k;}
  return 'torse';
}
function resolveHit(q){
  if(!E)return;
  const tgt=pickTarget();
  if(tgt&&q!==2){
    hitCompanion(tgt,E.dmg*vmult(E.vec,V({[tgt.el]:1}),multDef));
    wind=-1;teleT=0;return;
  }
  const zk=pickZone(),z=ZONE[zk];
  const sl=SLOTS.find(x=>x.zone===zk),it=eqOf(sl.k);
  const raw=E.dmg*z.mult*vmult(E.vec,avgVec(),multDef)*(hasStatus(E,'affaibli')?.7:1);
  if(q===2){                                    /* parade parfaite */
    S.end=Math.min(100,S.end+10);stagger=.6;
    const w=weapon(),PA=passives();
    (w&&w.aff||[]).forEach(a=>{if(a.id==='parade')S.end=Math.min(100,S.end+a.p.k);});
    if(PA.riposte&&E){const rip=E.max*.06;E.hp-=rip;dpsA+=rip;float('返撃','#6FBFA0');if(E.hp<=0)kill();}
    if(it)gainXp('c_'+it.cons,raw);
    gainXp('encaissement',raw);gainXp('esquive',raw*.4);
    float('返 '+z.g,'#6FBFA0');
  } else {
    const inc=raw*(q===1?.20:1);
    const cost=q===1?(12+inc/4)*(1+passives().gardecost):0;
    const red=(it?armorOf(zk)*consMult(it.cons,E.dt):0)+buffOf('def')*2;
    const fin=Math.max(1,inc-red);
    const evite=raw-fin;
    if(it&&evite>0)gainXp('c_'+it.cons,evite);   /* l'armure gagne ce qu'elle épargne */
    if(evite>0)gainXp('encaissement',evite*.5);
    S.hp-=fin;S.end=Math.max(0,S.end-cost);
    float('-'+Math.round(fin)+' '+z.g,'#C8332B');
    /* certaines créatures marquent : saignement fréquent, étourdissement rare et borné */
    if(q===0&&E){
      if(Math.random()<(E.boss?.35:.14))addStatus(S,'saignement',3,Math.max(1,fin*.12));
      if(E.rare&&Math.random()<.25)addStatus(S,'etourdi',1.4,1);
    }
    if(q===1&&S.end<=0){endLock=2.4;log('<span class="bd">Garde rompue — chancellement</span>');}
    if(S.hp<=0)down();
  }
  wind=-1;teleT=0;
}
const consMult=(c,t)=>CONS[c].fort.includes(t)?.8:CONS[c].faible.includes(t)?1.25:1;
function down(){
  const perte=Math.floor(S.or*.1);S.or-=perte;
  S.hp=maxHp();S.end=100;S.seg=[];S.bonus=0;E=null;
  S.occ='repos';sceneMode='';
  cutIn('死','Tu tombes','−'+perte+' or · aucune compétence perdue');
}
function kill(){
  const c=here();
  const g=Math.round((5+c.corr*.55+c.depth*5)*(E.rare?3:1));
  S.or+=g;
  S.mat[E.drop]=(S.mat[E.drop]||0)+1+(E.rare?2:0);
  creatureDrops();
  if(S.assaut&&S.occ==='combat'){
    const t=S.assaut;
    t.pop=Math.max(0,t.pop-1);
    if(t.pop<=0){t.abandonne=1;S.assaut=null;S.occ='repos';E=null;sceneMode='';
      cutIn('滅',t.nom+' est décimé','les bâtiments restent, la population n\'est plus');return;}
    if(garrison(t)<Math.round(t.pop*.35*2)*.25){
      S.assaut=null;S.occ='repos';E=null;sceneMode='';
      cutIn('降','La garnison de '+t.nom+' est brisée','tu peux exiger son allégeance');return;}
  }
  if(S.occ==='donjon'&&c.dj&&!c.dj.clear){
    const room=djRoom();
    if(room){room.mobs--;
      if(room.mobs<=0){djAdvance();return;}}
  }
  c.kills=(c.kills||0)+1;
  if(c.kills%5===0){c.cleared++;
    if(c.cleared===3)cutIn('浄',(c.town||BIOME[c.b].n)+' se calme','la corruption reflue chaque semaine');}
  float('+'+g+' or','#D9A441');
  log(E.nom+' tombe. <span class="gd">+'+g+' or</span>');
  questTick('kill',1);noteRate('kill');
  if(E.rare||Math.random()<.03+c.corr/1400)dropLoot(c,E.rare);
  if(Math.random()<.02)maybeScroll(pick(cellMats(c)));
  if(Math.random()<.008+c.corr/6000)dropBook(Math.round(c.corr/12));
  S.seg=[];S.bonus=0;
  E=null;
  if(S.occ==='combat')respawnT=(isNight()&&!eclaireIci())?.6:1.2;
  if(S.occ==='donjon')respawnT=.9;
}
/* --- loot paramétré (A.12) : l'atelier améliore, le donjon transforme --- */
function dropLoot(c,rare){
  const rar=rare?ri(2,3):(Math.random()<.25?2:1);
  const mats=cellMats(c);
  const m1=pick(mats),m2=pick(mats);
  let it;
  if(Math.random()<.5){
    const fn=pick(Object.keys(FUNC));
    const parts=FUNC[fn].comp.map((ct,i)=>({ct,f:COMP[ct].forms[0],mk:i?m2:m1}));
    parts.push({ct:'fixations',f:'lingot',mk:m1});
    it=mkItem('arme',fn,parts,+(0.9+Math.random()*1.1).toFixed(2));
  } else {
    const sl=pick(SLOTS.filter(x=>x.zone)).k;
    const majors=ARMPARTS.filter(ct=>COMP[ct].forms.includes('lingot')||COMP[ct].forms.includes('tanne')||COMP[ct].forms.includes('brut'));
    const ct=pick(majors);
    const parts=[{ct,f:COMP[ct].forms[0],mk:m1},{ct:'sangles',f:'tanne',mk:'cuir'},{ct:'fixations',f:'lingot',mk:m1}];
    it=mkItem('armure',sl,parts,+(0.9+Math.random()*1.1).toFixed(2));
    it.cons=COMP[ct].cons;
    it.nom=SLOTS.find(x=>x.k===sl).n+' — '+CONS[it.cons].n+' de '+matName(m1);
  }
  it.rar=rar;
  it.aff=AFF.slice().sort(()=>Math.random()-.5).slice(0,RARITY[rar].a).map(a=>({id:a.id,p:a.r()}));
  it.aff.forEach(a=>{if(a.id==='vecaff'){const v=it.vec.slice();v[a.p.e]+=a.p.p/100;it.vec=norm(v);}});
  if(rar>=2)it.nom=pick(NAME_A)+' '+it.nom+' '+pick(NAME_B);
  S.items.push(it);
  cutIn('宝',it.nom,RARITY[rar].n+' · '+(it.aff.length?it.aff.length+' affixe(s)':'sans affixe'));
}
