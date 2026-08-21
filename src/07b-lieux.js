/* Sensen Mini — 07b-lieux.js
   Les points d'intérêt de la carte : ce qu'on y fait (3.1)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   CINQ POINTS D'INTÉRÊT POUR UN MONDE INFINI.
   Village, donjon, camp, sanctuaire, filon — et rien d'autre. Une case
   sur quatre en portait un ; les trois autres étaient interchangeables,
   et les cinq eux-mêmes se répétaient tous les dix pas.

   Huit de plus, et chacun a un GESTE à lui — pas un décor, pas un
   modificateur de récolte : quelque chose qu'on vient y faire et qu'on
   ne peut faire ailleurs. C'est la différence entre une carte qu'on
   traverse et une carte qu'on explore.

   Aucun ne demande de nouveau système : ils se branchent sur ce qui
   existe déjà — les livres, les gemmes, les recettes, les alliages, les
   compagnons, la corruption, le mana, les compétences.
   ================================================================== */

const LIEU={
  /* --- ce qui se fouille une fois par semaine --- */
  ruine:{n:'Ruine ancienne',g:'廃',geste:'Fouiller les décombres',hebdo:1,
    d:'Ce qui reste d\'avant. On y trouve de la matière ouvrée que personne ne fabrique plus.',
    fais(c){
      const mats=['brique','ceramique','verre','bronze','marbre','argent','plomb','ivoire'];
      const l=mats.filter(m=>MAT[m]);
      const n=ri(2,5)+Math.floor(lv('perception_sk')/12);
      const m=pick(l);
      S.mat[m]=(S.mat[m]||0)+n;
      gainXp('perception_sk',60);
      let plus='';
      /* une ruine garde parfois une recette qu'on ne trouve nulle part */
      if(Math.random()<.25){const k=pick(Object.keys(ALLIAGE).filter(x=>!alliageConnu(x)));
        if(k){apprendreAlliage(k);plus=' · recette industrielle : '+ALLIAGE[k].n;}}
      return '+'+n+' × '+matName(m)+plus;
    }},
  tombe:{n:'Tombe scellée',g:'墓',geste:'Desceller la tombe',hebdo:1,corr:8,
    d:'On n\'ouvre pas une tombe sans réveiller ce qui la garde — mais on n\'y met pas non plus n\'importe quoi.',
    fais(c){
      /* le prix se paie d'abord : la corruption monte, et la garde se réveille */
      c.corr=Math.min(100,c.corr+8);
      if(Math.random()<.55){
        S.occ='combat';E=null;EE=[];respawnT=.2;sceneMode='';
        return 'la garde se réveille';
      }
      const g=randomGem?randomGem(c):null;
      if(g){S.gems=S.gems||[];S.gems.push(g);gainXp('taille',40);
        return 'une gemme taillée : '+gemLabel(g);}
      const or=ri(40,180)+lv('perception_sk')*4;
      S.or+=or;return '+'+or+' or';
    }},
  bibliotheque:{n:'Bibliothèque en ruine',g:'書',geste:'Fouiller les rayonnages',hebdo:1,
    d:'Des rayonnages effondrés, et parfois un ouvrage intact. C\'est la seule façon d\'apprendre sans passer par une ville.',
    fais(c){
      const n=1+(Math.random()<.35?1:0);
      for(let i=0;i<n;i++)dropBook(4+Math.floor(lv('lecture')/6));
      gainXp('lecture',80);
      return n+' ouvrage'+(n>1?'s':'')+' sauvé'+(n>1?'s':'')+' des décombres';
    }},
  /* --- ce qui se visite, sans limite de semaine --- */
  source:{n:'Source chaude',g:'湯',geste:'S\'y baigner',
    d:'De l\'eau qui sort chaude de la roche. On en ressort entier, et le froid ne mord plus pour un temps.',
    fais(c){
      S.hp=maxHp();S.end=100;
      soigner('saignement','l\'eau chaude ferme la plaie');
      soigner('brulure','l\'eau apaise la brûlure');
      poserBuff('isofroid',30,900,'Source chaude');
      S.repose=S.day+3/24;
      return 'PV et souffle rendus · +30 contre le froid, 15 min · reposé 3 h';
    }},
  monolithe:{n:'Monolithe',g:'碑',geste:'Méditer devant',
    d:'Une pierre dressée que personne ne se rappelle avoir posée. On y comprend des choses.',
    fais(c){
      S.mana=maxMana();
      const el=domi(cellVec(c));
      gainXp('meditation',200);gainXp('el_'+EL[el].k,150);gainXp('mana',120);
      addStatus(S,'beni',120,1);
      return 'mana plein · béni 2 min · Élément '+EL[el].n+' et Méditation progressent';
    }},
  cercle:{n:'Cercle de pierres',g:'環',geste:'Écouter le cercle',hebdo:1,
    d:'Un cercle que la corruption n\'a jamais franchi. Il apaise la terre autour de lui — mais il faut le nourrir.',
    fais(c){
      if((S.mat.cristalmana||0)<1)return toast('Il faut un cristal de mana à poser au centre');
      S.mat.cristalmana--;if(!S.mat.cristalmana)delete S.mat.cristalmana;
      let n=0;
      for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
        const z=cell(c.x+dx,c.y+dy);
        if(z.corr>0){z.corr=Math.max(0,z.corr-14);n++;}
      }
      gainXp('m_arcane',150);
      return n+' cellules apaisées de 14 points de corruption';
    }},
  /* --- ce qui se rencontre --- */
  ermitage:{n:'Ermitage',g:'庵',geste:'Frapper à la porte',hebdo:1,
    d:'Quelqu\'un vit ici, seul, et sait des choses qu\'on n\'apprend pas en ville.',
    fais(c){
      /* un ermite enseigne : il rend du potentiel là où on l'a épuisé */
      const bas=SK.filter(k=>S.sk[k].lv>0).sort((a,b)=>S.sk[a].pot-S.sk[b].pot).slice(0,3);
      if(!bas.length)return 'il te regarde et ne dit rien — reviens quand tu sauras faire quelque chose';
      bas.forEach(k=>{S.sk[k].pot=Math.min(200,S.sk[k].pot+35);});
      gainXp('lecture',60);
      return 'potentiel rendu : '+bas.map(k=>SKILLS[k].n).join(', ');
    }},
  carcasse:{n:'Grande carcasse',g:'骸',geste:'Dépecer la carcasse',hebdo:1,
    d:'Quelque chose d\'énorme est mort ici, il y a longtemps. Il en reste de quoi travailler.',
    fais(c){
      const n=ri(4,9)+Math.floor(lv('collecte')/8);
      ['os','osfossile','ivoire','cuir','ecaille'].filter(m=>MAT[m]).forEach(m=>{
        if(Math.random()<.6){S.mat[m]=(S.mat[m]||0)+ri(1,n);}
      });
      addFood(foodKey('viande',domi(cellVec(c)),MEATGRP[domi(cellVec(c))]),ri(2,5));
      gainXp('collecte',90);
      return 'os, cuir et viande séchée';
    }},
};
const LIEUK=Object.keys(LIEU);
/* combien de fois par semaine : un lieu « hebdo » se referme jusqu'à la
   semaine suivante, comme le sanctuaire le faisait déjà */
const lieuPret=c=>{const D=LIEU[c.poi];return !D||!D.hebdo||((c.lieuW||0)<=S.week-1);};
function lieuVisiter(){
  const c=here();
  const D=LIEU[c.poi];
  if(!D)return toast('Rien à visiter ici');
  if(!lieuPret(c))return toast(D.n+' : déjà visité cette semaine');
  let dit='';
  try{dit=D.fais(c);}catch(e){dit='';}
  if(D.hebdo)c.lieuW=S.week;
  if(dit)cutIn(D.g,D.n,dit);
  paint();
}
