/* Serveur statique de développement, sans dépendance.
   node tools/serve.mjs [port]  — sert la racine du projet, écoute sur toutes
   les interfaces et affiche l'URL à ouvrir depuis un téléphone du même Wi-Fi. */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,dirname,extname,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const port=+(process.argv[2]||process.env.PORT||5173);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json',
  '.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  try{
    let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
    if(p.endsWith('/'))p+='index.html';
    const f=join(root,normalize(p));
    if(!f.startsWith(root))throw 0;
    const st=await stat(f);
    if(st.isDirectory()){res.writeHead(302,{Location:p+'/'});return res.end();}
    res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream','Cache-Control':'no-store',
      'Service-Worker-Allowed':'/'});
    res.end(await readFile(f));
  }catch{res.writeHead(404);res.end('404 '+req.url);}
}).listen(port,'0.0.0.0',()=>{
  const lan=Object.values(networkInterfaces()).flat().filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address);
  console.log('森森 Sensen Mini — serveur de dev');
  console.log('  ordinateur : http://localhost:'+port+'/');
  lan.forEach(a=>console.log('  téléphone  : http://'+a+':'+port+'/   (même Wi-Fi)'));
  console.log('  Ctrl+C pour arrêter');
});
