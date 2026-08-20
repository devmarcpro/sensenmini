/* Sensen Mini — 23-starter.js
   Kit de départ et parchemins
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== KIT DE DÉPART ===== */
function starterKit(){
  const mk=(kind,fn,mats)=>{
    const def=kind==='arme'?FUNC[fn]:OUTIL[fn];
    const parts=def.comp.map((ct,i)=>({ct,f:COMP[ct].forms[0],mk:mats[i]}));
    parts.push({ct:'fixations',f:'lingot',mk:'fer'});
    const it=mkItem(kind,fn,parts,1.0);
    S.items.push(it);return it;};
  mk('outil','pioche',['fer','chene']);
  mk('outil','hachebois',['fer','chene']);
  mk('outil','serpe',['fer','chene']);
  mk('outil','pelle',['fer','chene']);
  const C=CLASSE[S.classe]||{kit:'epee'};
  mk('arme',C.kit==='pioche'?'masse':C.kit,['fer','chene']);
  S.eq.main1=S.items.pop();
  S.mat.chene=8;S.mat.fer=6;
  const nb=C.books||1;
  for(let i=0;i<nb;i++)S.books.push({id:'b'+i,dom:pick(['feu','eau','terre','postures','frappes']),diff:4});
}
/* ===== PARCHEMINS DE RECETTE (placeholder du loot de donjon) ===== */
function maybeScroll(mk){
  if(BASEMAT.includes(mk))return;
  if(Math.random()>0.004)return;
  const cts=Object.keys(COMP).filter(ct=>
    COMP[ct].raw.includes(mk)||COMP[ct].forms.some(f=>f!=='brut'&&FORM[f]&&formOk(f,mk)));
  if(!cts.length)return;
  learnRecipe(pick(cts),mk);
}
