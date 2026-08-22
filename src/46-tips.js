/* Sensen Mini — 46-tips.js
   Conseils contextuels : l'apprentissage par le jeu, zéro script (6.3 / E.19)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Chaque conseil se déclenche une fois, sur une condition d'état, et
   n'apporte que de l'information — jamais une progression conditionnée.
   « Mode vétéran » : tout off. S.seen garde ce qui a été vu.
   ================================================================== */
const TIPS=[
  {id:'debut',g:'生',t:'Seul en pleine nature',
   d:'Pas de quête imposée. Onglet 界 MONDE : combattre, explorer, se reposer. Tout progresse par l\'usage — ce que tu fais, tu l\'apprends.',
   when:()=>true},
  {id:'blesse',g:'傷',t:'Tes PV baissent',
   d:'À 25 % tu romps le combat et tu te reposes seul. Tomber coûte 10 % de ton or, jamais une compétence. Le repos régénère tant que tu n\'as pas faim.',
   when:()=>S.hp<maxHp()*.45},
  {id:'faim',g:'飢',t:'La faim se fait sentir',
   d:'Onglet 厨 TABLE : mange cru (moitié de la nutrition) ou cuisine — il faut une cuisine. Sous 25, plus aucune régénération ; à 0, tu t\'affaiblis sans mourir.',
   when:()=>S.faim<55},
  {id:'prise',g:'手',t:'Ce que tu tiens décide du combat',
   d:'Une arme et un bouclier : parade élargie, réduction partout, et une parade parfaite pose son élément dans la chaîne. Deux armes : la seconde main pose son propre segment. Deux mains : plus fort, mais rien pour parer. Un arc : la Dextérité porte, tu tiens la distance, mais rien ne se pare.',
   when:()=>S.occ==='combat'||S.occ==='donjon'},
  {id:'geste',g:'二',t:'Lis le geste',
   /* la liste se construit sur la table : elle ne peut plus vieillir */
   d:()=>{const F={haut:'↑ haut',cote:'↔ latéral',bas:'↓ bas'};
     return 'La barre sous la créature annonce ce qui vient, et D\'OÙ : '
      +Object.keys(PATTERN).map(k=>{const P=PATTERN[k];
        return P.g+' '+P.n+(P.dir?' ('+F[P.dir]+')':' (imparable)');}).join(' · ')
      +'. Place ta garde à la bonne hauteur — 闘 COMBAT, section 護 — : elle encaisse moitié moins et double presque la chance de parade parfaite.';},
   when:()=>!!(E&&E.w>=0)},
  {id:'hauteur',g:'護',t:'La garde a une hauteur',
   d:'Trois : 上 haute pour ce qui tombe, 横 latérale pour ce qui fauche, 下 basse pour ce qui mord et ce qui saisit. Un bouclier couvre en plus les hauteurs VOISINES — jamais toutes. Au cinquième rang de 護 Garde réflexe, elle suit le télégraphe toute seule ; dans 闘 COMBAT, une ligne d\'enchaînement peut aussi la poser ou la lire.',
   when:()=>!!(E&&E.w>=0)&&(S.guard||auto('garde')>0)},
  {id:'boyau',g:'洞',t:'Une hampe cogne les parois',
   d:'Dans une galerie ou un cul-de-basse-fosse, une arme d\'allonge — lance, hallebarde, trident — perd son balayage, se ramène plus lentement et coûte un quart de souffle en plus. La lame courte ne subit rien : c\'est ce qui en fait l\'arme des couloirs.',
   when:()=>typeof etroitIci==='function'&&etroitIci()},
  {id:'titre',g:'名',t:'Un titre',
   d:'Quarante-deux titres nomment ce que tu as FAIT — pas ce que tu as vu. Ils ne donnent rien : on ne farme pas un nom. Ce qui paie, c\'est la collection : chaque famille achevée vaut 1 % d\'XP partout, et quatre d\'entre elles rendent bien davantage. Onglet 蒐 COLLECTION.',
   when:()=>typeof hfAcquis==='function'&&hfAcquis().length>0},
  {id:'scriptorium',g:'書',t:'Écrire un livre',
   d:'Les livres sont la seule porte vers les modules, et toutes leurs sources se subissent. Bâtis un 書 Scriptorium : avec des fibres, du noir de fumée et assez de Lecture, tu copies un manuel dans le domaine que tu pratiques le moins. On n\'écrit que ce qu\'on sait.',
   when:()=>lv('lecture')>=5&&(S.modules||[]).length>0},
  {id:'groupe',g:'囲',t:'Ils sont plusieurs',
   d:'Tape une créature pour la viser (Tab ou ←→ au clavier). Celles que tu ne regardes pas frappent dans ton dos : +30 %, et impossibles à parer. La posture 退 Arrêt les garde en vue. Une arme d\'allonge balaie tout le groupe.',
   when:()=>EE.length>1},
  {id:'butin',g:'宝',t:'Premier butin',
   d:'Onglet 装 ÉQUIPEMENT : compare et équipe. Le donjon transforme, l\'atelier améliore — et ce qui ne vaut rien se fond pour un tiers de sa valeur.',
   when:()=>S.items.some(it=>it.rar)},
  {id:'sac',g:'袋',t:'Le sac se remplit',
   d:'Le dos porte 20 + Force×2 objets. Au-delà, le butin banal reste où il tombe. Fonds ce qui ne sert plus (装 ÉQUIPEMENT), vends-le au village, ou achète le Fondeur (自 VEILLE) : il s\'en charge seul.',
   when:()=>S.items.length>=sacMax()*.75},
  {id:'coffre',g:'箱',t:'Un coffre chez toi',
   d:'Il garde 30 objets — 60 pour un grand coffre — et appartient à sa cellule : ce qu\'on y range ne se reprend que sur place. Onglet 装 ÉQUIPEMENT, section 箱 COFFRE.',
   when:()=>!!coffreOf()},
  {id:'livre',g:'本',t:'Un livre',
   d:'Onglet 術 MAGIE : lire peut échouer (Lecture et Perception aident). Un module appris se place dans une compétence, qui se lance seule en combat.',
   when:()=>S.books.length>0},
  {id:'module',g:'印',t:'Premier module',
   d:'Dans 術 MAGIE, glisse-le dans un emplacement de compétence. Les modificateurs altèrent le module qui les suit — façon Noita.',
   when:()=>S.modules.length>0},
  {id:'nuit',g:'夜',t:'La nuit tombe',
   d:'Créatures plus denses et plus fortes, villages fermés. Une lanterne dans un bâtiment tient la nuit à distance ; un lit permet de dormir et de sauter la nuit.',
   when:()=>isNight()},
  {id:'recolte',g:'掘',t:'Des matériaux plein le sac',
   d:'Onglet 掘 RÉCOLTE pour choisir quoi prendre ; chaque gisement se vide et revient à la semaine. 鍛 ATELIER les transforme ; ils se vendent au village.',
   when:()=>Object.values(S.mat).reduce((a,b)=>a+b,0)>=40},
  {id:'or',g:'金',t:'De quoi revendiquer',
   d:'Onglet 国 ROYAUME : revendiquer la cellule où tu es (sauf un donjon). C\'est le début du territoire — lit, stations, résidents, et un jour un royaume.',
   when:()=>S.or>=claimCost()&&!S.claims.length},
  {id:'claim',g:'領',t:'Ta première cellule',
   d:'Onglet 建 BÂTIR : seize parcelles, un bâtiment par parcelle, seize emplacements par bâtiment. Commence par un lit et une cuisine. Le rôle de la cellule se règle dans 国 ROYAUME.',
   when:()=>S.claims.length>0},
  {id:'village',g:'村',t:'Un village',
   d:'民 PNJ : parler chaque jour, offrir, et à relation 50 engager. 市 VILLE : le marché, dont les bourses sont finies et se rechargent chaque semaine.',
   when:()=>{const c=here();return c.poi==='village'||!!townAt(c.x,c.y);}},
  {id:'bourse',g:'銭',t:'Une bourse a un fond',
   d:'Chaque ville a un stock d\'or fini, qui se regarnit de 15 % par semaine. À sec, le marchand ne refuse pas : il troque en vivres. Pour écouler une grosse récolte, il faut faire la tournée des villes — ou attendre.',
   when:()=>{const t=townAt(S.pos[0],S.pos[1]);return !!(t&&t.or<t.orMax*.35);}},
  {id:'boutique',g:'店',t:'Des boutiques',
   d:'市 VILLE : chaque commerce renouvelle son étal à la semaine — composants, armures de série, livres, potions, gemmes, vivres. Fermé la nuit, et à qui est mal vu.',
   when:()=>{const t=townAt(S.pos[0],S.pos[1]);return !!(t&&t.shops&&t.shops.length);}},
  {id:'entraineur',g:'師',t:'Un maître à payer',
   d:'Un PNJ qui te connaît un peu t\'entraîne dans son métier : 20 or × ton niveau pour +10 de potentiel (民 PNJ). Plus cher à mesure que tu montes — et il ne dépasse pas son propre niveau.',
   when:()=>npcsHere().some(n=>relTier(n.rel)>=1)},
  {id:'donjon',g:'塔',t:'Un donjon sous tes pieds',
   d:'Onglet 地 CELLULE pour y entrer. La difficulté et le butin suivent la profondeur, pas la corruption. Contenu fixe : ce que tu vides ne revient pas.',
   when:()=>here().poi==='donjon'},
  {id:'strate',g:'層',t:'La roche cède',
   d:'Ton outil mord la strate suivante : 地 CELLULE → percer. Plus profond, plus de matériaux rares, des créatures plus fortes — et il fait plus doux.',
   when:()=>here().depth<5&&canPierce(STRATA[here().depth+1].rock)&&S.sk.minage.lv>=8},
  {id:'plafond',g:'壁',t:'Le danger ne vient pas à toi',
   d:'Les créatures suivent la corruption de la cellule, jamais ton niveau. Pour plus d\'or, de livres et de butin : explore, et va vers les cases dangereuses (filet rouge).',
   when:()=>(here().kills||0)>=60&&here().corr<45},
  {id:'rel',g:'従',t:'Quelqu\'un t\'apprécie',
   d:'Relation 50 : tu peux l\'engager (民 PNJ). Il te suit, combat à tes côtés, et travaille sur ton territoire si tu lui donnes un poste (国 ROYAUME).',
   when:()=>S.npcs.some(n=>n.rel>=50&&!n.rec)},
  {id:'veille',g:'自',t:'Le monde tourne sans toi',
   d:'Onglet 自 VEILLE : les automatisations rachètent ce que tu fais à la main, et ton absence se résout à ton retour — à la cadence que tu tenais, jusqu\'à 8 h.',
   when:()=>S.day-7/24>=2.5},   /* après une dizaine de minutes de jeu, pas au premier pas */
  {id:'champ',g:'田',t:'Un champ en friche',
   d:'Dans 建 BÂTIR, ouvre la parcelle et sème deux unités d\'une plante. Elle produit chaque semaine selon la fertilité, la pluie et la saison — ×1,5 avec un fermier. Les bêtes apprivoisées en bétail y rendent de la viande.',
   when:()=>countPlot('champ')>0},
  /* ================================================================
     LES SYSTEMES QU'ON A BATIS ET QUE PERSONNE N'ANNONCAIT.
     Vingt-six conseils couvraient le jeu d'origine ; sept systemes ont
     ete construits depuis — parures, vehicules, peche, alchimie de
     plantes, enchainements, part d'ombre, gardiens nommes — et aucun ne
     se signalait. Un systeme qu'on ne decouvre pas n'existe pas, et dans
     un jeu qui tourne seul on ne fouille pas les onglets par curiosite.

     Chacun se declenche sur l'etat qui le rend PERTINENT, pas au bout de
     n minutes : on parle de la peche quand on est au bord de l'eau, du
     receleur quand on porte une piece volee, de l'enchainement quand on
     possede une seconde arme.
     ================================================================ */
  {id:'parure',g:'環',t:'Une parure ne se joue pas au combat',
   d:'Anneaux, amulette, cape, ceinture, talisman : ils ne donnent ni dégâts ni armure. Ils portent des métiers, de la charge, de la faim en moins, et parfois un DON — voir les filons sur la carte, marcher sans bruit, ne plus craindre le poison. 装 ÉQUIPEMENT.',
   when:()=>S.items.some(it=>it.kind==='parure')||Object.keys(S.eq).some(k=>S.eq[k]&&S.eq[k].kind==='parure')},
  {id:'peche',g:'漁',t:'De l\'eau, et de quoi manger',
   d:'掘 RÉCOLTE → Pêcher. Ni combat ni territoire : elle nourrit un blessé comme un vagabond, et le poisson se mange cru sans fièvre. Une barque double la prise. Le gel et les tempêtes la ferment.',
   when:()=>typeof pecheBlocage==='function'&&!pecheBlocage()},
  {id:'vehicule',g:'車',t:'Le temps du monde se gagne',
   d:'界 MONDE → ATTELAGE. Une charrette porte vingt-six objets de plus, un voilier fait de la côte une route. Le terrain tranche : une barque ne roule pas, une charrette ne flotte pas. À la voile, le cap compte — la Navigation rabote le vent contraire.',
   when:()=>lv('menuiserie')>=6},
  {id:'chair',g:'病',t:'La chair crue tourne',
   d:'Une fois sur cinq, manger de la viande crue donne la fièvre : deux points d\'endurance en moins chaque jour jusqu\'au soin. Une cuisine l\'évite, un remède la lave — et le poisson, lui, ne la donne jamais.',
   when:()=>hasStatus(S,'infection')},
  {id:'alchimie',g:'蒸',t:'Une plante ne donne pas une statistique',
   d:'厨 TABLE → Distiller. Une PARTIE DE CRÉATURE donne une potion de statistique ; une PLANTE donne un effet — soin, remède, antipoison, fraîcheur, poison de lame. Achillée, herbes, racines, camomille, menthe, ortie, sauge, belladone, amanite.',
   when:()=>Object.keys(S.food||{}).some(k=>typeof ALCHPLANTE!=='undefined'&&ALCHPLANTE[k])},
  {id:'enchainement',g:'連',t:'L\'ordre des coups peut s\'écrire',
   d:'自 VEILLE → ENCHAÎNEMENT. Prendre l\'épée, deux coups, une compétence, prendre le marteau, deux charges : la suite se rejoue à chaque combat. Ce qui manque s\'attend, ce qui n\'existe pas se saute. Tes compagnons ont la leur.',
   when:()=>S.items.filter(it=>it.kind==='arme').length>=1&&(weapon()||S.modules.length>0)},
  {id:'ombre',g:'闇',t:'Ce que tu as pris se voit',
   d:'Aucun marchand honnête ne veut une pièce volée : il faut un receleur — un camp, ou une ville où l\'on te regarde de travers — et il n\'en donne que la moitié. La prime, elle, suit le ROYAUME : fuir la ville ne suffit pas.',
   when:()=>typeof objetsVoles==='function'&&objetsVoles().length>0},
  {id:'prime',g:'罪',t:'On te cherche',
   d:'Au-delà de cent vingt or de prime, des patrouilles te coupent la route. Solder coûte le double, dans une ville du royaume (町 VILLE → PART D\'OMBRE). Une anarchie, elle, n\'a ni garde ni greffe : la loi y est un mot.',
   when:()=>typeof primeIci==='function'&&primeIci()>60},
  {id:'gardien',g:'主',t:'Le fond d\'un donjon a un nom',
   d:'Chaque thème garde le sien, avec sa mécanique : l\'un appelle du renfort quand il faiblit, l\'une se recoud si on la laisse respirer, l\'un porte une gangue qui cède à mi-course, l\'une enrage à mesure qu\'elle tombe. Chacun garde une pièce nommée, toujours la même.',
   when:()=>S.occ==='donjon'},
  {id:'ciel',g:'嵐',t:'Le ciel n\'est pas un décor',
   d:'Un blizzard blesse qui voyage sans abri — une torche suffit. Un orage cherche le métal que tu portes. Une tempête cloue les voiliers au port. La neige tient aux jambes, le brouillard ralentit la fouille.',
   when:()=>{const m=METEO[meteo(here())];return !!(m&&m.extreme);}},
  {id:'saison',g:'季',t:'La faune suit l\'année',
   d:'Les grosses bêtes à fourrure hibernent, la vermine vit de chaleur, le gibier de passage traverse au printemps et à l\'automne. Une même case ne se chasse pas de la même façon selon le mois.',
   when:()=>S.week>=8},
  {id:'royaume',g:'国',t:'Le seuil du royaume',
   d:'Huit cellules et cinq résidents : 国 ROYAUME te laisse choisir une gouvernance. Viennent alors les lois, la diplomatie, l\'impôt — et les raids.',
   when:()=>!S.gov&&S.claims.length>=6},
];
let tipQ=[];
function tickTips(){
  if(!S.race||S.tips===false)return;
  S.seen=S.seen||{};
  /* un conseil à la fois : au premier contact, une demi-douzaine de
     conditions sont vraies d'un coup, et six encarts d'affilée forment
     un mur. On attend que le précédent soit lu. */
  if(tipQ.length){showTip();return;}
  for(const t of TIPS){
    if(S.seen[t.id])continue;
    let ok=false;try{ok=t.when();}catch(e){ok=false;}
    if(!ok)continue;
    S.seen[t.id]=1;tipQ.push(t);break;
  }
  showTip();
}
/* le corps d'un conseil, calcule ou ecrit. Il vit dans sa propre fonction
   parce qu'un banc d'essai n'a pas de page a peindre : ce qui n'est
   verifiable que dans le DOM n'est pas verifie. */
const tipCorps=t=>typeof t.d==='function'?t.d():t.d;
function showTip(){
  const box=$('tip');if(!box)return;
  const body=document.body;
  if(!tipQ.length){box.hidden=true;if(body&&body.classList)body.classList.remove('has-tip');return;}
  const t=tipQ[0];
  box.hidden=false;if(body&&body.classList)body.classList.add('has-tip');   /* la page garde de la place pour défiler sous le conseil */
  /* UN CONSEIL QUI ENUMERE UNE TABLE FINIT PAR MENTIR. Celui des gestes
     listait les six telegraphes d'origine ; il y en a quatorze, et le texte
     est reste au premier jour. Un conseil peut donc etre une FONCTION : il se
     calcule au moment ou on le lit, sur la table elle-meme, et il ne peut
     plus se desynchroniser de ce que le jeu fait. */
  const corps=tipCorps(t);
  box.innerHTML='<b>'+t.g+'</b><div class="tt"><div class="tt1">'+t.t+'</div><div class="tt2">'+corps+'</div>'
    +'<div class="row" style="margin-top:6px"><button class="btn pri" data-tipok="1">Compris</button>'
    +(tipQ.length>1?'<span class="meta">'+(tipQ.length-1)+' autre'+(tipQ.length>2?'s':'')+'</span>':'')
    +'<button class="btn" data-tipoff="1" style="margin-left:auto">Mode vétéran</button></div></div>';
}
function tipOk(){tipQ.shift();showTip();}
function tipsOff(){S.tips=false;tipQ=[];showTip();log('Mode vétéran : plus aucun conseil. Réactivable dans 自 VEILLE.');}
function tipsReset(){S.tips=true;S.seen={};log('Les conseils reviendront au fil des premières fois.');}
