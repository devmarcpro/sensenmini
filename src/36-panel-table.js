/* Sensen Mini — 36-panel-table.js
   Onglet pTable */

let selFood=[];
function pTable(){
  let h='<p class="hint">Bien manger n\'est pas de la survie, c\'est de l\'optimisation de croissance. Monter une compétence consomme son potentiel ; la table le rend. La nutrition est le multiplicateur — et un plat couvrant les cinq éléments gagne l\'harmonie daoïste ×1.2.</p>';
  const ks=Object.keys(S.food).filter(k=>S.food[k]>0);
  h+=grp('材','GARDE-MANGER',ks.length+' ingrédients');
  if(!ks.length)h+='<p class="hint">Vide. Les créatures laissent leur propre viande — son groupe de compétences dérive de leur profil — et les plantes se récoltent.</p>';
  else h+='<div class="matlist">'+ks.map(k=>{const i=foodInfo(k);
    return '<button class="mat'+(selFood.includes(k)?' sel':'')+'" data-food="'+k+'">'
     +'<b style="color:'+EL[i.el].c+'">'+EL[i.el].g+'</b>'+i.n+' × '+S.food[k]
     +'<small>nutrition '+i.nutr+(i.grp?' · potentiel '+i.grp:'')+(i.alch?' · alchimie : '+BUFFN[i.alch]:'')+'</small>'
     +'<small><span class="btn" data-eatfood="'+k+'" style="padding:3px 7px;display:inline-block">manger cru (+'+Math.round(i.nutr*.5)+')</span></small></button>';
    }).join('')+'</div>';
  /* préparation */
  const infos=selFood.map(foodInfo);
  const els=new Set(infos.map(i=>i.el));
  const q=quality(lv('cuisine'));
  const harm=els.size>=5;
  const nutr=infos.reduce((a,i)=>a+i.nutr,0)*q*(harm?1.2:1);
  h+=grp('厨','PRÉPARATION',selFood.length+' ingrédients choisis');
  /* les recettes connues : on ne deverrouille rien, mais on se souvient */
  const vus=(typeof colAvoir==='function'?colAvoir('plat'):[]);
  h+='<div class="card"><div class="meta">Recettes reconnues : <b>'+vus.length+' / '+PLAT.length+'</b> — '
   +PLAT.map(pl=>vus.indexOf(pl.k)>=0
     ?'<b title="'+pl.d+'">'+pl.g+'</b>'
     :'<span style="opacity:.32" title="'+pl.d+'">'+pl.g+'</span>').join(' ')
   +'</div><div class="meta">Un plat ne se debloque pas : il se reconnait a ce qu on met dans la marmite.</div></div>';
  h+='<div class="card"><div class="meta">'+(selFood.length?infos.map(i=>i.n).join(' + '):'rien de choisi')+'</div>'
   +'<div class="meta">éléments couverts : '+[0,1,2,3,4].map(e=>els.has(e)
     ?'<b style="color:'+EL[e].c+'">'+EL[e].g+'</b>':'<span style="opacity:.3">'+EL[e].g+'</span>').join(' ')
   +(harm?' — <b style="color:var(--terre)">harmonie des cinq ×1.2</b>':'')+'</div>'
   +'<div class="meta">Cuisine niv '+lv('cuisine')+' → qualité moyenne '+QNAME(q)+' · nutrition estimée '+Math.round(nutr*(selFood.length?platDe(infos).nutr:1))+'</div>'
   /* CE QUE LA MARMITE VA SORTIR, AVANT DE LA LANCER. Seize plats se
      reconnaissent a ce qu'on met dedans ; si le panneau n'annonce pas
      lequel, le joueur ne peut ni viser une recette ni comprendre pourquoi
      celle d'hier etait meilleure. On le dit avant, pas apres. */
   +(selFood.length?(()=>{const pl=platDe(infos);
       return '<div class="meta">Cela donnera : <b>'+pl.g+' '+pl.n+'</b> — '+pl.d
         +' · nutrition ×'+pl.nutr.toFixed(2)+' · potentiel ×'+pl.pot.toFixed(2)
         +(pl.soin?' · soin +'+Math.round(pl.soin*100)+' %':'')+'</div>';})():'')
   +'<div class="row"><button class="btn pri" data-cook="1" '+(selFood.length&&hasStation('cuisine')?'':'disabled')+'>'
   +(hasStation('cuisine')?'Cuisiner':'cuisine manquante')+'</button>'
   +'<button class="btn" data-distill="1" '+(selFood.length&&hasStation('alambic')?'':'disabled')+'>'
   +(hasStation('alambic')?'Distiller':'alambic manquant')+'</button>'
   +'<button class="btn" data-clearfood="1">Vider la sélection</button></div>'
   +'<div class="meta">'+(selFood.find(k=>ALCHPLANTE[k])
     ? 'Distiller donnera : <b>'+POTEFF[ALCHPLANTE[selFood.find(k=>ALCHPLANTE[k])]].n+'</b> — '
       +POTEFF[ALCHPLANTE[selFood.find(k=>ALCHPLANTE[k])]].sub(quality(lv('alchimie'))*(1+(selFood.length-1)*.22))
       +'. Chaque ingrédient de plus la renforce.'
     : 'Une PLANTE alchimique donne une potion d’effet — achillée, herbes, racines, camomille, menthe, ortie, sauge, belladone, amanite. '
       +'Une PARTIE DE CRÉATURE donne une potion de statistique.')+'</div></div>';
  /* Les consommables : on ne les distille pas, on les FAIT. Ils vivent a
     cote des potions parce que c'est le meme geste — preparer d'avance ce
     dont on aura besoin loin de tout. */
  h+=grp('具','CONSOMMABLES',CONSK.reduce((a,k)=>a+consoDe(k),0)+' en réserve');
  h+='<div class=matlist>'+CONSK.map(k=>{const D=CONSO[k],b2=consoBlocage(k),n=consoDe(k);
    return '<div class=mat><b>'+D.g+'</b>'+D.n+' × '+n
     +'<small>'+D.d+'</small>'
     +'<small>'+costTxt(D.cout)+' → '+D.lot+(D.st?' · '+STATION[D.st].n:'')+'</small>'
     +'<div class=row style=margin-top:5px>'
     +'<button class="btn" data-consofaire="'+k+'" '+(b2?'disabled':'')+' style="padding:3px 8px">'+(b2||'fabriquer')+'</button>'
     +'<button class="btn pri" data-consouser="'+k+'" '+(n?'':'disabled')+' style="padding:3px 8px">utiliser</button>'
     +'</div></div>';}).join('')+'</div>';
  /* LE CARQUOIS (10d). On le range pres des consommables parce que c'est le
     meme geste : preparer d'avance ce dont on manquera loin de tout. Deux
     boutons par ligne — en faire, et l'encocher — parce qu'une intention
     (« je veux du fer au bout ») ne doit pas couter trois clics. */
  {
    const enc=S.carquois&&MUNI[S.carquois]?MUNI[S.carquois]:null;
    h+=grp('矢','CARQUOIS',enc?enc.n+" × "+muniDe(S.carquois):'rien d encoche');
    h+='<div class="meta">Une munition ne sert qu au tir, et seulement avec l arme qui va avec : '
      +'les fleches a l arc, les billes a la fronde. Le carquois n en tient qu une sorte — '
      +'c est ce qui en fait un choix. Vide, l arc tire encore, simplement sans rien de plus.</div>';
    h+='<div class=matlist>'+MUNIK.map(k=>{const D=MUNI[k],b3=muniBlocage(k),n=muniDe(k);
      const act=S.carquois===k;
      return '<div class="mat'+(act?' on':'')+'"><b>'+D.g+'</b>'+D.n+' × '+n
       +'<small>'+D.d+'</small>'
       +'<small>'+FUNC[D.pour].n+' · '+costTxt(D.cout)+' -> '+D.lot+(D.st?' · '+STATION[D.st].n:'')+'</small>'
       +'<div class=row style=margin-top:5px>'
       +'<button class="btn" data-munifaire="'+k+'" '+(b3?'disabled':'')+' style="padding:3px 8px">'+(b3||'fabriquer')+'</button>'
       +'<button class="btn'+(act?'':' pri')+'" data-muniencocher="'+k+'" '+(n&&!act?'':'disabled')+' style="padding:3px 8px">'
       +(act?'encoche':'encocher')+'</button>'
       +'</div></div>';}).join('')+'</div>';
  }
  if(S.torche>0||S.huile>0)
    h+='<div class="meta">'+(S.torche>0?'松 torche allumée — '+Math.ceil(S.torche)+' s':'')
      +(S.torche>0&&S.huile>0?' · ':'')+(S.huile>0?'油 huile sur la lame — '+Math.ceil(S.huile)+' s':'')+'</div>';
  /* potions */
  h+=grp('薬','POTIONS',S.potions.length+'');
  h+=S.potions.length?'<div class="matlist">'+S.potions.map((p,i)=>
    '<button class="mat" data-drink="'+i+'"><b>'+(p.e?POTEFF[p.e].g:'薬')+'</b>'+p.n
    +'<small>'+(p.e?POTEFF[p.e].sub(p.v):'+'+p.v+' '+BUFFN[p.k]+' · '+p.dur+' s')+'</small>'
    +'<small style="color:var(--jade)">boire</small></button>').join('')+'</div>'
   :'<p class="hint">Aucune potion.</p>';
  if(S.buffs&&S.buffs.length){
    h+=grp('効','EFFETS EN COURS');
    h+='<div class="card">'+S.buffs.map(b=>'<div class="meta">'+b.n+' — +'+b.v+' '+BUFFN[b.k]
      +' · '+Math.ceil(b.t)+' s restantes</div>').join('')+'</div>';
  }
  /* potentiel par groupe */
  h+=grp('潜','POTENTIEL','moyenne '+Math.round(avgPot())+' / 200');
  h+='<div class="matlist">'+GROUPS.map(g=>{
    const ks2=SK.filter(k=>SKILLS[k].grp===g);
    if(!ks2.length)return '';
    const m=ks2.reduce((a,k)=>a+S.sk[k].pot,0)/ks2.length;
    return '<div class="mat"><b>潜</b>'+g+'<small>potentiel moyen '+Math.round(m)+'</small>'
     +'<small style="color:'+(m>110?'var(--jade)':m<70?'var(--zhu)':'var(--dim)')+'">'
     +(m>110?'progression accélérée':m<70?'progression ralentie':'normale')+'</small></div>';}).join('')+'</div>';
  return h;
}
