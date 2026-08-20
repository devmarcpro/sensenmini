/* Génère src/02-data-materials.js depuis le catalogue F.1 du GDD (et F.8 pour les plantes).
   node tools/gen-materials.mjs
   — parse les tableaux markdown, normalise les clés, reprend dureté / densité /
   valeur / conductivité de mana / isolation / luminosité / couleur, ajoute les
   matériaux propres à la version mini (mithril, adamant, cristal de mana, os,
   écailles, cendre, baies…), puis répartit par biome et par strate. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const gdd=readFileSync(join(root,'SENSEN_GDD.md'),'utf8').split('\n');
const a=gdd.findIndex(l=>l.startsWith('### F.1 ')),b=gdd.findIndex(l=>l.startsWith('### F.1.1')),c=gdd.findIndex(l=>l.startsWith('### F.2 '));
const f1=gdd.slice(a,b),pal=gdd.slice(b,c);

/* ----- clés : sans accent, sans espace ; quelques renommages pour coller aux clés existantes ----- */
const RENAME={'granitnoirgabbro':'granitnoir','liegechenelieges':'liege','liegechenelie':'liege','palmierstipe':'palmier','robinierfauxacacia':'robinier',
  'aluminiumbauxite':'aluminium','chromechromite':'chrome','calcitespath':'calcite','selgemme':'sel','houille':'charbon','osfossile':'osfossile',
  'tufvolcanique':'tuf','pierreponce':'ponce','brechevolcanique':'breche','meteoriteferreuse':'meteorite','guanosalpetredegrotte':'guano',
  'tourbecompactee':'tourbecomp','argilerefractaire':'argileref','boisflotte':'boisflotte','boiscalcine':'boiscalcine','coquillagefossile':'coquillage',
  'boispetrifie':'boispetrifie','terrefertile':'terrefertile','eau':'eaupure','eausalee':'eausalee','gaiac':'boisfer','lapislazuli':'lapis'};
const slug=s=>{const k=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');return RENAME[k]||k;};
const CATMAP={'Bois':'bois','Métaux':'metal','Roches':'roche','Terres':'terre','Végétaux & fibres':'vegetal','Liquides':'liquide',
  'Minéraux':'mineral','Fossiles':'fossile','Météorologiques':'meteo','Gemmes':'gemme'};
const SKIP=new Set(['eausalee','lave','huile','goudron','boue','seve','neige_']);   /* liquides exotiques : pas de récolte dans le mini */

/* ----- parse F.1 ----- */
let cat=null;const rows=[];
for(const l of f1){
  const m=l.match(/^\*\*([^(]+)\(/);
  if(m){const name=m[1].trim();cat=Object.keys(CATMAP).find(k=>name.startsWith(k))?CATMAP[Object.keys(CATMAP).find(k=>name.startsWith(k))]:null;continue;}
  if(!cat||!l.startsWith('| ')||l.startsWith('| Matériau')||l.startsWith('|---'))continue;
  const cols=l.split('|').slice(1,-1).map(x=>x.trim());
  if(cols.length<14||isNaN(+cols[1]))continue;
  const [name,dur,den,val,cma,fla,iso,cel,flo,lum]=cols;
  const key=slug(name.replace(/\s*\(.*\)$/,''));if(SKIP.has(key))continue;
  rows.push({key,n:name.replace(/\s*\(.*\)$/,'').replace('Granit noir','Granit noir').replace('Liège','Liège'),c:cat,d:+dur,de:+den,v:+val,cma:+cma,iso:+iso,lum:+lum});
}
/* ----- palette F.1.1 ----- */
const col={};
for(const l of pal){for(const m of l.matchAll(/([^·:*]+?)\s(#[0-9A-Fa-f]{6})/g)){const k=slug(m[1].trim());col[k]=m[2];}}

/* ----- ajustements et matériaux propres au mini ----- */
const WX={obsidienne:{2:.5,1:.5},charbon:{1:1},anthracite:{1:1},lignite:{1:.8,2:.2},soufre:{1:.9,2:.1},bitume:{1:.7,2:.3},cendre:{1:1},glace:{4:1},neige:{4:1},
  rubis:{1:1},saphir:{4:1},emeraude:{0:1},topaze:{2:1},onyx:{3:1},quartz:{2:.5,3:.5},amethyste:{4:.5,0:.5},grenat:{1:.6,2:.4},opale:{4:.6,3:.4},jade:{0:.6,2:.4},diamant:{3:.7,4:.3},
  os:{0:.5,2:.5},osfossile:{0:.4,2:.6},ambre:{0:.6,2:.4},boispetrifie:{0:.3,2:.7},meteorite:{3:.7,1:.3},pyrite:{3:.6,1:.4},malachite:{3:.5,0:.5},cinabre:{1:.6,2:.4},
  lapis:{4:.6,3:.4},turquoise:{4:.5,2:.5},fluorine:{4:.5,3:.5},boiscalcine:{1:.5,0:.5},tourbe:{2:.6,0:.4},tourbecomp:{2:.5,1:.5},eaupure:{4:1},sel:{4:.5,2:.5},
  fourrure:{0:.6,2:.4},cuir:{0:.6,2:.4},soie:{0:.7,3:.3}};
const EXTRA=[ /* fantaisie et parties : pas dans F.1 */
  {key:'mithril',n:'Mithril',c:'metal',d:31,de:5,v:130,cma:110,iso:5,lum:6,col:'#9FD7E8'},
  {key:'adamant',n:'Adamant',c:'metal',d:44,de:15,v:280,cma:40,iso:5,lum:0,col:'#5B6A80'},
  {key:'cristalmana',n:'Cristal de mana',c:'mineral',d:18,de:6,v:150,cma:150,iso:15,lum:40,col:'#7FB2FF',wx:{4:.4,0:.3,3:.3}},
  {key:'os',n:'Os',c:'fossile',d:14,de:6,v:6,cma:5,iso:20,lum:0,col:'#E9E3CF'},
  {key:'ecaille',n:'Écailles',c:'fossile',d:19,de:7,v:24,cma:10,iso:15,lum:0,col:'#4F7A6A',wx:{4:.5,3:.5}},
  {key:'cendre',n:'Cendre',c:'meteo',d:2,de:2,v:2,cma:3,iso:40,lum:0,col:'#6F6B66'},
  {key:'limon',n:'Limon',c:'terre',d:2,de:6,v:1,cma:5,iso:35,lum:0,col:'#8C6E4A'},
  {key:'onyx',n:'Onyx',c:'gemme',d:25,de:9,v:30,cma:40,iso:10,lum:4,col:'#2B2B33',wx:{3:1}},
];
/* plantes F.8 et les comestibles d'origine : nutrition + groupe de potentiel (7.7) */
const PLANTS=[
  ['baies','Baies',1,1,1,10,'Vie','#9B2F5C'],['racines','Racines',4,3,2,16,'Récolte','#B98A5E'],['champignons','Champignons',2,1,3,13,'Magie','#C9B08C'],
  ['herbes','Herbes médicinales',3,1,9,6,'Magie','#6FA862'],
  ['ble','Blé',2,1,3,14,'Vie','#E4C36A'],['orge','Orge',2,1,3,12,'Vie','#D6BA74'],['carotte','Carotte',2,2,2,10,'Récolte','#E87C2A'],
  ['pommedeterre','Pomme de terre',3,3,2,16,'Défense','#C8A673'],['chou','Chou',2,2,2,9,'Défense','#8FBF6C'],['oignon','Oignon',2,2,2,7,'Artisanat','#D9C7A0'],
  ['citrouille','Citrouille',3,3,4,15,'Vie','#E08A2D'],['tomate','Tomate',1,1,3,8,'Magie','#D4402E'],
  ['framboise','Framboise',1,1,4,9,'Armes','#C63C6B'],['myrtille','Myrtille',1,1,4,9,'Magie','#4B4E9E'],['raisin','Raisin',1,1,5,10,'Vie','#7A3E7C'],
  ['houblon','Houblon',2,1,4,4,'Artisanat','#A9C45A'],
  ['camomille','Camomille',1,1,5,4,'Magie','#F1E8A8'],['menthe','Menthe',1,1,4,4,'Éléments','#5FB58B'],['sauge','Sauge',1,1,6,5,'Magie','#9DB4A0'],
  ['achillee','Achillée',1,1,6,5,'Défense','#E6E1C8'],['ortie','Ortie',2,1,3,5,'Armes','#5E8F4A'],
  ['belladone','Belladone',1,1,12,0,'Magie','#3C2A4D',1],['amanite','Amanite',1,1,6,0,'Magie','#C8322B',1],
  ['roseau','Roseau',2,1,2,2,'Artisanat','#B8B27A'],
];
const mats=[];const seen=new Set();
const push=m=>{if(seen.has(m.key))return;seen.add(m.key);mats.push(m);};
rows.forEach(r=>push({...r,col:col[r.key]}));
EXTRA.forEach(push);
PLANTS.forEach(([key,n,d,de,v,nutr,grp,c2,tox])=>push({key,n,c:'vegetal',d,de,v,cma:5,iso:40,lum:0,col:c2,nutr,grp,tox}));
/* nutrition et groupe de potentiel de ceux de F.1 qui se mangent ; cultures semables (7.4) */
const NUTR={sel:[3,'Artisanat'],eaupure:[4,'Vie'],glace:[3,'Éléments'],neige:[2,'Éléments'],ambre:[0,'Magie']};
mats.forEach(m=>{if(NUTR[m.key]){m.nutr=NUTR[m.key][0];m.grp=NUTR[m.key][1];}});
const CROPS=new Set(PLANTS.map(p=>p[0]).concat(['lin','coton','chanvre','paille']));
mats.forEach(m=>{if(CROPS.has(m.key))m.crop=1;});
mats.forEach(m=>{if(WX[m.key])m.wx=WX[m.key];});

/* ----- répartition par biome et par strate ----- */
const BIOMES={
  plaine:{n:'Plaine tempérée',c:'#6E8E5A',fert:1.0,mats:['pin','chene','hetre','frene','orme','pommier','lin','coton','chanvre','paille','ble','orge','carotte','chou','oignon','limon','terrefertile','argile','cuivre','gres','craie','calcaire','silex','ocre','baies','camomille']},
  foret:{n:'Forêt tempérée',c:'#3F6B45',fert:.9,mats:['chene','hetre','bouleau','erable','noyer','cerisier','charme','chataignier','tilleul','if','pin','champignons','herbes','framboise','myrtille','cuir','fourrure','os','sauge','achillee','ortie','amanite','pierre','limon']},
  foretmana:{n:'Forêt de mana',c:'#4B7F86',fert:.8,mats:['ebene','if','sequoia','amethyste','opale','quartz','cristalmana','soie','ambre','emeraude','herbes','sauge','fluorine','mica','champignons']},
  desert:{n:'Désert aride',c:'#C9A25E',fert:.2,mats:['gres','sable','sel','cuivre','os','topaze','racines','palmier','acacia','soufre','salpetre','turquoise','gypse','silex','ocre','etain']},
  cendres:{n:'Désert de cendres',c:'#7A5348',fert:.1,mats:['basalte','obsidienne','cendre','charbon','anthracite','soufre','rubis','tuf','ponce','pyrite','bitume','cinabre','boiscalcine','rhyolite','andesite']},
  toundra:{n:'Toundra',c:'#8FA3A8',fert:.3,mats:['glace','neige','limon','laine','fourrure','calcaire','racines','bouleau','saule','tourbe','schiste','grenat','gravier']},
  taiga:{n:'Taïga',c:'#4C6B5C',fert:.6,mats:['pin','sapin','epicea','meleze','chene','fer','os','laine','fourrure','champignons','tourbe','ardoise','charbon','myrtille','cedre']},
  marecage:{n:'Marécage',c:'#57654A',fert:.7,mats:['limon','argile','lin','cuir','charbon','eaupure','tourbe','saule','aulne','roseau','lignite','os','champignons','belladone','peuplier']},
  marcorr:{n:'Marécage corrompu',c:'#4A4257',fert:.3,mats:['os','obsidienne','charbon','ecaille','onyx','cinabre','bitume','soufre','osfossile','ammonite','belladone','amanite','boiscalcine','plomb']},
  montagne:{n:'Montagne',c:'#8A8A82',fert:.2,mats:['pierre','fer','calcaire','argent','basalte','granit','marbre','quartzite','gneiss','etain','zinc','plomb','nickel','ardoise','jade','grenat','diorite']},
  montcris:{n:'Montagne cristalline',c:'#7E8FB0',fert:.1,mats:['granitnoir','mithril','cristalmana','saphir','adamant','diamant','quartz','amethyste','opale','titane','platine','tungstene','cobalt','geode','kimberlite','peridotite','fluorine','meteorite']},
  cote:{n:'Côte',c:'#7FA9A0',fert:.5,mats:['gres','sel','lin','ecaille','saphir','eaupure','sable','coquillage','palmier','teck','boisflotte','roseau','argile','turquoise','bambou','olivier','cypres']},
};
const STRAT_MATS=[[],['calcaire','fer','schiste','dolomie','etain','charbon','conglomerat'],['pierre','argent','charbon','zinc','marbre','quartz','osfossile','graphite'],
  ['basalte','or','ambre','nickel','plomb','gneiss','ammonite','soufre','malachite'],['granit','mithril','onyx','cobalt','peridotite','grenat','geode','lapis','chrome'],
  ['granitnoir','adamant','cristalmana','tungstene','titane','diamant','meteorite','kimberlite','platine']];
/* tout ce qui est cité existe-t-il ? */
const all=new Set(mats.map(m=>m.key));
for(const bk in BIOMES)BIOMES[bk].mats.forEach(k=>{if(!all.has(k))throw new Error('biome '+bk+' cite un matériau inconnu : '+k);});
STRAT_MATS.flat().forEach(k=>{if(!all.has(k))throw new Error('strate cite un matériau inconnu : '+k);});

/* ----- écriture ----- */
const fmt=m=>{
  const o=['n:'+JSON.stringify(m.n),'c:\''+m.c+'\'','d:'+m.d,'de:'+m.de,'v:'+m.v];
  if(m.cma>=20)o.push('m:'+Math.round(m.cma/5));
  if(m.iso!==undefined)o.push('iso:'+Math.round(m.iso/10));
  if(m.lum)o.push('lum:'+m.lum);
  if(m.wx)o.push('wx:'+JSON.stringify(m.wx).replace(/"/g,''));
  if(m.nutr!==undefined)o.push('nutr:'+m.nutr);
  if(m.grp)o.push('grp:\''+m.grp+'\'');
  if(m.tox)o.push('tox:1');
  if(m.crop)o.push('crop:1');
  if(m.col)o.push('col:\''+m.col+'\'');
  return '  '+m.key+':{'+o.join(',')+'},';
};
const byCat={};mats.forEach(m=>(byCat[m.c]=byCat[m.c]||[]).push(m));
let out=`/* Sensen Mini — 02-data-materials.js
   Les ${mats.length} matériaux et leurs catégories — GÉNÉRÉ par tools/gen-materials.mjs
   depuis le catalogue F.1 du GDD (valeurs, conductivité de mana, isolation,
   luminosité, palette F.1.1) et F.8 pour les plantes. Ne pas éditer à la main :
   modifier le générateur ou le GDD, puis relancer.
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== MATÉRIAUX (4.2 / B.2 / F.1) =====
   d dureté · de densité · v valeur · m mana (CMa/5) · iso isolation (/10) ·
   lum luminosité · wx vecteur Wu Xing s'il diffère de la catégorie ·
   nutr nutrition crue · grp groupe de potentiel (7.7) · tox toxique cru · crop semable (7.4) · col couleur */
const CAT={
  bois:{n:'Bois',g:'木',tool:'hache',sk:'bucheronnage',wx:{0:1}},
  metal:{n:'Métal',g:'金',tool:'pioche',sk:'minage',wx:{3:1}},
  roche:{n:'Roche',g:'岩',tool:'pioche',sk:'minage',wx:{2:1}},
  terre:{n:'Terre',g:'土',tool:'pelle',sk:'terrassement',wx:{2:1}},
  vegetal:{n:'Végétal / fibre',g:'草',tool:'serpe',sk:'herboristerie',wx:{0:1}},
  liquide:{n:'Liquide',g:'水',tool:null,sk:'collecte',wx:{4:1}},
  mineral:{n:'Minéral',g:'鉱',tool:'pioche',sk:'minage',wx:{2:.6,3:.4}},
  fossile:{n:'Fossile',g:'骨',tool:'pioche',sk:'minage',wx:{0:.5,2:.5}},
  gemme:{n:'Gemme',g:'玉',tool:'pioche',sk:'minage',wx:{3:.5,2:.5}},
  meteo:{n:'Météorologique',g:'天',tool:null,sk:'collecte',wx:{4:.5,1:.5}},
};
const MAT={
`;
for(const ck of Object.keys(CAT_ORDER())){if(!byCat[ck])continue;out+='  /* --- '+ck+' ('+byCat[ck].length+') --- */\n'+byCat[ck].map(fmt).join('\n')+'\n';}
out+=`};
/* défensifs : une clé inconnue (sauvegarde ancienne, aperçu de gabarit) ne doit pas faire tomber le jeu */
const matVec=k=>MAT[k]?norm(V(MAT[k].wx||CAT[MAT[k].c].wx)):[.2,.2,.2,.2,.2];
const matName=k=>MAT[k]?MAT[k].n:String(k);
const BIOME={
`+Object.keys(BIOMES).map(k=>{const B=BIOMES[k];return '  '+k+':{n:'+JSON.stringify(B.n)+',c:\''+B.c+'\',fert:'+B.fert+',mats:'+JSON.stringify(B.mats).replace(/"/g,'\'')+'},';}).join('\n')+`
};
const POI={village:{n:'Village',g:'村'},donjon:{n:'Donjon',g:'塔'},camp:{n:'Camp',g:'幕'},
  sanctuaire:{n:'Sanctuaire',g:'社'},filon:{n:'Filon majeur',g:'鉱'}};
const TOWN=['Grispierre','Val-Muet','Fontcendre','Haute-Ronce','Sombreverse','Pierrelune','Trois-Racines',
  'Sel-du-Nord','Bassefeuille','Cormorance','Roche-Fendue','Ambrelune','Bois-Dormant','Clairvive','Ferrebrume',
  'Mortefontaine','Aubépine','Gué-des-Loups','Saint-Orme','Vieille-Forge','Brumaille','Les Tanneries','Ronce-Basse',
  'Porte-Grise','Cendrefeuille','Mont-Sauvage','Écluse-Noire','Hautefeuille','La Charbonnière','Pont-de-Sel'];
const STRATA=[
  {n:'Terre et grès',rock:'gres',prof:'surface'},
  {n:'Calcaire et ardoise',rock:'calcaire',prof:'−30'},
  {n:'Pierre',rock:'pierre',prof:'−80'},
  {n:'Basalte',rock:'basalte',prof:'−160'},
  {n:'Granit',rock:'granit',prof:'−260'},
  {n:'Granit noir',rock:'granitnoir',prof:'−380'},
];
const STRAT_MATS=`+JSON.stringify(STRAT_MATS).replace(/"/g,'\'').replace(/\],\[/g,'],\n  [')+`;
`;
function CAT_ORDER(){return {bois:1,metal:1,roche:1,terre:1,vegetal:1,liquide:1,mineral:1,fossile:1,gemme:1,meteo:1};}
writeFileSync(join(root,'src/02-data-materials.js'),out);
console.log('src/02-data-materials.js —',mats.length,'matériaux :',Object.keys(byCat).map(k=>k+' '+byCat[k].length).join(', '));
const missingCol=mats.filter(m=>!m.col).map(m=>m.key);if(missingCol.length)console.log('sans couleur :',missingCol.join(' '));
