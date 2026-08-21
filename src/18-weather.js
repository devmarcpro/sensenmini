/* Sensen Mini — 18-weather.js
   Cycle jour/nuit, météo pure, température ressentie, sommeil
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   TEMPS, MÉTÉO ET TEMPÉRATURE (E.21 / E.28 / A.4.5)
   La météo est une FONCTION PURE, jamais une simulation : elle
   s'évalue à la demande, elle est déterministe et reproductible.
   ================================================================== */
const HOUR=()=>(S.day%1)*24;
/* saisons : l'année fait 120 jours, quatre saisons de 30. Une modulation de la
   météo, de la pousse et des gisements — l'architecture les accueillait (E.28). */
const SEASON=[
  {k:'printemps',n:'Printemps',g:'春',t:0,pousse:.15,veg:1.2},
  {k:'ete',n:'Été',g:'夏',t:7,pousse:0,veg:1},
  {k:'automne',n:'Automne',g:'秋',t:-2,pousse:-.05,veg:1},
  {k:'hiver',n:'Hiver',g:'冬',t:-11,pousse:-.35,veg:.5},
];
const seasonIdx=day=>Math.floor(((day===undefined?S.day:day)%120+120)%120/30);
const season=day=>SEASON[seasonIdx(day)];
function phase(){const h=HOUR();
  return h<5?'nuit':h<7?'aube':h<19?'jour':h<21?'crépuscule':'nuit';}
const isNight=()=>{const h=HOUR();return h<5||h>=21;};
const METEO={
  clair:{n:'Clair',g:'晴',t:0},
  nuageux:{n:'Nuageux',g:'曇',t:-2},
  brouillard:{n:'Brouillard',g:'霧',t:-3},
  pluie:{n:'Pluie',g:'雨',t:-4,pousse:.15},
  orage:{n:'Orage',g:'雷',t:-5,pousse:.15},
  neige:{n:'Neige',g:'雪',t:-10},
  vent:{n:'Vent fort',g:'風',t:-6},
  tempete:{n:'Tempête',g:'嵐',t:-9,extreme:1},
  blizzard:{n:'Blizzard',g:'吹',t:-15,extreme:1},
  canicule:{n:'Canicule',g:'炎',t:18,extreme:1},
};
function meteo(c,day){
  const t=Math.floor((day===undefined?S.day:day)*3);      /* un front tient ~8 h */
  const sp=noise(c.x,c.y,S.seed+t,31,6);                   /* bruit spatial lent */
  const si=seasonIdx(day);
  const froid=c.temp<(si===3?.45:si===1?.2:.32),chaud=c.temp>(si===1?.6:.7),humide=c.hum>.55;
  if(sp>.905)return froid?'blizzard':chaud?'canicule':'tempete';
  if(sp>.80)return froid?'neige':humide?'orage':'vent';
  if(sp>.66)return humide?'pluie':froid?'neige':'nuageux';
  if(sp>.50)return humide?'brouillard':'nuageux';
  return 'clair';
}
/* température ressentie (E.28) */
function tempC(c){
  let T=-8+c.temp*46;
  T+=METEO[meteo(c)].t+season().t;
  if(isNight())T-=8;
  T-=Math.max(0,c.alt-.5)*14;                              /* altitude */
  if(c.depth)T=T*(1-Math.min(.8,c.depth*.18))+12*Math.min(.8,c.depth*.18); /* les strates lissent */
  return T;
}
/* isolation portée : les matériaux comptent enfin (A.4.5) */
const ISO={vegetal:7,bois:4,fossile:4,terre:3,roche:2,mineral:2,gemme:1,metal:1,meteo:0,liquide:0,synth:2};
function armorIso(){
  let iso=0;
  ZK.forEach(zk=>{const sl=SLOTS.find(x=>x.zone===zk),it=eqOf(sl.k);
    if(!it)return;
    const wsum=it.parts.reduce((a,p)=>a+COMP[p.ct].w,0);
    const m=it.parts.reduce((a,p)=>a+(MAT[p.mk].iso!==undefined?MAT[p.mk].iso:(ISO[MAT[p.mk].c]||2))*COMP[p.ct].w,0)/wsum;
    iso+=m*ZONE[zk].avg*Math.min(1.6,it.q);});
  const it2=eqOf('dos');
  if(it2)iso+=2;
  return iso;
}
/* le foyer d'un bâtiment annule le froid sur sa cellule */
const foyerIci=()=>{const c=here();
  return !!(c.plots&&c.plots.some(p=>p&&p.t==='batiment'&&p.slots.some(sl=>sl&&sl.k==='foyer')));};
function feltTemp(){
  const c=here();
  let T=tempC(c);
  const iso=armorIso();
  T=18+(T-18)*Math.max(.2,1-iso/16);
  if(foyerIci()&&T<18)T=Math.min(18,T+9);
  return T;
}
const COMFORT=[5,30];
/* Le Cendreux est « insensible à la chaleur mineure » — c'était écrit sur sa
   fiche de race et nulle part ailleurs. Une dizaine de degrés au-dessus du
   confort ne l'atteint pas ; au-delà, il souffre comme les autres, moins ce
   qu'il encaisse d'avance. Le froid, lui, le prend en plein. */
const SEUIL_CENDREUX=10;
function tempStress(){
  const T=feltTemp();
  /* Les potions de resistance (F.9) : quarante points d isolation contre un
     seul des deux extremes. Elles ne rechauffent pas, elles ISOLENT — un
     Cendreux sous fraicheur traverse une canicule sans rien sentir. */
  const froidOff=buffOf('isofroid'),chaudOff=buffOf('isochaud');
  if(T<COMFORT[0]){
    const e=COMFORT[0]-T-froidOff*.25;
    return e>0?{froid:1,e}:null;
  }
  if(T>COMFORT[1]){
    let e=T-COMFORT[1]-chaudOff*.25;
    if(e<=0)return null;
    if(S.race==='cendreux'){e-=SEUIL_CENDREUX;if(e<=0)return null;}
    return {froid:0,e};
  }
  return null;
}
/* lumière : une lanterne dans un bâtiment tient la nuit à distance */
/* Une lanterne demande un batiment, et un batiment un territoire. La torche
   eclaire ce qu'on ne possede pas : c'est la seule lumiere d'un voyageur, et
   elle brule dix minutes. */
const eclaireIci=()=>{const c=here();
  if(typeof torcheAllumee==='function'&&torcheAllumee())return true;
  return !!(c.plots&&c.plots.some(p=>p&&p.t==='batiment'&&p.slots.some(sl=>sl&&(sl.k==='lanterne'||sl.k==='foyer'||sl.k==='torchere'))));};
/* sommeil (E.21) */
const litIci=()=>{const c=here();
  return !!(c.claim&&c.plots&&c.plots.some(p=>p&&p.t==='batiment'&&p.slots.some(sl=>sl&&sl.k==='lit')));};
function dormir(sauter){
  if(!litIci())return toast('Il faut un lit dans un bâtiment de cette cellule');
  if(!sauter){S.occ='dormir';sceneMode='';return;}
  const h=HOUR();
  if(h>=5&&h<21)return toast('On ne saute que la nuit, de 21 h à 5 h');
  const cible=Math.floor(S.day)+(h>=21?1:0)+5/24;
  const delta=cible-S.day;
  S.day=cible;
  const w=Math.floor(S.day/WEEK);
  let n=0;while(S.week<w&&n<10){S.week++;weekly();n++;}   /* le monde tourne pendant la nuit sautée */
  S.hp=maxHp();S.mana=maxMana();S.end=100;
  S.repose=S.day+4/24;                                    /* buff Reposé : +5 % XP pendant 4 h */
  S.npcs.filter(x=>x.rec).forEach(x=>x.mood=Math.min(100,x.mood+5));
  cutIn('眠','La nuit est passée','+5 % d\'XP pendant 4 h · '+(delta*24).toFixed(1)+' h sautées');
  S.occ='repos';sceneMode='';
}
const repose=()=>S.repose&&S.day<S.repose;
