/* Sensen Mini — 05-data-social.js
   Races, classes, cycle sexagésimal, cultures de nommage
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== RACES, CLASSES, NAISSANCE (6.1 / C.1 / C.2 / C.3) ===== */
const STATS=[['force','Force','dégâts de mêlée, poids porté'],['dex','Dextérité','vitesse d\'attaque'],
  ['endu','Endurance','points de vie'],['vol','Volonté','mana'],
  ['per','Perception','lecture, détection'],['cha','Charisme','prix, relations']];
const RACE={
  humain:{n:'Humain',g:'人',b:'+10% XP de compétences',life:80,st:{},xp:1.10,cult:['latine','nordique','sino','nipponne','slave','arabo','celte'],pot:{}},
  elfe:{n:'Elfe',g:'精',b:'+2 Volonté, +1 Perception, régén mana +20%',life:400,st:{vol:2,per:1},cult:['celte'],pot:{meditation:120,mana:120}},
  nain:{n:'Nain',g:'矮',b:'+2 Endurance, +1 Force, minage et forge +15%',life:200,st:{endu:2,force:1},cult:['nordique'],pot:{forge:120,minage:120,m_arcane:60}},
  sylvide:{n:'Sylvide',g:'森',b:'Faim ralentie de moitié, affinité végétale',life:150,st:{vol:1,per:1},cult:['sylvestre'],pot:{herboristerie:120,agriculture:120}},
  cendreux:{n:'Cendreux',g:'灰',b:'+15% forge, insensible à la chaleur mineure',life:90,st:{force:1,endu:1},cult:['ignee'],pot:{forge:120,m_feu:120,m_eau:60}},
  echomorphe:{n:'Échomorphe',g:'響',b:'Corps mimétique — −10% XP, potentiels plats',life:120,st:{dex:1,per:1},xp:.90,cult:['resonance'],pot:{}},
};
const CLASSE={
  guerrier:{n:'Guerrier',g:'武',st:{force:2,endu:1},sk:{epee:5,bouclier:5},kit:'epee',pot:{epee:120,encaissement:120,m_arcane:60}},
  mage:{n:'Mage',g:'呪',st:{vol:2,per:1},sk:{meditation:5,mana:5},kit:'baton',books:2,pot:{meditation:130,m_feu:120,m_eau:120,epee:60}},
  artisan:{n:'Artisan',g:'工',st:{dex:2,force:1},sk:{forge:5,menuiserie:5,assemblage:5},kit:'pioche',pot:{forge:130,menuiserie:120,assemblage:130}},
  chasseur:{n:'Chasseur',g:'狩',st:{dex:2,per:1},sk:{dague:5,herboristerie:5},kit:'dague',pot:{dague:120,esquive:120,herboristerie:120}},
  marchand:{n:'Marchand',g:'商',st:{cha:2,per:1},sk:{negociation:5,lecture:5},kit:'dague',or:500,pot:{negociation:130,lecture:120}},
  vagabond:{n:'Vagabond',g:'浪',st:{},sk:{},kit:'masse',pts:15,pot:{}},
};
const ANIMALS=[
  {g:'鼠',n:'Rat',s:['discretion','negociation']},{g:'牛',n:'Bœuf',s:['encaissement','agriculture']},
  {g:'虎',n:'Tigre',s:['hache','athletisme']},{g:'兔',n:'Lapin',s:['esquive','herboristerie']},
  {g:'龍',n:'Dragon',s:['mana','leadership']},{g:'蛇',n:'Serpent',s:['alchimie','perception_sk']},
  {g:'馬',n:'Cheval',s:['athletisme','dressage']},{g:'羊',n:'Chèvre',s:['tissage','taille']},
  {g:'猴',n:'Singe',s:['lecture','menuiserie']},{g:'鶏',n:'Coq',s:['dague','perception_sk']},
  {g:'犬',n:'Chien',s:['dressage','encaissement']},{g:'猪',n:'Cochon',s:['cuisine','negociation']},
];
/* élément de naissance → domaines liés (6.1) */
const EL_DOM=[['el_bois','m_foudre','agriculture'],['el_feu','m_feu','forge'],
  ['el_terre','m_terre','minage'],['el_metal','m_metal','forge'],['el_eau','m_eau','alchimie']];
const TRINE=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
const CULT={
  latine:{n:'Latine',a:['Mar','Luc','Cor','Vale','Ant','Sev','Ful','Oct'],b:['us','ia','ianus','ella','inus','ara']},
  nordique:{n:'Nordique',a:['Bjor','Hald','Sig','Thor','Gunn','Ulf','Ing'],b:['nir','var','rid','gar','dis','skr']},
  sino:{n:'Sino',a:['Lian','Xue','Ren','Bao','Mei','Qiu','Zhen'],b:['-hua','-ming','-shan','-yu','-feng','-lin']},
  nipponne:{n:'Nipponne',a:['Aki','Hoshi','Mori','Kaze','Yuki','Take','Shino'],b:['ta','ko','maru','no','zen','ya']},
  slave:{n:'Slave',a:['Vlad','Mir','Bogd','Stan','Zor','Rad','Nev'],b:['imir','oslav','ana','enko','ka','uszek']},
  arabo:{n:'Arabo-berbère',a:['Zay','Nas','Ida','Amaz','Faru','Sal','Tam'],b:['ir','oun','ida','ghar','ine','za']},
  celte:{n:'Celte',a:['Bran','Aeth','Cael','Nia','Orin','Ru','Sian'],b:['wen','dour','ach','lin','veth','nog']},
  sylvestre:{n:'Sylvestre',a:['Vaë','Lio','Syl','Théa','Naë','Ombr','Fli'],b:['-sève','-liane','-ombre','-fleur','-ru','-mousse']},
  ignee:{n:'Ignée',a:['Krak','Tzor','Bral','Kesh','Vurn','Dagh'],b:['-kh','-tor','-rakh','-um','-gorn','-esh']},
  resonance:{n:'Résonance',a:['Ki-ki','Va-va','Ssu','Tik','Ryn','Ho-ho'],b:['-ryn','-ki','-ssu','-tik','-va','-lo']},
};
const cultName=c=>pick(CULT[c].a)+pick(CULT[c].b);
