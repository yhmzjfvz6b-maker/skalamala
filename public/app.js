/* Skalamala – Oberfläche */
(function () {
  'use strict';
  const E = window.Skalamala;
  const LOGO = 'logo.svg';
  const EMBLEM = 'emblem.svg';
  const VERSION = '1.70 · 21.11.2026';
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
    $toast.innerHTML = `<span class="tmsg"></span><span class="tx" aria-hidden="true">✕</span>`;
    $toast.firstChild.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), Math.max(ms || 0, 5000));
  }
  // Meldung antippen = schließen
  $toast.addEventListener('pointerdown', (e) => { e.stopPropagation(); clearTimeout(toastTimer); $toast.classList.remove('show'); });
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

  // Welche Farbe stellt ein Joker in einer Kombination dar?
  function jokerLook(m, k) {
    const ref = m.cards.map((c, i) => ({ c, p: m.ranks[i] })).find((o) => !o.c.joker);
    if (!ref || m.t === 'G') return {};
    if (m.t === 'S') return { repSuit: ref.c.suit, repColor: E.isRed(ref.c) ? 'red' : 'black' };
    const red = E.isRed(ref.c) === (Math.abs(m.ranks[k] - ref.p) % 2 === 0);
    return { repColor: red ? 'red' : 'black' };
  }
  function cardHTML(c, opts) {
    opts = opts || {};
    const cls = opts.cls || '';
    if (!c) return `<div class="card empty ${cls}"></div>`;
    const data = `data-id="${c.id}"`;
    if (c.joker && opts.rep && opts.repColor) {
      // Joker in einer Sequenz: in der Farbe der Sequenz mit dem Wert, den er ersetzt (★ zeigt: das ist ein Joker)
      const sym = opts.repSuit ? E.SUIT_SYM[opts.repSuit] : '';
      return `<div class="card joker jrep ${opts.repSuit ? 's-' + opts.repSuit : ''} ${opts.repColor} ${cls}" ${data} aria-label="Joker als ${E.rankLabel(opts.rep)}"><span class="ci"><b>${E.rankLabel(opts.rep)}</b><i>${sym}</i><i class="js">★</i></span><span class="jk"><img src="${EMBLEM}" alt=""></span></div>`;
    }
    if (c.joker) {
      const rep = opts.rep ? `<span class="rep">${E.rankLabel(opts.rep)}</span>` : '';
      return `<div class="card joker ${cls}" ${data} aria-label="Joker"><span class="ci"><b>★</b></span><span class="jci"><img src="${EMBLEM}" alt=""></span><span class="jci br"><img src="${EMBLEM}" alt=""></span><span class="jk"><img src="${EMBLEM}" alt=""><em>JOKER</em></span>${rep}${opts.badge ? '<span class="newbadge">NEU</span>' : ''}</div>`;
    }
    const r = E.rankLabel(c.rank), s = E.SUIT_SYM[c.suit];
    const badge = opts.badge ? '<span class="newbadge">NEU</span>' : '';
    return `<div class="card s-${c.suit} ${E.isRed(c) ? 'red' : 'black'} ${cls}" ${data} aria-label="${E.SUIT_NAME[c.suit]} ${r}"><span class="ci"><b>${r}</b><i>${s}</i></span><span class="cs"><span class="csg">${s}<b>S</b></span></span><span class="ci br"><b>${r}</b><i>${s}</i></span><span class="stile">S</span>${badge}</div>`;
  }

  const SUIT_ORDER = { S: 0, H: 1, C: 2, D: 3 };
  function sortHand(hand, mode) {
    return hand.slice().sort((a, b) => {
      if (a.joker !== b.joker) return a.joker ? 1 : -1;
      if (a.joker) return a.id - b.id;
      if (mode === 'alt' || mode === 'altd') {
        // Skalamala: zwei Ketten, in denen rot/schwarz von selbst abwechseln (Wert + Farbe gerade/ungerade)
        const k = (c) => (c.rank + (c.suit === 'H' || c.suit === 'D' ? 1 : 0)) % 2;
        const dir = mode === 'altd' ? -1 : 1;
        return k(a) - k(b) || dir * (a.rank - b.rank) || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.id - b.id;
      }
      if (mode === 'rank') return a.rank - b.rank || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.id - b.id;
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || a.rank - b.rank || a.id - b.id;
    });
  }

  // Eigene Reihenfolge (per Ziehen) oder automatisch sortiert
  function orderedHand(cards, round) {
    if (ui.sort === 'custom' && ui.orderRound !== round) { ui.sort = store.get('sort', 'suit'); }
    if (ui.sort !== 'custom') return sortHand(cards, ui.sort);
    const pos = new Map(ui.order.map((id, i) => [id, i]));
    const key = (c) => (pos.has(c.id) ? pos.get(c.id) : 1e6 + c.id);
    return cards.slice().sort((a, b) => key(a) - key(b));
  }

  // ---------- Sammelstapel ----------
  function movePileCards(ids, target) {
    ui.piles = ui.piles.map((p) => p.filter((id) => !ids.includes(id)));
    if (target === 'new') ui.piles.push(ids.slice());
    else if (target != null && ui.piles[target]) ui.piles[target] = ui.piles[target].concat(ids);
    // leere Stapel entfernen – Indizes vorher merken ist nicht nötig, da Ziel schon befüllt ist
    ui.piles = ui.piles.filter((p) => p.length);
  }
  // Sammelstapel ordnen: Sequenz / Skalamala in Reihenfolge (Joker an ihren Platz), sonst nach Wert
  function sortPile(cards, R) {
    if (cards.length < 2) return cards;
    const firstJ = cards[0].joker && !cards[cards.length - 1].joker ? 'low' : undefined;
    for (const t of ['A', 'S']) {
      if (!R.slots.some((x) => x.t === t) && !(t === 'S' && R.slots.some((x) => x.t === 'A'))) continue;
      const arr = E.validMeld(cards, t, 0, firstJ);
      if (arr) return arr.map((x) => x.card);
    }
    return cards.slice().sort((a, b) => (a.joker ? 1 : 0) - (b.joker ? 1 : 0) || a.rank - b.rank || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]);
  }
  function pileStatus(cards, R) {
    const n = cards.length;
    if (n === 1) return { cls: 'part', label: 'Stapel (1)' };
    for (const sl of R.slots) if (E.fitsSlot(cards, sl)) return { cls: 'ok', label: `✓ ${E.TYPE_NAME[sl.t]}` };
    for (const sl of R.slots) if (sl.exact && n > sl.min && E.validMeld(cards, sl.t, sl.min)) return { cls: 'bad', label: `${E.TYPE_NAME[sl.t]}: nur ${sl.min} Karten!` };
    const types = [...new Set(R.slots.map((x) => x.t))];
    for (const t of types) {
      if (E.validMeld(cards, t)) {
        const min = Math.min(...R.slots.filter((x) => x.t === t).map((x) => x.min));
        return { cls: 'part', label: `${E.TYPE_NAME[t]} – noch ${min - n}` };
      }
    }
    // gültig, aber nicht gesucht (z. B. Sequenz in einer Gruppen-Runde): nur zum Sammeln
    if (E.validMeld(cards, 'G') || E.validMeld(cards, 'S')) return { cls: 'part', label: `Stapel (${n})` };
    return { cls: 'bad', label: n === 1 ? 'Stapel (1)' : 'passt nicht' };
  }
  // Ergeben die ausgewählten Karten (zusammen mit gültigen Stapeln) die Vorgabe? Dann automatisch aufteilen.
  function contractFromSelection(v) {
    const R = v.roundInfo;
    const byId = new Map(v.hand.map((c) => [c.id, c]));
    const pileIds = new Set([].concat(...ui.piles));
    const cards = [...new Set(ui.selected.concat(...ui.piles))].map((id) => byId.get(id)).filter(Boolean);
    if (cards.length < R.slots.reduce((t, x) => t + x.min, 0)) return null;
    const f = E.findContract(cards, R, R.slots.some((x) => !x.exact), 8000);
    if (!f || f.left.length) return null;
    if (!E.matchContract(f.melds.map((m) => m.cards), R.slots)) return null;
    return { used: [], auto: true, melds: f.melds.map((m) => m.cards.map((c) => c.id)) };
  }

  // Welche Sammelstapel ergeben zusammen die Vorgabe der Runde?
  function contractFromPiles(v) {
    const R = v.roundInfo, k = R.slots.length;
    const byId = new Map(v.hand.map((c) => [c.id, c]));
    const piles = ui.piles.map((p) => p.map((id) => byId.get(id)).filter(Boolean));
    const idx = piles.map((_, i) => i);
    let found = null;
    (function choose(start, acc) {
      if (found) return;
      if (acc.length === k) {
        if (E.matchContract(acc.map((i) => piles[i]), R.slots)) found = acc.slice();
        return;
      }
      for (let i = start; i < idx.length; i++) { acc.push(i); choose(i + 1, acc); acc.pop(); }
    })(0, []);
    if (!found) return null;
    return { used: found, melds: found.map((i) => piles[i].map((c) => c.id)) };
  }

  // Passen die (vorgemerkten) Kombinationen auf verschiedene Vorgaben?
  function partialMatch(melds, slots) {
    if (melds.length > slots.length) return false;
    const used = slots.map(() => false);
    const bt = (i) => {
      if (i === melds.length) return true;
      for (let k = 0; k < slots.length; k++) {
        if (used[k] || !E.fitsSlot(melds[i], slots[k])) continue;
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
    tipSmall: store.get('tipSmall', false),
    tips: store.get('tips', true),
    jokerMust: store.get('jokerMust', false),
    lang: store.get('lang', 'de'),
    sort: store.get('sort', 'suit'),
    sideW: store.get('sideW', 0),
    order: [], orderRound: -1, dragging: false, pendingRender: false,
    ctl: null,
    view: null,
    room: null,
    selected: [],
    piles: [],      // Sammelstapel: Arrays von Karten-IDs
    pilesRound: -1,
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
      this.tips = ui.tips;
      this.players = [{ name, bot: false }].concat(
        BOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, nBots).map((n) => ({ name: n + ' 🤖', bot: true })));
      this.start();
    }
    start() {
      if (this.host) this.host.destroy();
      this.host = new E.GameHost(this.players, { botDelay: store.get('botDelay', 950), knockMs: 7000, jokerMust: false, onChange: () => this.emit() });
      this.emit();
    }
    emit() {
      const v = this.host.view(0);
      v.host = 0;
      v.tips = this.tips;
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

  // Geräusche aus den Spielereignissen ableiten
  function playEvents(prev, v) {
    const S = window.SkSound;
    if (!S || !prev || prev.round !== v.round) return;
    const ended = (v.phase === 'lastLay' && prev.phase !== 'lastLay') || ((v.phase === 'roundEnd' || v.phase === 'gameEnd') && prev.phase !== v.phase && prev.phase !== 'lastLay');
    if (ended) return S.play('win');
    const downs = (x) => x.players.filter((p) => p.down).length;
    if (downs(v) > downs(prev)) return S.play('tusch');
    const knocks = (x) => Object.values(x.knock.responses || {}).filter((r) => r === 'knock').length;
    if (knocks(v) > knocks(prev)) S.play('knock');
    if (v.stockCount < prev.stockCount || (v.discardCount < prev.discardCount && v.phase === 'play')) S.play('draw');
    else if (v.discardCount > prev.discardCount) S.play('discard');
  }

  // Ton-Einstellungen (Musik / Geräusche: an/aus + Lautstärke)
  function soundControls() {
    const S = window.SkSound;
    if (!S) return '';
    const row = (k, label) => `<div class="sndrow">
        <button class="btn small ${S.get(k + 'On') ? 'on' : ''}" data-a="snd" data-k="${k}On">${S.get(k + 'On') ? '🔊' : '🔇'} ${label}</button>
        <input type="range" min="0" max="100" step="5" value="${S.get(k + 'Vol')}" data-snd="${k}Vol" aria-label="${label} Lautstärke">
      </div>`;
    return `<div class="sndbox">${row('music', 'Musik')}${row('sfx', 'Geräusche')}</div>`;
  }
  document.addEventListener('input', (e) => {
    const k = e.target && e.target.dataset && e.target.dataset.snd;
    if (!k || !window.SkSound) return;
    window.SkSound.set(k, +e.target.value);
    const on = k.replace('Vol', 'On');
    if (+e.target.value > 0 && !window.SkSound.get(on)) { window.SkSound.set(on, true); }
  });

  function onView(v) {
    const prev = ui.view;
    ui.view = v;
    ui.clockAt = Date.now();
    if (ui.screen !== 'game') ui.screen = 'game';
    // Auswahl bereinigen
    const ids = new Set(v.hand.map((c) => c.id));
    // zuletzt bekommene Karte(n) merken (gezogen, von der Ablage oder beim Klopfen)
    if (!prev || prev.round !== v.round) ui.newIds = [];
    else {
      const old = new Set(prev.hand.map((c) => c.id));
      const added = v.hand.filter((c) => !old.has(c.id)).map((c) => c.id);
      // NEU bleibt stehen, bis neue Karten dazukommen (z. B. geklopfte Karte + Strafkarte bis zum nächsten Ziehen)
      if (added.length) ui.newIds = added;
      // vom Server gemeldet, was ich zuletzt bekommen habe (z. B. geklopfte Karte + Strafkarte)
      if (v.gotSeq && v.gotSeq !== prev.gotSeq && v.got && v.got.length) ui.newIds = v.got.slice();
      playEvents(prev, v);
    }
    ui.newIds = (ui.newIds || []).filter((id) => ids.has(id));
    ui.selected = ui.selected.filter((id) => ids.has(id));
    const key = `${v.round}|${v.current}|${v.phase === 'play' ? 'p' : 'x'}`;
    if (ui.pilesRound !== v.round) { ui.piles = []; ui.pilesRound = v.round; }
    ui.piles = ui.piles.map((p) => p.filter((id) => ids.has(id))).filter((p) => p.length);
    // Mein Zug?
    const turnKey = `${v.round}|${v.current}|${v.seq}`;
    if (v.current === v.seat && v.phase === 'draw' && (!prev || prev.current !== v.seat || prev.phase !== 'draw')) { vibrate(60); }
    // Klopf-Zeitfenster
    if (v.phase === 'knock') {
      if (!prev || prev.phase !== 'knock') ui.knockStart = Date.now();
      const k = `${v.round}|${v.current}|${v.discardTop && v.discardTop.id}`;
      if (v.knock.pending.includes(v.seat) && !ui.knockPrompt && ui.autoPassed !== k) { ui.autoPassed = k; ui.ctl.act({ type: 'pass' }); }
    }
    if (v.current === v.seat && v.phase === 'draw' && v.knock.first != null && !(prev && prev.knock && prev.knock.first != null && prev.current === v.current && prev.phase === 'draw')) ui.approveStart = Date.now();
    ui.lastTurnKey = turnKey;
    render();
    // Rundenende
    if ((v.phase === 'roundEnd' || v.phase === 'gameEnd') && (!prev || prev.phase !== v.phase || prev.round !== v.round)) showRoundEnd();
    else if (v.phase === 'roundEnd' && ui.modalKind === 'roundEnd' && v.multi) showRoundEnd();
    if (v.phase !== 'roundEnd' && v.phase !== 'gameEnd' && ui.modalKind === 'roundEnd') closeModal();
  }

  // ---------- Rendering ----------
  function render() {
    if (ui.dragging) { ui.pendingRender = true; return; }
    if (ui.screen === 'home') return renderHome();
    if (ui.screen === 'lobby') return renderLobby();
    if (ui.screen === 'game' && ui.view) { renderGame(); refreshPop(); }
  }

  function renderHome() {
    const sess = store.get('session', null);
    const params = new URLSearchParams(location.search);
    const preCode = (params.get('raum') || '').toUpperCase();
    $app.innerHTML = `
    <div class="home">
      <div class="logo">
        <div class="burst"></div>
        <img src="${LOGO}" alt="Skalamala – Das verrückte Kartenspiel" width="1260" height="600">
        <h1 class="sr">Skalamala</h1>
      </div>
      <p class="tagline">8 Runden · wer am wenigsten Punkte hat, gewinnt!</p>
      <div class="panel">
        <div class="field">
          <label for="name">Dein Name</label>
          <input id="name" class="input" maxlength="16" placeholder="z. B. Sabine" value="${esc(ui.name)}" autocomplete="nickname">
        </div>
        <div class="field">
          <label>Sprache</label>
          <div class="modesel" data-nok>
            <button class="btn small ${ui.lang === 'de' ? 'on' : ''}" data-a="langDe">Deutsch</button>
            <button class="btn small ${ui.lang === 'ksh' ? 'on' : ''}" data-a="langKsh">Op Kölsch 🍺</button>
            <button class="btn small ${ui.lang === 'en' ? 'on' : ''}" data-a="langEn">English</button>
          </div>
        </div>
        <div class="field">
          <label>Spielmodus</label>
          <div class="modesel">
            <button class="btn small ${ui.tips ? 'on' : ''}" data-a="modeTips">💡 Mit Tipps</button>
            <button class="btn small ${!ui.tips ? 'on' : ''}" data-a="modeTour">🏆 Turnier</button>
          </div>
          <p class="hint" style="margin:6px 0 0">${ui.tips ? 'Zeigt dir während des Spiels Vorschläge: welche Karte nehmen, auslegen, anlegen oder abwerfen.' : 'Turnier: ohne Tipps – alle spielen auf eigene Faust.'}</p>
        </div>
        <div class="field"><label>Ton</label>${soundControls()}</div>
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
          ${(ui.fixedRooms || []).map((f) => `
          <div class="fixedroom">
            <button class="btn green" data-a="joinFixed" data-code="${esc(f.code)}">🎪 ${esc(f.name)} betreten</button>
            <div class="hint" style="margin:4px 0 0">Fester Raum für ${esc(f.members.join(', '))}</div>
          </div>`).join('')}
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
      <div class="version">Version ${VERSION}</div>
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
        ${r.fixed ? `<h2>🎪 ${esc(r.title)}</h2>` : ''}
        <h2${r.fixed ? ' style="font-size:1rem;opacity:.8"' : ''}>Raumcode</h2>
        <div class="code">${esc(r.code)}</div>
        ${r.fixed ? (() => { const miss = r.members.filter((n) => !r.seats.some((s) => s.name === n && s.connected)); return miss.length ? `<p class="hint" style="text-align:center">Fehlt noch: ${esc(miss.join(', '))}</p>` : '<p class="hint" style="text-align:center">Alle Mitglieder sind da! 🎉</p>'; })() : ''}
        <div class="row" style="justify-content:center"><button class="btn small ghost" data-a="copyLink" data-link="${esc(link)}">🔗 Einladungslink kopieren</button></div>
        <div class="row" style="justify-content:center;margin:6px 0 2px">
          ${isHost ? `<div class="modesel"><button class="btn small ${r.tips ? 'on' : ''}" data-a="roomTips" data-v="1">💡 Mit Tipps</button><button class="btn small ${!r.tips ? 'on' : ''}" data-a="roomTips" data-v="0">🏆 Turnier</button></div>`
            : `<span class="badge ${r.tips ? '' : 'gold'}">${r.tips ? '💡 Mit Tipps' : '🏆 Turnier – ohne Tipps'}</span>`}
        </div>
        <div class="row" style="justify-content:center;align-items:center;margin:2px 0 4px;gap:8px">
          ${isHost ? `<span class="hint" style="margin:0">Getauschter Joker:</span><div class="modesel"><button class="btn small ${!r.jokerMust ? 'on' : ''}" data-a="roomJoker" data-v="0">🃏 Behalten</button><button class="btn small ${r.jokerMust ? 'on' : ''}" data-a="roomJoker" data-v="1">🔁 Wieder auslegen</button></div>`
            : `<span class="badge">${r.jokerMust ? '🔁 Getauschter Joker: sofort wieder auslegen' : '🃏 Getauschter Joker: darf auf der Hand bleiben'}</span>`}
        </div>
        <ul class="seats">
          ${r.seats.map((s, i) => `
            <li>
              ${avatar(s.name, i, { off: !s.connected })}
              <span class="nm">${esc(s.name)}</span>${i === r.you ? ' (du)' : ''}
              ${i === r.host ? '<span class="badge gold">Gastgeber</span>' : ''}
              ${s.bot ? '<span class="badge">Bot</span>' : ''}
              ${isHost && i !== r.you ? `<button class="btn small" data-a="kick" data-seat="${i}" aria-label="entfernen">✕</button>` : ''}
            </li>`).join('')}
        </ul>
        ${isHost ? `
          <div class="row grow">
            <button class="btn green" data-a="addBot" ${r.seats.length >= 6 ? 'disabled' : ''}>+ Bot</button>
            <button class="btn primary" data-a="start" ${r.seats.length < 2 ? 'disabled' : ''}>Spiel starten</button>
          </div>
          <p class="hint">2–6 Spieler. Warte, bis alle drin sind, und starte dann.</p>`
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
    if (v.phase === 'lastLay' && v.lastLay) {
      const w = v.players[v.lastLay.winner].name;
      if (v.lastLay.pending.includes(me)) return { t: `🎉 ${w} hat ausgemacht! Du darfst noch die Vorgabe auslegen – nur die Vorgabe, nichts anlegen.`, mine: true };
      const names = (v.lastLay.late || []).map((i) => (i === me ? 'Du' : v.players[i].name));
      return { t: `🎉 ${w} hat ausgemacht! ✋ Noch ausgelegt: ${names.join(', ')}`, mine: (v.lastLay.late || []).includes(me) };
    }
    if (v.phase === 'knock') {
      if (v.knock.pending.includes(me)) return { t: '👊 Klopfen oder passen?', mine: true };
      return { t: `Es darf geklopft werden…`, mine: false };
    }
    if (v.current === me) {
      if (v.phase === 'draw' && v.knock.first != null) return { t: `${v.players[v.knock.first].name} klopft – 👍 oder 👎?`, mine: true };
      if (v.phase === 'draw' && v.knock.after) return { t: 'Klopfer hat die Karte – zieh jetzt vom Stapel oder von der Ablage', mine: true };
      if (v.phase === 'draw') return { t: 'Du bist dran – zieh eine Karte (Stapel oder Ablage)', mine: true };
      const p = v.players[me];
      if (!p.down) return { t: R.fromHand ? 'Ausmachen (alles aus der Hand) oder eine Karte abwerfen' : 'Genau die Vorgabe auslegen – oder abwerfen', mine: true };
      if (v.mustPlay && v.mustPlay.length && v.hand.some((c) => v.mustPlay.includes(c.id))) return { t: '🔄 Joker eingetauscht – lege ihn jetzt an eine beliebige Kombination an', mine: true };
      if (v.ownLocked) return { t: 'Ausgelegt! Jetzt abwerfen – anlegen erst ab deinem nächsten Zug', mine: true };
      return { t: 'Anlegen: Karte wählen, dann auf eine Kombination tippen – zum Schluss abwerfen', mine: true };
    }
    return { t: `${cur.name} ist dran${v.phase === 'draw' ? ' (zieht)' : ''}…`, mine: false };
  }

  function tipFor(v) {
    const key = [v.round, v.phase, v.current, v.knock.first, (v.knock.pending || []).join(), v.hand.map((c) => c.id).join(), v.discardTop && v.discardTop.id, v.melds.map((m) => m.id + ':' + m.cards.length).join(), v.ownLocked, (v.mustPlay || []).join()].join('|');
    if (ui.tipKey === key) return ui.tipCache;
    let t = null;
    try { t = E.suggest(v); } catch (e) { t = null; }
    ui.tipKey = key; ui.tipCache = t;
    return t;
  }

  function renderGame() {
    const v = ui.view, me = v.seat, R = v.roundInfo;
    const myTurn = v.current === me;
    const myP = v.players[me];
    const canPlay = myTurn && v.phase === 'play';
    const stagedIds = new Set([].concat(...ui.piles));
    const contract = !myP.down ? (contractFromPiles(v) || contractFromSelection(v)) : null;
    const handById = new Map(v.hand.map((c) => [c.id, c]));
    const tip = v.tips ? tipFor(v) : null;
    ui.tip = tip;
    const tipIds = new Set(tip ? tip.ids : []);
    const tipBar = !v.tips ? '' : tip
      ? `<div class="tipbar ${ui.tipSmall ? 'small' : 'big'}" data-a="tipToggle" title="${ui.tipSmall ? 'Antippen: Tipp groß anzeigen' : 'Antippen: Tipp klein machen'}"><span>💡 ${esc(tip.text)}</span><i class="tiptog">${ui.tipSmall ? '⤢' : '⤡'}</i>${tip.melds && !ui.piles.length ? '<button class="btn small green" data-a="tipApply">Übernehmen</button>' : ''}</div>`
      : '';

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
    if ((v.phase === 'draw' || (v.phase === 'knock' && (v.knock.pending.includes(me) || myResp === 'knock'))) && !myTurn && (v.knock.canKnock || myResp) && v.discardTop) {
      knockBtn = myResp === 'knock' ? `<span class="badge gold">${v.knock.first === me ? 'du warst zuerst 👊' : 'geklopft 👊'}</span>`
        : myResp === 'pass' ? '' : `<button class="btn knock small" data-a="knock">👊 Klopfen</button>`;
    }
    const piles = `
      <div class="piles">
        <div class="pile ${canDraw ? 'clickable' : ''}" data-a="${canDraw ? 'drawStock' : ''}">
          <div class="back"><img src="${EMBLEM}" alt=""><span>${v.stockCount}</span></div>
          <div class="lbl">Stapel</div>
        </div>
        <div class="pile ${canDraw && v.discardTop ? 'clickable' : ''} ${canDiscardTap ? 'clickable' : ''}" data-drop="discard" data-a="${canDraw ? 'takeDiscard' : canDiscardTap ? 'discardSel' : ''}">
          ${cardHTML(v.discardTop)}
          <div class="lbl">Ablage${v.discardTop ? ` (${v.discardCount})` : ''}</div>
        </div>
        ${knockBtn ? `<div class="knockbox">${knockBtn}</div>` : ''}
      </div>`;

    // Vorgaben
    const ownMelds = v.melds.filter((m) => m.owner === me);
    const slots = `<div class="slots"><span class="slotlbl">Gesucht:</span>${R.slots.map((s) => `<span class="slot ${myP.down ? 'done' : ''}">${E.slotLabel(s)}</span>`).join('')}</div>`;

    // Auslagen
    const layTarget = canPlay && myP.down && ui.selected.length > 0;
    const groups = [];
    for (let i = 0; i < v.players.length; i++) {
      const ms = v.melds.filter((m) => m.owner === i);
      if (!ms.length) continue;
      groups.push(`<div class="mgroup"><div class="who">${avatar(v.players[i].name, i)}${esc(i === me ? 'Deine Auslage' : v.players[i].name)}</div><div class="mrow">
        ${ms.map((m) => {
          const ok = layTarget && !v.ownLocked && E.layOffResult(m, ui.selected.map((id) => handById.get(id)));
          return `<div class="meld ${m.late ? 'late' : ''} ${ok ? 'target' : ''} ${tip && tip.meldId === m.id ? 'tipm' : ''}" data-meld="${m.id}" data-mt="${m.t}"><span class="mt">${E.TYPE_NAME[m.t]}</span>${m.cards.map((c, k) => cardHTML(c, c.joker ? Object.assign({ rep: m.ranks[k] }, jokerLook(m, k)) : {})).join('')}${m.movable ? `<button class="mvj" data-a="moveJoker" data-mid="${m.id}" title="Joker in dieser Sequenz umsetzen – geht nur, solange du am Zug bist">🔀 Joker</button>` : ''}</div>`;
        }).join('')}
      </div></div>`);
    }
    const meldArea = groups.length ? `<div class="meldarea">${groups.join('')}</div>` : `<div class="empty-table">Auslage: noch hat niemand ausgelegt.</div>`;

    // Aktionen
    const st = statusText(v);
    const actions = [];
    if (canDraw) {
      actions.push('<button class="btn primary" data-a="drawStock">Vom Stapel</button>');
      if (v.discardTop) actions.push('<button class="btn" data-a="takeDiscard">Ablage nehmen</button>');
    }
    if (v.phase === 'lastLay' && v.lastLay && v.lastLay.pending.includes(me)) {
      if (contract) actions.push(`<button class="btn primary" data-a="layDown">✓ Vorgabe auslegen</button>`);
      actions.push(`<button class="btn ${contract ? '' : 'primary'}" data-a="lastPass">Nichts auslegen</button>`);
    }
    if (canPlay) {
      if (!myP.down) {
        if (contract) actions.push(`<button class="btn primary" data-a="layDown">${R.fromHand ? '🎉 Ausmachen!' : '✓ Auslegen'}</button>`);
      }
      actions.push(`<button class="btn ${contract ? '' : 'primary'}" data-a="discardSel" ${ui.selected.length === 1 ? '' : 'disabled'}>Abwerfen</button>`);
    }
    if (ui.selected.length >= 1 && v.phase !== 'roundEnd' && v.phase !== 'gameEnd') actions.unshift(`<button class="btn green" data-a="newPile">＋ Sammelstapel (${ui.selected.length})</button>`);
    if (v.phase === 'roundEnd' || v.phase === 'gameEnd') {
      const isHostHere = v.host === v.seat || v.host == null;
      actions.push(`<button class="btn ${isHostHere ? '' : 'primary'}" data-a="showResult">${v.phase === 'gameEnd' ? 'Endergebnis' : 'Rundenergebnis'}</button>`);
      if (v.phase === 'roundEnd') actions.push(nextRoundButton(v));
      if (v.phase === 'gameEnd' && isHostHere) actions.push('<button class="btn primary" data-a="again">Neues Spiel</button>');
    }
    const staging = '';
    const pileRow = `<div class="pilerow ${ui.piles.length ? '' : 'empty'}" id="pilerow">
      ${ui.piles.map((ids, i) => {
        const cards = sortPile(ids.map((id) => handById.get(id)).filter(Boolean), R);
        const st = pileStatus(cards, R);
        const used = contract && contract.used.includes(i);
        return `<div class="spile ${st.cls} ${used ? 'used' : ''}" data-pile="${i}">
          <div class="splbl" data-a="selPile" data-i="${i}">${esc(st.label)}</div>
          <div class="spcards">${cards.map((c) => cardHTML(c, { cls: ui.selected.includes(c.id) ? 'sel' : '' })).join('')}</div>
          <button class="spx" data-a="dissolve" data-i="${i}" aria-label="Stapel auflösen">✕</button>
        </div>`;
      }).join('')}
      <div class="spile new" data-pile="new" data-a="newPile"><span>＋</span><small>${ui.piles.length ? 'Stapel' : 'Sammelstapel – Karten hierher ziehen'}</small></div>
    </div>`;

    // Hand
    const hand = orderedHand(v.hand.filter((c) => !stagedIds.has(c.id)), v.round);
    const handPts = E.handPoints(v.hand);
    const handHTML = hand.map((c) => cardHTML(c, { cls: `${ui.selected.includes(c.id) ? 'sel' : ''} ${(ui.newIds || []).includes(c.id) ? 'new' : ''} ${tipIds.has(c.id) ? 'tip' : ''}`, badge: (ui.newIds || []).includes(c.id) })).join('');

    const lastLog = v.log.length ? v.log[v.log.length - 1].msg : '';
    const warn = !R.knock || R.fromHand;

    $app.innerHTML = `
    <div class="game">
      <div class="topbar">
        <img class="toplogo" src="${EMBLEM}" alt="Skalamala">
        <div class="contract">
          <span class="roundchip">${v.round + 1}/8</span>
          <div class="txt"><div class="ttl">${esc(R.title)}</div><div class="det ${warn ? 'warn' : ''}">${esc(R.detail)}</div></div>
        </div>
        <div class="players">${players}</div>
        <div class="clocks" title="Spielzeit · Dauer des aktuellen Zugs"><span>⏱ <b id="gclock">${fmtClock(clockNow(v).game)}</b></span><span class="tclock">Zug <b id="tclock">${fmtClock(clockNow(v).turn)}</b></span></div>
        ${fsSupported() ? `<button class="btn icon ghost" data-a="fullscreen" aria-label="Vollbild" title="Vollbild">${document.fullscreenElement || document.webkitFullscreenElement ? '🗗' : '⛶'}</button>` : ''}
        <button class="btn icon ghost" data-a="scores" aria-label="Punkte">🏆</button>
        <button class="btn icon ghost only-wide" data-a="rules" aria-label="Regeln">?</button>
        <button class="btn icon ghost" data-a="menu" aria-label="Menü">☰</button>
        <button class="btn icon danger exitbtn" data-a="leaveAsk" aria-label="Spiel verlassen" title="Spiel verlassen">⏻</button>
      </div>
      <div class="main" id="main" style="${ui.sideW ? `--sidew:${ui.sideW}px` : ''}">
        <div class="handzone">
          <div class="handbar">
            <span>${v.hand.length} Karten · ${handPts} Pkt <span class="draghint">· ziehen zum Sortieren</span></span>
            <span>
              <button class="btn small sortbtn ${ui.sort === 'suit' ? 'on' : ''}" data-a="sortSuit">Farbe</button>
              <button class="btn small sortbtn ${ui.sort === 'rank' ? 'on' : ''}" data-a="sortRank">Wert</button>
              <button class="btn small sortbtn ${ui.sort === 'alt' || ui.sort === 'altd' ? 'on' : ''}" data-a="sortAlt" title="Für Runde 5: rot und schwarz abwechselnd – nochmal tippen dreht die Richtung">Skalamala ${ui.sort === 'altd' ? '↓' : '↑'}</button>
              ${ui.selected.length ? '<button class="btn small danger" data-a="clearSel" aria-label="Auswahl aufheben">✕</button>' : ''}
            </span>
          </div>
          ${tipBar}
          ${pileRow}
          <div class="hand" id="hand">${handHTML}</div>
          <div class="dock">
            <div class="dockrow">
              <div class="dockpiles">${piles}</div>
              <div class="dockmain">
                <div class="status ${st.mine ? 'mine' : ''}">${esc(st.t)}</div>
                <div class="lastlog">${esc(lastLog)}</div>
                ${staging}
                <div class="actions">${actions.join('')}</div>
              </div>
              <div class="dockslots">${slots}</div>
            </div>
          </div>
          ${renderKnockPrompt(v)}${renderApprovePrompt(v)}
        </div>
        <div class="splitter" id="splitter" title="Ziehen, um die Breite zu ändern (Doppelklick: zurücksetzen)" aria-label="Breite ändern" role="separator"><span></span></div>
        <div class="side">
          <div class="tablezone">${meldArea}</div>
        </div>
      </div>
    </div>`;
    layoutHand();
    placeKnockPrompt();
  }
  // Klopf-Fenster neben die Ablage legen – die Karte, um die geklopft wird, bleibt sichtbar
  function placeKnockPrompt() {
    const kp = document.querySelector('.handzone .knockprompt.kbig');
    if (!kp) return;
    const hz = kp.closest('.handzone'), disc = hz && hz.querySelector('[data-drop="discard"]');
    if (!disc) return;
    disc.classList.add('kpglow');
    const H = hz.getBoundingClientRect(), D = disc.getBoundingClientRect();
    const left = D.right - H.left + 10, room = H.width - left - 6;
    if (room >= 180) {
      kp.classList.add('beside');
      kp.style.left = left + 'px';
      kp.style.width = Math.min(room, 640) + 'px';
      kp.style.bottom = Math.max(6, H.bottom - D.bottom) + 'px';
      kp.classList.toggle('narrow', room < 420);
    } else {
      // zu wenig Platz daneben: über die Stapel legen statt darauf
      kp.classList.add('above');
      kp.style.bottom = (H.bottom - D.top + 8) + 'px';
    }
  }

  // Ich bin dran, jemand hat geklopft: genehmigen (nicken) oder selbst nehmen
  function renderApprovePrompt(v) {
    if (v.current !== v.seat || v.phase !== 'draw' || v.knock.first == null || !v.discardTop) return '';
    const who = v.players[v.knock.first].name;
    return `<div class="knockprompt approve">
      <div class="kpcard">${cardHTML(v.discardTop)}</div>
      <div class="kpmid">
        <h3>${esc(who)} klopft!</h3>
      </div>
      <div class="thumbs">
        <button class="thumb up" data-a="drawStock" aria-label="Zustimmen" title="Zustimmen: ${esc(who)} bekommt die Karte + 1 Strafkarte, danach ziehst du vom Stapel oder der Ablage.">👍</button>
        <button class="thumb down" data-a="rejectKnock" aria-label="Ablehnen" title="Ablehnen: du nimmst die offene Karte selbst – ohne Strafkarte">👎</button>
      </div>
    </div>`;
  }



  // ---------- Online: Erinnerung, wenn man am Zug ist und nicht reagiert ----------
  function idleLeft(v) {
    if (!v || !v.idle || v.idle.seat !== v.seat || v.seat == null) return null;
    const ms = v.idle.ms + (Date.now() - (ui.clockAt || Date.now()));
    return { ms, left: Math.max(0, v.idle.limit - ms), half: v.idle.limit / 2 };
  }
  function updateNudge() {
    const v = ui.view, il = idleLeft(v);
    let el = document.getElementById('nudge');
    if (!il || il.ms < il.half) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'nudge';
      el.innerHTML = `<div class="nbox"><div class="nicon">⏰</div><h3>Du bist dran!</h3><p class="ntext"></p><button class="btn primary">Weiterspielen</button></div>`;
      el.addEventListener('click', () => { el.classList.add('hide'); ui.nudgeHidden = v && v.idle ? v.idle.seat + ':' + (v.turnNo || '') + ':' + Math.floor(Date.now() / 1000) : 1; });
      document.body.appendChild(el);
      try { if (window.SkSound) window.SkSound.play('knock'); } catch (e) {}
    }
    const sec = Math.ceil(il.left / 1000);
    el.querySelector('.ntext').textContent = sec > 0 ? `Noch ${sec} Sekunden – dann spielt das Spiel deinen Zug automatisch.` : 'Dein Zug wird jetzt automatisch gespielt …';
  }
  setInterval(updateNudge, 500);

  // ---------- Spielzeit / Zugdauer ----------
  function clockNow(v) {
    const c = (v && v.clock) || { game: 0, turn: 0 };
    const d = Date.now() - (ui.clockAt || Date.now());
    const running = v && v.phase !== 'gameEnd';
    const turnRuns = v && v.phase !== 'roundEnd' && v.phase !== 'gameEnd';
    return { game: c.game + (running ? d : 0), turn: turnRuns ? c.turn + d : null };
  }
  function fmtClock(ms) {
    if (ms == null) return '–';
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
    const pad = (x) => String(x).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }
  setInterval(() => {
    const g = document.getElementById('gclock'), t = document.getElementById('tclock');
    if (!g || !ui.view) return;
    const c = clockNow(ui.view);
    g.textContent = fmtClock(c.game);
    if (t) t.textContent = fmtClock(c.turn);
  }, 1000);
  // ---------- Vollbild ----------
  function fsSupported() {
    const d = document.documentElement;
    return !!(d.requestFullscreen || d.webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled);
  }
  function toggleFullscreen() {
    const d = document.documentElement;
    const on = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      const p = on ? (document.exitFullscreen || document.webkitExitFullscreen).call(document) : (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
      if (p && p.catch) p.catch(() => toast('Vollbild ist hier nicht möglich – öffne das Spiel direkt im Browser.'));
    } catch (e) { toast('Vollbild ist hier nicht möglich – öffne das Spiel direkt im Browser.'); }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => { if (ui.view) render(); }));

  function renderKnockPrompt(v) {
    if (v.phase !== 'knock' || !v.knock.pending.includes(v.seat) || !ui.knockPrompt) return '';
    return `<div class="knockprompt kbig">
      <div class="kpmid">
        <h3>Klopfen?</h3>
        <div class="bar"><i id="kbar"></i></div>
      </div>
      <div class="kpbtns"><button class="btn primary" data-a="knock">👊 Klopfen</button><button class="btn white" data-a="pass">Passen</button></div>
    </div>`;
  }
  setInterval(() => {
    const ab = document.getElementById('abar');
    if (ab) ab.style.transform = `scaleX(${Math.max(0, 1 - (Date.now() - (ui.approveStart || Date.now())) / 7800)})`;
    const bar = document.getElementById('kbar');
    if (!bar) return;
    const f = Math.max(0, 1 - (Date.now() - ui.knockStart) / 6800);
    bar.style.transform = `scaleX(${f})`;
  }, 100);

  // Handkarten so groß wie möglich in die große Fläche einpassen
  function layoutHand() {
    const el = document.getElementById('hand');
    if (!el) return;
    const n = el.children.length;
    if (!n) return;
    const cs = getComputedStyle(el);
    const W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
    const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2;
    const gap = W < 520 ? 6 : 10;
    const maxCw = W < 520 ? 104 : 170;
    let cw = 34;
    for (let c = maxCw; c >= 34; c -= 2) {
      const cols = Math.max(1, Math.floor((W + gap) / (c + gap)));
      const rows = Math.ceil(n / cols);
      if (rows * c * 1.42 + (rows - 1) * gap <= H) { cw = c; break; }
    }
    el.style.setProperty('--cw', cw + 'px');
    el.style.setProperty('--hg', gap + 'px');
  }
  window.addEventListener('resize', layoutHand);

  // ---------- Dialoge ----------
  // Sprache: Übersetzung der Anzeige + englische Kartenwerte (J/Q statt B/D)
  function applyLang() {
    if (E.RANK_LABEL) Object.assign(E.RANK_LABEL, ui.lang === 'en' ? { 11: 'J', 12: 'Q' } : { 11: 'B', 12: 'D' });
    ui.tipKey = null;
    if (window.I18n) window.I18n.setLang(ui.lang);
  }

  function rulesHTML() {
    if (ui.lang === 'en') return rulesHTML_EN();
    return `<button class="btn small ghost close" data-close>Schließen</button>
      <h2>Spielregeln</h2>
      <p>Gespielt wird mit 2 Blättern à 55 Karten (je 52 + 3 Joker = 110 Karten), ab 2 Spielern. Jeder bekommt 11 Karten, der Rest liegt verdeckt als Stapel in der Mitte, eine Karte wird aufgedeckt.</p>
      <h3>Ablauf eines Zuges</h3>
      <ol>
        <li><b>Ziehen:</b> die oberste Karte der Ablage oder eine verdeckte vom Stapel.</li>
        <li><b>Auslegen:</b> Wer die Vorgabe der Runde auf der Hand hat, legt sie aus. Ab dem <b>nächsten Zug</b> darf man an alle Kombinationen auf dem Tisch anlegen.</li>
        <li><b>Abwerfen:</b> eine Karte auf die Ablage – dann ist der Nächste (im Uhrzeigersinn) dran.</li>
      </ol>
      <h3>Klopfen 👊</h3>
      <p>Bevor der Spieler, der dran ist, vom Stapel zieht, dürfen die anderen um die offene Karte klopfen. Es gilt: <b>wer zuerst klopft</b>, bekommt die Karte – der Spieler am Zug hat aber immer Vorrang: er kann zustimmen (👍) oder ablehnen (👎 – dann nimmt er die offene Karte selbst, ohne Strafkarte). Die Abfrage bleibt stehen, bis er sich entschieden hat. Stimmt er zu, bekommt der erste Klopfer die Karte <b>plus eine verdeckte Strafkarte</b> – danach zieht der Spieler am Zug ganz normal <b>vom Stapel oder von der Ablage</b>. In Runde 6 darf nicht geklopft werden.</p>
      <h3>Bedienung</h3>
      <p>Karten <b>antippen</b> zum Auswählen. Karten <b>ziehen</b>, um sie in deine Wunsch-Reihenfolge zu bringen („Farbe“ oder „Wert“ sortiert automatisch). Eine Karte auf die Ablage ziehen wirft sie ab, auf eine Kombination ziehen legt sie an.</p>
      <p><b>Groß ansehen:</b> Mit der Maus über eine Kombination, einen Sammelstapel oder die Ablage fahren – die Karten treten größer hervor. Auf Handy/Tablet: den Finger kurz darauf halten.</p>
      <p><b>Doppelklick</b> auf eine Karte schiebt sie in den Sammelstapel, Doppelklick im Sammelstapel holt sie zurück.</p>
      <p><b>Sammelstapel:</b> Zieh Karten auf das ＋ (oder wähle sie aus und tippe „＋ Sammelstapel“), um z. B. einen Drilling oder eine Straße mit Joker zu sammeln. Ein grüner Haken zeigt, dass der Stapel gültig ist. Erfüllen deine Stapel die Vorgabe der Runde, erscheint „Auslegen“.</p>
      <h3>Kombinationen</h3>
      <ul>
        <li><b>Gruppe:</b> gleiche Werte, z. B. 3 Zehnen (Farben egal).</li>
        <li><b>Sequenz (Straße):</b> mind. 4 aufeinanderfolgende Karten derselben Farbe, z. B. ♠10 B D K. Das Ass zählt hoch (D-K-A) oder niedrig (A-2-3) – auch rundherum ist erlaubt (K-A-2).</li>
        <li><b>Skalamala:</b> 10er-Sequenz, abwechselnd rot – schwarz (2 rot, 3 schwarz, 4 rot …).</li>
        <li><b>Joker</b> ersetzen jede beliebige Karte – in jeder Kombination muss aber mindestens <b>eine echte Karte mehr</b> liegen als Joker (2 Karten + 1 Joker, 3 Karten + 2 Joker …).</li>
        <li><b>Joker in einer Sequenz:</b> Kann der Joker für verschiedene Karten stehen (vorne oder hinten), fragt das Spiel beim Auslegen und Anlegen, wofür er stehen soll – einfach die gewünschte Reihenfolge antippen.</li>
        <li><b>Joker tauschen:</b> Nach dem ersten Auslegen darfst du die passende echte Karte auf den Platz eines Jokers legen. Der Joker kommt auf deine Hand. Ob er im selben Zug wieder angelegt werden muss oder auf der Hand bleiben darf, legt die Einstellung <b>Getauschter Joker</b> fest (Standard: er darf auf der Hand bleiben).</li>
        <li>Beim <b>ersten Auslegen</b> wird <b>genau die Vorgabe</b> ausgelegt – z. B. in Runde 1 genau eine Gruppe aus 3 Karten und eine Sequenz aus 4 Karten. Steht „mind.“ dabei, darf die Kombination länger sein.</li>
        <li>In dem Zug, in dem man auslegt, wird <b>nur die Vorgabe</b> ausgelegt. <b>Anlegen</b> – an die eigenen und an die Kombinationen der Gegenspieler – erst ab dem <b>nächsten Zug</b>.</li>
      </ul>
      <h3>Die 8 Runden</h3>
      <ol>${E.ROUNDS.map((r) => `<li><b>${esc(r.title)}</b> – ${esc(r.detail)}</li>`).join('')}</ol>
      <p>Am Rundenende drückt <b>jeder Spieler „Weiter“</b> – sind alle bereit, beginnt die nächste Runde.</p>
      <p><b>Hat jemand ausgemacht</b>, dürfen alle, die noch nicht ausgelegt haben, <b>noch schnell die Vorgabe auslegen</b> – aber nur genau die Vorgabe, nichts anlegen. Das passiert <b>automatisch</b>: Hat jemand die Vorgabe auf der Hand, wird sie für ihn ausgelegt – alle sehen es kurz auf dem Tisch, dann wird gezählt. Das spart Punkte.</p>
      <p>In Runde 7 und 8 muss man <b>aus der Hand ausmachen</b>: alle Karten auf einmal auslegen (höchstens eine bleibt zum Abwerfen übrig).</p>
      <h3>Punkte</h3>
      <p>Wer zuerst keine Karten mehr hat, macht aus. Alle anderen zählen ihre Handkarten: 2–9 = 5, 10 bis König = 10, Ass = 20, Joker = 50 Punkte. Nach 8 Runden gewinnt, wer <b>die wenigsten Punkte</b> hat.</p>
      <p class="hint">Ist der Stapel leer, wird die Ablage einmal neu gemischt. Ist er ein zweites Mal leer, endet die Runde und alle zählen ihre Handkarten.</p>`;
  }
  function rulesHTML_EN() {
    const RT = ['1 group + 1 run', '3 groups', '2 runs', '2 groups of 5', 'Skalamala', '5 groups of 2', '2 groups + 1 run', '1 group + 2 runs'];
    const RD = ['group (3 cards) and run (4 cards)', '3 groups of 3 cards', '2 runs, at least 4 cards', '2 groups of 5 cards', '10-card run alternating red – black', '5 pairs – NO KNOCKING!', 'go out from your hand', 'go out from your hand – finale!'];
    return `<button class="btn small ghost close" data-close>Close</button>
      <h2>Rules</h2>
      <p>Played with 2 decks of 55 cards each (52 + 3 jokers = 110 cards), 2 or more players. Everyone gets 11 cards, the rest is placed face down as the stock, one card is turned up.</p>
      <h3>A turn</h3>
      <ol>
        <li><b>Draw:</b> the top card of the discard pile or a face-down card from the stock.</li>
        <li><b>Meld:</b> if you hold the round's contract, lay it down. From your <b>next turn</b> on you may lay off cards on all melds on the table.</li>
        <li><b>Discard:</b> one card onto the discard pile – then it's the next player's turn (clockwise).</li>
      </ol>
      <h3>Knocking 👊</h3>
      <p>Before the player whose turn it is draws from the stock, the others may knock for the face-up card. <b>Whoever knocks first</b> gets the card – but the player on turn always has priority: they can approve (👍) or reject (👎 – then they take the face-up card themselves, without a penalty card). The question stays until they decide. If they approve, the first knocker gets the card <b>plus a face-down penalty card</b> – then the player on turn draws as usual <b>from the stock or the discard pile</b>. No knocking in round 6.</p>
      <h3>Controls</h3>
      <p><b>Tap</b> cards to select them. <b>Drag</b> cards to put them in your preferred order („Suit“ or „Rank“ sorts automatically). Dragging a card onto the discard pile discards it, dragging it onto a meld lays it off.</p>
      <p><b>Enlarge:</b> move the mouse over a meld, a collect pile or the discard pile – the cards pop out larger. On phone/tablet: hold your finger on it briefly.</p>
      <p><b>Double-click</b> a card to move it into a collect pile, double-click in the collect pile to take it back.</p>
      <p><b>Collect piles:</b> drag cards onto the ＋ (or select them and tap „＋ Collect pile“) to collect e.g. three of a kind or a run with a joker. A green tick shows the pile is valid. When your piles meet the round's contract, „Meld“ appears.</p>
      <h3>Combinations</h3>
      <ul>
        <li><b>Group:</b> cards of the same rank, e.g. three 10s (suits don't matter).</li>
        <li><b>Run:</b> at least 4 consecutive cards of the same suit, e.g. ♠10 J Q K. The ace counts high (Q-K-A) or low (A-2-3) – wrapping around is allowed too (K-A-2).</li>
        <li><b>Skalamala:</b> 10-card run alternating red – black (2 red, 3 black, 4 red …).</li>
        <li><b>Jokers</b> replace any card – but every meld needs at least <b>one more real card</b> than jokers (2 cards + 1 joker, 3 cards + 2 jokers …).</li>
        <li><b>Laying a joker on a run:</b> drag the joker onto the left or right half of the run – that's where it goes (front or back). For your first meld: if the joker is first in the collect pile, it goes to the start of the run.</li>
        <li><b>Swapping a joker:</b> after your first meld you may place the matching real card on a joker's spot. The joker goes to your hand. Whether it must be laid off again in the same turn or may stay in your hand is set by the <b>swapped joker</b> setting (default: it may stay in your hand).</li>
        <li>For your <b>first meld</b> you lay down <b>exactly the contract</b> – e.g. in round 1 exactly a group of 3 cards and a run of 4 cards. If it says „at least“, the meld may be longer.</li>
        <li>In the turn you meld, you lay down <b>only the contract</b>. <b>Laying off</b> – on your own and your opponents' melds – starts with your <b>next turn</b>.</li>
      </ul>
      <h3>The 8 rounds</h3>
      <ol>${RT.map((t, i) => `<li><b>${t}</b> – ${RD[i]}</li>`).join('')}</ol>
      <p>At the end of a round <b>every player presses „Next“</b> – when everyone is ready, the next round begins.</p>
      <p><b>When someone goes out</b>, everyone who hasn't melded yet may <b>still lay down the contract</b> – exactly the contract, no laying off. This happens <b>automatically</b>: if someone holds the contract, it is laid down for them – everyone sees it on the table briefly, then points are counted. That saves points.</p>
      <p>In rounds 7 and 8 you must <b>go out from your hand</b>: lay down all cards at once (at most one card is left to discard).</p>
      <h3>Points</h3>
      <p>Whoever runs out of cards first goes out. Everyone else counts their hand: 2–9 = 5, 10 to King = 10, Ace = 20, Joker = 50 points. After 8 rounds, the player with <b>the fewest points</b> wins.</p>
      <p class="hint">If the stock runs out, the discard pile is reshuffled once. If it runs out a second time, the round ends and everyone counts their hand.</p>`;
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
        <div class="res">${v.players.map((p, i) => `<div class="r ${i === lr.winner ? 'win' : ''}"><span class="nm">${esc(p.name)}${(lr.late || []).includes(i) ? ' <span class="badge gold">✋ noch ausgelegt</span>' : ''}</span><span class="cards">${i === v.seat ? lr.hands[i].map((c) => cardHTML(c)).join('') : (lr.counts[i] ? `<span class="hint" style="margin:0">${lr.counts[i]} Karte${lr.counts[i] === 1 ? '' : 'n'} übrig</span>` : '')}</span><span class="pts">+${lr.points[i]}</span></div>`).join('')}</div>`;
    }
    const btn = over
      ? (isHost ? `<button class="btn primary" data-a="again">Neues Spiel</button>` : '<p class="hint">Der Gastgeber kann ein neues Spiel starten.</p>')
      : nextRoundButton(v);
    openModal(`${head}<h3>Punktestand</h3>${scoresHTML(v)}<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn danger" data-a="leaveAsk">Spiel verlassen</button><span style="flex:1"></span><button class="btn ghost" data-close>Tisch ansehen</button>${btn}</div>`, onModalClick);
    ui.modalKind = 'roundEnd';
  }
  // „Weiter“: online bestätigt jeder Spieler, sind alle bereit, geht es los
  function nextRoundButton(v) {
    const label = `Weiter zu Runde ${v.round + 2} ▶`;
    if (!v.multi || !v.ready) return `<button class="btn primary" data-a="nextRound">${label}</button>`;
    if (v.ready[v.seat]) {
      const wait = v.players.filter((p, i) => !v.ready[i] && p.connected !== false).map((p) => p.name);
      return `<span class="badge gold" style="padding:8px 14px;font-size:.85rem">✓ Bereit${wait.length ? ' – warte auf ' + esc(wait.join(', ')) : ''}</span>`;
    }
    return `<button class="btn primary" data-a="nextRound">${label}</button>`;
  }

  function onModalClick(e) {
    const b = e.target.closest('[data-a]');
    if (b) handle(b.dataset.a, b);
  }

  // ---------- Eingaben ----------
  // ---------- Hervorheben: Kombination / Sammelstapel / Ablage tritt größer hervor ----------
  const POP_SEL = '[data-meld], [data-drop="discard"]';
  function popCards(kind, id) {
    const v = ui.view;
    if (!v) return null;
    if (kind === 'meld') {
      const m = v.melds.find((x) => x.id === id);
      return m ? m.cards.map((c, k) => cardHTML(c, c.joker ? Object.assign({ rep: m.ranks[k] }, jokerLook(m, k)) : {})) : null;
    }
    if (kind === 'pile') {
      const byId = new Map(v.hand.map((c) => [c.id, c]));
      return (ui.piles[id] || []).map((x) => byId.get(x)).filter(Boolean).map((c) => cardHTML(c));
    }
    return v.discardTop ? [cardHTML(v.discardTop)] : null;
  }
  const popKey = (t) => (t.dataset.meld ? 'meld:' + t.dataset.meld : t.dataset.pile ? 'pile:' + t.dataset.pile : 'discard:0');
  function showPop(t, instant) {
    const [kind, sid] = popKey(t).split(':');
    const cards = popCards(kind, +sid);
    if (!cards || !cards.length) return hidePop();
    let p = document.getElementById('pop');
    if (!p) { p = document.createElement('div'); p.id = 'pop'; document.body.appendChild(p); }
    p.className = (kind === 'meld' ? 'fan' : '') + (instant ? ' instant' : '');
    p.innerHTML = cards.join('');
    ui.popKey = popKey(t);
    p.style.left = '0px'; p.style.top = '0px';
    const r = t.getBoundingClientRect(), pr = { width: p.offsetWidth, height: p.offsetHeight }; // offset* = ohne Animations-Skalierung
    let x = r.left + r.width / 2 - pr.width / 2, y = r.top + r.height / 2 - pr.height / 2;
    x = Math.max(6, Math.min(innerWidth - pr.width - 6, x)); y = Math.max(6, Math.min(innerHeight - pr.height - 6, y));
    p.style.left = x + 'px'; p.style.top = y + 'px';
  }
  function hidePop() { const p = document.getElementById('pop'); if (p) p.remove(); ui.popKey = null; }
  let popTimer = null, mouse = { x: -1, y: -1 }, touchHold = false;
  function refreshPop() {
    if (!ui.popKey) return;
    const el = touchHold ? null : document.elementFromPoint(mouse.x, mouse.y);
    const t = el && el.closest(POP_SEL);
    if (t && popKey(t) === ui.popKey) showPop(t, true);
    else if (touchHold) { const tt = [...document.querySelectorAll(POP_SEL)].find((x) => popKey(x) === ui.popKey); if (tt) showPop(tt, true); else hidePop(); }
    else hidePop();
  }
  // Maus: kurz darüber verweilen
  $app.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    const t = e.target.closest(POP_SEL);
    if (!t || popKey(t) === ui.popKey) return;
    clearTimeout(popTimer);
    popTimer = setTimeout(() => showPop(t), 220);
  });
  window.addEventListener('pointermove', (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== 'mouse' || !ui.popKey && !popTimer) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const t = el && el.closest(POP_SEL);
    if (!t) { clearTimeout(popTimer); popTimer = null; hidePop(); }
  }, { passive: true });
  // Finger: gedrückt halten, loslassen = wieder klein
  let lp = null;
  $app.addEventListener('pointerdown', (e) => {
    hidePop();
    if (e.pointerType === 'mouse') return;
    const t = e.target.closest(POP_SEL);
    if (!t) return;
    clearTimeout(lp && lp.timer);
    lp = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { lp = null; touchHold = true; ui.suppressTap = Date.now(); showPop(t); }, 380) };
  }, true);
  const lpCancel = (e) => {
    if (e.type !== 'pointermove' && touchHold) { touchHold = false; hidePop(); ui.suppressTap = Date.now(); }
    if (!lp) return;
    if (e.type === 'pointermove' && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) < 8) return;
    clearTimeout(lp.timer); lp = null;
  };
  ['pointermove', 'pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, lpCancel, true));

  $app.addEventListener('click', (e) => {
    if (ui.suppressTap && Date.now() - ui.suppressTap < 700) return;
    if (e.target.closest('#hand .card, #pilerow .card')) return; // per Zeiger-Logik (Tippen/Ziehen)
    const mvj = e.target.closest('[data-a="moveJoker"]');
    if (mvj) return handle('moveJoker', mvj);
    const meldEl = e.target.closest('[data-meld]');
    if (meldEl) {
      if (!ui.selected.length) return;
      return layOff(+meldEl.dataset.meld, meldEnd(meldEl, e.clientX));
    }
    const b = e.target.closest('[data-a]');
    if (b && b.dataset.a) handle(b.dataset.a, b);
  });
  $app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'code') handle('join');
    if (e.key === 'Enter' && e.target.id === 'name' && !ui.onlineAvailable) handle('playBots');
  });

  // ---------- Trenner zwischen Kartenfeld und rechter Seite ----------
  let split = null;
  $app.addEventListener('pointerdown', (e) => {
    const sp = e.target.closest('#splitter');
    if (!sp) return;
    const main = document.getElementById('main');
    split = { pid: e.pointerId, main };
    try { sp.setPointerCapture(e.pointerId); } catch (err) {}
    sp.classList.add('active');
    e.preventDefault();
  });
  $app.addEventListener('pointermove', (e) => {
    if (!split || e.pointerId !== split.pid) return;
    const r = split.main.getBoundingClientRect();
    const w = Math.round(Math.max(260, Math.min(r.width - 420, r.right - e.clientX - 14)));
    ui.sideW = w;
    split.main.style.setProperty('--sidew', w + 'px');
    if (!split.raf) split.raf = requestAnimationFrame(() => { if (split) split.raf = 0; layoutHand(); });
  });
  const endSplit = (e) => {
    if (!split || e.pointerId !== split.pid) return;
    split = null;
    const sp = document.getElementById('splitter'); if (sp) sp.classList.remove('active');
    store.set('sideW', ui.sideW);
    layoutHand();
  };
  $app.addEventListener('pointerup', endSplit);
  $app.addEventListener('pointercancel', endSplit);
  $app.addEventListener('dblclick', (e) => {
    if (!e.target.closest('#splitter')) return;
    ui.sideW = 0; store.set('sideW', 0); render();
  });

  // ---------- Ziehen & Ablegen der Handkarten ----------
  let drag = null;
  function clearDropMarks() { document.querySelectorAll('.drop-l,.drop-r,.drop-on,.drop-start,.drop-end').forEach((x) => x.classList.remove('drop-l', 'drop-r', 'drop-on', 'drop-start', 'drop-end')); }
  function dropSlot(x, y, rects) {
    let best = null, bd = Infinity;
    for (const r of rects) {
      const cx = r.r.left + r.r.width / 2, cy = r.r.top + r.r.height / 2;
      const d = Math.hypot(x - cx, (y - cy) * 1.6);
      if (d < bd) { bd = d; best = r; }
    }
    if (!best) return null;
    return { target: best, after: x > best.r.left + best.r.width / 2 };
  }
  $app.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('#hand .card, #pilerow .card');
    if (!c || (e.button != null && e.button > 0)) return;
    drag = { id: +c.dataset.id, el: c, x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId };
    try { c.setPointerCapture(e.pointerId); } catch (err) {}
  });
  $app.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 9) return;
      drag.moved = true; ui.dragging = true;
      drag.el.classList.add('dragging');
      drag.fromPile = !!drag.el.closest('#pilerow');
      drag.rects = [...document.querySelectorAll('#hand .card')].filter((x) => x !== drag.el).map((x) => ({ id: +x.dataset.id, r: x.getBoundingClientRect(), el: x }));
      // schwebende Kopie am Mauszeiger – bleibt über allen Bereichen sichtbar
      const r = drag.el.getBoundingClientRect();
      const g = drag.el.cloneNode(true);
      g.classList.remove('dragging', 'sel', 'selected', 'new');
      g.removeAttribute('data-id');
      g.className += ' dragghost';
      g.style.cssText = `--cw:${r.width}px;width:${r.width}px;height:${r.height}px;left:${e.clientX}px;top:${e.clientY}px`;
      document.body.appendChild(g);
      drag.ghost = g; drag.gw = r.width;
    }
    e.preventDefault();
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const special = under && (under.closest('[data-drop="discard"]') || under.closest('[data-meld]') || under.closest('[data-pile]'));
    const outside = !!special || !(under && under.closest('#hand'));
    if (drag.ghost) {
      // in der Hand: normale Größe; über Ablage/Auslage/Sammelstapel: klein am Zeiger
      const sc = outside ? Math.max(.38, Math.min(.6, 64 / drag.gw)) : 1.04;
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      drag.ghost.style.transform = `translate(-50%, -45%) rotate(${Math.max(-8, Math.min(8, dx / 30))}deg) scale(${sc})`;
    }
    clearDropMarks();
    if (special) {
      special.classList.add('drop-on');
      if (special.dataset.meld && /\b(S|A)\b/.test(special.dataset.mt || '')) special.classList.add(meldEnd(special, e.clientX) === 'start' ? 'drop-start' : 'drop-end');
      return;
    }
    const sl = dropSlot(e.clientX, e.clientY, drag.rects);
    if (sl) sl.target.el.classList.add(sl.after ? 'drop-r' : 'drop-l');
  });
  function endDrag(e, cancel) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    clearDropMarks();
    ui.dragging = false;
    if (!d.moved) {
      if (cancel) return;
      if (ui.suppressTap && Date.now() - ui.suppressTap < 700) return;
      if (window.SkSound) window.SkSound.play('click');
      const now = Date.now();
      if (ui.lastTap && ui.lastTap.id === d.id && now - ui.lastTap.t < 380) {
        // Doppelklick: erster Klick hat ausgewählt – rückgängig machen, dann verschieben
        ui.lastTap = null;
        ui.selected = ui.selected.filter((x) => x !== d.id);
        if (d.el.closest('#pilerow')) {
          ui.piles = ui.piles.map((p) => p.filter((x) => x !== d.id)).filter((p) => p.length);
        } else {
          const target = ui.piles.length ? Math.min(ui.lastPile != null ? ui.lastPile : ui.piles.length - 1, ui.piles.length - 1) : 'new';
          movePileCards([d.id], target);
          ui.lastPile = target === 'new' ? ui.piles.length - 1 : target;
        }
        return render();
      }
      ui.lastTap = { id: d.id, t: now };
      toggleCard(d.id);
      return;
    }
    d.el.classList.remove('dragging'); d.el.style.transform = '';
    const v = ui.view;
    const under = cancel ? null : document.elementFromPoint(e.clientX, e.clientY);
    const canPlay = v && v.current === v.seat && v.phase === 'play';
    const onDiscard = under && under.closest('[data-drop="discard"]');
    const onMeld0 = under && under.closest('[data-meld]');
    if ((onDiscard || onMeld0) && v && !canPlay) {
      if (v.current === v.seat && v.phase === 'draw') toast('Bitte erst eine Karte nehmen – vom Stapel oder von der Ablage.');
      else if (v.current !== v.seat) toast('Du bist noch nicht dran.');
      return render();
    }
    const onMeld = under && under.closest('[data-meld]');
    const onPile = under && under.closest('[data-pile]');
    const moveIds = ui.selected.includes(d.id) && ui.selected.length > 1 ? ui.selected.slice() : [d.id];
    if (onPile) {
      const t = onPile.dataset.pile;
      movePileCards(moveIds, t === 'new' ? 'new' : +t);
      ui.lastPile = t === 'new' ? ui.piles.length - 1 : Math.min(+t, ui.piles.length - 1);
      ui.selected = []; ui.pendingRender = false;
      return render();
    }
    if (onDiscard && canPlay) { ui.selected = []; ui.pendingRender = false; ui.ctl.act({ type: 'discard', cardId: d.id }); return render(); }
    if (onMeld && canPlay) {
      if (!v.players[v.seat].down) { toast('Erst die Vorgabe auslegen, dann anlegen.'); return render(); }
      const ids = ui.selected.includes(d.id) ? ui.selected.slice() : [d.id];
      ui.selected = []; ui.pendingRender = false;
      render();
      return layOffWithJoker(v, +onMeld.dataset.meld, ids, meldEnd(onMeld, e.clientX));
    }
    if (!cancel && d.fromPile) {
      // aus dem Sammelstapel zurück in die Hand
      ui.piles = ui.piles.map((p) => p.filter((id) => !moveIds.includes(id))).filter((p) => p.length);
    }
    if (!cancel && d.rects && d.rects.length && !d.fromPile) {
      const sl = dropSlot(e.clientX, e.clientY, d.rects);
      const order = [...document.querySelectorAll('#hand .card')].map((x) => +x.dataset.id).filter((id) => id !== d.id);
      let idx = order.indexOf(sl.target.id) + (sl.after ? 1 : 0);
      order.splice(idx, 0, d.id);
      ui.order = order; ui.orderRound = v.round; ui.sort = 'custom';
    }
    ui.pendingRender = false;
    render();
  }
  $app.addEventListener('pointerup', (e) => endDrag(e, false));
  $app.addEventListener('pointercancel', (e) => endDrag(e, true));

  function toggleCard(id) {
    const i = ui.selected.indexOf(id);
    if (i >= 0) ui.selected.splice(i, 1); else ui.selected.push(id);
    render();
  }
  // Vorne oder hinten anlegen? (Sequenzen: Joker-Platz per Zeiger bestimmen)
  function meldEnd(meldEl, x) {
    const cs = meldEl.querySelectorAll('.card');
    if (!cs.length) return 'end';
    const a = cs[0].getBoundingClientRect(), b = cs[cs.length - 1].getBoundingClientRect();
    return x < (a.left + b.right) / 2 ? 'start' : 'end';
  }

  // ---------- Joker-Platz wählen: wofür steht der Joker in der Sequenz? ----------
  function jokerOptionsHTML(t, arr) {
    const m = { t, cards: arr.map((x) => x.card), ranks: arr.map((x) => x.rank) };
    return `<div class="meld jopt" data-mt="${t}">${m.cards.map((c, k) => cardHTML(c, c.joker ? Object.assign({ rep: m.ranks[k] }, jokerLook(m, k)) : {})).join('')}</div>`;
  }
  function jokerNames(t, arr) {
    const m = { t, cards: arr.map((x) => x.card), ranks: arr.map((x) => x.rank) };
    return m.cards.map((c, k) => {
      if (!c.joker) return null;
      const lk = jokerLook(m, k);
      return E.rankLabel(m.ranks[k]) + (lk.repSuit ? E.SUIT_SYM[lk.repSuit] : lk.repColor === 'red' ? ' (rot)' : lk.repColor === 'black' ? ' (schwarz)' : '');
    }).filter(Boolean).join(', ');
  }
  // items: [{ t, opts: [{ value, arr }] }] – fragt nacheinander, done(values) am Ende; Abbrechen = nichts tun
  function pickJoker(items, done) {
    const vals = [];
    (function ask(i) {
      if (i >= items.length) { closeModal(); return done(vals); }
      const it = items[i];
      if (it.opts.length < (it.force ? 1 : 2)) { vals.push(it.opts.length ? it.opts[0].value : undefined); return ask(i + 1); }
      ui.modalKind = 'joker';
      openModal(`<h2>🃏 Wofür steht der Joker?</h2>
        <p class="hint">${E.TYPE_NAME[it.t]}${items.length > 1 ? ` (${i + 1} von ${items.length})` : ''} – tippe die gewünschte Reihenfolge an.</p>
        <div class="jchoices">${it.opts.map((o, k) => `<button class="jchoice" data-jk="${k}">${jokerOptionsHTML(it.t, o.arr)}<span>Joker = <b>${esc(jokerNames(it.t, o.arr))}</b></span></button>`).join('')}</div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-close>Abbrechen</button></div>`, (e) => {
        const b = e.target.closest('[data-jk]');
        if (!b) return;
        vals.push(it.opts[+b.dataset.jk].value);
        ask(i + 1);
      });
    })(0);
  }
  // Auslegen: für jede Sequenz mit Joker die Möglichkeiten sammeln
  function layDownWithJoker(v, melds) {
    const byId = new Map(v.hand.map((c) => [c.id, c]));
    const mcs = melds.map((ids) => ids.map((id) => byId.get(id)));
    const types = E.matchContract(mcs, v.roundInfo.slots);
    if (!types) return ui.ctl.act({ type: 'layDown', melds });
    const items = mcs.map((mc, i) => ({ t: types[i], opts: E.runChoices(mc, types[i]).map((o) => ({ value: o.pref, arr: o.arr })) }));
    if (!items.some((it) => it.opts.length > 1)) return ui.ctl.act({ type: 'layDown', melds });
    pickJoker(items, (vals) => ui.ctl.act({ type: 'layDown', melds, jpref: vals.map((x) => (typeof x === 'number' || x === 'wrap' ? x : null)) }));
  }
  // Anlegen: Joker an eine Sequenz – vorne oder hinten?
  function layOffWithJoker(v, meldId, ids, pos) {
    const m = v.melds.find((x) => x.id === meldId);
    const byId = new Map(v.hand.map((c) => [c.id, c]));
    const cards = ids.map((id) => byId.get(id)).filter(Boolean);
    const nj = cards.filter((c) => c.joker).length;
    if (!m || !nj || (m.t !== 'S' && m.t !== 'A')) return ui.ctl.act({ type: 'layOff', cardIds: ids, meldId, pos });
    const cand = cards.length === 1 ? [pos, pos === 'start' ? 'end' : 'start'] : Array.from({ length: nj + 1 }, (_, k) => k);
    const opts = [], seen = new Set();
    for (const c of cand) {
      const r = E.layOffResult(m, cards, c);
      if (!r || r.joker) continue;
      const key = r.arr.map((x) => x.rank).join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      opts.push({ value: c, arr: r.arr });
    }
    if (opts.length < 2) return ui.ctl.act({ type: 'layOff', cardIds: ids, meldId, pos });
    pickJoker([{ t: m.t, opts }], (vals) => ui.ctl.act({ type: 'layOff', cardIds: ids, meldId, pos: vals[0] }));
  }

  function layOff(meldId, pos) {
    const v = ui.view;
    if (!v) return;
    if (v.current === v.seat && v.phase === 'draw') return toast('Bitte erst eine Karte nehmen – vom Stapel oder von der Ablage.');
    if (v.current !== v.seat || v.phase !== 'play') return toast('Du bist noch nicht dran.');
    if (!v.players[v.seat].down) return toast('Erst die Vorgabe auslegen, dann anlegen.');
    if (v.ownLocked) return toast('Anlegen erst ab deinem nächsten Zug – bei dir und bei den Gegenspielern.');
    if (!ui.selected.length) return toast('Wähle zuerst Karten aus deiner Hand.');
    const ids = ui.selected.slice();
    ui.selected = [];
    layOffWithJoker(v, meldId, ids, pos);
  }

  function handle(a, el) {
    const v = ui.view;
    if (window.SkSound && a !== 'snd') window.SkSound.play('click');
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
        ui.ctl = new OnlineCtl({ t: 'create', name: ui.name, tips: ui.tips, jokerMust: false });
        return;
      case 'joinFixed': {
        if (!needName()) return;
        const f = (ui.fixedRooms || []).find((x) => x.code === el.dataset.code);
        if (!f) return;
        const mem = f.members.find((x) => x.toLowerCase() === ui.name.toLowerCase());
        if (!mem) return toast(`Der ${f.name} ist nur für ${f.members.join(', ')} – bitte oben deinen Namen genau so eingeben.`, 4000);
        ui.name = mem; store.set('name', mem);
        const sess = store.get('session', null);
        ui.room = null; go('lobby');
        ui.ctl = new OnlineCtl({ t: 'join', code: f.code, name: mem, token: sess && sess.code === f.code ? sess.token : undefined });
        return;
      }
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
      case 'roomTips': return ui.ctl.send({ t: 'tips', on: el.dataset.v === '1' });
      case 'moveJoker': {
        const v = ui.view, m = v && v.melds.find((x) => x.id === +el.dataset.mid);
        if (!m) return;
        const key = (arr) => arr.map((x) => x.rank).join(',');
        const cur = m.ranks.join(',');
        const opts = E.runChoices(m.cards, m.t).filter((o) => key(o.arr) !== cur).map((o) => ({ value: o.pref, arr: o.arr }));
        if (!opts.length) return toast('Der Joker kann hier nirgendwo anders stehen.');
        return pickJoker([{ t: m.t, opts, force: true }], (vals) => ui.ctl.act({ type: 'rearrange', meldId: m.id, pref: vals[0] }));
      }
      case 'roomJoker': return ui.ctl.send({ t: 'jokerMust', on: el.dataset.v === '1' });
      case 'jokerFree': case 'jokerMust': ui.jokerMust = a === 'jokerMust'; store.set('jokerMust', ui.jokerMust); return render();
      case 'snd': {
        const k = el.dataset.k;
        window.SkSound && window.SkSound.set(k, !window.SkSound.get(k));
        const box = el.closest('.sndbox');
        if (box) box.outerHTML = soundControls();
        return;
      }
      case 'langDe': case 'langKsh': case 'langEn': {
        ui.lang = a === 'langKsh' ? 'ksh' : a === 'langEn' ? 'en' : 'de'; store.set('lang', ui.lang);
        applyLang();
        if (ui.modalKind || document.querySelector('.modal')) closeModal();
        return render();
      }
      case 'modeTips': case 'modeTour':
        ui.tips = a === 'modeTips'; store.set('tips', ui.tips); return render();
      case 'tipApply': {
        const t = ui.tip;
        if (!t || !t.melds) return;
        ui.piles = t.melds.map((m) => m.slice()); ui.selected = []; ui.lastPile = 0;
        return render();
      }
      case 'leave': return leaveGame();
      case 'leaveAsk':
        if (ui.view && ui.view.phase === 'gameEnd') return leaveGame();
        return openModal(`<h2>Spiel verlassen?</h2><p>${ui.ctl && ui.ctl.mode === 'online' ? 'Ein Bot spielt für dich weiter. Mit demselben Namen kannst du später wieder einsteigen.' : 'Das laufende Spiel gegen die Bots wird beendet.'}</p>
          <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-close>Weiterspielen</button><button class="btn danger" data-a="leave">Ja, verlassen</button></div>`, onModalClick);
      case 'rules': return openModal(rulesHTML());
      case 'scores': return v && openModal(`<button class="btn small ghost close" data-close>Schließen</button><h2>Punkte</h2><p class="hint">Wenigste Punkte gewinnen.</p>${scoresHTML(v)}`);
      case 'menu':
        return openModal(`<button class="btn small ghost close" data-close>Schließen</button><h2>Menü</h2>
          <label class="toggle"><input type="checkbox" id="kp2" ${ui.knockPrompt ? 'checked' : ''}> Bei fremden Zügen fragen, ob ich klopfen will</label>
          <div style="margin-top:10px">${soundControls()}</div>
          <div class="row" style="margin-top:10px"><span>Sprache</span><div class="modesel" data-nok><button class="btn small ${ui.lang === 'de' ? 'on' : ''}" data-a="langDe">Deutsch</button><button class="btn small ${ui.lang === 'ksh' ? 'on' : ''}" data-a="langKsh">Kölsch</button><button class="btn small ${ui.lang === 'en' ? 'on' : ''}" data-a="langEn">English</button></div></div>
          <div class="row" style="margin-top:14px"><button class="btn small" data-a="rules">📜 Spielregeln</button></div>
          <h3>Verlauf</h3><ul class="loglist">${v.log.slice().reverse().map((l) => `<li>${esc(l.msg)}</li>`).join('')}</ul>
          <div class="divider"></div><button class="btn danger" data-a="leave">Spiel verlassen</button><p class="hint">Version ${VERSION}</p>`, (e) => {
          if (e.target.id === 'kp2') { ui.knockPrompt = e.target.checked; store.set('knockPrompt', ui.knockPrompt); }
          onModalClick(e);
        });
      case 'sortSuit': ui.sort = 'suit'; store.set('sort', 'suit'); return render();
      case 'sortRank': ui.sort = 'rank'; store.set('sort', 'rank'); return render();
      case 'sortAlt': ui.sort = ui.sort === 'alt' ? 'altd' : 'alt'; store.set('sort', ui.sort); return render();
      case 'fullscreen': toggleFullscreen(); return;
      case 'tipToggle': ui.tipSmall = !ui.tipSmall; store.set('tipSmall', ui.tipSmall); return render();
      case 'clearSel': ui.selected = []; return render();
      case 'drawStock': return ui.ctl.act({ type: 'drawStock' });
      case 'rejectKnock': return ui.ctl.act({ type: 'rejectKnock' });
      case 'takeDiscard': return ui.ctl.act({ type: 'takeDiscard' });
      case 'knock': return ui.ctl.act({ type: 'knock' });
      case 'pass': return ui.ctl.act({ type: 'pass' });
      case 'discardSel': {
        if (ui.selected.length !== 1) return toast('Wähle genau eine Karte zum Abwerfen.');
        const id = ui.selected[0];
        ui.selected = [];
        return ui.ctl.act({ type: 'discard', cardId: id });
      }
      case 'newPile': {
        const ids = ui.selected.slice();
        if (!ids.length) return toast('Karten antippen und dann „＋ Sammelstapel“ – oder Karten auf das ＋ ziehen.');
        movePileCards(ids, 'new');
        ui.lastPile = ui.piles.length - 1;
        ui.selected = [];
        return render();
      }
      case 'selPile': {
        const p = ui.piles[+el.dataset.i] || [];
        const all = p.every((id) => ui.selected.includes(id));
        ui.selected = all ? ui.selected.filter((id) => !p.includes(id)) : [...new Set(ui.selected.concat(p))];
        return render();
      }
      case 'dissolve': ui.piles.splice(+el.dataset.i, 1); return render();
      case 'lastPass': return ui.ctl.act({ type: 'lastPass' });
      case 'layDown': {
        const c = contractFromPiles(v) || contractFromSelection(v);
        if (!c) return toast(`Deine Sammelstapel erfüllen die Vorgabe noch nicht: ${v.roundInfo.slots.map(E.slotLabel).join(' + ')}`, 3200);
        ui.selected = [];
        return layDownWithJoker(v, c.melds);
      }
      case 'showResult': return showRoundEnd();
      case 'nextRound': if (!(ui.view && ui.view.multi)) closeModal(); return ui.ctl.act({ type: 'nextRound' });
      case 'again': closeModal(); return ui.ctl.again();
    }
  }

  function leaveGame() {
    if (ui.ctl && ui.view && ui.view.phase !== 'gameEnd' && ui.ctl.mode === 'local' && !confirmLeave()) return;
    closeModal();
    if (ui.ctl) ui.ctl.leave();
    if (ui.ctl && ui.ctl.mode === 'online') store.del('session');
    ui.ctl = null; ui.view = null; ui.room = null; ui.selected = []; ui.piles = [];
    go('home');
  }
  function confirmLeave() { return true; }

  window.__skalamala = ui; // für Tests
  window.__skToast = toast;
  // ---------- Start ----------
  applyLang();
  render();
  if (/^https?:$/.test(location.protocol)) {
    fetch('api/ping', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((j) => {
      if (j && j.ok) { ui.onlineAvailable = true; ui.fixedRooms = j.fixed || []; if (ui.screen === 'home') render(); }
    }).catch(() => {});
  }
})();
