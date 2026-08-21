/* Sensen Mini — tools/mutation.mjs
   node tools/mutation.mjs

   SIXIEME INSTRUMENT : qui verifie les verifications.

   Une suite de tests dit ce qui marche. Elle ne dit jamais ce qu'elle
   LAISSERAIT passer. J'ai ecrit ce jour-la une verification censee garantir
   qu'aucun effet de parure ne reste sans effet ; elle passait au vert, et
   elle etait vide de sens : elle mesurait sa propre sonde au lieu du jeu, et
   son empreinte contenait de l'aleatoire, si bien qu'elle differait toujours
   de la reference. Aucun defaut n'aurait pu la faire tomber.

   La seule facon de le savoir est de CASSER le jeu exprès et de regarder si
   la suite s'en apercoit. On debranche un effet — on retire la ligne qui le
   lit, comme si on avait oublie de l'ecrire — on lance la suite, on restaure.
   Un debranchement que personne ne voit est un test qui ne protege rien.

   On mute un EFFET, pas une ligne : la cicatrisation se lit a trois endroits
   (repos, sommeil, travail) et c'est un seul effet — le retirer d'un seul de
   ces trois endroits ne le supprime pas, et la suite a raison de ne pas
   crier. */
import {readFileSync as R,writeFileSync as W} from 'node:fs';
import {execSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const B=join(dirname(fileURLToPath(import.meta.url)),'..');

/* [nom, suite a lancer, [[fichier, cherche, remplace], ...]] */
const MUT=[
  ['parure : marche','parures',[['src/28-loop.js','*(1-util().marche)*mv*mm;','*mv*mm;']]],
  ['parure : cicatrisation','parures',[
    ['src/28-loop.js','*.06*dt*(1+util().soin));','*.06*dt);'],
    ['src/28-loop.js','*.015*dt*(S.thermal||1)*(1+util().soin));','*.015*dt*(S.thermal||1));'],
    ['src/28-loop.js','*.004*dt*(S.thermal||1)*(1+util().soin));','*.004*dt*(S.thermal||1));']]],
  ['parure : vision nocturne','parures',[['src/24-combat.js',"&&!don('nuitvue');",';']]],
  ['parure : metier','parures',[['src/08-state.js',"+(typeof utilSk==='function'?utilSk(k):0);",';']]],
  ['parure : statistique','parures',[['src/25-modules.js',"+(typeof utilStat==='function'?utilStat(k):0)",'']]],
  ['parure : charge','parures',[['src/10-craft.js',"+(typeof util==='function'?util().poids:0)",'']]],
  ['parure : faim','parures',[['src/28-loop.js','*(1-util().faim));','));']]],
  ['parure : immunite poison','parures',[['src/20-status.js',
    "if(tgt===S&&k==='poison'&&typeof don==='function'&&don('antipoison'))return;",'']]],
  ['parure : pas silencieux','parures',[['src/21-reputation.js',"+(don('silence')?8:0);",';']]],
  ['parure : detection','parures',[['src/30-panel-monde.js',
    "((c.seen||(c.poi==='filon'&&don('filons'))||(c.poi==='donjon'&&don('tresors')))&&c.poi",
    '(c.seen&&c.poi']]],
  /* les statuts du catalogue */
  ['statut : hate','cinq qui manquaient',[['src/24-combat.js',"*(hasStatus(S,'hate')?1.25:1)",'']]],
  ['statut : ralentissement','cinq qui manquaient',[['src/24-combat.js',"*(hasStatus(S,'ralenti')?.75:1)",'']]],
  ['statut : benediction','cinq qui manquaient',[['src/24-combat.js',
    "+(typeof hasStatus==='function'&&hasStatus(S,'beni')?1:0)",'']]],
  ['statut : infection','cinq qui manquaient',[['src/25-modules.js',
    "-(k==='endu'&&typeof malusInfection==='function'?malusInfection():0)",'']]],
  ['recolte : la pelle prend la glace','on voit sur la case',[['src/03-data-craft.js',",meteo:'pelle'};",'};']]],
  /* l enchainement */
  ['enchainement : il prend la main','enchainement',[['src/28-loop.js',"  if(!enchaine)while(atkT>=iv",'  if(true)while(atkT>=iv']]],
  ['enchainement : l ordre ecrit','enchainement',[['src/24b-sequence.js',"    if(seqRep>=n){Q.i++;seqRep=0;}",'    Q.i=Math.floor(Math.random()*Q.r.length);seqRep=0;']]],
  ['enchainement : le geste absent se saute','enchainement',[['src/24b-sequence.js',"    if(D.absent&&D.absent(g)){Q.i++;seqRep=0;seqSaut=0;continue;}",'']]],
  ['enchainement : la rotation du compagnon','enchainement',[['src/24b-sequence.js',"  return g.o;",'  return c.order;']]],
  /* le hors-la-loi */
  ['loi : anarchie sans gardes','hors-la-loi',[['src/21-reputation.js',
    'if(sansGardes(ki)){','if(false){']]],
  ['loi : prime en anarchie','hors-la-loi',[['src/21b-horslaloi.js',"  if(sansGardes(i)){",'  if(false){']]],
  ['loi : patrouilles','hors-la-loi',[['src/21b-horslaloi.js',
    '  if(p<120)return;','  return;']]],
  ['loi : marchand refuse le vole','hors-la-loi',[['src/12-npc.js',
    '  if(refuseVole(it))return toast(','  if(false)return toast(']]],
  ['loi : marque du vol','hors-la-loi',[['src/21b-horslaloi.js',
    "    if(off.t==='item')marquerVole(off.it);",'']]],
  ['peche : la barque au large','peche',[['src/26b-peche.js',"const bateau=vehUtile()&&vehDef().eau?.55:1;",'const bateau=1;']]],
  ['peche : le gel ferme l eau','peche',[['src/26b-peche.js','  if(eauGelee())return','  if(false)return']]],
  ['gardien : la rage','gardiens',[['src/24-combat.js',"atk.dmg*(atk.rage||1)*P.dm",'atk.dmg*P.dm']]],
  ['gardien : le renfort','gardiens',[['src/17b-gardiens.js',"    if(part<.5&&!g.renfort){",'    if(false){']]],
  ['gardien : la gangue','gardiens',[['src/17b-gardiens.js',"    if(part<.6&&g.gangue){",'    if(false){']]],
  ['gardien : il se recoud','gardiens',[['src/17b-gardiens.js',"    if(g.repos>2.5){",'    if(false){']]],
  ['gardien : sa piece nommee','gardiens',[['src/17-dungeon.js',"    if(G2&&ARTEFACT[G2.arte]&&!sacPlein())dropArtefactNomme(G2.arte,d.floors.length);",'']]],
  /* le ciel et l annee */
  ['ciel : temps de trajet','ciel',[['src/28-loop.js','*mv*mm;','*mv;']]],
  ['ciel : blizzard qui mord','ciel',[['src/28-loop.js','if(fx(c).gel&&!eclaireIci()&&!foyerIci()){','if(false){']]],
  ['ciel : foudre','ciel',[['src/28-loop.js','if(fx(c).foudre&&!eclaireIci()){','if(false){']]],
  ['ciel : voiles ingouvernables','ciel',[['src/22b-vehicules.js',
    'if(D.voile&&meteoVoile(c)<=0)return false;','']]],
  ['ciel : traits devies','ciel',[['src/24-combat.js','if(isDist(w))base*=meteoDist();','']]],
  ['annee : la faune suit','saisons',[['src/23c-creatures.js','      w*=saisonMul(k);','']]],
  /* les vehicules */
  ['vehicule : vitesse','vehicules',[['src/28-loop.js','*(1-util().marche)*mv*mm;','*(1-util().marche)*mm;']]],
  ['vehicule : cargo','vehicules',[['src/10-craft.js',
    "+(typeof vehCargo==='function'?vehCargo():0);",';']]],
  ['vehicule : terrain','vehicules',[['src/22b-vehicules.js',
    'return D.eau?surEau(c):!surEau(c);','return true;']]],
  ['vehicule : vent','vehicules',[['src/22b-vehicules.js','m*=(1+malus-aide)/Math.max(.2,mv2);','']]],
  ['vehicule : usure','vehicules',[['src/22b-vehicules.js',
    'm*= 1+(1-v.pv/D.pv)*.45;','']]],
  /* les lieux */
  ['lieux : ils se referment','lieux',[['src/07b-lieux.js','  if(D.hebdo)c.lieuW=S.week;','']]],
  ['lieux : le cercle demande son prix','lieux',[['src/07b-lieux.js',"      if((S.mat.cristalmana||0)<1)return toast('Il faut un cristal de mana à poser au centre');",'']]],
  ['lieux : la tombe se paie','lieux',[['src/07b-lieux.js','      c.corr=Math.min(100,c.corr+8);','']]],
  /* le territoire */
  ['raid : on le defend soi-meme','raid',[['src/13-kingdom.js',"    if(S.claims.includes(key(S.pos[0],S.pos[1]))&&S.occ!=='donjon'&&!S.raid){",'    if(false){']]],
  ['raid : le repousser paie','raid',[['src/24-combat.js',"  if(K.raid&&S.raid){",'  if(false){']]],
  ['raid : l abandonner coute','raid',[['src/28-loop.js',"    if(S.raid)raidPerdu('tu as rompu le contact');",'']]],
  ['residents : ils mangent','residents',[['src/13-kingdom.js','    S.vivres=Math.max(0,(S.vivres||0)-pris);','']]],
  ['residents : le garde-manger nourrit','residents',[['src/13-kingdom.js',"meubleTerritoire('gardemanger')*3;",'0;']]],
  ['residents : le creux coute','residents',[['src/13-kingdom.js','*creux;   /* 2 semaines','; /* 2 semaines']]],
  /* les meubles */
  ['meuble : bibliotheque','meubles',[['src/25-modules.js',
    "+(typeof meubleIci==='function'?Math.min(6,meubleIci('bibliotheque')*3):0);",';']]],
  ['meuble : autel domestique','meubles',[['src/24-combat.js',"(autels?.05:.1)",'.1']]],
  ['meuble : garde-manger','meubles',[['src/13-kingdom.js',
    "-(typeof meubleTerritoire==='function'?meubleTerritoire('gardemanger'):0));",');']]],
  ['meuble : ratelier','meubles',[['src/19-idle.js',
    "  ratelierList().forEach(it=>set[domi(itemVec(it))]=1);",'']]],
  ['meuble : lit de paille','meubles',[['src/16-building.js',
    "||sl.k==='litpaille'",'']]],
  ['meuble : torchere','meubles',[['src/18-weather.js',"||sl.k==='torchere'",'']]],
  /* l'alchimie */
  ['alchimie : poison de lame','alchimie',[['src/24-combat.js',
    "if(S.lame>0)addStatus(tgt,'poison',6,Math.max(1,maxHp()*.010));",'']]],
  ['alchimie : resistances','alchimie',[['src/18-weather.js',
    "-froidOff*.25",''],['src/18-weather.js',"-chaudOff*.25",'']]],
];

let vus=0;const rates=[];
console.log('\nSensen Mini — ce que la suite laisserait passer\n');
for(const [nom,suite,edits] of MUT){
  /* UN SEUL instantane par fichier, pris avant la premiere coupure. Une
     premiere version en gardait un par EDIT : restaurer un fichier mute trois
     fois y remettait alors le contenu d'avant la troisieme coupure, c'est-a-
     dire un fichier ou les deux premieres tenaient toujours. L'outil cense
     verifier les tests laissait le jeu casse derriere lui. */
  const originaux=new Map();
  let ok=true;
  for(const [f,a,b] of edits){
    const p=join(B,f),c=R(p,'utf8');
    if(!originaux.has(p))originaux.set(p,c);
    if(!c.includes(a)){ok=false;break;}
    W(p,c.replace(a,b));
  }
  const rendre=()=>originaux.forEach((c,p)=>W(p,c));
  if(!ok){
    rendre();
    console.log('  ANCRE ABSENTE  '+nom);
    rates.push(nom+' (ancre absente)');
    continue;
  }
  let sortie='';
  try{sortie=execSync('node tools/spec.mjs --only "'+suite+'"',{cwd:B,encoding:'utf8'});}
  catch(e){sortie=(e.stdout||'')+(e.stderr||'');}
  rendre();
  const detecte=/en échec|exception|✗/.test(sortie);
  console.log((detecte?'  vu     ':'  RATÉ   ')+nom);
  if(detecte)vus++;else rates.push(nom);
}
console.log('\n'+vus+' / '+MUT.length+' débranchements détectés');
if(rates.length){
  console.log('\nCe que la suite ne verrait pas :');
  rates.forEach(r=>console.log('  · '+r));
  console.log('');
  process.exit(1);
}
console.log('Aucun débranchement ne passe inaperçu.\n');
