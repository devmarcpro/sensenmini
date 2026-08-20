/* Sensen Mini — 29-render.js
   HUD, scènes, cut-ins
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== RENDU ===== */
const $=id=>document.getElementById(id);
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;
  document.body.appendChild(d);setTimeout(()=>d.remove(),2400);}
function log(h){S.log.unshift(h);if(S.log.length>7)S.log.pop();
  const l=$('log');if(l)l.innerHTML=S.log.map(x=>'<div>'+x+'</div>').join('');}
let cutQ=[],cutBusy=false;
/* `hors` : une annonce d'interface (sauvegarde chargée…) s'affiche sans entrer
   dans la chronique, qui ne raconte que le monde */
function cutIn(k,t,sub,hors){if(!hors)chronique(k,t,sub);cutQ.push([k,t,sub]);if(!cutBusy)nextCut();}
/* ===== LA CHRONIQUE =====
   Le journal ne garde que sept lignes, et un idle se joue par absences :
   on revient après huit heures et l'on veut savoir ce qui est arrivé.
   Chaque cut-in — ce que le jeu juge digne d'être annoncé — s'inscrit ici,
   daté. C'est le récit de la partie, pas un flux de combat : les coups
   n'y entrent pas, seulement les seuils, les trouvailles et les morts. */
const CHRON_MAX=150;
function chronique(g,t,s){
  if(!S.race)return;
  S.chron=S.chron||[];
  const e={d:+S.day.toFixed(2),w:S.week,g,t,s:s||''};
  const p=S.chron[0];
  /* deux annonces identiques d'affilée se comptent au lieu de se répéter */
  if(p&&p.g===g&&p.t===t&&p.s===e.s){p.n=(p.n||1)+1;p.d=e.d;return;}
  S.chron.unshift(e);
  if(S.chron.length>CHRON_MAX)S.chron.length=CHRON_MAX;
}
function nextCut(){
  if(!cutQ.length){cutBusy=false;return;}
  cutBusy=true;const c=cutQ.shift();
  if(typeof sfx==='function')sfx(c[0]==='練'?'lvl':c[0]==='宝'||c[0]==='遺'?'loot':'cut');
  const d=document.createElement('div');d.className='cut';
  d.innerHTML='<b>'+c[0]+'</b><div class="t">'+c[1]+(c[2]?'<small>'+c[2]+'</small>':'')+'</div>';
  document.body.appendChild(d);
  setTimeout(()=>{d.className='cut out';setTimeout(()=>{d.remove();nextCut();},180);},1700);
  log('<span class="hi">'+c[0]+' '+c[1]+'</span>');
}
function float(t,c){const f=$('floaters');if(!f)return;
  const d=document.createElement('div');d.className='fl';d.textContent=t;d.style.color=c;
  d.style.left=(30+Math.random()*40)+'%';d.style.top=(26+Math.random()*28)+'%';
  f.appendChild(d);setTimeout(()=>d.remove(),900);}
function knock(){const b=$('blk');if(!b)return;b.className='blk';void b.offsetWidth;b.className='blk knock';}
function vecBar(v){return '<div style="display:flex;height:5px;margin-top:6px;border:1px solid var(--line)">'
  +v.map((p,i)=>p>.001?'<i style="display:block;height:100%;width:'+(p*100)+'%;background:'+EL[i].c+'"></i>':'').join('')+'</div>';}
function grp(k,label,right){return '<div class="grp"><b>'+k+'</b><span>'+label+'</span>'+(right?'<em>'+right+'</em>':'')+'</div>';}
/* ===== SECTIONS REPLIABLES =====
   Un établi bien garni faisait douze écrans de haut : on n'y trouvait plus
   rien. Une seule section ouverte à la fois par panneau, et le choix se retient. */
function foldOpen(panel,key,def){
  S.fold=S.fold||{};
  if(S.fold[panel]===undefined)S.fold[panel]=def===undefined?key:def;
  return S.fold[panel]===key;
}
function foldHead(panel,key,g,label,right,def){
  const open=foldOpen(panel,key,def);
  return '<button class="grp fold'+(open?' on':'')+'" data-fold="'+panel+':'+key+'">'
    +'<b>'+g+'</b><span>'+label+'</span>'+(right?'<em>'+right+'</em>':'')
    +'<i>'+(open?'▾':'▸')+'</i></button>';
}
function render(){
  const an=Math.floor(S.day/120)+1,jr=Math.floor(S.day%120)+1;
  $('hClock').textContent='AN '+an+' · J'+jr+' · 週'+S.week;
  const c=here();
  $('hCell').textContent=(c.town||BIOME[c.b].n)+' ('+c.x+','+c.y+')';
  $('hOcc').textContent={repos:'Repos',explore:'Exploration',recolte:'Récolte',percer:'Percement',atelier:'Atelier',combat:'Combat',donjon:'Donjon',dormir:'Sommeil'}[S.occ];
  $('hOr').textContent=S.or+' or';
  const mt=METEO[meteo(c)],T=feltTemp(),ts2=tempStress();
  const sky=$('hSky');
  sky.textContent=season().g+' '+Math.floor(HOUR())+'h '+mt.g+' '+Math.round(T)+'°';
  sky.style.color=ts2?(ts2.froid?'#3E7CB1':'#E4572E'):(isNight()?'#7E9187':'#E6E2D6');
  sky.style.borderColor=ts2?'var(--zhu)':'';
  const g=(id,v,m)=>{$('g'+id).style.width=Math.max(0,Math.min(100,v/m*100))+'%';
    $('g'+id+'T').textContent=Math.round(v)+'/'+Math.round(m);};
  g('Hp',S.hp,maxHp());g('En',S.end,100);g('Ma',S.mana,maxMana());g('Fa',S.faim,100);
  const st2=$('hStat');
  if(st2)st2.innerHTML=(S.st&&S.st.length)?statusTxt(S):'';
  if(sceneMode!==S.occ+(S.target||'')+(S.craft?S.craft.mk+(S.craft.ct||S.craft.f):'')+(EE.length>1?'g':''))buildScene();
  if(S.occ==='combat'||S.occ==='donjon'){renderCombat();return;}
  if(S.occ==='recolte'&&S.target){
    const t=harvestTime(S.target),p=$('hProg');
    if(p)p.style.width=Math.min(100,harvT/t*100)+'%';
    const q=$('hTxt');
    if(q)q.textContent=(S.mat[S.target]||0)+' en sac · '+t.toFixed(2)+' s / coup · +'+(1+Math.floor(lv(CAT[MAT[S.target].c].sk)/10))+' par coup';
  } else if(S.occ==='atelier'&&S.craft){
    const j=S.craft,skk=j.t==='form'?STATION[FORM[j.f].st].sk:STATION[COMP[j.ct].st].sk;
    const t=craftTime(j.mk,skk),p=$('hProg');
    if(p)p.style.width=Math.min(100,craftT/t*100)+'%';
    const q=$('hTxt');
    if(q)q.textContent=SKILLS[skk].n+' niv '+lv(skk)+' · '+t.toFixed(2)+' s la pièce · qualité moyenne '+QNAME(quality(lv(skk)));
  } else if(S.occ==='percer'){
    const c2=here(),p=$('hProg');
    if(p)p.style.width=(c2.dug/pierceNeed(c2.depth)*100)+'%';
    const q=$('hTxt');if(q)q.textContent=c2.dug+' / '+pierceNeed(c2.depth)+' blocs percés';
  }
}

function wheelSvg(){
  const c=44,r=31;
  const pt=i=>{const a=(-90+i*72)*Math.PI/180;return[c+r*Math.cos(a),c+r*Math.sin(a)];};
  let h='';
  for(let i=0;i<5;i++){const A=pt(i),B=pt((i+1)%5);h+='<line class="gen" x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'"/>';}
  for(let i=0;i<5;i++){const A=pt(i),B=pt((i+2)%5);h+='<line class="ke" x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'"/>';}
  for(let i=0;i<5;i++){const A=pt(i);
    h+='<rect class="node" id="nd'+i+'" x="'+(A[0]-10)+'" y="'+(A[1]-10)+'" width="20" height="20"/>'
      +'<text id="tx'+i+'" x="'+A[0]+'" y="'+(A[1]+1)+'">'+EL[i].g+'</text>';}
  return '<svg class="wheel" viewBox="0 0 88 88">'+h+'</svg>';
}
function combatScene(){
  const c=here(),w=weapon(),d=S.occ==='donjon'?c.dj:null;
  return '<div class="scene"><div class="scene-top">'
   +(d?'<span>'+d.nom+' · étage '+(d.f+1)+'/'+d.floors.length+' · salle '+(d.r+1)+'/'+d.floors[d.f].length
       +' '+ROOM[d.floors[d.f][d.r].t].g+'</span><span>puissance '+djPower().toFixed(1)+'</span>'
     :'<span>'+(c.town||BIOME[c.b].n)+' · corruption '+c.corr+'</span><span>DPS '+Math.round(dps)+'</span>')
   +'</div>'
   +'<div class="stage"><div class="gridfloor"></div><div class="bigk">戦</div>'
   +'<div class="eName" id="eName">—</div><div class="eInfo" id="eInfo"></div>'
   +'<div class="mob" id="mob"><div class="cam" id="mobCam"></div><b class="pk" id="mobPack"></b></div>'
   +'<div class="floaters" id="floaters"></div></div>'
   +'<div class="bar2"><span id="eHp" style="background:#C8332B"></span><em id="eHpT">—</em></div>'
   +'<div class="tele" id="tele"><span id="teleF"></span><b id="teleW"></b><em id="teleG"></em></div>'
   +'<div class="mobs" id="mobs"></div>'
   +'<div class="stances" id="stances">'+STANCE.map((st,i)=>
      '<button data-st="'+i+'" aria-pressed="'+(i===(S.stance||0))+'"><b>'+st.g+'</b>'+st.n.toUpperCase()+'<kbd>'+(i+1)+'</kbd></button>').join('')+'</div>'
   +'<div class="acts"><button id="guardBtn">護 GARDE<kbd>espace</kbd></button><button id="heavyBtn">重 LOURDE<kbd>D</kbd></button>'
   +(lv('dressage')||S.comps.length?'<button id="tameBtn">馴 APPRIVOISER</button>':'')
   +'<button data-flee="1">走 '+(S.occ==='donjon'?'REMONTER':'ROMPRE')+'</button></div>'
   +(escortList().length?'<div class="comps" id="comps"></div>':'')+'</div>'
   +'<div class="chain">'+wheelSvg()+'<div class="cbox"><div class="pastilles" id="past"></div>'
   +'<div class="cinfo"><div>Bonus <b id="cBonus">+0.00</b> · résolveur <b id="cRes" style="color:var(--terre)">×1.00</b>'
   +' · segments <b id="cSeg">0/5</b></div><div id="cNext">—</div>'
   +'<div>Arme : <b>'+(w?w.nom+' · '+FUNC[w.fn].d[0]+'d'+FUNC[w.fn].d[1]+' '+DT[FUNC[w.fn].t]:'aucune — les mains nues ne posent pas de segment')+'</b></div>'
   +'<div>Prise : <b>'+grip().n+'</b>'+(function(){const G=gripBonus(),g=grip();
      return g.k==='bouclier'?' — réduction +'+G.red.toFixed(1)+' sur toutes les zones, parade élargie, et une parade parfaite pose son élément dans la chaîne'
        :g.k==='deuxmains'?' — dégâts ×'+G.dmg.toFixed(2)+', mais pas de seconde main'
        :g.k==='dualwield'?' — la seconde main pose son propre segment : la chaîne tourne plus vite'
        :g.k==='dist'?' — la Dextérité porte le trait, tu tiens la distance, mais rien ne se pare'
        :'';})()+'</div>'
   +'</div></div>';
}
function renderCombat(){
  if(!E)return;
  const w=weapon();
  const eh=$('eHp');if(!eh)return;
  eh.style.width=Math.max(0,E.hp)/E.max*100+'%';
  eh.style.background=EL[domi(E.vec)].c;
  $('eHpT').textContent=Math.round(Math.max(0,E.hp))+' / '+Math.round(E.max);
  $('eName').textContent=E.nom;$('eName').style.color=EL[domi(E.vec)].c;
  $('eInfo').innerHTML='ARMURE <b>'+E.arm+'</b><br>FRAPPE <b>'+DT[E.dt]+'</b><br>MATCHUP <b>×'
    +(w?vmult(itemVec(w),E.vec,multOff).toFixed(2):'—')+'</b>'
    +(E.st&&E.st.length?'<br>'+statusTxt(E):'');
  const mo=$('mob');
  if(mo){mo.style.setProperty('--e',EL[domi(E.vec)].c);
    mo.className='mob'+(E.stg>0?' stag':'')+(E.rare?' rare':'')+(hitFx>0?' hit':'')+(E.boss?' boss':'');
    /* la silhouette ne se réassemble que si l'espèce ou le gabarit a changé :
       recomposer une trentaine de pavés à chaque image serait du gâchis */
    const coul=EL[domi(E.vec)].c;
    const cam=$('mobCam'),sig=(E.cre||'x')+':'+voxMul(E)+':'+coul;
    if(cam&&cam.dataset.sig!==sig){cam.dataset.sig=sig;cam.innerHTML=voxelHtml(E.cre,voxMul(E),coul);}
    const pk=$('mobPack');if(pk)pk.textContent=EE.length>1?'×'+EE.length:'';}
  const t=$('tele'),P=patOf(E),fen=parryWinVs(E);
  if(E.w>=0){
    const we=E.wEff||E.wind;
    t.className='tele on'+(fen?'':' nopar');
    $('teleF').style.width=(E.w/we*100)+'%';
    $('teleW').style.width=fen?Math.min(100,fen/we*100)+'%':'0';
    $('guardBtn').className=(fen&&(we-E.w)<=fen)?'armed':'';
    const tg=$('teleG');if(tg)tg.textContent=P.g+' '+P.n+(fen?'':' — imparable');}
  else{t.className='tele';$('teleF').style.width='0';$('guardBtn').className=S.guard?'held':'';
    const tg=$('teleG');if(tg)tg.textContent='';}
  /* le groupe engagé : celles que tu ne regardes pas frappent dans ton dos */
  const mb=$('mobs');
  if(mb){
    if(EE.length<2)mb.innerHTML='';
    else{
      if(mb.children.length!==EE.length)
        mb.innerHTML=EE.map((x,i)=>'<button class="mchip" data-foc="'+i+'"><b></b><span class="mn"></span><i class="mb2"><u></u></i></button>').join('');
      EE.forEach((x,i)=>{const el=mb.children[i];if(!el)return;
        el.className='mchip'+(i===foc?' on':'')+(x.w>=0?' wind':'');
        el.dataset.foc=i;
        el.querySelector('b').textContent=x.cre&&CREATURE[x.cre]?CREATURE[x.cre].g:'獣';
        el.querySelector('b').style.color=EL[domi(x.vec)].c;
        el.querySelector('.mn').textContent=(i===foc?'':'背 ')+Math.round(Math.max(0,x.hp));
        el.querySelector('u').style.width=Math.max(0,x.hp)/x.max*100+'%';
        el.querySelector('u').style.background=EL[domi(x.vec)].c;});
    }
  }
  const p=$('past');
  if(p.children.length!==capChain())p.innerHTML=Array.from({length:capChain()},()=>'<i></i>').join('');
  for(let i=0;i<capChain();i++){const el=p.children[i],sg=S.seg[i];
    el.style.background=sg!==undefined?EL[sg].c:'#000';
    el.style.borderColor=sg!==undefined?EL[sg].c:'#3C4F47';}
  $('cBonus').textContent='+'+S.bonus.toFixed(2);
  $('cRes').textContent='×'+(1+S.bonus).toFixed(2);
  $('cSeg').textContent=S.seg.length+'/'+capChain();
  const prev=S.seg.length?S.seg[S.seg.length-1]:null;
  $('cNext').innerHTML=prev===null?'Le premier segment ne rapporte pas de transition.'
    :'Engendré : <b style="color:'+EL[gen(prev)].c+'">'+EL[gen(prev)].n+'</b> +0.35 · hors ordre +0.20 · même élément +0.10';
  const cw=$('comps');
  if(cw){cw.innerHTML=escortList().map(c=>{const o=ORDERS.find(x=>x.k===c.order);
    return '<button class="chip" data-cyc="'+c.id+'"><b style="color:'+EL[c.el].c+'">'+o.g+'</b>'+c.nom
     +'<br>niv '+c.lv+' · '+o.n+'<span class="cb"><i style="width:'+(c.hp/c.max*100)+'%"></i></span></button>';}).join('');}
  const ce=w?domi(itemVec(w)):-1;
  for(let i=0;i<5;i++){const nd=$('nd'+i),tx=$('tx'+i);if(!nd)continue;
    const on=i===ce;nd.setAttribute('fill',on?EL[i].c:'#131817');
    nd.setAttribute('stroke',on?EL[i].c:'#3C4F47');
    tx.setAttribute('class',on?'act':'');}
}

let sceneMode='';
function buildScene(){
  sceneMode=S.occ+(S.target||'')+(S.craft?S.craft.mk+(S.craft.ct||S.craft.f):'')+(EE.length>1?'g':'');
  const c=here();
  if(S.occ==='combat'||S.occ==='donjon'){$('scene').innerHTML=combatScene();return;}
  if(S.occ==='atelier'&&S.craft){
    const j=S.craft,col=MAT[j.mk].col||EL[domi(formVec(j.t==='form'?j.f:(j.f==='brut'?'brut':j.f),j.mk))].c;
    const nom=j.t==='form'?FORM[j.f].n:COMP[j.ct].n;
    const gly=j.t==='form'?FORM[j.f].g:COMP[j.ct].g;
    $('scene').innerHTML='<div class="scene"><div class="scene-top"><span>'+(j.t==='form'?STATION[FORM[j.f].st].n:STATION[COMP[j.ct].st].n)+'</span><span>'+nom+' de '+matName(j.mk)+'</span></div>'
     +'<div class="stage"><div class="gridfloor"></div><div class="bigk">'+gly+'</div>'
     +'<div class="blk" id="blk" style="--e:'+col+'"><i class="fr"></i><i class="rt"></i><i class="tp"></i></div>'
     +'<div class="floaters" id="floaters"></div></div>'
     +'<div class="bar2"><span id="hProg" style="background:#C8332B"></span><em id="hTxt"></em></div>'
     +'<div style="display:flex;gap:6px;margin-top:7px"><button class="btn" data-occ="repos" style="flex:1;background:#171C1A;color:var(--paper);border-color:#000">止 ARRÊTER</button></div></div>';
    return;
  }
  if(S.occ==='recolte'||S.occ==='percer'){
    const mk=S.occ==='percer'?STRATA[Math.min(5,c.depth+1)].rock:S.target;
    if(!mk){$('scene').innerHTML='';return;}
    const col=MAT[mk].col||EL[domi(matVec(mk))].c;
    $('scene').innerHTML='<div class="scene"><div class="scene-top"><span>'+BIOME[c.b].n+' · strate '+c.depth+'</span><span>'+matName(mk)+' · dureté '+MAT[mk].d+'</span></div>'
     +'<div class="stage"><div class="gridfloor"></div><div class="bigk">'+CAT[MAT[mk].c].g+'</div>'
     +'<div class="blk" id="blk" style="--e:'+col+'"><i class="fr"></i><i class="rt"></i><i class="tp"></i></div>'
     +'<div class="floaters" id="floaters"></div></div>'
     +'<div class="bar2"><span id="hProg"></span><em id="hTxt"></em></div>'
     +'<div style="display:flex;gap:6px;margin-top:7px"><button class="btn" data-occ="repos" style="flex:1;background:#171C1A;color:var(--paper);border-color:#000">止 ARRÊTER</button></div></div>';
  } else $('scene').innerHTML='';
}
