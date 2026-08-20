/* Test de fumée dans Edge/Chrome headless, piloté par CDP sans dépendance.
   node tools/smoke.mjs [--shots DIR] [--only phone|small|desktop]
   — sert le projet, ouvre index.html en mode téléphone (tactile) puis
     ordinateur, crée un personnage, visite chaque onglet, lance un combat,
     et signale : exceptions JS, erreurs console, débordement horizontal,
     sauvegarde en arrière-plan, rechargement.
   Captures d'écran dans DIR (défaut : .shots/). Code de sortie 1 si problème. */
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const arg=(k,d)=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:d;};
const SHOTS=arg('--shots',join(root,'.shots'));
mkdirSync(SHOTS,{recursive:true});
const PORT=5199;
const BROWSERS=[
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const bin=process.env.BROWSER||BROWSERS.find(existsSync);
if(!bin){console.error('Aucun navigateur Chromium trouvé (définis BROWSER=chemin)');process.exit(2);}

const server=spawn(process.execPath,[join(root,'tools/serve.mjs'),String(PORT)],{stdio:'ignore'});
const profile=join(tmpdir(),'sensen-smoke-'+process.pid);
const browser=spawn(bin,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,
  '--hide-scrollbars','--window-size=1280,900','about:blank'],{stdio:'ignore'});
let cleaned=false;
const cleanup=()=>{
  if(cleaned)return;cleaned=true;
  /* sous Windows, tuer l'arborescence : le lanceur seul laisse des orphelins qui verrouillent le profil */
  if(process.platform==='win32')try{spawnSync('taskkill',['/PID',String(browser.pid),'/T','/F'],{stdio:'ignore'});}catch{}
  try{browser.kill();}catch{}
  try{server.kill();}catch{}
  try{rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}
};
process.on('exit',cleanup);
process.on('SIGINT',()=>{cleanup();process.exit(130);});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function browserWs(){
  /* le port est choisi par le navigateur et écrit dans DevToolsActivePort */
  for(let i=0;i<80;i++){
    try{
      const [port]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n');
      const r=await fetch('http://127.0.0.1:'+port.trim()+'/json/version');
      return (await r.json()).webSocketDebuggerUrl;
    }catch{await sleep(250);}
  }
  throw new Error('DevTools injoignable');
}
const ws=new WebSocket(await browserWs());
await new Promise((ok,ko)=>{ws.onopen=ok;ws.onerror=ko;});
let seq=0;const pending=new Map(),listeners=[];
ws.onmessage=ev=>{const m=JSON.parse(ev.data);
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.ko(new Error(m.error.message)):p.ok(m.result);}
  else if(m.method)listeners.forEach(l=>l(m));};
const send=(method,params={},sessionId)=>new Promise((ok,ko)=>{const id=++seq;pending.set(id,{ok,ko});
  ws.send(JSON.stringify({id,method,params,sessionId}));});

const problems=[];
const report=(scen,kind,msg)=>{problems.push({scen,kind,msg});console.log('  x '+kind+' - '+msg);};

async function runScenario(scen){
  console.log('\n> '+scen.name+' ('+scen.w+'x'+scen.h+(scen.touch?', tactile':'')+')');
  /* un contexte de navigation par scénario : localStorage isolé, aucune fuite entre les runs */
  const {browserContextId}=await send('Target.createBrowserContext');
  const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});
  const {sessionId:sid}=await send('Target.attachToTarget',{targetId,flatten:true});
  const cdp=(m,p)=>send(m,p,sid);
  const errors=[];
  listeners.push(m=>{if(m.sessionId!==sid)return;
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '));
    if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!/favicon/.test(m.params.entry.url||''))errors.push(m.params.entry.text+' ('+(m.params.entry.url||'')+')');});
  await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:scen.w,height:scen.h,deviceScaleFactor:scen.dpr||1,mobile:!!scen.touch});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:!!scen.touch,maxTouchPoints:scen.touch?5:1});
  if(scen.ua)await cdp('Emulation.setUserAgentOverride',{userAgent:scen.ua});
  const evalJs=async(expr)=>{const r=await cdp('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw new Error('eval: '+(r.exceptionDetails.exception?.description||r.exceptionDetails.text));
    return r.result.value;};
  const shot=async(name)=>{const {data}=await cdp('Page.captureScreenshot',{format:'png'});
    const f=join(SHOTS,scen.key+'-'+name+'.png');writeFileSync(f,Buffer.from(data,'base64'));return f;};
  const checkOverflow=async(where)=>{
    const o=await evalJs('({sw:document.documentElement.scrollWidth,iw:innerWidth})');
    if(o.sw>o.iw+1)report(scen.name,'debordement horizontal',where+' : '+o.sw+'px pour '+o.iw+'px de large');
  };
  const flushErrors=where=>{while(errors.length)report(scen.name,'erreur JS',where+' : '+errors.shift().split('\n')[0]);};
  const center=async(sel)=>evalJs('(()=>{const e=document.querySelector('+JSON.stringify(sel)+');if(!e)return null;e.scrollIntoView({block:"center"});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()');
  const press=async(r)=>{
    if(scen.touch)await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y}]});
    else await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});
  };
  const release=async(r)=>{
    if(scen.touch)await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    else await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});
  };
  const tap=async(sel)=>{  /* vrai geste tactile ou souris sur l'element */
    const r=await center(sel);
    if(!r){report(scen.name,'element absent',sel);return false;}
    await press(r);await sleep(40);await release(r);
    return true;
  };

  const url='http://127.0.0.1:'+PORT+'/index.html';
  await cdp('Page.navigate',{url});await sleep(600);
  await evalJs('localStorage.clear()');
  await cdp('Page.navigate',{url});await sleep(900);
  flushErrors('chargement');
  await shot('1-gate');await checkOverflow('porte de creation');
  /* carte de naissance : un tap sur une case doit la selectionner */
  const cells=await evalJs('document.querySelectorAll("#pkPos .cell").length');
  if(cells!==81)report(scen.name,'creation','carte de naissance : '+cells+' cases au lieu de 81');
  else{
    await tap('#pkPos .cell:nth-child(41)');await sleep(100);
    const pos=await evalJs('cr.pos.join(",")');
    if(pos!=='0,0')report(scen.name,'creation','le tap sur la case centrale donne '+pos);
    await evalJs('document.getElementById("pkPos").scrollIntoView({block:"center"})');await sleep(100);
    await shot('1b-naissance');
  }
  /* creation de personnage : premiers choix, puis on depense les points */
  const gateOk=await evalJs(`(()=>{
    const g=document.getElementById('gate');if(!g||g.hidden)return 'pas de porte';
    for(const s of ['[data-race]','[data-cl]','[data-cel]','[data-can]']){const b=document.querySelector(s);if(!b)return 'manque '+s;b.click();}
    for(let i=0;i<40;i++){const b=document.querySelector('[data-sp]');if(!b)break;b.click();}
    const go=document.getElementById('goBtn');if(go.disabled)return 'NAITRE desactive';
    return 'ok';})()`);
  if(gateOk!=='ok')report(scen.name,'creation',gateOk+' — '
    +await evalJs('JSON.stringify({race:S.race,saved:(localStorage.getItem(KEY)||"").length,ready:document.readyState})'));
  await tap('#goBtn');await sleep(400);
  flushErrors('naissance');
  const born=await evalJs('!!S.race && document.getElementById("gate").hidden');
  if(!born)report(scen.name,'creation','le personnage n\'est pas ne');
  await shot('2-monde');await checkOverflow('onglet monde');
  /* tous les onglets */
  const tabs=await evalJs('[...document.querySelectorAll("#tabs button")].map(b=>b.dataset.tab)');
  const panels=['monde','cell','recolte','atelier','equip','magie','table','ville','pnj','comps','batir','royaume','guilde','sac','autos','skills'];
  const missing=panels.filter(k=>!tabs.includes(k));
  if(missing.length)report(scen.name,'onglet inaccessible','panneau sans bouton dans la nav : '+missing.join(', '));
  for(const t of tabs){
    if(!await tap('#tabs button[data-tab="'+t+'"]'))continue;
    await sleep(150);flushErrors('onglet '+t);
    const sel=await evalJs('tab');
    if(sel!==t)report(scen.name,'onglet','le tap sur '+t+' a ouvert '+sel);
    await checkOverflow('onglet '+t);
    if(['atelier','royaume','skills','sac','autos'].includes(t))await shot('3-'+t);
  }
  /* combat : GARDE maintenue puis relachee, puis LOURDE */
  await tap('#tabs button[data-tab="monde"]');await sleep(100);
  await tap('[data-occ="combat"]');await sleep(1600);flushErrors('entree en combat');
  const inCombat=await evalJs('S.occ==="combat"&&!!document.getElementById("guardBtn")');
  if(!inCombat)report(scen.name,'combat','la scene de combat ne s\'est pas ouverte');
  else{
    const g=await center('#guardBtn');
    await press(g);await sleep(300);
    const held=await evalJs('S.guard===true||(typeof E!=="undefined"&&E&&wind>=0)');
    if(!held)report(scen.name,'combat','GARDE maintenue ne leve pas la garde');
    await release(g);await sleep(80);
    const rel=await evalJs('S.guard===false');
    if(!rel)report(scen.name,'combat','la garde ne retombe pas au relachement');
    if(!scen.touch){
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' '});await sleep(150);
      const kh=await evalJs('S.guard===true||(typeof E!=="undefined"&&E&&wind>=0)');
      if(!kh)report(scen.name,'combat','Espace ne leve pas la garde');
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' '});
    }
    await tap('#heavyBtn');await sleep(300);
    await shot('4-combat');await checkOverflow('combat');flushErrors('combat');
    /* multi-ennemis : forcer un groupe, verifier l'affichage et le changement de cible */
    const grp=await evalJs(`(()=>{try{
      const vus={};
      for(let i=0;i<300&&EE.length<2;i++){spawn();vus[EE.length]=(vus[EE.length]||0)+1;}
      if(EE.length<2)return 'pas de groupe : biome '+here().b+' occ '+S.occ+' tailles '+JSON.stringify(vus)
        +' pool '+JSON.stringify([...new Set(Array.from({length:40},()=>creaturePool(here(),false,false)))]);
      buildScene();render();
      const chips=document.querySelectorAll('#mobs .mchip').length;
      if(chips!==EE.length)return 'chips '+chips+' pour '+EE.length+' creatures';
      const e0=EE[0];refocus(1);
      if(!E||E===e0)return 'le changement de cible ne prend pas';
      return 'ok:'+EE.length;
    }catch(e){return 'erreur '+e.message;}})()`);
    /* prises en main : bouclier, deux mains, deux armes, arc */
    const pr=await evalJs(`(()=>{try{
      const mk=fn=>{const p=FUNC[fn].comp.map(ct=>partFor(ct,['fer','chene','cuir','frene']));p.push(partFor('fixations',['fer']));return mkItem('arme',fn,p,1.2);};
      const set=(a,b)=>{S.eq={};S.items=[];S.items.push(mk(a));equipItem(0);if(b){S.items.push(mk(b));equipItem(0);}return grip().k;};
      const out=[];
      if(set('epee')!=='simple')out.push('epee seule');
      if(set('epee','bouclier')!=='bouclier')out.push('bouclier');
      if(set('epee','dague')!=='dualwield')out.push('deux armes');
      if(set('marteau')!=='deuxmains')out.push('deux mains');
      if(set('arc')!=='dist')out.push('arc');
      set('epee','bouclier');const pw=parryWin();
      set('marteau');if(!(pw>parryWin()))out.push('le bouclier n elargit pas la parade');
      set('arc');if(parryWin()!==0)out.push('on pare avec un arc');
      set('marteau','bouclier');if(S.eq.main2)out.push('deux mains garde une seconde main');
      return out.length?out.join(', '):'ok';
    }catch(e){return 'erreur '+e.message;}})()`);
    if(pr!=='ok')report(scen.name,'prise en main',pr);
    if(!String(grp).startsWith('ok'))report(scen.name,'multi-ennemis',grp);
    else{await sleep(200);await shot('5-groupe');await checkOverflow('combat de groupe');flushErrors('groupe');}
  }
  /* arriere-plan : la sauvegarde doit partir */
  await evalJs('localStorage.removeItem(KEY)');
  await evalJs('Object.defineProperty(document,"visibilityState",{value:"hidden",configurable:true});document.dispatchEvent(new Event("visibilitychange"))');
  await sleep(250);
  const saved=await evalJs('!!localStorage.getItem(KEY)');
  if(!saved)report(scen.name,'sauvegarde','rien n\'est sauvegarde quand l\'onglet passe en arriere-plan');
  await evalJs('Object.defineProperty(document,"visibilityState",{value:"visible",configurable:true});document.dispatchEvent(new Event("visibilitychange"))');
  await sleep(200);flushErrors('retour au premier plan');
  /* rechargement : la partie doit revenir */
  await evalJs('save()');await sleep(100);
  await cdp('Page.navigate',{url});await sleep(900);flushErrors('rechargement');
  const back=await evalJs('!!S.race&&document.getElementById("gate").hidden');
  if(!back)report(scen.name,'sauvegarde','la partie n\'est pas rechargee depuis localStorage — '
    +await evalJs('JSON.stringify({race:S.race,gate:document.getElementById("gate").hidden,saved:(localStorage.getItem(KEY)||"").length,ready:document.readyState})'));
  /* export / import : le texte doit recharger la meme partie */
  const io=await evalJs(`(()=>{try{
    S.or=12345;S.nom='Testeur';const txt=exportSave();
    if(!txt.startsWith('SENSEN1:'))return 'export mal forme';
    S.or=1;S.nom='Efface';
    importSave(txt);
    return (S.or===12345&&S.nom==='Testeur')?'ok':'import : or '+S.or+' nom '+S.nom;
  }catch(e){return 'erreur '+e.message;}})()`);
  if(io!=='ok')report(scen.name,'sauvegarde','export/import : '+io);
  /* hors-ligne : le service worker doit servir le jeu sans reseau */
  const swState=await evalJs('(async()=>{if(!("serviceWorker" in navigator))return "absent";try{const r=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),6000))]);if(!r)return "timeout";for(let i=0;i<40&&!navigator.serviceWorker.controller;i++)await new Promise(r=>setTimeout(r,150));return navigator.serviceWorker.controller?"ok":"sans controleur";}catch(e){return "erreur "+e.message;}})()');
  if(swState!=='ok')report(scen.name,'hors-ligne','service worker : '+swState);
  else{
    await sleep(1500);  /* laisser l'installation finir de remplir le cache */
    await cdp('Network.enable');
    await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await cdp('Page.navigate',{url});await sleep(1200);
    const off=await evalJs('(()=>{try{return {race:!!S.race,tabs:document.querySelectorAll("#tabs button").length,css:getComputedStyle(document.body).backgroundColor};}catch(e){return {err:String(e)};}})()');
    if(!off.race||off.tabs<16||off.css!=='rgb(11, 13, 12)')report(scen.name,'hors-ligne','la page ne se charge pas sans reseau : '+JSON.stringify(off));
    await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    flushErrors('hors-ligne');
  }
  await send('Target.closeTarget',{targetId});
  await sleep(300);
  await send('Target.disposeBrowserContext',{browserContextId}).catch(()=>{});
}

const SCENARIOS=[
  {key:'phone',name:'telephone',w:390,h:844,dpr:2,touch:true,
    ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'},
  {key:'small',name:'petit telephone',w:320,h:568,dpr:2,touch:true},
  {key:'desktop',name:'ordinateur',w:1280,h:860,dpr:1,touch:false},
];
const only=arg('--only');
try{
  for(const s of SCENARIOS)if(!only||s.key===only)await runScenario(s);
}catch(e){console.error(e);problems.push({kind:'harnais',msg:String(e)});}
ws.close();cleanup();
console.log('\n'+(problems.length?problems.length+' probleme(s)':'aucun probleme detecte')+' - captures : '+SHOTS);
process.exit(problems.length?1:0);
