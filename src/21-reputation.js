/* Sensen Mini — 21-reputation.js
   Réputation à quatre niveaux, lois, détection, contrebande
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   RÉPUTATION À QUATRE NIVEAUX (7.2) ET LOIS (14.4 / E.26)
   ================================================================== */
const RIVAUX={humain:['echomorphe'],elfe:['nain'],nain:['elfe'],
  sylvide:['cendreux'],cendreux:['sylvide'],echomorphe:['humain']};
function repInit(){S.rep=(typeof S.rep==='object'&&S.rep)?S.rep:{g:+S.rep||0};
  S.rep.race=S.rep.race||{};S.rep.king=S.rep.king||{};}
const repG=()=>{repInit();return S.rep.g||0;};
const repRace=r=>{repInit();return S.rep.race[r]||0;};
const repKing=i=>{repInit();return S.rep.king[i]||0;};
function gainRep(n,race,king){
  repInit();
  S.rep.g=Math.max(-100,Math.min(100,S.rep.g+n*.5));
  if(race){
    S.rep.race[race]=Math.max(-100,Math.min(100,(S.rep.race[race]||0)+n));
    (RIVAUX[race]||[]).forEach(r=>{        /* un gain envers X coûte 25 % de ce gain à ses rivaux */
      S.rep.race[r]=Math.max(-100,Math.min(100,(S.rep.race[r]||0)-n*.25));});
  }
  if(king!==undefined&&king!==null){
    S.rep.king[king]=Math.max(-100,Math.min(100,(S.rep.king[king]||0)+n));
    const k=S.kingdoms[king];if(k)k.rep=S.rep.king[king];
  }
}
const REPT=['hostile à vue','mal vu','neutre','apprécié','considéré'];
const repTier=v=>v<=-50?0:v<-20?1:v<20?2:v<50?3:4;
/* territoire d'un royaume : un îlot de civilisation autour de sa capitale */
function kingdomHere(){
  const k=kingdomAt(S.pos[0],S.pos[1]);
  if(!k)return null;
  S.kingdoms=kingdomsNear();
  return S.kingdoms.indexOf(k);
}
/* réputation locale effective : globale + royaume du lieu + race dominante */
function repLocale(){
  const i=kingdomHere();
  let v=repG();
  if(i!==null){v+=repKing(i)*.6;v+=repRace(S.kingdoms[i].race)*.4;}
  return Math.max(-100,Math.min(100,v));
}
const repMulPrix=()=>{const t=repTier(repLocale());
  return t<=1?1.25:t===2?1:t===3?.9:.85;};
const repMulRelation=()=>{const t=repTier(repLocale());return [.5,.75,1,1.25,1.5][t];};
/* --- lois --- */
/* LAWTYPE nommait les quatre types de loi et personne ne le lisait : le
   texte de chaque loi (l.txt) dit deja « la possession de X », « la vente de
   X ». Une table morte de plus, retiree plutot que rebranchee de force. */
function lawsHere(){
  const k=kingdomAt(S.pos[0],S.pos[1]);
  if(!k)return {i:null,k:null,laws:[]};
  const i=kingdomHere();
  if(!k.laws2){
    const pool=Object.keys(MAT).filter(m=>MAT[m].v>=6);
    k.laws2=k.laws.map(l=>{
      const r=Math.random();
      if(r<.55)return {t:'objet',mat:pick(pool),c:l.c,txt:''};
      if(r<.8)return {t:'vente',mat:pick(pool),c:l.c,txt:''};
      if(r<.9)return {t:'nuit',c:l.c,txt:''};
      return {t:'corruption',c:l.c,txt:''};});
    k.laws2.forEach(l=>{
      l.txt=l.t==='objet'?'la possession de '+matName(l.mat)
        :l.t==='vente'?'la vente de '+matName(l.mat)
        :l.t==='nuit'?'le commerce après la tombée du jour'
        :'la magie de corruption';});
  }
  return {i,k,laws:k.laws2};
}
function detection(){
  const {i,k}=lawsHere();
  /* plus le régime est sévère, plus il y a d'yeux — et un village en a davantage */
  const dd=11+(k?GOV[k.gov].law*1.6:0)+(here().poi==='village'?3:0);
  /* « pas_silencieux » (F.7) : le don ne rend pas meilleur, il rend INAUDIBLE
     — huit points de jet, de quoi passer la plupart des controles sans jamais
     monter la competence. C'est une autre facon de jouer, pas un bonus. */
  const jet=d20()+lv('discretion')/2+st('per')/4+(don('silence')?8:0);
  gainXp('discretion',30);
  return jet<dd;
}
function punir(l,ki){
  const k=S.kingdoms[ki];
  /* « Royaume sans gardes (anarchie) → AUCUNE consequence structurelle
     possible : la loi ne peut mecaniquement pas s'appliquer » (E.26). Elle
     s'appliquait quand meme : une anarchie infligeait des amendes et
     envoyait des gardes qu'elle n'a pas. */
  if(sansGardes(ki)){
    log('<span class="gd">'+k.nom+' n\'a ni garde ni greffe — la loi y est un mot.</span>');
    return;
  }
  if(l.c==='amende'){
    const a=Math.min(S.or,Math.round(60+genLvl()*25));
    S.or-=a;gainRep(-4,k.race,ki);
    cutIn('罰','Amende — '+l.txt,'−'+a+' or à '+k.nom);
  } else if(l.c==='confiscation'){
    if(l.mat&&S.mat[l.mat]){const n=S.mat[l.mat];delete S.mat[l.mat];
      gainRep(-3,k.race,ki);
      cutIn('没','Confiscation','−'+n+' × '+matName(l.mat));}
    else{const a=Math.min(S.or,40);S.or-=a;cutIn('没','Confiscation','−'+a+' or, faute de marchandise');}
  } else {
    gainRep(-12,k.race,ki);
    S.occ='combat';E=null;respawnT=.3;sceneMode='';
    cutIn('捕','Les gardes te tombent dessus',l.txt+' — '+k.nom);
  }
}
/* contrôle à l'entrée d'un territoire et à la vente */
function controle(ctx){
  const {i,k,laws}=lawsHere();
  if(i===null||!laws.length)return false;
  for(const l of laws){
    let coupable=false;
    if(l.t==='objet'&&(S.mat[l.mat]||0)>0)coupable=true;
    if(l.t==='vente'&&ctx==='vente'&&ctx2===l.mat)coupable=true;
    if(l.t==='nuit'&&ctx==='vente'&&isNight())coupable=true;
    if(l.t==='corruption'&&ctx==='sort'&&true)coupable=true;
    if(!coupable)continue;
    if(detection()){punir(l,i);return true;}
    else{gainXp('discretion',60);log('<span class="gd">Personne ne t\'a vu.</span>');}
  }
  return false;
}
let ctx2=null;
/* la contrebande : ce qui est interdit se vend plus cher là où il l'est */
function prixContrebande(mk){
  const {laws}=lawsHere();
  return laws.some(l=>l.mat===mk)?1.6:1;
}
