/* Sensen Mini — 44-panel-veille.js
   Onglet pAuto */

let newGameArmed=false,saveIO=null;
function pAuto(){
  let h='<p class="hint">Tout ce que tu fais à la main se rachète. Le jeu doit tourner quand tu ne regardes pas — et à ton retour, l\'absence se résout par formules, à la cadence que tu tenais réellement, jamais par une simulation accélérée.</p>';
  h+=grp('自','AUTOMATISATIONS');
  h+=AK.map(k=>{const a=AUTOS[k],l=auto(k),c=autoCost(k),m=l>=a.max;
    return '<div class="card'+(l?' on':'')+'"><h3><span>'+a.g+' '+a.n+'</span><i>rang '+l+'/'+a.max+'</i></h3>'
     +'<div class="meta">'+a.d+'</div>'
     +'<div class="row"><button class="btn pri" data-auto="'+k+'" '+(m||S.or<c?'disabled':'')+'>'
     +(m?'au maximum':c+' or')+'</button></div></div>';}).join('');
  /* conseils */
  h+=grp('助','CONSEILS',S.tips===false?'mode vétéran':(Object.keys(S.seen||{}).length+' / '+TIPS.length+' vus'));
  h+='<div class="card"><div class="meta">Les conseils n\'apparaissent qu\'une fois chacun, à la première occasion — information pure, rien n\'est verrouillé derrière.</div>'
   +'<div class="row"><button class="btn" data-tips="1">'+(S.tips===false?'Réactiver les conseils':'Mode vétéran — tout couper')+'</button></div></div>';
  /* partie : sons, sauvegarde, nouvelle partie */
  h+=grp('保','PARTIE',S.nom+' · semaine '+S.week);
  h+='<div class="card"><div class="row"><button class="btn" data-sfx="1">'+(S.sfx===false?'Sons : coupés':'Sons : actifs')+'</button>'
   +'<button class="btn" data-export="1">Exporter la sauvegarde</button><button class="btn" data-import="1">Importer</button>'
   +'<button class="btn" data-newgame="1" style="margin-left:auto;border-color:var(--zhu)">'+(newGameArmed?'Confirmer : tout effacer':'Nouvelle partie')+'</button></div>'
   +'<div class="meta">La sauvegarde vit dans ce navigateur. Pour la passer d\'un appareil à l\'autre : exporter ici, coller là-bas.</div>'
   +(saveIO==='export'?'<textarea id="saveTxt" readonly style="width:100%;height:90px;margin-top:6px;font-family:var(--px);font-size:10px;background:var(--sumi);color:var(--bone);border:1px solid var(--line2)">'+exportSave()+'</textarea>'
     +'<div class="row"><button class="btn" data-copysave="1">Copier</button><button class="btn" data-closeio="1">Fermer</button></div>':'')
   +(saveIO==='import'?'<textarea id="saveTxt" placeholder="colle ici une sauvegarde exportée" style="width:100%;height:90px;margin-top:6px;font-family:var(--px);font-size:10px;background:var(--sumi);color:var(--bone);border:1px solid var(--line2)"></textarea>'
     +'<div class="row"><button class="btn pri" data-doimport="1">Charger cette sauvegarde</button><button class="btn" data-closeio="1">Annuler</button></div>':'')
   +'</div>';
  /* râtelier */
  const rk=rackElements();
  h+=grp('刀','RÂTELIER',Object.keys(rk).length+' / 5 éléments couverts');
  h+='<div class="card"><div class="meta">La Communion des cinq ne vaut que si tu portes de quoi tourner. '
   +'Chaque élément manquant casse la rotation et fait retomber le résolveur de ×2.40 à ×1.40.</div>'
   +'<div class="row">'+EL.map((e,i)=>'<span class="btn" style="border-color:'+(rk[i]?e.c:'var(--line)')
   +';color:'+(rk[i]?e.c:'var(--dim)')+'">'+e.g+' '+e.n+(rk[i]?'':' — manquant')+'</span>').join('')+'</div>'
   +'<div class="meta">'+(weapon()?'en main : '+weapon().nom+' ('+EL[domi(itemVec(weapon()))].n+')':'aucune arme en main')+'</div>'
   +'</div>';
  h+=rackList().map((it,i)=>'<div class="card"><h3><span>'+it.nom+'</span><i>'
    +EL[domi(itemVec(it))].g+' '+EL[domi(itemVec(it))].n+'</i></h3>'
    +'<div class="meta">'+FUNC[it.fn].d[0]+'d'+FUNC[it.fn].d[1]+' '+DT[FUNC[it.fn].t]
    +' · qualité '+it.q.toFixed(2)+' · dureté '+it.dur.toFixed(1)+'</div>'
    +'<div class="row"><button class="btn" data-draw="'+i+'">Dégainer · 5 endurance</button></div></div>').join('');
  /* cadence observée */
  const rt=S.rate||{};
  const est=k=>{const o=(rt[k]||0),e=cadence(k);
    return e.toFixed(1)+(o>0?'':' <i style="font-style:normal;color:var(--terre)">(estimée)</i>');};
  h+=grp('率','CADENCE','ce que la veille rendra');
  h+='<div class="card"><div class="meta">'
   +'combat '+est('kill')+' créatures/min · récolte '+est('harv')+'/min · '
   +'atelier '+est('craft')+'/min · salles de donjon '+(rt.djroom||0).toFixed(1)+'/min</div>'
   +'<div class="meta">Hors-ligne : 60 % de cette cadence, plafonné à 8 h. Faute de cadence observée, elle est <b>calculée</b> — le temps d\'un coup de pioche est connu à la seconde près. Les semaines de territoire, elles, se résolvent toutes.</div>'
   +'<div class="meta">Pendant l\'absence, on mange sur le garde-manger et les vivres : garnis-les avant de fermer.</div>'
   +'<div class="meta">Occupation qui tournera : <b>'+({repos:'repos',combat:'combat',donjon:'donjon',recolte:'récolte de '+(S.target?matName(S.target):'—'),atelier:'atelier',explore:'exploration',dormir:'sommeil'}[S.occ]||S.occ)+'</b></div></div>';
  return h;
}
