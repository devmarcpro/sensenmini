/* Sensen Mini — 15-companions.js
   Escorte, ordres, apprivoisement, résurrection
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   COMPAGNONS (5.1 roue d'ordres / 12 / E.17)
   Parité totale avec le joueur : ils progressent par l'usage, ils
   vieillissent, ils tombent — et on les relève chez un prêtre.
   ================================================================== */
const ORDERS=[
  {k:'suivre',g:'従',n:'Suivre',dmg:0,aggro:0,d:'ne combat pas, se contente de suivre'},
  {k:'attaquer',g:'攻',n:'Attaquer',dmg:1.0,aggro:1.0,d:'frappe ta cible, prend sa part de coups'},
  {k:'tenir',g:'守',n:'Tenir',dmg:.6,aggro:2.2,d:'encaisse à ta place, frappe moins fort'},
  {k:'repli',g:'退',n:'Repli',dmg:.35,aggro:.2,d:'reste en retrait, harcèle de loin'},
];
const ORDK=ORDERS.map(o=>o.k);
/* E.17 : places_escorte = 1 + Charisme/5 + Leadership/10 */
const escortMax=()=>1+Math.floor(st('cha')/5)+Math.floor(lv('leadership')/10);
const escortList=()=>S.comps.filter(c=>c.esc&&!c.dead&&c.mode!=='betail'
  &&(c.mode!=='territorial'||S.claims.includes(key(S.pos[0],S.pos[1]))));
/* le suiveur territorial ne compte pas dans les places d'escorte (E.17) */
const escortUsed=()=>S.comps.filter(c=>c.esc&&!c.dead&&c.mode!=='territorial').length;
function compFromNpc(n){
  return {id:'c'+(S.nid++),src:n.id,type:'pnj',nom:n.nom,el:n.sign[0],lv:n.lv,
    hp:40+n.lv*9,max:40+n.lv*9,xp:0,mood:n.mood,order:'attaquer',esc:false,dead:0,mode:'permanent',eq:null,pot:90};
}
function tameBeast(){
  if(!E)return toast('Aucune créature');
  if(E.cre&&CREATURE[E.cre]&&!CREATURE[E.cre].tame)return toast(E.nom+' ne s\'apprivoise pas');
  /* DD = 10 + niveau de combat de la cible / 2 ; une cible affaiblie donne un bonus */
  const power=1+here().corr/26+here().depth*.6;
  const lvCible=Math.round(power*5)+(E.rare?8:0);
  const dd=10+Math.round(lvCible/2);
  const ratio=E.hp/E.max;
  const bonus=ratio<.25?4:ratio<.5?2:0;
  const jet=d20()+lv('dressage')/2+st('cha')/4+bonus;
  if(jet<dd){gainXp('dressage',20+dd);
    return log('<span class="bd">Elle se dérobe — jet '+jet.toFixed(1)+(bonus?' (dont +'+bonus+' pour la fatigue)':'')
      +' contre DD '+dd+'</span>');}
  gainXp('dressage',60+dd*5);
  if(S.comps.length>=12)return toast('Trop de bêtes — libères-en une');
  const el=domi(E.vec),l=Math.max(1,lvCible);
  S.comps.push({id:'c'+(S.nid++),type:'bete',nom:(E.cre&&CREATURE[E.cre]?CREATURE[E.cre].n:pick(BEASTN))+' '+EL[el].n.toLowerCase(),cre:E.cre||null,
    el,lv:l,hp:36+l*8,max:36+l*8,xp:0,mood:70,order:'attaquer',esc:false,dead:0,mode:'permanent',eq:null,pot:90});
  if(E.cre)noteBestiaire(E.cre,'a');
  removeEnemy(E);questTick('tame',1);
  cutIn('馴','Apprivoisée','niveau '+l+' · '+EL[el].n);
}
const compEl=c=>c.eq?domi(itemVec(c.eq)):c.el;
function compDmg(c,tgt){
  tgt=tgt||E;if(!tgt)return 0;
  const o=ORDERS.find(x=>x.k===c.order);
  const moodF=Math.max(.5,Math.min(1.2,c.mood/100*1.4));
  let d=(2.2+c.lv*1.5)*o.dmg*moodF*weakF(c);
  if(c.eq){const F=FUNC[c.eq.fn];
    d+=roll(F.d[0],F.d[1])*(c.eq.durBase/20)*c.eq.q*.55;}
  d*=vmult(V({[compEl(c)]:1}),tgt.vec,multOff);
  return d;
}
function armComp(i,itemIdx){
  const c=S.comps[i],it=S.items[itemIdx];
  if(!c||!it||it.kind!=='arme')return;
  if(c.type==='bete')return toast('Une bête ne tient pas d\'arme');
  if(c.eq)S.items.push(c.eq);
  c.eq=it;S.items.splice(itemIdx,1);
  log(c.nom+' empoigne '+it.nom);
}
function compXp(c,amount){
  c.xp+=amount*(c.pot/100);
  while(c.xp>=xpNext(c.lv)){c.xp-=xpNext(c.lv);c.lv++;
    c.pot=Math.max(60,c.pot-(8+c.lv/10));
    c.max=(c.type==='bete'?36:40)+c.lv*(c.type==='bete'?8:9);c.hp=c.max;
    if(c.lv%5===0)log('<span class="gd">'+c.nom+' — niveau '+c.lv+'</span>');}
}
function compTick(dt){
  const list=escortList();
  if(!list.length||!E)return;
  list.forEach(c=>{
    if(!E||c.order==='suivre')return;
    c.t=(c.t||0)+dt;
    const iv=2.8-Math.min(1.4,c.lv*.02);
    if(c.t<iv)return;
    c.t=0;
    /* les compagnons ne se collent pas à ta cible : ils prennent les autres en charge */
    const grp=engaged();
    if(!grp.length)return;
    const tgt=c.order==='tenir'?grp[grp.length-1]:pick(grp);
    const d=Math.max(1,compDmg(c,tgt)*(1-tgt.arm*.5/(tgt.arm*.5+10)));
    const applied=Math.min(d,tgt.hp);
    tgt.hp-=d;dpsA+=d;
    float(Math.round(d),EL[compEl(c)].c);
    compXp(c,applied);
    gainXp('leadership',applied*.25);
    if(tgt.hp<=0)kill(tgt);
  });
}
/* la créature répartit ses coups : c'est l'ordre qui décide de l'exposition */
function pickTarget(){
  const list=escortList().filter(c=>c.order!=='suivre');
  if(!list.length)return null;
  const w=list.map(c=>ORDERS.find(o=>o.k===c.order).aggro);
  const tot=w.reduce((a,b)=>a+b,0)+2.6;          /* 2.6 = ta propre exposition */
  let r=Math.random()*tot;
  for(let i=0;i<list.length;i++){r-=w[i];if(r<=0)return list[i];}
  return null;
}
function hitCompanion(c,raw){
  const red=c.lv*.7*weakF(c);
  const fin=Math.max(1,raw*.9-red);
  c.hp-=fin;
  float('-'+Math.round(fin)+' '+c.nom.split(' ')[0],'#C8332B');
  compXp(c,fin*.6);
  if(c.hp<=0){
    /* façon Elona : il est MORT, pas inconscient. La dépouille reste, rien ne se répare seul. */
    c.hp=0;c.dead=1;c.esc=false;
    cutIn('死',c.nom+' est mort','sa dépouille te suit — un prêtre peut le rappeler');
  }
}
const reviveCost=c=>Math.round(48*c.lv*(1+((S.rep||0)<0?.35:0)));
/* un prêtre : un village habité, ou un autel de sanctuaire */
function priestHere(){
  const c=here();
  if(c.poi==='sanctuaire')return 'autel du sanctuaire';
  if(c.poi==='village'&&npcsHere().length)return 'prêtre de '+(c.town||'ce village');
  return null;
}
function revive(i){
  const c=S.comps[i];if(!c||!c.dead)return;
  const who=priestHere();
  if(!who)return toast('Il faut un autel de sanctuaire 社 ou un village habité 村');
  const cost=reviveCost(c);
  if(S.or<cost)return toast('Il faut '+cost+' or');
  S.or-=cost;c.dead=0;c.hp=Math.round(c.max*.5);
  c.weak=S.day+1;                       /* affaibli : −20 % pendant 1 jour in-game */
  cutIn('蘇',c.nom+' revient','−'+cost+' or · '+who+' · affaibli 1 jour');
}
const weakF=c=>(c.weak&&S.day<c.weak)?.8:1;
function feedComp(c,k){
  if(!(S.food[k]>0))return;
  useFood(k,1);
  const i=foodInfo(k);
  c.mood=Math.min(100,c.mood+8);
  c.pot=Math.min(200,c.pot+i.nutr*.9);
  c.hp=Math.min(c.max,c.hp+c.max*.25);
  log(c.nom+' mange '+i.n+' — humeur '+Math.round(c.mood)+', potentiel '+Math.round(c.pot));
}
