/* Sensen Mini — 20-status.js
   Statuts de combat et anti-stunlock
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   STATUTS (F.4 / 5.1)
   Les contrôles durs sont à durée affichée, plafonnés à 2 s sur le
   joueur, et ne peuvent se réappliquer dans les 5 s qui suivent.
   ================================================================== */
const STATUS={
  saignement:{n:'Saignement',g:'血',c:'#C8332B',dot:1},
  brulure:{n:'Brûlure',g:'焼',c:'#E4572E',dot:1},
  etourdi:{n:'Étourdissement',g:'眩',c:'#D9A441',dur:1},
  enracine:{n:'Enracinement',g:'根',c:'#4FA96B',dur:1},
  ralenti:{n:'Ralentissement',g:'鈍',c:'#3E7CB1'},
  affaibli:{n:'Affaiblissement',g:'弱',c:'#7E9187'},
  poison:{n:'Poison',g:'毒',c:'#7BA05B',dot:1},
  terreur:{n:'Terreur',g:'怖',c:'#B9A7D6'},
  /* Le catalogue en declarait quatorze ; huit etaient poses. Voici les cinq
     qui manquaient vraiment — les deux derniers, « peau de pierre » et
     « regeneration », existaient deja sous forme de buffs et n'avaient pas
     besoin d'un doublon. */
  gel:{n:'Gel',g:'凍',c:'#8FC7E8',dur:1,fige:1},
  confusion:{n:'Confusion',g:'惑',c:'#C08BC0'},
  /* Une maladie ne se compte pas en secondes : elle se compte en JOURS, et
     elle traverse le sommeil, les voyages et les combats. C'est le seul
     statut que le temps de combat ne touche pas. */
  infection:{n:'Infection',g:'病',c:'#9A8C5A',jours:1},
  hate:{n:'Hâte',g:'疾',c:'#E0C060',bon:1},
  beni:{n:'Béni',g:'祝',c:'#F0E0A0',bon:1},
};
/* ce qui aide ne se dissipe pas dans le silence : on le dit */
const STBON=k=>!!STATUS[k].bon;
/* quel domaine de module pose quel statut */
const DOMSTAT={feu:'brulure',eau:'ralenti',foudre:'etourdi',terre:'enracine',
  metal:'saignement',corruption:'affaibli'};
function addStatus(tgt,k,dur,val){
  if(!tgt)return;
  /* « immunite_poison » (F.7) : le don ne reduit pas le poison, il l'empeche.
     Un don ne se chiffre pas — on l'a ou on ne l'a pas. */
  if(tgt===S&&k==='poison'&&typeof don==='function'&&don('antipoison'))return;
  tgt.st=tgt.st||[];
  const dure=STATUS[k].dur;
  /* une maladie ne s'empile pas : elle se prolonge */
  if(STATUS[k].jours){
    const e2=tgt.st.find(x=>x.k===k);
    if(e2){e2.t=Math.max(e2.t,dur);return;}
    tgt.st.push({k,t:dur,v:val||1});
    return;
  }
  if(dure){
    /* anti-stunlock : 2 s maximum, et pas de réapplication avant 5 s */
    if(tgt.cdStun&&tgt.cdStun>0)return;
    dur=Math.min(2,dur);tgt.cdStun=dur+5;
  }
  const ex=tgt.st.find(x=>x.k===k);
  if(ex){ex.t=Math.max(ex.t,dur);ex.v=Math.max(ex.v,val);}
  else tgt.st.push({k,t:dur,v:val});
}
const hasStatus=(tgt,k)=>!!(tgt&&tgt.st&&tgt.st.some(x=>x.k===k));
const statusVal=(tgt,k)=>{const x=tgt&&tgt.st&&tgt.st.find(y=>y.k===k);return x?x.v:0;};
function tickStatus(tgt,dt,estJoueur){
  if(!tgt)return;
  if(tgt.cdStun>0)tgt.cdStun=Math.max(0,tgt.cdStun-dt);
  if(!tgt.st||!tgt.st.length)return;
  tgt.st.forEach(x=>{
    /* les jours ne passent pas a la seconde : tickJour s'en charge */
    if(STATUS[x.k].jours)return;
    x.t-=dt;
    if(STATUS[x.k].dot){
      const d=x.v*dt;
      if(estJoueur){S.hp-=d;
        /* hors combat, un poison ou une plaie ronge jusqu'à 1 PV sans tuer — comme la faim (A.9) */
        if(S.hp<=0){if(S.occ==='combat'||S.occ==='donjon')down();else S.hp=1;}}
      /* la plaie ronge CELLE qui la porte, pas la cible regardée */
      else{tgt.hp-=d;dpsA+=d;if(tgt.hp<=0){kill(tgt);return;}}
    }
  });
  const fini=tgt.st.filter(x=>x.t<=0);
  /* le HUD affiche déjà les statuts actifs : n'annoncer que ce qui pesait
     vraiment — une entrave, un poison — sinon le journal se remplit de
     « saignement dissipé » toutes les vingt secondes */
  if(estJoueur){
    const notables=fini.filter(x=>x.k==='poison'||x.k==='affaibli'||STATUS[x.k].dur);
    if(notables.length)log(notables.map(x=>STATUS[x.k].n).join(', ')+' — dissipé');
  }
  tgt.st=tgt.st.filter(x=>x.t>0);
}
const statusTxt=tgt=>(tgt&&tgt.st||[]).map(x=>
  '<span style="color:'+STATUS[x.k].c+'">'+STATUS[x.k].g
  +(STATUS[x.k].jours?Math.ceil(x.t)+'j':Math.ceil(x.t))+'</span>').join(' ');
/* ===== LES MALADIES : le temps long =====
   Appele une fois par jour passe. Une infection ronge l'endurance tant
   qu'on ne la soigne pas — c'est la seule contrainte du jeu qui ne se
   resout ni en combattant ni en attendant quelques secondes. */
function tickJour(n){
  if(!S.st||!S.st.length)return;
  let mort=[];
  S.st.forEach(x=>{
    if(!STATUS[x.k].jours)return;
    x.t-=n;
    if(x.t<=0)mort.push(x.k);
  });
  if(mort.length){
    S.st=S.st.filter(x=>!mort.includes(x.k));
    mort.forEach(k=>cutIn(STATUS[k].g,STATUS[k].n+' — guerie','le corps a fini par avoir raison'));
  }
}
/* un remede, une purge, une nuit de vrai repos : ce qui nettoie */
function soigner(k,quoi){
  if(!S.st||!hasStatus(S,k))return false;
  S.st=S.st.filter(x=>x.k!==k);
  log('<span class="gd">'+STATUS[k].n+' — '+(quoi||'soigne')+'.</span>');
  return true;
}
/* l'infection coute de l'endurance chaque jour ou elle dure (F.4) */
const malusInfection=()=>hasStatus(S,'infection')?2*statusVal(S,'infection'):0;
