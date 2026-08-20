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
/* Catalogue (F.2, plus le domaine Métal). Champs d'un effet : pow dégâts · heal soin ·
   shield endurance rendue · status {k,dur,v|m} posé sur la cible · buff {k,v,t} sur soi ·
   hot soin par seconde · purge · dodge (le prochain coup est évité) · drain (part des dégâts
   rendue en PV) · summon {dps,t} · count répétitions. Modificateur : mul {pow,count,cd,echo},
   add {pierce}, statusDur, hp (coût en PV), status (ajouté au module suivant). */
const MODULE={
  /* ----- effets ----- */
  projectile:{n:'Projectile',t:'effet',mana:8,pow:12,d:['feu','eau','foudre','terre','metal','arcane'],x:'2d6 à distance'},
  trait:{n:'Trait perçant',t:'effet',mana:9,pow:14,d:['foudre','espace','metal']},
  zone:{n:'Zone au sol',t:'effet',mana:14,pow:21,aoe:1,d:['feu','terre','corruption']},
  lame:{n:'Lame invoquée',t:'effet',mana:11,pow:17,d:['metal','arcane']},
  nova:{n:'Déflagration',t:'effet',mana:18,pow:28,aoe:1,d:['feu','corruption','eau'],x:'3d6 en cercle'},
  soin:{n:'Soin mineur',t:'effet',mana:8,pow:0,heal:11,d:['vie']},
  egide:{n:'Bouclier arcanique',t:'effet',mana:10,pow:0,shield:14,d:['arcane','terre','vie']},
  incendiaire:{n:'Trait incendiaire',t:'effet',mana:12,pow:8,status:{k:'brulure',dur:4,m:.25},d:['feu'],x:'brûle 4 s'},
  mains:{n:'Mains brûlantes',t:'effet',mana:6,pow:10,aoe:1,d:['feu'],x:'cône court, bon marché'},
  givre:{n:'Trait de givre',t:'effet',mana:8,pow:9,status:{k:'ralenti',dur:3.5,v:1},d:['eau'],x:'ralentit'},
  prison:{n:'Prison de glace',t:'effet',mana:16,pow:4,status:{k:'enracine',dur:3,v:1},d:['eau'],x:'immobilise 3 s'},
  mur:{n:'Mur de glace',t:'effet',mana:14,shield:18,d:['eau'],x:'rend 18 endurance'},
  soineaux:{n:'Soin des eaux',t:'effet',mana:12,heal:15,d:['eau','vie']},
  brume:{n:'Brume',t:'effet',mana:10,pow:3,aoe:1,status:{k:'affaibli',dur:5,v:1},d:['eau','espace'],x:'affaiblit 5 s'},
  eclair:{n:'Éclair',t:'effet',mana:10,pow:18,d:['foudre']},
  choc:{n:'Choc statique',t:'effet',mana:5,pow:5,status:{k:'etourdi',dur:1,v:1},d:['foudre'],x:'interrompt'},
  orage:{n:'Orage local',t:'effet',mana:25,pow:30,aoe:1,status:{k:'etourdi',dur:.8,v:1},d:['foudre'],x:'zone, lourd'},
  pique:{n:'Pique de pierre',t:'effet',mana:12,pow:16,d:['terre'],x:'jaillit du sol'},
  peau:{n:'Peau de pierre',t:'effet',mana:14,buff:{k:'def',v:2,t:30},d:['terre'],x:'+2 de réduction, 30 s'},
  seisme:{n:'Séisme mineur',t:'effet',mana:22,pow:24,aoe:1,status:{k:'etourdi',dur:1.2,v:1},d:['terre']},
  regen:{n:'Régénération',t:'effet',mana:14,buff:{k:'regenhp',v:1.5,t:20},d:['vie'],x:'+1,5 PV/s pendant 20 s'},
  purge:{n:'Purge',t:'effet',mana:10,purge:1,heal:3,d:['vie'],x:'retire les statuts'},
  vigueur:{n:'Vigueur',t:'effet',mana:9,shield:10,heal:6,d:['vie']},
  eclipse:{n:'Pas éclipsé',t:'effet',mana:10,dodge:1,d:['espace'],x:'le prochain coup te manque'},
  drain:{n:'Drain',t:'effet',mana:12,pow:10,drain:.5,d:['corruption'],x:'rend la moitié en PV'},
  terreur:{n:'Terreur',t:'effet',mana:14,pow:2,status:{k:'terreur',dur:3,v:1},d:['corruption'],x:'la cible n\'attaque plus 3 s'},
  appel:{n:'Appel corrompu',t:'effet',mana:28,summon:{dps:6,t:12},d:['corruption'],x:'une créature frappe 12 s'},
  eclats:{n:'Éclats de fer',t:'effet',mana:9,pow:7,count:3,aoe:1,d:['metal'],x:'trois éclats'},
  armurefer:{n:'Armure de fer',t:'effet',mana:13,buff:{k:'def',v:3,t:20},d:['metal']},
  aimant:{n:'Aimant',t:'effet',mana:11,pow:6,status:{k:'enracine',dur:2.5,v:1},d:['metal'],x:'attire et cloue'},
  /* ----- modificateurs — ils altèrent le module suivant, façon Noita ----- */
  multi:{n:'Double incantation',t:'modificateur',mana:6,mul:{count:2,pow:.6},d:['arcane','espace']},
  amplif:{n:'Amplification',t:'modificateur',mana:7,mul:{pow:1.6},d:['feu','corruption']},
  economie:{n:'Économie',t:'modificateur',mana:-4,mul:{pow:.85},d:['arcane','vie']},
  rapide:{n:'Incantation rapide',t:'modificateur',mana:5,mul:{cd:.6},d:['espace','foudre']},
  tribut:{n:'Sang pour puissance',t:'modificateur',mana:-7,mul:{pow:1.9},hp:.035,d:['corruption']},
  dispersion:{n:'Dispersion',t:'modificateur',mana:4,mul:{count:3,pow:.45},d:['eau','foudre']},
  braise:{n:'Cœur de braise',t:'modificateur',mana:4,mul:{pow:1.1},status:{k:'brulure',dur:5,m:.15},d:['feu'],x:'le suivant enflamme'},
  chaine:{n:'Chaîne',t:'modificateur',mana:6,mul:{count:2,pow:.7},d:['foudre']},
  concentration:{n:'Concentration',t:'modificateur',mana:4,mul:{pow:1.25},d:['arcane']},
  portee:{n:'Portée étendue',t:'modificateur',mana:5,mul:{pow:1.1,cd:.85},d:['espace']},
  contagion:{n:'Contagion',t:'modificateur',mana:8,statusDur:2,d:['corruption'],x:'les statuts du suivant durent deux fois plus'},
  tranchant:{n:'Tranchant',t:'modificateur',mana:5,mul:{pow:1.2},d:['metal']},
  /* ----- déclencheurs ----- */
  echo:{n:'Écho',t:'declencheur',mana:9,mul:{echo:.4},d:['arcane','metal','vie']},
  marque:{n:'Marque',t:'declencheur',mana:6,mul:{echo:.55},d:['arcane','espace']},
  /* ----- manuels — passifs de maniement ----- */
  saignee:{n:'Saignée',t:'passif',d:['frappes'],p:{dmg:.12}},
  brisegarde:{n:'Brise-garde',t:'passif',d:['frappes'],p:{pierce:.35}},
  balayage:{n:'Balayage',t:'passif',d:['frappes'],p:{sweep:.35}},
  frappelourde:{n:'Frappe lourde',t:'passif',d:['frappes'],p:{heavy:.25}},
  fente:{n:'Fente',t:'passif',d:['frappes'],p:{spd:.08}},
  execution:{n:'Exécution',t:'passif',d:['frappes'],p:{execute:.35}},
  gardeferme:{n:'Garde ferme',t:'passif',d:['postures'],p:{gardecost:-.25}},
  soufflelong:{n:'Souffle long',t:'passif',d:['postures'],p:{regen:1.6}},
  gardefer:{n:'Garde de fer',t:'passif',d:['postures'],p:{def:2}},
  vent:{n:'Posture du vent',t:'passif',d:['postures'],p:{spd:.15,def:-1}},
  ancrage:{n:'Ancrage',t:'passif',d:['postures'],p:{stagger:-.5}},
  duelliste:{n:'Duelliste',t:'passif',d:['postures'],p:{crit:1}},
  pasdecote:{n:'Pas de côté',t:'passif',d:['techniques'],p:{win:.30}},
  contre:{n:'Contre',t:'passif',d:['techniques'],p:{riposte:1}},
  desarmement:{n:'Désarmement',t:'passif',d:['techniques'],p:{weaken:1}},
  multicoup:{n:'Coups jumeaux',t:'passif',d:['maitrise'],p:{multi:.22}},
  allonge:{n:'Allonge',t:'passif',d:['maitrise'],p:{dmg:.10,reach:1}},
  economiegeste:{n:'Économie de geste',t:'passif',d:['maitrise'],p:{endcost:-.2}},
  impact:{n:'Impact',t:'passif',d:['maitrise'],p:{staggerE:.4}},
};
/* ce qu'un passif fait, en clair */
const PASSIF_TXT={dmg:'dégâts {p}%',pierce:'perforation {p}%',gardecost:'garde {p}% d\'endurance',regen:'endurance {v}/s',win:'fenêtre de parade {p}%',
  riposte:'riposte à la parade parfaite',multi:'second coup {p}%',reach:'allonge {v}',heavy:'frappe lourde {p}%',spd:'vitesse {p}%',execute:'{p}% sous 30 % PV',
  sweep:'balayage : {p}% sur les autres engagées',def:'réduction {v}',stagger:'chancellement {p}%',crit:'critique {v}',weaken:'la chaîne résolue affaiblit la cible',endcost:'coût d\'endurance {p}%',staggerE:'la lourde chancelle {v} s de plus'};
const MK=Object.keys(MODULE);
const READFAIL=['étourdissement','confusion','perte de mana','invocation hostile'];
