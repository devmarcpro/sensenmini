/* Sensen Mini — 27-clock.js
   Horloge et passage hebdomadaire
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== HORLOGE ===== */
function tickClock(dt){
  S.day+=dt/DAY;
  const hc=S.world[key(S.pos[0],S.pos[1])];
  if(hc&&hc.djDone&&S.day>hc.djDone){
    hc.poi=null;hc.dj=null;hc.djDone=null;hc.corr=Math.max(0,hc.corr-20);
    if(S.occ==='donjon'){S.occ='repos';E=null;sceneMode='';}
    cutIn('野','La faille s\'est refermée','la cellule est redevenue ordinaire — et revendicable');
  }
  const w=Math.floor(S.day/WEEK);
  if(w>S.week){S.week=w;weekly();}
}
function weekly(){
  let inf=0,calm=0;
  for(const k in S.world){
    const c=S.world[k];
    if((c.poi==='donjon'||c.poi==='camp')&&c.cleared<3){
      for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
        const n=S.world[key(c.x+d[0],c.y+d[1])];
        if(n&&n.corr<100){n.corr=Math.min(100,n.corr+1);inf++;}}}
    if(c.cleared>=3&&c.corr>Math.max(0,c.corr0-25)){c.corr-=2;calm++;}
  }
  S.npcs.forEach(n=>{
    n.or=Math.min(n.orMax,Math.round(n.or+n.orMax*.15));
    if(n.rel<0)n.rel=Math.min(0,n.rel+1);          /* voie de rédemption : +1 par semaine */
    n.mood=Math.max(20,Math.min(100,n.mood+ri(-3,3)));
  });
  if(S.week%17===0){                                /* 1 an in-game ≈ 120 jours */
    S.npcs.forEach(n=>{n.age++;
      if(n.age>RACE[n.race].life*(1+ri(-15,15)/100)&&Math.random()<.3)n.dead=true;});
    const morts=S.npcs.filter(n=>n.dead);
    if(morts.length)log('<span class="bd">'+morts.map(n=>n.nom).join(', ')+' — mort de vieillesse</span>');
    S.npcs=S.npcs.filter(n=>!n.dead);
  }
  const r=[];
  if(inf)r.push(inf+' cases gagnées par la corruption');
  if(calm)r.push(calm+' cases s\'apaisent');
  S.kingdoms=kingdomsNear();
  S.kingdoms.forEach(k=>{k.or=Math.min(15000,k.or+2000);
    if(k.diplo==='tribut')S.or=Math.max(0,S.or-40);});
  S.comps.forEach(c=>{
    if(c.dead)return;                    /* un mort ne guérit pas tout seul */
    {
      if(S.vivres>0){S.vivres--;c.mood=Math.min(100,c.mood+3);}
      else c.mood=Math.max(15,c.mood-6);
      c.hp=Math.min(c.max,c.hp+c.max*.4);
    }});
  weeklyTowns(r);weeklyKingdom(r);weeklyGuild(r);
  log('<span class="in">Semaine '+S.week+'</span>'+(r.length?' · '+r.join(' · '):' · rien à signaler'));
}
