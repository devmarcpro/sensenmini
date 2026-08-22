/* Sensen Mini — 13-kingdom.js
   Claims, zonage, entretien, raids, guildes, diplomatie
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE ROYAUME (3.3 / 7.5 / 7.6 / 14) ET LES GUILDES (7.3)
   ================================================================== */
const ROLES={
  base:{n:'Base',d:'toutes activités autorisées, constructions persistantes'},
  habitation:{n:'Habitation',d:'dès qu\'une cellule porte ce rôle, elle seule loge les résidents — les lits d\'ailleurs ne comptent plus'},
  champs:{n:'Champs',d:'agriculture et élevage — constructions légères seulement'},
  ressources:{n:'Ressources naturelles',d:'garde la régénération hebdomadaire — aucune construction'},
};
const GOV={
  monarchie:{n:'Monarchie héréditaire',tax:1.0,law:2,def:1.0,d:'succession par héritier'},
  republique:{n:'République élue',tax:0.9,law:2,def:1.0,d:'taxes modérées, lois stables'},
  theocratie:{n:'Théocratie',tax:1.0,law:4,def:1.1,d:'lois strictes liées au culte'},
  ploutocratie:{n:'Ploutocratie',tax:1.3,law:1,def:0.9,d:'taxes élevées, commerce favorisé'},
  dictature:{n:'Dictature militaire',tax:1.4,law:4,def:1.4,d:'lois strictes, défenses renforcées'},
  anarchie:{n:'Anarchie',tax:0.05,law:0,def:0.5,d:'pas d\'administration — ni entretien, ni garde'},
};
const GK2=Object.keys(GOV);
const LAWS=['le vol','le meurtre','le port d\'armes en ville','la magie de corruption','la pomme',
  'les instruments à vent','la vente d\'os','le port de rouge','la mendicité','les chiens noirs',
  'la contrebande de sel','le commerce nocturne','les miroirs','le rire après minuit'];
const CONSEQ=['amende','confiscation','gardes hostiles'];
const DIPLO={commerce:'Accord commercial',nonagression:'Non-agression',alliance:'Alliance défensive',tribut:'Tribut'};
const GUILDS=[
  {k:'guerriers',n:'Guerriers',g:'武',q:'kill'},{k:'magie',n:'Magie',g:'呪',q:'kill'},
  {k:'artisans',n:'Artisans',g:'工',q:'craft'},{k:'aventuriers',n:'Aventuriers',g:'旅',q:'explore'},
  {k:'assassins',n:'Assassins',g:'影',q:'kill'},{k:'transporteurs',n:'Transporteurs',g:'運',q:'deliver'},
  {k:'batisseurs',n:'Bâtisseurs',g:'築',q:'build'},{k:'gladiateurs',n:'Gladiateurs',g:'闘',q:'kill'},
  {k:'navigateurs',n:'Navigateurs',g:'航',q:'explore'},{k:'prospecteurs',n:'Prospecteurs',g:'鉱',q:'harvest'},
  {k:'tresors',n:'Chasseurs de trésor',g:'宝',q:'donjon'},{k:'developpement',n:'Développement',g:'政',q:'build'},
];
const RANKS=['Novice','Compagnon','Adepte','Expert','Maître'];
function mkKingdom(i){
  const race=pick(Object.keys(RACE)),gov=pick(GK2);
  const pool=melange(LAWS);
  return {id:i,nom:pick(TOWN)+pick([' du Nord',' des Cendres',' Ancien',' Libre','',' du Val']),
    race,gov,laws:pool.slice(0,GOV[gov].law).map(t=>({t,c:pick(CONSEQ)})),
    rep:0,diplo:null,or:ri(6000,15000)};
}
/* --- claims --- */
/* Les villes ou une caravane peut aller : celles des royaumes voisins, non
   abandonnees, et dont on a VU la case — on n'envoie pas un homme vendre
   dans une ville dont on ignore l'existence. */
function villesConnues(){
  const out=[];
  (typeof kingdomsNear==='function'?kingdomsNear():[]).forEach(k=>{
    (typeof kTowns==='function'?kTowns(k):[]).forEach(t=>{
      if(!t||t.abandonne)return;
      const cc=(S.world||{})[key(t.x,t.y)];
      if(cc&&cc.seen)out.push(t);
    });
  });
  return out;
}
/* Ce qu'un transporteur rapporte : le prix REEL de ce qu'il a porte, borne
   par la bourse de la ville. Rien de plus, et souvent moins. */
function caravane(n,rend){
  const villes=villesConnues();
  if(!villes.length)return 0;
  const stock=Object.keys(S.mat||{}).filter(m=>MAT[m]&&S.mat[m]>0);
  if(!stock.length)return 0;
  /* il charge ce qui abonde : c'est le SURPLUS qui part, pas la reserve */
  stock.sort((a,b)=>S.mat[b]*MAT[b].v-S.mat[a]*MAT[a].v);
  const mk=stock[0];
  const charge=Math.max(1,Math.min(S.mat[mk],Math.round(4+rend*1.2)));
  /* il va la ou sa cargaison vaut le plus */
  let best=villes[0],bp=0;
  villes.forEach(t=>{const pr=(typeof townPrice==='function'?townPrice(t,mk):1);
    if(pr>bp){bp=pr;best=t;}});
  const prix=Math.round(MAT[mk].v*charge*bp*(1+n.lv*.02)
    *(typeof repFactor==='function'?repFactor():1));
  /* la bourse de la ville est finie — c'est elle qui borne, jamais l'envie */
  const paye=Math.min(prix,Math.floor(best.or||0));
  if(paye<1)return 0;
  const vendu=Math.max(1,Math.round(charge*paye/Math.max(1,prix)));
  S.mat[mk]-=vendu;if(!S.mat[mk])delete S.mat[mk];
  best.or=Math.max(0,(best.or||0)-paye);
  return paye;
}
const claimCost=()=>Math.round(130*Math.pow(1.38,S.claims.length));
function claimCell(){
  const c=here();
  if(c.claim)return toast('Déjà revendiquée');
  if(c.poi==='donjon')return toast('Un donjon occupe la cellule — nettoie-le d\'abord');
  const cost=claimCost();
  if(S.or<cost)return toast('Il faut '+cost+' or');
  S.or-=cost;c.claim='base';S.claims.push(key(c.x,c.y));
  questTick('build',1);
  cutIn('領','Cellule revendiquée',S.claims.length+' cellules · '+(c.town||BIOME[c.b].n));
}
const nAssign=()=>S.npcs.filter(n=>n.rec&&n.assign).length;
const nStruct=()=>PK.reduce((a,k)=>a+countPlot(k),0)+MK2.reduce((a,k)=>a+countSlot(k),0);
const nSpecial=()=>countSlot('etal')+countSlot('hall')+countPlot('tourelle')
  +Object.keys(STATION).reduce((a,k)=>a+countSlot(k),0);
/* « Garde-manger : stock de nourriture des residents » (F.6/E.15). Un
   resident qui mange chez lui coute moins cher a entretenir : chaque
   garde-manger retire un or par semaine, sans jamais descendre sous zero. */
const upkeep=()=>Math.max(0,Math.round((nAssign()*10+nSpecial()*25)*(S.gov?GOV[S.gov].tax:1))
  -(typeof meubleTerritoire==='function'?meubleTerritoire('gardemanger'):0));
const defense=()=>((S.detteW||0)>=4?0:S.npcs.filter(n=>n.rec&&n.assign==='garde').reduce((a,n)=>a+n.lv*6,0))
  +((S.detteW||0)>=2?0:countPlot('tourelle')*24)+countPlot('mur')*15
  +Math.min(20,countPlot('route')*3);
/* --- résolution hors-site par FORMULES, jamais par simulation (E.6) --- */
function weeklyKingdom(r){
  if(!S.claims.length)return;
  /* logement (7.5 / E.5) : un lit par résident, sinon malus d'humeur */
  const lits=beds();let li=0;
  S.npcs.filter(n=>n.rec).forEach(n=>{n.home=li++<lits;});
  const prod={or:0,mat:0,vivres:0,comp:0};
  /* Un resident qui a manque de vivres la semaine passee travaille moins.
     C'est la seule consequence, et elle suffit : le territoire se remet des
     qu'on remplit le garde-manger. */
  const creux=S.faimRes?Math.max(.45,1-S.faimRes*.12):1;
  S.npcs.filter(n=>n.rec&&n.assign).forEach(n=>{
    const j=JOBS[n.assign];
    const moodF=Math.max(.4,Math.min(1.2,n.mood/100*1.5));
    const zone=S.world[n.cell]||here();
    const rich=zone.res||.5;
    const rend=(1+n.lv*.35)*moodF*7*((S.detteW||0)>=2?.75:1)*creux;   /* 2 semaines impayées : productivité −25 % (14.6) ; le ventre vide coûte davantage */
    if(n.assign==='mineur'||n.assign==='bucheron'||n.assign==='herboriste'){
      const cats=n.assign==='mineur'?['metal','roche','mineral','gemme','fossile']:n.assign==='bucheron'?['bois']:['vegetal'];
      const pool=cellMats(zone).filter(m=>cats.includes(MAT[m].c));
      if(pool.length){const m=pick(pool),q=Math.max(1,Math.round(rend*rich*1.6));
        S.mat[m]=(S.mat[m]||0)+q;prod.mat+=q;}
    } else if(n.assign==='fermier'||n.assign==='eleveur'||n.assign==='cuisinier'){
      const champs=(zone.plots||[]).filter(p=>p&&p.t==='champ').length;
      const pluie=(METEO[meteo(zone)].pousse||0)+season().pousse;
      const q=Math.max(1,Math.round(rend*2*(BIOME[zone.b].fert+.2)*(1+champs*.18)*(1+pluie)));
      S.vivres=(S.vivres||0)+q;prod.vivres+=q;
    } else if(n.assign==='forgeron'||n.assign==='couturier'){
      const ct=n.assign==='forgeron'?'fixations':'sangles';
      const f=n.assign==='forgeron'?'lingot':'tissu',mk2=n.assign==='forgeron'?'fer':'lin';
      const q=quality(n.lv);
      const kk=ct+'|'+f+'|'+mk2+'|'+(Math.round(q*4)/4);
      const cc=S.comp[kk];const nb=Math.max(1,Math.round(rend/3));
      if(cc){cc.q=(cc.q*cc.n+q*nb)/(cc.n+nb);cc.n+=nb;}else S.comp[kk]={ct,f,mk:mk2,q,n:nb};
      prod.comp+=nb;
    } else if(n.assign==='vendeur'){
      /* le marchand vend SUR PLACE : c'est le trafic qui le paie */
      const g=Math.round(rend*7*repFactor());S.tresor+=g;prod.or+=g;
    } else if(n.assign==='transporteur'){
      /* ==================================================================
         DEUX METIERS, UN SEUL COMPORTEMENT.
         Le Marchand et le Transporteur rendaient exactement la meme ligne :
         rend x 7 x reputation, de l'or venu de nulle part. Deux fiches, deux
         noms, deux salaires — et un seul metier. Assigner un transporteur
         plutot qu'un marchand ne changeait rien, ce qui veut dire que le
         choix n'existait pas.

         UN TRANSPORTEUR NE FABRIQUE PAS D'OR : IL EN DEPLACE. Chaque
         semaine il charge le surplus de tes matieres et va le vendre dans
         une ville que tu connais, au PRIX DE CETTE VILLE, et dans la limite
         de sa bourse — la meme bourse finie que la tienne, celle qui se
         regarnit lentement. Il ne rapporte donc rien si tu ne produis rien,
         et rien non plus si les villes sont a sec. C'est ce qui en fait le
         debouche du mineur et du bucheron, et non un second marchand.
         ================================================================== */
      const g=caravane(n,rend);
      if(g){S.tresor+=g;prod.or+=g;prod.caravane=(prod.caravane||0)+g;}
      else prod.videCaravane=1;
    }
    n.mood=Math.max(15,Math.min(100,n.mood+(n.home?3+comfort()*.4:-6)));
  });
  if(prod.or||prod.mat||prod.vivres||prod.comp)
    r.push('exploitation +'+prod.or+' or, +'+prod.mat+' matériaux, +'+prod.vivres+' vivres, +'+prod.comp+' composants'
      +(prod.caravane?' (dont '+prod.caravane+' rapportés par la caravane)':''));
  if(prod.videCaravane)
    r.push('<span class="bd">La caravane rentre à vide — il faut des matières à vendre et une ville connue dont la bourse ne soit pas à sec.</span>');
  /* boutique passive (E.8) : trafic × attractivité, bornée par les bourses locales */
  const etals=countSlot('etal');
  if(etals){
    const traffic=1+S.claims.length*.35+(S.rep||0)/60+countPlot('route')*.12;
    const ventes=Math.round(traffic*(1.2+Math.random()*1.4)*etals);
    const stock=Object.keys(S.mat);
    let gain=0;
    for(let i=0;i<ventes&&stock.length;i++){
      const m=pick(stock),n2=Math.min(S.mat[m],ri(2,6));
      if(!n2)continue;
      gain+=priceMat(m,n2);S.mat[m]-=n2;if(!S.mat[m])delete S.mat[m];
    }
    if(gain){S.tresor+=gain;r.push('étal : '+ventes+' clients, +'+gain+' or au trésor');}
  }
  /* ================================================================
     LES RESIDENTS MANGENT (E.15 / 7.4)
     Un garde-manger allegeait l'entretien d'un or par semaine, et c'etait
     tout ce qui reliait l'agriculture au royaume : on cultivait des champs
     dont la recolte partait au sac, et les residents vivaient de rien.

     Ils mangent desormais : une bouche par resident recrute et par
     semaine, prise sur les VIVRES, et un garde-manger nourrit trois
     bouches d'avance. Stock vide → l'humeur tombe et la production avec,
     jamais la mort : « penalite, pas gestion punitive » (E.15).

     Ce qui compte ici n'est pas le chiffre, c'est le raccord : les champs
     nourrissent la population qui exploite le territoire. Sans cela,
     l'agriculture n'avait aucune raison d'exister a cote de la chasse. */
  const bouches=S.npcs.filter(n=>n.rec).length;
  if(bouches){
    const reserve=(S.vivres||0)+meubleTerritoire('gardemanger')*3;
    const manque=Math.max(0,bouches-reserve);
    const pris=Math.min(S.vivres||0,bouches);
    S.vivres=Math.max(0,(S.vivres||0)-pris);
    if(manque>0){
      /* on ne meurt pas de faim ici : on boude, et l'on travaille moins */
      S.npcs.filter(n=>n.rec).forEach(n=>{n.mood=Math.max(10,n.mood-6);});
      S.faimRes=manque;
      r.push('<span class="bd">'+manque+' résident'+(manque>1?'s ont':' a')+' manqué de vivres — humeur en baisse</span>');
    } else {
      S.faimRes=0;
      if(pris)r.push('résidents nourris : −'+pris+' vivres');
    }
  } else S.faimRes=0;
  /* entretien (A.8.1) */
  const up=upkeep();
  if(up){
    if(S.tresor>=up){S.tresor-=up;r.push('entretien −'+up+' or');}
    else{
      /* La dette se plafonne à deux mois d'entretien. Le GDD interdit la
         destruction automatique de structures (A.8.1, 14.6) : un territoire
         négligé ne s'écroule donc jamais tout seul, et son entretien court
         indéfiniment. Sans plafond, la dette d'un joueur parti trop longtemps
         atteignait plusieurs milliers d'or et devenait impayable — les malus
         restaient à leur pire sans aucune sortie. Les paliers gardent tout
         leur mordant ; seule l'ardoise cesse de gonfler, pour que
         régulariser reste possible. */
      const plafond=Math.max(up*8,50);
      const avant=S.dette;
      S.dette=Math.min(plafond,S.dette+(up-S.tresor));
      S.tresor=0;
      r.push('<span class="bd">entretien impayé — dette '+Math.round(S.dette)
        +(S.dette>=plafond&&avant<plafond?' — l\'ardoise ne montera plus, mais elle ne s\'efface pas seule':'')+'</span>');
    }
  }
  /* paliers de dette (14.6) : 1 semaine humeur −5 · 2 semaines productivité −25 %, tourelles hors service ·
     4+ semaines les gardes cessent, un PNJ peut partir chaque semaine. Tout se rétablit à la régularisation. */
  if(S.dette>0){
    S.detteW=(S.detteW||0)+1;
    S.npcs.filter(n=>n.rec).forEach(n=>n.mood-=5);
    if(S.detteW===2)r.push('<span class="bd">deux semaines de dette : productivité −25 %, tourelles hors service</span>');
    if(S.detteW>=4){const f=S.npcs.filter(n=>n.rec).sort((a,b)=>a.rel-b.rel)[0];
      if(f&&Math.random()<.6){f.rec=false;f.assign=null;r.push('<span class="bd">'+f.nom+' quitte le territoire</span>');}}
    r.push('<span class="bd">régularise le trésor (国 ROYAUME → déposer) avant que ça n\'empire</span>');
  } else if(S.detteW){S.detteW=0;r.push('<span class="gd">dette réglée — le territoire respire</span>');}
  /* raid (E.7) : jet hebdomadaire, force ∝ valeur du territoire, jamais scalée sur le joueur */
  const corrMoy=S.claims.reduce((a,k2)=>a+(S.world[k2]?S.world[k2].corr:0),0)/S.claims.length;
  /* Diplomatie et raids (14.4 / E.7). Un pacte de NON-AGRESSION avec le
     royaume qui tient la région écarte la menace ; une ALLIANCE DÉFENSIVE
     n'écarte rien mais envoie des renforts. Sans cela, signer un traité ne
     changeait rien à la semaine qui suivait. */
  const pactes=S.kingdoms.filter(x=>x.diplo==='nonagression'||x.diplo==='tribut').length;
  const allies=S.kingdoms.filter(x=>x.diplo==='alliance').length;
  const menace=Math.min(.45,corrMoy/300+S.claims.length*.018)*(pactes?Math.pow(.55,pactes):1);
  if(Math.random()<menace){
    const valeur=S.claims.length*22+nStruct()*16;
    const force=valeur*.28*(0.8+Math.random()*0.4)*(S.gov?1/GOV[S.gov].def:1);
    /* les renforts alliés arrivent avec la milice, pas avant */
    const renfort=allies?Math.round(valeur*.22*allies):0;
    const def=defense()+renfort;
    if(renfort)r.push('renforts alliés : +'+renfort+' de défense');
    /* ================================================================
       « JOUEUR PRESENT SUR PLACE : l'attaque se joue en temps reel ;
       joueur absent : elle est simulee » (14.5). Elle etait TOUJOURS
       simulee. On rentrait chez soi, on regardait le journal annoncer
       qu'un raid avait eu lieu pendant qu'on etait la, et l'on n'avait
       rien pu faire — la seule chose qui rendait un territoire vivant se
       jouait sans son proprietaire.
       Quand la case attaquee est celle ou l'on se tient, le raid devient
       un COMBAT : des pillards, en chair, autant que la force du raid le
       permet. Les tenir en echec annule la perte ; se faire deborder la
       double, parce qu'on etait la et qu'on n'a pas tenu.
       ================================================================ */
    if(S.claims.includes(key(S.pos[0],S.pos[1]))&&S.occ!=='donjon'&&!S.raid){
      S.raid={force:Math.round(force),def:Math.round(def),reste:0};
      const puiss=Math.max(1,Math.min(28,Math.round(force/12)));
      const n=Math.max(1,Math.min(MAXENG,1+Math.floor(force/60)));
      EE=[];E=null;
      for(let i=0;i<n;i++){
        const ck=creaturePool(here(),false,isNight(),puiss);
        EE.push(mkEnemy(ck,puiss,i===0&&force>valeur*.3,false,n>1?' '+'ⅠⅡⅢⅣ'[i]:''));
        EE[i].raid=1;
      }
      S.raid.reste=EE.length;
      foc=0;refocus();hitN=0;
      if(typeof seqReset==='function')seqReset();
      S.occ='combat';sceneMode='';
      cutIn('襲','Ton territoire est attaqué',
        EE.length+' assaillant'+(EE.length>1?'s':'')+' · défense '+Math.round(def)+' contre '+Math.round(force)
        +' — les repousser toi-même annule la perte');
      r.push('<span class="bd">raid EN COURS sur ta cellule — défends-toi</span>');
      return;
    }
    if(def>=force)r.push('<span class="gd">raid repoussé — défense '+Math.round(def)+' contre '+Math.round(force)+'</span>');
    else{
      const perte=Math.round((force-def)*1.5);
      S.tresor=Math.max(0,S.tresor-perte);
      if(countPlot('tourelle')&&Math.random()<.5){const cc=S.claims.map(k2=>S.world[k2]).find(c2=>c2.plots&&c2.plots.some(p2=>p2&&p2.t==='tourelle'));
        if(cc)cc.plots[cc.plots.findIndex(p2=>p2&&p2.t==='tourelle')]=null;}
      r.push('<span class="bd">raid : défense '+Math.round(def)+' contre '+Math.round(force)+' — '+perte+' or perdus</span>');
    }
  }
  /* royaume reconnu (14.5) */
  if(!S.gov&&S.claims.length>=8&&S.npcs.filter(n=>n.rec).length>=5)
    r.push('<span class="hi">ton territoire est reconnu comme royaume — choisis une gouvernance</span>');
}
/* --- diplomatie (14.4) --- */
/* Ce que chaque accord change, en clair — le panneau s'en sert pour le dire. */
const DIPLOEFFET={
  commerce:'tarifs douaniers de moitié sur ses terres',
  nonagression:'les raids se raréfient fortement',
  alliance:'des renforts viennent défendre ton territoire',
  tribut:'40 or par semaine, et la paix avec lui',
};
function diplo(i,type){
  const k=S.kingdoms[i];
  if(!S.gov)return toast('Ton territoire n\'est pas encore un royaume');
  if(k.gov==='anarchie'&&type!=='commerce')return toast('L\'anarchie ne peut rien garantir');
  const dd=12+(k.rep<0?4:0);
  const jet=d20()+lv('negociation')/2+st('cha')/4;
  gainXp('negociation',60);
  if(jet>=dd){k.diplo=type;k.rep=Math.min(100,k.rep+10);
    cutIn('盟',DIPLO[type],'signé avec '+k.nom+' — '+DIPLOEFFET[type]);}
  else{k.rep-=5;log('<span class="bd">'+k.nom+' refuse : '+DIPLO[type]+' (jet '+jet.toFixed(1)+' contre DD '+dd+')</span>');}
}
/* trésor : dépôts et retraits libres (7.6 / 14.6) — constituer une réserve est encouragé */
function deposit(n){
  n=Math.min(S.or,Math.max(0,Math.floor(n)));if(!n)return;
  S.or-=n;
  if(S.dette>0){const d=Math.min(S.dette,n);S.dette-=d;n-=d;if(d)log('Dette remboursée : −'+d+' or'+(S.dette>0?' (reste '+Math.round(S.dette)+')':''));}
  S.tresor+=n;
  if(n)log('Déposé '+n+' or au trésor');
}
function eatVivres(){
  if(!(S.vivres>0))return toast('Aucun vivre');
  S.vivres--;S.faim=Math.min(100,S.faim+28);
  S.hp=Math.min(maxHp(),S.hp+maxHp()*.1);
  log('Tu manges à ta faim.');
}
