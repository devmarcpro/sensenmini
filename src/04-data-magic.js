/* Sensen Mini — 04-data-magic.js
   Domaines de grimoires et catalogue de modules
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== DOMAINES ET MODULES (5.1 / C.6 / B.4) =====
   Mapping Wu Xing : Foudre et Vie → Bois (le tonnerre du printemps et
   la croissance). Arcane, Espace et Corruption sont hors cycle : leur
   vecteur est un mélange, pas une exception écrite. */
const DOMAIN={
  feu:{n:'Feu',g:'火',v:{1:1},b:'grimoire'},
  eau:{n:'Eau et Glace',g:'水',v:{4:1},b:'grimoire'},
  foudre:{n:'Foudre',g:'雷',v:{0:1},b:'grimoire'},
  terre:{n:'Terre',g:'土',v:{2:1},b:'grimoire'},
  vie:{n:'Vie',g:'生',v:{0:1},b:'grimoire'},
  metal:{n:'Métal',g:'金',v:{3:1},b:'grimoire'},
  arcane:{n:'Arcane',g:'秘',v:{0:.2,1:.2,2:.2,3:.2,4:.2},b:'grimoire'},
  espace:{n:'Espace',g:'空',v:{4:.6,3:.4},b:'grimoire'},
  corruption:{n:'Corruption',g:'蝕',v:{2:.5,1:.5},b:'grimoire'},
  frappes:{n:'Frappes',g:'撃',v:{},b:'manuel'},
  postures:{n:'Postures',g:'構',v:{},b:'manuel'},
  techniques:{n:'Techniques',g:'技',v:{},b:'manuel'},
  maitrise:{n:'Maîtrise',g:'極',v:{},b:'manuel'},
};
const DK=Object.keys(DOMAIN);
const domVec=d=>norm(V(DOMAIN[d].v));
const MODULE={
  /* effets */
  projectile:{n:'Projectile',t:'effet',mana:8,pow:12,d:['feu','eau','foudre','metal','arcane']},
  trait:{n:'Trait perçant',t:'effet',mana:9,pow:14,d:['foudre','espace','metal']},
  zone:{n:'Zone au sol',t:'effet',mana:14,pow:21,d:['feu','terre','corruption']},
  lame:{n:'Lame invoquée',t:'effet',mana:11,pow:17,d:['metal','arcane']},
  nova:{n:'Déflagration',t:'effet',mana:18,pow:28,d:['feu','corruption','eau']},
  soin:{n:'Soin',t:'effet',mana:12,pow:0,heal:15,d:['vie']},
  egide:{n:'Égide de mana',t:'effet',mana:10,pow:0,shield:14,d:['arcane','terre','vie']},
  /* modificateurs — ils altèrent le module suivant, façon Noita */
  multi:{n:'Multi-cast',t:'modificateur',mana:6,mul:{count:2,pow:.6},d:['arcane','espace']},
  amplif:{n:'Amplification',t:'modificateur',mana:7,mul:{pow:1.6},d:['feu','corruption']},
  economie:{n:'Économie',t:'modificateur',mana:-4,mul:{pow:.85},d:['arcane','vie']},
  rapide:{n:'Incantation rapide',t:'modificateur',mana:5,mul:{cd:.6},d:['espace','foudre']},
  tribut:{n:'Tribut sanglant',t:'modificateur',mana:-7,mul:{pow:1.9},hp:.035,d:['corruption']},
  dispersion:{n:'Dispersion',t:'modificateur',mana:4,mul:{count:3,pow:.45},d:['eau','foudre']},
  echo:{n:'Écho',t:'declencheur',mana:9,mul:{echo:.4},d:['arcane','metal','vie']},
  /* manuels — passifs de maniement */
  saignee:{n:'Saignée',t:'passif',d:['frappes'],p:{dmg:.12}},
  brisegarde:{n:'Brise-garde',t:'passif',d:['frappes'],p:{pierce:.35}},
  gardeferme:{n:'Garde ferme',t:'passif',d:['postures'],p:{gardecost:-.25}},
  soufflelong:{n:'Souffle long',t:'passif',d:['postures'],p:{regen:1.6}},
  pasdecote:{n:'Pas de côté',t:'passif',d:['techniques'],p:{win:.30}},
  contre:{n:'Contre',t:'passif',d:['techniques'],p:{riposte:1}},
  multicoup:{n:'Multi-coup',t:'passif',d:['maitrise'],p:{multi:.22}},
  allonge:{n:'Allonge',t:'passif',d:['maitrise'],p:{dmg:.10,reach:1}},
};
const MK=Object.keys(MODULE);
const READFAIL=['étourdissement','confusion','perte de mana','invocation hostile'];
