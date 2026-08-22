/* Sensen Mini — 13b-guilds.js
   Guildes : gabarits de quête, rangs, récompenses de rang (7.3 / B.7 / A.8.1)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Une quête n'est pas écrite : c'est un GABARIT tiré au sort et rempli
   par le contexte (B.7) — pattern, sélecteur de cible, fourchette de
   compte, formule de récompense. Chaque guilde a les siens ; le rang
   minimum ouvre les plus exigeants au fil de la progression.
   Cinq rangs (Novice → Maître), montée par XP de quêtes. Le rang donne
   trois choses : de meilleures récompenses, un présent de guilde à
   chaque palier, et la contrepartie — 5 % de taxe hebdomadaire, un or
   qui SORT du jeu (7.6).
   ================================================================== */
const QTPL=[
  /* --- combat --- */
  {id:'prime',g:'guerriers',r:0,t:'kill',n:[3,8],or:14,xp:12,
   txt:q=>'Abattre '+q.need+' créatures'},
  {id:'nettoyage',g:'guerriers',r:1,t:'killcat',cat:'corrompu',n:[3,7],or:26,xp:20,
   txt:q=>'Abattre '+q.need+' créatures corrompues'},
  {id:'brigands',g:'guerriers',r:2,t:'killcat',cat:'humain',n:[4,9],or:24,xp:22,
   txt:q=>'Disperser '+q.need+' hors-la-loi'},
  {id:'arene',g:'gladiateurs',r:0,t:'kill',n:[5,12],or:12,xp:12,
   txt:q=>'Compter '+q.need+' victoires'},
  {id:'chaine',g:'gladiateurs',r:1,t:'chain',n:[2,6],or:45,xp:26,
   txt:q=>'Résoudre '+q.need+' chaînes complètes'},
  {id:'colosse',g:'gladiateurs',r:3,t:'killrare',n:[1,2],or:220,xp:70,
   txt:q=>'Abattre '+q.need+' créature'+(q.need>1?'s':'')+' rare'+(q.need>1?'s':'')+' ou un gardien'},
  {id:'contrat',g:'assassins',r:0,t:'killcat',cat:'humain',n:[2,5],or:30,xp:16,
   txt:q=>'Honorer '+q.need+' contrat'+(q.need>1?'s':'')+' sur des hors-la-loi'},
  {id:'ombre',g:'assassins',r:2,t:'killnight',n:[3,7],or:34,xp:24,
   txt:q=>'Abattre '+q.need+' créatures de nuit'},
  /* --- exploration et donjons --- */
  {id:'reperage',g:'aventuriers',r:0,t:'explore',n:[3,7],or:22,xp:14,
   txt:q=>'Dévoiler '+q.need+' cellules'},
  {id:'descente',g:'aventuriers',r:1,t:'donjon',n:[4,10],or:20,xp:18,
   txt:q=>'Nettoyer '+q.need+' salles de donjon'},
  {id:'cartes',g:'navigateurs',r:0,t:'explore',n:[5,12],or:18,xp:14,
   txt:q=>'Lever la carte de '+q.need+' cellules'},
  {id:'cabotage',g:'navigateurs',r:1,t:'harvest',sel:'cote',n:[10,25],or:5,xp:16,
   txt:q=>'Rapporter '+q.need+' × '+matName(q.mat)+' de la côte'},
  {id:'pillage',g:'tresors',r:0,t:'donjon',n:[5,12],or:22,xp:18,
   txt:q=>'Fouiller '+q.need+' salles de donjon'},
  {id:'relique',g:'tresors',r:2,t:'loot',rar:2,n:[1,3],or:120,xp:40,
   txt:q=>'Ramener '+q.need+' pièce'+(q.need>1?'s':'')+' rare'+(q.need>1?'s':'')+' ou mieux'},
  /* --- récolte et artisanat --- */
  {id:'filon',g:'prospecteurs',r:0,t:'harvest',sel:'dur',n:[12,30],or:4,xp:14,
   txt:q=>'Extraire '+q.need+' × '+matName(q.mat)},
  {id:'taille',g:'prospecteurs',r:2,t:'gem',n:[1,3],or:90,xp:34,
   txt:q=>'Tailler '+q.need+' gemme'+(q.need>1?'s':'')},
  {id:'commande',g:'artisans',r:0,t:'craft',n:[1,3],or:70,xp:20,
   txt:q=>'Assembler '+q.need+' objet'+(q.need>1?'s':'')},
  {id:'fourniture',g:'artisans',r:1,t:'harvest',sel:'ici',n:[15,35],or:4,xp:16,
   txt:q=>'Fournir '+q.need+' × '+matName(q.mat)},
  {id:'banquet',g:'artisans',r:2,t:'cook',n:[2,5],or:60,xp:26,
   txt:q=>'Servir '+q.need+' plats cuisinés'},
  /* --- transport et bâti --- */
  {id:'convoi',g:'transporteurs',r:0,t:'deliver',n:[6,16],or:6,xp:16,
   txt:q=>'Livrer '+q.need+' × '+matName(q.mat)},
  {id:'estafette',g:'transporteurs',r:1,t:'explore',n:[4,9],or:24,xp:18,
   txt:q=>'Ouvrir '+q.need+' routes nouvelles (cellules dévoilées)'},
  {id:'chantier',g:'batisseurs',r:0,t:'build',n:[1,3],or:80,xp:22,
   txt:q=>'Élever '+q.need+' structure'+(q.need>1?'s':'')},
  {id:'materiaux',g:'batisseurs',r:1,t:'deliver',n:[10,25],or:5,xp:18,
   txt:q=>'Apporter '+q.need+' × '+matName(q.mat)+' au chantier communal'},
  {id:'communal',g:'developpement',r:0,t:'build',n:[2,4],or:75,xp:24,
   txt:q=>'Bâtir '+q.need+' structures pour la commune'},
  {id:'vivres',g:'developpement',r:1,t:'cook',n:[2,6],or:55,xp:24,
   txt:q=>'Préparer '+q.need+' plats pour la commune'},
  /* --- magie --- */
  {id:'etude',g:'magie',r:0,t:'book',n:[1,2],or:110,xp:26,
   txt:q=>'Déchiffrer '+q.need+' ouvrage'+(q.need>1?'s':'')},
  {id:'incantation',g:'magie',r:1,t:'spell',n:[8,20],or:9,xp:20,
   txt:q=>'Lancer '+q.need+' sorts au combat'},
  {id:'cristaux',g:'magie',r:2,t:'gem',n:[1,3],or:95,xp:34,
   txt:q=>'Tailler '+q.need+' gemme'+(q.need>1?'s':'')+' pour le cercle'},
  /* --- dressage : les prospecteurs et aventuriers achètent des bêtes --- */
  {id:'capture',g:'aventuriers',r:2,t:'tame',n:[1,2],or:150,xp:40,
   txt:q=>'Apprivoiser '+q.need+' bête'+(q.need>1?'s':'')},
  /* ================================================================
     VINGT-DEUX GABARITS DE PLUS. Douze guildes, vingt-neuf gabarits :
     deux ou trois chacune, et les rangs quatre et cinq n'ouvraient
     RIEN — monter de rang ne donnait qu'une meilleure recompense sur
     les memes trois quetes. Un rang qui n'ouvre pas de travail nouveau
     n'est pas un rang, c'est un multiplicateur.
     Chaque guilde a desormais quatre a six gabarits etales sur les cinq
     rangs, et les plus hauts demandent ce qu'on ne fait qu'apres avoir
     appris a jouer : des gardiens, des chaines completes, des fioles
     distillees, des lieux qu'il faut trouver avant de les visiter.
     ================================================================ */
  /* --- guerriers, gladiateurs, assassins : le combat --- */
  {id:'battue',g:'guerriers',r:3,t:'killcat',cat:'bete',n:[10,20],or:20,xp:34,
   txt:q=>'Mener une battue : '+q.need+' bêtes'},
  {id:'gardien',g:'guerriers',r:4,t:'killrare',n:[2,4],or:300,xp:110,
   txt:q=>'Abattre '+q.need+' gardiens ou créatures rares'},
  {id:'nocturne',g:'gladiateurs',r:2,t:'killnight',n:[6,14],or:26,xp:28,
   txt:q=>'Vaincre '+q.need+' fois à la nuit tombée'},
  {id:'invaincu',g:'gladiateurs',r:4,t:'chain',n:[8,16],or:90,xp:120,
   txt:q=>'Résoudre '+q.need+' chaînes sans interruption'},
  {id:'silence',g:'assassins',r:1,t:'killnight',n:[3,7],or:44,xp:24,
   txt:q=>'Frapper '+q.need+' fois dans le noir'},
  {id:'purge',g:'assassins',r:3,t:'killcat',cat:'corrompu',n:[8,16],or:32,xp:48,
   txt:q=>'Purger '+q.need+' créatures corrompues'},
  {id:'tete',g:'assassins',r:4,t:'killrare',n:[1,3],or:340,xp:130,
   txt:q=>'Livrer '+q.need+' tête'+(q.need>1?'s':'')+' de rareté'},
  /* --- aventuriers, navigateurs, tresors : la route --- */
  {id:'cartographie',g:'aventuriers',r:0,t:'explore',n:[8,18],or:12,xp:16,
   txt:q=>'Lever '+q.need+' cellules de la carte'},
  {id:'reconnaissance',g:'aventuriers',r:3,t:'lieu',n:[2,4],or:120,xp:52,
   txt:q=>'Visiter '+q.need+' points d\'intérêt'},
  {id:'expedition',g:'aventuriers',r:4,t:'donjon',n:[6,14],or:60,xp:120,
   txt:q=>'Nettoyer '+q.need+' salles de donjon'},
  {id:'ligne',g:'navigateurs',r:0,t:'peche',n:[8,20],or:8,xp:14,
   txt:q=>'Ramener '+q.need+' prises de la ligne'},
  {id:'hauturier',g:'navigateurs',r:2,t:'explore',n:[10,22],or:16,xp:30,
   txt:q=>'Ouvrir '+q.need+' cellules à la navigation'},
  {id:'peche_rare',g:'navigateurs',r:4,t:'peche',n:[40,80],or:6,xp:110,
   txt:q=>'Remplir les cales : '+q.need+' prises'},
  {id:'recel',g:'tresors',r:1,t:'loot',n:[3,7],rar:2,or:70,xp:28,
   txt:q=>'Rapporter '+q.need+' pièces rares ou mieux'},
  {id:'catacombes',g:'tresors',r:3,t:'donjon',n:[8,16],or:40,xp:60,
   txt:q=>'Descendre '+q.need+' salles'},
  {id:'pelerinage',g:'tresors',r:4,t:'lieu',n:[3,6],or:180,xp:130,
   txt:q=>'Fouiller '+q.need+' lieux oubliés'},
  /* --- prospecteurs, artisans, batisseurs : la matiere --- */
  {id:'veine',g:'prospecteurs',r:1,t:'harvest',n:[25,60],or:4,xp:22,
   txt:q=>'Extraire '+q.need+' × '+matName(q.mat)},
  {id:'carriere',g:'prospecteurs',r:3,t:'harvest',n:[60,140],or:3,xp:52,
   txt:q=>'Ouvrir une carrière : '+q.need+' × '+matName(q.mat)},
  {id:'lapidaire',g:'prospecteurs',r:4,t:'gem',n:[3,6],or:130,xp:110,
   txt:q=>'Tailler '+q.need+' gemmes pour la compagnie'},
  {id:'commande_arme',g:'artisans',r:1,t:'craft',n:[2,5],or:70,xp:24,
   txt:q=>'Forger '+q.need+' pièce'+(q.need>1?'s':'')+' pour la guilde'},
  {id:'officine',g:'artisans',r:3,t:'potion',n:[2,5],or:100,xp:54,
   txt:q=>'Distiller '+q.need+' fioles'},
  {id:'oeuvre',g:'artisans',r:4,t:'craft',n:[8,16],or:60,xp:130,
   txt:q=>'Livrer '+q.need+' pièces à la commande'},
  {id:'muraille',g:'batisseurs',r:3,t:'build',n:[5,10],or:70,xp:56,
   txt:q=>'Élever '+q.need+' structures de défense'},
  /* --- developpement et magie : la commune et l'etude --- */
  {id:'grenier',g:'developpement',r:3,t:'peche',n:[20,45],or:7,xp:50,
   txt:q=>'Remplir le grenier : '+q.need+' prises'},
  {id:'prosperite',g:'developpement',r:4,t:'build',n:[6,12],or:90,xp:125,
   txt:q=>'Bâtir '+q.need+' structures pour la commune'},
  {id:'grimoire',g:'magie',r:3,t:'book',n:[3,6],or:130,xp:60,
   txt:q=>'Déchiffrer '+q.need+' ouvrages difficiles'},
  {id:'archimage',g:'magie',r:4,t:'spell',n:[60,140],or:3,xp:135,
   txt:q=>'Lancer '+q.need+' sorts au combat'},
];
/* présents de rang (7.3) : ce que la guilde ouvre en montant */
const GUILDGIFT={
  guerriers:g=>({t:'livre',dom:'frappes',d:'un manuel de Frappes'}),
  gladiateurs:g=>({t:'livre',dom:'postures',d:'un manuel de Postures'}),
  assassins:g=>({t:'livre',dom:'techniques',d:'un manuel de Techniques'}),
  aventuriers:g=>({t:'livre',dom:'maitrise',d:'un manuel de Maîtrise'}),
  magie:g=>({t:'livre',dom:pick(DK.filter(d=>DOMAIN[d].b==='grimoire')),d:'un grimoire'}),
  tresors:g=>({t:'gemme',d:'une gemme taillée'}),
  prospecteurs:g=>({t:'gemme',d:'une gemme taillée'}),
  artisans:g=>({t:'recette',d:'une recette exotique'}),
  batisseurs:g=>({t:'recette',d:'une recette exotique'}),
  developpement:g=>({t:'or',d:'une prime de la commune'}),
  transporteurs:g=>({t:'or',d:'une prime de route'}),
  navigateurs:g=>({t:'or',d:'une part d\'armateur'}),
};
function guildOf(k){return S.guilds[k]||(S.guilds[k]={rank:0,xp:0,gains:0});}
const guildRankNeed=r=>100*Math.pow(2,r);
/* les gabarits ouverts à une guilde, au rang courant */
/* guildOf() CREE la guilde si elle n'existe pas — c'est ce qu'on veut quand
   on s'y engage, et c'est une faute quand on ne fait que REGARDER. Depuis
   qu'une consigne demande « puis-je prendre une quete ? » a chaque battement,
   la simple lecture inscrivait le personnage dans les cinq guildes du monde.
   Une condition ne doit rien changer a ce qu'elle observe. */
const guildRank=gk=>((S.guilds||{})[gk]||{rank:0}).rank||0;
const guildTemplates=gk=>QTPL.filter(t=>t.g===gk&&t.r<=guildRank(gk));
/* choisir la matière d'une quête selon le sélecteur du gabarit */
function questMat(t){
  const c=here();
  if(t.sel==='ici'){const l=cellMats(c).filter(canHarvest);return l.length?pick(l):'pierre';}
  if(t.sel==='dur'){const l=cellMats(c).filter(m=>canHarvest(m)&&MAT[m].d>=10);return l.length?pick(l):pick(cellMats(c));}
  if(t.sel==='cote'){const l=BIOME.cote.mats.filter(m=>MAT[m]);return pick(l);}
  const stock=Object.keys(S.mat).filter(m=>S.mat[m]>=3);
  return stock.length&&Math.random()<.6?pick(stock):pick(cellMats(c));
}
function newQuest(gk){
  if(S.quest)return toast('Une quête est déjà en cours');
  if(!guildReachable(gk))return toast('Il faut un hall de cette guilde — sur place, ou bâti chez toi');
  const gu=guildOf(gk),g=GUILDS.find(x=>x.k===gk);
  const pool=guildTemplates(gk);
  if(!pool.length)return toast('Rien à ta portée ici');
  const t=pick(pool);
  const need=Math.max(1,Math.round(ri(t.n[0],t.n[1])*(1+gu.rank*.25)));
  const q={g:gk,tpl:t.id,type:t.t,cat:t.cat,rar:t.rar,cur:0,need,
    or:Math.round(t.or*need*(1+gu.rank*.35)),xp:Math.round(t.xp*(1+gu.rank*.4))};
  if(t.t==='harvest'||t.t==='deliver')q.mat=questMat(t);
  q.txt=t.txt(q);
  S.quest=q;
  cutIn(g.g,'Quête — '+g.n,q.txt+' · '+q.or+' or');
  log('<span class="in">'+g.n+' : '+q.txt+' ('+q.or+' or, '+q.xp+' XP de guilde)</span>');
}
/* le monde signale ce qui se passe ; la quête retient ce qui la concerne.
   `extra` : la matière pour une récolte, {cat,rare,boss} pour une mise à mort,
   la rareté pour un butin. */
/* Deux types de plus. Les gabarits ne pouvaient parler que de ce que
   questTick savait compter — tuer, recolter, batir, cuisiner, lire, lancer,
   tailler, livrer, explorer, apprivoiser, resoudre une chaine, descendre.
   La peche et les points d'interet sont arrives depuis, et aucune guilde ne
   pouvait en parler. */
function questTick(type,n,extra){
  const q=S.quest;if(!q)return;
  const T=q.type;
  if(type==='kill'){
    if(T==='kill'){}
    else if(T==='killcat'){if(!extra||extra.cat!==q.cat)return;}
    else if(T==='killrare'){if(!extra||(!extra.rare&&!extra.boss))return;}
    else if(T==='killnight'){if(!isNight())return;}
    else return;
  }
  else if(T==='loot'&&type==='loot'){if((extra||0)<(q.rar||2))return;}
  else if(T!==type)return;
  else if(type==='harvest'&&extra!==q.mat)return;
  q.cur+=n;
  if(q.cur>=q.need&&q.type!=='deliver')completeQuest();
}
function completeQuest(){
  const q=S.quest;if(!q)return;
  /* le gabarit s'appelle `tpl` dans la quete active, pas `id` */
  if(q.cur>=q.need&&q.tpl)collecte('quete',q.tpl);
  if(q.cur<q.need)return toast('Pas encore : '+q.cur+'/'+q.need);
  if(q.type==='deliver'){
    if((S.mat[q.mat]||0)<q.need)return toast('Il te faut '+q.need+' × '+matName(q.mat)+' en sac');
    S.mat[q.mat]-=q.need;if(!S.mat[q.mat])delete S.mat[q.mat];
  }
  const gu=guildOf(q.g),g=GUILDS.find(x=>x.k===q.g);
  S.or+=q.or;gu.gains+=q.or;gu.xp+=q.xp;
  gu.faites=(gu.faites||0)+1;
  gainRep(4,null,kingdomHere());
  S.quest=null;
  let monte=false;
  while(gu.xp>=guildRankNeed(gu.rank)&&gu.rank<4){
    gu.xp-=guildRankNeed(gu.rank);gu.rank++;monte=true;
    const don=guildGift(q.g,gu.rank);
    cutIn('会',RANKS[gu.rank]+' — '+g.n,'rang '+(gu.rank+1)+'/5'+(don?' · '+don:''));
  }
  if(!monte)cutIn('達','Quête accomplie','+'+q.or+' or · '+g.n+' '+RANKS[gu.rank]);
}
/* le présent du rang : ce que la guilde ouvre à ses gradés */
function guildGift(gk,rank){
  /* aux hauts rangs, une recette industrielle avant tout le reste (4.2.2) */
  if(rank>=3){
    const inconnus=ALK.filter(k=>!alliageConnu(k));
    if(inconnus.length&&Math.random()<.55){
      const k=pick(inconnus);apprendreAlliage(k);
      return 'recette : '+ALLIAGE[k].n;
    }
  }
  const f=GUILDGIFT[gk];if(!f)return null;
  const gift=f(gk);
  if(gift.t==='livre'){
    S.books.push({id:'b'+(S.nid++),dom:gift.dom,diff:ri(3,5)+rank*2});
    return gift.d+' de '+DOMAIN[gift.dom].n;}
  if(gift.t==='gemme'){
    const g2=randomGem(here());g2.q=+(g2.q+rank*.2).toFixed(2);g2.v=gemValue(g2.spec,g2.q,g2.mk);
    S.gems=S.gems||[];S.gems.push(g2);
    return gemLabel(g2);}
  if(gift.t==='recette'){
    const ex=Object.keys(MAT).filter(m=>!BASEMAT.includes(m));
    const cts=mk=>Object.keys(COMP).filter(ct=>COMP[ct].raw.includes(mk)||COMP[ct].forms.some(f2=>f2!=='brut'&&FORM[f2]&&formOk(f2,mk)));
    for(let i=0;i<24;i++){const m=pick(ex);if(cts(m).length){learnRecipe(pick(cts(m)),m);return 'une recette de '+matName(m);}}
    return null;}
  if(gift.t==='or'){const or=200*(rank+1);S.or+=or;return or+' or';}
  return null;
}
/* taxe hebdomadaire : 5 % des gains, pondérée par le rang — cet or sort du jeu (A.8.1) */
function weeklyGuild(r){
  let taxe=0;
  for(const k in S.guilds){const gu=S.guilds[k];
    taxe+=Math.round(.05*(gu.gains||0)*(1+gu.rank*.1));gu.gains=0;}
  if(taxe){S.or=Math.max(0,S.or-taxe);r.push('taxes de guilde −'+taxe+' or (détruit)');}
}
/* prendre une quête : sur place dans un hall, ou depuis un hall de ton territoire */
function guildReachable(gk){
  if(countSlot('hall'))return true;
  const t=townAt(S.pos[0],S.pos[1]);
  return !!(t&&!t.abandonne&&t.halls&&t.halls.includes(gk));
}
