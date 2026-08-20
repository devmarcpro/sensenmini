/* Sensen Mini — 11-character.js
   Écran de naissance et application des potentiels
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== CRÉATION DE PERSONNAGE ===== */
let cr={race:null,classe:null,el:null,an:null,pts:30,st:{force:5,dex:5,endu:5,vol:5,per:5,cha:5}};
function buildGate(){
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
  const setPot=(id,v)=>{if(S.sk[id]){S.sk[id].base=Math.max(S.sk[id].base,v);S.sk[id].pot=Math.max(S.sk[id].pot,v);}};
  const setLow=(id,v)=>{if(S.sk[id]){S.sk[id].base=v;S.sk[id].pot=v;}};
  for(const id in (R.pot||{}))R.pot[id]>=80?setPot(id,R.pot[id]):setLow(id,R.pot[id]);
  for(const id in (C.pot||{}))C.pot[id]>=80?setPot(id,C.pot[id]):setLow(id,C.pot[id]);
  EL_DOM[cr.el].concat(ANIMALS[cr.an].s).forEach(id=>setPot(id,90));
  for(const k in (C.sk||{}))if(S.sk[k])S.sk[k].lv=C.sk[k];
  S.race=cr.race;S.classe=cr.classe;S.born=[cr.el,cr.an];
  S.nom=cultName(pick(R.cult));
  S.or=(C.or||30);
  S.hp=maxHp();S.mana=maxMana();
}
