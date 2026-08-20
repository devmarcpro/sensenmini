/* Sensen Mini — 28-loop.js
   Boucle de simulation
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== BOUCLE ===== */
let harvT=0,expT=0,uiT=9,ptrDown=false,craftT=0,endLock=0,respawnT=0,hitFx=0,spellT=0,manaT=0,rateT=0;
function step(dt){
  tickClock(dt);
  S.faim=Math.max(0,S.faim-dt/90*(S.race==='sylvide'?.5:1));
  tickBuffs(dt);
  if(buffOf('regenhp'))S.hp=Math.min(maxHp(),S.hp+buffOf('regenhp')*dt);
  /* stress thermique : malus progressifs, puis dégâts (E.28) */
  const ts=tempStress();
  if(ts){
    const sev=Math.min(1,ts.e/25);
    if(ts.e>10&&Math.random()<dt*.8)S.hp=Math.max(1,S.hp-maxHp()*.012*(1+(ts.e-10)/10));
    S.thermal=ts.e>10?0:1-Math.min(.8,sev);
  } else S.thermal=1;
  manaT+=dt;
  if(manaT>=1){manaT=0;
    const chance=S.occ==='repos'?.5:.125;
    /* l'XP est fixe par proc : sinon le rendement croît avec le niveau et la courbe s'emballe.
       On ne médite pas affamé : sous 25 de faim, le mana revient mais n'apprend rien. */
    if(Math.random()<chance*(S.race==='elfe'?1.2:1)){const r=1+lv('meditation')*.2;
      S.mana=Math.min(maxMana(),S.mana+r);if(S.faim>25)gainXp('meditation',30);}}
  if(S.mana>maxMana())S.mana=maxMana();
  if(S.faim<=0&&Math.random()<dt/30)S.hp=Math.max(1,S.hp-maxHp()*.01);
  if(S.occ==='repos'){
    if(S.st&&S.st.length)tickStatus(S,dt,true);
    S.end=Math.min(100,S.end+9*dt);
    if(S.faim>25)S.hp=Math.min(maxHp(),S.hp+maxHp()*.015*dt*(S.thermal||1));
    if(S.resume&&S.end>=98&&((S.resume!=='combat'&&S.resume!=='donjon')||S.hp>=maxHp()*.9)){S.occ=S.resume;S.resume=null;sceneMode='';}
  } else if(S.occ==='dormir'){
    S.end=Math.min(100,S.end+9*dt);
    S.hp=Math.min(maxHp(),S.hp+maxHp()*.06*dt);
    S.mana=Math.min(maxMana(),S.mana+.5*dt);
    if(!isNight()){S.occ='repos';S.repose=S.day+4/24;sceneMode='';
      /* le sommeil rend un peu de potentiel — à toutes les stats, sans distinction (E.21) */
      STATS.forEach(([k])=>{if(S.sx[k])S.sx[k].pot=Math.min(200,S.sx[k].pot+4);});
      cutIn('朝','Réveil','+5 % d\'XP pendant 4 h · potentiel des stats +4');}
  } else if(S.occ==='combat'||S.occ==='donjon'){
    combatTick(dt);
  } else {
    if(S.st&&S.st.length)tickStatus(S,dt,true);          /* poison et saignement courent aussi hors combat */
    S.end=Math.min(100,S.end+1.2*dt);
    if(S.occ==='recolte')harvestTick(dt);
    else if(S.occ==='atelier')craftTick(dt);
    else if(S.occ==='percer')pierce(dt);
    else if(S.occ==='explore'){expT+=dt;if(expT>=3){expT=0;explorePulse();}}
  }
  rateT=(rateT||0)+dt;
  if(rateT>=60){rateT=0;rollRates();}
  if(auto('marmite')&&(S.faim<40||avgPot()<70)){
    const p2={};Object.keys(S.food).forEach(k=>{const i=foodInfo(k);if(!p2[i.el]&&S.food[k]>0)p2[i.el]=k;});
    const c5=Object.values(p2);
    if(c5.length>=3&&hasStation('cuisine'))cook(c5.slice(0,5));
    else if(S.faim<40){                          /* sans cuisine, elle sert cru plutôt que de laisser jeûner */
      const k=Object.keys(S.food).find(x=>S.food[x]>0);
      if(k)eatFood(k);else{const m=Object.keys(S.mat).find(x=>MAT[x].nutr&&S.mat[x]>0);if(m)eat(m);}}}
  if(auto('fondeur')&&rateT<dt)autoScrap();     /* une fois par minute, juste après rollRates */
  if(auto('intendance')&&npcsHere().length){
    const gros=Object.keys(S.mat).filter(k=>S.mat[k]>=120&&MAT[k].v<=40);
    if(gros.length)sellMat(gros[0]);}
  if(auto('veilleur')&&isNight()&&S.occ!=='dormir'&&S.occ!=='donjon'&&litIci())dormir(false);
  uiT+=dt;
  if(uiT>1){uiT=0;tickTips();if(!ptrDown&&['recolte','sac','skills','cell','atelier','equip','pnj','royaume','guilde','table','comps','batir','autos','ville'].includes(tab))paint();}
}

function combatTick(dt){
  /* endurance : longue et lente, régénération après 1.5 s sans dépense (A.6.1) */
  if(endLock>0)endLock-=dt;
  else S.end=Math.min(100,S.end+((S.guard?2:6)+passives().regen+buffOf('regen')+gemEndurance())*dt);
  if(S.hp<maxHp()*.25&&E&&!hasStatus(S,'enracine')){
    const oc=S.occ;
    disengage(true);S.resume=oc;
    log('<span class="bd">Tu romps le contact et te replies.</span>');return;}
  if(respawnT>0){respawnT-=dt;if(respawnT<=0&&!E){spawn();sceneMode='';}return;}
  if(!E){spawn();sceneMode='';return;}
  const iv=1/Math.max(.2,wSpeed());
  atkT+=dt;
  let guard=0;
  /* réserve de détonation : on garde le souffle pour placer la lourde en résolveur */
  const reserve=(auto('deto')&&S.seg.length===capChain()-1&&S.end<S.thr+22)||hasStatus(S,'etourdi');
  while(atkT>=iv&&E&&guard++<8){atkT-=iv;if(S.end>=S.thr&&!reserve)attack(false);}
  /* décroissance de la chaîne : un segment toutes les 3 s sans acte qui touche */
  if(S.seg.length){decay+=dt;
    if(decay>=3){decay=0;const last=S.seg.pop();
      const prev=S.seg.length?S.seg[S.seg.length-1]:null;
      S.bonus=Math.max(0,S.bonus-transBonus(prev,last));}}
  tickStatus(S,dt,true);
  /* créature invoquée : elle frappe la cible, un temps */
  if(S.summon&&E){S.summon.t-=dt;const d=S.summon.dps*dt;E.hp-=d;dpsA+=d;
    if(S.summon.t<=0)S.summon=null;
    if(E.hp<=0){kill();if(!E)return;}}
  /* chaque créature engagée a son propre rythme : télégraphe, montée, frappe */
  const grp=engaged().slice();
  for(const e of grp){
    if(e.hp<=0)continue;
    if(e.stg>0)e.stg-=dt;
    tickStatus(e,dt,false);
    if(e.hp<=0){kill(e);continue;}
    if(hasStatus(e,'etourdi')||hasStatus(e,'terreur')){e.w=-1;e.tt=0;continue;}
    if(e.stg>0)continue;
    /* à distance, on tient la créature à l'écart : elle met plus de temps à revenir au
       contact — sauf si son geste porte lui aussi à distance */
    const kite=(isDist(weapon())&&e===E&&!patOf(e).dist)?.62:1;
    const lent=(hasStatus(e,'ralenti')?.6:1)*(hasStatus(e,'enracine')?.75:1)*kite;
    if(e.w<0){e.tt+=dt*lent;
      if(e.tt>=e.delay){e.w=0;armePattern(e);}}   /* le geste se choisit au moment de s'armer */
    else{
      e.w+=dt*lent;
      const cible=e===E;                      /* la garde réflexe ne couvre que la cible regardée */
      const fen=parryWinVs(e),reste=e.wEff-e.w;
      if(cible&&fen>0&&auto('garde')&&reste<=fen*.55&&S.end>=14)
        resolveHit(Math.random()<.12*auto('garde')?2:1,e);
      else if(e.w>=e.wEff)resolveHit(S.guard?1:0,e);
    }
    if(!E)return;
  }
  if(auto('deto')&&E&&S.seg.length===capChain()-1&&S.end>=S.thr+22)attack(true);
  compTick(dt);
  spellT+=dt;
  if(E&&spellT>=1){
    spellT=0;
    for(let i=0;i<S.spells.length;i++){
      const sp=compileSpell(S.spells[i]||[]);
      if(!sp.casts.length)continue;
      S.spellCd=S.spellCd||[];
      S.spellCd[i]=(S.spellCd[i]||0)-1;
      if(S.spellCd[i]<=0){ if(castSpell(i))S.spellCd[i]=sp.cd; }
    }
  }
  dpsT+=dt;if(dpsT>=1){dps=dpsA/dpsT;dpsA=0;dpsT=0;}
  if(hitFx>0){hitFx-=dt;}
}
function tryParry(){
  if(!E||E.w<0){S.guard=true;return;}
  const fen=parryWinVs(E);
  if(fen>0&&(E.wEff-E.w)<=fen)resolveHit(2,E);else S.guard=true;
}
/* changer de cible : au tap sur une créature, ou au clavier */
function cycleFocus(d){
  if(EE.length<2)return;
  refocus((foc+(d||1)+EE.length)%EE.length);
  sceneMode='';
}

function explorePulse(){
  const c=here();let found=null,best=99;
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    const n=cell(c.x+dx,c.y+dy);if(n.seen)continue;
    const d=Math.abs(dx)+Math.abs(dy);if(d<best){best=d;found=n;}}
  S.end=Math.max(0,S.end-5);gainXp('perception_sk',12);gainXp('athletisme',6);
  gainStat('per',26);                        /* la Perception vient de ce qu'on cherche */
  if(S.end<=0){S.occ='repos';log('Épuisé. Tu t\'arrêtes.');}
  if(!found)return;
  found.seen=true;
  questTick('explore',1);
  if(found.poi)cutIn(POI[found.poi].g,POI[found.poi].n+(found.town?' — '+found.town:''),found.x+','+found.y);
}
function travel(x,y){
  const d=Math.abs(x-S.pos[0])+Math.abs(y-S.pos[1]);if(!d)return;
  const c=cell(x,y);
  if(!c.seen&&d>1)return toast('Cellule inconnue — approche-toi d\'abord');
  S.day+=d/24;S.pos=[x,y];c.seen=true;S.target=null;   /* une heure de marche par cellule */
  if(S.occ!=='repos')S.occ='repos';
  gainXp('athletisme',5*d);
  log('Voyage vers '+(c.town||BIOME[c.b].n)+' ('+x+','+y+')');
  controle('entree');
  sceneMode='';paint();
}
