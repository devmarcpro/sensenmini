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
  /* Le jour est la seule horloge du temps long. Les maladies s'y accrochent :
     elles traversent le sommeil, les voyages et les combats sans rien devoir
     au tick de combat. */
  const j=Math.floor(S.day);
  if(S.jour===undefined)S.jour=j;
  else if(j>S.jour){tickJour(j-S.jour);S.jour=j;}
  const w=Math.floor(S.day/WEEK);
  if(w>S.week){S.week=w;weekly();}
  const si=seasonIdx();
  if(S.season===undefined)S.season=si;
  else if(si!==S.season){S.season=si;const s=SEASON[si];
    cutIn(s.g,s.n,si===3?'le froid mord, le vivant se raréfie':si===0?'tout repousse plus vite':si===1?'chaleur — la canicule guette':'les récoltes déclinent');}
}
function weekly(){
  let inf=0,calm=0;
  regenStocks();                                    /* les gisements se reconstituent (3.3) */
  for(const k in S.world){
    const c=S.world[k];
    if((c.poi==='donjon'||c.poi==='camp')&&c.cleared<3){
      for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
        const n=S.world[key(c.x+d[0],c.y+d[1])];
        if(n&&n.corr<100){n.corr=Math.min(100,n.corr+1);inf++;}}}
    if(c.cleared>=3&&c.corr>Math.max(0,c.corr0-25)){c.corr-=2;calm++;}
    /* Une faille nettoyée ailleurs ne se refermait qu'au retour du joueur :
       tickClock ne regarde que la case où il se tient. La carte gardait donc
       des entrées de donjon qui ne s'ouvraient plus, indéfiniment. */
    if(c.djDone&&S.day>c.djDone&&!(c.x===S.pos[0]&&c.y===S.pos[1])){
      c.poi=null;c.dj=null;c.djDone=null;c.corr=Math.max(0,c.corr-20);
    }
    /* le gibier revient : une case qu'on cesse de racler se repeuple
       en quelques semaines (l'epuisement retombe de vingt-cinq par semaine) */
    if(c.vide>0)c.vide=Math.max(0,c.vide-25);
  }
  S.npcs.forEach(n=>{
    n.or=Math.min(n.orMax,Math.round(n.or+n.orMax*.15));
    if(n.rel<0)n.rel=Math.min(0,n.rel+1);          /* voie de rédemption : +1 par semaine */
    n.mood=Math.max(20,Math.min(100,n.mood+ri(-3,3)+(n.veuf?-1:0)));
  });
  const r=[];
  if(inf)r.push(inf+' cases gagnées par la corruption');
  if(calm)r.push(calm+' cases s\'apaisent');
  S.kingdoms=kingdomsNear();
  S.kingdoms.forEach(k=>{k.or=Math.min(15000,k.or+2000);
    /* le tribut se paie chaque semaine ; ce qu'il achete — la paix — se lit
       dans weeklyKingdom, ou il compte comme un pacte de non-agression */
    if(k.diplo==='tribut')S.or=Math.max(0,S.or-40);});
  S.comps.forEach(c=>{
    if(c.dead)return;                    /* un mort ne guérit pas tout seul */
    {
      if(S.vivres>0){S.vivres--;c.mood=Math.min(100,c.mood+3);}
      else c.mood=Math.max(15,c.mood-6);
      c.hp=Math.min(c.max,c.hp+c.max*.4);
    }});
  weeklyTowns(r);weeklyFamilies(r);weeklyFarms(r);weeklyKingdom(r);weeklyGuild(r);
  log('<span class="in">Semaine '+S.week+'</span>'+(r.length?' · '+r.join(' · '):' · rien à signaler'));
}
