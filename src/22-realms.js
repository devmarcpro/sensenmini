/* Sensen Mini — 22-realms.js
   Secteurs, capitales, villes, population, économie locale, conquête
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   ROYAUMES, VILLES ET POPULATION (E.25 / E.27 / 3.4 / 14)
   Les royaumes sont des îlots de civilisation dans la wilderness.
   Génération déterministe par secteurs de 64×64 : chaque secteur se
   résout seul, un royaume jamais visité ne coûte rien.
   ================================================================== */
const SECT=64;
const KSIZE=[
  {n:'hameau-État',r:2,villes:0,villages:0,p:.40,boutiques:[0,1],halls:[0,0]},
  {n:'cité-État',r:3,villes:0,villages:ri(1,3),p:.30,boutiques:[2,3],halls:[0,1]},
  {n:'petit royaume',r:5,villes:1,villages:4,p:.20,boutiques:[3,5],halls:[1,2]},
  {n:'grand royaume',r:8,villes:3,villages:8,p:.10,boutiques:[5,8],halls:[2,4]},
];
const BOUTIQUES=['forgeron','alchimiste','libraire','tailleur','épicier','armurier','joaillier','herboriste'];
const RACE_BIOME={montagne:'nain',montcris:'nain',foret:'sylvide',foretmana:'elfe',
  cendres:'cendreux',marcorr:'echomorphe',taiga:'nain',toundra:'humain',
  plaine:'humain',desert:'humain',marecage:'echomorphe',cote:'humain'};
const TITRES={monarchie:'Roi',republique:'Consul',theocratie:'Hiérophante',
  ploutocratie:'Doge',dictature:'Maréchal',anarchie:'—'};
function hcell(x,y,k){return hash(x,y,S.seed,k);}
/* graines de capitale : les cellules les plus favorables du secteur */
function sectorKingdoms(sx,sy){
  S.kd=S.kd||{};
  const key2=sx+','+sy;
  if(S.kd[key2])return S.kd[key2];
  const n=hcell(sx,sy,41)<.42?0:hcell(sx,sy,42)<.75?1:2;
  const out=[];
  for(let i=0;i<n;i++){
    /* on cherche la meilleure cellule sur une grille grossière du secteur */
    let best=null,score=-9;
    for(let a=4;a<SECT;a+=9)for(let b=4;b<SECT;b+=9){
      const x=sx*SECT+a+Math.floor(hcell(sx*97+a,sy*89+b,43+i)*4);
      const y=sy*SECT+b+Math.floor(hcell(sx*61+b,sy*53+a,44+i)*4);
      const c=genCell(x,y);
      let sc=(100-c.corr)/100*2+(1-Math.abs(c.alt-.45)*2)+(c.b==='cote'||c.hum>.5?.6:0);
      if(c.b==='marcorr'||c.b==='cendres')sc-=1.2;
      sc+=hcell(x,y,45+i)*.4;
      if(sc>score){score=sc;best=[x,y,c];}
    }
    if(!best)continue;
    const r=hcell(best[0],best[1],46+i);
    const size=r<.40?0:r<.70?1:r<.90?2:3;
    const race=RACE_BIOME[best[2].b]||'humain';
    const cult=pick(RACE[race].cult);
    const gov=GK2[Math.floor(hcell(best[0],best[1],47+i)*GK2.length)];
    const k={id:key2+':'+i,cap:[best[0],best[1]],size,race,cult,gov,
      nom:capName(cult,best[0],best[1]),
      rep:0,diplo:null,or:2000+size*6000,tax:.10+size*.02,
      transition:0,laws:[],laws2:null,towns:null};
    k.laws=Array.from({length:GOV[gov].law},(_,j)=>({t:'x',c:CONSEQ[Math.floor(hcell(best[0],best[1],60+j)*3)]}));
    k.ruler=mkRuler(k);
    out.push(k);
  }
  S.kd[key2]=out;
  return out;
}
function capName(cult,x,y){
  const C=CULT[cult];
  const a=C.a[Math.floor(hash(x,y,S.seed,51)*C.a.length)];
  const b=C.b[Math.floor(hash(x,y,S.seed,52)*C.b.length)];
  return (a+b).replace('-','');
}
function mkRuler(k){
  return {nom:cultName(k.cult),age:ri(28,70),race:k.race,
    titre:TITRES[k.gov],lv:ri(12,30),heir:Math.random()<.65?cultName(k.cult):null};
}
/* villes du royaume, matérialisées à la première interrogation */
function kTowns(k){
  if(k.towns)return k.towns;
  const S2=KSIZE[k.size];
  const t=[{x:k.cap[0],y:k.cap[1],type:'capitale'}];
  const nv=S2.villes,nb=k.size===1?1+Math.floor(hcell(k.cap[0],k.cap[1],53)*3):S2.villages;
  const pose=(type,j)=>{
    const ang=hcell(k.cap[0]+j,k.cap[1]-j,54+j)*Math.PI*2;
    const d=1+Math.floor(hcell(k.cap[0]-j,k.cap[1]+j,55+j)*(KSIZE[k.size].r-0.2));
    t.push({x:k.cap[0]+Math.round(Math.cos(ang)*d),y:k.cap[1]+Math.round(Math.sin(ang)*d),type});
  };
  for(let j=0;j<nv;j++)pose('ville',j);
  for(let j=0;j<nb;j++)pose('village',j+20);
  t.forEach((v,i)=>{
    v.nom=v.type==='capitale'?k.nom:capName(k.cult,v.x*3+i,v.y*7-i);
    v.k=k.id;
    const gros=v.type==='capitale'?2:v.type==='ville'?1:0;
    v.cap=[6,14,26][gros];
    v.pop=Math.max(1,Math.round(v.cap*(.55+hcell(v.x,v.y,56)*.4)));
    v.prosp=.6+hcell(v.x,v.y,57)*.6;
    /* un exemplaire maximum de chaque type par ville */
    const nbb=gros===2?ri(5,8):gros===1?ri(2,4):ri(0,1);
    v.shops=BOUTIQUES.slice().sort((a,b)=>hcell(v.x+a.length,v.y+b.length,58)-.5).slice(0,nbb);
    const nh=gros===2?ri(2,4):gros===1?ri(0,1):0;
    v.halls=GUILDS.map(g=>g.k).sort((a,b)=>hcell(v.x+a.length,v.y+b.length,59)-.5).slice(0,nh);
    v.or=v.type==='capitale'?1200:v.type==='ville'?500:150;
    v.orMax=v.or;
  });
  k.towns=t;
  return t;
}
/* royaumes connus autour du joueur */
function kingdomsNear(){
  const sx=Math.floor(S.pos[0]/SECT),sy=Math.floor(S.pos[1]/SECT);
  let out=[];
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)out=out.concat(sectorKingdoms(sx+a,sy+b));
  return out;
}
function kingdomAt(x,y){
  const list=kingdomsNear();
  for(const k of list){
    const r=KSIZE[k.size].r;
    if(Math.abs(x-k.cap[0])+Math.abs(y-k.cap[1])<=r+1)return k;
  }
  return null;
}
function townAt(x,y){
  const k=kingdomAt(x,y);
  if(!k)return null;
  return kTowns(k).find(t=>t.x===x&&t.y===y)||null;
}
const myTowns=()=>S.towns||(S.towns=[]);
/* ===== ÉCONOMIE LOCALE : ce qui abonde ici vaut moins qu'ailleurs ===== */
function townPrice(t,mk){
  const c=cell(t.x,t.y);
  const local=BIOME[c.b].mats.includes(mk);
  const rare=!local&&MAT[mk].v>=10;
  let f=local?.65:rare?1.45:1;
  f*=.8+t.prosp*.4;
  return f;
}
function douane(k,mk){
  if(!k)return 1;
  const cat=MAT[mk].c;
  k.tarifs=k.tarifs||{};
  if(k.tarifs[cat]===undefined)
    k.tarifs[cat]=hcell(k.cap[0]+cat.length,k.cap[1],62)<.25?.15+hcell(k.cap[1],k.cap[0],63)*.25:0;
  return 1-k.tarifs[cat];
}
/* ===== POPULATION (E.25) ===== */
function weeklyTowns(r){
  const seen=[];
  kingdomsNear().forEach(k=>{
    kTowns(k).forEach(t=>{
      const c=cell(t.x,t.y);
      if(t.pop<=0){t.abandonne=1;return;}
      /* repeuplement */
      if(t.pop<t.cap&&Math.random()<.15*(1-t.pop/t.cap)*(1-c.corr/100)){t.pop++;seen.push(t.nom+' accueille un nouveau venu');}
      /* naissances et morts */
      if(t.pop>=2&&Math.random()<.06*t.prosp)t.pop=Math.min(t.cap,t.pop+1);
      if(Math.random()<.03+c.corr/1600){t.pop--;if(t.pop<=0){t.abandonne=1;
        seen.push('<span class="bd">'+t.nom+' est abandonné</span>');}}
      t.prosp=Math.max(.3,Math.min(1.6,t.prosp+(c.corr>60?-.02:.01)));
      t.or=Math.min(t.orMax,Math.round(t.or+t.orMax*.15));
    });
    /* trésor et succession */
    k.or=Math.min(60000,k.or+kTowns(k).reduce((a,t)=>a+t.pop*3*k.tax*10,0));
    if(k.transition>0){k.transition--;
      if(k.transition===0){k.ruler=mkRuler(k);seen.push(k.ruler.titre+' '+k.ruler.nom+' monte sur le trône de '+k.nom);}}
    else if(k.ruler&&Math.random()<.004*(k.ruler.age>60?3:1)){
      k.ruler.age++;
      if(k.ruler.age>78||Math.random()<.02){
        seen.push('<span class="bd">'+k.ruler.titre+' '+k.ruler.nom+' est mort — '+k.nom+' entre en transition</span>');
        k.transition=4;}
    }
  });
  /* mes propres villes */
  myTowns().forEach(t=>{
    const c=cell(t.x,t.y);
    if(t.pop<t.cap&&Math.random()<.15*(1-t.pop/t.cap)*(1-c.corr/100)*(1-S.tax*1.4))t.pop++;
    t.loyaute=Math.max(0,Math.min(100,(t.loyaute===undefined?60:t.loyaute)+(S.tax>.18?-4:2)+(repG()>30?1:0)));
    if(t.loyaute<20&&Math.random()<.25){t.pop=Math.max(0,t.pop-1);
      r.push('<span class="bd">'+t.nom+' : un habitant s\'en va, la loyauté est à '+Math.round(t.loyaute)+'</span>');}
    const impot=Math.round(t.pop*3*t.prosp*S.tax*10);
    S.tresor+=impot;
    if(impot)r.push(t.nom+' : +'+impot+' or d\'impôt ('+t.pop+' habitants)');
  });
  if(seen.length)r.push(seen.slice(0,3).join(' · '));
}
/* ===== CONQUÊTE ET DÉCIMATION (E.25) ===== */
function garrison(t){return Math.max(0,Math.round(t.pop*.35*(t.type==='capitale'?2:t.type==='ville'?1.4:1)));}
function assaut(){
  const t=townAt(S.pos[0],S.pos[1]);
  if(!t)return toast('Aucune ville ici');
  if(t.k===undefined)return;
  if(t.abandonne)return toast('Le lieu est déjà vide');
  S.assaut=t;S.occ='combat';E=null;respawnT=.3;sceneMode='';
  const k=kingdomsNear().find(x=>x.id===t.k);
  if(k)gainRep(-6,k.race,null),k.rep-=10;
  cutIn('襲','Assaut sur '+t.nom,garrison(t)+' défenseurs · population '+t.pop);
}
function conquerir(){
  const t=townAt(S.pos[0],S.pos[1]);
  if(!t)return toast('Aucune ville ici');
  if(!S.gov)return toast('Il faut d\'abord fonder ton royaume');
  const g=garrison(t),val=Math.round(t.pop*.35*2);
  if(g>=val*.25&&!t.abandonne)return toast('La garnison tient encore ('+g+' défenseurs) — décime-la d\'abord');
  const k=kingdomsNear().find(x=>x.id===t.k);
  const dd=Math.max(6,t.pop*2)*(k&&k.transition>0?.75:1);
  const jet=d20()+lv('leadership')/2+st('cha')/4;
  gainXp('leadership',120);
  if(jet<dd){
    if(k)gainRep(-8,k.race,null);
    t.def=(t.def||0)+.5;
    return cutIn('拒',t.nom+' refuse','jet '+jet.toFixed(1)+' contre DD '+Math.round(dd));
  }
  t.k='joueur';t.loyaute=45;
  myTowns().push(t);
  if(k){k.towns=kTowns(k).filter(x=>x!==t);gainRep(-15,k.race,null);}
  cutIn('併',t.nom+' rejoint ton royaume',t.pop+' habitants · loyauté 45');
}
