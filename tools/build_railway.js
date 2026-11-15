// Baut dist/railway-function.ts: Spiel + Online-Server in EINER Datei für Railway Functions (Bun)
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
const r = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const svgUrl = (p) => 'data:image/svg+xml,' + encodeURIComponent(r(p).replace(/\s+/g, ' '));

const app = r('public/app.js')
  .replace("const LOGO = 'logo.svg';", () => `const LOGO = ${JSON.stringify(svgUrl('public/logo.svg'))};`)
  .replace("const EMBLEM = 'emblem.svg';", () => `const EMBLEM = ${JSON.stringify(svgUrl('public/emblem.svg'))};`);
const html = r('public/index.html')
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${r('public/style.css')}\n</style>`)
  .replace('<script src="engine.js"></script>', () => `<script>\n${r('shared/engine.js')}\n</script>`)
  .replace('<script src="koelsch.js"></script>', () => `<script>\n${r('public/koelsch.js')}\n</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${app}\n</script>`)
  .replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
  .replace('<link rel="apple-touch-icon" href="apple-touch-icon.png">\n', '')
  .replace('<link rel="alternate icon" href="icon-192.png" type="image/png">\n', '')
  .replace('<link rel="icon" href="emblem.svg" type="image/svg+xml">', () => `<link rel="icon" href="${svgUrl('public/emblem.svg')}" type="image/svg+xml">`);

const gz = (s) => zlib.gzipSync(Buffer.from(s, 'utf8'), { level: 9 }).toString('base64');

// Raum-/Verbindungslogik aus server.js übernehmen (ab "Räume" bis vor server.listen)
const srv = r('server.js');
const start = srv.indexOf('// ---------------- Räume ----------------');
const end = srv.indexOf('server.listen(');
const roomCode = srv.slice(start, end);
const version = (srv.match(/version: '([^']+)'/) || [])[1] || '?';

const out = `// Skalamala ${version} – Railway Function (Bun). Automatisch erzeugt von tools/build_railway.js
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const unzip = (b64: string) => gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
const HTML = unzip(${JSON.stringify(gz(html))});
const ENGINE_SRC = unzip(${JSON.stringify(gz(r('shared/engine.js')))});
const E: any = (() => { const module: any = { exports: {} }; new Function('module', 'exports', ENGINE_SRC)(module, module.exports); return module.exports; })();

const RECONNECT_GRACE_MS = 20000;
const MAX_PLAYERS = 8;

// Kleine Hülle, damit die Raumlogik aus server.js unverändert läuft
class WSWrap {
  ws: any; h: Record<string, Function[]> = {}; closed = false;
  constructor(ws: any) { this.ws = ws; }
  on(ev: string, fn: Function) { (this.h[ev] = this.h[ev] || []).push(fn); }
  emit(ev: string, ...a: any[]) { (this.h[ev] || []).forEach((f) => f(...a)); }
  send(o: any) { if (this.closed) return; try { this.ws.send(JSON.stringify(o)); } catch (e) {} }
  ping() { try { this.ws.ping(); } catch (e) {} }
  close() { if (this.closed) return; try { this.ws.close(); } catch (e) {} this.closed = true; this.emit('close'); }
}

${roomCode}

const server = Bun.serve({
  port: Number(Bun.env.PORT || 3000),
  fetch(req: Request, srv: any) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      if (srv.upgrade(req, { data: {} })) return;
      return new Response('WebSocket erwartet', { status: 400 });
    }
    if (url.pathname === '/api/ping') return Response.json({ ok: true, version: '${version}', rooms: rooms.size }, { headers: { 'Cache-Control': 'no-store' } });
    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  },
  websocket: {
    idleTimeout: 120,
    open(ws: any) { const w = new WSWrap(ws); ws.data.w = w; onConnection(w); },
    message(ws: any, msg: any) { ws.data.w.emit('message', typeof msg === 'string' ? msg : Buffer.from(msg).toString('utf8')); },
    close(ws: any) { const w = ws.data.w; if (w && !w.closed) { w.closed = true; w.emit('close'); } },
  },
});
console.log('Skalamala ${version} läuft auf Port ' + server.port);
`;
fs.writeFileSync(path.join(root, 'dist/railway-function.ts'), out);
console.log('dist/railway-function.ts', out.length, 'Bytes');
