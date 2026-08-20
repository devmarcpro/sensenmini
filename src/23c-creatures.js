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
};
const CK=Object.keys(CREATURE);
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
  ruine:{n:'Ruine',noms:['Ruine effondrée','Portail muré','Tour écroulée','Bastion oublié'],pop:{ermite:4,bandit:3,deserteur:2,rodeur:2,loup:1}},
  crypte:{n:'Crypte',noms:['Crypte','Sépulcre','Ossuaire','Caveau scellé'],pop:{suaire:4,rodeur:3,deserteur:1,serpent:1,moustiques:1}},
  mine:{n:'Mine',noms:['Mine noyée','Puits ancien','Galerie morte','Veine muette'],pop:{eclat:3,scorpion:2,serpent:2,bandit:2,rodeur:1}},
  repaire:{n:'Repaire',noms:['Gouffre','Tanière','Faille','Antre'],pop:{oursbrun:3,loup:3,lynx:2,chef:1,loupblanc:1,crocodile:1}},
};
/* pool de spawn pour une cellule : biome, heure, corruption, donjon ou camp */
function creaturePool(c,inDj,night){
  const pool=[];
  const th=inDj&&c.dj&&c.dj.theme?DJTHEME[c.dj.theme]:null;
  CK.forEach(k=>{const C=CREATURE[k];let w=0;
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
