/* Sensen Mini — 44-panel-veille.js
   Onglet pAuto */

let newGameArmed=false,saveIO=null;
function pAuto(){
  let h='<p class="hint">Tout ce que tu fais à la main se rachète. Le jeu doit tourner quand tu ne regardes pas — et à ton retour, l\'absence se résout par formules, à la cadence que tu tenais réellement, jamais par une simulation accélérée.</p>';
  /* les têtes de section affichent un résumé : tout ce qu'elles lisent se calcule ici */
  const ch=S.chron||[];
  const an=d=>Math.floor(d/ANNEE)+1,jr=d=>Math.floor(d%ANNEE)+1;
  const rk=rackElements();
  const rt=S.rate||{};
  const est=k=>{const o=(rt[k]||0),e=cadence(k);
    return e.toFixed(1)+(o>0?'':' <i style="font-style:normal;color:var(--terre)">(estimée)</i>');};
  /* ===== CONSIGNES =====
     Les automatisations achètent des réflexes ; les consignes disent ce que
     le personnage FAIT de sa journée. Elles passent en premier parce qu'elles
     décident de tout le reste. */
  const P=plan(),actif=planChoix();
  h+=foldHead('veille','cs','令','CONSIGNES',
    (P.on?(actif?'en cours : '+ACTES[actif.a].n:'aucune ne s\'applique'):'à l\'arrêt')
    +' · '+P.r.filter(r=>r.on).length+' / '+P.r.length+' actives','cs');
  if(foldOpen('veille','cs','cs')){
    h+='<div class="card"><div class="meta">Une consigne se lit comme une phrase : <b>SI</b> telle chose, <b>ALORS</b> telle action. À chaque examen, la <b>première</b> dont la condition est vraie et dont l\'action est possible l\'emporte — les suivantes ne sont pas consultées. C\'est l\'ordre qui décide, et c\'est tout le pouvoir qu\'on te donne ici.</div>'
     +'<div class="meta">Rien ne s\'interrompt en cours de route : un ouvrage, un voyage, un sommeil se terminent d\'abord.</div>'
     +'<div class="row"><button class="btn'+(P.on?' pri':'')+'" data-planon="1">'
     +(P.on?'令 Consignes actives — arrêter':'令 Suivre les consignes')+'</button>'
     +'<button class="btn" data-planadd="1" '+(P.r.length>=12?'disabled':'')+'>Ajouter une ligne</button>'
     +'<button class="btn" data-planreset="1">Repartir du plan de base</button></div></div>';
    h+=P.r.map((r,i)=>{
      const C=CONDS[r.c],A=ACTES[r.a];
      const vivante=r===actif;
      return '<div class="card'+(vivante?' on':(r.on?'':' off'))+'">'
       +'<div class="row ligne"><button class="btn" data-planoff="'+i+'" style="flex:none;min-width:34px">'
       +(r.on?'✓':'—')+'</button>'
       +'<select data-plancond="'+i+'" style="flex:1">'+CONDK.map(k=>'<option value="'+k+'"'
         +(k===r.c?' selected':'')+'>'+(/^i/.test(CONDS[k].n)?'s\'':'si ')+CONDS[k].n+'</option>').join('')+'</select>'
       /* Une condition qui porte sur un CHOIX — laquelle des huit fioles —
          ne se regle pas avec un compteur : elle se choisit dans une liste. */
       +(C&&C.liste?'<select data-planval="'+i+'" style="flex:none;width:120px">'
         +Object.keys(POTEFF).map(k=>'<option value="'+k+'"'+(k===r.v?' selected':'')+'>'+POTEFF[k].n+'</option>').join('')
         +'</select>'
       :C&&C.def!==undefined?'<input type="number" data-planval="'+i+'" value="'+r.v+'" min="'+C.min+'" max="'+C.max+'" '
         +'style="width:66px;flex:none;background:var(--sumi);color:var(--bone);border:1px solid var(--line2);'
         +'font-family:var(--px);font-size:11px;padding:5px">':'')
       +'</div>'
       +'<div class="row ligne" style="margin-top:4px"><span class="meta" style="flex:none">alors</span>'
       +'<select data-planacte="'+i+'" style="flex:1">'+ACTK.map(k=>'<option value="'+k+'"'
         +(k===r.a?' selected':'')+'>'+ACTES[k].g+' '+ACTES[k].n+'</option>').join('')+'</select>'
       +'<button class="btn" data-planup="'+i+'" style="flex:none" '+(i===0?'disabled':'')+'>▲</button>'
       +'<button class="btn" data-plandown="'+i+'" style="flex:none" '+(i===P.r.length-1?'disabled':'')+'>▼</button>'
       +'<button class="btn" data-plandel="'+i+'" style="flex:none;border-color:var(--zhu)">✕</button></div>'
       +'<div class="meta">'+(C?C.d:'')+(C&&A&&C.d&&A.d?' · ':'')+(A?A.d:'')
       +(vivante?' <b style="color:var(--jade)">— c\'est elle qui s\'applique</b>':'')+'</div>'
       +'</div>';
    }).join('');
  }
  /* Trois automatismes touchent au combat et vivent desormais dans 闘 COMBAT :
     la garde reflexe, la Communion des cinq, le detonateur. Ceux qui restent
     ici travaillent quand on ne regarde pas, ce qui est le propos de la veille. */
  const AKV=AK.filter(k=>['garde','rotation','deto'].indexOf(k)<0);
  h+=foldHead('veille','au','自','AUTOMATISATIONS',AKV.filter(k=>auto(k)).length+' / '+AKV.length+' acquises','au');
  if(foldOpen('veille','au')){
  h+=AKV.map(k=>{const a=AUTOS[k],l=auto(k),c=autoCost(k),m=l>=a.max;
    return '<div class="card'+(l?' on':'')+'"><h3><span>'+a.g+' '+a.n+'</span><i>rang '+l+'/'+a.max+'</i></h3>'
     +'<div class="meta">'+a.d+'</div>'
     +'<div class="row"><button class="btn pri" data-auto="'+k+'" '+(m||S.or<c?'disabled':'')+'>'
     +(m?'au maximum':c+' or')+'</button></div></div>';}).join('');
  /* conseils */
  }
  h+=foldHead('veille','co','助','CONSEILS',S.tips===false?'mode vétéran':(Object.keys(S.seen||{}).length+' / '+TIPS.length+' vus'));
  if(foldOpen('veille','co')){
  h+='<div class="card"><div class="meta">Les conseils n\'apparaissent qu\'une fois chacun, à la première occasion — information pure, rien n\'est verrouillé derrière.</div>'
   +'<div class="row"><button class="btn" data-tips="1">'+(S.tips===false?'Réactiver les conseils':'Mode vétéran — tout couper')+'</button></div></div>';
  }
  h+=foldHead('veille','ch','史','CHRONIQUE',ch.length?ch.length+' faits · AN '+an(S.day)+' J'+jr(S.day):'rien encore');
  if(foldOpen('veille','ch')){
  h+='<div class="card"><div class="meta">'
   +(S.deaths?S.deaths+' fois tombé · ':'jamais tombé · ')
   +(S.plats||0)+' plats · '+S.claims.length+' cellules · '+S.items.length+' objets en sac · '
   +Object.keys(S.recipes||{}).length+' recettes · '+(S.modules||[]).length+' modules · '
   +S.npcs.filter(n=>n.rec).length+' résidents</div>'
   +'<div class="meta">Niveau de combat '+combatLvl()+' · niveau général '+genLvl()+' · '+S.or+' or</div></div>';
  if(ch.length){
    h+='<div class="chron">'+ch.slice(0,60).map(e=>
      '<div class="ce"><b>'+e.g+'</b><span class="cd">AN '+an(e.d)+' J'+jr(e.d)+'</span>'
      +'<span class="ct">'+e.t+(e.n>1?' <i>×'+e.n+'</i>':'')+(e.s?'<small>'+e.s+'</small>':'')+'</span></div>').join('')+'</div>';
    if(ch.length>60)h+='<div class="meta">… et '+(ch.length-60)+' entrées plus anciennes, gardées jusqu\'à '+CHRON_MAX+'.</div>';
  } else h+='<p class="hint">Rien de notable encore. La chronique retient les seuils franchis, les trouvailles et les morts — pas les coups.</p>';
  /* partie : sons, sauvegarde, nouvelle partie */
  }
  /* la gestion de la partie a son propre onglet : elle etait introuvable ici */
  h+='<div class="meta" style="margin:10px 0">Sauvegarde, sons, conseils et triche ont leur place dans l\'onglet <b>設 PARAMÈTRES</b>.</div>';
  /* La programmation du combat a son propre onglet : 闘 COMBAT. Elle n'a
     jamais eu sa place ici — la veille dit ce que le personnage fait quand
     on ne regarde pas, le combat dit comment il frappe quand on regarde. */
  h+='<div class="meta" style="margin:10px 0">Enchaînement des coups, rotation des compagnons, râtelier et postures : onglet <b>闘 COMBAT</b>.</div>';
  h+=foldHead('veille','ca','率','CADENCE','ce que la veille rendra');
  if(foldOpen('veille','ca')){
  h+='<div class="card"><div class="meta">'
   +'combat '+est('kill')+' créatures/min · récolte '+est('harv')+'/min · '
   +'atelier '+est('craft')+'/min · salles de donjon '+(rt.djroom||0).toFixed(1)+'/min</div>'
   +'<div class="meta">Hors-ligne : 60 % de cette cadence, plafonné à 8 h. Faute de cadence observée, elle est <b>calculée</b> — le temps d\'un coup de pioche est connu à la seconde près. Les semaines de territoire, elles, se résolvent toutes.</div>'
   +'<div class="meta">Pendant l\'absence, on mange sur le garde-manger et les vivres : garnis-les avant de fermer.</div>'
   +'<div class="meta">Occupation qui tournera : <b>'+({repos:'repos',combat:'combat',donjon:'donjon',recolte:'récolte de '+(S.target?matName(S.target):'—'),atelier:'atelier',explore:'exploration',dormir:'sommeil'}[S.occ]||S.occ)+'</b></div></div>';
  }
  return h;
}
