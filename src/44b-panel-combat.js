/* Sensen Mini — 44b-panel-combat.js
   Onglet pCombat : tout ce qui se programme AVANT le combat

   La veille dit ce que le personnage fait quand on ne regarde pas.
   Le combat dit comment il frappe quand on regarde. Les deux se
   programmaient au meme endroit, dans un onglet deja long de neuf
   sections — l'enchainement des coups y arrivait apres la chronique et
   les conseils, c'est-a-dire nulle part.
   Ici : l'ordre des gestes, la rotation des compagnons, la posture, le
   ratelier de la Communion des cinq, et les automatismes qui touchent au
   combat. Rien d'autre. */

function pCombat(){
  const rk=rackElements();
  let h='<p class="hint">Ce qui se decide AVANT le coup. L\'enchainement rejoue la meme suite a chaque combat ; la posture change ce que chaque coup coute et rapporte ; le ratelier tient la Communion des cinq. A l\'arret, tout se joue tout seul comme avant.</p>';

  /* --- la posture : elle se choisissait dans la scene de combat seulement --- */
  h+=foldHead('combat','st','構','POSTURE',stanceNow().n,'st');
  if(foldOpen('combat','st','st')){
    h+='<div class="meta" style="margin-bottom:6px">Trois postures, et le prix de chacune. Elle se change aussi d\'un geste dans la scene de combat.</div>';
    h+='<div class="matlist">'+STANCE.map((s,i)=>
      '<button class="mat'+(S.stance===i?' sel':'')+'" data-stance="'+i+'"><b>'+(s.g||'構')+'</b>'+s.n
      +'<small>'+(s.d||'')+'</small>'
      +'<small>vitesse ×'+(s.spd||1).toFixed(2)+' · dégâts ×'+(s.dmg||1).toFixed(2)
      +' · parade ×'+(s.win||1).toFixed(2)+'</small></button>').join('')+'</div>';
  }

  /* --- la hauteur de garde : ce qui donne enfin un sens aux telegraphes --- */
  h+=foldHead('combat','gd','護','HAUTEUR DE GARDE',
    (GARDES.find(g=>g.k===gardeDir())||GARDES[0]).n,'gd');
  if(foldOpen('combat','gd','gd')){
    h+='<div class="meta" style="margin-bottom:6px">Chaque geste de créature vient d\'une hauteur, et le télégraphe la donne avant le coup. '
     +'La bonne hauteur encaisse moitié moins et double presque la chance de parade parfaite ; la mauvaise coûte du souffle pour rien. '
     +'<b>Un bouclier couvre en plus les hauteurs voisines</b> — jamais toutes : haut et bas ne se jouxtent pas.</div>';
    h+='<div class="matlist">'+GARDES.map(g=>
      '<button class="mat'+(gardeDir()===g.k?' sel':'')+'" data-gdir="'+g.k+'"><b>'+g.g+'</b>'+g.n
      +'<small>'+g.d+'</small></button>').join('')+'</div>';
    h+='<div class="meta">Au cinquième rang de <b>護 Garde réflexe</b>, elle suit le télégraphe toute seule.</div>';
  }

  /* L'ENCHAINEMENT. Le plan dit QUOI faire ; celui-ci dit COMMENT frapper.
     Il vit juste sous le plan parce que c'est la meme idee, un cran plus
     bas : ecrire d'avance ce qu'on ferait a la main. */
  {
    const Q=seq();
    h+=foldHead('combat','seq','連','ENCHAÎNEMENT',
      Q.on?(Q.r.length+' geste'+(Q.r.length>1?'s':'')):'à l\'arrêt');
    if(foldOpen('combat','seq')){
      h+='<div class="card"><div class="meta">'
       +'À chaque combat, ces gestes se rejouent dans l\'ordre, en boucle : '
       +'<i>prendre l\'épée · deux coups · une compétence · une charge</i>. '
       +'Un geste qu\'on ne peut pas payer attend un battement, puis se saute — '
       +'une ligne morte ne fige jamais la suite.</div>'
       +'<div class="row"><button class="btn'+(Q.on?' pri':'')+'" data-seqon="1">'
       +(Q.on?'連 Enchaînement actif':'connecter l\'enchaînement')+'</button>'
       +'<button class="btn" data-seqadd="1" '+(Q.r.length>=14?'disabled':'')+'>Ajouter un geste</button>'
       +'<button class="btn" data-seqreset="1">Exemple de départ</button></div>'
       +(Q.on?'':'<div class="meta">À l\'arrêt, le combat se joue comme avant : on frappe dès qu\'il y a du souffle et chaque compétence part dès qu\'elle est prête.</div>')
       +'</div>';
      h+=Q.r.map((g,i)=>{
        const D=GESTES[g.t]||{n:'?',d:'',g:'?'};
        const vivant=Q.on&&Q.i===i;
        return '<div class="card"'+(vivant?' style="border-color:var(--jade)"':'')+'>'
         +'<div class="row ligne"><span class="meta" style="flex:none;min-width:22px">'+(i+1)+'</span>'
         +'<select data-seqt="'+i+'" style="flex:1">'+GESTK.map(k=>'<option value="'+k+'"'
           +(k===g.t?' selected':'')+'>'+GESTES[k].g+' '+GESTES[k].n+'</option>').join('')+'</select>'
         +(g.t==='arme'?'<select data-seqv="'+i+'" style="flex:1">'+FK2.map(f=>'<option value="'+f+'"'
             +(f===g.v?' selected':'')+'>'+FUNC[f].n+'</option>').join('')+'</select>':'')
         +(g.t==='sort'?'<select data-seqv="'+i+'" style="flex:none;width:110px">'
             +(S.spells||[]).map((sp,si)=>'<option value="'+si+'"'+(si===+g.v?' selected':'')+'>compétence '+(si+1)
               +(sp&&sp.length?'':' (vide)')+'</option>').join('')+'</select>':'')
         +(g.t==='attendre'?'<input type="number" data-seqv="'+i+'" value="'+(g.v||1)+'" min="1" max="9" '
             +'style="width:56px;flex:none;background:var(--sumi);color:var(--bone);border:1px solid var(--line2);'
             +'font-family:var(--px);font-size:11px;padding:5px">':'')
         +(g.t==='coup'||g.t==='lourd'?'<input type="number" data-seqn="'+i+'" value="'+(g.n||1)+'" min="1" max="9" '
             +'style="width:56px;flex:none;background:var(--sumi);color:var(--bone);border:1px solid var(--line2);'
             +'font-family:var(--px);font-size:11px;padding:5px">':'')
         +'<button class="btn" data-sequp="'+i+'" style="flex:none" '+(i===0?'disabled':'')+'>▲</button>'
         +'<button class="btn" data-seqdown="'+i+'" style="flex:none" '+(i===Q.r.length-1?'disabled':'')+'>▼</button>'
         +'<button class="btn" data-seqdel="'+i+'" style="flex:none;border-color:var(--zhu)">✕</button></div>'
         +'<div class="meta">'+D.d+(vivant?' <b style="color:var(--jade)">— c\'est ce geste qui joue</b>':'')+'</div>'
         +'</div>';
      }).join('')||'<p class="hint">Aucun geste. Sans enchaînement, le combat se joue tout seul comme avant.</p>';
    }
  }
  /* Et celui des compagnons : mêmes règles, en plus court. Un compagnon
     n'avait qu'UN ordre, figé pour toute la partie — il en tourne plusieurs. */
  if(S.comps.length){
    h+=foldHead('combat','cseq','従','ENCHAÎNEMENT DES COMPAGNONS',
      S.comps.filter(c=>Array.isArray(c.seq)&&c.seq.length).length+' / '+S.comps.length+' programmés');
    if(foldOpen('combat','cseq')){
      h+='<div class="meta" style="margin-bottom:6px">Tenir deux temps puis frapper trois, c\'est la seule façon de lui faire encaisser une charge et frapper ensuite.</div>';
      h+=S.comps.map((c,i)=>{
        const l=Array.isArray(c.seq)?c.seq:[];
        return '<div class="card"><h3><span>'+c.nom+'</span><i>'
         +(l.length?'enchaînement de '+l.length:'ordre fixe : '+(ORDERS.find(o=>o.k===c.order)||{n:'—'}).n)+'</i></h3>'
         +l.map((g,j)=>'<div class="row ligne">'
           +'<select data-cso="'+i+':'+j+'" style="flex:1">'+ORDERS.map(o=>'<option value="'+o.k+'"'
             +(o.k===g.o?' selected':'')+'>'+o.g+' '+o.n+'</option>').join('')+'</select>'
           +'<input type="number" data-csn="'+i+':'+j+'" value="'+(g.n||1)+'" min="1" max="9" '
             +'style="width:56px;flex:none;background:var(--sumi);color:var(--bone);border:1px solid var(--line2);'
             +'font-family:var(--px);font-size:11px;padding:5px">'
           +'<button class="btn" data-csdel="'+i+':'+j+'" style="flex:none;border-color:var(--zhu)">✕</button></div>').join('')
         +'<div class="row"><button class="btn" data-csadd="'+i+'" '+(l.length>=6?'disabled':'')+'>Ajouter un ordre</button></div>'
         +'</div>';
      }).join('');
    }
  }
  h+=foldHead('combat','ra','刀','RÂTELIER',Object.keys(rk).length+' / 5 éléments');
  if(foldOpen('combat','ra')){
  h+='<div class="card"><div class="meta">La Communion des cinq ne vaut que si tu portes de quoi tourner. '
   +'Chaque élément manquant casse la rotation et fait retomber le résolveur de ×2.40 à ×1.40.</div>'
   +'<div class="row">'+EL.map((e,i)=>'<span class="btn" style="border-color:'+(rk[i]?e.c:'var(--line)')
   +';color:'+(rk[i]?e.c:'var(--dim)')+'">'+e.g+' '+e.n+(rk[i]?'':' — manquant')+'</span>').join('')+'</div>'
   +'<div class="meta">'+(weapon()?'en main : '+weapon().nom+' ('+EL[domi(itemVec(weapon()))].n+')':'aucune arme en main')+'</div>'
   +'</div>';
  h+=rackList().map((it,i)=>'<div class="card"><h3><span>'+iconeHtml(it,1.9,'mini')+it.nom+'</span><i>'
    +EL[domi(itemVec(it))].g+' '+EL[domi(itemVec(it))].n+'</i></h3>'
    +'<div class="meta">'+FUNC[it.fn].d[0]+'d'+FUNC[it.fn].d[1]+' '+DT[FUNC[it.fn].t]
    +' · qualité '+it.q.toFixed(2)+' · dureté '+it.dur.toFixed(1)+'</div>'
    +'<div class="row"><button class="btn" data-draw="'+i+'">Dégainer · 5 endurance</button></div>'
    +(meubleTerritoire('ratelier')?'<div class="row"><button class="btn" data-poserat="'+i+'">Poser au râtelier</button></div>':'')
    +'</div>').join('');
  /* Les armes posees chez soi. Elles comptent pour la rotation sans peser
     dans le sac : c'est le CYCLE que la Communion entretient, pas le poids
     porte — et cinq places de sac rendues changent une partie. */
  const capRat=5*meubleTerritoire('ratelier');
  if(capRat){
    const l=S.ratelier||[];
    h+='<div class="card"><h3><span>架 Armes au râtelier</span><i>'+l.length+' / '+capRat+'</i></h3>'
     +'<div class="meta">Elles comptent pour la Communion où que tu sois, et ne prennent aucune place dans le sac.</div>'
     +(l.length?'<div class="matlist">'+l.map((it,i)=>'<button class="mat" data-repriserat="'+i+'">'
        +iconeHtml(it,1.9,'mini')+'<b style="color:'+EL[domi(itemVec(it))].c+'">'+EL[domi(itemVec(it))].g+'</b>'+it.nom
        +'<small>qualité '+it.q.toFixed(2)+'</small><small style="color:var(--jade)">reprendre</small></button>').join('')+'</div>'
       :'<p class="hint">Râtelier vide.</p>')
     +'</div>';
  } else h+='<div class="meta">Un <b>râtelier d\'armes</b> (建 BÂTIR → bâtiment → râtelier) tient cinq armes chez toi : elles comptent pour la Communion sans peser dans le sac.</div>';
  }

  /* --- les automatismes qui touchent au combat --- */
  {
    const combatAutos=['garde','rotation','deto'].filter(k=>AUTOS[k]);
    h+=foldHead('combat','au','自','AUTOMATISMES DE COMBAT',
      combatAutos.filter(k=>auto(k)).length+' / '+combatAutos.length+' acquis');
    if(foldOpen('combat','au')){
      h+='<div class="meta" style="margin-bottom:6px">Trois automatismes touchent au combat. Les autres — marmite, intendance, veilleur, fondeur — sont dans <b>自 VEILLE</b>, parce qu\'ils travaillent quand tu ne regardes pas.</div>';
      h+='<div class="matlist">'+combatAutos.map(k=>{const A=AUTOS[k],n=auto(k);
        return '<div class="mat"><b>'+A.g+'</b>'+A.n+(A.max>1?' '+n+'/'+A.max:'')
         +'<small>'+A.d+'</small>'
         +'<small style="color:'+(n?'var(--jade)':'var(--dim)')+'">'
         +(n>=A.max?'acquis':'coûte '+autoCost(k)+' or')+'</small>'
         +(n<A.max?'<div class="row" style="margin-top:5px"><button class="btn" data-auto="'+k+'" '
           +(S.or>=autoCost(k)?'':'disabled')+' style="padding:3px 8px">acquérir</button></div>':'')
         +'</div>';}).join('')+'</div>';
    }
  }
  return h;
}
