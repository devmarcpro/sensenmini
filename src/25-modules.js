/* Sensen Mini — 25-modules.js
   Compilation des sorts, incantation, lecture des livres
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   MODULES, MANA ET LIVRES (5.1 / A.5 / A.6 / A.7)
   ================================================================== */
/* Une infection ronge l'endurance jour apres jour (F.4) : elle ne fait pas
   mal tout de suite, elle rend tout plus lourd — moins de souffle, donc
   moins de coups avant de manquer d'air. */
const st=k=>((S.stats&&S.stats[k])||5)+Math.round(buffOf(k))
  +(typeof utilStat==='function'?utilStat(k):0)
  -(k==='endu'&&typeof malusInfection==='function'?malusInfection():0);
const maxMana=()=>20+st('vol')*3+lv('meditation')*2+Math.round(gemMana());
/* slots : la progression d'arme débloque de la complexité de build */
const spellSlots=()=>{const w=weapon();return Math.min(6,2+Math.floor(lv(w?w.fn:'epee')/20));};
const moduleSlots=()=>{const w=weapon();return Math.min(5,2+Math.floor(lv(w?w.fn:'epee')/25));};
const modLv=i=>(S.modules[i]&&S.modules[i].lv)||1;
/* passifs issus des manuels */
function passives(){
  const p={dmg:0,pierce:0,gardecost:0,regen:0,win:0,riposte:0,multi:0,reach:0,heavy:0,spd:0,execute:0,def:0,stagger:0,crit:0,weaken:0,endcost:0,staggerE:0,sweep:0};
  S.postures.forEach(i=>{const m=S.modules[i];if(!m)return;
    const def=MODULE[m.id];if(!def.p)return;
    for(const k in def.p)p[k]+=def.p[k]*sf(m.lv);});
  return p;
}
/* coût de mana selon le lieu (A.4.6) */
function placeCost(el){
  if(el<0)return 1;
  const lv2=domi(cellVec(here()));
  if(el===lv2)return .85;
  if(dom(lv2)===el)return 1.15;
  return 1;
}
/* compilation d'une compétence : les modificateurs altèrent le module suivant */
function compileSpell(list){
  const casts=[];const fresh=()=>({pow:1,count:1,cd:1,echo:0,hp:0,statusDur:1,status:null});
  let pend=fresh(),mana=0;
  list.forEach(i=>{
    const m=S.modules[i];if(!m)return;
    const def=MODULE[m.id];
    mana+=def.mana/sf(m.lv);
    if(def.t==='modificateur'||def.t==='declencheur'){
      if(def.mul){for(const k in def.mul)pend[k]=(k==='count')?pend[k]*def.mul[k]:(k==='echo'?pend.echo+def.mul[k]:pend[k]*def.mul[k]);}
      if(def.hp)pend.hp+=def.hp;
      if(def.statusDur)pend.statusDur*=def.statusDur;
      if(def.status)pend.status=def.status;
      return;}
    const v=domVec(m.dom);
    const status=def.status||pend.status;
    casts.push({idx:i,id:m.id,dom:m.dom,lv:m.lv,vec:v,el:DOMAIN[m.dom].v&&Object.keys(DOMAIN[m.dom].v).length?domi(v):-1,
      pow:(def.pow||0)*sf(m.lv)*pend.pow,heal:(def.heal||0)*sf(m.lv)*pend.pow,
      shield:(def.shield||0)*sf(m.lv)*pend.pow,
      count:Math.round(pend.count*(def.count||1)),echo:pend.echo,hp:pend.hp,
      status:status?{k:status.k,dur:status.dur*pend.statusDur*sf(m.lv),v:status.v,m:status.m}:null,
      buff:def.buff?{k:def.buff.k,v:def.buff.v*sf(m.lv),t:def.buff.t*pend.statusDur}:null,
      purge:!!def.purge,dodge:!!def.dodge,drain:def.drain||0,summon:def.summon?{dps:def.summon.dps*sf(m.lv)*pend.pow,t:def.summon.t}:null,
      /* un statut pose sur SOI, et une guerison : le niveau du module allonge
         la premiere comme il allonge tout le reste */
      soi:def.soi?{k:def.soi.k,dur:def.soi.dur*pend.statusDur*sf(m.lv)}:null,
      guerit:def.guerit||null});
    const cd=pend.cd;pend=fresh();pend.cd=cd;
  });
  const cd=Math.max(.8,3.0*pend.cd);
  return {casts,mana:Math.max(1,Math.round(mana)),cd};
}
function castSpell(si){
  const sp=compileSpell(S.spells[si]||[]);
  if(!sp.casts.length||!E)return false;
  const el0=sp.casts[0].el;
  const cost=Math.round(sp.mana*placeCost(el0));
  if(S.mana<cost){
    if(!S.surchauffe)return false;
    /* surchauffe : lancer sans mana est permis, le déficit part en PV ×2 */
    const over=(cost-S.mana)*2/sf(lv('mana'));
    S.hp-=over;S.mana=0;gainXp('mana',over*2);
    float('surchauffe','#C8332B');
    if(S.hp<=0){down();return false;}
  } else S.mana-=cost;
  gainStat('vol',cost*8);                    /* la Volonté vient du mana qu'on dépense */
  questTick('spell',1);
  sp.casts.forEach(c=>{
    if(c.hp)S.hp-=maxHp()*c.hp;
    /* effets sur soi : ils ne posent pas de segment, mais apprennent le domaine */
    /* un statut pose sur soi, et non sur la cible : hate, benediction */
    if(c.soi){addStatus(S,c.soi.k,c.soi.dur,1);float(MODULE[c.id].n,STATUS[c.soi.k].c);
      gainXp('m_'+c.dom,40);}
    if(c.guerit){if(soigner(c.guerit,'le remède opère'))gainXp('m_'+c.dom,80);
      else log('Rien à guérir.');}
    if(c.buff){S.buffs=S.buffs.filter(b=>b.k!==c.buff.k);S.buffs.push({k:c.buff.k,v:c.buff.v,t:c.buff.t,n:MODULE[c.id].n});
      float(MODULE[c.id].n,'#6FBFA0');gainXp('m_'+c.dom,c.buff.v*4);}
    if(c.purge&&S.st&&S.st.length){S.st=[];float('浄','#6FBFA0');gainXp('m_'+c.dom,12);}
    if(c.dodge){S.dodge=1;float('影','#B9A7D6');gainXp('m_'+c.dom,6);}
    if(c.summon){S.summon={dps:c.summon.dps,t:c.summon.t};float('召','#7E4C8C');gainXp('m_'+c.dom,10);}
    for(let n=0;n<c.count;n++){
      if(!E)return;
      if(c.heal&&!c.pow){const h=c.heal;S.hp=Math.min(maxHp(),S.hp+h);float('+'+Math.round(h),'#4FA96B');
        gainXp('m_'+c.dom,h);if(!c.shield)continue;}
      if(c.shield){S.end=Math.min(100,S.end+c.shield);float('盾','#3E7CB1');gainXp('m_'+c.dom,c.shield);continue;}
      if(!c.pow){if(c.status&&E){addStatus(E,c.status.k,c.status.dur,c.status.v||1);}continue;}
      let p0=c.pow*(1+st('vol')*.04);
      if(c.el>=0)p0*=1+lv('el_'+EL[c.el].k)/100+gemSum(weapon(),'domaine',c.el)/100;
      const res=pushSeg(c.el>=0?c.el:domi(c.vec));   /* tout module lancé pose un segment */
      if(res){const mul=1+S.bonus;p0*=mul;S.seg=[];S.bonus=0;
        log('<span class="hi">Chaîne résolue par un module ×'+mul.toFixed(2)+'</span>');}
      /* un sort de zone arrose le groupe entier ; les autres ne touchent que la cible */
      const zone=MODULE[c.id].aoe;
      const cibles=zone?engaged().map((x,i)=>[x,x===E?1:.6]):[[E,1]];
      const morts=[];
      cibles.forEach(([tgt,part])=>{
        if(!tgt||tgt.hp<=0)return;
        let p=p0*part*vmult(c.vec,tgt.vec,multOff);
        const applied=Math.min(p,tgt.hp);
        tgt.hp-=p;dpsA+=p;
        if(c.drain){const h=applied*c.drain;S.hp=Math.min(maxHp(),S.hp+h);float('+'+Math.round(h),'#7E4C8C');}
        if(c.status)addStatus(tgt,c.status.k,c.status.dur,c.status.m?p*c.status.m:(c.status.v||1));
        const stk=DOMSTAT[c.dom];
        if(stk&&!c.status&&Math.random()<.45){
          const dur=STATUS[stk].dur?1.5:3.5;
          addStatus(tgt,stk,dur,STATUS[stk].dot?p*.12:1);}
        float(Math.round(p),c.el>=0?EL[c.el].c:'#B9A7D6',res&&tgt===E);
        gainXp('m_'+c.dom,applied);
        if(c.el>=0)gainXp('el_'+EL[c.el].k,applied);
        const m=S.modules[c.idx];
        if(m){m.xp=(m.xp||0)+applied;
          if(m.xp>=xpNext(m.lv)){m.xp=0;m.lv++;cutIn(DOMAIN[m.dom].g,MODULE[m.id].n+' niveau '+m.lv,'plus puissant et moins coûteux');}}
        if(c.echo&&Math.random()<c.echo&&tgt.hp>0){tgt.hp-=p*.5;dpsA+=p*.5;float('echo','#B9A7D6');}
        if(tgt.hp<=0)morts.push(tgt);
      });
      knock();
      morts.forEach(m2=>kill(m2));
      if(!E)return;
    }
  });
  return true;
}
/* ===== LIVRES (A.7) ===== */
function dropBook(diffBonus){
  const g=Math.random()<.65;
  const dm=pick(DK.filter(d=>DOMAIN[d].b===(g?'grimoire':'manuel')));
  S.books.push({id:'b'+(S.nid++),dom:dm,diff:ri(4,9)+(diffBonus||0)});
  cutIn(DOMAIN[dm].g,(g?'Grimoire':'Manuel')+' de '+DOMAIN[dm].n,'difficulté '+S.books[S.books.length-1].diff);
}
const readDD=b=>10+b.diff/2;
/* « +5 % de reussite de lecture a proximite » (F.6). Ici les jets sont en
   d20 : trois points, c'est quinze pour cent — de quoi ouvrir un grimoire
   qu'on n'ouvrait pas, et cela ne se transporte pas. On revient chez soi
   pour lire les livres difficiles, ce qui donne enfin une raison de rentrer. */
const readBonus=()=>lv('lecture')/2+st('per')/4
  +(typeof meubleIci==='function'?Math.min(6,meubleIci('bibliotheque')*3):0);
function readBook(i){
  const b=S.books[i];if(!b)return;
  S.books.splice(i,1);
  const jet=d20()+readBonus();
  gainXp('lecture',b.diff*40);
  gainStat('per',b.diff*22);                 /* déchiffrer aiguise l'œil */
  if(jet>=readDD(b)){
    const n=1+Math.floor(lv('lecture')/12);
    for(let k=0;k<n;k++){
      const cands=MK.filter(id=>MODULE[id].d.includes(b.dom));
      const id=pick(cands);
      const ex=S.modules.find(m=>m.id===id&&m.dom===b.dom);
      if(ex){ex.lv++;log('<span class="in">'+MODULE[id].n+' approfondi — niveau '+ex.lv+'</span>');}
      else{S.modules.push({id,dom:b.dom,lv:1,xp:0});
        log('<span class="gd">Module appris : '+MODULE[id].n+' ('+DOMAIN[b.dom].n+')</span>');}
    }
    questTick('book',1);
    cutIn('読','Lecture réussie',n+' module(s) · jet '+jet.toFixed(1)+' contre DD '+readDD(b));
  } else {
    const eff=pick(READFAIL);
    if(eff==='perte de mana')S.mana=0;
    if(eff==='étourdissement')endLock=5;
    if(eff==='confusion')S.stance=ri(0,3);
    if(eff==='invocation hostile'){S.occ='combat';E=null;respawnT=.4;sceneMode='';}
    cutIn('失','Échec de lecture',eff+' · jet '+jet.toFixed(1)+' contre DD '+readDD(b));
  }
}
