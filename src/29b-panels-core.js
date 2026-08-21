/* Sensen Mini — 29b-panels-core.js
   Aiguillage des onglets et helpers partagés */

/* ===== PANNEAUX ===== */
let tab='monde';
function paint(){
  $('panel').innerHTML=({monde:pMonde,cell:pCell,recolte:pRecolte,atelier:pAtelier,equip:pEquip,magie:pMagie,table:pTable,ville:pVille,pnj:pPnj,comps:pComps,batir:pBatir,royaume:pRoyaume,guilde:pGuilde,sac:pSac,autos:pAuto,skills:pSkills,param:pParam}[tab])();
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===tab));
}
