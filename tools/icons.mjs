/* Génère les icônes PNG de la PWA (icons/) à partir d'une page HTML rendue
   dans Edge/Chrome headless — même mécanique que smoke.mjs, sans dépendance.
   node tools/icons.mjs */
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'icons');mkdirSync(out,{recursive:true});
const BROWSERS=[
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const bin=process.env.BROWSER||BROWSERS.find(existsSync);
if(!bin){console.error('Aucun navigateur Chromium trouvé (définis BROWSER=chemin)');process.exit(2);}

/* La page d'icône : fond encre, rail vermillon, 森 au pinceau. `pad` réserve la
   zone sûre des icônes « maskable » (le système peut rogner 10 % de chaque côté). */
const page=(size,pad)=>`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=block" rel="stylesheet">
<style>html,body{margin:0;background:#0B0D0C}
.ic{position:relative;width:${size}px;height:${size}px;background:#0B0D0C;overflow:hidden;font-family:'Ma Shan Zheng',serif}
.rail{position:absolute;left:${pad}px;top:${pad}px;bottom:${pad}px;width:${Math.round(size*.14)}px;background:#C8332B}
.k{position:absolute;left:${Math.round(size*.14)+pad}px;right:${pad}px;top:${pad}px;bottom:${pad}px;display:grid;place-items:center;
  color:#F4F1E8;font-size:${Math.round((size-2*pad)*.62)}px;line-height:1}
.ul{position:absolute;left:${Math.round(size*.24)+pad}px;right:${Math.round(size*.12)+pad}px;bottom:${Math.round(size*.11)+pad}px;height:${Math.max(2,Math.round(size*.035))}px;background:#C8332B}
</style><div class="ic"><div class="rail"></div><div class="k">森</div><div class="ul"></div></div>`;

const profile=join(tmpdir(),'sensen-icons-'+process.pid);
const browser=spawn(bin,['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'--hide-scrollbars','about:blank'],{stdio:'ignore'});
const cleanup=()=>{
  if(process.platform==='win32')try{spawnSync('taskkill',['/PID',String(browser.pid),'/T','/F'],{stdio:'ignore'});}catch{}
  try{browser.kill();}catch{}
  try{rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}
};
process.on('exit',cleanup);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let wsUrl;
for(let i=0;i<80&&!wsUrl;i++){
  try{const [port]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n');
    wsUrl=(await (await fetch('http://127.0.0.1:'+port.trim()+'/json/version')).json()).webSocketDebuggerUrl;}
  catch{await sleep(250);}
}
if(!wsUrl){console.error('DevTools injoignable');process.exit(1);}
const ws=new WebSocket(wsUrl);await new Promise((ok,ko)=>{ws.onopen=ok;ws.onerror=ko;});
let seq=0;const pending=new Map();
ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.ko(new Error(m.error.message)):p.ok(m.result);}};
const send=(method,params={},sessionId)=>new Promise((ok,ko)=>{const id=++seq;pending.set(id,{ok,ko});ws.send(JSON.stringify({id,method,params,sessionId}));});
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const {sessionId:sid}=await send('Target.attachToTarget',{targetId,flatten:true});
const cdp=(m,p)=>send(m,p,sid);
await cdp('Page.enable');

const tmpHtml=join(profile,'icon.html');
async function render(name,size,pad){
  writeFileSync(tmpHtml,page(size,pad));
  await cdp('Emulation.setDeviceMetricsOverride',{width:size,height:size,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:pathToFileURL(tmpHtml).href});
  await sleep(300);
  /* attendre la police web : la feuille Google doit être arrivée (une face déclarée)
     puis la face chargée — fonts.check() répond vrai trop tôt, avant la feuille */
  let ok=false;
  for(let i=0;i<60&&!ok;i++){
    const r=await cdp('Runtime.evaluate',{awaitPromise:true,returnByValue:true,
      expression:'(async()=>{if(![...document.fonts].length)return false;const f=await document.fonts.load("40px \'Ma Shan Zheng\'");return f.length>0&&f.every(x=>x.status==="loaded");})()'});
    ok=!!r.result.value;if(!ok)await sleep(200);
  }
  if(!ok)console.warn('  (police pinceau non chargée — glyphe de secours)');
  await sleep(200);
  const {data}=await cdp('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:size,height:size,scale:1}});
  writeFileSync(join(out,name),Buffer.from(data,'base64'));
  console.log('icons/'+name);
}
await render('icon-192.png',192,0);
await render('icon-512.png',512,0);
await render('icon-maskable-512.png',512,52);
await render('apple-touch-icon.png',180,0);
ws.close();cleanup();process.exit(0);
