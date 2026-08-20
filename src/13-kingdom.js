/* Sensen Mini — 13-kingdom.js
   Claims, zonage, entretien, raids, guildes, diplomatie
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE ROYAUME (3.3 / 7.5 / 7.6 / 14) ET LES GUILDES (7.3)
   ================================================================== */
const ROLES={
  base:{n:'Base',d:'toutes activités autorisées, constructions persistantes'},
  habitation:{n:'Habitation',d:'seules les pièces d\'ici comptent pour loger les résidents'},
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
  const pool=LAWS.slice().sort(()=>Math.random()-.5);
  return {id:i,nom:pick(TOWN)+pick([' du Nord',' des Cendres',' Ancien',' Libre','',' du Val']),
    race,gov,laws:pool.slice(0,GOV[gov].law).map(t=>({t,c:pick(CONSEQ)})),
    rep:0,diplo:null,or:ri(6000,15000)};
}
/* --- claims --- */
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
const upkeep=()=>Math.round((nAssign()*10+nSpecial()*25)*(S.gov?GOV[S.gov].tax:1));
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
  S.npcs.filter(n=>n.rec&&n.assign).forEach(n=>{
    const j=JOBS[n.assign];
    const moodF=Math.max(.4,Math.min(1.2,n.mood/100*1.5));
    const zone=S.world[n.cell]||here();
    const rich=zone.res||.5;
    const rend=(1+n.lv*.35)*moodF*7*((S.detteW||0)>=2?.75:1);   /* 2 semaines impayées : productivité −25 % (14.6) */
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
    } else if(n.assign==='vendeur'||n.assign==='transporteur'){
      const g=Math.round(rend*7*repFactor());S.tresor+=g;prod.or+=g;
    }
    n.mood=Math.max(15,Math.min(100,n.mood+(n.home?3+comfort()*.4:-6)));
  });
  if(prod.or||prod.mat||prod.vivres||prod.comp)
    r.push('exploitation +'+prod.or+' or, +'+prod.mat+' matériaux, +'+prod.vivres+' vivres, +'+prod.comp+' composants');
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
  if(Math.random()<Math.min(.45,corrMoy/300+S.claims.length*.018)){
    const valeur=S.claims.length*22+nStruct()*16;
    const force=valeur*.28*(0.8+Math.random()*0.4)*(S.gov?1/GOV[S.gov].def:1);
    const def=defense();
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
function diplo(i,type){
  const k=S.kingdoms[i];
  if(!S.gov)return toast('Ton territoire n\'est pas encore un royaume');
  if(k.gov==='anarchie'&&type!=='commerce')return toast('L\'anarchie ne peut rien garantir');
  const dd=12+(k.rep<0?4:0);
  const jet=d20()+lv('negociation')/2+st('cha')/4;
  gainXp('negociation',60);
  if(jet>=dd){k.diplo=type;k.rep=Math.min(100,k.rep+10);
    cutIn('盟',DIPLO[type],'signé avec '+k.nom);}
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
