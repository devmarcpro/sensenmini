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
const guildTemplates=gk=>QTPL.filter(t=>t.g===gk&&t.r<=guildOf(gk).rank);
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
