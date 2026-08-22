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
  loup:{n:'Loup',g:'狼',cat:'bete',bio:['plaine','foret','taiga','steppe'],lv:6,vec:{0:.6,3:.4},dt:'tranchant',delay:2.0,wind:1.0,hp:.8,dmg:.85,arm:.6,pack:[1,4],nuit:2,tame:1,pat:['simple','morsure','double','saut'],mats:['cuir','os','fourrure']},
  sanglier:{n:'Sanglier',g:'猪',cat:'bete',bio:['plaine','foret','steppe'],lv:8,vec:{2:.7,0:.3},dt:'contondant',delay:2.8,wind:1.3,hp:1.15,dmg:1.1,arm:1.1,tame:1,pat:['simple','lourd','ruade'],mats:['cuir','os']},
  cerf:{n:'Cerf',g:'鹿',cat:'bete',bio:['plaine','foret','taiga','foretmana','steppe'],lv:3,vec:{0:1},dt:'contondant',delay:3.2,wind:1.2,hp:.7,dmg:.6,arm:.4,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os']},
  renard:{n:'Renard',g:'狐',cat:'bete',bio:['plaine','foret','foretmana','steppe'],lv:3,vec:{1:.6,0:.4},dt:'percant',delay:1.8,wind:.9,hp:.55,dmg:.6,arm:.3,fuit:1,tame:1,pack:[1,2],pat:['simple','double'],mats:['fourrure']},
  abeilles:{n:'Essaim d\'abeilles',g:'蜂',cat:'vermine',bio:['plaine','foret','foretmana','jungle','oasis'],lv:4,vec:{0:.5,1:.5},dt:'percant',delay:1.4,wind:.6,hp:.55,dmg:.3,arm:0,nuee:1,pat:['double','balayage','triple'],mats:['ambre']},
  chauvesouris:{n:'Nuée de chauves-souris',g:'蝠',cat:'vermine',bio:['karst','marecage'],lv:5,vec:{4:.5,0:.5},dt:'percant',delay:1.3,wind:.6,hp:.5,dmg:.32,arm:0,nuee:1,nuit:2.5,pack:[1,3],pat:['double','balayage','harcele'],mats:['guano','os']},
  /* désert */
  scorpion:{n:'Scorpion',g:'蠍',cat:'bete',bio:['desert','cendres','badlands','salines'],lv:7,vec:{2:.6,1:.4},dt:'percant',delay:2.4,wind:1.0,hp:.8,dmg:.9,arm:1.3,venin:1,tame:1,pat:['simple','morsure','venimeux'],mats:['ecaille','os']},
  vautour:{n:'Vautour',g:'鷲',cat:'bete',bio:['desert','montagne','cendres','badlands','salines'],lv:5,vec:{4:.4,3:.6},dt:'tranchant',delay:2.2,wind:.9,hp:.65,dmg:.75,arm:.3,tame:1,pack:[1,3],pat:['simple','double','harcele'],mats:['os']},
  chameau:{n:'Chameau sauvage',g:'駝',cat:'bete',bio:['desert','oasis'],lv:6,vec:{2:1},dt:'contondant',delay:3.0,wind:1.3,hp:1.2,dmg:.7,arm:.6,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','laine']},
  /* toundra et taïga */
  ourspolaire:{n:'Ours polaire',g:'熊',cat:'bete',bio:['toundra','montcris','banquise'],lv:18,vec:{4:.7,2:.3},dt:'tranchant',delay:3.4,wind:1.6,hp:1.8,dmg:1.6,arm:1.4,tame:1,pat:['simple','lourd','balayage','ruade'],mats:['fourrure','cuir','os']},
  loupblanc:{n:'Loup blanc',g:'狼',cat:'bete',bio:['toundra','taiga','banquise'],lv:8,vec:{4:.6,3:.4},dt:'tranchant',delay:1.9,wind:1.0,hp:.85,dmg:.9,arm:.6,pack:[1,3],nuit:2,tame:1,pat:['simple','morsure','double'],mats:['fourrure','os']},
  renne:{n:'Renne',g:'鹿',cat:'bete',bio:['toundra','taiga'],lv:4,vec:{0:.6,4:.4},dt:'contondant',delay:3.0,wind:1.2,hp:.8,dmg:.6,arm:.5,fuit:1,tame:1,pack:[1,3],pat:['simple','lourd','ruade'],mats:['cuir','os','laine']},
  morse:{n:'Morse',g:'海',cat:'bete',bio:['cote','toundra','banquise'],lv:12,vec:{4:1},dt:'percant',delay:3.6,wind:1.5,hp:1.6,dmg:1.1,arm:1.2,tame:1,pat:['simple','lourd'],mats:['cuir','os']},
  /* marécage */
  crocodile:{n:'Crocodile',g:'鰐',cat:'bete',bio:['marecage','marcorr','cote','jungle','oasis'],lv:14,vec:{4:.6,2:.4},dt:'percant',delay:3.2,wind:1.4,hp:1.5,dmg:1.4,arm:1.5,embuscade:1,tame:1,pat:['morsure','lourd','etreinte','queue'],mats:['ecaille','cuir']},
  moustiques:{n:'Nuée de moustiques',g:'蚊',cat:'vermine',bio:['marecage','marcorr','jungle'],lv:4,vec:{4:.6,0:.4},dt:'percant',delay:1.2,wind:.55,hp:.45,dmg:.28,arm:0,nuee:1,pat:['double','balayage','triple','harcele'],mats:[]},
  serpent:{n:'Serpent venimeux',g:'蛇',cat:'bete',bio:['marecage','foret','desert','marcorr','cendres','foretmana','jungle','badlands','karst','oasis'],lv:8,vec:{4:.5,0:.5},dt:'percant',delay:2.6,wind:.8,hp:.7,dmg:.8,arm:.5,venin:1,tame:1,pat:['morsure','simple','venimeux','etreinte'],mats:['ecaille']},
  /* montagne */
  aigle:{n:'Aigle',g:'鷲',cat:'bete',bio:['montagne','montcris','steppe','oasis'],lv:7,vec:{3:.5,0:.5},dt:'tranchant',delay:2.0,wind:.9,hp:.7,dmg:.9,arm:.3,tame:1,pack:[1,2],pat:['simple','double','saut','harcele'],mats:['os']},
  oursbrun:{n:'Ours brun',g:'熊',cat:'bete',bio:['montagne','foret','taiga','karst'],lv:16,vec:{2:.6,0:.4},dt:'contondant',delay:3.4,wind:1.6,hp:1.7,dmg:1.5,arm:1.3,tame:1,pat:['simple','lourd','balayage'],mats:['fourrure','cuir','os']},
  bouquetin:{n:'Bouquetin',g:'羊',cat:'bete',bio:['montagne','montcris'],lv:4,vec:{2:.7,3:.3},dt:'contondant',delay:2.8,wind:1.2,hp:.75,dmg:.7,arm:.6,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os','laine']},
  lynx:{n:'Lynx',g:'猫',cat:'bete',bio:['montagne','foret','taiga','montcris','foretmana','jungle','karst'],lv:9,vec:{3:.5,0:.5},dt:'tranchant',delay:1.8,wind:.8,hp:.8,dmg:1.0,arm:.5,embuscade:1,tame:1,pat:['double','morsure','saut'],mats:['fourrure','os']},
  /* humains hostiles — ils portent une bourse et parfois du butin */
  bandit:{n:'Bandit',g:'賊',cat:'humain',bio:['plaine','foret','desert','cote','taiga','steppe','badlands','salines','oasis','ruines'],dj:1,camp:1,lv:10,vec:{3:.5,1:.5},dt:'tranchant',delay:2.6,wind:1.2,hp:1.0,dmg:1.0,arm:.9,or:3,loot:2,pack:[1,3],pat:['simple','double','lourd'],mats:['cuir']},
  chef:{n:'Chef de bande',g:'首',cat:'humain',bio:[],camp:1,lv:16,vec:{1:.5,3:.5},dt:'tranchant',delay:2.8,wind:1.2,hp:1.5,dmg:1.3,arm:1.2,or:6,loot:3,pat:['simple','lourd','balayage'],mats:['cuir']},
  braconnier:{n:'Braconnier',g:'猟',cat:'humain',bio:['foret','taiga','marecage','jungle'],lv:8,vec:{0:.6,3:.4},dt:'percant',delay:2.4,wind:1.0,hp:.9,dmg:.95,arm:.7,or:2,loot:2,pack:[1,2],pat:['simple','double','crachat'],mats:['cuir','fourrure']},
  pillard:{n:'Pillard',g:'襲',cat:'humain',bio:['plaine','desert','cote','steppe','badlands'],camp:1,lv:12,vec:{1:.6,3:.4},dt:'contondant',delay:2.7,wind:1.2,hp:1.2,dmg:1.15,arm:1.0,or:4,loot:2,pack:[1,3],pat:['simple','lourd','balayage'],mats:['cuir']},
  deserteur:{n:'Déserteur',g:'逃',cat:'humain',bio:['montagne','toundra','foret','badlands','ruines'],dj:1,lv:11,vec:{3:.7,2:.3},dt:'tranchant',delay:2.6,wind:1.1,hp:1.1,dmg:1.05,arm:1.2,or:3,loot:2,pack:[1,2],pat:['simple','double','lourd'],mats:['cuir']},
  ermite:{n:'Ermite',g:'隠',cat:'humain',bio:['karst','ruines'],dj:2,lv:14,vec:{2:.4,4:.3,0:.3},dt:'contondant',delay:3.0,wind:1.3,hp:1.4,dmg:1.2,arm:1.0,or:2,loot:3,livre:1,pat:['simple','crachat','lourd'],mats:[]},
  /* corrompus : là où la corruption est haute, et dans les biomes altérés */
  rodeur:{n:'Rôdeur',g:'影',cat:'corrompu',bio:['marcorr','cendres','montcris','foretmana','karst','ruines'],corr:45,dj:1,lv:10,vec:null,dt:null,delay:2.9,wind:1.35,hp:1.0,dmg:1.0,arm:1.0,pack:[1,3],pat:['simple','double'],mats:['os','obsidienne','charbon']},
  eclat:{n:'Éclat',g:'晶',cat:'corrompu',bio:['montcris','karst'],corr:30,lv:12,vec:{3:.5,4:.5},dt:'percant',delay:2.6,wind:1.1,hp:.9,dmg:1.2,arm:1.6,pack:[1,2],pat:['simple','crachat'],mats:['quartz','cristalmana']},
  sylve:{n:'Sylve',g:'樹',cat:'corrompu',bio:['foretmana','foret'],corr:35,lv:11,vec:{0:.8,4:.2},dt:'contondant',delay:3.2,wind:1.4,hp:1.4,dmg:.9,arm:.8,pat:['lourd','balayage'],mats:['ebene','ambre']},
  cendre:{n:'Cendre',g:'燼',cat:'corrompu',bio:['cendres','ruines'],corr:30,lv:11,vec:{1:.9,2:.1},dt:'tranchant',delay:2.4,wind:1.0,hp:.9,dmg:1.2,arm:.7,brule:1,pat:['souffle','simple','balayage'],mats:['cendre','charbon']},
  suaire:{n:'Suaire',g:'帷',cat:'corrompu',bio:['marcorr','marecage','ruines'],corr:50,dj:1,lv:13,vec:{4:.5,2:.5},dt:'percant',delay:2.8,wind:1.2,hp:1.1,dmg:1.0,arm:.9,affaiblit:1,pack:[1,2],pat:['simple','crachat','morsure'],mats:['os','ecaille']},
  /* la côte était le biome le plus vide : quatre espèces, dont trois de passage */
  crabe:{n:'Crabe des galets',g:'蟹',cat:'bete',bio:['cote','salines'],lv:5,vec:{2:.5,4:.5},dt:'percant',delay:2.6,wind:1.1,hp:.7,dmg:.7,arm:1.8,tame:1,pack:[1,3],pat:['simple','morsure'],mats:['ecaille','coquillage']},
  goeland:{n:'Goéland pillard',g:'鴎',cat:'bete',bio:['cote','salines'],lv:4,vec:{4:.5,3:.5},dt:'tranchant',delay:1.9,wind:.8,hp:.5,dmg:.6,arm:.2,fuit:1,tame:1,pack:[1,4],pat:['simple','double'],mats:['os']},
  phoque:{n:'Phoque gris',g:'鰭',cat:'bete',bio:['cote','toundra','banquise'],lv:7,vec:{4:1},dt:'contondant',delay:3.0,wind:1.3,hp:1.1,dmg:.7,arm:.7,fuit:1,tame:1,pack:[1,2],pat:['simple','lourd'],mats:['cuir','os']},
  naufrageur:{n:'Naufrageur',g:'難',cat:'humain',bio:['cote','salines'],camp:1,lv:13,vec:{4:.5,1:.5},dt:'contondant',delay:2.7,wind:1.2,hp:1.2,dmg:1.2,arm:1.0,or:4,loot:2,pack:[1,3],pat:['simple','lourd','balayage'],mats:['cuir']},
  crabetour:{n:'Crabe-tour',g:'甲',cat:'bete',bio:['cote','marecage'],minp:3,lv:19,vec:{2:.6,4:.4},dt:'contondant',delay:3.6,wind:1.7,hp:1.8,dmg:1.4,arm:2.4,pat:['lourd','balayage','simple','etreinte','queue'],mats:['ecaille','coquillage','os']},
  /* toundra et marécage : deux prédateurs et deux guetteurs de plus */
  harfang:{n:'Harfang des neiges',g:'梟',cat:'bete',bio:['toundra','taiga','banquise'],lv:6,vec:{4:.6,3:.4},dt:'tranchant',delay:2.1,wind:.9,hp:.6,dmg:.8,arm:.3,nuit:2.5,tame:1,pat:['simple','double'],mats:['os','fourrure']},
  glouton:{n:'Glouton',g:'貂',cat:'bete',bio:['toundra','taiga'],lv:13,vec:{2:.5,4:.5},dt:'tranchant',delay:1.7,wind:.8,hp:.9,dmg:1.25,arm:.8,embuscade:1,tame:1,pat:['morsure','double','simple'],mats:['fourrure','os','cuir']},
  sangsues:{n:'Grappe de sangsues',g:'蛭',cat:'vermine',bio:['marecage','marcorr','jungle'],lv:6,vec:{4:.7,0:.3},dt:'percant',delay:1.3,wind:.6,hp:.5,dmg:.35,arm:0,nuee:1,venin:1,pack:[1,3],pat:['double','morsure','triple','venimeux'],mats:[]},
  heron:{n:'Héron cendré',g:'鷺',cat:'bete',bio:['marecage','cote','oasis'],lv:5,vec:{4:.6,3:.4},dt:'percant',delay:2.3,wind:1.0,hp:.6,dmg:.75,arm:.3,fuit:1,tame:1,pack:[1,2],pat:['simple','double'],mats:['os']},
  salamandre:{n:'Salamandre de braise',g:'蜥',cat:'bete',bio:['cendres'],minp:2,lv:15,vec:{1:.8,2:.2},dt:'tranchant',delay:2.5,wind:1.1,hp:.9,dmg:1.3,arm:.9,brule:1,tame:1,pat:['morsure','crachat','simple','souffle','queue'],mats:['ecaille','soufre','cendre']},
  /* le haut du bestiaire : rien ne dépassait le loup blanc et l'ours polaire */
  mercenaire:{n:'Mercenaire franc',g:'傭',cat:'humain',bio:['plaine','montagne','cote','steppe','ruines'],camp:1,dj:1,minp:3,lv:20,vec:{3:.7,1:.3},dt:'tranchant',delay:2.5,wind:1.1,hp:1.5,dmg:1.4,arm:1.6,or:8,loot:3,pack:[1,2],pat:['simple','double','lourd'],mats:['cuir']},
  mammouth:{n:'Mammouth des glaces',g:'象',cat:'bete',bio:['toundra','montcris','banquise'],minp:4,lv:24,vec:{4:.6,2:.4},dt:'contondant',delay:3.8,wind:1.9,hp:2.4,dmg:2.0,arm:1.8,pat:['lourd','balayage','simple','ruade','queue'],mats:['fourrure','cuir','os','laine']},
  colosse:{n:'Colosse d\'obsidienne',g:'巌',cat:'corrompu',bio:['cendres','montcris','ruines'],corr:60,dj:1,minp:4,lv:26,vec:{2:.5,3:.5},dt:'contondant',delay:3.6,wind:1.8,hp:2.2,dmg:1.9,arm:2.2,pat:['lourd','balayage'],mats:['obsidienne','basalte','onyx']},
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
  auroch:{n:'Auroch noir',g:'牛',cat:'bete',bio:['plaine','taiga','steppe'],minp:3,lv:21,vec:{2:.7,0:.3},dt:'contondant',delay:3.6,wind:1.7,hp:2.0,dmg:1.6,arm:1.5,tame:1,pack:[1,2],pat:['lourd','simple','balayage','ruade'],mats:['cuir','os','fourrure']},
  cerfblanc:{n:'Grand cerf blanc',g:'鹿',cat:'bete',bio:['foret','foretmana'],minp:4,lv:28,vec:{0:.5,4:.5},dt:'percant',delay:3.0,wind:1.4,hp:1.9,dmg:1.8,arm:1.2,fuit:1,tame:1,pat:['lourd','double','simple'],mats:['cuir','os','ambre']},
  ourse:{n:'Ourse des ronces',g:'熊',cat:'bete',bio:['foret','marecage','jungle'],minp:4,lv:25,vec:{2:.6,0:.4},dt:'tranchant',delay:3.3,wind:1.6,hp:2.1,dmg:1.8,arm:1.5,tame:1,pat:['lourd','balayage','morsure','etreinte'],mats:['fourrure','cuir','os']},
  meutemaudite:{n:'Meute maudite',g:'狼',cat:'corrompu',bio:['plaine','foret','taiga','steppe'],corr:45,minp:4,lv:23,vec:{3:.5,1:.5},dt:'tranchant',delay:1.7,wind:.9,hp:1.1,dmg:1.3,arm:.8,pack:[3,5],nuit:2.5,venin:1,pat:['morsure','double','simple','saut'],mats:['cuir','os','onyx']},
  /* --- desert et cendres --- */
  scarabee:{n:'Scarabée de fer',g:'甲',cat:'bete',bio:['desert','cendres','jungle','badlands','karst'],minp:3,lv:22,vec:{3:.8,2:.2},dt:'contondant',delay:3.4,wind:1.6,hp:1.6,dmg:1.4,arm:2.6,pat:['lourd','simple','queue'],mats:['fer','ecaille','os']},
  vipereroi:{n:'Vipère-roi des sables',g:'蛇',cat:'bete',bio:['desert','jungle','badlands','oasis'],minp:4,lv:27,vec:{4:.5,1:.5},dt:'percant',delay:2.2,wind:.9,hp:1.4,dmg:1.9,arm:.9,venin:1,embuscade:1,pat:['morsure','crachat','double','venimeux'],mats:['ecaille','os']},
  djinn:{n:'Djinn de poussière',g:'旋',cat:'corrompu',bio:['desert','cendres','badlands','salines'],corr:40,minp:5,lv:31,vec:{0:.6,2:.4},dt:'tranchant',delay:2.0,wind:1.0,hp:1.5,dmg:2.0,arm:1.0,nuee:1,affaiblit:1,pat:['balayage','double','crachat','harcele'],mats:['sable','ambre','soufre']},
  forgeronmort:{n:'Forgeron calciné',g:'鍛',cat:'corrompu',bio:['cendres','ruines'],corr:55,dj:2,minp:5,lv:34,vec:{1:.6,3:.4},dt:'contondant',delay:3.2,wind:1.6,hp:2.0,dmg:2.1,arm:2.0,brule:1,pat:['lourd','simple','balayage','souffle'],mats:['fer','cendre','obsidienne']},
  /* --- toundra, taiga, montagnes --- */
  tigredesneiges:{n:'Tigre des neiges',g:'虎',cat:'bete',bio:['toundra','montcris','taiga','banquise'],minp:4,lv:26,vec:{4:.6,3:.4},dt:'tranchant',delay:1.9,wind:.9,hp:1.5,dmg:2.0,arm:1.1,embuscade:1,tame:1,pat:['double','morsure','simple','saut'],mats:['fourrure','os','cuir']},
  troll:{n:'Troll des cimes',g:'鬼',cat:'corrompu',bio:['montagne','montcris','karst'],corr:35,dj:1,minp:5,lv:32,vec:{2:.7,4:.3},dt:'contondant',delay:3.8,wind:2.0,hp:2.8,dmg:2.2,arm:1.9,pat:['lourd','balayage','ruade'],mats:['granitnoir','os','cuir']},
  aigleroyal:{n:'Aigle impérial',g:'鷲',cat:'bete',bio:['montagne','montcris'],minp:4,lv:24,vec:{3:.5,0:.5},dt:'tranchant',delay:1.7,wind:.8,hp:1.2,dmg:1.7,arm:.7,tame:1,pack:[1,2],pat:['double','simple','saut','harcele'],mats:['os','argent']},
  golemgivre:{n:'Golem de givre',g:'氷',cat:'corrompu',bio:['toundra','montcris','banquise'],corr:45,minp:5,lv:33,vec:{4:.8,2:.2},dt:'contondant',delay:3.7,wind:1.9,hp:2.5,dmg:1.9,arm:2.4,pat:['lourd','balayage','crachat','queue'],mats:['quartz','glace','argent']},
  /* --- marecages, cotes, terres corrompues --- */
  serpentmer:{n:'Serpent de mer',g:'龍',cat:'bete',bio:['cote','marecage','salines'],minp:5,lv:29,vec:{4:.9,0:.1},dt:'percant',delay:3.0,wind:1.5,hp:2.2,dmg:1.9,arm:1.4,embuscade:1,pat:['morsure','lourd','balayage','etreinte','queue'],mats:['ecaille','coquillage','os']},
  noyeur:{n:'Noyeur',g:'溺',cat:'corrompu',bio:['marecage','marcorr','cote'],corr:50,minp:4,lv:27,vec:{4:.7,2:.3},dt:'contondant',delay:2.8,wind:1.3,hp:1.7,dmg:1.6,arm:1.2,affaiblit:1,pack:[1,3],nuit:2,pat:['simple','lourd','morsure','etreinte'],mats:['os','osfossile']},
  hydre:{n:'Hydre des vases',g:'蛇',cat:'corrompu',bio:['marcorr'],corr:75,dj:2,minp:6,lv:38,vec:{4:.5,2:.5},dt:'percant',delay:2.4,wind:1.1,hp:2.6,dmg:2.2,arm:1.6,venin:1,pat:['morsure','double','balayage','venimeux','triple'],mats:['ecaille','onyx','osfossile']},
  /* --- ce qui ne vient qu'au fond, ou dans les terres mortes --- */
  veinevivante:{n:'Veine vivante',g:'脈',cat:'corrompu',bio:['montcris','cendres','marcorr'],corr:65,dj:2,minp:6,lv:36,vec:{3:.6,2:.4},dt:'tranchant',delay:2.6,wind:1.2,hp:2.1,dmg:2.3,arm:2.1,pat:['double','crachat','balayage','harcele'],mats:['cristalmana','amethyste','onyx']},
  archonte:{n:'Archonte des cendres',g:'王',cat:'corrompu',bio:['cendres','marcorr','ruines'],corr:85,dj:3,minp:7,lv:42,vec:null,dt:'tranchant',delay:2.8,wind:1.3,hp:3.0,dmg:2.6,arm:2.3,brule:1,affaiblit:1,rare:1,pat:['lourd','double','balayage','crachat'],mats:['obsidienne','onyx','cristalmana']},
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
  simple:  {n:'coup',g:'一',wm:1,   dm:1,   hits:1,dir:'haut'},
  double:  {n:'enchaînement',g:'二',wm:.62,dm:.58,hits:2,dir:'cote'},
  lourd:   {n:'charge',g:'重',wm:1.9,dm:2.0,hits:1,win:1.7,dir:'haut'},
  balayage:{n:'balayage',g:'薙',wm:1.3,dm:.85,hits:1,aoe:1,dir:'cote'},
  morsure: {n:'morsure',g:'咬',wm:.85,dm:1.15,hits:1,st:'saignement',dir:'bas'},
  crachat: {n:'crachat',g:'吐',wm:1.35,dm:.95,hits:1,dist:1},
  /* ==================================================================
     SIX GESTES POUR SOIXANTE-TROIS CREATURES.
     C'est la table la plus maigre du jeu, et c'est celle que le joueur LIT
     a chaque seconde de combat : le telegraphe est tout ce qu'il a pour
     decider s'il pare, s'il recule ou s'il frappe. Six gestes, cela veut
     dire qu'un ours polaire et un bandit se lisent pareil.

     Huit de plus, et pas un champ nouveau : le moteur sait deja tout faire
     — plusieurs coups, un balayage, une portee, un statut, une fenetre de
     parade plus ou moins large. Ce qui manquait n'etait pas de la
     mecanique, c'etait des COMBINAISONS, et chacune se lit differemment.
     ================================================================== */
  triple:  {n:'rafale',g:'三',wm:.5, dm:.40,hits:3,dir:'cote'},
  saut:    {n:'bond',g:'跳',wm:1.45,dm:1.35,hits:1,win:.8,st:'etourdi',dir:'haut'},
  venimeux:{n:'crocs venimeux',g:'毒',wm:.95,dm:.95,hits:1,st:'poison',dir:'bas'},
  souffle: {n:'souffle',g:'息',wm:1.7,dm:1.05,hits:1,aoe:1,dist:1,st:'brulure'},
  etreinte:{n:'étreinte',g:'絡',wm:1.25,dm:1.05,hits:1,st:'enracine',dir:'bas'},
  ruade:   {n:'ruade',g:'蹴',wm:1.05,dm:1.30,hits:1,win:1.3,st:'etourdi',dir:'bas'},
  queue:   {n:'coup de queue',g:'尾',wm:1.2,dm:1.00,hits:1,aoe:1,dir:'cote'},
  harcele: {n:'harcèlement',g:'翔',wm:.55,dm:.58,hits:2,dist:1},
};
const patOf=e=>PATTERN[e&&e.pat]||PATTERN.simple;
/* thèmes de donjon (E.29) : ils choisissent le peuplement et le nom */
const DJTHEME={
  ruine:{n:'Ruine',noms:['Ruine effondrée','Portail muré','Tour écroulée','Bastion oublié'],pop:{ermite:4,bandit:3,deserteur:2,rodeur:2,loup:1,mercenaire:2}},
  crypte:{n:'Crypte',noms:['Crypte','Sépulcre','Ossuaire','Caveau scellé'],pop:{suaire:4,rodeur:3,deserteur:1,serpent:1,moustiques:1,sangsues:2,cauchemar:1}},
  mine:{n:'Mine',noms:['Mine noyée','Puits ancien','Galerie morte','Veine muette'],pop:{eclat:3,scorpion:2,serpent:2,bandit:2,rodeur:1,colosse:1}},
  repaire:{n:'Repaire',noms:['Gouffre','Tanière','Faille','Antre'],pop:{oursbrun:3,loup:3,lynx:2,chef:1,loupblanc:1,crocodile:1,glouton:2,crabetour:1}},
  /* ==================================================================
     QUATRE THEMES DE DONJON, DONC QUATRE GARDIENS ET QUATRE PIECES
     NOMMEES. Un donjon majeur se descend en six etages ; au troisieme on
     a vu tout ce que le theme sait montrer, et l'on connait deja le
     gardien qui attend. Trois de plus : ce n'est pas le nombre de salles
     qui fait un donjon, c'est de ne pas savoir ce qu'il y a derriere.
     ================================================================== */
  temple:{n:'Temple noyé',noms:['Temple noyé','Sanctuaire submergé','Nef basse','Cloître inondé'],
    pop:{sangsues:3,crocodile:2,suaire:2,moustiques:2,serpent:1,heron:1,sylve:1}},
  fonderie:{n:'Fonderie morte',noms:['Fonderie morte','Grands Fourneaux','Halle des scories','Cheminée froide'],
    pop:{cendre:4,eclat:2,salamandre:2,deserteur:2,bandit:1,colosse:1}},
  nid:{n:'Nid',noms:['Nid','Aire haute','Perchoir','Rocher creux']
    ,pop:{aigle:3,harfang:2,chauvesouris:3,vautour:2,abeilles:2,lynx:1,crabetour:1}},
};
/* ==================================================================
   LA FAUNE SUIT L'ANNEE (E.28 / 12)
   Les saisons modulaient la pousse des cultures et la temperature, et
   rien d'autre. Une toundra en plein ete peuplait exactement comme en
   hiver, et un ours n'avait jamais dormi.

   Trois regles, pas une de plus, et toutes tirees de ce que les betes
   font vraiment :
     — les grosses betes a fourrure HIBERNENT : on ne les croise plus en
       hiver, et elles reviennent au printemps affamees ;
     — les insectes et la vermine DISPARAISSENT au froid, et pullulent
       en ete ;
     — le gibier de passage MIGRE : plus nombreux au printemps et a
       l'automne, quand il traverse.
   Consequence de jeu : une meme case ne se chasse pas de la meme facon
   selon le mois, et l'hiver d'une toundra devient un endroit vide et
   dur — ce qu'il doit etre.
   ================================================================== */
const HIBERNE=['oursbrun','ourspolaire','ourse','sanglier','serpent','crocodile','vipereroi','scarabee','salamandre'];
const VERMINE_CHAUD=['abeilles','moustiques','sangsues','scorpion'];
const MIGRE=['cerf','renne','oie','heron','goeland','vautour','cerfblanc','aigle','harfang'];
/* le multiplicateur de presence d'une espece a la saison courante */
function saisonMul(k,si){
  const s=si===undefined?seasonIdx():si;
  const C=CREATURE[k];
  if(!C)return 1;
  let m=1;
  /* hiver : les dormeuses se font rares, sans disparaitre */
  if(HIBERNE.includes(k))m*=s===3?.35:s===0?1.2:1;
  /* la vermine vit de chaleur */
  if(VERMINE_CHAUD.includes(k)||C.cat==='vermine')m*=[1,1.4,.9,.5][s];
  /* le passage : printemps et automne */
  if(MIGRE.includes(k))m*=[1.35,.9,1.35,.85][s];
  return m;
}
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
      /* et l'annee pese autant que l'heure */
      w*=saisonMul(k);
    }
    if(w>0)pool.push([k,w]);});
  if(!pool.length)return 'rodeur';
  const tot=pool.reduce((a,p)=>a+p[1],0);let r=Math.random()*tot;
  for(const [k,w] of pool){r-=w;if(r<=0)return k;}
  return pool[0][0];
}
const BEASTN=['Loup','Ourse','Rapace','Sanglier','Lynx','Corbeau','Cerf','Serpent'];
