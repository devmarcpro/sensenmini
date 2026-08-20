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
  boss:{n:'Salle du gardien',g:'主'},
};
const DJNOM=['Ruine effondrée','Faille','Gouffre','Portail muré','Crypte','Mine noyée','Sépulcre','Puits ancien'];
function genDungeon(c){
  const majeur=hash(c.x,c.y,S.seed,21)<.35;
  const nf=majeur?ri(5,8):ri(2,3);
  const floors=[];
  for(let f=0;f<nf;f++){
    const nr=majeur?ri(15,25):ri(8,15);
    const rooms=[];
    for(let r=0;r<nr;r++){
      let t='salle';
      const x=Math.random();
      if(x<.12)t='garde'; else if(x<.20)t='biblio'; else if(x<.26)t='tresor';
      rooms.push({t,mobs:t==='garde'?3:t==='salle'?ri(1,2):ri(0,1),done:false});
    }
    /* salle spéciale au point le plus reculé de l'étage le plus profond */
    if(f===nf-1)rooms[rooms.length-1]={t:'boss',mobs:1,done:false};
    floors.push(rooms);
  }
  return {nom:pick(DJNOM),majeur,floors,f:0,r:0,clear:false};
}
const dj=()=>here().dj;
const djRoom=()=>{const d=dj();return d?d.floors[d.f][d.r]:null;};
/* la puissance ne doit rien à la surface : elle vient de l'étage */
function djPower(){
  const d=dj();
  return 2.2+d.f*1.9+(d.majeur?1.6:0);
}
function enterDungeon(){
  const c=here();
  if(c.poi!=='donjon')return toast('Aucune entrée ici');
  if(!c.dj)c.dj=genDungeon(c);
  if(c.dj.clear)return toast('Ce donjon est vidé');
  S.occ='donjon';E=null;respawnT=.3;sceneMode='';
  cutIn('塔',c.dj.nom,(c.dj.majeur?'donjon majeur':'donjon mineur')+' · '+c.dj.floors.length+' étages');
}
function djReward(room){
  const d=dj(),lvl=d.f;
  if(room.t==='biblio'){dropBook(3+lvl*2);if(Math.random()<.5)dropBook(3+lvl*2);}
  if(room.t==='tresor'){dropLoot(here(),true);if(d.majeur&&Math.random()<.4)maybeScroll(pick(Object.keys(MAT)));}
  if(room.t==='boss'){
    dropLoot(here(),true);dropBook(6+lvl*2);
    if(d.majeur)dropArtefact(lvl);
  }
}
/* artefact : effets hors pools, ni sertissable ni infusable (3.1 / A.12) */
function dropArtefact(lvl){
  const mats=['mithril','adamant','obsidienne','cristalmana','granitnoir'];
  const m=pick(mats);
  const fn=pick(Object.keys(FUNC));
  const parts=FUNC[fn].comp.map((ct,i)=>({ct,f:COMP[ct].forms[0],mk:m}));
  parts.push({ct:'fixations',f:'lingot',mk:m});
  const it=mkItem('arme',fn,parts,+(2.2+Math.random()*1.6+lvl*.12).toFixed(2));
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
