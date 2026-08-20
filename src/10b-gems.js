/* Sensen Mini — 10b-gems.js
   Gemmes : taille, sertissage, effets plats (A.12)
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   « Les gemmes sont tous les bonus plats, jamais une règle. »
   Tailler CHOISIT la spécialisation ; la qualité de taille (Taille de
   pierre, A.3) place la valeur dans la fourchette. La taille en
   AFFINITÉ n'a pas de nombre : elle ajoute au vecteur — seule voie par
   laquelle l'atelier touche à l'identité élémentaire. Désertir détruit
   la gemme. Plafond : +15 par compétence toutes gemmes confondues.
   ================================================================== */
const GEMDEF={
  rubis:{el:1},saphir:{el:4},emeraude:{el:0},topaze:{el:2},onyx:{el:3},quartz:{el:2,weak:1},
  ambre:{spec:'endurance'},jade:{spec:'endurance'},cristalmana:{spec:'mana'},amethyste:{spec:'mana'},opale:{spec:'mana'},
  grenat:{spec:'vie'},diamant:{spec:'qualite'},
};
const GEMSPEC={
  degats:{n:'Dégâts',g:'刃',lo:1,hi:3,d:'+1 à +3 dégâts plats de l\'élément, sur une arme',arme:1},
  domaine:{n:'Domaine',g:'術',lo:4,hi:10,d:'+4 à +10 % de puissance aux modules de cet élément, sur une arme',arme:1},
  affinite:{n:'Affinité',g:'環',lo:.04,hi:.28,d:'ajoute l\'élément au vecteur de l\'objet : purifier une arme pure, ou faire basculer une arme mixte'},
  endurance:{n:'Endurance',g:'息',lo:.3,hi:1.2,d:'+0,3 à +1,2 endurance par seconde au combat'},
  mana:{n:'Mana',g:'気',lo:4,hi:12,d:'+4 à +12 de mana maximal'},
  vie:{n:'Vie',g:'命',lo:4,hi:12,d:'+4 à +12 PV maximum'},
  qualite:{n:'Qualité',g:'質',lo:.03,hi:.08,d:'+0,03 à +0,08 de qualité à l\'objet — le diamant seul le permet'},
};
const GEMK=Object.keys(GEMDEF);
const gemSpecs=mk=>GEMDEF[mk].spec?[GEMDEF[mk].spec]:['degats','domaine','affinite'];
/* la valeur dans la fourchette suit la qualité : misérable → bas, chef-d'œuvre → haut */
function gemValue(spec,q,mk){const d=GEMSPEC[spec],t=Math.max(0,Math.min(1,(q-.3)/2.2));
  return +((d.lo+(d.hi-d.lo)*t)*(mk&&GEMDEF[mk]&&GEMDEF[mk].weak?.6:1)).toFixed(2);}
function gemLabel(g){const d=GEMSPEC[g.spec];
  return matName(g.mk)+' — '+d.n+(g.spec==='affinite'?' '+EL[g.el].n+' +'+Math.round(g.v*100)+'%':g.spec==='degats'?' +'+g.v+' '+EL[g.el].n:g.spec==='domaine'?' +'+g.v+'% '+EL[g.el].n:' +'+g.v)+' · '+QNAME(g.q);}
/* le diamant touche à la qualité même de l'objet */
function applyGemQ(it){
  if(it.q0===undefined)it.q0=it.q;
  it.q=+(it.q0+(it.gems||[]).reduce((a,g)=>a+(g.spec==='qualite'?g.v:0),0)).toFixed(2);
  it.dur=+(it.durBase*it.q).toFixed(1);
}
function cutGem(mk,spec){
  if(!GEMDEF[mk])return toast('Ce n\'est pas une gemme');
  if(!gemSpecs(mk).includes(spec))return toast('Cette pierre ne se taille pas ainsi');
  if(!hasStation('tailleur'))return toast('Il faut un tailleur de pierre');
  if(!(S.mat[mk]>0))return toast('Il te faut '+matName(mk));
  S.mat[mk]--;if(!S.mat[mk])delete S.mat[mk];
  const q=quality(lv('taille'));
  const g={mk,spec,el:GEMDEF[mk].el,v:gemValue(spec,q,mk),q:+q.toFixed(2)};
  S.gems=S.gems||[];S.gems.push(g);
  gainXp('taille',MAT[mk].d*20);questTick('gem',1);
  cutIn('玉',gemLabel(g),'taille '+q.toFixed(2)+' — à sertir dans 装 ÉQUIPEMENT');
}
/* une gemme déjà taillée, pour le loot exceptionnel */
function randomGem(c){
  const mk=pick(GEMK),spec=pick(gemSpecs(mk)),q=+(0.8+Math.random()*1.2+(c?c.corr/100:0)).toFixed(2);
  return {mk,spec,el:GEMDEF[mk].el,v:gemValue(spec,q,mk),q};
}
/* recalcule le vecteur d'un objet : parties, affixes Wu Xing, puis affinités serties */
function applyGemVec(it){
  if(!it.vec0)it.vec0=it.vec.slice();
  let v=it.vec0.slice();
  (it.aff||[]).forEach(a=>{if(a.id==='vecaff')v[a.p.e]+=a.p.p/100;});
  (it.gems||[]).forEach(g=>{if(g.spec==='affinite')v[g.el]+=g.v;});
  it.vec=norm(v);
}
const itemOf=where=>where.startsWith('eq:')?S.eq[where.slice(3)]:S.items[+where.slice(4)];
function socketGem(where,gi){
  const it=itemOf(where),g=(S.gems||[])[gi];
  if(!it||!g)return;
  if(it.artefact)return toast('Un artefact ne se sertit pas — fini par nature');
  if(!it.slots)return toast('Aucune sertissure sur cet objet');
  it.gems=it.gems||[];
  if(it.gems.length>=it.slots)return toast('Toutes les sertissures sont prises — désertir détruit la gemme');
  if(GEMSPEC[g.spec].arme&&it.kind!=='arme')return toast('Cette taille ne vaut que sur une arme');
  const tot=it.gems.reduce((a,x)=>a+(x.spec===g.spec?x.v:0),0);
  if(g.spec!=='affinite'&&tot+g.v>15)return toast('Plafond atteint : +15 par compétence, toutes gemmes confondues');
  S.gems.splice(gi,1);it.gems.push(g);applyGemVec(it);applyGemQ(it);
  gainXp('enchantement',40);
  log('Serti : '+gemLabel(g)+' → '+it.nom);
}
function unsocketGem(where,i){
  const it=itemOf(where);if(!it||!it.gems||!it.gems[i])return;
  const g=it.gems.splice(i,1)[0];applyGemVec(it);applyGemQ(it);
  log('<span class="bd">Désertie et brisée : '+gemLabel(g)+'</span>');
}
/* effets lus au combat */
const gemSum=(it,spec,el)=>(it&&it.gems||[]).reduce((a,g)=>a+(g.spec===spec&&(el===undefined||g.el===el)?g.v:0),0);
function gemsWorn(){const l=[];ZK.forEach(zk=>{const it=eqOf(SLOTS.find(x=>x.zone===zk).k);if(it)l.push(it);});const w=weapon();if(w)l.push(w);return l;}
const gemEndurance=()=>gemsWorn().reduce((a,it)=>a+gemSum(it,'endurance'),0);
const gemMana=()=>gemsWorn().reduce((a,it)=>a+gemSum(it,'mana'),0);
const gemVie=()=>gemsWorn().reduce((a,it)=>a+gemSum(it,'vie'),0);
