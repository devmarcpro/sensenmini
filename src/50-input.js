/* Sensen Mini — 31-input.js
   Entrées clavier et tactiles
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== ENTRÉES ===== */
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;paint();
  b.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});});
/* fondu aux bords de la barre d'onglets quand elle défile (téléphone) */
function tabsEdges(){const n=$('tabs');
  n.classList.toggle('more-l',n.scrollLeft>4);
  n.classList.toggle('more-r',n.scrollLeft+n.clientWidth<n.scrollWidth-4);}
$('tabs').addEventListener('scroll',tabsEdges,{passive:true});
addEventListener('resize',tabsEdges);tabsEdges();
$('tip').addEventListener('click',e=>{
  if(e.target.closest('[data-tipok]'))tipOk();
  else if(e.target.closest('[data-tipoff]'))tipsOff();});
/* appui long sur tactile : ni menu contextuel ni sélection de texte dans le jeu */
['scene','panel','tabs'].forEach(id=>$(id).addEventListener('contextmenu',e=>{if(e.target.closest('button,.cell'))e.preventDefault();}));
function handle(e){
  const t=e.target;let b;
  if(b=t.closest('[data-go]')){const p=b.dataset.go.split(',');travel(+p[0],+p[1]);return;}
  if(b=t.closest('[data-occ]')){S.occ=b.dataset.occ;if(S.occ==='percer')harvT=0;sceneMode='';paint();return;}
  if(b=t.closest('[data-harv]')){S.target=b.dataset.harv;S.occ='recolte';harvT=0;sceneMode='';paint();return;}
  if(b=t.closest('[data-eat]')){eat(b.dataset.eat);return;}
  if(b=t.closest('[data-eatfood]')){eatFood(b.dataset.eatfood);paint();return;}
  if(b=t.closest('[data-plot]')){openPlot=openPlot===+b.dataset.plot?null:+b.dataset.plot;openSlot=null;paint();return;}
  if(b=t.closest('[data-newplot]')){buildPlot(openPlot,b.dataset.newplot);paint();return;}
  if(b=t.closest('[data-raze]')){razePlot(+b.dataset.raze);openPlot=null;openSlot=null;paint();return;}
  if(b=t.closest('[data-sow]')){plantCrop(openPlot,b.dataset.sow);paint();return;}
  if(b=t.closest('[data-slot]')){openSlot=openSlot===+b.dataset.slot?null:+b.dataset.slot;paint();return;}
  if(b=t.closest('[data-put]')){const q=b.dataset.put.split(':');
    placeSlot(openPlot,openSlot,q[0],q[1]);openSlot=null;paint();return;}
  if(b=t.closest('[data-clear]')){const P=plots(here());
    if(P[openPlot]&&P[openPlot].slots)P[openPlot].slots[openSlot]=null;openSlot=null;paint();return;}
  if(b=t.closest('[data-carry]')){toggleCarry(b.dataset.carry);paint();return;}
  if(b=t.closest('[data-auto]')){buyAuto(b.dataset.auto);paint();return;}
  if(b=t.closest('[data-tips]')){if(S.tips===false)tipsReset();else tipsOff();paint();return;}
  if(b=t.closest('[data-sfx]')){S.sfx=S.sfx===false?true:false;if(S.sfx!==false)sfx('coin');paint();return;}
  if(b=t.closest('[data-export]')){saveIO=saveIO==='export'?null:'export';paint();return;}
  if(b=t.closest('[data-import]')){saveIO=saveIO==='import'?null:'import';paint();return;}
  if(b=t.closest('[data-closeio]')){saveIO=null;paint();return;}
  if(b=t.closest('[data-copysave]')){const ta=$('saveTxt');if(ta){ta.select();
    (navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject()).then(()=>toast('Sauvegarde copiée'),()=>{try{document.execCommand('copy');toast('Sauvegarde copiée');}catch(e){toast('Sélectionne le texte et copie-le');}});}
    return;}
  if(b=t.closest('[data-doimport]')){const ta=$('saveTxt');saveIO=null;if(ta)importSave(ta.value);paint();return;}
  if(b=t.closest('[data-newgame]')){if(!newGameArmed){newGameArmed=true;paint();setTimeout(()=>{newGameArmed=false;if(tab==='autos')paint();},4000);return;}
    newGameArmed=false;newGame();return;}
  if(b=t.closest('[data-draw]')){const it=rackList()[+b.dataset.draw];
    if(it&&S.end>=5)drawFrom(domi(itemVec(it)));paint();return;}
  if(b=t.closest('[data-mode]')){const c=S.comps[+b.dataset.mode];
    if(c){const cyc=c.type==='bete'?['permanent','territorial','betail']:['permanent','territorial'];
      c.mode=cyc[(cyc.indexOf(c.mode)+1)%cyc.length];
      if(c.mode==='betail'){c.esc=false;log(c.nom+' rejoint l\'enclos — viande et parties à la semaine, plus de combat.');}}
    paint();return;}
  if(b=t.closest('[data-arm]')){const q=b.dataset.arm.split(':');armComp(+q[0],+q[1]);paint();return;}
  if(b=t.closest('[data-esc]')){const c=S.comps[+b.dataset.esc];
    if(c){if(c.esc)c.esc=false;
      else{if(c.mode!=='territorial'&&escortUsed()>=escortMax())return toast('Escorte pleine ('+escortMax()+' places)');c.esc=true;}}
    sceneMode='';paint();return;}
  if(b=t.closest('[data-ord]')){const c=S.comps[+b.dataset.ord];
    if(c)c.order=ORDK[(ORDK.indexOf(c.order)+1)%4];paint();return;}
  if(b=t.closest('[data-revive]')){revive(+b.dataset.revive);paint();return;}
  if(b=t.closest('[data-free]')){const c=S.comps[+b.dataset.free];
    if(c){S.comps.splice(+b.dataset.free,1);log(c.nom+' reprend sa liberté.');}paint();return;}
  if(b=t.closest('[data-feed]')){const c=S.comps[+b.dataset.feed];
    const k=Object.keys(S.food)[0];if(c&&k)feedComp(c,k);paint();return;}
  if(b=t.closest('[data-food]')){const k=b.dataset.food;
    const i=selFood.indexOf(k);
    if(i>=0)selFood.splice(i,1);else if(selFood.length<5)selFood.push(k);
    paint();return;}
  if(b=t.closest('[data-clearfood]')){selFood=[];paint();return;}
  if(b=t.closest('[data-cook]')){cook(selFood.slice());selFood=[];paint();return;}
  if(b=t.closest('[data-distill]')){distill(selFood.slice());selFood=[];paint();return;}
  if(b=t.closest('[data-drink]')){drink(+b.dataset.drink);paint();return;}
  if(b=t.closest('[data-claim]')){claimCell();paint();return;}
  if(b=t.closest('[data-deposit]')){deposit(b.dataset.deposit==='all'?S.or:+b.dataset.deposit);paint();return;}
  if(b=t.closest('[data-withdraw]')){const n=Math.floor(S.tresor);S.or+=n;S.tresor=0;
    log('Retiré '+n+' or du trésor');paint();return;}
  if(b=t.closest('[data-eatv]')){eatVivres();paint();return;}
  if(b=t.closest('[data-gov]')){S.gov=b.dataset.gov;
    cutIn('国','Royaume fondé',GOV[S.gov].n);paint();return;}
  if(b=t.closest('[data-diplo]')){diplo(+b.dataset.diplo,b.dataset.dt);paint();return;}
  if(b=t.closest('[data-quest]')){newQuest(b.dataset.quest);paint();return;}
  if(b=t.closest('[data-abandon]')){S.quest=null;paint();return;}
  if(b=t.closest('[data-deliver]')){completeQuest();paint();return;}
  if(b=t.closest('[data-talk]')){const n=S.npcs.find(x=>x.id===b.dataset.talk);if(n)talkTo(n);paint();return;}
  if(b=t.closest('[data-gift]')){const n=S.npcs.find(x=>x.id===b.dataset.gift);if(n)giveGift(n);paint();return;}
  if(b=t.closest('[data-rec]')){const n=S.npcs.find(x=>x.id===b.dataset.rec);if(n)recruit(n);paint();return;}
  if(b=t.closest('[data-train]')){const n=S.npcs.find(x=>x.id===b.dataset.train);if(n)trainWith(n);paint();return;}
  if(b=t.closest('[data-assaut]')){assaut();paint();return;}
  if(b=t.closest('[data-conq]')){conquerir();paint();return;}
  if(b=t.closest('[data-sellmat]')){sellMat(b.dataset.sellmat);paint();return;}
  if(b=t.closest('[data-buy]')){const q=b.dataset.buy.split(':');buyOffer(q[0],+q[1]);paint();return;}
  if(b=t.closest('[data-sellitem]')){sellItem(+b.dataset.sellitem);paint();return;}
  if(b=t.closest('[data-sleep]')){dormir(b.dataset.sleep==='2');paint();return;}
  if(b=t.closest('[data-dj]')){enterDungeon();paint();return;}
  if(b=t.closest('[data-shrine]')){const c=here();c.shrine=S.week+1;
    dropBook(4);gainXp('perception_sk',40);paint();return;}
  if(b=t.closest('[data-read]')){readBook(+b.dataset.read);paint();return;}
  if(b=t.closest('[data-surch]')){S.surchauffe=!S.surchauffe;paint();return;}
  if(b=t.closest('[data-st]')){S.stance=+b.dataset.st;
    document.querySelectorAll('#stances button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.st===S.stance));return;}
  if(b=t.closest('[data-station]')){buildStation(b.dataset.station);paint();return;}
  if(b=t.closest('[data-tr]')){startCraft({t:'form',f:b.dataset.tr,mk:b.dataset.mat});paint();return;}
  if(b=t.closest('[data-mkc]')){startCraft({t:'comp',ct:b.dataset.mkc,f:b.dataset.f,mk:b.dataset.mat});paint();return;}
  if(b=t.closest('[data-doasm]')){
    const card=b.closest('[data-asm]'),p=card.dataset.asm.split(':');
    const picks=[...card.querySelectorAll('select')].map(x=>x.value);
    assembleFrom(p[0],p[1],picks);paint();return;}
  if(b=t.closest('[data-doarm]')){
    const card=b.closest('[data-arm]');
    const picks=[...card.querySelectorAll('select')].map(x=>x.value);
    assembleArmor(card.dataset.arm,picks);paint();return;}
  if(b=t.closest('[data-cutgem]')){const q=b.dataset.cutgem.split(':');cutGem(q[0],q[1]);paint();return;}
  if(b=t.closest('[data-unsocket]')){const q=b.dataset.unsocket.split(':');unsocketGem(q[0]+':'+q[1],+q[2]);paint();return;}
  if(b=t.closest('[data-socket]')){const card=b.closest('[data-gemcard]');const sel=card&&card.querySelector('[data-gemsel]');
    if(sel)socketGem(b.dataset.socket,+sel.value);paint();return;}
  if(b=t.closest('[data-equip]')){equipItem(+b.dataset.equip);paint();return;}
  if(b=t.closest('[data-unslot]')){unequip(b.dataset.unslot);paint();return;}
  if(b=t.closest('[data-scrap]')){const it=S.items[+b.dataset.scrap];
    if(it){S.or+=Math.round(itemValue(it)/3);S.items.splice(+b.dataset.scrap,1);}paint();return;}
}
$('panel').addEventListener('click',handle);
$('scene').addEventListener('click',handle);
$('panel').addEventListener('input',e=>{
  if(e.target.dataset.tax){S.tax=+e.target.value/100;
    e.target.nextElementSibling.textContent='revenu hebdomadaire estimé : '
      +myTowns().reduce((a,t)=>a+Math.round(t.pop*3*t.prosp*S.tax*10),0)+' or';return;}
  if(e.target.dataset.thr){S.thr=+e.target.value;
  e.target.nextElementSibling.textContent='seuil actuel : '+S.thr;}});
$('panel').addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.sp!==undefined){
    const i=+t.dataset.sp,j=+t.dataset.j;
    S.spells[i]=S.spells[i]||[];
    if(t.value===''){S.spells[i][j]=undefined;}
    else{const mi=+t.value;
      S.spells.forEach((sp,si)=>sp&&sp.forEach((v,vj)=>{if(v===mi&&!(si===i&&vj===j))S.spells[si][vj]=undefined;}));
      S.spells[i][j]=mi;}
    S.spells[i]=S.spells[i].filter(x=>x!==undefined);
    paint();return;}
  if(t.dataset.role){const cc=S.world[t.dataset.role];if(cc)cc.claim=t.value;paint();return;}
  if(t.dataset.assign){const n=S.npcs.find(x=>x.id===t.dataset.assign);
    if(n){n.assign=t.value||null;if(n.assign&&!n.cell.includes(',')===false&&!S.claims.includes(n.cell))n.cell=S.claims[0]||n.cell;}
    paint();return;}
  if(t.dataset.acell){const n=S.npcs.find(x=>x.id===t.dataset.acell);
    if(n&&t.value)n.cell=t.value;paint();return;}
  if(t.dataset.post!==undefined){
    const j=+t.dataset.post;
    if(t.value==='')S.postures[j]=undefined;else S.postures[j]=+t.value;
    S.postures=S.postures.filter(x=>x!==undefined);
    paint();return;}
});
$('scene').addEventListener('pointerdown',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='guardBtn'){e.preventDefault();tryParry();}
  if(b.id==='heavyBtn'){e.preventDefault();attack(true);}
  if(b.id==='tameBtn'){e.preventDefault();tameBeast();}
  if(b.dataset.cyc){e.preventDefault();const c=S.comps.find(x=>x.id===b.dataset.cyc);
    if(c)c.order=ORDK[(ORDK.indexOf(c.order)+1)%4];}
});
addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='Space'&&S.occ==='combat'){e.preventDefault();tryParry();}
  if(e.code==='KeyD'&&S.occ==='combat'){e.preventDefault();attack(true);}
  if(/^Digit[1-4]$/.test(e.code)&&S.occ==='combat'){S.stance=+e.code.slice(5)-1;
    document.querySelectorAll('#stances button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.st===S.stance));}
});
addEventListener('keyup',e=>{if(e.code==='Space')S.guard=false;});
$('gate').addEventListener('click',e=>{
  const cp=e.target.closest('[data-cpos]');
  if(cp){cr.pos=cp.dataset.cpos.split(',').map(Number);paintPos();return;}
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.race){cr.race=d.race;document.querySelectorAll('[data-race]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.race===cr.race));}
  if(d.cl){cr.classe=d.cl;cr.pts=30+(CLASSE[d.cl].pts||0);
    STATS.forEach(([k])=>cr.st[k]=5);paintStats();
    document.querySelectorAll('[data-cl]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.cl===cr.classe));}
  if(d.cel!==undefined){cr.el=+d.cel;document.querySelectorAll('[data-cel]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.cel===cr.el));}
  if(d.can!==undefined){cr.an=+d.can;document.querySelectorAll('[data-can]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.can===cr.an));}
  if(d.cpos!==undefined){cr.pos=d.cpos.split(',').map(Number);paintPos();}
  if(d.sp&&cr.pts>0&&cr.st[d.sp]<15){cr.st[d.sp]++;cr.pts--;paintStats();}
  if(d.sm&&cr.st[d.sm]>5){cr.st[d.sm]--;cr.pts++;paintStats();}
  gatePreview();
});
$('goBtn').onclick=()=>{
  applyBirth();starterKit();
  $('gate').hidden=true;
  here().seen=true;paint();
  cutIn('生',S.nom+', '+RACE[S.race].n+' '+CLASSE[S.classe].n,'signe '+EL[S.born[0]].g+ANIMALS[S.born[1]].g);
  log('<span class="in">'+S.nom+' ouvre les yeux en pleine nature. Aucun tutoriel, aucune quête imposée.</span>');
};
addEventListener('pointerdown',()=>{ptrDown=true;});
addEventListener('pointerup',()=>{ptrDown=false;S.guard=false;});
/* un doigt qui glisse hors du bouton ou un défilement annule le geste : la garde ne doit pas rester coincée */
addEventListener('pointercancel',()=>{ptrDown=false;S.guard=false;});
addEventListener('blur',()=>{ptrDown=false;S.guard=false;});
