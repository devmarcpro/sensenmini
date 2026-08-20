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
   d:'La barre sous la créature annonce ce qui vient : 一 coup · 二 enchaînement · 重 charge (lente, facile à parer, très douloureuse) · 薙 balayage (prend aussi ton escorte) · 咬 morsure (saigne) · 吐 crachat (imparable, garde-toi).',
   when:()=>!!(E&&E.w>=0)},
  {id:'groupe',g:'囲',t:'Ils sont plusieurs',
   d:'Tape une créature pour la viser (Tab ou ←→ au clavier). Celles que tu ne regardes pas frappent dans ton dos : +30 %, et impossibles à parer. La posture 退 Arrêt les garde en vue. Une arme d\'allonge balaie tout le groupe.',
   when:()=>EE.length>1},
  {id:'butin',g:'宝',t:'Premier butin',
   d:'Onglet 装 ÉQUIPEMENT : compare et équipe. Le donjon transforme, l\'atelier améliore — et ce qui ne vaut rien se fond pour un tiers de sa valeur.',
   when:()=>S.items.some(it=>it.rar)},
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
   when:()=>S.day>=.08},
  {id:'champ',g:'田',t:'Un champ en friche',
   d:'Dans 建 BÂTIR, ouvre la parcelle et sème deux unités d\'une plante. Elle produit chaque semaine selon la fertilité, la pluie et la saison — ×1,5 avec un fermier. Les bêtes apprivoisées en bétail y rendent de la viande.',
   when:()=>countPlot('champ')>0},
  {id:'royaume',g:'国',t:'Le seuil du royaume',
   d:'Huit cellules et cinq résidents : 国 ROYAUME te laisse choisir une gouvernance. Viennent alors les lois, la diplomatie, l\'impôt — et les raids.',
   when:()=>!S.gov&&S.claims.length>=6},
];
let tipQ=[];
function tickTips(){
  if(!S.race||S.tips===false)return;
  S.seen=S.seen||{};
  for(const t of TIPS){
    if(S.seen[t.id])continue;
    let ok=false;try{ok=t.when();}catch(e){ok=false;}
    if(!ok)continue;
    S.seen[t.id]=1;tipQ.push(t);
  }
  showTip();
}
function showTip(){
  const box=$('tip');if(!box)return;
  const body=document.body;
  if(!tipQ.length){box.hidden=true;if(body&&body.classList)body.classList.remove('has-tip');return;}
  const t=tipQ[0];
  box.hidden=false;if(body&&body.classList)body.classList.add('has-tip');   /* la page garde de la place pour défiler sous le conseil */
  box.innerHTML='<b>'+t.g+'</b><div class="tt"><div class="tt1">'+t.t+'</div><div class="tt2">'+t.d+'</div>'
    +'<div class="row" style="margin-top:6px"><button class="btn pri" data-tipok="1">Compris</button>'
    +(tipQ.length>1?'<span class="meta">'+(tipQ.length-1)+' autre'+(tipQ.length>2?'s':'')+'</span>':'')
    +'<button class="btn" data-tipoff="1" style="margin-left:auto">Mode vétéran</button></div></div>';
}
function tipOk(){tipQ.shift();showTip();}
function tipsOff(){S.tips=false;tipQ=[];showTip();log('Mode vétéran : plus aucun conseil. Réactivable dans 自 VEILLE.');}
function tipsReset(){S.tips=true;S.seen={};log('Les conseils reviendront au fil des premières fois.');}
