/* Sensen Mini — 17b-gardiens.js
   Gardiens nommés et artefacts uniques (3.5 / 12.4 / A.12)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   LE FOND D'UN DONJON NE VALAIT PAS LA DESCENTE.
   La salle du gardien posait une créature ordinaire avec six fois ses
   points de vie et « Gardien — » devant son nom. Huit étages de ruine,
   quinze salles chacune, pour retrouver le rôdeur du premier couloir en
   plus gros. Et l'artefact qui tombait au bout portait un nom tiré au
   sort dans deux listes de six mots : « Vestige du Puits », « Legs des
   Neuf Étages » — jamais deux fois le même, donc jamais mémorable.

   Un gardien doit être RECONNAISSABLE et se combattre autrement. Chacun
   des quatre thèmes a le sien, avec un trait qui change la façon de
   l'affronter — pas ses chiffres, sa MÉCANIQUE :
     — celui de la ruine appelle du renfort quand il faiblit ;
     — celui de la crypte se répare tant qu'on le laisse respirer ;
     — celui de la mine est une carapace qu'il faut fendre avant de
       pouvoir lui faire mal ;
     — celui du repaire enrage à mesure qu'il tombe.

   Et chacun garde une PIÈCE NOMMÉE, toujours la même, avec ses effets
   fixes. On sait ce qu'on va chercher, et on peut le vouloir.
   ================================================================== */

const GARDIEN={
  ruine:{n:'Le Sergent Muré',g:'壁',cre:'mercenaire',
    hp:5.5,dmg:1.6,arm:2.2,trait:'renfort',
    d:'quand il faiblit, ce qui reste de sa garde sort des murs',
    arte:'lamesergent'},
  crypte:{n:'La Veilleuse',g:'燭',cre:'suaire',
    hp:6.5,dmg:1.5,arm:1.6,trait:'soin',
    d:'elle se recoud tant qu on lui laisse le temps — il faut frapper sans relâche',
    arte:'cierge'},
  mine:{n:'Le Fendu',g:'裂',cre:'eclat',
    hp:5,dmg:1.8,arm:3.6,trait:'carapace',
    d:'sa gangue rend les coups inoffensifs jusqu a ce qu elle cède',
    arte:'pic'},
  repaire:{n:'La Mère des Ronces',g:'棘',cre:'sylve',
    hp:6,dmg:1.4,arm:1.8,trait:'rage',
    d:'chaque blessure la rend plus dangereuse',
    arte:'ronce'},
};
/* Un donjon MAJEUR — cinq à huit étages — mérite mieux que le gardien
   ordinaire de son thème : c'est le seul endroit où celui-là se montre. */
Object.assign(GARDIEN,{
  /* Chaque theme neuf a son gardien : un donjon dont on connait deja le
     dernier occupant n'a plus de fond. Et chacun porte un trait DEJA
     branche — renfort, soin, rage, poison — plutot qu'un trait de plus. */
  temple:{n:'Le Noyeur',g:'溺',cre:'crocodile',
    hp:6.8,dmg:1.7,arm:1.8,trait:'poison',
    d:'il attend sous l eau basse, et il ne lache pas',
    arte:'harpon'},
  fonderie:{n:'Le Fondeur',g:'鎔',cre:'cendre',
    hp:7.2,dmg:1.9,arm:2.4,trait:'rage',
    d:'la chaleur ne l a jamais quitte, et elle monte quand il saigne',
    arte:'creuset'},
  nid:{n:'La Mère des Vents',g:'翼',cre:'aigle',
    hp:5.8,dmg:1.8,arm:1.2,trait:'renfort',
    d:'elle appelle, et le ciel repond',
    arte:'serre'},
});
const GARDIEN_MAJEUR={n:'Le Premier Enseveli',g:'祖',cre:'colosse',
  hp:9,dmg:2.0,arm:3.0,trait:'rage',
  d:'il était là avant la faille, et il s en souvient',
  arte:'couronne'};

function gardienDe(d){
  if(!d)return null;
  return d.majeur?GARDIEN_MAJEUR:(GARDIEN[d.theme]||GARDIEN.ruine);
}

/* ===== LES ARTEFACTS NOMMÉS (A.12) =====
   Une pièce nommée ne se tire pas : elle est écrite. Ses effets sont fixes,
   sa matière est fixe, et deux joueurs qui trouvent la même parlent de la
   même chose. Sa qualité seule suit l'étage où on l'a arrachée. */
const ARTEFACT={
  lamesergent:{n:'Lame du Sergent Muré',fn:'epee',mats:['acier','ebene','cuir'],
    aff:[['meute',{n:2,p:26}],['parade',{k:7}],['des',{n:4,k:2}]],
    d:'plus il y en a en face, plus elle mord'},
  cierge:{n:'Cierge de la Veilleuse',fn:'masse',mats:['argent','ebene','soie'],
    aff:[['vol',{p:8}],['nuit',{p:26}],['brule',{n:4,d:3}]],
    d:'elle rend la vie qu elle prend, et prend davantage la nuit'},
  pic:{n:'Pic du Fendu',fn:'marteau',mats:['adamant','boisfer','cuir'],
    aff:[['perce',{n:4,p:95}],['assomme',{n:5,d:2}],['harmonie',{p:30}]],
    d:'fait pour ouvrir ce qui ne s ouvre pas'},
  ronce:{n:'Ronce-Mère',fn:'lance',mats:['boisfer','ecaille','soie'],
    aff:[['venin',{n:4,d:6}],['bas',{s:50,k:3}],['vecaff',{e:2,p:35}]],
    d:'elle empoisonne, et elle frappe plus fort blessée'},
  harpon:{n:'Harpon du Noyeur',fn:'trident',mats:['acier','boisfer','ecaille'],
    aff:[['gel',{d:3}],['venin',{n:3,d:5}],['blesse',{p:24}]],
    d:'il fige, il empoisonne, et il s acharne sur ce qui saigne'},
  creuset:{n:'Creuset du Fondeur',fn:'marteau',mats:['aciertrempe','obsidienne','cuir'],
    aff:[['brule',{n:3,d:4}],['lourdeur',{p:30}],['corr',{s:40,p:28}]],
    d:'la lourde revient deux fois plus vite, et la corruption la nourrit'},
  serre:{n:'Serre de la Mère des Vents',fn:'arc',mats:['if','argent','soie'],
    aff:[['premier',{p:40}],['seul',{p:24}],['eclat',{n:4,d:3}]],
    d:'le premier trait part le plus fort — et vaut mieux seul'},
  couronne:{n:'Couronne du Premier Enseveli',fn:'hallebarde',mats:['adamant','granitnoir','ecaille'],
    aff:[['perce',{n:5,p:100}],['souffle',{p:20}],['harmonie',{p:35}],['seul',{p:28}]],
    d:'la pièce que rien d autre du jeu ne remplace'},
};
const ARTK=Object.keys(ARTEFACT);

function dropArtefactNomme(k,lvl){
  const A=ARTEFACT[k];
  if(!A)return null;
  const parts=FUNC[A.fn].comp.map((ct,i)=>partFor(ct,[A.mats[Math.min(i,A.mats.length-1)]].concat(A.mats)));
  parts.push(partFor('fixations',A.mats));
  const it=mkItem('arme',A.fn,parts,+(1.7+Math.random()*.4+(lvl||0)*.16).toFixed(2));
  it.rar=3;it.artefact=1;it.unique=k;
  it.aff=A.aff.map(([id,p])=>({id,p:Object.assign({},p)}));
  it.aff.forEach(a=>{if(a.id==='vecaff'){const v=it.vec.slice();v[a.p.e]+=a.p.p/100;it.vec=rnd4(norm(v));}});
  it.nom=A.n;
  S.items.push(it);
  S.arte=S.arte||{};S.arte[k]=(S.arte[k]||0)+1;
  cutIn('遺',A.n,A.d,false,it);
  return it;
}

/* ===== LE TRAIT DU GARDIEN =====
   Appelé à chaque tick de combat tant qu'un gardien nommé est en face. */
function gardienTick(dt){
  const g=engaged().find(e=>e.gard&&e.hp>0);
  if(!g)return;
  const D=GARDIEN[g.gard]||GARDIEN_MAJEUR;
  const t=D.trait;
  const part=g.hp/Math.max(1,g.max);
  if(t==='soin'){
    /* elle se recoud — mais seulement si on lui laisse le temps : toute
       blessure recente coupe la reprise */
    g.repos=(g.repos||0)+dt;
    if(g.dernier!==undefined&&g.hp<g.dernier)g.repos=0;
    g.dernier=g.hp;
    if(g.repos>2.5){
      const h=g.max*.012*dt;
      g.hp=Math.min(g.max,g.hp+h);
      if(!g.dit){g.dit=1;log('<span class="bd">'+D.n+' se recoud — il faut frapper sans relâche.</span>');}
    }
  } else if(t==='renfort'){
    if(part<.5&&!g.renfort){
      g.renfort=1;
      const c=here();
      const n=Math.min(2,MAXENG-engaged().length);
      for(let i=0;i<n;i++){
        const ck=creaturePool(c,true,false,djPower());
        EE.push(mkEnemy(ck,djPower(),false,false,' '+'ⅠⅡ'[i]));
      }
      if(n>0){refocus();sceneMode='';
        cutIn(D.g,D.n+' appelle','ce qui reste de sa garde sort des murs');}
    }
  } else if(t==='rage'){
    /* chaque blessure la rend plus dangereuse : jusqu'a +80 % a bout */
    g.rage=1+(1-part)*.8;
  } else if(t==='carapace'){
    if(part<.6&&g.gangue){
      g.gangue=0;g.arm=(g.arm||0)*.35;
      cutIn(D.g,'La gangue cède',D.n+' est enfin vulnérable');
    }
  }
}
