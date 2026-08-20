/* Sensen Mini — 03-data-craft.js
   Formes travaillées, composants, constructions, stations, objets
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== TRANSFORMATIONS (4.2 / C.8) =====
   Une matière brute passe par une FORME travaillée avant de devenir
   composant. Règle du GDD : plus la transformation est violente, plus
   le Feu entre dans le vecteur. */
const FORM={
  lingot:{n:'Lingot',g:'錠',st:'forge',from:['metal'],cost:2,feu:.30},
  verre:{n:'Verre',g:'硝',st:'forge',from:['roche'],only:['gres'],cost:3,feu:.30},
  brique:{n:'Brique',g:'甎',st:'forge',from:['terre'],cost:3,feu:.25},
  planche:{n:'Planches',g:'板',st:'scierie',from:['bois'],cost:2,feu:0},
  taillee:{n:'Pierre taillée',g:'石',st:'tailleur',from:['roche'],cost:2,feu:.05},
  tissu:{n:'Tissu',g:'布',st:'tissage',from:['vegetal'],not:['cuir','baies','racines','champignons','herbes'],cost:2,feu:.05},
  tanne:{n:'Cuir tanné',g:'革',st:'tissage',from:['vegetal'],only:['cuir'],cost:2,feu:.10},
};
const FK=Object.keys(FORM);
const formOk=(f,mk)=>{const F=FORM[f],m=MAT[mk];
  if(F.only)return F.only.includes(mk);
  if(!F.from.includes(m.c))return false;
  if(F.not&&F.not.includes(mk))return false;
  return true;};
/* brut utilisable directement en composant (pas de station) */
const RAWFORM={brut:{n:'Brut',g:'原',st:null,cost:2,feu:0}};
function formVec(f,mk){
  const base=matVec(mk),fe=((FORM[f]||RAWFORM[f]||{}).feu)||0;
  const v=base.map((x,i)=>x*(1-fe)+(i===1?fe:0));
  return norm(v);
}
/* ===== COMPOSANTS (4.2.1 / F.11) =====
   Peu de types, beaucoup de matériaux. w = poids de slot (A.4.7). */
const COMP={
  lame:{n:'Lame',g:'刃',w:.7,st:'enclume',forms:['lingot','taillee','brut'],raw:['os','obsidienne','ecaille']},
  tetemasse:{n:'Tête de masse',g:'槌',w:.7,st:'enclume',forms:['lingot','taillee','brique'],raw:[]},
  pointe:{n:'Pointe',g:'尖',w:.7,st:'enclume',forms:['lingot','taillee','brut'],raw:['os','obsidienne']},
  ferhache:{n:'Fer de hache',g:'斧',w:.7,st:'enclume',forms:['lingot','taillee'],raw:[]},
  teteoutil:{n:"Tête d'outil",g:'工',w:.7,st:'enclume',forms:['lingot','taillee'],raw:[]},
  focus:{n:'Focus',g:'珠',w:.7,st:'enchantement',forms:['brut'],raw:['rubis','saphir','emeraude','topaze','onyx','ambre','cristalmana']},
  manche:{n:'Manche',g:'柄',w:.25,st:'scierie',forms:['planche','lingot','brut'],raw:['os']},
  hampe:{n:'Hampe',g:'竿',w:.25,st:'scierie',forms:['planche','lingot'],raw:[]},
  /* le corps d'un arc : c'est lui qui porte la puissance, comme la lame porte la coupe */
  fut:{n:'Fût d\'arc',g:'弓',w:.7,st:'scierie',forms:['planche','brut'],raw:['os','ecaille','ebene','if','boisfer']},
  plaque:{n:'Plaque',g:'板',w:.7,st:'enclume',forms:['lingot'],raw:[],cons:'plaque'},
  anneaux:{n:'Anneaux',g:'環',w:.7,st:'enclume',forms:['lingot'],raw:[],cons:'mailles'},
  ecailles:{n:'Écailles',g:'鱗',w:.7,st:'enclume',forms:['brut'],raw:['os','ecaille'],cons:'ecailles'},
  peau:{n:'Pièce de cuir',g:'革',w:.7,st:'tissage',forms:['tanne'],raw:[],cons:'cuir'},
  rembourrage:{n:'Rembourrage',g:'綿',w:.7,st:'tissage',forms:['tissu'],raw:[],cons:'matelasse'},
  sangles:{n:'Sangles',g:'帯',w:.25,st:'tissage',forms:['tissu','tanne'],raw:[]},
  fixations:{n:'Fixations',g:'鋲',w:.05,st:'etabli',forms:['lingot','tissu','planche','brut'],raw:['os']},
};
const CONS={
  matelasse:{n:'Matelassé',fort:['contondant'],faible:['percant']},
  cuir:{n:'Cuir',fort:['tranchant'],faible:['percant']},
  mailles:{n:'Mailles',fort:['tranchant'],faible:['contondant']},
  ecailles:{n:'Écailles',fort:['tranchant','percant'],faible:['contondant']},
  plaque:{n:'Plaque',fort:['tranchant','percant'],faible:[]},
};
const ARMPARTS=['plaque','anneaux','ecailles','peau','rembourrage'];
const STATION={
  etabli:{n:'Établi',g:'台',sk:'menuiserie',p:35,cost:[['bois',6]]},
  scierie:{n:'Scierie',g:'鋸',sk:'menuiserie',p:60,cost:[['bois',10],['roche',4]]},
  tailleur:{n:'Tailleur de pierre',g:'鑿',sk:'taille',p:60,cost:[['roche',12],['bois',4]]},
  forge:{n:'Forge',g:'炉',sk:'forge',p:80,cost:[['roche',14],['terre',6]]},
  enclume:{n:'Enclume',g:'砧',sk:'forge',p:60,cost:[['form:lingot',5]]},
  tissage:{n:'Atelier de tissage',g:'織',sk:'tissage',p:40,cost:[['bois',6],['vegetal',8]]},
  enchantement:{n:"Table d'enchantement",g:'呪',sk:'enchantement',p:50,cost:[['form:taillee',6],['form:lingot',4]]},
  cuisine:{n:'Cuisine',g:'厨',sk:'cuisine',p:40,cost:[['roche',8],['bois',6]]},
  alambic:{n:'Alambic',g:'蒸',sk:'alchimie',p:45,cost:[['form:lingot',4],['roche',6]]},
};
/* ===== OBJETS (A.4.1 / 6.2) ===== */
const DT={tranchant:'tranchant',percant:'perforant',contondant:'contondant'};
/* `h` : mains occupées. Une arme à deux mains interdit la seconde main —
   c'est ce qui donne son prix au bouclier et au dual wielding (5.1).
   `dist` : arme de jet — la Dextérité y remplace la Force, on tient la
   distance, mais on ne pare pas avec un arc. */
const FUNC={
  dague:{n:'Dague',d:[1,6],crit:19,spd:3.0,reach:1,t:'percant',h:1,comp:['lame','manche']},
  epee:{n:'Épée',d:[2,6],crit:20,spd:2.0,reach:1.5,t:'tranchant',h:1,comp:['lame','manche']},
  masse:{n:'Masse',d:[3,8],crit:20,spd:1.2,reach:1.5,t:'contondant',h:1,comp:['tetemasse','manche']},
  hache:{n:"Hache d'armes",d:[2,10],crit:20,spd:1.4,reach:1.5,t:'tranchant',h:1,comp:['ferhache','manche']},
  baton:{n:'Bâton magique',d:[1,4],crit:20,spd:1.8,reach:1,t:'contondant',h:2,comp:['focus','hampe']},
  lance:{n:'Lance',d:[2,8],crit:20,spd:1.5,reach:2.5,t:'percant',h:2,comp:['pointe','hampe']},
  marteau:{n:'Marteau de guerre',d:[2,12],crit:20,spd:.9,reach:1.5,t:'contondant',h:2,comp:['tetemasse','hampe']},
  hallebarde:{n:'Hallebarde',d:[2,9],crit:20,spd:1.1,reach:2.5,t:'tranchant',h:2,comp:['ferhache','hampe']},
  trident:{n:'Trident',d:[3,4],crit:19,spd:1.6,reach:2,t:'percant',h:2,comp:['pointe','hampe']},
  arc:{n:'Arc',d:[2,8],crit:19,spd:1.6,reach:6,t:'percant',h:2,dist:1,comp:['fut','sangles']},
  fronde:{n:'Fronde',d:[1,8],crit:20,spd:2.1,reach:4,t:'contondant',h:1,dist:1,comp:['sangles','manche']},
  bouclier:{n:'Bouclier',d:[1,4],crit:20,spd:1.0,reach:1,t:'contondant',h:1,shield:1,comp:['plaque','sangles']},
};
const FK2=Object.keys(FUNC);
const OUTIL={
  pioche:{n:'Pioche',comp:['teteoutil','manche'],cat:'roche'},
  hachebois:{n:'Hache',comp:['ferhache','manche'],cat:'bois'},
  pelle:{n:'Pelle',comp:['teteoutil','manche'],cat:'terre'},
  serpe:{n:'Serpe',comp:['lame','manche'],cat:'vegetal'},
};
const TOOLKIND={roche:'pioche',metal:'pioche',mineral:'pioche',fossile:'pioche',gemme:'pioche',
                bois:'hachebois',terre:'pelle',vegetal:'serpe'};
const SLOTS=[
  {k:'tete',n:'Casque',g:'頭',zone:'tete'},{k:'torse',n:'Cuirasse',g:'胴',zone:'torse'},
  {k:'bras',n:'Brassards-gants',g:'腕',zone:'bras'},{k:'jambes',n:'Jambières',g:'脚',zone:'jambes'},
  {k:'pieds',n:'Bottes',g:'足',zone:'pieds'},
  {k:'main1',n:'Main principale',g:'主',hand:1},{k:'main2',n:'Main secondaire',g:'副',hand:1},
  {k:'muni',n:'Munitions',g:'矢'},
  {k:'anneau1',n:'Anneau',g:'環'},{k:'anneau2',n:'Anneau',g:'環'},{k:'amulette',n:'Amulette',g:'珠'},
  {k:'dos',n:'Dos — cape ou sac',g:'背'},{k:'acc1',n:'Accessoire',g:'具'},{k:'acc2',n:'Accessoire',g:'具'},
];
const ZONE={
  tete:{n:'Tête',g:'頭',mult:2.5,w:8,avg:.20},torse:{n:'Torse',g:'胴',mult:1.0,w:40,avg:.35},
  bras:{n:'Bras',g:'腕',mult:0.9,w:18,avg:.15},jambes:{n:'Jambes',g:'脚',mult:0.8,w:24,avg:.20},
  pieds:{n:'Pieds',g:'足',mult:0.7,w:10,avg:.10}};
const ZK=Object.keys(ZONE);
/* Recettes de base connues d'office ; les exotiques s'apprennent (4.2.1) */
const BASEMAT=['fer','cuivre','etain','zinc','chene','pin','hetre','frene','bouleau','sapin','lin','laine','coton','chanvre','paille','cuir',
  'gres','calcaire','pierre','silex','ardoise','schiste','argile','limon','sable','terre','terrefertile'];
