/* Sensen Mini — 39-panel-compagnons.js
   Onglet pComps */

function pComps(){
  let h='<p class="hint">Les compagnons progressent par l\'usage comme toi, vieillissent comme toi et tombent comme toi. L\'ordre décide de tout : celui qui tient encaisse à ta place et frappe moins fort ; celui qui suit ne risque rien et n\'apprend rien.</p>';
  h+=grp('率','ESCORTE',escortUsed()+' / '+escortMax()+' places');
  h+='<div class="card"><div class="meta">Places d\'escorte = 1 + Charisme/5 + Leadership/10 = 1 + '
   +Math.floor(st('cha')/5)+' + '+Math.floor(lv('leadership')/10)+'. Le Leadership monte en menant.</div>'
   +'<div class="meta">Un <b>suiveur territorial</b> ne prend aucune place mais refuse de quitter tes cellules revendiquées. Une bête en <b>bétail</b> ne combat plus : dans un enclos (un champ, trois bêtes), elle rend viande et parties chaque semaine.</div>'
   +'<div class="meta">'+ORDERS.map(o=>o.g+' <b>'+o.n+'</b> — '+o.d).join('<br>')+'</div></div>';
  if(!S.comps.length)h+='<p class="hint">Personne. Engage un PNJ dont la relation atteint 50, ou descends une créature sous 25 % de ses PV et tente un jet de Dressage.</p>';
  h+=S.comps.map((c,i)=>{
    const o=ORDERS.find(x=>x.k===c.order);
    return '<div class="card'+(c.dead?'':(c.esc?' on':''))+'">'
     +'<div class="besline"><div class="besvox'+(c.dead?' mort':'')+'"><div class="cam">'+compHtml(c)+'</div></div>'
     +'<div class="besinfo"><h3><span>'+c.nom+'</span>'
     +'<i>'+(c.type==='bete'?'bête':'PNJ')+' · niveau '+c.lv+'</i></h3>'
     +'<div class="meta">PV '+Math.round(c.hp)+'/'+c.max+' · humeur '+Math.round(c.mood)
     +' · potentiel '+Math.round(c.pot)+' · élément '+EL[c.el].g+' '+EL[c.el].n+'</div>'
     +(c.eq?'<div class="meta">arme : '+c.eq.nom+' ('+QNAME(c.eq.q)+')</div>':'')
     +(c.weak&&S.day<c.weak?'<div class="meta" style="color:var(--zhu)">affaibli — −20 % jusqu\'à demain</div>':'')
     +(c.dead?'<div class="meta" style="color:var(--zhu)">mort. Sa dépouille te suit ; il ne reviendra pas seul.</div>'
       +'<div class="meta">'+(priestHere()||'aucun prêtre ici — cherche un village 村 ou un sanctuaire 社')+'</div>'
       +'<div class="row"><button class="btn pri" data-revive="'+i+'" '+(priestHere()?'':'disabled')+'>Rappeler · '+reviveCost(c)+' or</button></div>'
      :'<div class="row"><button class="btn'+(c.esc?' pri':'')+'" data-esc="'+i+'">'
       +(c.esc?'en escorte':'escorter')+'</button>'
       +'<button class="btn" data-ord="'+i+'">'+o.g+' '+o.n+'</button>'
       +'<button class="btn" data-mode="'+i+'">'+(c.mode==='territorial'?'territorial':c.mode==='betail'?'bétail':'permanent')+'</button>'
       +(Object.keys(S.food).length?'<button class="btn" data-feed="'+i+'">Nourrir</button>':'')
       +'<button class="btn" data-free="'+i+'">Libérer</button></div>'
       +(c.type!=='bete'&&S.items.some(x=>x.kind==='arme')
         ?'<div class="row">'+S.items.map((x,xi)=>x.kind==='arme'
           ?'<button class="btn" data-arm="'+i+':'+xi+'">Donner '+x.nom+'</button>':'').join('')+'</div>':''))
     +'</div></div></div>';}).join('');
  h+=bestiaireSection();
  return h;
}

/* ==================================================================
   LE BESTIAIRE
   Les silhouettes ne se voyaient qu'en combat, le temps d'un échange.
   On les feuillette ici au calme : ce qu'on a croisé, ce qu'on a abattu,
   ce qui se dompte — et le compte de ce qu'on n'a pas encore vu, qui est
   la seule chose que le bestiaire ne montre pas.
   Les familles se replient : quarante-quatre fiches d'un bloc, ce serait
   le mur qu'on vient justement de démonter ailleurs.
   ================================================================== */
const BESCAT={bete:'BÊTES',vermine:'VERMINE',humain:'HUMAINS',corrompu:'CORROMPUS'};
function bestiaireSection(){
  const vus=CK.filter(k=>S.bes&&S.bes[k]);
  let h=grp('獣','BESTIAIRE',vus.length+' / '+CK.length+' espèces rencontrées');
  if(!vus.length)return h+'<p class="hint">Rien de croisé pour l\'instant. Chaque créature rencontrée s\'inscrit ici — sa silhouette, où elle vit, ce qu\'elle laisse, et si elle se dompte.</p>';
  Object.keys(BESCAT).forEach(cat=>{
    const l=vus.filter(k=>CREATURE[k].cat===cat);
    if(!l.length)return;
    const tot=CK.filter(k=>CREATURE[k].cat===cat).length;
    const abattues=l.filter(k=>S.bes[k].t>0).length;
    h+=foldHead('bes',cat,'獣',BESCAT[cat],l.length+' / '+tot+' · '+abattues+' abattue'+(abattues>1?'s':''),null);
    if(!foldOpen('bes',cat,null))return;
    l.sort((a,b)=>CREATURE[a].lv-CREATURE[b].lv);
    /* UNE FICHE OUVERTE A LA FOIS. Soixante-trois especes, et chaque fiche
       porte une silhouette voxel entiere : la categorie « betes » depliee
       faisait CENT TRENTE-QUATRE MILLE octets de HTML — trente-trois
       silhouettes construites pour en regarder une. Sur telephone, c'est un
       mur qu'on ne fait pas defiler.
       La ligne repliee garde ce qu'on vient verifier neuf fois sur dix : le
       nom, le niveau, si on l'a abattue, si elle se dompte. La silhouette et
       le detail ne se construisent que pour la fiche ouverte. */
    h+=l.map(k=>{
      const C=CREATURE[k],b2=S.bes[k];
      const ouv=foldOpen('bes2',k,null);
      let s='<div class="card"><button class="objh'+(ouv?' on':'')+'" data-fold="bes2:'+k+'">'
        +'<span>'+C.g+' '+C.n+'</span>'
        +'<i>niv '+C.lv+' · '+(b2.t?b2.t+' abattue'+(b2.t>1?'s':''):'jamais abattue')
          +(C.tame?(b2.a?' · '+b2.a+' domptée'+(b2.a>1?'s':''):' · se dompte'):'')+'</i>'
        +'<em>'+(ouv?'▾':'▸')+'</em></button>';
      if(ouv){
        const coul=EL[C.vec?domi(norm(V(C.vec))):3].c;
        s+='<div class="besline">'
         +'<div class="besvox"><div class="cam">'+voxelHtml(k,.58,coul,1)+'</div></div>'
         +'<div class="besinfo">'
         +'<div class="meta">croisée '+b2.v+' fois · '+(b2.t?b2.t+' abattue'+(b2.t>1?'s':''):'jamais abattue')
         +(b2.a?' · '+b2.a+' apprivoisée'+(b2.a>1?'s':''):(C.tame?' · s\'apprivoise':' · ne s\'apprivoise pas'))+'</div>'
         +'<div class="meta">'+(C.bio.length?C.bio.map(x=>BIOME[x]?BIOME[x].n:x).join(', '):'donjons et camps')
         +(C.corr?' · corruption ≥ '+C.corr:'')+(C.minp?' · lieux puissants seulement':'')+'</div>'
         +'<div class="meta">gestes : '+(C.pat||['simple']).map(p=>PATTERN[p]?PATTERN[p].g+' '+PATTERN[p].n:p).join(' · ')+'</div>'
         +(C.mats&&C.mats.length?'<div class="meta">laisse : '+C.mats.map(matName).join(', ')+'</div>':'')
         +'</div></div>';
      }
      return s+'</div>';
    }).join('');
  });
  return h;
}


let openPlot=null;
