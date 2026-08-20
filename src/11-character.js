/* Sensen Mini — 11-character.js
   Écran de naissance et application des potentiels
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== CRÉATION DE PERSONNAGE ===== */
let cr={race:null,classe:null,el:null,an:null,pos:null,pts:30,st:{force:5,dex:5,endu:5,vol:5,per:5,cha:5}};
/* ----- lieu de naissance (6.3) : le joueur choisit son risque sur une carte vague ----- */
const START_R=4;
const BIOME_START={plaine:3,foret:3,taiga:2,cote:2,marecage:1.5,toundra:1,desert:1,montagne:1,foretmana:1,cendres:0,marcorr:0,montcris:0};
function startScore(c){
  let s=BIOME_START[c.b]||0;
  s-=c.corr/40;
  if(c.poi==='donjon')s-=5;
  if(c.poi==='village'||townAt(c.x,c.y))s+=1;
  else for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const n=genCell(c.x+dx,c.y+dy);if(n.poi==='village'){s+=.6;dx=dy=3;}}
  s+=BIOME[c.b].fert*.5;
  return s;
}
function defaultStart(){
  let best=null,bs=-99;
  for(let dy=-START_R;dy<=START_R;dy++)for(let dx=-START_R;dx<=START_R;dx++){
    const c=cell(dx,dy),sc=startScore(c);
    if(sc>bs){bs=sc;best=[dx,dy];}}
  return best||[0,0];
}
const dangerBand=corr=>corr>66?['mortelle','#C8332B']:corr>33?['dangereuse','#D9A441']:['paisible','#4FA96B'];
function paintPos(){
  if(!cr.pos)cr.pos=defaultStart();
  let h='';
  for(let dy=-START_R;dy<=START_R;dy++)for(let dx=-START_R;dx<=START_R;dx++){
    const c=cell(dx,dy),sel=cr.pos[0]===dx&&cr.pos[1]===dy,band=dangerBand(c.corr);
    const vil=c.poi==='village'||townAt(dx,dy);
    h+='<div class="cell'+(sel?' here':'')+'" data-cpos="'+dx+','+dy+'" style="background:'+BIOME[c.b].c+'" title="'+BIOME[c.b].n+' · '+band[0]+'">'
      +(vil?'<span class="poi">村</span>':'')+(c.poi==='donjon'?'<span class="poi">塔</span>':'')
      +'<span class="dg" style="background:'+band[1]+'"></span></div>';
  }
  $('pkPos').innerHTML=h;
  const c=cell(cr.pos[0],cr.pos[1]),band=dangerBand(c.corr);
  $('posInfo').textContent=cr.pos[0]+','+cr.pos[1];
  $('posHint').innerHTML='<b style="color:'+band[1]+'">'+BIOME[c.b].n+' — '+band[0]+'</b>'
    +(c.poi==='donjon'?' · un donjon occupe la cellule : impossible d\'y bâtir':'')
    +(c.poi==='village'||townAt(c.pos?c.x:cr.pos[0],cr.pos[1])?' · un village sur place':'')
    +' · fertilité '+BIOME[c.b].fert+' · on y trouve '+BIOME[c.b].mats.slice(0,4).map(matName).join(', ')
    +'. Le danger sort des couches de bruit, pas de la distance : une case mortelle rapporte plus, tout de suite.';
}
function buildGate(){
  paintPos();
  $('pkRace').innerHTML=Object.keys(RACE).map(k=>'<button data-race="'+k+'"><b>'+RACE[k].g+'</b>'+RACE[k].n
    +'<i>'+RACE[k].b+'</i></button>').join('');
  $('pkClass').innerHTML=Object.keys(CLASSE).map(k=>{const c=CLASSE[k];
    const st2=Object.keys(c.st||{}).map(x=>'+'+c.st[x]+' '+STATS.find(y=>y[0]===x)[1]).join(', ');
    return '<button data-cl="'+k+'"><b>'+c.g+'</b>'+c.n+'<i>'+(st2||'+15 points')+'</i></button>';}).join('');
  $('pkEl').innerHTML=EL.map((e,i)=>'<button data-cel="'+i+'"><b style="color:'+e.c+'">'+e.g+'</b>'+e.n+'</button>').join('');
  $('pkAn').innerHTML=ANIMALS.map((a,i)=>'<button data-can="'+i+'"><b>'+a.g+'</b>'+a.n+'</button>').join('');
  paintStats();
  $('gate').hidden=false;
}
function paintStats(){
  $('ptLeft').textContent=cr.pts+' points restants';
  $('pkStats').innerHTML=STATS.map(([k,n,d])=>'<div class="stat"><span>'+n+'</span>'
    +'<button data-sm="'+k+'">−</button><b>'+cr.st[k]+'</b><button data-sp="'+k+'">+</button>'
    +'<i>'+d+'</i></div>').join('');
}
function gatePreview(){
  const ok=cr.race&&cr.classe&&cr.el!==null&&cr.an!==null;
  $('goBtn').disabled=!ok;
  if(!ok)return;
  const dl=EL_DOM[cr.el].concat(ANIMALS[cr.an].s).filter(x=>SKILLS[x]).map(x=>SKILLS[x].n);
  const tr=TRINE.find(t=>t.includes(cr.an));
  $('gPrev').innerHTML='Signe <b style="color:'+EL[cr.el].c+'">'+EL[cr.el].g+ANIMALS[cr.an].g+'</b> — '
    +EL[cr.el].n+' '+ANIMALS[cr.an].n+'<br>Plancher de potentiel 90 sur : '+dl.join(' · ')
    +'<br>Trine harmonieuse '+tr.map(i=>ANIMALS[i].g).join(' ')+' : ces PNJ t\'apprécient 25% plus vite ; '
    +'le signe opposé ('+ANIMALS[(cr.an+6)%12].g+' '+ANIMALS[(cr.an+6)%12].n+') 20% moins vite.';
}
function applyBirth(){
  const R=RACE[cr.race],C=CLASSE[cr.classe];
  STATS.forEach(([k])=>S.stats[k]=cr.st[k]);
  for(const k in (R.st||{}))S.stats[k]+=R.st[k];
  for(const k in (C.st||{}))S.stats[k]+=C.st[k];
  /* potentiels de base : race, classe, puis naissance */
  /* un même identifiant peut désigner une compétence ou une stat : les deux ont un potentiel */
  const setPot=(id,v)=>{const t=S.sk[id]||S.sx[id];if(t){t.base=Math.max(t.base,v);t.pot=Math.max(t.pot,v);}};
  const setLow=(id,v)=>{const t=S.sk[id]||S.sx[id];if(t){t.base=v;t.pot=v;}};
  /* la stat forte d'une race ou d'une classe monte aussi plus vite (6.4) */
  for(const k in (R.st||{}))if(S.sx[k])setPot(k,100+R.st[k]*10);
  for(const k in (C.st||{}))if(S.sx[k])setPot(k,100+C.st[k]*10);
  for(const id in (R.pot||{}))R.pot[id]>=80?setPot(id,R.pot[id]):setLow(id,R.pot[id]);
  for(const id in (C.pot||{}))C.pot[id]>=80?setPot(id,C.pot[id]):setLow(id,C.pot[id]);
  EL_DOM[cr.el].concat(ANIMALS[cr.an].s).forEach(id=>setPot(id,90));
  for(const k in (C.sk||{}))if(S.sk[k])S.sk[k].lv=C.sk[k];
  S.race=cr.race;S.classe=cr.classe;S.born=[cr.el,cr.an];
  S.pos=(cr.pos||defaultStart()).slice();here().seen=true;
  S.nom=cultName(pick(R.cult));
  S.or=(C.or||30);
  S.day=7/24;                                   /* on naît à l'aube, pas à minuit */
  S.hp=maxHp();S.mana=maxMana();
}
