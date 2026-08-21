/* Sensen Mini — 52-boot.js
   Démarrage, boucle rAF, cycle de vie de l'onglet, service worker
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== INTÉGRITÉ DU CHARGEMENT =====
   Le jeu se charge en cinquante-sept fichiers. Sur un réseau capricieux ou
   un hébergeur qui limite, il suffit qu'un seul échoue pour que la partie
   démarre amputée — sans que rien ne le dise. On vérifie donc quelques
   symboles répartis sur tout l'ordre de chargement, et l'on recharge une
   fois si l'un manque. Une seule fois : au-delà, on l'annonce plutôt que
   de boucler. */
/* Un `const` de portée globale n'est pas une propriété de `window` : on ne peut
   pas le chercher par son nom. On les référence donc directement — un module
   manquant fait lever une ReferenceError, et c'est exactement ce qu'on veut. */
function chargementComplet(){
  try{
    return !!(EL&&MAT&&CAT&&BIOME&&FORM&&COMP&&FUNC&&SLOTS&&MODULE&&DOMAIN&&SKILLS&&SK&&STATS&&RACE&&CLASSE
      &&genCell&&NEW&&gainXp&&gainStat&&mkItem&&partFor&&formeNom&&cutGem&&GEMSPEC&&mkNpc&&linkFamilies&&JOBS
      &&GOV&&GUILDS&&QTPL&&PLANTE&&cook&&escortList&&ORDERS&&PLOT&&MEUBLE&&plots&&genDungeon&&DJTHEME
      &&METEO&&SEASON&&offline&&AUTOS&&STATUS&&addStatus&&KSIZE&&kingdomsNear&&hameauAt&&starterKit&&SHOPDEF
      &&CREATURE&&PATTERN&&VOX&&VOXMAT&&voxelHtml&&matHtml&&compHtml&&heroHtml&&vide&&STANCE&&attack&&compileSpell&&harvestTick&&tickClock&&step&&paint&&grp&&foldHead
      &&pMonde&&pCell&&pAtelier&&pEquip&&pMagie&&pTable&&pVille&&pPnj&&pComps&&pBatir&&pRoyaume
      &&pGuilde&&pSac&&pAuto&&pSkills&&pRecolte&&TIPS&&SFX&&save&&exportSave
      &&buildGate&&applyBirth&&defaultStart&&repLocale&&lawsHere&&handle&&tabsEdges);
  }catch(e){return false;}
}
/* ===== FEUILLE DE STYLE ET CODE DOIVENT ÊTRE DU MÊME ÂGE =====
   Un module manquant se voit ; une feuille de style périmée, non. Elle
   s'applique sans se plaindre, et l'on obtient un jeu en morceaux — des
   règles d'une version appliquées à une géométrie d'une autre. Le cas
   s'est produit : le service worker servait le cache d'abord et
   rafraîchissait fichier par fichier, sans aucune atomicité.
   La feuille déclare donc sa révision, et l'on refuse de démarrer sur un
   désaccord. Les deux valeurs se bougent ensemble. */
const CSS_REV='6';
function styleAJour(){
  try{
    const v=getComputedStyle(document.documentElement).getPropertyValue('--css-rev').trim();
    /* pas de valeur du tout : navigateur trop ancien ou feuille non chargée —
       on ne bloque pas là-dessus, l'absence n'est pas une preuve */
    return !v||v===CSS_REV;
  }catch(e){return true;}
}
/* ===== DÉMARRAGE ===== */
(async()=>{
  if(!styleAJour()){
    let dejaTente=false;
    try{dejaTente=sessionStorage.getItem('sensen:css')==='1';sessionStorage.setItem('sensen:css','1');}catch(e){}
    if(!dejaTente&&/^https?:$/.test(location.protocol)){
      /* vider le cache du service worker avant de recharger : sans cela on
         reviendrait sur la même feuille périmée */
      try{if(self.caches)for(const k of await caches.keys())await caches.delete(k);}catch(e){}
      location.reload();return;
    }
  }
  try{sessionStorage.removeItem('sensen:css');}catch(e){}
  if(!chargementComplet()){
    /* réseau capricieux ou hébergeur qui limite : un fichier sur cinquante-sept
       a manqué. On recharge une fois, puis on l'annonce plutôt que de boucler. */
    let dejaTente=false;
    try{dejaTente=sessionStorage.getItem('sensen:reload')==='1';sessionStorage.setItem('sensen:reload','1');}catch(e){}
    if(!dejaTente&&/^https?:$/.test(location.protocol)){location.reload();return;}
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="toast" style="position:static;margin:12px;max-width:none">'
      +'Le jeu n\'a pas pu charger entièrement — un morceau a manqué à l\'appel. '
      +'Recharge la page : ta sauvegarde est intacte.</div>');
    return;
  }
  try{sessionStorage.removeItem('sensen:reload');}catch(e){}
  const ok=await load();
  here().seen=true;
  if(ok)paint();
  if(ok)$('log').innerHTML=S.log.map(x=>'<div>'+x+'</div>').join('');
  else buildGate();
  let last=performance.now(),acc=0,wall=Date.now();
  requestAnimationFrame(function loop(t){
    const dt=Math.min(.25,(t-last)/1000);last=t;wall=Date.now();
    if(S.race){step(dt);render();}
    acc+=dt;if(acc>15){acc=0;save();}
    requestAnimationFrame(loop);
  });

  /* ----- cycle de vie : indispensable sur téléphone -----
     Quand l'app est masquée (autre appli, écran éteint, changement d'onglet),
     la boucle rAF s'arrête net. On sauvegarde à ce moment-là, et au retour on
     résout le temps écoulé comme une absence si elle dépasse 90 s. */
  const hide=()=>{if(S.race)save();};
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'){hide();return;}
    const el=(Date.now()-wall)/1000;
    last=performance.now();wall=Date.now();
    if(S.race&&absence(el)){sceneMode='';paint();save();}
  });
  addEventListener('pagehide',hide);
  addEventListener('beforeunload',hide);

  /* ----- service worker : jeu hors-ligne et installable -----
     Seulement servi en http(s) (pas en file://) et hors du build mono-fichier. */
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&document.querySelector('link[rel="manifest"]')){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
