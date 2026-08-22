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
    /* ==================================================================
       LA DERIVE DE LA CORRUPTION (E.20).
       Il n'y avait qu'une moitie de la regle : un foyer hostile poussait
       la corruption sur ses quatre voisines, sans plafond et sans retour.
       Une case gagnee restait gagnee pour toujours — sauf a nettoyer le
       foyer lui-meme. Le monde ne pouvait donc que noircir.

       Le GDD en donne les quatre mouvements. Les trois qui manquaient :
       un PLAFOND D'INFLUENCE par foyer (un camp de bandits ne rend pas
       une plaine aussi noire qu'une faille), une DECROISSANCE NATURELLE
       vers le bruit de base loin de tout foyer, et surtout la PRESSION
       DE LA CIVILISATION : une case tenue, un village, repoussent la
       corruption autour d'eux. C'est ce qui donne enfin au fait de
       revendiquer une case un effet sur le MONDE, et pas seulement sur
       l'economie. */
    const foyer=(c.poi==='donjon'||c.poi==='camp')&&c.cleared<3;
    if(foyer){
      /* une faille est un foyer majeur, un camp un foyer mineur : le premier
         pousse deux fois plus fort et deux fois plus haut */
      const maj=c.poi==='donjon';
      const plaf=Math.min(100,(c.corr0||0)+(maj?25:10));
      const monte=(n,q)=>{if(!n||n.corr>=plaf)return;
        n.corr=Math.min(plaf,n.corr+q);inf++;};
      monte(c,maj?2:1);
      /* les HUIT voisines, diagonales comprises : un foyer ne pousse pas en
         croix, il rayonne */
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
        if(!dx&&!dy)continue;
        monte(S.world[key(c.x+dx,c.y+dy)],1);
      }
    }
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
  /* --- LE MONDE REVIENT A LUI-MEME, ET LA CIVILISATION LE POUSSE ---
     Second passage, apres l'infection : l'ordre compte. Faire refluer une
     case avant de savoir si un foyer la nourrit encore rendrait le
     resultat dependant de l'ordre des cles de S.world. */
  let civ=0;
  const foyerPres=z=>{
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const n=(dx||dy)?S.world[key(z.x+dx,z.y+dy)]:z;
      if(n&&(n.poi==='donjon'||n.poi==='camp')&&n.cleared<3)return true;
    }
    return false;
  };
  /* une case tenue ou habitee pousse la corruption hors de chez elle */
  const presse={};
  for(const k in S.world){
    const z=S.world[k];
    if(!z.claim&&z.poi!=='village'&&!z.town)continue;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue;
      presse[key(z.x+dx,z.y+dy)]=1;
    }
  }
  for(const k in S.world){
    const z=S.world[k];
    const base=z.corr0||0;
    if(presse[k]&&z.corr>Math.max(0,base-40)){z.corr=Math.max(0,z.corr-1);civ++;continue;}
    if(foyerPres(z))continue;
    /* sans foyer actif alentour, le delta tend vers zero : le monde
       redevient ce que le bruit disait de lui */
    if(z.corr>base)z.corr=Math.max(base,z.corr-1);
    else if(z.corr<base)z.corr=Math.min(base,z.corr+1);
  }
  S.npcs.forEach(n=>{
    n.or=Math.min(n.orMax,Math.round(n.or+n.orMax*.15));
    if(n.rel<0)n.rel=Math.min(0,n.rel+1);          /* voie de rédemption : +1 par semaine */
    n.mood=Math.max(20,Math.min(100,n.mood+ri(-3,3)+(n.veuf?-1:0)));
  });
  const r=[];
  if(inf)r.push(inf+' cases gagnées par la corruption');
  if(calm)r.push(calm+' cases s\'apaisent');
  if(civ)r.push(civ+" cases refoulées par ce que tu tiens");
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
