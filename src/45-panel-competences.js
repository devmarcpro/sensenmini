/* Sensen Mini — 45-panel-competences.js
   Onglet pSkills */

function pSkills(){
  let h='<p class="hint">Progression par l\'usage, sans plafond. L\'XP d\'un bloc vaut sa dureté. Barre bleue : XP. Barre ocre : potentiel — monter le consomme, et il faudra manger pour le rendre.</p>';
  h+=grp('己','PERSONNAGE',S.nom+' · '+RACE[S.race].n+' '+CLASSE[S.classe].n);
  h+='<div class="card"><div class="meta">signe '+EL[S.born[0]].g+ANIMALS[S.born[1]].g+' — '
   +EL[S.born[0]].n+' '+ANIMALS[S.born[1]].n+' · '+RACE[S.race].b+'</div>'
   +'<div class="meta">'+STATS.map(([k,n])=>n+' '+st(k)).join(' · ')+'</div>'
   +'<div class="meta">PV '+maxHp()+' · mana '+maxMana()+' · niveau de combat '+combatLvl()+' · niveau général '+genLvl()+'</div></div>';
  h+=grp('練','COMPÉTENCES','potentiel moyen '+Math.round(avgPot()));
  h+='<div class="skl">'+SK.map(k=>{const s=S.sk[k];
    return '<div class="sk"><div class="h"><b>'+SKILLS[k].n+'</b><i>niv '+s.lv+' · p'+Math.round(s.pot)+'</i></div>'
     +'<div class="xp"><b style="width:'+Math.min(100,s.xp/xpNext(s.lv)*100)+'%"></b></div>'
     +'<div class="pot"><b style="width:'+(s.pot/200*100)+'%"></b></div></div>';}).join('')+'</div>';
  h+='<div class="card"><div class="meta">Efficacité : +2 % par niveau, sans plafond. Quantité récoltée : +1 tous les 10 niveaux.</div></div>';
  return h;
}
