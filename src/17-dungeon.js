/* Sensen Mini — 17-dungeon.js
   Génération à étages, salles, gardien, artefacts
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   DONJONS (3.5 / E.29)
   Assemblage de salles, étages empilés, difficulté et loot croissant
   avec la PROFONDEUR — indépendamment de la corruption de surface.
   Contenu fixe : explorer, c'est vider. Aucun repop avant nettoyage.
   ================================================================== */
const ROOM={
  salle:{n:'Salle',g:'室'},
  garde:{n:'Salle gardée',g:'衛'},
  biblio:{n:'Bibliothèque',g:'書'},
  tresor:{n:'Salle au trésor',g:'宝'},
  piege:{n:'Salle piégée',g:'罠'},
  autel:{n:'Autel',g:'祭'},
  puits:{n:'Puits de mana',g:'泉'},
  cellule:{n:'Cellule',g:'牢'},
  cache:{n:'Cache',g:'隠'},
  armurerie:{n:'Armurerie',g:'甲'},
  boss:{n:'Salle du gardien',g:'主'},
};
/* tirage des salles : un poids par type, modulé par le thème */
const ROOMW={salle:40,garde:12,biblio:7,tresor:6,piege:7,autel:4,puits:4,cellule:2,cache:4,armurerie:4};
const THEMEW={ruine:{biblio:2,cellule:2},crypte:{piege:1.5,autel:2,cache:1.5},mine:{puits:2,cache:2,tresor:1.5},repaire:{garde:1.5,armurerie:1.5,cellule:1.5}};
function genDungeon(c){
  const majeur=hash(c.x,c.y,S.seed,21)<.35;
  const themes=Object.keys(DJTHEME);
  const theme=c.b==='montagne'||c.b==='montcris'?(Math.random()<.6?'mine':pick(themes))
    :c.b==='marcorr'||c.b==='marecage'?(Math.random()<.6?'crypte':pick(themes))
    :c.b==='foret'||c.b==='taiga'?(Math.random()<.5?'repaire':pick(themes)):pick(themes);
  const nf=majeur?ri(5,8):ri(2,3);
  const floors=[];
  const tw=THEMEW[theme]||{};
  const types=Object.keys(ROOMW),tot=types.reduce((a,t)=>a+ROOMW[t]*(tw[t]||1),0);
  for(let f=0;f<nf;f++){
    const nr=majeur?ri(15,25):ri(8,15);
    const rooms=[];
    for(let r=0;r<nr;r++){
      let x=Math.random()*tot,t='salle';
      for(const k of types){x-=ROOMW[k]*(tw[k]||1);if(x<=0){t=k;break;}}
      const mobs=t==='garde'?3:t==='salle'?ri(1,2):t==='armurerie'?2:['autel','puits','cellule','cache','piege'].includes(t)?0:ri(0,1);
      rooms.push({t,mobs,done:false});
    }
    /* salle spéciale au point le plus reculé de l'étage le plus profond */
    if(f===nf-1)rooms[rooms.length-1]={t:'boss',mobs:1,done:false};
    floors.push(rooms);
  }
  return {nom:pick(DJTHEME[theme].noms),theme,majeur,floors,f:0,r:0,clear:false};
}
const dj=()=>here().dj;
const djRoom=()=>{const d=dj();return d?d.floors[d.f][d.r]:null;};
/* la puissance ne doit rien à la surface : elle vient de l'étage */
function djPower(){
  const d=dj();
  return 2.6+d.f*2.3+(d.majeur?2.0:0);
}
function enterDungeon(){
  const c=here();
  if(c.poi!=='donjon')return toast('Aucune entrée ici');
  if(!c.dj)c.dj=genDungeon(c);
  if(c.dj.clear)return toast('Ce donjon est vidé');
  S.occ='donjon';E=null;respawnT=.3;sceneMode='';
  cutIn('塔',c.dj.nom,(c.dj.majeur?'donjon majeur':'donjon mineur')+' · '+(DJTHEME[c.dj.theme]?DJTHEME[c.dj.theme].n.toLowerCase():'')+' · '+c.dj.floors.length+' étages');
}
function djReward(room){
  const d=dj(),lvl=d.f,c=here();
  if(room.t==='biblio'){dropBook(3+lvl*2);if(Math.random()<.5)dropBook(3+lvl*2);}
  if(room.t==='tresor'){dropLoot(c,true);if(d.majeur&&Math.random()<.4)maybeScroll(pick(Object.keys(MAT)));}
  if(room.t==='piege'){
    const dd=12+lvl*2,jet=d20()+lv('perception_sk')/2+st('per')/4;
    gainXp('perception_sk',30+lvl*10);
    if(jet>=dd)cutIn('罠','Piège évité','jet '+jet.toFixed(1)+' contre DD '+dd);
    else{const dg=Math.round(maxHp()*(.12+lvl*.02));S.hp=Math.max(1,S.hp-dg);addStatus(S,'saignement',4,Math.max(1,dg*.08));
      cutIn('罠','Piège !','−'+dg+' PV · jet '+jet.toFixed(1)+' contre DD '+dd);}
  }
  if(room.t==='autel'){S.hp=maxHp();S.buffs=S.buffs.filter(b=>b.k!=='regenhp');S.buffs.push({k:'regenhp',v:2,t:40,n:'Bénédiction'});
    gainXp('meditation',40);cutIn('祭','Autel oublié','PV rendus · régénération 40 s');}
  if(room.t==='puits'){S.mana=maxMana();if(Math.random()<.4){S.mat.cristalmana=(S.mat.cristalmana||0)+1;}
    gainXp('mana',40);cutIn('泉','Puits de mana','mana rendu'+(S.mat.cristalmana?' · un cristal affleure':''));}
  if(room.t==='cellule'){
    const n=mkNpc(key(c.x,c.y));n.rel=60;n.ville=null;
    gainRep(2,n.race,kingdomHere());gainXp('leadership',50);
    if(escortUsed()<escortMax()){n.rec=true;S.npcs.push(n);S.comps.push(compFromNpc(n));
      cutIn('牢',n.nom+' libéré'+(n.race==='elfe'||n.race==='sylvide'?'e':''),JOBS[n.job].n+' · niveau '+n.lv+' — te suit par gratitude');}
    else{const g=20+lvl*15;S.or+=g;
      cutIn('牢',n.nom+' libéré'+(n.race==='elfe'||n.race==='sylvide'?'e':''),'ton escorte est pleine — '+g+' or de gratitude, et un nom qui court');}}
  if(room.t==='cache'){
    const ex=Object.keys(MAT).filter(m=>!BASEMAT.includes(m));
    const cts=mk2=>Object.keys(COMP).filter(ct=>COMP[ct].raw.includes(mk2)||COMP[ct].forms.some(f=>f!=='brut'&&FORM[f]&&formOk(f,mk2)));
    let mk2=null;for(let i=0;i<20&&!mk2;i++){const m=pick(ex);if(cts(m).length)mk2=m;}
    if(mk2)learnRecipe(pick(cts(mk2)),mk2);
    const g=pick(GEMK);S.mat[g]=(S.mat[g]||0)+ri(1,2);
    cutIn('隠','Cache','une recette et '+matName(g));}
  if(room.t==='armurerie'){dropLoot(c,false);if(Math.random()<.5)dropLoot(c,false);}
  if(room.t==='boss'){
    dropLoot(here(),true);dropBook(6+lvl*2);
    if(d.majeur)dropArtefact(lvl);
  }
}
/* artefact : effets hors pools, ni sertissable ni infusable (3.1 / A.12) */
function dropArtefact(lvl){
  const mats=['mithril','adamant','obsidienne','cristalmana','granitnoir','boisfer','ebene','ecaille'];
  const fn=pick(Object.keys(FUNC));
  const parts=FUNC[fn].comp.map(ct=>partFor(ct,mats));
  parts.push(partFor('fixations',mats));
  /* la qualité suit l'étage : un artefact des profondeurs vaut une vie d'atelier, pas dix */
  const it=mkItem('arme',fn,parts,+(1.5+Math.random()*.6+lvl*.18).toFixed(2));
  it.rar=3;it.artefact=1;
  it.aff=AFF.slice().sort(()=>Math.random()-.5).slice(0,ri(3,4)).map(a=>({id:a.id,p:a.r()}));
  it.aff.forEach(a=>{if(a.id==='vecaff'){const v=it.vec.slice();v[a.p.e]+=a.p.p/100;it.vec=norm(v);}});
  it.nom=pick(['Serment','Relique','Vestige','Legs','Sceau'])+' '
    +pick(['du Puits','des Cendres Premières','de la Veine Muette','du Gardien','des Neuf Étages','de l\'Aube Fendue']);
  S.items.push(it);
  cutIn('遺',it.nom,'artefact · '+it.aff.length+' effets · ni sertissable ni reproductible');
}
function djAdvance(){
  const d=dj();
  const room=d.floors[d.f][d.r];
  room.done=true;
  djReward(room);
  questTick('donjon',1);noteRate('djroom');
  if(room.t==='boss'){
    d.clear=true;
    here().djDone=S.day+1.5;          /* délai de grâce avant que la cellule redevienne normale */
    S.occ='repos';E=null;sceneMode='';
    cutIn('制',d.nom+' est nettoyé','la cellule redeviendra ordinaire dans 1,5 jour');
    return;
  }
  if(d.r<d.floors[d.f].length-1){d.r++;respawnT=.6;return;}
  /* fin d'étage : la cage d'escalier */
  if(d.f<d.floors.length-1){
    d.f++;d.r=0;respawnT=.9;
    cutIn('降','Étage '+(d.f+1)+' / '+d.floors.length,'puissance '+djPower().toFixed(1)+' — plus bas, plus riche');
  } else {d.clear=true;S.occ='repos';E=null;sceneMode='';}
}
function leaveDungeon(){S.occ='repos';E=null;S.seg=[];S.bonus=0;sceneMode='';}
