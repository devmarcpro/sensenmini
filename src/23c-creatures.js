/* Sensen Mini — 23c-creatures.js
   Bestiaire (F.3) : bêtes réelles, humains hostiles, et les corrompus des hautes corruptions
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Une créature = un gabarit : où elle vit, son rythme d'attaque (delay
   entre deux coups, wind de télégraphe), ses multiplicateurs de PV,
   dégâts et armure autour de la puissance du lieu, son comportement
   (meute, fuite, venin, embuscade, nuée), ce qu'elle laisse.
   La menace vient des bêtes, des humains et de l'environnement ; les
   corrompus n'apparaissent qu'où la corruption est haute (F.3).
   ================================================================== */
const CREATURE={
  /* plaines et forêts tempérées */
  loup:{n:'Loup',g:'狼',cat:'bete',bio:['plaine','foret','taiga'],lv:6,vec:{0:.6,3:.4},dt:'tranchant',delay:2.0,wind:1.0,hp:.8,dmg:.85,arm:.6,pack:[1,4],nuit:2,tame:1,pat:['simple','morsure','double'],mats:['cuir','os','fourrure']},
  sanglier:{n:'Sanglier',g:'猪',cat:'bete',bio:['plaine','foret'],lv:8,vec:{2:.7,0:.3},dt:'contondant',delay:2.8,wind:1.3,hp:1.15,dmg:1.1,arm:1.1,tame:1,pat:['simple','lourd'],mats:['cuir','os']},
  cerf:{n:'Cerf',g:'鹿',cat:'bete',bio:['plaine','foret','taiga','foretmana'],lv:3,vec:{0:1},dt:'contondant',delay:3.2,wind:1.2,hp:.7,dmg:.6,arm:.4,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os']},
  renard:{n:'Renard',g:'狐',cat:'bete',bio:['plaine','foret','foretmana'],lv:3,vec:{1:.6,0:.4},dt:'percant',delay:1.8,wind:.9,hp:.55,dmg:.6,arm:.3,fuit:1,tame:1,pack:[1,2],pat:['simple','double'],mats:['fourrure']},
  abeilles:{n:'Essaim d\'abeilles',g:'蜂',cat:'vermine',bio:['plaine','foret','foretmana'],lv:4,vec:{0:.5,1:.5},dt:'percant',delay:1.4,wind:.6,hp:.55,dmg:.3,arm:0,nuee:1,pat:['double','balayage'],mats:['ambre']},
  /* désert */
  scorpion:{n:'Scorpion',g:'蠍',cat:'bete',bio:['desert','cendres'],lv:7,vec:{2:.6,1:.4},dt:'percant',delay:2.4,wind:1.0,hp:.8,dmg:.9,arm:1.3,venin:1,tame:1,pat:['simple','morsure'],mats:['ecaille','os']},
  vautour:{n:'Vautour',g:'鷲',cat:'bete',bio:['desert','montagne','cendres'],lv:5,vec:{4:.4,3:.6},dt:'tranchant',delay:2.2,wind:.9,hp:.65,dmg:.75,arm:.3,tame:1,pack:[1,3],pat:['simple','double'],mats:['os']},
  chameau:{n:'Chameau sauvage',g:'駝',cat:'bete',bio:['desert'],lv:6,vec:{2:1},dt:'contondant',delay:3.0,wind:1.3,hp:1.2,dmg:.7,arm:.6,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','laine']},
  /* toundra et taïga */
  ourspolaire:{n:'Ours polaire',g:'熊',cat:'bete',bio:['toundra','montcris'],lv:18,vec:{4:.7,2:.3},dt:'tranchant',delay:3.4,wind:1.6,hp:1.8,dmg:1.6,arm:1.4,tame:1,pat:['simple','lourd','balayage'],mats:['fourrure','cuir','os']},
  loupblanc:{n:'Loup blanc',g:'狼',cat:'bete',bio:['toundra','taiga'],lv:8,vec:{4:.6,3:.4},dt:'tranchant',delay:1.9,wind:1.0,hp:.85,dmg:.9,arm:.6,pack:[1,3],nuit:2,tame:1,pat:['simple','morsure','double'],mats:['fourrure','os']},
  renne:{n:'Renne',g:'鹿',cat:'bete',bio:['toundra','taiga'],lv:4,vec:{0:.6,4:.4},dt:'contondant',delay:3.0,wind:1.2,hp:.8,dmg:.6,arm:.5,fuit:1,tame:1,pack:[1,3],pat:['simple','lourd'],mats:['cuir','os','laine']},
  morse:{n:'Morse',g:'海',cat:'bete',bio:['cote','toundra'],lv:12,vec:{4:1},dt:'percant',delay:3.6,wind:1.5,hp:1.6,dmg:1.1,arm:1.2,tame:1,pat:['simple','lourd'],mats:['cuir','os']},
  /* marécage */
  crocodile:{n:'Crocodile',g:'鰐',cat:'bete',bio:['marecage','marcorr','cote'],lv:14,vec:{4:.6,2:.4},dt:'percant',delay:3.2,wind:1.4,hp:1.5,dmg:1.4,arm:1.5,embuscade:1,tame:1,pat:['morsure','lourd'],mats:['ecaille','cuir']},
  moustiques:{n:'Nuée de moustiques',g:'蚊',cat:'vermine',bio:['marecage','marcorr'],lv:4,vec:{4:.6,0:.4},dt:'percant',delay:1.2,wind:.55,hp:.45,dmg:.28,arm:0,nuee:1,pat:['double','balayage'],mats:[]},
  serpent:{n:'Serpent venimeux',g:'蛇',cat:'bete',bio:['marecage','foret','desert','marcorr','cendres','foretmana'],lv:8,vec:{4:.5,0:.5},dt:'percant',delay:2.6,wind:.8,hp:.7,dmg:.8,arm:.5,venin:1,tame:1,pat:['morsure','simple'],mats:['ecaille']},
  /* montagne */
  aigle:{n:'Aigle',g:'鷲',cat:'bete',bio:['montagne','montcris'],lv:7,vec:{3:.5,0:.5},dt:'tranchant',delay:2.0,wind:.9,hp:.7,dmg:.9,arm:.3,tame:1,pack:[1,2],pat:['simple','double'],mats:['os']},
  oursbrun:{n:'Ours brun',g:'熊',cat:'bete',bio:['montagne','foret','taiga'],lv:16,vec:{2:.6,0:.4},dt:'contondant',delay:3.4,wind:1.6,hp:1.7,dmg:1.5,arm:1.3,tame:1,pat:['simple','lourd','balayage'],mats:['fourrure','cuir','os']},
  bouquetin:{n:'Bouquetin',g:'羊',cat:'bete',bio:['montagne','montcris'],lv:4,vec:{2:.7,3:.3},dt:'contondant',delay:2.8,wind:1.2,hp:.75,dmg:.7,arm:.6,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os','laine']},
  lynx:{n:'Lynx',g:'猫',cat:'bete',bio:['montagne','foret','taiga','montcris','foretmana'],lv:9,vec:{3:.5,0:.5},dt:'tranchant',delay:1.8,wind:.8,hp:.8,dmg:1.0,arm:.5,embuscade:1,tame:1,pat:['double','morsure'],mats:['fourrure','os']},
  /* humains hostiles — ils portent une bourse et parfois du butin */
  bandit:{n:'Bandit',g:'賊',cat:'humain',bio:['plaine','foret','desert','cote','taiga'],dj:1,camp:1,lv:10,vec:{3:.5,1:.5},dt:'tranchant',delay:2.6,wind:1.2,hp:1.0,dmg:1.0,arm:.9,or:3,loot:2,pack:[1,3],pat:['simple','double','lourd'],mats:['cuir']},
  chef:{n:'Chef de bande',g:'首',cat:'humain',bio:[],camp:1,lv:16,vec:{1:.5,3:.5},dt:'tranchant',delay:2.8,wind:1.2,hp:1.5,dmg:1.3,arm:1.2,or:6,loot:3,pat:['simple','lourd','balayage'],mats:['cuir']},
  braconnier:{n:'Braconnier',g:'猟',cat:'humain',bio:['foret','taiga','marecage'],lv:8,vec:{0:.6,3:.4},dt:'percant',delay:2.4,wind:1.0,hp:.9,dmg:.95,arm:.7,or:2,loot:2,pack:[1,2],pat:['simple','double','crachat'],mats:['cuir','fourrure']},
  pillard:{n:'Pillard',g:'襲',cat:'humain',bio:['plaine','desert','cote'],camp:1,lv:12,vec:{1:.6,3:.4},dt:'contondant',delay:2.7,wind:1.2,hp:1.2,dmg:1.15,arm:1.0,or:4,loot:2,pack:[1,3],pat:['simple','lourd','balayage'],mats:['cuir']},
  deserteur:{n:'Déserteur',g:'逃',cat:'humain',bio:['montagne','toundra','foret'],dj:1,lv:11,vec:{3:.7,2:.3},dt:'tranchant',delay:2.6,wind:1.1,hp:1.1,dmg:1.05,arm:1.2,or:3,loot:2,pack:[1,2],pat:['simple','double','lourd'],mats:['cuir']},
  ermite:{n:'Ermite',g:'隠',cat:'humain',bio:[],dj:2,lv:14,vec:{2:.4,4:.3,0:.3},dt:'contondant',delay:3.0,wind:1.3,hp:1.4,dmg:1.2,arm:1.0,or:2,loot:3,livre:1,pat:['simple','crachat','lourd'],mats:[]},
  /* corrompus : là où la corruption est haute, et dans les biomes altérés */
  rodeur:{n:'Rôdeur',g:'影',cat:'corrompu',bio:['marcorr','cendres','montcris','foretmana'],corr:45,dj:1,lv:10,vec:null,dt:null,delay:2.9,wind:1.35,hp:1.0,dmg:1.0,arm:1.0,pack:[1,3],pat:['simple','double'],mats:['os','obsidienne','charbon']},
  eclat:{n:'Éclat',g:'晶',cat:'corrompu',bio:['montcris'],corr:30,lv:12,vec:{3:.5,4:.5},dt:'percant',delay:2.6,wind:1.1,hp:.9,dmg:1.2,arm:1.6,pack:[1,2],pat:['simple','crachat'],mats:['quartz','cristalmana']},
  sylve:{n:'Sylve',g:'樹',cat:'corrompu',bio:['foretmana','foret'],corr:35,lv:11,vec:{0:.8,4:.2},dt:'contondant',delay:3.2,wind:1.4,hp:1.4,dmg:.9,arm:.8,pat:['lourd','balayage'],mats:['ebene','ambre']},
  cendre:{n:'Cendre',g:'燼',cat:'corrompu',bio:['cendres'],corr:30,lv:11,vec:{1:.9,2:.1},dt:'tranchant',delay:2.4,wind:1.0,hp:.9,dmg:1.2,arm:.7,brule:1,pat:['crachat','simple','balayage'],mats:['cendre','charbon']},
  suaire:{n:'Suaire',g:'帷',cat:'corrompu',bio:['marcorr','marecage'],corr:50,dj:1,lv:13,vec:{4:.5,2:.5},dt:'percant',delay:2.8,wind:1.2,hp:1.1,dmg:1.0,arm:.9,affaiblit:1,pack:[1,2],pat:['simple','crachat','morsure'],mats:['os','ecaille']},
  /* la côte était le biome le plus vide : quatre espèces, dont trois de passage */
  crabe:{n:'Crabe des galets',g:'蟹',cat:'bete',bio:['cote'],lv:5,vec:{2:.5,4:.5},dt:'percant',delay:2.6,wind:1.1,hp:.7,dmg:.7,arm:1.8,tame:1,pack:[1,3],pat:['simple','morsure'],mats:['ecaille','coquillage']},
  goeland:{n:'Goéland pillard',g:'鴎',cat:'bete',bio:['cote'],lv:4,vec:{4:.5,3:.5},dt:'tranchant',delay:1.9,wind:.8,hp:.5,dmg:.6,arm:.2,fuit:1,tame:1,pack:[1,4],pat:['simple','double'],mats:['os']},
  phoque:{n:'Phoque gris',g:'鰭',cat:'bete',bio:['cote','toundra'],lv:7,vec:{4:1},dt:'contondant',delay:3.0,wind:1.3,hp:1.1,dmg:.7,arm:.7,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os']},
  naufrageur:{n:'Naufrageur',g:'難',cat:'humain',bio:['cote'],camp:1,lv:13,vec:{4:.5,1:.5},dt:'contondant',delay:2.7,wind:1.2,hp:1.2,dmg:1.2,arm:1.0,or:4,loot:2,pack:[1,3],pat:['simple','lourd','balayage'],mats:['cuir']},
  crabetour:{n:'Crabe-tour',g:'甲',cat:'bete',bio:['cote','marecage'],minp:3,lv:19,vec:{2:.6,4:.4},dt:'contondant',delay:3.6,wind:1.7,hp:1.8,dmg:1.4,arm:2.4,pat:['lourd','balayage','simple'],mats:['ecaille','coquillage','os']},
  /* toundra et marécage : deux prédateurs et deux guetteurs de plus */
  harfang:{n:'Harfang des neiges',g:'梟',cat:'bete',bio:['toundra','taiga'],lv:6,vec:{4:.6,3:.4},dt:'tranchant',delay:2.1,wind:.9,hp:.6,dmg:.8,arm:.3,nuit:2.5,tame:1,pat:['simple','double'],mats:['os','fourrure']},
  glouton:{n:'Glouton',g:'貂',cat:'bete',bio:['toundra','taiga'],lv:13,vec:{2:.5,4:.5},dt:'tranchant',delay:1.7,wind:.8,hp:.9,dmg:1.25,arm:.8,embuscade:1,tame:1,pat:['morsure','double','simple'],mats:['fourrure','os','cuir']},
  sangsues:{n:'Grappe de sangsues',g:'蛭',cat:'vermine',bio:['marecage','marcorr'],lv:6,vec:{4:.7,0:.3},dt:'percant',delay:1.3,wind:.6,hp:.5,dmg:.35,arm:0,nuee:1,venin:1,pat:['double','morsure'],mats:[]},
  heron:{n:'Héron cendré',g:'鷺',cat:'bete',bio:['marecage','cote'],lv:5,vec:{4:.6,3:.4},dt:'percant',delay:2.3,wind:1.0,hp:.6,dmg:.75,arm:.3,fuit:1,tame:1,pack:[1,2],pat:['simple','double'],mats:['os']},
  salamandre:{n:'Salamandre de braise',g:'蜥',cat:'bete',bio:['cendres'],minp:2,lv:15,vec:{1:.8,2:.2},dt:'tranchant',delay:2.5,wind:1.1,hp:.9,dmg:1.3,arm:.9,brule:1,tame:1,pat:['morsure','crachat','simple'],mats:['ecaille','soufre','cendre']},
  /* le haut du bestiaire : rien ne dépassait le loup blanc et l'ours polaire */
  mercenaire:{n:'Mercenaire franc',g:'傭',cat:'humain',bio:['plaine','montagne','cote'],camp:1,dj:1,minp:3,lv:20,vec:{3:.7,1:.3},dt:'tranchant',delay:2.5,wind:1.1,hp:1.5,dmg:1.4,arm:1.6,or:8,loot:3,pack:[1,2],pat:['simple','double','lourd'],mats:['cuir']},
  mammouth:{n:'Mammouth des glaces',g:'象',cat:'bete',bio:['toundra','montcris'],minp:4,lv:24,vec:{4:.6,2:.4},dt:'contondant',delay:3.8,wind:1.9,hp:2.4,dmg:2.0,arm:1.8,pat:['lourd','balayage','simple'],mats:['fourrure','cuir','os','laine']},
  colosse:{n:'Colosse d\'obsidienne',g:'巌',cat:'corrompu',bio:['cendres','montcris'],corr:60,dj:1,minp:4,lv:26,vec:{2:.5,3:.5},dt:'contondant',delay:3.6,wind:1.8,hp:2.2,dmg:1.9,arm:2.2,pat:['lourd','balayage'],mats:['obsidienne','basalte','onyx']},
  /* ================================================================
     LE HAUT DU BESTIAIRE (12.4 / E.16)
     Quarante-quatre especes, et DEUX au-dela du niveau vingt-six. Passe
     un certain point, on ne rencontrait plus rien de nouveau : les memes
     loups et les memes bandits, avec des points de vie multiplies par la
     puissance du lieu. Un monde qui ne montre plus rien de neuf cesse
     d'etre un monde et devient un compteur.
     Toutes portent un `minp` : elles ne sortent que la ou le lieu est
     assez dur pour elles. Un mammouth ne tombe pas sur un debutant dans
     une toundra tranquille — et un debutant qui en croise un sait qu'il
     s'est trompe de terre.
     ================================================================ */
  /* --- plaines et forets : ce que les vieilles terres gardent --- */
  auroch:{n:'Auroch noir',g:'牛',cat:'bete',bio:['plaine','taiga'],minp:3,lv:21,vec:{2:.7,0:.3},dt:'contondant',delay:3.6,wind:1.7,hp:2.0,dmg:1.6,arm:1.5,tame:1,pack:[1,2],pat:['lourd','simple','balayage'],mats:['cuir','os','fourrure']},
  cerfblanc:{n:'Grand cerf blanc',g:'鹿',cat:'bete',bio:['foret','foretmana'],minp:4,lv:28,vec:{0:.5,4:.5},dt:'percant',delay:3.0,wind:1.4,hp:1.9,dmg:1.8,arm:1.2,fuit:1,tame:1,pat:['lourd','double','simple'],mats:['cuir','os','ambre']},
  ourse:{n:'Ourse des ronces',g:'熊',cat:'bete',bio:['foret','marecage'],minp:4,lv:25,vec:{2:.6,0:.4},dt:'tranchant',delay:3.3,wind:1.6,hp:2.1,dmg:1.8,arm:1.5,tame:1,pat:['lourd','balayage','morsure'],mats:['fourrure','cuir','os']},
  meutemaudite:{n:'Meute maudite',g:'狼',cat:'corrompu',bio:['plaine','foret','taiga'],corr:45,minp:4,lv:23,vec:{3:.5,1:.5},dt:'tranchant',delay:1.7,wind:.9,hp:1.1,dmg:1.3,arm:.8,pack:[3,5],nuit:2.5,venin:1,pat:['morsure','double','simple'],mats:['cuir','os','onyx']},
  /* --- desert et cendres --- */
  scarabee:{n:'Scarabée de fer',g:'甲',cat:'bete',bio:['desert','cendres'],minp:3,lv:22,vec:{3:.8,2:.2},dt:'contondant',delay:3.4,wind:1.6,hp:1.6,dmg:1.4,arm:2.6,pat:['lourd','simple'],mats:['fer','ecaille','os']},
  vipereroi:{n:'Vipère-roi des sables',g:'蛇',cat:'bete',bio:['desert'],minp:4,lv:27,vec:{4:.5,1:.5},dt:'percant',delay:2.2,wind:.9,hp:1.4,dmg:1.9,arm:.9,venin:1,embuscade:1,pat:['morsure','crachat','double'],mats:['ecaille','os']},
  djinn:{n:'Djinn de poussière',g:'旋',cat:'corrompu',bio:['desert','cendres'],corr:40,minp:5,lv:31,vec:{0:.6,2:.4},dt:'tranchant',delay:2.0,wind:1.0,hp:1.5,dmg:2.0,arm:1.0,nuee:1,affaiblit:1,pat:['balayage','double','crachat'],mats:['sable','ambre','soufre']},
  forgeronmort:{n:'Forgeron calciné',g:'鍛',cat:'corrompu',bio:['cendres'],corr:55,dj:2,minp:5,lv:34,vec:{1:.6,3:.4},dt:'contondant',delay:3.2,wind:1.6,hp:2.0,dmg:2.1,arm:2.0,brule:1,pat:['lourd','simple','balayage'],mats:['fer','cendre','obsidienne']},
  /* --- toundra, taiga, montagnes --- */
  tigredesneiges:{n:'Tigre des neiges',g:'虎',cat:'bete',bio:['toundra','montcris','taiga'],minp:4,lv:26,vec:{4:.6,3:.4},dt:'tranchant',delay:1.9,wind:.9,hp:1.5,dmg:2.0,arm:1.1,embuscade:1,tame:1,pat:['double','morsure','simple'],mats:['fourrure','os','cuir']},
  troll:{n:'Troll des cimes',g:'鬼',cat:'corrompu',bio:['montagne','montcris'],corr:35,dj:1,minp:5,lv:32,vec:{2:.7,4:.3},dt:'contondant',delay:3.8,wind:2.0,hp:2.8,dmg:2.2,arm:1.9,pat:['lourd','balayage'],mats:['granitnoir','os','cuir']},
  aigleroyal:{n:'Aigle impérial',g:'鷲',cat:'bete',bio:['montagne','montcris'],minp:4,lv:24,vec:{3:.5,0:.5},dt:'tranchant',delay:1.7,wind:.8,hp:1.2,dmg:1.7,arm:.7,tame:1,pack:[1,2],pat:['double','simple'],mats:['os','argent']},
  golemgivre:{n:'Golem de givre',g:'氷',cat:'corrompu',bio:['toundra','montcris'],corr:45,minp:5,lv:33,vec:{4:.8,2:.2},dt:'contondant',delay:3.7,wind:1.9,hp:2.5,dmg:1.9,arm:2.4,pat:['lourd','balayage','crachat'],mats:['quartz','glace','argent']},
  /* --- marecages, cotes, terres corrompues --- */
  serpentmer:{n:'Serpent de mer',g:'龍',cat:'bete',bio:['cote','marecage'],minp:5,lv:29,vec:{4:.9,0:.1},dt:'percant',delay:3.0,wind:1.5,hp:2.2,dmg:1.9,arm:1.4,embuscade:1,pat:['morsure','lourd','balayage'],mats:['ecaille','coquillage','os']},
  noyeur:{n:'Noyeur',g:'溺',cat:'corrompu',bio:['marecage','marcorr','cote'],corr:50,minp:4,lv:27,vec:{4:.7,2:.3},dt:'contondant',delay:2.8,wind:1.3,hp:1.7,dmg:1.6,arm:1.2,affaiblit:1,pack:[1,3],nuit:2,pat:['simple','lourd','morsure'],mats:['os','osfossile']},
  hydre:{n:'Hydre des vases',g:'蛇',cat:'corrompu',bio:['marcorr'],corr:75,dj:2,minp:6,lv:38,vec:{4:.5,2:.5},dt:'percant',delay:2.4,wind:1.1,hp:2.6,dmg:2.2,arm:1.6,venin:1,pat:['morsure','double','balayage'],mats:['ecaille','onyx','osfossile']},
  /* --- ce qui ne vient qu'au fond, ou dans les terres mortes --- */
  veinevivante:{n:'Veine vivante',g:'脈',cat:'corrompu',bio:['montcris','cendres','marcorr'],corr:65,dj:2,minp:6,lv:36,vec:{3:.6,2:.4},dt:'tranchant',delay:2.6,wind:1.2,hp:2.1,dmg:2.3,arm:2.1,pat:['double','crachat','balayage'],mats:['cristalmana','amethyste','onyx']},
  archonte:{n:'Archonte des cendres',g:'王',cat:'corrompu',bio:['cendres','marcorr'],corr:85,dj:3,minp:7,lv:42,vec:null,dt:'tranchant',delay:2.8,wind:1.3,hp:3.0,dmg:2.6,arm:2.3,brule:1,affaiblit:1,rare:1,pat:['lourd','double','balayage','crachat'],mats:['obsidienne','onyx','cristalmana']},
  gardienpuits:{n:'Gardien du puits',g:'守',cat:'corrompu',bio:['montcris','cendres'],corr:70,dj:3,minp:7,lv:45,vec:{2:.4,3:.6},dt:'contondant',delay:4.0,wind:2.1,hp:3.4,dmg:2.8,arm:3.0,pat:['lourd','balayage'],mats:['adamant','granitnoir','cristalmana']},
  cauchemar:{n:'Cauchemar',g:'夢',cat:'corrompu',bio:['marcorr','cendres'],corr:70,dj:2,minp:5,lv:30,vec:null,dt:'percant',delay:2.6,wind:1.2,hp:1.8,dmg:1.9,arm:1.4,affaiblit:1,pack:[1,2],pat:['simple','double','crachat'],mats:['onyx','osfossile']},
};
const CK=Object.keys(CREATURE);
/* ==================================================================
   CE QU'ON A CROISÉ
   Les silhouettes ne se voyaient qu'en combat, le temps d'un échange.
   Le jeu retient donc ce qu'on a rencontré, abattu et apprivoisé : de
   quoi feuilleter le bestiaire au calme, savoir ce qui se dompte, et
   mesurer ce qu'on n'a pas encore vu. Trois compteurs par espèce, pas
   un octet de plus.
   ================================================================== */
function noteBestiaire(ck,quoi){
  if(!ck||!CREATURE[ck])return;
  S.bes=S.bes||{};
  const b=S.bes[ck]||(S.bes[ck]={v:0,t:0,a:0});
  b[quoi]=(b[quoi]||0)+1;
}
const bestiaireVus=()=>Object.keys(S.bes||{}).filter(k=>CREATURE[k]).length;
/* ==================================================================
   VOCABULAIRE D'ATTAQUE (5.1, « patterns télégraphiés et variés »)
   Une créature ne fait plus toujours le même geste : à chaque cycle
   elle choisit dans son répertoire, et le télégraphe l'annonce par
   son glyphe. Le joueur lit le geste et décide quoi en faire.
   wm : longueur du télégraphe · dm : dégâts · hits : nombre de coups
   win : ce que la fenêtre de parade devient · aoe : touche l'escorte
   dist : à distance — tenir l'écart n'y change rien et rien ne se pare
   ================================================================== */
const PATTERN={
  simple:  {n:'coup',g:'一',wm:1,   dm:1,   hits:1},
  double:  {n:'enchaînement',g:'二',wm:.62,dm:.58,hits:2},
  lourd:   {n:'charge',g:'重',wm:1.9,dm:2.0,hits:1,win:1.7},
  balayage:{n:'balayage',g:'薙',wm:1.3,dm:.85,hits:1,aoe:1},
  morsure: {n:'morsure',g:'咬',wm:.85,dm:1.15,hits:1,st:'saignement'},
  crachat: {n:'crachat',g:'吐',wm:1.35,dm:.95,hits:1,dist:1},
};
const patOf=e=>PATTERN[e&&e.pat]||PATTERN.simple;
/* thèmes de donjon (E.29) : ils choisissent le peuplement et le nom */
const DJTHEME={
  ruine:{n:'Ruine',noms:['Ruine effondrée','Portail muré','Tour écroulée','Bastion oublié'],pop:{ermite:4,bandit:3,deserteur:2,rodeur:2,loup:1,mercenaire:2}},
  crypte:{n:'Crypte',noms:['Crypte','Sépulcre','Ossuaire','Caveau scellé'],pop:{suaire:4,rodeur:3,deserteur:1,serpent:1,moustiques:1,sangsues:2,cauchemar:1}},
  mine:{n:'Mine',noms:['Mine noyée','Puits ancien','Galerie morte','Veine muette'],pop:{eclat:3,scorpion:2,serpent:2,bandit:2,rodeur:1,colosse:1}},
  repaire:{n:'Repaire',noms:['Gouffre','Tanière','Faille','Antre'],pop:{oursbrun:3,loup:3,lynx:2,chef:1,loupblanc:1,crocodile:1,glouton:2,crabetour:1}},
};
/* pool de spawn pour une cellule : biome, heure, corruption, donjon ou camp */
function creaturePool(c,inDj,night,power){
  const pool=[];
  const th=inDj&&c.dj&&c.dj.theme?DJTHEME[c.dj.theme]:null;
  CK.forEach(k=>{const C=CREATURE[k];let w=0;
    /* Une porte de puissance. Le niveau affiché d'une créature n'a jamais
       rien décidé : la difficulté vient de la puissance du lieu, qui
       multiplie ses PV et ses dégâts. Sans garde-fou, un mammouth pouvait
       donc tomber sur un débutant dans une toundra tranquille. */
    if(C.minp&&power!==undefined&&power<C.minp)return;
    if(inDj){if(th&&th.pop[k])w=th.pop[k];else if(C.dj)w=C.dj;else if(C.cat==='bete'&&['oursbrun','loup','loupblanc','serpent','scorpion'].includes(k))w=.5;}
    else{
      if(C.bio.includes(c.b))w=2;
      if(c.poi==='camp'&&C.camp)w+=3;
      if(C.corr&&c.corr<C.corr)w=0;
      if(C.corr&&c.corr>=C.corr)w+=1+Math.floor((c.corr-C.corr)/20);
      if(night&&C.nuit)w*=C.nuit;
      if(night&&C.fuit)w*=.4;
    }
    if(w>0)pool.push([k,w]);});
  if(!pool.length)return 'rodeur';
  const tot=pool.reduce((a,p)=>a+p[1],0);let r=Math.random()*tot;
  for(const [k,w] of pool){r-=w;if(r<=0)return k;}
  return pool[0][0];
}
const BEASTN=['Loup','Ourse','Rapace','Sanglier','Lynx','Corbeau','Cerf','Serpent'];
