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
  ['parure : marche','parures',[['src/28-loop.js','*(1-util().marche)*mv*mm*ery;','*mv*mm*ery;']]],
  ['parure : cicatrisation','parures',[
    ['src/28-loop.js','*.06*dt*(1+util().soin));','*.06*dt);'],
    ['src/28-loop.js','*.015*dt*(S.thermal||1)*(1+util().soin));','*.015*dt*(S.thermal||1));'],
    ['src/28-loop.js','*.004*dt*(S.thermal||1)*(1+util().soin));','*.004*dt*(S.thermal||1));']]],
  ['parure : vision nocturne','parures',[['src/24-combat.js',"&&!don('nuitvue');",';']]],
  ['parure : metier','parures',[['src/08-state.js',"+(typeof utilSk==='function'?utilSk(k):0);",';']]],
  ['parure : statistique','parures',[['src/25-modules.js',"+(typeof utilStat==='function'?utilStat(k):0)",'']]],
  ['parure : charge','parures',[['src/10-craft.js',"+(typeof util==='function'?util().poids:0)",'']]],
  ['parure : faim','parures',[['src/28-loop.js','*(1-util().faim)','*(1-0)']]],
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
  ['ciel : temps de trajet','ciel',[['src/28-loop.js','*mv*mm*ery;','*mv*ery;']]],
  ['ciel : blizzard qui mord','ciel',[['src/28-loop.js','if(fx(c).gel&&!eclaireIci()&&!foyerIci()){','if(false){']]],
  ['ciel : foudre','ciel',[['src/28-loop.js','if(fx(c).foudre&&!eclaireIci()){','if(false){']]],
  ['ciel : voiles ingouvernables','ciel',[['src/22b-vehicules.js',
    'if(D.voile&&meteoVoile(c)<=0)return false;','']]],
  ['ciel : traits devies','ciel',[['src/24-combat.js','if(isDist(w))base*=meteoDist();','']]],
  ['annee : la faune suit','saisons',[['src/23c-creatures.js','      w*=saisonMul(k);','']]],
  /* les vehicules */
  ['vehicule : vitesse','vehicules',[['src/28-loop.js','*(1-util().marche)*mv*mm*ery;','*(1-util().marche)*mm*ery;']]],
  ['vehicule : cargo','vehicules',[['src/10-craft.js',
    "+(typeof vehCargo==='function'?vehCargo():0);",';']]],
  ['vehicule : terrain','vehicules',[['src/22b-vehicules.js',
    'if(D.eau)return surEau(c);','if(D.eau)return true;']]],
  ['vehicule : vent','vehicules',[['src/22b-vehicules.js','m*=(1+malus-aide)/Math.max(.2,mv2);','']]],
  ['vehicule : usure','vehicules',[['src/22b-vehicules.js',
    'm*= 1+(1-v.pv/D.pv)*.45;','']]],
  ['passif : l allonge ouvre le balayage','passifs',[['src/24-combat.js','const port=F.reach+(PA.reach||0);','const port=F.reach;']]],
  /* la symetrie */
  ['symetrie : le souffle des creatures','symetrie',[['src/28-loop.js',"    if(e.w<0&&!crePeutFrapper(e))continue;",'']]],
  ['symetrie : la depense','symetrie',[['src/28-loop.js','{creDepense(e);resolveHit(S.guard?1:0,e);}','resolveHit(S.guard?1:0,e);']]],
  ['symetrie : l armure d un PNJ','symetrie',[['src/24-combat.js',"(typeof creArmure==='function'?creArmure(tgt,zk):tgt.arm)",'tgt.arm']]],
  ['collection : la boucle balaie','titres',[['src/28-loop.js',"    if(typeof colBalayer==='function')colBalayer();}",'  }']]],
  ['rotation : le geste pose la hauteur','rotation',[['src/24b-sequence.js',"    fais:g=>{S.gdir=(GARDES.some(x=>x.k===g)?g:'haut');S.guard=true;return true;}},","    fais:()=>{S.guard=true;return true;}},"]]],
  ['rotation : lire place la garde','rotation',[['src/24b-sequence.js',"    fais:()=>{S.gdir=patOf(E).dir;S.guard=true;return true;}},","    fais:()=>{S.guard=true;return true;}},"]]],
  ['rotation : ce qui ne s annonce pas ne se lit pas','rotation',[['src/24b-sequence.js','    peut:()=>!!E&&!!patOf(E).dir,','    peut:()=>!!E,']]],
  ['gestes : la matiere la plus dure','gestes de la case',[['src/30-panel-monde.js','      pris.sort((a,b)=>MAT[b].d-MAT[a].d);','      pris.sort((a,b)=>MAT[a].d-MAT[b].d);']]],
  ['gestes : la recolte se lance de la carte','gestes de la case',[['src/30-panel-monde.js',"      g.push(['harv=\"'+pris[0]+'\"','掘','récolter '+matName(pris[0])]);",'']]],
  ['gestes : rien sur une case nue','gestes de la case',[['src/30-panel-monde.js',"  if(c.poi==='sanctuaire'&&!((c.shrine||0)>S.week-1))","  if(true)"]]],
  ['gestes : le livre le plus facile','gestes de la case',[['src/30-panel-monde.js','    let i=0;for(let k=1;k<S.books.length;k++)if(S.books[k].diff<S.books[i].diff)i=k;','    let i=0;']]],
  ['gestes : pas de lecture en combat','gestes de la case',[['src/30-panel-monde.js',"  if((S.books||[]).length&&S.occ!=='combat'){",'  if((S.books||[]).length){']]],
  ['gestes : un donjon vide ne se redescend pas','gestes de la case',[['src/30-panel-monde.js',"    if(!(d&&d.clear))g.push(['dj=\"1\"','塔',d?'redescendre':'entrer dans le donjon']);","    g.push(['dj=\"1\"','塔',d?'redescendre':'entrer dans le donjon']);"]]],
  ['caravane : la marchandise part vraiment','caravane',[['src/13-kingdom.js','  S.mat[mk]-=vendu;if(!S.mat[mk])delete S.mat[mk];','']]],
  ['caravane : la bourse de la ville borne','caravane',[['src/13-kingdom.js','  const paye=Math.min(prix,Math.floor(best.or||0));','  const paye=prix;']]],
  ['caravane : la bourse se vide','caravane',[['src/13-kingdom.js','  best.or=Math.max(0,(best.or||0)-paye);','']]],
  ['caravane : il faut une ville connue','caravane',[['src/13-kingdom.js','      if(cc&&cc.seen)out.push(t);','      out.push(t);']]],
  ['prose : les postures se comptent','prose',[['src/44b-panel-combat.js',"'+nomNombreCap(STANCE.length)+' postures","Trois postures"]]],
  ['prose : les parcelles se comptent','prose',[['src/40-panel-batir.js',"'+nomNombre(NPLOTS)+' parcelles","douze parcelles"]]],
  ['prose : un nombre au-dela de vingt reste un chiffre','prose',[['src/01-core.js','const nomNombre=n=>NOMBRES[n]!==undefined?NOMBRES[n]:String(n);',"const nomNombre=n=>NOMBRES[n]||'quelques';"]]],
  ['conseil : les gestes se calculent','conseils',[['src/46-tips.js',"      +Object.keys(PATTERN).map(k=>{const P=PATTERN[k];","      +['simple','double'].map(k=>{const P=PATTERN[k];"]]],
  ['conseil : un corps peut se calculer','conseils',[['src/46-tips.js',"const tipCorps=t=>typeof t.d==='function'?t.d():t.d;",'const tipCorps=t=>t.d;']]],
  /* la garde directionnelle */
  ['garde : la hauteur ouvre la fenetre','garde',[['src/24-combat.js',"  return parryWin()*(P.win||1)*(a>=1?1.6:a>0?1.15:.55);",'  return parryWin()*(P.win||1);']]],
  ['garde : la hauteur encaisse','garde',[['src/24-combat.js',"    const inc=raw*(q===1?(acc>=1?.12:acc>0?.17:.30):1);",'    const inc=raw*(q===1?.20:1);']]],
  ['garde : le bouclier ne couvre que les voisines','garde',[['src/24-combat.js',"  if(grip().k==='bouclier'&&S.eq.main2&&(VOISINE[g]||[]).includes(d))return .5;","  if(grip().k==='bouclier'&&S.eq.main2)return .5;"]]],
  ['garde : ce qui vient de loin ne se pare pas','garde',[['src/24-combat.js',"  if(!d)return 0;                        /* ce qui vient de loin ne se pare pas */",'  if(!d)return 1;']]],
  ['module : la fiche annonce l etat pose','modificateurs',[['src/35-panel-magie.js',"          +(c.status&&STATUS[c.status.k]?' · '+STATUS[c.status.k].g+' '+STATUS[c.status.k].n.toLowerCase()",'          +(false?'+"''"]]],
  ['prose : l annee garde son nom','prose',[['src/29-render.js','Math.floor(S.day/ANNEE)+1,jr=Math.floor(S.day%ANNEE)+1','Math.floor(S.day/120)+1,jr=Math.floor(S.day%120)+1']]],
  ['prose : quatre saisons font une annee','prose',[['src/18-weather.js','const ANNEE=120,SAISON=ANNEE/4;','const ANNEE=120,SAISON=25;']]],
  /* les parures utilitaires */
  ['parure : le troc paie','parures',[['src/12-npc.js',"    *(1+(typeof util==='function'?util().troc:0)));}","    );}"]]],
  ['parure : la veine nourrit le gisement','parures',[['src/07-worldgen.js',"    *(1+(typeof util==='function'?util().veine:0)));",'  );']]],
  ['parure : la ligne mord plus vite','parures',[['src/26b-peche.js',"    *(1-(typeof util==='function'?util().ligne:0)));",'  );']]],
  ['parure : la bourse gonfle le butin','parures',[['src/24-combat.js',"    *(1+(typeof util==='function'?util().bourse:0)));",'  );']]],
  ['parure : la lettre aide a lire','parures',[['src/25-modules.js',"  +(typeof util==='function'?util().lettre:0);",';']]],
  ['plat : le panneau l annonce','plats',[['src/36-panel-table.js',"       return '<div class=\"meta\">Cela donnera : <b>'+pl.g+' '+pl.n+'</b> — '+pl.d","       return '';const z=pl.d"]]],
  ['plat : le compte des recettes','plats',[['src/36-panel-table.js',"  h+='<div class=\"card\"><div class=\"meta\">Recettes reconnues : <b>'+vus.length+' / '+PLAT.length+'</b> — '","  h+='<div class=\"card\"><div class=\"meta\">'+('"]]],
  ['passif : le resume se calcule','passifs',[['src/35-panel-magie.js','  const dits=Object.keys(PA).filter(k=>PA[k])',"  const dits=['dmg','pierce','win'].filter(k=>PA[k])"]]],
  ['attelage : le refus nomme la bete','attelages',[['src/22b-vehicules.js',"    return 'il faut une bête apprivoisée dans ton escorte';",'    return null;']]],
  ['attelage : la fiche dit le terrain','attelages',[['src/30-panel-monde.js',"        +vehTerrain(D2)+","        +\"\"+"]]],
  ['fiole : le plan sait la boire','fioles',[['src/19b-consignes.js',"  if(p.e==='garrot')return hasStatus(S,'saignement');",'']]],
  ['collection : ou chercher','collection',[['src/48b-panel-collection.js',"    if(OU[f.k])h+='<div class=\"card\"><div class=\"meta\">Où : '+OU[f.k]+'</div></div>';",'']]],
  /* les fioles */
  ['fiole : la satiete ralentit la faim','fioles',[['src/28-loop.js',"    *(1-Math.min(.6,buffOf('satiete'))));",'    );']]],
  ['fiole : le second souffle tient','fioles',[['src/14-food.js',"poserBuff('regen',+(1.2*v).toFixed(1)","poserBuff('regen',0"]]],
  ['fiole : le garrot ferme la plaie','fioles',[['src/14-food.js',"    fait(){return soigner('saignement','le garrot serre')?'la plaie se ferme':'rien qui saigne';}},","    fait(){return 'rien';}},"]]],
  /* les attelages */
  ['attelage : la roue ne monte pas','attelages',[['src/22b-vehicules.js','  if(rude&&!D.tout)return false;','']]],
  ['attelage : une bete demande une bete','attelages',[['src/22b-vehicules.js',"  if(D.bete&&!(S.comps||[]).some(x=>x.esc&&!x.dead&&x.type==='bete'))return false;",'']]],
  ['attelage : le traineau veut de la neige','attelages',[['src/22b-vehicules.js','    m*=froid?.82:1.55;','    m*=1;']]],
  /* les plats */
  ['plat : le plus exigeant gagne','plats',[['src/14-food.js','  for(const p of PLAT){let ok=false;try{ok=!!p.quand(t);}catch(e){ok=false;}if(ok)return p;}','  return PLAT[PLAT.length-1];']]],
  ['plat : il entre dans la collection','plats',[['src/14-food.js',"  collecte('plat',plat.k);",'']]],
  ['plat : son bonus de nutrition compte','plats',[['src/14-food.js','*harmonie*plat.nutr;','*harmonie;']]],
  /* les postures */
  ['posture : le souffle se paie','postures',[['src/24-combat.js','  let cost=(heavy?18:sd.end)*(1+PA.endcost);','  let cost=(heavy?18:8)*(1+PA.endcost);']]],
  ['posture : les touches comptent les postures','postures',[['src/50-input.js','&&+e.code.slice(5)<=STANCE.length','&&+e.code.slice(5)<=4']]],
  /* les ordres d escorte */
  ['ordre : le soigneur soigne','ordres',[['src/15-companions.js','        S.hp=Math.min(maxHp(),S.hp+h);','']]],
  ['ordre : le soigneur ne frappe pas','ordres',[['src/15-companions.js',"    if(O.soin){","    if(false){"]]],
  ['ordre : le geneur ralentit','ordres',[['src/15-companions.js',"      addStatus(tgt,'ralenti',2.5+c.lv*.04,1);",'']]],
  ['ordre : la roue compte ses ordres','ordres',[['src/50-input.js','+1)%ORDK.length];}','+1)%4];}']]],
  /* les donjons */
  ['donjon : chaque theme a son gardien','donjons',[['src/17b-gardiens.js',"  temple:{n:'Le Noyeur',g:'溺',cre:'crocodile',","  temple0:{n:'Le Noyeur',g:'溺',cre:'crocodile',"]]],
  ['donjon : les salles suivent le theme','donjons',[['src/17-dungeon.js','  temple:{autel:3,puits:2,biblio:1.5},fonderie:{armurerie:3,tresor:1.5,garde:1.5},nid:{cache:2.5,tresor:2,piege:1.5}};','};']]],
  /* les modificateurs */
  ['module : le modificateur multiplie','modificateurs',[['src/25-modules.js',"      if(def.mul){for(const k in def.mul)pend[k]=(k==='count')?pend[k]*def.mul[k]:(k==='echo'?pend.echo+def.mul[k]:pend[k]*def.mul[k]);}",'']]],
  ['module : le statut passe au suivant','modificateurs',[['src/25-modules.js','      if(def.status)pend.status=def.status;','']]],
  ['module : le cout en vie se paie','modificateurs',[['src/25-modules.js','      if(def.hp)pend.hp+=def.hp;','']]],
  ['lieu : le puits suit le mineur','six lieux',[['src/07b-lieux.js',"        const n=ri(3,7)+Math.floor(lv('minage')/10);",'        const n=ri(3,7);']]],
  ['lieu : la fumerolle suit l alchimiste','six lieux',[['src/07b-lieux.js',"        const n=ri(3,8)+Math.floor(lv('alchimie')/10);",'        const n=ri(3,8);']]],
  ['lieu : le champ suit l assembleur','six lieux',[['src/07b-lieux.js',"        const nb=ri(1,3)+Math.floor(lv('assemblage')/18);",'        const nb=ri(1,3);']]],
  /* les six lieux */
  ['lieu : le puits descend','six lieux',[['src/07b-lieux.js',"      if(c.depth<5){c.depth++;c.dug=0;bas=' · tu debouches dans la strate '+c.depth+' ('+STRATA[c.depth].n+')';}",'']]],
  ['lieu : l arbre donne des semences','six lieux',[['src/07b-lieux.js','      const graines=Object.keys(MAT).filter(m=>MAT[m].crop&&MAT[m].nutr>0&&!MAT[m].tox);',"      const graines=['fer'];"]]],
  ['lieu : le champ rend des composants','six lieux',[['src/07b-lieux.js','      const cts=Object.keys(COMP);','      const cts=[];']]],
  ['lieu : la fumerolle chauffe','six lieux',[['src/07b-lieux.js',"      poserBuff('isofroid',40,1200,'Vapeurs chaudes');",'']]],
  ['lieu : l epave paie','six lieux',[['src/07b-lieux.js',"      const or=ri(10,60)+lv('perception_sk')*3;S.or+=or;","      const or=0;"]]],
  /* les gestes */
  ['geste : il s inscrit quand il s arme','gestes',[['src/24-combat.js',"  if(typeof collecte==='function')collecte('geste',e.pat);",'']]],
  ['geste : le souffle porte loin','gestes',[['src/23c-creatures.js',"souffle: {n:'souffle',g:'息',wm:1.7,dm:1.05,hits:1,aoe:1,dist:1,st:'brulure'},","souffle: {n:'souffle',g:'息',wm:1.7,dm:1.05,hits:1,aoe:1,st:'brulure'},"]]],
  ['geste : la variete n est pas une remise','gestes',[['src/23c-creatures.js',"harcele: {n:'harcèlement',g:'翔',wm:.55,dm:.58,","harcele: {n:'harcèlement',g:'翔',wm:.55,dm:.20,"]]],
  ['absence : la peche rapporte','absence',[['src/19-idle.js',"  } else if(S.occ==='peche'&&rt.harv>0){","  } else if(false){"]]],
  ['absence : le percement descend','absence',[['src/19-idle.js',"  } else if(S.occ==='percer'&&rt.harv>0){","  } else if(false){"]]],
  ['absence : elle collectionne aussi','titres',[['src/19-idle.js','    colBalayer();','']]],
  ['absence : elle nomme les titres tombes','titres',[['src/19-idle.js','      const gagnes=hfAcquis().filter(k=>avant.indexOf(k)<0);','      const gagnes=[];']]],
  /* les titres */
  ['titre : ils se decrochent','titres',[['src/48-collection.js',"  if(typeof hfBalayer==='function')hfBalayer();",'']]],
  ['titre : le bestiaire compte les morts','titres',[['src/49-hautsfaits.js','const hfMorts=()=>Object.values(S.bes||{}).reduce((a,b)=>a+(b.t||0),0);','const hfMorts=()=>0;']]],
  ['titre : les cases vues comptent','titres',[['src/49-hautsfaits.js','const hfCases=()=>Object.keys(S.world||{}).filter(k=>S.world[k]&&S.world[k].seen).length;','const hfCases=()=>0;']]],
  ['titre : les rangs de guilde comptent','titres',[['src/49-hautsfaits.js','const hfRang=()=>Object.values(S.guilds||{}).reduce((a,g)=>Math.max(a,g.rank||0),0);','const hfRang=()=>0;']]],
  /* l erudition */
  ['erudition : un pour cent par famille','erudition',[['src/09-progress.js',"  if(typeof colErudition==='function')mul*=1+colErudition();",'']]],
  ['erudition : les biomes font marcher plus vite','erudition',[['src/28-loop.js',"  const ery=(typeof colComplete==='function'&&colComplete('biome'))?.9:1;","  const ery=1;"]]],
  ['erudition : le bestiaire paie en butin','erudition',[['src/24-combat.js',"  const ercre=(typeof colComplete==='function'&&colComplete('creature'))?1:0;",'  const ercre=0;']]],
  ['erudition : les modules ouvrent un livre de plus','erudition',[['src/25-modules.js',"      +((typeof colComplete==='function'&&colComplete('module'))?1:0);",'      ;']]],
  ['erudition : la recolte revient plus pleine','erudition',[['src/26-harvest.js',"    const bonus=(typeof colComplete==='function'&&colComplete('mat')&&Math.random()<.35)?1:0;",'    const bonus=0;']]],
  /* les boyaux */
  ['boyau : le rythme casse','boyaux',[['src/24-combat.js','    *(geneIci()?1/1.4:1);','    ;']]],
  ['boyau : pas de balayage','boyaux',[['src/24-combat.js',"  if(swp&&etroitIci()){swp=0;if(hitN<=1)log('<span class=\"bd\">La hampe cogne la paroi — pas de place pour faucher.</span>');}",'']]],
  ['boyau : le clang se paie','boyaux',[['src/24-combat.js','  if(geneIci())cost*=1.25;','']]],
  ['boyau : une grande salle n en est pas un','boyaux',[['src/24-combat.js',"  if(typeof caverne==='function'&&caverne(here())===1)return true;","  if(typeof caverne==='function'&&caverne(here())>=1)return true;"]]],
  ['boyau : une lame courte ne subit rien','boyaux',[['src/24-combat.js','  return !F.dist&&F.reach>=2;','  return !F.dist;']]],
  /* le scriptorium */
  ['collection : le filtre retire ce qu on a deja','collection',[['src/48b-panel-collection.js',"    h+='<div class=\"matlist\">'+tout.filter(k=>!seulManque||!eus.includes(k)).map(k=>{","    h+='<div class=\"matlist\">'+tout.map(k=>{"]]],
  ['collection : le plus pres du bout vient en premier','collection',[['src/48b-panel-collection.js','    .filter(f=>f.m>0).sort((x,y)=>x.m-y.m);','    .filter(f=>f.m>0);']]],
  ['veille : la cadence se perime en changeant de matiere','absence',[['src/19-idle.js',"  const bonne=k==='harv'?(S.occ!=='recolte'||R.harvSur===S.target)","  const bonne=k==='harv'?true"]]],
  ['veille : le plafond de huit heures se dit','absence',[['src/19-idle.js','  if(sec>capH*3600+60)','  if(false)']]],
  ['veille : le filon tari se dit','absence',[['src/19-idle.js','    if(n<veut)r.push(n?','    if(false)r.push(n?']]],
  ['corruption : le foyer rayonne sur les diagonales','corruption',[['src/27-clock.js','        if(!dx&&!dy)continue;'+String.fromCharCode(10)+'        monte(S.world[key(c.x+dx,c.y+dy)],1);','        if(dx&&dy)continue;'+String.fromCharCode(10)+'        monte(S.world[key(c.x+dx,c.y+dy)],1);']]],
  ['corruption : le foyer a un plafond','corruption',[['src/27-clock.js','      const plaf=Math.min(100,(c.corr0||0)+(maj?25:10));','      const plaf=100;']]],
  ['corruption : le monde revient a son bruit','corruption',[['src/27-clock.js','    if(z.corr>base)z.corr=Math.max(base,z.corr-1);','    if(false)z.corr=Math.max(base,z.corr-1);']]],
  ['corruption : ce que tu tiens repousse','corruption',[['src/27-clock.js',"    if(presse[k]&&z.corr>Math.max(0,base-40)){z.corr=Math.max(0,z.corr-1);civ++;continue;}","    if(presse[k]&&z.corr>Math.max(0,base-40)){civ++;continue;}"]]],
  ['corruption : un village presse aussi','corruption',[['src/27-clock.js',"    if(!z.claim&&z.poi!=='village'&&!z.town)continue;","    if(!z.claim)continue;"]]],
  ['rare : le trophee tombe a coup sur','monstre rare',[['src/24-combat.js',"  if(K.rare&&!K.gard&&!K.boss&&typeof mkParure==='function'){","  if(false&&K.rare&&!K.gard&&!K.boss&&typeof mkParure==='function'){"]]],
  ['rare : le budget renforce est tenu','monstre rare',[['src/10c-bijoux.js','    if(a.don){if(donPris)continue;donPris=true;}','    if(a.don){if(donPris)break;donPris=true;}']]],
  ['rare : le plafond ordinaire ne bouge pas','monstre rare',[['src/10c-bijoux.js','  const n=budget||Math.min(P.aff[1],Math.max(P.aff[0],Math.round(P.aff[0]+(q-1)*1.2)));','  const n=budget||Math.max(P.aff[0],Math.round(P.aff[0]+(q-1)*1.2));']]],
  ['rare : la matiere vient de la bete','monstre rare',[['src/24-combat.js','      const mat=sien.length?pick(sien):pick(dispo);','      const mat=pick(dispo);']]],
  ['rare : un sac plein reste plein','monstre rare',[['src/24-combat.js','    if(sacPlein()){','    if(false){']]],
  ['munitions : la pointe de fer perce','munitions',[['src/24-combat.js',"  let pierce=PA.pierce+(MU?MU.pierce:0);",'  let pierce=PA.pierce;']]],
  ['munitions : le trait porte ce qu on encoche','munitions',[['src/24-combat.js','  if(MU)base*=1+MU.dmg;','  if(MU)base*=1;']]],
  ['munitions : le carquois se vide','munitions',[['src/24-combat.js','  if(MU)muniConsommer();','  if(0)muniConsommer();']]],
  ['munitions : une bille ne part pas d un arc','munitions',[['src/10d-munitions.js',"  if(!D||D.pour!==w.fn||!muniDe(S.carquois))return null;",'  if(!D)return null;']]],
  ['munitions : le sifflement fait fuir','munitions',[['src/24-combat.js','  if(e.sif)p*=1.8;','  if(e.sif)p*=1;']]],
  ['scriptorium : on comble sa lacune','scriptorium',[['src/14b-consommables.js','      doms.sort((a,b)=>connus[a]-connus[b]);','      doms.sort((a,b)=>connus[b]-connus[a]);']]],
  ['scriptorium : la difficulte suit la lecture','scriptorium',[['src/14b-consommables.js',"      const diff=Math.max(2,Math.min(12,2+Math.floor(lv('lecture')/6)));",'      const diff=4;']]],
  ['scriptorium : on n ecrit que ce qu on sait','scriptorium',[['src/14b-consommables.js',"      if(!doms.length)return 'aucun domaine pratiqué — le papier reste blanc';","      if(!doms.length){S.books.push({id:'b'+(S.nid++),dom:'feu',diff:4});return 'x';}"]]],
  /* les cultures */
  ['culture : douze pour un humain','cultures',[['src/05-data-social.js',"cult:['latine','nordique','germanique','hellenique','slave','celte','sino','nipponne','arabo','persane','bantoue','andine'],pot:{}},","cult:['latine','nordique'],pot:{}},"]]],
  ['culture : la collection les compte','cultures',[['src/48-collection.js',"  for(const k in (S.kd||{}))(S.kd[k]||[]).forEach(r=>{if(r&&r.cult)collecte('culture',r.cult);});",'']]],
  /* les proies */
  ['proie : elle ne riposte pas','proies',[['src/28-loop.js',"    if(typeof creFuirTick==='function'&&creFuirTick(e,dt)){e.w=-1;e.tt=0;continue;}",'']]],
  ['proie : enracinee, plus de sortie','proies',[['src/24-combat.js',"  if(hasStatus(e,'enracine'))return 0;",'']]],
  ['proie : la perception la retient','proies',[['src/24-combat.js',"  p*=Math.max(.35,1-(lv('perception_sk')*.012+lv('discretion')*.008));",'']]],
  ['proie : le gibier rare se defend','proies',[['src/24-combat.js','  if(!e||!e.fuit||e.boss||e.rare)return false;\n  e.fui=(e.fui||0)+dt;','  if(!e||!e.fuit)return false;\n  e.fui=(e.fui||0)+dt;']]],
  /* l anatomie */
  ['anatomie : la zone multiplie','anatomie',[['src/24-combat.js','    d*=Z.mult;','']]],
  ['anatomie : la visee penche le tirage','anatomie',[['src/24-combat.js',"  const w=k=>ZONE[k].w*(k==='tete'?1+v*6:1);","  const w=k=>ZONE[k].w;"]]],
  ['anatomie : la visee sort de l arme','anatomie',[['src/24-combat.js','const viseeDe=(F,PA)=>Math.max(0,Math.min(1,(21-(F.crit||20)+(PA?PA.crit||0:0))/20));','const viseeDe=()=>.2;']]],
  ['symetrie : l equipement au niveau','symetrie',[['src/24c-symetrie.js','const q=Math.max(.5,Math.min(1.8,.5+lv/25));','const q=1;']]],
  ['lecture : l echec est gradue','jet decide',[['src/25-modules.js','const grave=marge<=-10||brut===1;','const grave=false;']]],
  ['lecture : la reussite large','jet decide',[['src/25-modules.js','+(large?2:0)\n','+0\n']]],
  /* les cavernes */
  ['caverne : deux champs croises','cavernes',[['src/07d-cavernes.js',"  return (Math.abs(a-.5)<.085&&Math.abs(b-.5)<.085)?1:0;",'  return (Math.abs(a-.5)<.085)?1:0;']]],
  ['caverne : pas sous le ciel','cavernes',[['src/07d-cavernes.js','  if(d<2)return 0;','']]],
  ['caverne : les concretions','cavernes',[['src/07-worldgen.js',"  if(typeof cavMats==='function')cavMats(c).forEach(m=>l.push(m));",'']]],
  /* les rivieres */
  ['riviere : elle descend','rivieres',[['src/07c-rivieres.js','      if(na<ba){ba=na;bx=x+dx;by=y+dy;}','      if(na>ba){ba=na;bx=x+dx;by=y+dy;}']]],
  ['riviere : on y peche','rivieres',[['src/26b-peche.js','  if(rivDe(c)>0)return true;','']]],
  ['riviere : la barque y passe','rivieres',[['src/22b-vehicules.js','||rivDe(z)>=2;',';']]],
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
    "+(typeof meubleIci==='function'?Math.min(6,meubleIci('bibliotheque')*3):0)",'']]],
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
