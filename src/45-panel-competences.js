/* Sensen Mini — 45-panel-competences.js
   Onglet pSkills */

function pSkills(){
  let h='<p class="hint">Progression par l\'usage, sans plafond. L\'XP d\'un bloc vaut sa dureté. Barre bleue : XP. Barre ocre : potentiel — monter le consomme, et il faudra manger pour le rendre.</p>';
  h+=grp('己','PERSONNAGE',S.nom+' · '+RACE[S.race].n+' '+CLASSE[S.classe].n);
  h+='<div class="card"><div class="meta">signe '+EL[S.born[0]].g+ANIMALS[S.born[1]].g+' — '
   +EL[S.born[0]].n+' '+ANIMALS[S.born[1]].n+' · '+RACE[S.race].b+'</div>'
   +'<div class="meta">'+STATS.map(([k,n])=>n+' <b style="color:var(--paper);font-weight:400">'+st(k)+'</b>').join(' · ')+'</div>'
   +'<div class="meta">PV '+maxHp()+' · mana '+maxMana()+' · niveau de combat '+combatLvl()+' · niveau général '+genLvl()+'</div></div>';
  /* les stats montent aussi, mais lentement : une stat est une identité, pas un compteur */
  h+=grp('能','STATS','elles montent par l\'usage — la table rend leur potentiel');
  h+='<div class="skl">'+STATS.map(([k,n,d])=>{const s=S.sx&&S.sx[k]?S.sx[k]:{xp:0,pot:100,base:100};
    const need=statNext(S.stats[k]);
    return '<div class="sk"><div class="h"><b>'+n+' '+st(k)+'</b><i>p'+Math.round(s.pot)+'</i></div>'
     +'<div class="xp"><b style="width:'+Math.min(100,s.xp/need*100)+'%"></b></div>'
     +'<div class="pot"><b style="width:'+(s.pot/200*100)+'%"></b></div>'
     +'<div class="meta" style="font-size:9px;margin-top:2px">'+d+'</div></div>';}).join('')+'</div>';
  h+='<div class="card"><div class="meta">Force : les coups portés · Dextérité : le tir et les parades parfaites · Endurance : les coups reçus · Volonté : le mana dépensé · Perception : l\'exploration et la lecture · Charisme : la parole.</div>'
   +'<div class="meta">Monter consomme le potentiel ; un plat le rend (chaque famille nourrit une stat), et le sommeil en rend 4 à toutes.</div></div>';
  h+=grp('練','COMPÉTENCES','potentiel moyen '+Math.round(avgPot()));
  /* Soixante compétences à plat faisaient six écrans sur petit téléphone, et
     l'on n'y retrouvait rien. On plie par famille : celle où l'on est le plus
     avancé s'ouvre d'office, et chaque en-tête repliée porte le niveau le
     plus haut de sa famille — souvent tout ce qu'on venait vérifier. */
  const familles=[...new Set(SK.map(k=>SKILLS[k].grp))];
  const sommet=g=>SK.filter(k=>SKILLS[k].grp===g).reduce((a,k)=>Math.max(a,S.sk[k].lv),0);
  const vedette=familles.slice().sort((x,y)=>sommet(y)-sommet(x))[0];
  familles.forEach(g=>{
    const l=SK.filter(k=>SKILLS[k].grp===g);
    const haut=sommet(g),actives=l.filter(k=>S.sk[k].lv>0).length;
    h+=foldHead('comp',g,'練',g.toUpperCase(),
      (actives?actives+' entamée'+(actives>1?'s':'')+' · plus haute '+haut:'aucune entamée'),
      g===vedette?g:null);
    if(!foldOpen('comp',g,g===vedette?g:null))return;
    h+='<div class="skl">'+l.map(k=>{const s=S.sk[k];
      return '<div class="sk"><div class="h"><b>'+SKILLS[k].n+'</b><i>niv '+s.lv+' · p'+Math.round(s.pot)+'</i></div>'
       +'<div class="xp"><b style="width:'+Math.min(100,s.xp/xpNext(s.lv)*100)+'%"></b></div>'
       +'<div class="pot"><b style="width:'+(s.pot/200*100)+'%"></b></div></div>';}).join('')+'</div>';
  });
  h+='<div class="card"><div class="meta">Efficacité : +2 % par niveau, sans plafond. Quantité récoltée : +1 tous les 10 niveaux.</div></div>';
  return h;
}
