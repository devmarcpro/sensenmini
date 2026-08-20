/* Sensen Mini — 02-data-materials.js
   Les 38 matériaux et leurs catégories
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== MATÉRIAUX (4.2 / B.2 / F.1) ===== */
const CAT={
  bois:{n:'Bois',g:'木',tool:'hache',sk:'bucheronnage',wx:{0:1}},
  metal:{n:'Métal',g:'金',tool:'pioche',sk:'minage',wx:{3:1}},
  roche:{n:'Roche',g:'岩',tool:'pioche',sk:'minage',wx:{2:1}},
  terre:{n:'Terre',g:'土',tool:'pelle',sk:'terrassement',wx:{2:1}},
  vegetal:{n:'Végétal / fibre',g:'草',tool:'serpe',sk:'herboristerie',wx:{0:1}},
  liquide:{n:'Liquide',g:'水',tool:null,sk:'collecte',wx:{4:1}},
  mineral:{n:'Minéral',g:'鉱',tool:'pioche',sk:'minage',wx:{2:.6,3:.4}},
  fossile:{n:'Fossile',g:'骨',tool:'pioche',sk:'minage',wx:{0:.5,2:.5}},
  gemme:{n:'Gemme',g:'玉',tool:'pioche',sk:'minage',wx:{3:.5,2:.5}},
  meteo:{n:'Météorologique',g:'天',tool:null,sk:'collecte',wx:{4:.5,1:.5}},
};
const MAT={
  pin:{n:'Pin',c:'bois',d:6,de:5,v:2}, chene:{n:'Chêne',c:'bois',d:11,de:8,v:5},
  ebene:{n:'Ébène',c:'bois',d:16,de:13,v:16}, boisfer:{n:'Bois-fer',c:'bois',d:23,de:11,v:34},
  cuivre:{n:'Cuivre',c:'metal',d:12,de:9,v:6,m:4}, fer:{n:'Fer',c:'metal',d:20,de:8,v:10},
  argent:{n:'Argent',c:'metal',d:14,de:11,v:26,m:9}, or:{n:'Or',c:'metal',d:10,de:19,v:65,m:14},
  mithril:{n:'Mithril',c:'metal',d:31,de:5,v:130,m:22}, adamant:{n:'Adamant',c:'metal',d:44,de:15,v:280},
  gres:{n:'Grès',c:'roche',d:8,de:9,v:1}, calcaire:{n:'Calcaire',c:'roche',d:12,de:10,v:2},
  pierre:{n:'Pierre',c:'roche',d:17,de:11,v:3}, basalte:{n:'Basalte',c:'roche',d:24,de:14,v:7},
  granit:{n:'Granit',c:'roche',d:29,de:13,v:9}, granitnoir:{n:'Granit noir',c:'roche',d:36,de:16,v:20},
  obsidienne:{n:'Obsidienne',c:'roche',d:28,de:12,v:40,wx:{2:.5,1:.5}},
  argile:{n:'Argile',c:'terre',d:3,de:7,v:1}, limon:{n:'Limon',c:'terre',d:2,de:6,v:1},
  lin:{n:'Lin',c:'vegetal',d:3,de:2,v:2}, laine:{n:'Laine',c:'vegetal',d:4,de:2,v:4},
  soie:{n:'Soie',c:'vegetal',d:6,de:1,v:22}, cuir:{n:'Cuir',c:'vegetal',d:10,de:4,v:8},
  baies:{n:'Baies',c:'vegetal',d:1,de:1,v:1,nutr:10}, racines:{n:'Racines',c:'vegetal',d:4,de:3,v:2,nutr:16},
  champignons:{n:'Champignons',c:'vegetal',d:2,de:1,v:3,nutr:13},
  herbes:{n:'Herbes médicinales',c:'vegetal',d:3,de:1,v:9,nutr:6},
  os:{n:'Os',c:'fossile',d:14,de:6,v:6,wx:{0:.5,2:.5}},
  ambre:{n:'Ambre',c:'fossile',d:7,de:3,v:36,wx:{0:.6,2:.4},m:11},
  ecaille:{n:'Écailles',c:'fossile',d:19,de:7,v:24},
  rubis:{n:'Rubis',c:'gemme',d:24,de:8,v:90,wx:{1:1}}, saphir:{n:'Saphir',c:'gemme',d:24,de:8,v:90,wx:{4:1}},
  emeraude:{n:'Émeraude',c:'gemme',d:23,de:8,v:90,wx:{0:1}}, topaze:{n:'Topaze',c:'gemme',d:22,de:8,v:80,wx:{2:1}},
  onyx:{n:'Onyx',c:'gemme',d:25,de:9,v:95,wx:{3:1}},
  cristalmana:{n:'Cristal de mana',c:'mineral',d:18,de:6,v:150,m:30},
  sel:{n:'Sel',c:'mineral',d:4,de:5,v:3}, charbon:{n:'Charbon',c:'mineral',d:7,de:5,v:4,wx:{1:1}},
  glace:{n:'Glace',c:'meteo',d:5,de:4,v:2,wx:{4:1}}, cendre:{n:'Cendre',c:'meteo',d:2,de:2,v:2,wx:{1:1}},
  eaupure:{n:'Eau pure',c:'liquide',d:1,de:1,v:1,nutr:4},
};
const matVec=k=>norm(V(MAT[k].wx||CAT[MAT[k].c].wx));
const matName=k=>MAT[k].n;
const BIOME={
  plaine:{n:'Plaine tempérée',c:'#6E8E5A',fert:1.0,mats:['pin','limon','argile','lin','baies','cuivre','gres']},
  foret:{n:'Forêt tempérée',c:'#3F6B45',fert:.9,mats:['chene','pin','limon','herbes','champignons','cuir','os']},
  foretmana:{n:'Forêt de mana',c:'#4B7F86',fert:.8,mats:['ebene','cristalmana','soie','ambre','emeraude','herbes']},
  desert:{n:'Désert aride',c:'#C9A25E',fert:.2,mats:['gres','sel','cuivre','os','topaze','racines']},
  cendres:{n:'Désert de cendres',c:'#7A5348',fert:.1,mats:['basalte','obsidienne','cendre','charbon','rubis']},
  toundra:{n:'Toundra',c:'#8FA3A8',fert:.3,mats:['glace','limon','laine','calcaire','racines']},
  taiga:{n:'Taïga',c:'#4C6B5C',fert:.6,mats:['pin','chene','fer','os','laine','champignons']},
  marecage:{n:'Marécage',c:'#57654A',fert:.7,mats:['limon','argile','lin','cuir','charbon','eaupure']},
  marcorr:{n:'Marécage corrompu',c:'#4A4257',fert:.3,mats:['os','obsidienne','charbon','ecaille','onyx']},
  montagne:{n:'Montagne',c:'#8A8A82',fert:.2,mats:['pierre','fer','calcaire','argent','basalte']},
  montcris:{n:'Montagne cristalline',c:'#7E8FB0',fert:.1,mats:['granitnoir','mithril','cristalmana','saphir','adamant']},
  cote:{n:'Côte',c:'#7FA9A0',fert:.5,mats:['gres','sel','lin','ecaille','saphir','eaupure']},
};
const POI={village:{n:'Village',g:'村'},donjon:{n:'Donjon',g:'塔'},camp:{n:'Camp',g:'幕'},
  sanctuaire:{n:'Sanctuaire',g:'社'},filon:{n:'Filon majeur',g:'鉱'}};
const TOWN=['Grispierre','Val-Muet','Fontcendre','Haute-Ronce','Sombreverse','Pierrelune','Trois-Racines',
  'Sel-du-Nord','Bassefeuille','Cormorance','Roche-Fendue','Ambrelune','Bois-Dormant','Clairvive','Ferrebrume'];
const STRATA=[
  {n:'Terre et grès',rock:'gres',prof:'surface'},
  {n:'Calcaire et ardoise',rock:'calcaire',prof:'−30'},
  {n:'Pierre',rock:'pierre',prof:'−80'},
  {n:'Basalte',rock:'basalte',prof:'−160'},
  {n:'Granit',rock:'granit',prof:'−260'},
  {n:'Granit noir',rock:'granitnoir',prof:'−380'},
];
const STRAT_MATS=[[],['calcaire','fer'],['pierre','argent','charbon'],['basalte','or','ambre'],
                  ['granit','mithril','onyx'],['granitnoir','adamant','cristalmana']];
