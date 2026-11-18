/*
 * Skalamala – Online-Server
 * Keine Abhängigkeiten: nur Node.js (ab Version 18) wird benötigt.
 * Start:  node server.js      (Port über Umgebungsvariable PORT, Standard 3000)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const E = require('./shared/engine.js');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MAX_PLAYERS = 6;
const RECONNECT_GRACE_MS = 20000; // so lange wird auf einen getrennten Spieler gewartet, dann spielt ein Bot für ihn

// ---------------- Statische Dateien ----------------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
// ---------------- Besucher-Protokoll ----------------
// Gespeichert werden nur Zeit, Ereignis, Spielername, Raum und Gerätetyp – keine IP-Adressen.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'besuche.log');
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const LOG_MAX = 3000;
let visitLog = [];
try { visitLog = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean).slice(-LOG_MAX).map((l) => JSON.parse(l)); } catch (e) { visitLog = []; }
function device(ua) {
  ua = String(ua || '');
  const d = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Handy' : 'PC';
  const b = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  return b ? `${d} · ${b}` : d;
}
function logEvent(type, info) {
  const e = Object.assign({ t: new Date().toISOString(), type }, info || {});
  visitLog.push(e);
  if (visitLog.length > LOG_MAX) visitLog = visitLog.slice(-LOG_MAX);
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.appendFileSync(LOG_FILE, JSON.stringify(e) + '\n'); } catch (err) {}
}
const escH = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function adminPage() {
  const fmt = (iso) => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  const today = new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
  const isToday = (e) => new Date(e.t).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) === today;
  const visitsToday = visitLog.filter((e) => e.type === 'Besuch' && isToday(e)).length;
  const namesToday = [...new Set(visitLog.filter((e) => e.name && isToday(e)).map((e) => e.name))];
  const lastSeen = {};
  for (const e of visitLog) if (e.name) lastSeen[e.name] = e.t;
  const rows = visitLog.slice().reverse().slice(0, 500).map((e) => `<tr><td>${escH(fmt(e.t))}</td><td>${escH(e.type)}</td><td>${escH(e.name || '')}</td><td>${escH(e.room || '')}</td><td>${escH(e.info || e.dev || '')}</td></tr>`).join('');
  const seen = Object.entries(lastSeen).sort((a, b) => b[1].localeCompare(a[1])).map(([n, t]) => `<li><b>${escH(n)}</b> – zuletzt ${escH(fmt(t))}</li>`).join('');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skalamala – Besucher</title>
<style>body{font-family:system-ui,sans-serif;background:#0a1e66;color:#fff;margin:0;padding:16px}h1{margin:0 0 8px;color:#ffd23f}
.k{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}.k div{background:#1b3f9a;border-radius:12px;padding:10px 14px}.k b{font-size:1.5rem;display:block;color:#ffd23f}
table{border-collapse:collapse;width:100%;background:#fff;color:#111;border-radius:10px;overflow:hidden;font-size:.9rem}td,th{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left}th{background:#ffd23f}
ul{columns:2;padding-left:18px}a{color:#ffd23f}</style></head><body>
<h1>Skalamala – Besucher-Protokoll</h1>
<div class="k"><div><b>${visitsToday}</b>Seitenaufrufe heute</div><div><b>${namesToday.length}</b>Spieler heute</div><div><b>${Object.keys(lastSeen).length}</b>Spieler insgesamt</div><div><b>${rooms.size}</b>Räume gerade offen</div></div>
<h2>Spieler – zuletzt gesehen</h2><ul>${seen || '<li>noch niemand</li>'}</ul>
<h2>Letzte Ereignisse</h2>
<table><tr><th>Zeit</th><th>Ereignis</th><th>Name</th><th>Raum</th><th>Info</th></tr>${rows || '<tr><td colspan=5>noch keine Einträge</td></tr>'}</table>
<p style="opacity:.7;font-size:.8rem">Gespeichert werden nur Zeit, Ereignis, Name, Raum und Gerätetyp – keine IP-Adressen.</p></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/admin') {
    if (!ADMIN_KEY || url.searchParams.get('key') !== ADMIN_KEY) { res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(ADMIN_KEY ? 'Falscher Schlüssel.' : 'Admin-Seite ist aus: Umgebungsvariable ADMIN_KEY setzen.'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(adminPage());
  }
  if (url.pathname === '/' || url.pathname === '/index.html') logEvent('Besuch', { dev: device(req.headers['user-agent']) });
  if (url.pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, version: '1.65', rooms: rooms.size, fixed: [...rooms.values()].filter((r) => r.fixed).map((r) => ({ code: r.code, name: r.title, members: r.members })) }));
  }
  let file;
  if (url.pathname === '/engine.js') file = path.join(__dirname, 'shared', 'engine.js');
  else {
    const p = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    file = path.normalize(path.join(PUBLIC, p));
    if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------------- Minimaler WebSocket (RFC 6455) ----------------
class WS extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket; this.buf = Buffer.alloc(0); this.frags = []; this.closed = false; this.alive = true;
    socket.setNoDelay(true);
    socket.on('data', (d) => { this.buf = Buffer.concat([this.buf, d]); try { this._parse(); } catch (e) { this.close(); } });
    socket.on('close', () => this._closed());
    socket.on('end', () => this._closed());
    socket.on('error', () => this._closed());
  }
  _closed() { if (this.closed) return; this.closed = true; this.emit('close'); }
  _parse() {
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = b[0] & 0x80, op = b[0] & 0x0f, masked = b[1] & 0x80;
      let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > 1 << 20) return this.close();
      let mask = null;
      if (masked) { if (b.length < off + 4) return; mask = b.subarray(off, off + 4); off += 4; }
      if (b.length < off + len) return;
      const payload = Buffer.from(b.subarray(off, off + len));
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = b.subarray(off + len);
      this.alive = true;
      if (op === 0x8) return this.close();
      if (op === 0x9) { this._frame(0xA, payload); continue; }
      if (op === 0xA) continue;
      if (op === 0x1 || op === 0x2) { this.frags = [payload]; this.fragOp = op; }
      else if (op === 0x0) this.frags.push(payload);
      if (fin && this.fragOp === 0x1) {
        const msg = Buffer.concat(this.frags).toString('utf8');
        this.frags = [];
        this.emit('message', msg);
      }
    }
  }
  _frame(op, payload) {
    if (this.closed) return;
    const len = payload.length;
    let head;
    if (len < 126) head = Buffer.from([0x80 | op, len]);
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
    try { this.socket.write(Buffer.concat([head, payload])); } catch (e) { this._closed(); }
  }
  send(obj) { this._frame(0x1, Buffer.from(JSON.stringify(obj))); }
  ping() { this._frame(0x9, Buffer.alloc(0)); }
  close() { if (!this.closed) { this._frame(0x8, Buffer.alloc(0)); try { this.socket.end(); } catch (e) {} this._closed(); } }
}

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!req.url.startsWith('/ws') || !key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  const w = new WS(socket);
  w.dev = device(req.headers['user-agent']);
  onConnection(w);
});

// ---------------- Räume ----------------
const rooms = new Map();
const BOT_NAMES = ['Sabine', 'Hennes', 'Tünnes', 'Schäl', 'Mariechen', 'Jupp', 'Kättchen', 'Pitter', 'Billa', 'Fritz'];

// Feste Räume (rooms.json): bleiben immer bestehen, nur für die eingetragenen Mitglieder
function loadFixedRooms() {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(path.join(__dirname, 'rooms.json'), 'utf8')); } catch (e) { list = []; }
  for (const f of list) {
    const code = String(f.code || '').toUpperCase().trim();
    if (!/^[A-Z]{4}$/.test(code) || !Array.isArray(f.members) || !f.members.length) continue;
    rooms.set(code, { code, title: String(f.name || code), fixed: true, members: f.members.map(String), host: null, seats: [], game: null, created: Date.now(), emptySince: 0, tips: f.tips !== false });
  }
}
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } while (rooms.has(c));
  return c;
}
const cleanName = (n) => String(n || '').replace(/[<>]/g, '').trim().slice(0, 16) || 'Spieler';

function roomInfo(room, seat) {
  return {
    code: room.code, host: room.seats.indexOf(room.host), you: seat, started: !!room.game, tips: !!room.tips,
    title: room.title || '', fixed: !!room.fixed, members: room.members || [],
    seats: room.seats.map((s) => ({ name: s.name, bot: s.bot, connected: s.bot || !!s.ws })),
  };
}
function sendRoom(room) {
  room.seats.forEach((s, i) => { if (s.ws) s.ws.send({ t: 'room', room: roomInfo(room, i) }); });
}
function sendState(room) {
  if (!room.game) return;
  const host = room.seats.indexOf(room.host);
  room.seats.forEach((s, i) => {
    if (!s.ws) return;
    const v = room.game.view(i);
    v.host = host;
    // Wer hat am Rundenende schon „Weiter“ gedrückt?
    const rd = room.ready || new Set();
    v.ready = room.seats.map((st) => st.bot || rd.has(st));
    v.multi = true;
    v.tips = !!room.tips;
    v.players.forEach((p, k) => { const st = room.seats[k]; p.connected = st.bot || !!st.ws; });
    s.ws.send({ t: 'state', view: v });
  });
}
function tryNextRound(room) {
  if (!room.game || room.game.s.phase !== 'roundEnd') return;
  room.ready = room.ready || new Set();
  const humans = room.seats.filter((s) => !s.bot && s.ws);
  if (humans.length && humans.every((h) => room.ready.has(h))) {
    room.ready.clear();
    room.game.act(null, { type: 'nextRound' });
  } else sendState(room);
}
function pickHost(room) {
  if (room.host && room.seats.includes(room.host) && room.host.ws) return;
  const h = room.seats.find((s) => !s.bot && s.ws) || room.seats.find((s) => !s.bot);
  if (h) room.host = h;
}
function startGame(room) {
  logEvent('Spielstart', { room: room.title ? `${room.title} (${room.code})` : room.code, info: room.seats.map((s) => s.name).join(', ') });
  if (room.game) room.game.destroy();
  room.ready = new Set();
  room.game = new E.GameHost(room.seats.map((s) => ({ name: s.name, bot: s.bot })), {
    botDelay: 1000,
    knockMs: 7000,
    approveMs: 120000, // online: nach 2 Minuten ohne Antwort wird zugestimmt, damit niemand hängen bleibt
    isAuto: (seat) => {
      const st = room.seats[seat];
      return st.bot || (!st.ws && Date.now() - (st.leftAt || 0) > RECONNECT_GRACE_MS);
    },
    onChange: () => sendState(room),
  });
  sendRoom(room);
  sendState(room);
}
function newSeat(name) {
  return { name, bot: false, token: crypto.randomBytes(12).toString('hex'), ws: null, leftAt: 0 };
}
function removeSeat(room, st) {
  const i = room.seats.indexOf(st);
  if (i < 0) return;
  room.seats.splice(i, 1);
  pickHost(room);
  room.seats.forEach((s, k) => { if (s.ws) s.ws.send({ t: 'welcome', code: room.code, seat: k, token: s.token }); });
}

function onConnection(ws) {
  let room = null, me = null;
  const err = (msg) => ws.send({ t: 'error', msg });
  const isHost = () => room && room.host === me;
  const seatIdx = () => (room ? room.seats.indexOf(me) : -1);

  function attach(r, st) {
    logEvent(me === st || (st.ws && st.ws !== ws) || st.leftAt ? 'wieder verbunden' : 'Anmeldung', { name: st.name, room: r.title ? `${r.title} (${r.code})` : r.code, dev: ws.dev });
    room = r; me = st;
    if (st.ws && st.ws !== ws) { st.ws.send({ t: 'error', msg: 'Du hast dich auf einem anderen Gerät angemeldet.' }); st.ws.close(); }
    st.ws = ws; st.leftAt = 0;
    ws.send({ t: 'welcome', code: r.code, seat: r.seats.indexOf(st), token: st.token });
    pickHost(r);
    sendRoom(r);
    if (r.game) { r.game.refresh(); sendState(r); }
  }

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'ping': return ws.send({ t: 'pong' });
      case 'create': {
        if (room) return err('Du bist schon in einem Raum.');
        const st = newSeat(cleanName(m.name));
        const r = { code: newCode(), host: st, seats: [st], game: null, created: Date.now(), emptySince: 0, tips: m.tips !== false };
        rooms.set(r.code, r);
        return attach(r, st);
      }
      case 'join': {
        if (room) return err('Du bist schon in einem Raum.');
        const r = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!r) return err('Raum nicht gefunden. Code prüfen!');
        if (r.fixed) {
          // Fester Raum: nur Mitglieder, der Name wird zur eingetragenen Schreibweise
          const mem = r.members.find((x) => x.toLowerCase() === cleanName(m.name).toLowerCase());
          if (!mem) return err(`Der ${r.title} ist nur für ${r.members.join(', ')}. Bitte deinen Namen genau so eingeben.`);
          const own = r.seats.find((s) => !s.bot && s.name === mem);
          if (own) return attach(r, own);
          if (r.game) return err('Das Spiel in diesem Raum läuft bereits.');
          if (r.seats.length >= MAX_PLAYERS) return err('Der Raum ist voll.');
          const ns = newSeat(mem);
          r.seats.push(ns);
          return attach(r, ns);
        }
        // Wiederverbinden per Token oder gleichem Namen
        let st = m.token ? r.seats.find((s) => s.token === m.token) : null;
        if (!st) st = r.seats.find((s) => !s.bot && !s.ws && s.name.toLowerCase() === cleanName(m.name).toLowerCase());
        if (st) return attach(r, st);
        if (r.game) return err('Das Spiel in diesem Raum läuft bereits.');
        if (r.seats.length >= MAX_PLAYERS) return err('Der Raum ist voll.');
        let name = cleanName(m.name);
        while (r.seats.some((s) => s.name.toLowerCase() === name.toLowerCase())) name = name.slice(0, 14) + Math.floor(Math.random() * 10);
        st = newSeat(name);
        r.seats.push(st);
        return attach(r, st);
      }
      case 'addBot': {
        if (!isHost() || room.game) return;
        if (room.seats.length >= MAX_PLAYERS) return err('Der Raum ist voll.');
        const used = new Set(room.seats.map((s) => s.name.replace(' 🤖', '').toLowerCase()));
        const name = (BOT_NAMES.find((n) => !used.has(n.toLowerCase())) || 'Bot') + ' 🤖';
        room.seats.push({ name, bot: true, token: '', ws: null });
        return sendRoom(room);
      }
      case 'kick': {
        if (!isHost() || room.game) return;
        const st = room.seats[m.seat | 0];
        if (!st || st === me) return;
        if (st.ws) { const w = st.ws; st.ws = null; w.send({ t: 'kicked' }); w.close(); }
        removeSeat(room, st);
        return sendRoom(room);
      }
      case 'tips': {
        if (!isHost() || room.game) return;
        room.tips = !!m.on;
        return sendRoom(room);
      }
      case 'start': {
        if (!isHost() || room.game) return;
        if (room.seats.length < 2) return err('Mindestens 2 Spieler (oder Bots) nötig.');
        return startGame(room);
      }
      case 'again': {
        if (!isHost() || !room.game) return;
        if (room.game.s.phase !== 'gameEnd') return;
        room.game.destroy(); room.game = null;
        for (const st of room.seats.slice()) if (!st.bot && !st.ws) removeSeat(room, st);
        room.seats.forEach((s, k) => { if (s.ws) s.ws.send({ t: 'welcome', code: room.code, seat: k, token: s.token }); });
        return sendRoom(room);
      }
      case 'act': {
        if (!room || !room.game) return;
        const a = m.a || {};
        if (a.type === 'nextRound') {
          // Jeder Spieler bestätigt „Weiter“ – sind alle bereit, startet die nächste Runde
          if (room.game.s.phase !== 'roundEnd') return;
          room.ready = room.ready || new Set();
          room.ready.add(me);
          return tryNextRound(room);
        }
        const e = room.game.act(seatIdx(), a);
        if (e) err(e);
        return;
      }
      case 'leave': return leave(true);
    }
  });

  function leave(explicit) {
    if (!room) return;
    const r = room, st = me;
    room = null; me = null;
    if (!st || st.ws !== ws) return;
    st.ws = null; st.leftAt = Date.now();
    if (!r.game && explicit) removeSeat(r, st);
    pickHost(r);
    sendRoom(r);
    if (r.game) {
      sendState(r);
      tryNextRound(r);
      setTimeout(() => r.game && r.game.refresh(), RECONNECT_GRACE_MS + 100);
    }
    if (explicit) ws.send({ t: 'left' });
  }
  ws.on('close', () => leave(false));
}

// Verbindungen am Leben halten, leere Räume aufräumen
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) {
    const anyone = r.seats.some((s) => !s.bot && s.ws);
    if (anyone) { r.emptySince = 0; r.seats.forEach((s) => s.ws && s.ws.ping()); continue; }
    if (!r.emptySince) r.emptySince = now;
    if (now - r.emptySince > 30 * 60 * 1000) {
      if (r.game) r.game.destroy();
      if (r.fixed) { r.game = null; r.seats = []; r.host = null; r.emptySince = 0; } // fester Raum bleibt, wird nur geleert
      else rooms.delete(code);
    }
  }
}, 25000);

loadFixedRooms();
server.listen(PORT, () => {
  console.log(`Skalamala-Server läuft auf http://localhost:${PORT}`);
});
