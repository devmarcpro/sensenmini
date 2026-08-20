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
};
/* quel domaine de module pose quel statut */
const DOMSTAT={feu:'brulure',eau:'ralenti',foudre:'etourdi',terre:'enracine',
  metal:'saignement',corruption:'affaibli'};
function addStatus(tgt,k,dur,val){
  if(!tgt)return;
  tgt.st=tgt.st||[];
  const dure=STATUS[k].dur;
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
    x.t-=dt;
    if(STATUS[x.k].dot){
      const d=x.v*dt;
      if(estJoueur){S.hp-=d;if(S.hp<=0)down();}
      else if(E){E.hp-=d;dpsA+=d;if(E.hp<=0){kill();return;}}
    }
  });
  const fini=tgt.st.filter(x=>x.t<=0);
  if(fini.length&&estJoueur)log(fini.map(x=>STATUS[x.k].n).join(', ')+' — dissipé');
  tgt.st=tgt.st.filter(x=>x.t>0);
}
const statusTxt=tgt=>(tgt&&tgt.st||[]).map(x=>
  '<span style="color:'+STATUS[x.k].c+'">'+STATUS[x.k].g+Math.ceil(x.t)+'</span>').join(' ');
