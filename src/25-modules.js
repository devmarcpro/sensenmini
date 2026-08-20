/* Sensen Mini — 25-modules.js
   Compilation des sorts, incantation, lecture des livres
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   MODULES, MANA ET LIVRES (5.1 / A.5 / A.6 / A.7)
   ================================================================== */
const st=k=>((S.stats&&S.stats[k])||5)+Math.round(buffOf(k));
const maxMana=()=>20+st('vol')*3+lv('meditation')*2;
/* slots : la progression d'arme débloque de la complexité de build */
const spellSlots=()=>{const w=weapon();return Math.min(6,2+Math.floor(lv(w?w.fn:'epee')/20));};
const moduleSlots=()=>{const w=weapon();return Math.min(5,2+Math.floor(lv(w?w.fn:'epee')/25));};
const modLv=i=>(S.modules[i]&&S.modules[i].lv)||1;
/* passifs issus des manuels */
function passives(){
  const p={dmg:0,pierce:0,gardecost:0,regen:0,win:0,riposte:0,multi:0,reach:0};
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
  const casts=[];let pend={pow:1,count:1,cd:1,echo:0,hp:0},mana=0;
  list.forEach(i=>{
    const m=S.modules[i];if(!m)return;
    const def=MODULE[m.id];
    mana+=def.mana/sf(m.lv);
    if(def.t==='modificateur'||def.t==='declencheur'){
      if(def.mul){for(const k in def.mul)pend[k]=(k==='count')?pend[k]*def.mul[k]:(k==='echo'?pend.echo+def.mul[k]:pend[k]*def.mul[k]);}
      if(def.hp)pend.hp+=def.hp;
      return;}
    const v=domVec(m.dom);
    casts.push({idx:i,id:m.id,dom:m.dom,lv:m.lv,vec:v,el:DOMAIN[m.dom].v&&Object.keys(DOMAIN[m.dom].v).length?domi(v):-1,
      pow:(def.pow||0)*sf(m.lv)*pend.pow,heal:(def.heal||0)*sf(m.lv)*pend.pow,
      shield:(def.shield||0)*sf(m.lv)*pend.pow,
      count:Math.round(pend.count),echo:pend.echo,hp:pend.hp});
    pend={pow:1,count:1,cd:pend.cd,echo:0,hp:0};
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
  sp.casts.forEach(c=>{
    if(c.hp)S.hp-=maxHp()*c.hp;
    for(let n=0;n<c.count;n++){
      if(!E)return;
      if(c.heal){const h=c.heal;S.hp=Math.min(maxHp(),S.hp+h);float('+'+Math.round(h),'#4FA96B');
        gainXp('m_'+c.dom,h);continue;}
      if(c.shield){S.end=Math.min(100,S.end+c.shield);float('盾','#3E7CB1');gainXp('m_'+c.dom,c.shield);continue;}
      let p=c.pow*(1+st('vol')*.04);
      if(c.el>=0)p*=1+lv('el_'+EL[c.el].k)/100;
      p*=vmult(c.vec,E.vec,multOff);
      const res=pushSeg(c.el>=0?c.el:domi(c.vec));   /* tout module lancé pose un segment */
      if(res){const mul=1+S.bonus;p*=mul;S.seg=[];S.bonus=0;
        log('<span class="hi">Chaîne résolue par un module ×'+mul.toFixed(2)+'</span>');}
      const applied=Math.min(p,E.hp);
      E.hp-=p;dpsA+=p;
      const stk=DOMSTAT[c.dom];
      if(stk&&E&&Math.random()<.45){
        const dur=STATUS[stk].dur?1.5:3.5;
        addStatus(E,stk,dur,STATUS[stk].dot?p*.12:1);}
      float(Math.round(p),c.el>=0?EL[c.el].c:'#B9A7D6',res);knock();
      gainXp('m_'+c.dom,applied);
      if(c.el>=0)gainXp('el_'+EL[c.el].k,applied);
      const m=S.modules[c.idx];
      if(m){m.xp=(m.xp||0)+applied;
        if(m.xp>=xpNext(m.lv)){m.xp=0;m.lv++;cutIn(DOMAIN[m.dom].g,MODULE[m.id].n+' niveau '+m.lv,'plus puissant et moins coûteux');}}
      if(E&&E.hp<=0){kill();return;}
      if(c.echo&&Math.random()<c.echo){E.hp-=p*.5;dpsA+=p*.5;float('echo','#B9A7D6');
        if(E&&E.hp<=0){kill();return;}}
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
const readBonus=()=>lv('lecture')/2+st('per')/4;
function readBook(i){
  const b=S.books[i];if(!b)return;
  S.books.splice(i,1);
  const jet=d20()+readBonus();
  gainXp('lecture',b.diff*40);
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
