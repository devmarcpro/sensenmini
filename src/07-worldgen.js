/* Sensen Mini — 07-worldgen.js
   Bruit, biomes, cellules, strates
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== GÉNÉRATION ===== */
function hash(x,y,s,k){
  let h=(x*374761393+y*668265263+s*1013904223+(k||0)*2654435761)>>>0;
  h=Math.imul(h^(h>>>13),1274126177)>>>0;
  return ((h^(h>>>16))>>>0)/4294967296;
}
function noise(x,y,s,k,sc){
  sc=sc||3;const fx=x/sc,fy=y/sc,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;
  const sm=t=>t*t*(3-2*t),u=sm(tx),v=sm(ty);
  const a=hash(x0,y0,s,k),b=hash(x0+1,y0,s,k),c=hash(x0,y0+1,s,k),d=hash(x0+1,y0+1,s,k);
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
function genCell(x,y){
  const s=S.seed;
  const alt=noise(x,y,s,1,5),temp=noise(x,y,s,2,7),hum=noise(x,y,s,3,6),
        mana=noise(x,y,s,4,4),res=noise(x,y,s,5,3),veg=noise(x,y,s,6,4),dang=noise(x,y,s,7,3);
  /* VINGT BIOMES. Les huit nouveaux s'intercalent dans des combinaisons de
     bruits que rien n'occupait — ils ne prennent la place de personne, ils
     remplissent des trous. L'ordre compte : le plus specifique d'abord, et
     chaque test qui echoue laisse passer au suivant, si bien qu'aucun biome
     ne peut disparaitre par recouvrement. */
  let b;
  if(mana>.72&&veg>.5)b='foretmana';
  else if(alt>.74&&mana>.62)b='montcris';
  /* des ruines : peu de vie, un vieux danger, une altitude moyenne */
  else if(res>.72&&veg<.42&&alt>.35&&alt<.66)b='ruines';
  else if(temp>.74&&alt>.55)b='cendres';
  else if(dang>.76&&hum>.55)b='marcorr';
  /* un karst : de la roche tendre creusee par l'eau, donc humide et haute */
  else if(alt>.62&&hum>.58&&temp>.34)b='karst';
  else if(alt>.70)b='montagne';
  /* une banquise : le froid extreme au bord de l'eau */
  else if(alt<.24&&temp<.16)b='banquise';
  /* des salines : le bord de mer sec et chaud */
  else if(alt<.28&&hum<.30&&temp>.52)b='salines';
  else if(alt<.24)b='cote';
  else if(temp<.28)b=hum>.5?'taiga':'toundra';
  /* une oasis : de l'eau dans un desert, donc chaud, sec autour, humide ici */
  else if(temp>.68&&hum>.44&&hum<.62&&veg>.40&&alt<.5)b='oasis';
  else if(temp>.68&&hum<.34)b='desert';
  /* des bad-lands : chaud, sec, casse — entre le desert et la montagne */
  else if(temp>.60&&hum<.42&&alt>.46)b='badlands';
  else if(hum>.70)b='marecage';
  /* une jungle : le chaud et l'humide ensemble, avec de la vegetation */
  else if(temp>.62&&hum>.58&&veg>.46)b='jungle';
  else if(veg>.52)b='foret';
  /* une steppe : la plaine seche, celle ou rien ne pousse haut */
  else if(hum<.36&&veg<.42)b='steppe';
  else b='plaine';
  const c={x,y,b,alt:+alt.toFixed(2),temp:+temp.toFixed(2),hum:+hum.toFixed(2),
    mana:+mana.toFixed(2),res:+res.toFixed(2),veg:+veg.toFixed(2),
    corr:Math.round(dang*100),corr0:Math.round(dang*100),
    seen:false,depth:0,cleared:0,vide:0,claim:null,dug:0};
  const r=hash(x,y,s,9);
  if(r<.04)c.poi='village';else if(r<.10)c.poi='donjon';else if(r<.18)c.poi='camp';
  else if(r<.21)c.poi='sanctuaire';else if(r<.27)c.poi='filon';
  /* Les huit nouveaux prennent la place du VIDE — les seuils d'origine ne
     bougent pas d'un pouce, donc un monde deja explore garde exactement les
     memes villages aux memes endroits. Ce qui etait une case nue devient
     parfois quelque chose, et jamais l'inverse.
     Chacun se pose la ou son biome a du sens : une source chaude en
     montagne, une carcasse dans la toundra, un monolithe la ou le mana
     affleure. Un lieu qui pourrait etre partout n'appartient a nulle part. */
  else{
    const r2=hash(x,y,s,17);
    const chaud=c.temp>.55,froid=c.temp<.32,haut=c.alt>.6,mana=c.mana>.55,sec=c.hum<.4;
    if(r2<.030&&(c.b==='ruines'||c.res>.6))c.poi='ruine';
    else if(r2<.055&&(froid||c.b==='marecage'||c.b==='marcorr'||c.b==='cendres'))c.poi='tombe';
    else if(r2<.072&&(c.b==='ruines'||mana))c.poi='bibliotheque';
    else if(r2<.098&&(haut||c.b==='karst'||c.b==='oasis'))c.poi='source';
    else if(r2<.120&&mana)c.poi='monolithe';
    else if(r2<.138&&mana&&!sec)c.poi='cercle';
    else if(r2<.162&&(c.b==='foret'||c.b==='taiga'||c.b==='montagne'||c.b==='jungle'))c.poi='ermitage';
    else if(r2<.190&&(froid||c.b==='desert'||c.b==='badlands'||c.b==='banquise'||chaud))c.poi='carcasse';
  }
  if(c.poi==='village'){
    const base=TOWN[Math.floor(hash(x,y,s,11)*TOWN.length)];
    const q=hash(x,y,s,12);
    c.town=q<.45?base:base+'-'+TOWNQ[Math.floor(hash(x,y,s,13)*TOWNQ.length)];
  }
  if(c.poi==='donjon'||c.poi==='camp')c.corr=Math.min(100,c.corr+12);
  return c;
}
function cellVec(c){
  return norm([c.veg*c.hum*1.4,Math.max(c.temp-.55,0)*2.2+(c.b==='cendres'?.6:0),
    .35+c.alt*.5,c.res*1.2,Math.max(c.hum-.4,0)*1.8]);
}
/* stock hebdomadaire d'un matériau sur une cellule (3.3) : ce qui est pris manque
   jusqu'à la régénération. Les matériaux du biome abondent, ceux des strates et
   des filons sont plus comptés. */
function stockMax(c,mk){
  const local=BIOME[c.b].mats.includes(mk);
  const veg=(MAT[mk].c==='vegetal'||MAT[mk].c==='bois')?season().veg:1;    /* l'hiver appauvrit le vivant */
  const base=Math.round((90+c.res*360)*(local?1:.45)*veg*(c.poi==='filon'&&['fer','argent','or'].includes(mk)?2:1));
  return Math.max(20,base);
}
function stockOf(c,mk){
  c.stock=c.stock||{};
  if(c.stock[mk]===undefined)c.stock[mk]=stockMax(c,mk);
  return c.stock[mk];
}
function takeStock(c,mk,n){const s=stockOf(c,mk);const t=Math.min(s,n);c.stock[mk]=s-t;return t;}
/* ===== RÉGÉNÉRATION HEBDOMADAIRE (3.3) =====
   La règle disait « ce qui est pris manque jusqu'à la régénération », et le
   code effaçait tout le stock chaque semaine : chaque gisement revenait à
   plein, quoi qu'on lui ait fait. Une seule case pouvait donc nourrir un
   mineur indéfiniment — cinq cent mille unités de matière en deux ans de
   jeu simulé, sans jamais bouger. La lettre était respectée, l'esprit non :
   une mine qui se referme d'une semaine sur l'autre n'est pas une mine.

   Une case sauvage revient donc d'un quart de son plein par semaine. Qui la
   travaille sans relâche la tient à sec et doit tourner sur plusieurs cases ;
   qui la laisse reposer la retrouve entière en un mois.

   Une case revendiquée en « ressources naturelles » fait exception et se
   refait entièrement : c'est précisément ce qu'on achète en la revendiquant. */
const REGEN_HEBDO=.25;
function regenStocks(){
  let n=0;
  for(const k in S.world){
    const c=S.world[k];
    if(!c.stock)continue;
    if(c.claim&&c.claim!=='ressources')continue;
    if(c.claim==='ressources'){delete c.stock;n++;continue;}
    let pleins=0,total=0;
    for(const mk in c.stock){
      if(!MAT[mk]){delete c.stock[mk];continue;}
      const max=stockMax(c,mk);
      c.stock[mk]=Math.min(max,c.stock[mk]+Math.ceil(max*REGEN_HEBDO));
      total++;if(c.stock[mk]>=max)pleins++;
    }
    /* entièrement revenue : on oublie le compteur, la sauvegarde s'allège */
    if(!total||pleins===total)delete c.stock;
    n++;
  }
  return n;
}
function cellMats(c){
  const l=BIOME[c.b].mats.slice();
  /* borne sur la table, pas sur la profondeur : pierce() plafonne deja a cinq,
     mais une sauvegarde importee ou abimee ne le garantit pas, et un cellMats
     qui leve casse la recolte, le butin et le rendu de la case d'un coup */
  const dmax=Math.min(c.depth||0,STRAT_MATS.length-1);
  for(let i=1;i<=dmax;i++)STRAT_MATS[i].forEach(m=>l.push(m));
  if(c.poi==='filon')['fer','argent','or'].forEach(m=>l.push(m));
  if(c.depth>0)l.push(STRATA[Math.min(5,c.depth)].rock);
  return [...new Set(l)];
}
