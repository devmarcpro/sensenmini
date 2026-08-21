/* Sensen Mini — 48-collection.js
   La collection : tout ce que le jeu contient, et ce qu'on en a vu
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   TOUT CE QU'ON A CONSTRUIT, ET AUCUN ENDROIT POUR LE VOIR.
   Cent quatre-vingt-sept matières, soixante-trois créatures, vingt
   biomes, treize points d'intérêt, trente-et-un affixes, cinquante-six
   gabarits de quête, soixante-huit modules de sort, cinq artefacts
   nommés — et le joueur n'avait aucune façon de savoir ce qu'il n'avait
   pas encore vu. Un monde dont on ne peut pas mesurer sa propre
   ignorance ne donne aucune raison d'y retourner.

   La collection est un OBJECTIF, pas un tableau de bord : elle dit ce
   qui manque, pas ce qu'on a. Chaque ligne se remplit par le jeu — on
   ne coche rien à la main, on ne l'achète pas. Et elle ne cache rien :
   ce qu'on n'a pas vu s'affiche en gris avec son nom, parce qu'une
   collection dont on ignore les cases vides ne se remplit jamais.

   Un principe tenu partout : on n'inscrit QUE ce qui est passé entre
   les mains du joueur. Un affixe se compte quand on a porté l'arme qui
   le porte, pas quand on l'a croisé dans une boutique.
   ================================================================== */

/* Chaque famille : son titre, la liste complète de ce qui existe, le nom
   lisible d'une entrée, et — pour celles qui se déduisent de l'état —
   la façon de savoir ce qu'on possède déjà sans rien enregistrer. */
const COLLECTION={
  mat:{n:'Matières',g:'鉱',tout:()=>Object.keys(MAT),nom:k=>matName(k)},
  creature:{n:'Créatures',g:'獣',tout:()=>CK,nom:k=>CREATURE[k].n,
    vus:()=>Object.keys(S.bes||{})},
  biome:{n:'Biomes',g:'界',tout:()=>Object.keys(BIOME),nom:k=>BIOME[k].n},
  poi:{n:'Points d\'intérêt',g:'地',tout:()=>Object.keys(POI),nom:k=>POI[k].n},
  arme:{n:'Armes',g:'刀',tout:()=>FK2,nom:k=>FUNC[k].n},
  outil:{n:'Outils',g:'具',tout:()=>Object.keys(OUTIL),nom:k=>OUTIL[k].n},
  parure:{n:'Parures',g:'環',tout:()=>PARK,nom:k=>PARURE[k].n},
  affixe:{n:'Effets d\'arme',g:'銘',tout:()=>AFF.map(a=>a.id),
    nom:k=>{const a=AFF.find(x=>x.id===k);return a?a.f.toLowerCase()+' — '+a.id:k;}},
  affu:{n:'Effets de parure',g:'祐',tout:()=>AFFUK,
    nom:k=>{const a=AFFU.find(x=>x.id===k);return a?a.f.toLowerCase()+' — '+a.id:k;}},
  artefact:{n:'Pièces nommées',g:'遺',tout:()=>ARTK,nom:k=>ARTEFACT[k].n,
    vus:()=>Object.keys(S.arte||{})},
  gemme:{n:'Gemmes',g:'玉',tout:()=>GEMK,nom:k=>matName(k)},
  taille:{n:'Tailles de gemme',g:'匠',tout:()=>Object.keys(GEMSPEC),nom:k=>GEMSPEC[k].n},
  module:{n:'Modules de compétence',g:'術',tout:()=>MK,nom:k=>MODULE[k].n,
    vus:()=>(S.modules||[]).map(m=>m.id)},
  alliage:{n:'Alliages',g:'錬',tout:()=>ALK,nom:k=>ALLIAGE[k].n,
    vus:()=>ALK.filter(k=>alliageConnu(k))},
  fiole:{n:'Fioles d\'effet',g:'薬',tout:()=>Object.keys(POTEFF),nom:k=>POTEFF[k].n},
  conso:{n:'Consommables',g:'布',tout:()=>CONSK,nom:k=>CONSO[k].n},
  meuble:{n:'Meubles',g:'家',tout:()=>MK2,nom:k=>MEUBLE[k].n},
  station:{n:'Stations',g:'鍛',tout:()=>Object.keys(STATION),nom:k=>STATION[k].n},
  vehicule:{n:'Attelages',g:'車',tout:()=>VEHK,nom:k=>VEHICULE[k].n},
  lieu:{n:'Lieux visités',g:'訪',tout:()=>LIEUK,nom:k=>LIEU[k].n},
  statut:{n:'États subis',g:'状',tout:()=>Object.keys(STATUS),nom:k=>STATUS[k].n},
  gardien:{n:'Gardiens abattus',g:'主',tout:()=>Object.keys(GARDIEN).concat(['majeur']),
    nom:k=>k==='majeur'?GARDIEN_MAJEUR.n:GARDIEN[k].n},
  guilde:{n:'Guildes rejointes',g:'会',tout:()=>GUILDS.map(g=>g.k),
    nom:k=>(GUILDS.find(g=>g.k===k)||{n:k}).n,
    vus:()=>Object.keys(S.guilds||{})},
  quete:{n:'Quêtes accomplies',g:'達',tout:()=>QTPL.map(t=>t.id),
    nom:k=>{const t=QTPL.find(x=>x.id===k);return t?(GUILDS.find(g=>g.k===t.g)||{n:t.g}).n+' — '+t.id:k;}},
  prise:{n:'Prises de pêche',g:'漁',
    tout:()=>[...new Set(Object.keys(PECHE).flatMap(b=>Object.keys(PECHE[b])))],
    nom:k=>MAT[k]?matName(k):(PARTS.find(p=>p.k===k)||{n:k}).n},
  race:{n:'Races rencontrées',g:'民',tout:()=>Object.keys(RACE),nom:k=>RACE[k].n},
};
const COLK=Object.keys(COLLECTION);

/* ===== INSCRIRE ===== */
/* On n'inscrit QUE ce qui est passé entre les mains du joueur. La fonction
   est volontairement pauvre : une famille, une clé, et rien d'autre — c'est
   ce qui permet de l'appeler depuis n'importe où sans y penser. */
function collecte(cat,k){
  if(!k||!COLLECTION[cat])return;
  S.col=S.col||{};
  const d=S.col[cat]||(S.col[cat]={});
  if(d[k])return;
  d[k]=1;
  /* une première fois se dit : c'est la seule récompense de la collection,
     et elle suffit — on ne donne pas d'or pour avoir vu quelque chose. */
  const D=COLLECTION[cat];
  let nom='';try{nom=D.nom(k);}catch(e){nom=k;}
  const n=colAvoir(cat).length,t=D.tout().length;
  if(n===t)cutIn(D.g,D.n+' : au complet',t+' / '+t+' — plus rien à découvrir de ce côté');
  else if(typeof log==='function')log('<span class="in">蒐 '+nom+' — première fois ('+n+'/'+t+')</span>');
}
/* ce qu'on possède dans une famille : l'enregistrement, plus ce que l'état
   du jeu dit déjà (inutile d'inscrire ce qui se déduit) */
function colAvoir(cat){
  const D=COLLECTION[cat];
  if(!D)return [];
  const tout=D.tout();
  const enr=Object.keys((S.col&&S.col[cat])||{});
  const dedu=D.vus?D.vus():[];
  return [...new Set(enr.concat(dedu))].filter(k=>tout.includes(k));
}
const colPct=cat=>{const D=COLLECTION[cat];if(!D)return 0;
  const t=D.tout().length;return t?colAvoir(cat).length/t:0;};
/* la complétion générale : chaque entrée du jeu pèse pareil, quelle que
   soit sa famille — sinon les 187 matières écraseraient tout le reste et
   le chiffre ne dirait plus rien. */
function colTotal(){
  let a=0,t=0;
  COLK.forEach(c=>{a+=colAvoir(c).length;t+=COLLECTION[c].tout().length;});
  return {a,t,pct:t?a/t:0};
}

/* ===== LES FAMILLES QUI SE DÉDUISENT D'UN COUP =====
   Biomes, points d'intérêt, races : plutôt que d'inscrire à chaque pas, on
   relit le monde connu de temps en temps. C'est moins d'appels, et cela
   rattrape les parties commencées avant la collection. */
function colBalayer(){
  for(const k in (S.world||{})){
    const c=S.world[k];
    if(!c||!c.seen)continue;
    collecte('biome',c.b);
    if(c.poi)collecte('poi',c.poi);
  }
  (S.npcs||[]).forEach(n=>{if(n.race)collecte('race',n.race);});
  if(S.race)collecte('race',S.race);
  /* ce qu'on porte et ce qu'on a en sac : armes, outils, parures, effets */
  const pieces=(S.items||[]).concat(Object.values(S.eq||{})).filter(Boolean);
  pieces.forEach(it=>{
    if(it.kind==='arme'&&it.fn)collecte('arme',it.fn);
    if(it.kind==='outil'&&it.fn)collecte('outil',it.fn);
    if(it.kind==='parure'&&it.fn)collecte('parure',it.fn);
    if(it.unique)collecte('artefact',it.unique);
    (it.aff||[]).forEach(a=>{
      if(AFF.some(x=>x.id===a.id))collecte('affixe',a.id);
      else if(AFFU.some(x=>x.id===a.id))collecte('affu',a.id);
    });
    (it.gems||[]).forEach(g=>{collecte('gemme',g.mk);collecte('taille',g.spec);});
  });
  (S.gems||[]).forEach(g=>{collecte('gemme',g.mk);collecte('taille',g.spec);});
  (S.potions||[]).forEach(p=>{if(p.e)collecte('fiole',p.e);});
  Object.keys(S.conso||{}).forEach(k=>collecte('conso',k));
  Object.keys(S.mat||{}).forEach(k=>collecte('mat',k));
  if(S.vehicule&&S.vehicule.k)collecte('vehicule',S.vehicule.k);
  (S.st||[]).forEach(x=>collecte('statut',x.k));
  /* le territoire : meubles posés et stations disponibles */
  (S.claims||[]).forEach(ck=>{const c=S.world[ck];
    if(!c||!c.plots)return;
    c.plots.forEach(p=>{if(p&&p.t==='batiment')p.slots.forEach(sl=>{
      if(!sl)return;
      if(sl.t==='meuble')collecte('meuble',sl.k);
      if(sl.t==='station')collecte('station',sl.k);
    });});
  });
  (S.carry||[]).forEach(k=>collecte('station',k));
}
