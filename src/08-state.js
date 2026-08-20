/* Sensen Mini — 08-state.js
   État de la partie et dérivés
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== ÉTAT ===== */
const DAY=240,WEEK=7;   /* 4 min réelles = 1 jour in-game ; la nuit dure ~80 s, la semaine ~28 min */
function NEWSK(){const o={};SK.forEach(k=>o[k]={lv:0,xp:0,pot:80,base:80});return o;}
/* les stats aussi ont leur potentiel (6.4) : elles montent par l'usage, lentement */
function NEWSX(){const o={};STATS.forEach(([k])=>o[k]={xp:0,pot:100,base:100});return o;}
const NEW=()=>({
  seed:Math.floor(Math.random()*1e6),
  pos:[0,0],world:{},occ:'repos',target:null,
  hp:100,end:100,faim:100,mana:35,or:30,resume:null,stance:0,guard:false,seg:[],bonus:0,capBase:5,thr:20,
  race:null,classe:null,born:null,nom:'',stats:{force:5,dex:5,endu:5,vol:5,per:5,cha:5},
  npcs:[],rep:{g:0,race:{},king:{}},kd:{},towns:[],tax:.10,assaut:null,claims:[],struct:{},tresor:0,dette:0,gov:null,kingdoms:[],guilds:{},quest:null,vivres:0,
  food:{},potions:[],buffs:[],plats:0,comps:[],auto:{},rate:{},cnt:{},
  books:[],modules:[],spells:[[],[]],postures:[],surchauffe:false,
  sk:NEWSK(),sx:NEWSX(),mat:{},ref:{},comp:{},items:[],eq:{},recipes:{},nid:1,craft:null,carry:['etabli'],
  day:0,week:0,log:[],t:Date.now()
});
let S=NEW();
const key=(x,y)=>x+','+y;
function cell(x,y){const k=key(x,y);if(!S.world[k])S.world[k]=genCell(x,y);return S.world[k];}
const here=()=>cell(S.pos[0],S.pos[1]);
const lv=k=>S.sk[k]?S.sk[k].lv:0;
const avgPot=()=>SK.reduce((a,k)=>a+S.sk[k].pot,0)/SK.length;
const combatLvl=()=>{const l=SK.filter(k=>['Armes','Éléments','Types de dégâts','Défense','Magie','Constructions'].includes(SKILLS[k].grp))
  .map(lv).sort((a,b)=>b-a).slice(0,5);return (l.reduce((a,b)=>a+b,0)/5).toFixed(1);};
const genLvl=()=>{const l=SK.filter(k=>['Récolte','Artisanat','Vie'].includes(SKILLS[k].grp))
  .map(lv).sort((a,b)=>b-a).slice(0,5);return (l.reduce((a,b)=>a+b,0)/5).toFixed(1);};
