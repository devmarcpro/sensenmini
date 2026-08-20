/* Sensen Mini — 47-sfx.js
   Sons synthétisés (WebAudio, aucun fichier) et retours visuels courts
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ==================================================================
   Tout est généré : quelques oscillateurs, des enveloppes courtes. Le
   contexte audio ne démarre qu'au premier geste (politique des
   navigateurs) ; S.sfx===false coupe tout. Les appels sont gardés par
   typeof dans le code de jeu : le simulateur n'a pas d'audio.
   ================================================================== */
let AC=null;
const SFX={
  hit:    [{w:'square',f:[180,120],t:.06,g:.08}],
  crit:   [{w:'square',f:[260,140],t:.09,g:.1},{w:'triangle',f:[520,260],t:.09,g:.06}],
  resolve:[{w:'sawtooth',f:[110,440],t:.18,g:.1},{w:'triangle',f:[660,880],t:.16,g:.06,d:.05}],
  parry:  [{w:'triangle',f:[880,1320],t:.08,g:.08}],
  hurt:   [{w:'square',f:[90,60],t:.12,g:.1}],
  kill:   [{w:'triangle',f:[440,880],t:.12,g:.07},{w:'sine',f:[660,990],t:.14,g:.05,d:.06}],
  cut:    [{w:'sine',f:[330,330],t:.22,g:.06},{w:'sine',f:[495,495],t:.18,g:.04,d:.08}],
  lvl:    [{w:'triangle',f:[523,523],t:.08,g:.06},{w:'triangle',f:[659,659],t:.08,g:.06,d:.09},{w:'triangle',f:[784,784],t:.14,g:.06,d:.18}],
  coin:   [{w:'sine',f:[1200,1600],t:.07,g:.05}],
  loot:   [{w:'triangle',f:[392,784],t:.12,g:.06},{w:'triangle',f:[988,1175],t:.12,g:.05,d:.1}],
  tick:   [{w:'square',f:[600,600],t:.03,g:.03}],
  down:   [{w:'sawtooth',f:[220,40],t:.5,g:.1}],
};
function sfx(k){
  if(S.sfx===false||!SFX[k])return;
  try{
    if(!AC){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;AC=new Ctx();}
    if(AC.state==='suspended')AC.resume();
    const now=AC.currentTime;
    SFX[k].forEach(v=>{
      const o=AC.createOscillator(),g=AC.createGain();
      o.type=v.w;const t0=now+(v.d||0);
      o.frequency.setValueAtTime(v.f[0],t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,v.f[1]),t0+v.t);
      g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(v.g,t0+.008);g.gain.exponentialRampToValueAtTime(0.0001,t0+v.t);
      o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+v.t+.02);
    });
  }catch(e){}
}
/* retours visuels : la scène tremble, les jauges clignotent */
function shake(strong){const s=$('scene');if(!s||!s.firstElementChild)return;const el=s.firstElementChild;
  el.classList.remove('shake','shake2');void el.offsetWidth;el.classList.add(strong?'shake2':'shake');}
function flashHp(){const g=$('gHp');if(!g||!g.parentElement)return;const b=g.parentElement.parentElement;
  b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');}
