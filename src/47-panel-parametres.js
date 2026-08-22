/* Sensen Mini — 47-panel-parametres.js
   Onglet pParam : sauvegarde, confort, et triche assumée */

/* ==================================================================
   PARAMÈTRES
   La gestion de la partie vivait au fond de l'onglet VEILLE, entre les
   automatisations et le râtelier — un endroit qu'on ne trouve pas quand
   on cherche « comment j'efface ma partie ». Elle a maintenant sa place.

   Et la triche est assumée : c'est un jeu solo, personne n'a rien à
   prouver. Les boutons disent exactement ce qu'ils font, et le jeu
   compte les fois où l'on s'en sert — non pour faire la leçon, mais
   pour qu'on sache dans quel état est sa propre partie.
   ================================================================== */

let effaceArme=false;

/* Chaque triche passe par ici : elle agit, elle se compte, elle le dit. */
function tricher(quoi,fn){
  fn();
  S.triche=(S.triche||0)+1;
  log('<span class="bd">Triche : '+quoi+'</span>');
  paint();
}

function pParam(){
  let h='<p class="hint">Tout ce qui touche à la partie elle-même : la sauvegarde, le confort de jeu, et de quoi tordre les règles si l\'envie prend. C\'est un jeu solo — personne n\'a rien à prouver à personne.</p>';

  /* ----- les touches ----- */
  h+=foldHead('param','kb','鍵','TOUCHES',navigator&&navigator.maxTouchPoints>0?'clavier, si tu en as un':'clavier','kb');
  if(foldOpen('param','kb','kb')){
    h+='<div class="card"><div class="meta">'
     +'<b>Partout</b> — <kbd>[</kbd> et <kbd>]</kbd> : onglet précédent, onglet suivant, dans l\'ordre des familles. '
     +'<kbd>Échap</kbd> : revenir au monde. Hors combat, <kbd>←</kbd> et <kbd>→</kbd> font la même chose que les crochets.'
     +'</div><div class="meta"><b>En combat</b> — <kbd>espace</kbd> : garde et parade. <kbd>D</kbd> : frappe lourde. '
     +'<kbd>1</kbd> à <kbd>4</kbd> : posture. <kbd>Tab</kbd>, <kbd>←</kbd>, <kbd>→</kbd> : changer de cible. <kbd>F</kbd> : rompre.'
     +'</div><div class="meta">Rien ne se déclenche pendant que tu écris dans un champ.</div></div>';
  }

  /* ----- sauvegarde ----- */
  h+=foldHead('param','sv','保','SAUVEGARDE',S.nom+' · semaine '+S.week,'sv');
  if(foldOpen('param','sv','sv')){
    h+='<div class="card"><div class="meta">La sauvegarde vit dans ce navigateur, et nulle part ailleurs. Pour la passer d\'un appareil à l\'autre : exporter ici, coller là-bas. Vider les données du site l\'efface.</div>'
     +'<div class="row"><button class="btn" data-export="1">Exporter</button>'
     +'<button class="btn" data-import="1">Importer</button></div>'
     +(saveIO==='export'?'<textarea id="saveTxt" readonly style="width:100%;height:90px;margin-top:6px;font-family:var(--px);font-size:10px;background:var(--sumi);color:var(--bone);border:1px solid var(--line2)">'+exportSave()+'</textarea>'
       +'<div class="row"><button class="btn" data-copysave="1">Copier</button><button class="btn" data-closeio="1">Fermer</button></div>':'')
     +(saveIO==='import'?'<textarea id="saveTxt" placeholder="colle ici une sauvegarde exportée" style="width:100%;height:90px;margin-top:6px;font-family:var(--px);font-size:10px;background:var(--sumi);color:var(--bone);border:1px solid var(--line2)"></textarea>'
       +'<div class="row"><button class="btn pri" data-doimport="1">Charger cette sauvegarde</button><button class="btn" data-closeio="1">Annuler</button></div>':'')
     +'</div>';
    /* l'effacement, séparé et à double détente */
    h+='<div class="card"><h3><span>Effacer la partie</span><i>sans retour</i></h3>'
     +'<div class="meta">Le personnage, le monde exploré, le territoire, le bestiaire : tout part. Exporte d\'abord si tu veux pouvoir revenir.</div>'
     +'<div class="row"><button class="btn'+(effaceArme?' pri':'')+'" data-effacer="1" style="border-color:var(--zhu)">'
     +(effaceArme?'Confirmer — tout effacer maintenant':'Effacer la sauvegarde')+'</button>'
     +(effaceArme?'<button class="btn" data-annuler="1">Annuler</button>':'')+'</div></div>';
  }

  /* ----- confort ----- */
  h+=foldHead('param','cf','聞','CONFORT',(S.sfx===false?'sons coupés':'sons actifs')
    +' · '+(S.tips===false?'conseils coupés':Object.keys(S.seen||{}).length+' / '+TIPS.length+' conseils vus'),null);
  if(foldOpen('param','cf',null)){
    h+='<div class="card"><div class="row">'
     +'<button class="btn" data-sfx="1">'+(S.sfx===false?'Sons : coupés':'Sons : actifs')+'</button>'
     +'<button class="btn" data-tips="1">'+(S.tips===false?'Conseils : mode vétéran':'Conseils : actifs')+'</button>'
     +'</div><div class="meta">Les conseils ne paraissent qu\'une fois chacun, à la première rencontre de ce qu\'ils expliquent. Le mode vétéran les coupe tous ; les réactiver remet le compteur à zéro.</div></div>';
  }

  /* ----- triche ----- */
  h+=foldHead('param','tr','偽','TRICHE',(S.triche||0)+' fois utilisée'+((S.triche||0)>1?'s':''),null);
  if(foldOpen('param','tr',null)){
    h+='<div class="card"><div class="meta">Rien ici ne se débloque : tout est disponible tout de suite. Le compteur n\'est pas un reproche — c\'est pour que tu saches dans quel état est ta propre partie quand tu y reviendras dans six mois.</div></div>';
    const bloc=(titre,detail,boutons)=>'<div class="card"><h3><span>'+titre+'</span><i>'+detail+'</i></h3>'
      +'<div class="row">'+boutons+'</div></div>';
    const bt=(k,t)=>'<button class="btn" data-triche="'+k+'">'+t+'</button>';
    h+=bloc('Bourse','l\'or entre dans ta poche, pas dans le trésor',
      bt('or100','+100 or')+bt('or1000','+1 000 or')+bt('or100000','+100 000 or'));
    h+=bloc('Corps','points de vie, endurance, mana, faim',
      bt('plein','Tout remplir')+bt('pv','Soigner')+bt('faim','Rassasier'));
    h+=bloc('Compétences','+5 niveaux partout, ou tout à cinquante',
      bt('sk5','+5 partout')+bt('sk50','Tout à 50')+bt('sk1','+1 partout'));
    h+=bloc('Stats','les six stats, et leur potentiel',
      bt('st5','+5 partout')+bt('pot','Potentiel au plein'));
    h+=bloc('Savoir','recettes de composants, alliages, modules de magie',
      bt('recettes','Toutes les recettes')+bt('alliages','Tous les alliages')+bt('modules','Tous les modules'));
    h+=bloc('Atelier','les stations dans le sac, et de la matière',
      bt('stations','Toutes les stations')+bt('mat','200 de chaque matière'));
    h+=bloc('Équipement','une panoplie exceptionnelle, taillée pour ta classe',
      bt('equip','M\'équiper')+bt('artefact','Un artefact'));
    h+=bloc('Monde','la carte, le temps, les automatisations',
      bt('carte','Révéler 15 cases autour')+bt('semaine','Passer une semaine')
      +bt('autos','Toutes les automatisations'));
  }
  return h;
}

/* Ce que fait chaque bouton. Séparé du rendu : le panneau dit, ceci fait. */
const TRICHES={
  or100:['+100 or',()=>{S.or+=100;}],
  or1000:['+1 000 or',()=>{S.or+=1000;}],
  or100000:['+100 000 or',()=>{S.or+=100000;}],
  plein:['tout rempli',()=>{S.hp=maxHp();S.end=100;S.mana=maxMana();S.faim=100;S.st=[];}],
  pv:['soigné',()=>{S.hp=maxHp();S.st=[];}],
  faim:['rassasié',()=>{S.faim=100;}],
  sk1:['+1 à toutes les compétences',()=>{SK.forEach(k=>{S.sk[k].lv++;});}],
  sk5:['+5 à toutes les compétences',()=>{SK.forEach(k=>{S.sk[k].lv+=5;});}],
  sk50:['toutes les compétences à 50',()=>{SK.forEach(k=>{S.sk[k].lv=Math.max(50,S.sk[k].lv);S.sk[k].pot=Math.max(S.sk[k].pot,200);});}],
  st5:['+5 à toutes les stats',()=>{STATS.forEach(([k])=>{S.stats[k]=(S.stats[k]||5)+5;});}],
  pot:['potentiel au plein',()=>{SK.forEach(k=>{S.sk[k].pot=200;});STATS.forEach(([k])=>{S.sx[k].pot=200;});}],
  recettes:['toutes les recettes de composants',()=>{
    S.recipes=S.recipes||{};
    Object.keys(COMP).forEach(ct=>Object.keys(MAT).forEach(m=>{S.recipes[ct+':'+m]=1;}));}],
  alliages:['tous les alliages',()=>{ALK.forEach(k=>{S.recipes=S.recipes||{};S.recipes['alliage:'+k]=1;});}],
  modules:['tous les modules de magie',()=>{
    S.modules=MK.map(id=>({id,dom:MODULE[id].d[0],lv:3,xp:0}));
    S.postures=S.modules.map((m,i)=>i).slice(0,6);}],
  stations:['toutes les stations dans le sac',()=>{S.carry=Object.keys(STATION);}],
  mat:['200 de chaque matière',()=>{Object.keys(MAT).forEach(m=>{S.mat[m]=Math.max(200,S.mat[m]||0);});
    Object.keys(FORM).forEach(f=>Object.keys(MAT).forEach(m=>{if(formOk(f,m))addRef(f,m,20);}));}],
  equip:['équipé de pied en cap',()=>{
    const mats=['adamant','mithril','ebene','cuir','soie','acier'].filter(m=>MAT[m]);
    const arme=CLASSE[S.classe]&&FUNC[CLASSE[S.classe].kit]?CLASSE[S.classe].kit:'epee';
    const mk=fn=>{const p=FUNC[fn].comp.map(ct=>partFor(ct,mats));p.push(partFor('fixations',mats));
      const it=mkItem('arme',fn,p,2.2);it.rar=3;it.slots=2;
      it.aff=tirerN(AFF,3).map(a=>({id:a.id,p:a.r()}));
      return it;};
    S.eq.main1=mk(arme);
    if(!FUNC[arme].dist&&hands(S.eq.main1)===1)S.eq.main2=mk('bouclier');
    SLOTS.filter(x=>x.zone).forEach(sl=>{
      const ct=pick(ARMPARTS),major=partFor(ct,mats);
      const it=mkItem('armure',sl.k,[major,partFor('sangles',mats),partFor('fixations',mats)],2.2);
      it.cons=COMP[ct].cons;it.nom=armorName(sl.k,it.cons,major.mk);it.rar=3;
      it.aff=tirerN(AFF,2).map(a=>({id:a.id,p:a.r()}));
      S.eq[sl.k]=it;});}],
  artefact:['un artefact',()=>{if(typeof dropArtefact==='function')dropArtefact(4);}],
  carte:['quinze cases révélées',()=>{
    for(let x=-15;x<=15;x++)for(let y=-15;y<=15;y++)cell(S.pos[0]+x,S.pos[1]+y).seen=true;}],
  semaine:['une semaine passée',()=>{S.day+=WEEK;S.week=Math.floor(S.day/WEEK);weekly();}],
  autos:['toutes les automatisations',()=>{
    S.auto=S.auto||{};AK.forEach(k=>{S.auto[k]=AUTOS[k].max;});}],
};
function appliquerTriche(k){
  const t=TRICHES[k];if(!t)return;
  tricher(t[0],t[1]);
}
