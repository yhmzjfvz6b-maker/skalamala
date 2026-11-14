/* Skalamala – Oberfläche */
(function () {
  'use strict';
  const E = window.Skalamala;
  const LOGO = 'logo.webp';
  const COLORS = ['#2bb24c', '#ff9417', '#3fa9ff', '#e5262f', '#8e44d9', '#f2c200', '#ff5fa2', '#14b8a6'];
  const avatar = (name, i, extra) => `<span class="av ${extra && extra.off ? 'off' : ''}" style="--c:${COLORS[i % COLORS.length]}">${esc(String(name).replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase() || '?')}${extra && extra.cnt != null ? `<span class="cnt">${extra.cnt}</span>` : ''}</span>`;
  // Narrenkappe für den Joker (eigene Zeichnung)
  const JESTER = '<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M14 72 C20 48 30 30 50 22 C70 30 80 48 86 72 Z" fill="#e5262f"/><path d="M14 72 C10 48 4 34 6 20 C22 30 34 44 40 60 Z" fill="#ffd23f"/><path d="M86 72 C90 48 96 34 94 20 C78 30 66 44 60 60 Z" fill="#2f6fe8"/><path d="M40 60 C44 40 47 24 50 8 C53 24 56 40 60 60 Z" fill="#ff9417"/><rect x="10" y="68" width="80" height="14" rx="7" fill="#ffd23f" stroke="#b84a00" stroke-width="2"/><circle cx="6" cy="18" r="7" fill="#ffd23f" stroke="#b84a00" stroke-width="2"/><circle cx="94" cy="18" r="7" fill="#ffd23f" stroke="#b84a00" stroke-width="2"/><circle cx="50" cy="7" r="7" fill="#ffd23f" stroke="#b84a00" stroke-width="2"/></svg>';
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $toast = document.getElementById('toast');

  // ---------- Hilfen ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('skalamala_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('skalamala_' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('skalamala_' + k); } catch (e) {} },
  };
  let toastTimer;
  function toast(msg, ms) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), ms || 2600);
  }
  function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
  function openModal(html, onClick) {
    $modal.innerHTML = `<div class="sheet">${html}</div>`;
    $modal.classList.remove('hidden');
    $modal.onclick = (e) => {
      if (e.target === $modal || e.target.closest('[data-close]')) return closeModal();
      if (onClick) onClick(e);
    };
  }
  function closeModal() { $modal.classList.add('hidden'); $modal.innerHTML = ''; ui.modalKind = null; }

  function cardHTML(c, opts) {
    opts = opts || {};
    const cls = opts.cls || '';
    if (!c) return `<div class="card empty ${cls}"></div>`;
    const data = `data-id="${c.id}"`;
    if (c.joker) {
      const rep = opts.rep ? `<span class="rep">${E.rankLabel(opts.rep)}</span>` : '';
      return `<div class="card joker ${cls}" ${data} aria-label="Joker"><span class="ci"><b>★</b></span><span class="jk">${JESTER}<em>JOKER</em></span>${rep}</div>`;
    }
    const r = E.rankLabel(c.rank), s = E.SUIT_SYM[c.suit];
    return `<div class="card ${E.isRed(c) ? 'red' : 'black'} ${cls}" ${data} aria-label="${E.SUIT_NAME[c.suit]} ${r}"><span class="ci"><b>${r}</b><i>${s}</i></span><span class="cs">${s}</span><span class="ci br"><b>${r}</b><i>${s}</i></span></div>`;
  }

  const SUIT_ORDER = { S: 0, H: 1, C: 2, D: 3 };
  function sortHand(hand, mode) {
    return hand.slice().sort((a, b) => {
      if (a.joker !== b.joker) return a.joker ? 1 : -1;
      if (a.joker) return a.id - b.id;
      if (mode === 'rank') return a.rank - b.rank || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.id - b.id;
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.rank - b.rank || a.id - b.id;
    });
  }

  // Passen die (vorgemerkten) Kombinationen auf verschiedene Vorgaben?
  function partialMatch(melds, slots) {
    if (melds.length > slots.length) return false;
    const used = slots.map(() => false);
    const bt = (i) => {
      if (i === melds.length) return true;
      for (let k = 0; k < slots.length; k++) {
        if (used[k] || !E.validMeld(melds[i], slots[k].t, slots[k].min)) continue;
        used[k] = true;
        if (bt(i + 1)) return true;
        used[k] = false;
      }
      return false;
    };
    return bt(0);
  }

  // ---------- Zustand der Oberfläche ----------
  const ui = {
    screen: 'home',
    name: store.get('name', ''),
    bots: store.get('bots', 2),
    knockPrompt: store.get('knockPrompt', true),
    sort: store.get('sort', 'suit'),
    ctl: null,
    view: null,
    room: null,
    selected: [],
    staged: [],
    stageKey: '',
    knockStart: 0, knockSeq: -1,
    lastTurnKey: '',
    modalKind: null,
    onlineAvailable: false,
  };

  // ---------- Steuerung lokal (gegen Bots) ----------
  const BOT_NAMES = ['Sabine', 'Hennes', 'Tünnes', 'Mariechen', 'Jupp', 'Kättchen', 'Pitter'];
  class LocalCtl {
    constructor(name, nBots) {
      this.mode = 'local';
      this.players = [{ name, bot: false }].concat(
        BOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, nBots).map((n) => ({ name: n + ' 🤖', bot: true })));
      this.start();
    }
    start() {
      if (this.host) this.host.destroy();
      this.host = new E.GameHost(this.players, { botDelay: store.get('botDelay', 950), knockMs: 7000, onChange: () => this.emit() });
      this.emit();
    }
    emit() {
      const v = this.host.view(0);
      v.host = 0;
      v.players.forEach((p) => (p.connected = true));
      onView(v);
    }
    act(a) { const e = this.host.act(0, a); if (e) toast(e); }
    again() { this.start(); }
    leave() { this.host.destroy(); }
  }

  // ---------- Steuerung online ----------
  class OnlineCtl {
    constructor(intent) {
      this.mode = 'online';
      this.intent = intent; // {t:'create'|'join', name, code, token}
      this.closedByUser = false;
      this.retry = 0;
      this.connect();
    }
    connect() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      let ws;
      try { ws = new WebSocket(`${proto}//${location.host}/ws`); } catch (e) { toast('Keine Verbindung zum Server möglich.'); return; }
      this.ws = ws;
      ws.onopen = () => {
        this.retry = 0;
        const sess = store.get('session', null);
        if (this.joined && sess) ws.send(JSON.stringify({ t: 'join', code: sess.code, token: sess.token, name: ui.name }));
        else ws.send(JSON.stringify(this.intent));
        clearInterval(this.pinger);
        this.pinger = setInterval(() => { try { ws.send('{"t":"ping"}'); } catch (e) {} }, 20000);
      };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.t === 'welcome') { this.joined = true; this.seat = m.seat; store.set('session', { code: m.code, token: m.token }); }
        else if (m.t === 'room') { ui.room = m.room; if (!m.room.started) { if (ui.modalKind === 'roundEnd') closeModal(); ui.view = null; go('lobby'); } }
        else if (m.t === 'state') { onView(m.view); }
        else if (m.t === 'error') { toast(m.msg, 3500); if (!this.joined && /nicht gefunden|läuft bereits|voll/.test(m.msg)) { store.del('session'); this.leave(); go('home'); } }
        else if (m.t === 'kicked') { toast('Du wurdest aus dem Raum entfernt.'); store.del('session'); this.leave(); go('home'); }
        else if (m.t === 'left') { /* ok */ }
      };
      ws.onclose = () => {
        clearInterval(this.pinger);
        if (this.closedByUser) return;
        this.retry++;
        if (this.retry === 2) toast('Verbindung unterbrochen – verbinde neu…');
        setTimeout(() => this.connect(), Math.min(8000, 500 * this.retry));
      };
    }
    send(o) { try { this.ws.send(JSON.stringify(o)); } catch (e) { toast('Nicht verbunden.'); } }
    act(a) { this.send({ t: 'act', a }); }
    again() { this.send({ t: 'again' }); }
    leave() {
      this.closedByUser = true;
      try { this.ws.send(JSON.stringify({ t: 'leave' })); } catch (e) {}
      try { this.ws.close(); } catch (e) {}
      clearInterval(this.pinger);
    }
  }

  // ---------- Navigation ----------
  function go(screen) { ui.screen = screen; render(); }

  function onView(v) {
    const prev = ui.view;
    ui.view = v;
    if (ui.screen !== 'game') ui.screen = 'game';
    // Auswahl bereinigen
    const ids = new Set(v.hand.map((c) => c.id));
    ui.selected = ui.selected.filter((id) => ids.has(id));
    const key = `${v.round}|${v.current}|${v.phase === 'play' ? 'p' : 'x'}`;
    if (key !== ui.stageKey) { ui.staged = []; ui.stageKey = key; }
    ui.staged = ui.staged.filter((m) => m.every((id) => ids.has(id)));
    // Mein Zug?
    const turnKey = `${v.round}|${v.current}|${v.seq}`;
    if (v.current === v.seat && v.phase === 'draw' && (!prev || prev.current !== v.seat || prev.phase !== 'draw')) { vibrate(60); }
    // Klopf-Zeitfenster
    if (v.phase === 'knock') {
      if (!prev || prev.phase !== 'knock') ui.knockStart = Date.now();
      const k = `${v.round}|${v.current}|${v.discardTop && v.discardTop.id}`;
      if (v.knock.pending.includes(v.seat) && !ui.knockPrompt && ui.autoPassed !== k) { ui.autoPassed = k; ui.ctl.act({ type: 'pass' }); }
    }
    ui.lastTurnKey = turnKey;
    render();
    // Rundenende
    if ((v.phase === 'roundEnd' || v.phase === 'gameEnd') && (!prev || prev.phase !== v.phase || prev.round !== v.round)) showRoundEnd();
    if (v.phase !== 'roundEnd' && v.phase !== 'gameEnd' && ui.modalKind === 'roundEnd') closeModal();
  }

  // ---------- Rendering ----------
  function render() {
    if (ui.screen === 'home') return renderHome();
    if (ui.screen === 'lobby') return renderLobby();
    if (ui.screen === 'game' && ui.view) return renderGame();
  }

  function renderHome() {
    const sess = store.get('session', null);
    const params = new URLSearchParams(location.search);
    const preCode = (params.get('raum') || '').toUpperCase();
    $app.innerHTML = `
    <div class="home">
      <div class="logo">
        <div class="burst"></div>
        <img src="${LOGO}" alt="Skalamala – Das verrückte Kartenspiel" width="720" height="484">
        <h1 class="sr">Skalamala</h1>
      </div>
      <p class="tagline">8 Runden · wer am wenigsten Punkte hat, gewinnt!</p>
      <div class="panel">
        <div class="field">
          <label for="name">Dein Name</label>
          <input id="name" class="input" maxlength="16" placeholder="z. B. Sabine" value="${esc(ui.name)}" autocomplete="nickname">
        </div>
        <h2>Gegen Bots</h2>
        <div class="row">
          <span>Anzahl Bots</span>
          <span class="stepper"><button class="btn ghost" data-a="botsMinus" aria-label="weniger">−</button><b id="bots">${ui.bots}</b><button class="btn ghost" data-a="botsPlus" aria-label="mehr">+</button></span>
          <button class="btn primary" data-a="playBots" style="margin-left:auto">Los geht's</button>
        </div>
        <label class="toggle"><input type="checkbox" id="kp" ${ui.knockPrompt ? 'checked' : ''}> Bei fremden Zügen fragen, ob ich klopfen will</label>
        <div class="divider"></div>
        <h2>Online gegen echte Gegner</h2>
        ${ui.onlineAvailable ? `
          ${sess ? `<div class="row" style="margin-bottom:12px"><button class="btn green" data-a="rejoin">↩︎ Zurück in Raum ${esc(sess.code)}</button></div>` : ''}
          <div class="row grow">
            <button class="btn primary" data-a="create">Raum erstellen</button>
          </div>
          <div class="row" style="margin-top:12px">
            <input id="code" class="input" style="flex:1;text-transform:uppercase;letter-spacing:.2em;min-width:8em" maxlength="4" placeholder="CODE" value="${esc(preCode)}" autocomplete="off">
            <button class="btn" data-a="join">Beitreten</button>
          </div>
          <p class="hint">Erstelle einen Raum und schick deinen Mitspielern den 4-stelligen Code oder den Link. Freie Plätze kannst du mit Bots auffüllen.</p>
        ` : `<p class="hint">Für Online-Spiele muss diese Seite über den Skalamala-Server geöffnet werden (siehe Anleitung in der README). Gegen Bots kannst du sofort spielen.</p>`}
      </div>
      <button class="linkbtn" data-a="rules">Spielregeln</button>
    </div>`;
    const nameEl = document.getElementById('name');
    nameEl.addEventListener('input', () => { ui.name = nameEl.value.trim(); store.set('name', ui.name); });
    document.getElementById('kp').addEventListener('change', (e) => { ui.knockPrompt = e.target.checked; store.set('knockPrompt', ui.knockPrompt); });
  }

  function needName() {
    const n = (document.getElementById('name') || {}).value;
    ui.name = (n || ui.name || '').trim();
    if (!ui.name) { toast('Bitte zuerst deinen Namen eingeben.'); const el = document.getElementById('name'); if (el) el.focus(); return false; }
    store.set('name', ui.name);
    return true;
  }

  function renderLobby() {
    const r = ui.room;
    if (!r) { $app.innerHTML = '<div class="home"><div class="panel">Verbinde…</div></div>'; return; }
    const isHost = r.host === r.you;
    const link = `${location.origin}${location.pathname}?raum=${r.code}`;
    $app.innerHTML = `
    <div class="home lobby">
      <img class="lobbylogo" src="${LOGO}" alt="Skalamala">
      <div class="panel">
        <h2>Raumcode</h2>
        <div class="code">${esc(r.code)}</div>
        <div class="row" style="justify-content:center"><button class="btn small ghost" data-a="copyLink" data-link="${esc(link)}">🔗 Einladungslink kopieren</button></div>
        <ul class="seats">
          ${r.seats.map((s, i) => `
            <li>
              ${avatar(s.name, i, { off: !s.connected })}
              <span class="nm">${esc(s.name)}${i === r.you ? ' (du)' : ''}</span>
              ${i === r.host ? '<span class="badge gold">Gastgeber</span>' : ''}
              ${s.bot ? '<span class="badge">Bot</span>' : ''}
              ${isHost && i !== r.you ? `<button class="btn small" data-a="kick" data-seat="${i}" aria-label="entfernen">✕</button>` : ''}
            </li>`).join('')}
        </ul>
        ${isHost ? `
          <div class="row grow">
            <button class="btn green" data-a="addBot" ${r.seats.length >= 8 ? 'disabled' : ''}>+ Bot</button>
            <button class="btn primary" data-a="start" ${r.seats.length < 2 ? 'disabled' : ''}>Spiel starten</button>
          </div>
          <p class="hint">2–8 Spieler. Warte, bis alle drin sind, und starte dann.</p>`
        : `<p class="hint">Warte, bis der Gastgeber das Spiel startet…</p>`}
        <div class="divider"></div>
        <button class="btn small ghost" data-a="leave">Raum verlassen</button>
      </div>
    </div>`;
  }

  function statusText(v) {
    const me = v.seat, cur = v.players[v.current];
    const R = v.roundInfo;
    if (v.phase === 'roundEnd') return { t: 'Runde beendet', mine: false };
    if (v.phase === 'gameEnd') return { t: 'Spiel beendet', mine: false };
    if (v.phase === 'knock') {
      if (v.knock.pending.includes(me)) return { t: '👊 Klopfen oder passen?', mine: true };
      return { t: `Es darf geklopft werden…`, mine: false };
    }
    if (v.current === me) {
      if (v.phase === 'draw') return { t: 'Du bist dran – zieh eine Karte (Stapel oder Ablage)', mine: true };
      const p = v.players[me];
      if (!p.down) return { t: R.fromHand ? 'Ausmachen (alles aus der Hand) oder eine Karte abwerfen' : 'Kombinationen bilden und auslegen – oder abwerfen', mine: true };
      return { t: 'Anlegen: Karte wählen, dann auf eine Kombination tippen – zum Schluss abwerfen', mine: true };
    }
    return { t: `${cur.name} ist dran${v.phase === 'draw' ? ' (zieht)' : ''}…`, mine: false };
  }

  function renderGame() {
    const v = ui.view, me = v.seat, R = v.roundInfo;
    const myTurn = v.current === me;
    const myP = v.players[me];
    const canPlay = myTurn && v.phase === 'play';
    const stagedIds = new Set([].concat(...ui.staged));
    const handById = new Map(v.hand.map((c) => [c.id, c]));

    // Spieler-Leiste
    const players = v.players.map((p, i) => {
      const tags = [];
      if (p.down) tags.push('<span class="tag">✓ draußen</span>');
      if (v.knock.responses[i] === 'knock') tags.push('<span class="tag k">👊</span>');
      if (i === v.dealer) tags.push('<span class="tag d">G</span>');
      return `<div class="pchip ${i === v.current && v.phase !== 'roundEnd' && v.phase !== 'gameEnd' ? 'turn' : ''} ${i === me ? 'me' : ''} ${p.connected === false ? 'off' : ''}" title="${i === v.dealer ? 'Geber' : ''}">
        ${avatar(p.name, i, { cnt: p.handCount, off: p.connected === false })}
        <div><div class="pn">${esc(p.name)}</div><div class="ps">${p.total} Pkt${p.connected === false ? ' · offline' : ''}</div></div>
        <div class="tags">${tags.join('')}</div>
      </div>`;
    }).join('');

    // Stapel / Ablage
    const canDraw = myTurn && v.phase === 'draw';
    const canDiscardTap = canPlay && ui.selected.length === 1;
    const myResp = v.knock.responses[me];
    let knockBtn = '';
    if (v.phase === 'draw' && !myTurn && v.knock.canKnock && v.discardTop) {
      knockBtn = myResp === 'knock' ? '<span class="badge gold">geklopft 👊</span>'
        : myResp === 'pass' ? '' : `<button class="btn knock small" data-a="knock">👊 Klopfen</button>`;
    }
    const piles = `
      <div class="piles">
        <div class="pile ${canDraw ? 'clickable' : ''}" data-a="${canDraw ? 'drawStock' : ''}">
          <div class="back"><span>${v.stockCount}</span></div>
          <div class="lbl">Stapel</div>
        </div>
        <div class="pile ${canDraw && v.discardTop ? 'clickable' : ''} ${canDiscardTap ? 'clickable' : ''}" data-a="${canDraw ? 'takeDiscard' : canDiscardTap ? 'discardSel' : ''}">
          ${cardHTML(v.discardTop)}
          <div class="lbl">Ablage${v.discardTop ? ` (${v.discardCount})` : ''}</div>
          ${knockBtn ? `<div class="knockbox">${knockBtn}</div>` : ''}
        </div>
      </div>`;

    // Vorgaben
    const ownMelds = v.melds.filter((m) => m.owner === me);
    const slots = `<div class="slots" style="${knockBtn ? 'margin-top:48px' : ''}">${R.slots.map((s) => `<span class="slot ${myP.down ? 'done' : ''}">${E.slotLabel(s)}</span>`).join('')}</div>`;

    // Auslagen
    const layTarget = canPlay && myP.down && ui.selected.length > 0;
    const groups = [];
    for (let i = 0; i < v.players.length; i++) {
      const ms = v.melds.filter((m) => m.owner === i);
      if (!ms.length) continue;
      groups.push(`<div class="mgroup"><div class="who">${avatar(v.players[i].name, i)}${esc(i === me ? 'Deine Auslage' : v.players[i].name)}</div><div class="mrow">
        ${ms.map((m) => {
          const ok = layTarget && E.validMeld(m.cards.concat(ui.selected.map((id) => handById.get(id))), m.t);
          return `<div class="meld ${ok ? 'target' : ''}" data-meld="${m.id}"><span class="mt">${E.TYPE_NAME[m.t]}</span>${m.cards.map((c, k) => cardHTML(c, { rep: c.joker ? m.ranks[k] : 0 })).join('')}</div>`;
        }).join('')}
      </div></div>`);
    }
    const meldArea = groups.length ? `<div class="meldarea">${groups.join('')}</div>` : `<div class="empty-table">Noch hat niemand ausgelegt.</div>`;

    // Aktionen
    const st = statusText(v);
    const actions = [];
    if (canDraw) {
      actions.push('<button class="btn primary" data-a="drawStock">Vom Stapel</button>');
      if (v.discardTop) actions.push('<button class="btn" data-a="takeDiscard">Ablage nehmen</button>');
    }
    if (canPlay) {
      if (!myP.down) {
        const freeSel = ui.selected.filter((id) => !stagedIds.has(id));
        if (ui.staged.length < R.slots.length) actions.push(`<button class="btn green" data-a="stage" ${freeSel.length >= 2 ? '' : 'disabled'}>＋ Kombination${freeSel.length ? ` (${freeSel.length})` : ''}</button>`);
        if (ui.staged.length === R.slots.length) actions.push(`<button class="btn primary" data-a="layDown">${R.fromHand ? '🎉 Ausmachen!' : 'Auslegen'}</button>`);
      }
      actions.push(`<button class="btn ${myP.down || ui.staged.length < R.slots.length ? 'primary' : ''}" data-a="discardSel" ${ui.selected.length === 1 && !stagedIds.has(ui.selected[0]) ? '' : 'disabled'}>Abwerfen</button>`);
    }
    if (v.phase === 'roundEnd' || v.phase === 'gameEnd') actions.push(`<button class="btn primary" data-a="showResult">${v.phase === 'gameEnd' ? 'Endergebnis' : 'Rundenergebnis'}</button>`);
    const staging = ui.staged.length ? `<div class="staging">${ui.staged.map((m, i) => `<div class="staged">${m.map((id) => cardHTML(handById.get(id))).join('')}<button data-a="unstage" data-i="${i}" aria-label="Kombination auflösen">✕</button></div>`).join('')}</div>` : '';

    // Hand
    const hand = sortHand(v.hand.filter((c) => !stagedIds.has(c.id)), ui.sort);
    const handPts = E.handPoints(v.hand);
    const handHTML = hand.map((c) => cardHTML(c, { cls: `${ui.selected.includes(c.id) ? 'sel' : ''} ${c.id === v.lastDrawn ? 'new' : ''}` })).join('');

    const lastLog = v.log.length ? v.log[v.log.length - 1].msg : '';
    const warn = !R.knock || R.fromHand;

    $app.innerHTML = `
    <div class="game">
      <div class="topbar">
        <img class="toplogo" src="${LOGO}" alt="Skalamala">
        <div class="contract">
          <span class="roundchip">${v.round + 1}/8</span>
          <div class="txt"><div class="ttl">${esc(R.title)}</div><div class="det ${warn ? 'warn' : ''}">${esc(R.detail)}</div></div>
        </div>
        <button class="btn icon ghost" data-a="scores" aria-label="Punkte">🏆</button>
        <button class="btn icon ghost only-wide" data-a="rules" aria-label="Regeln">?</button>
        <button class="btn icon ghost" data-a="menu" aria-label="Menü">☰</button>
      </div>
      <div class="players">${players}</div>
      <div class="table">${piles}${slots}${meldArea}</div>
      <div class="dock">
        <div class="status ${st.mine ? 'mine' : ''}">${esc(st.t)}</div>
        <div class="lastlog">${esc(lastLog)}</div>
        ${staging}
        <div class="actions">${actions.join('')}</div>
      </div>
      <div class="handwrap">
        <div class="handbar">
          <span>${v.hand.length} Karten · ${handPts} Pkt</span>
          <span><button class="btn small" data-a="sort" style="--bg:rgba(255,255,255,.16);--bg2:rgba(255,255,255,.08);--edge:rgba(0,0,0,.4)">⇅ ${ui.sort === 'suit' ? 'Farbe' : 'Wert'}</button>${ui.selected.length ? '<button class="btn small danger" data-a="clearSel">✕ Auswahl</button>' : ''}</span>
        </div>
        <div class="hand" id="hand">${handHTML}</div>
      </div>
    </div>
    ${renderKnockPrompt(v)}`;
    layoutHand();
  }

  function renderKnockPrompt(v) {
    if (v.phase !== 'knock' || !v.knock.pending.includes(v.seat) || !ui.knockPrompt) return '';
    return `<div class="knockprompt">
      <h3>Klopfen?</h3>
      <div style="color:var(--muted);font-size:.9rem">${esc(v.players[v.current].name)} will die Karte nicht.</div>
      ${cardHTML(v.discardTop)}
      <div style="font-size:.88rem">Du bekommst die Karte <b>plus 1 verdeckte Strafkarte</b>.</div>
      <div class="bar"><i id="kbar"></i></div>
      <div class="row grow"><button class="btn white" data-a="pass">Passen</button><button class="btn primary" data-a="knock">👊 Klopfen</button></div>
    </div>`;
  }
  setInterval(() => {
    const bar = document.getElementById('kbar');
    if (!bar) return;
    const f = Math.max(0, 1 - (Date.now() - ui.knockStart) / 6800);
    bar.style.transform = `scaleX(${f})`;
  }, 100);

  function layoutHand() {
    const el = document.getElementById('hand');
    if (!el) return;
    const cards = el.children;
    const n = cards.length;
    if (!n) return;
    const W = el.clientWidth;
    const cw = cards[0].getBoundingClientRect().width;
    const step = n > 1 ? Math.min(cw + 6, (W - cw) / (n - 1)) : 0;
    const total = cw + step * (n - 1);
    const start = Math.max(0, (W - total) / 2);
    for (let i = 0; i < n; i++) cards[i].style.marginLeft = i === 0 ? `${start}px` : `${step - cw}px`;
  }
  window.addEventListener('resize', layoutHand);

  // ---------- Dialoge ----------
  function rulesHTML() {
    return `<button class="btn small ghost close" data-close>Schließen</button>
      <h2>Spielregeln</h2>
      <p>Gespielt wird mit 2 Blättern à 55 Karten (je 52 + 3 Joker = 110 Karten), ab 2 Spielern. Jeder bekommt 11 Karten, der Rest liegt verdeckt als Stapel in der Mitte, eine Karte wird aufgedeckt.</p>
      <h3>Ablauf eines Zuges</h3>
      <ol>
        <li><b>Ziehen:</b> die oberste Karte der Ablage oder eine verdeckte vom Stapel.</li>
        <li><b>Auslegen:</b> Wer die Vorgabe der Runde auf der Hand hat, legt sie aus. Danach darf man an alle Kombinationen auf dem Tisch anlegen (auch im selben Zug).</li>
        <li><b>Abwerfen:</b> eine Karte auf die Ablage – dann ist der Nächste (im Uhrzeigersinn) dran.</li>
      </ol>
      <h3>Klopfen 👊</h3>
      <p>Bevor der Spieler, der dran ist, vom Stapel zieht, dürfen die anderen um die offene Karte klopfen. Der Spieler am Zug hat Vorrang: nimmt er die Karte, ist das Klopfen hinfällig. Zieht er vom Stapel, bekommt der Klopfer (der Nächste im Uhrzeigersinn) die Karte <b>plus eine verdeckte Strafkarte</b>. In Runde 6 darf nicht geklopft werden.</p>
      <h3>Kombinationen</h3>
      <ul>
        <li><b>Gruppe:</b> gleiche Werte, z. B. 3 Zehnen (Farben egal).</li>
        <li><b>Sequenz (Straße):</b> mind. 4 aufeinanderfolgende Karten derselben Farbe, z. B. ♠10 B D K. Das Ass zählt hoch (D-K-A) oder niedrig (A-2-3), aber nicht herum (K-A-2).</li>
        <li><b>Skalamala:</b> 10er-Sequenz, abwechselnd rot – schwarz (2 rot, 3 schwarz, 4 rot …).</li>
        <li><b>Joker</b> ersetzen jede Karte; jede Kombination braucht aber mindestens eine echte Karte.</li>
      </ul>
      <h3>Die 8 Runden</h3>
      <ol>${E.ROUNDS.map((r) => `<li><b>${esc(r.title)}</b> – ${esc(r.detail)}</li>`).join('')}</ol>
      <p>In Runde 7 und 8 muss man <b>aus der Hand ausmachen</b>: alle Karten auf einmal auslegen (höchstens eine bleibt zum Abwerfen übrig).</p>
      <h3>Punkte</h3>
      <p>Wer zuerst keine Karten mehr hat, macht aus. Alle anderen zählen ihre Handkarten: 2–9 = 5, 10 bis König = 10, Ass = 20, Joker = 50 Punkte. Nach 8 Runden gewinnt, wer <b>die wenigsten Punkte</b> hat.</p>
      <p class="hint">Ist der Stapel leer, wird die Ablage einmal neu gemischt. Ist er ein zweites Mal leer, endet die Runde und alle zählen ihre Handkarten.</p>`;
  }
  function scoresHTML(v) {
    const best = Math.min(...v.players.map((p) => p.total));
    return `<div class="tablewrap"><table class="scores"><thead><tr><th>Spieler</th>${E.ROUNDS.map((r) => `<th>${r.n}</th>`).join('')}<th>Σ</th></tr></thead><tbody>
      ${v.players.map((p) => `<tr class="${p.total === best && p.scores.length ? 'best' : ''}"><td>${esc(p.name)}</td>${E.ROUNDS.map((r, i) => `<td>${p.scores[i] != null ? p.scores[i] : '–'}</td>`).join('')}<td><b>${p.total}</b></td></tr>`).join('')}
    </tbody></table></div>`;
  }
  function showRoundEnd() {
    const v = ui.view, lr = v.lastRound;
    if (!lr) return;
    ui.modalKind = 'roundEnd';
    const isHost = v.host === v.seat || v.host == null;
    const over = v.phase === 'gameEnd';
    let head;
    if (over) {
      const ranking = v.players.map((p, i) => ({ p, i })).sort((a, b) => a.p.total - b.p.total);
      const w = ranking[0];
      head = `<h2>🏆 ${esc(w.p.name)} gewinnt!</h2><p>Mit nur <b>${w.p.total} Punkten</b> nach 8 Runden.</p>
        <div class="res">${ranking.map((x, k) => `<div class="r ${k === 0 ? 'win' : ''}"><span class="nm">${k + 1}. ${esc(x.p.name)}</span><span class="cards"></span><span class="pts">${x.p.total}</span></div>`).join('')}</div>`;
    } else {
      head = `<h2>Runde ${lr.round + 1} vorbei</h2><p>${lr.winner != null ? `🎉 <b>${esc(v.players[lr.winner].name)}</b> hat ausgemacht!` : 'Der Stapel ist aufgebraucht.'}</p>
        <div class="res">${v.players.map((p, i) => `<div class="r ${i === lr.winner ? 'win' : ''}"><span class="nm">${esc(p.name)}</span><span class="cards">${lr.hands[i].map((c) => cardHTML(c)).join('')}</span><span class="pts">+${lr.points[i]}</span></div>`).join('')}</div>`;
    }
    const btn = over
      ? (isHost ? `<button class="btn primary" data-a="again">Neues Spiel</button>` : '<p class="hint">Der Gastgeber kann ein neues Spiel starten.</p>')
      : (isHost ? `<button class="btn primary" data-a="nextRound">Weiter zu Runde ${lr.round + 2}</button>` : '<p class="hint">Warte auf den Gastgeber…</p>');
    openModal(`${head}<h3>Punktestand</h3>${scoresHTML(v)}<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-close>Tisch ansehen</button>${btn}</div>`, onModalClick);
    ui.modalKind = 'roundEnd';
  }
  function onModalClick(e) {
    const b = e.target.closest('[data-a]');
    if (b) handle(b.dataset.a, b);
  }

  // ---------- Eingaben ----------
  $app.addEventListener('click', (e) => {
    const cardEl = e.target.closest('#hand .card');
    if (cardEl) return toggleCard(+cardEl.dataset.id);
    const meldEl = e.target.closest('[data-meld]');
    if (meldEl) return layOff(+meldEl.dataset.meld);
    const b = e.target.closest('[data-a]');
    if (b && b.dataset.a) handle(b.dataset.a, b);
  });
  $app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'code') handle('join');
    if (e.key === 'Enter' && e.target.id === 'name' && !ui.onlineAvailable) handle('playBots');
  });

  function toggleCard(id) {
    const i = ui.selected.indexOf(id);
    if (i >= 0) ui.selected.splice(i, 1); else ui.selected.push(id);
    render();
  }
  function layOff(meldId) {
    const v = ui.view;
    if (!v || v.current !== v.seat || v.phase !== 'play') return;
    if (!v.players[v.seat].down) return toast('Erst die Vorgabe auslegen, dann anlegen.');
    if (!ui.selected.length) return toast('Wähle zuerst Karten aus deiner Hand.');
    ui.ctl.act({ type: 'layOff', cardIds: ui.selected.slice(), meldId });
    ui.selected = [];
  }

  function handle(a, el) {
    const v = ui.view;
    switch (a) {
      case 'botsMinus': ui.bots = Math.max(1, ui.bots - 1); store.set('bots', ui.bots); document.getElementById('bots').textContent = ui.bots; return;
      case 'botsPlus': ui.bots = Math.min(5, ui.bots + 1); store.set('bots', ui.bots); document.getElementById('bots').textContent = ui.bots; return;
      case 'playBots':
        if (!needName()) return;
        ui.ctl = new LocalCtl(ui.name, ui.bots);
        return;
      case 'create':
        if (!needName()) return;
        store.del('session');
        ui.room = null; go('lobby');
        ui.ctl = new OnlineCtl({ t: 'create', name: ui.name });
        return;
      case 'join': {
        if (!needName()) return;
        const code = (document.getElementById('code').value || '').trim().toUpperCase();
        if (code.length !== 4) return toast('Der Raumcode hat 4 Buchstaben.');
        const sess = store.get('session', null);
        ui.room = null; go('lobby');
        ui.ctl = new OnlineCtl({ t: 'join', code, name: ui.name, token: sess && sess.code === code ? sess.token : undefined });
        return;
      }
      case 'rejoin': {
        const sess = store.get('session', null);
        if (!sess) return;
        if (!needName()) return;
        ui.room = null; go('lobby');
        ui.ctl = new OnlineCtl({ t: 'join', code: sess.code, token: sess.token, name: ui.name });
        return;
      }
      case 'copyLink': {
        const link = el.dataset.link;
        const done = () => toast('Link kopiert – jetzt an deine Mitspieler schicken!');
        if (navigator.share) { navigator.share({ title: 'Skalamala', text: 'Spiel mit mir Skalamala! Code: ' + ui.room.code, url: link }).catch(() => {}); return; }
        try { navigator.clipboard.writeText(link).then(done, () => toast(link, 6000)); } catch (e) { toast(link, 6000); }
        return;
      }
      case 'addBot': return ui.ctl.send({ t: 'addBot' });
      case 'kick': return ui.ctl.send({ t: 'kick', seat: +el.dataset.seat });
      case 'start': return ui.ctl.send({ t: 'start' });
      case 'leave': return leaveGame();
      case 'rules': return openModal(rulesHTML());
      case 'scores': return v && openModal(`<button class="btn small ghost close" data-close>Schließen</button><h2>Punkte</h2><p class="hint">Wenigste Punkte gewinnen.</p>${scoresHTML(v)}`);
      case 'menu':
        return openModal(`<button class="btn small ghost close" data-close>Schließen</button><h2>Menü</h2>
          <label class="toggle"><input type="checkbox" id="kp2" ${ui.knockPrompt ? 'checked' : ''}> Bei fremden Zügen fragen, ob ich klopfen will</label>
          <div class="row" style="margin-top:14px"><button class="btn small" data-a="rules">📜 Spielregeln</button></div>
          <h3>Verlauf</h3><ul class="loglist">${v.log.slice().reverse().map((l) => `<li>${esc(l.msg)}</li>`).join('')}</ul>
          <div class="divider"></div><button class="btn danger" data-a="leave">Spiel verlassen</button>`, (e) => {
          if (e.target.id === 'kp2') { ui.knockPrompt = e.target.checked; store.set('knockPrompt', ui.knockPrompt); }
          onModalClick(e);
        });
      case 'sort': ui.sort = ui.sort === 'suit' ? 'rank' : 'suit'; store.set('sort', ui.sort); return render();
      case 'clearSel': ui.selected = []; return render();
      case 'drawStock': return ui.ctl.act({ type: 'drawStock' });
      case 'takeDiscard': return ui.ctl.act({ type: 'takeDiscard' });
      case 'knock': return ui.ctl.act({ type: 'knock' });
      case 'pass': return ui.ctl.act({ type: 'pass' });
      case 'discardSel': {
        if (ui.selected.length !== 1) return toast('Wähle genau eine Karte zum Abwerfen.');
        const id = ui.selected[0];
        ui.selected = [];
        return ui.ctl.act({ type: 'discard', cardId: id });
      }
      case 'stage': {
        const staged = new Set([].concat(...ui.staged));
        const ids = ui.selected.filter((id) => !staged.has(id));
        const byId = new Map(v.hand.map((c) => [c.id, c]));
        const melds = ui.staged.map((m) => m.map((id) => byId.get(id))).concat([ids.map((id) => byId.get(id))]);
        if (!partialMatch(melds, v.roundInfo.slots)) {
          return toast(`Das passt nicht. Gesucht: ${v.roundInfo.slots.map(E.slotLabel).join(' + ')}`, 3200);
        }
        ui.staged.push(ids);
        ui.selected = [];
        return render();
      }
      case 'unstage': ui.staged.splice(+el.dataset.i, 1); return render();
      case 'layDown': {
        const melds = ui.staged.map((m) => m.slice());
        ui.staged = []; ui.selected = [];
        return ui.ctl.act({ type: 'layDown', melds });
      }
      case 'showResult': return showRoundEnd();
      case 'nextRound': closeModal(); return ui.ctl.act({ type: 'nextRound' });
      case 'again': closeModal(); return ui.ctl.again();
    }
  }

  function leaveGame() {
    if (ui.ctl && ui.view && ui.view.phase !== 'gameEnd' && ui.ctl.mode === 'local' && !confirmLeave()) return;
    closeModal();
    if (ui.ctl) ui.ctl.leave();
    if (ui.ctl && ui.ctl.mode === 'online') store.del('session');
    ui.ctl = null; ui.view = null; ui.room = null; ui.selected = []; ui.staged = [];
    go('home');
  }
  function confirmLeave() { return true; }

  window.__skalamala = ui; // für Tests
  // ---------- Start ----------
  render();
  if (/^https?:$/.test(location.protocol)) {
    fetch('api/ping', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((j) => {
      if (j && j.ok) { ui.onlineAvailable = true; if (ui.screen === 'home') render(); }
    }).catch(() => {});
  }
})();
