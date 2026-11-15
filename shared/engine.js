/* Skalamala – Spiel-Engine (läuft im Browser und in Node.js) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Skalamala = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- Karten ----------
  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const SUIT_NAME = { S: 'Pik', H: 'Herz', D: 'Karo', C: 'Kreuz' };
  const RANK_LABEL = { 11: 'B', 12: 'D', 13: 'K', 14: 'A' };
  const isRed = (c) => c.suit === 'H' || c.suit === 'D';
  const rankLabel = (r) => RANK_LABEL[r] || String(r === 1 ? 'A' : r);
  const cardLabel = (c) => (c.joker ? 'Joker' : SUIT_SYM[c.suit] + rankLabel(c.rank));

  // Punkte: 2–9 = 5, 10–König = 10, Ass = 20, Joker = 50
  function cardPoints(c) {
    if (c.joker) return 50;
    if (c.rank === 14) return 20;
    if (c.rank >= 10) return 10;
    return 5;
  }
  const handPoints = (cards) => cards.reduce((s, c) => s + cardPoints(c), 0);

  function makeDeck() {
    // 2 Blätter à 55 Karten (52 + 3 Joker) = 110 Karten
    const deck = [];
    let id = 0;
    for (let d = 0; d < 2; d++) {
      for (const s of SUITS) for (let r = 2; r <= 14; r++) deck.push({ id: id++, suit: s, rank: r, joker: false });
      for (let j = 0; j < 3; j++) deck.push({ id: id++, suit: null, rank: 0, joker: true });
    }
    return deck;
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Runden ----------
  // exact: beim ersten Auslegen genau so viele Karten (ohne „mind.“)
  const G = (min, exact) => ({ t: 'G', min, exact: !!exact });
  const S = (min, exact) => ({ t: 'S', min, exact: !!exact });
  const ROUNDS = [
    { n: 1, title: '1 Gruppe + 1 Sequenz', detail: 'Gruppe (3 Karten) und Sequenz (4 Karten)', slots: [G(3, 1), S(4, 1)], knock: true, fromHand: false },
    { n: 2, title: '3 Gruppen', detail: '3 Gruppen à 3 Karten', slots: [G(3, 1), G(3, 1), G(3, 1)], knock: true, fromHand: false },
    { n: 3, title: '2 Sequenzen', detail: '2 Sequenzen, mind. 4 Karten', slots: [S(4), S(4)], knock: true, fromHand: false },
    { n: 4, title: '2 Gruppen à 5', detail: '2 Gruppen à 5 Karten', slots: [G(5, 1), G(5, 1)], knock: true, fromHand: false },
    { n: 5, title: 'Skalamala', detail: '10er-Sequenz abwechselnd rot – schwarz', slots: [{ t: 'A', min: 10, exact: true }], knock: true, fromHand: false },
    { n: 6, title: '5 Gruppen à 2', detail: '5 Paare – OHNE KLOPFEN!', slots: [G(2, 1), G(2, 1), G(2, 1), G(2, 1), G(2, 1)], knock: false, fromHand: false },
    { n: 7, title: '2 Gruppen + 1 Sequenz', detail: 'aus der Hand ausmachen', slots: [G(3), G(3), S(4)], knock: true, fromHand: true },
    { n: 8, title: '1 Gruppe + 2 Sequenzen', detail: 'aus der Hand ausmachen – Finale!', slots: [G(3), S(4), S(4)], knock: true, fromHand: true },
  ];
  const TYPE_NAME = { G: 'Gruppe', S: 'Sequenz', A: 'Skalamala' };
  const slotLabel = (sl) => `${TYPE_NAME[sl.t]} (${sl.exact ? '' : 'mind. '}${sl.min})`;
  const fitsSlot = (cards, sl) => (!sl.exact || cards.length === sl.min) && !!validMeld(cards, sl.t, sl.min);

  // ---------- Kombinationen prüfen ----------
  // Ordnet eine Sequenz. alt=true: Farben abwechselnd rot/schwarz, beliebige Farben (Pik/Herz…)
  function arrangeRun(cards, alt) {
    const jokers = cards.filter((c) => c.joker);
    const nat = cards.filter((c) => !c.joker);
    // Joker sind beliebig einsetzbar – auch eine Sequenz nur aus Jokern ist erlaubt
    if (!nat.length) return cards.length <= 14 ? cards.map((c) => ({ card: c, rank: 0 })) : null;
    if (!alt && nat.some((c) => c.suit !== nat[0].suit)) return null;
    const aces = nat.filter((c) => c.rank === 14);
    if (aces.length > 2) return null;
    const combos = 1 << aces.length;
    for (let m = combos - 1; m >= 0; m--) {
      // Bit gesetzt = Ass hoch (14), sonst niedrig (1)
      const pos = new Map();
      let ok = true;
      for (const c of nat) {
        let p = c.rank;
        if (c.rank === 14) {
          const k = aces.indexOf(c);
          p = m & (1 << k) ? 14 : 1;
        }
        if (pos.has(p)) { ok = false; break; }
        pos.set(p, c);
      }
      if (!ok) continue;
      const ps = [...pos.keys()].sort((a, b) => a - b);
      if (alt) {
        const key = (p) => ((isRed(pos.get(p)) ? 1 : 0) + p) % 2;
        const k0 = key(ps[0]);
        if (ps.some((p) => key(p) !== k0)) continue;
      }
      let lo = ps[0], hi = ps[ps.length - 1];
      const gaps = hi - lo + 1 - ps.length;
      if (gaps > jokers.length) continue;
      let extra = jokers.length - gaps;
      while (extra > 0 && hi < 14) { hi++; extra--; }
      while (extra > 0 && lo > 1) { lo--; extra--; }
      if (extra > 0) continue;
      const out = [];
      let ji = 0;
      for (let p = lo; p <= hi; p++) {
        if (pos.has(p)) out.push({ card: pos.get(p), rank: p });
        else out.push({ card: jokers[ji++], rank: p });
      }
      return out;
    }
    return arrangeRunWrap(cards, alt);
  }

  // Sequenz „rundherum“: König darf vor das Ass, z. B. D-K-A-2-3 (höchstens 13 Karten)
  function arrangeRunWrap(cards, alt) {
    const jokers = cards.filter((c) => c.joker);
    const nat = cards.filter((c) => !c.joker);
    if (!nat.length || cards.length > 13) return null;
    if (!alt && nat.some((c) => c.suit !== nat[0].suit)) return null;
    const r13 = (c) => (c.rank === 14 ? 1 : c.rank); // Ass = 1 … König = 13
    for (let st = 1; st <= 13; st++) {
      const pos = new Map();
      let ok = true;
      for (const c of nat) {
        const p = ((r13(c) - st + 13) % 13) + st; // st … st+12
        if (pos.has(p)) { ok = false; break; }
        pos.set(p, c);
      }
      if (!ok) continue;
      const ps = [...pos.keys()].sort((a, b) => a - b);
      if (alt) {
        const key = (p) => ((isRed(pos.get(p)) ? 1 : 0) + p) % 2;
        if (ps.some((p) => key(p) !== key(ps[0]))) continue;
      }
      let lo = ps[0], hi = ps[ps.length - 1];
      if (hi - lo + 1 > 13) continue;
      const gaps = hi - lo + 1 - ps.length;
      if (gaps > jokers.length) continue;
      let extra = jokers.length - gaps;
      while (extra > 0 && hi - lo + 1 < 13) { hi++; extra--; }
      if (extra > 0) continue;
      // nur „echte“ Rundherum-Folgen hier (lineare wurden oben schon geprüft)
      const out = [];
      let ji = 0;
      for (let p = lo; p <= hi; p++) {
        const n = ((p - 1) % 13) + 1;
        const rank = n === 1 ? 14 : n;
        if (pos.has(p)) out.push({ card: pos.get(p), rank });
        else out.push({ card: jokers[ji++], rank });
      }
      return out;
    }
    return null;
  }

  function validMeld(cards, t, min) {
    min = min || 0;
    if (cards.length < Math.max(min, 1)) return null;
    if (t === 'G') {
      const nat = cards.filter((c) => !c.joker);
      if (nat.some((c) => c.rank !== nat[0].rank)) return null;
      const r = nat.length ? nat[0].rank : 0; // nur Joker: Wert noch offen
      return nat.concat(cards.filter((c) => c.joker)).map((c) => ({ card: c, rank: r }));
    }
    if (t === 'S' || t === 'A') return arrangeRun(cards, t === 'A');
    return null;
  }

  // Ordnet Kombinationen den Vorgaben der Runde zu (Reihenfolge egal)
  function matchContract(meldCards, slots) {
    if (meldCards.length !== slots.length) return null;
    const used = new Array(slots.length).fill(false);
    const res = new Array(meldCards.length);
    function bt(i) {
      if (i === meldCards.length) return true;
      for (let k = 0; k < slots.length; k++) {
        if (used[k]) continue;
        if (fitsSlot(meldCards[i], slots[k])) {
          used[k] = true; res[i] = slots[k].t;
          if (bt(i + 1)) return true;
          used[k] = false;
        }
      }
      return false;
    }
    return bt(0) ? res : null;
  }

  // ---------- Spielzustand ----------
  function newGame(players, opts) {
    const s = {
      players: players.map((p) => ({ name: p.name, bot: !!p.bot, hand: [], down: false, scores: [], total: 0 })),
      round: -1,
      dealer: Math.floor(Math.random() * players.length),
      phase: 'init',
      current: 0,
      stock: [], discard: [], discardBy: null,
      melds: [], meldSeq: 0,
      knock: null,
      log: [], seq: 0,
      lastRound: null,
      opts: Object.assign({ knockMs: 7000 }, opts || {}),
    };
    startRound(s);
    return s;
  }

  function log(s, msg) {
    s.log.push({ t: Date.now(), msg });
    if (s.log.length > 80) s.log.splice(0, s.log.length - 80);
  }

  function startRound(s) {
    s.round++;
    if (s.round > 0) s.dealer = (s.dealer + 1) % s.players.length;
    const deck = shuffle(makeDeck());
    s.players.forEach((p) => { p.hand = []; p.down = false; p.downTurn = -1; });
    const n = s.players.length;
    for (let k = 0; k < 11; k++) for (let i = 1; i <= n; i++) s.players[(s.dealer + i) % n].hand.push(deck.pop());
    s.stock = deck;
    s.discard = [s.stock.pop()];
    s.discardBy = null;
    s.reshuffles = 0;
    s.turn = 0;
    s.taken = {};
    s.melds = [];
    s.current = (s.dealer + 1) % n;
    s.phase = 'draw';
    s.knock = { responses: {}, deadline: 0, order: [] };
    s.lastRound = null;
    log(s, `Runde ${s.round + 1}: ${ROUNDS[s.round].title} – ${s.players[s.dealer].name} gibt, ${s.players[s.current].name} beginnt.`);
    s.seq++;
  }

  function drawFromStock(s) {
    if (!s.stock.length) {
      // Der Stapel wird höchstens einmal pro Runde neu gemischt
      if (s.discard.length <= 1 || s.reshuffles >= 1) return null;
      s.reshuffles++;
      const top = s.discard.pop();
      s.stock = shuffle(s.discard);
      s.discard = [top];
      log(s, 'Der Stapel ist leer – die Ablage wird neu gemischt (letztes Mal in dieser Runde).');
    }
    return s.stock.pop() || null;
  }
  const available = (s) => s.stock.length + (s.reshuffles ? 0 : Math.max(0, s.discard.length - 1));

  // Darf seat jetzt klopfen?
  function canKnock(s, seat) {
    if (seat == null || seat === s.current) return false;
    if (s.phase !== 'draw' && s.phase !== 'knock') return false;
    if (!ROUNDS[s.round].knock) return false;
    const p = s.players[seat];
    if (!p || p.down) return false;
    if (!s.discard.length || seat === s.discardBy) return false;
    if (available(s) < 2) return false;
    return true;
  }
  const knockEligible = (s) => s.players.map((_, i) => i).filter((i) => canKnock(s, i));
  function knockOrder(s) {
    const n = s.players.length, out = [];
    for (let k = 1; k < n; k++) out.push((s.current + k) % n);
    return out;
  }
  function knockPending(s) {
    return knockEligible(s).filter((i) => s.knock.responses[i] === undefined);
  }
  // Wer zuerst klopft, bekommt die Karte (der Spieler am Zug hat aber immer Vorrang).
  // Entschieden ist es, sobald jemand geklopft hat oder alle gepasst haben.
  function firstKnocker(s) {
    const elig = new Set(knockEligible(s));
    return (s.knock.order || []).find((i) => elig.has(i));
  }
  function knockDecided(s) {
    if (firstKnocker(s) !== undefined) return true;
    return knockPending(s).length === 0;
  }

  function resolveKnock(s) {
    const winner = firstKnocker(s);
    if (winner !== undefined) {
      const p = s.players[winner];
      const c = s.discard.pop();
      p.hand.push(c);
      const pen = drawFromStock(s);
      if (pen) p.hand.push(pen);
      log(s, `👊 ${p.name} klopft und nimmt ${cardLabel(c)} + 1 verdeckte Karte.`);
    }
    const c = drawFromStock(s);
    s.knock = { responses: {}, deadline: 0, order: [] };
    if (!c) return endRound(s, null);
    s.players[s.current].hand.push(c);
    s.phase = 'play';
    s.lastDrawn = c.id;
    log(s, `${s.players[s.current].name} zieht vom Stapel.`);
  }

  function endRound(s, winner) {
    const pts = s.players.map((p, i) => (i === winner ? 0 : handPoints(p.hand)));
    s.players.forEach((p, i) => { p.scores.push(pts[i]); p.total += pts[i]; });
    s.lastRound = {
      round: s.round, winner,
      points: pts,
      hands: s.players.map((p) => p.hand.slice()),
    };
    if (winner != null) log(s, `🎉 ${s.players[winner].name} macht aus!`);
    else log(s, 'Der Stapel ist aufgebraucht – Runde beendet, alle zählen ihre Handkarten.');
    s.phase = s.round >= ROUNDS.length - 1 ? 'gameEnd' : 'roundEnd';
  }

  function nextTurn(s) {
    s.current = (s.current + 1) % s.players.length;
    s.turn = (s.turn || 0) + 1;
    s.phase = 'draw';
    s.knock = { responses: {}, deadline: 0, order: [] };
    s.lastDrawn = null;
    s.lastTaken = null;
  }

  function takeFromHand(p, ids) {
    const cards = [];
    for (const id of ids) {
      const c = p.hand.find((h) => h.id === id);
      if (!c || cards.includes(c)) return null;
      cards.push(c);
    }
    return cards;
  }
  const removeFromHand = (p, cards) => { p.hand = p.hand.filter((c) => !cards.includes(c)); };

  // ---------- Aktionen ----------
  // gibt null (ok) oder eine Fehlermeldung zurück
  function act(s, seat, a) {
    const r = _act(s, seat, a);
    if (!r) s.seq++;
    return r;
  }
  function _act(s, seat, a) {
    if (!a || !a.type) return 'Ungültige Aktion';
    const R = ROUNDS[s.round];
    const p = seat != null ? s.players[seat] : null;

    if (a.type === 'nextRound') {
      if (s.phase !== 'roundEnd') return 'Runde läuft noch';
      startRound(s);
      return null;
    }
    if (a.type === 'knockTimeout') {
      if (s.phase !== 'knock') return 'Kein Klopfen offen';
      for (const i of knockPending(s)) s.knock.responses[i] = 'pass';
      resolveKnock(s);
      return null;
    }
    if (a.type === 'knock' || a.type === 'pass') {
      if (seat == null || !p) return 'Ungültiger Spieler';
      if (a.type === 'knock' && !canKnock(s, seat)) return 'Klopfen ist gerade nicht möglich';
      if (a.type === 'pass' && (s.phase !== 'draw' && s.phase !== 'knock')) return 'Nichts zu passen';
      if (s.knock.responses[seat] !== undefined) return 'Du hast schon entschieden';
      s.knock.responses[seat] = a.type;
      if (a.type === 'knock') {
        s.knock.order = s.knock.order || [];
        s.knock.order.push(seat);
        log(s, s.knock.order.length === 1 ? `👊 ${p.name} klopft als Erste(r)!` : `👊 ${p.name} klopft – zu spät.`);
      }
      if (s.phase === 'knock' && knockDecided(s)) resolveKnock(s);
      return null;
    }

    if (seat !== s.current) return 'Du bist nicht dran';

    if (s.phase === 'draw') {
      if (a.type === 'takeDiscard') {
        if (!s.discard.length) return 'Die Ablage ist leer';
        const c = s.discard.pop();
        p.hand.push(c);
        s.lastDrawn = c.id;
        s.lastTaken = c.id;
        s.taken[c.id] = (s.taken[c.id] || 0) + 1;
        s.knock = { responses: {}, deadline: 0, order: [] };
        s.phase = 'play';
        log(s, `${p.name} nimmt ${cardLabel(c)} von der Ablage.`);
        return null;
      }
      if (a.type === 'drawStock') {
        if (R.knock && knockEligible(s).length) {
          s.phase = 'knock';
          s.knock.deadline = Date.now() + s.opts.knockMs;
          if (knockDecided(s)) resolveKnock(s);
          return null;
        }
        const c = drawFromStock(s);
        if (!c) { endRound(s, null); return null; }
        p.hand.push(c);
        s.lastDrawn = c.id;
        s.phase = 'play';
        log(s, `${p.name} zieht vom Stapel.`);
        return null;
      }
      return 'Zuerst eine Karte ziehen';
    }

    if (s.phase !== 'play') return 'Gerade nicht möglich';

    if (a.type === 'layDown') {
      if (p.down) return 'Du hast schon ausgelegt';
      if (!Array.isArray(a.melds)) return 'Ungültig';
      if (a.melds.length !== R.slots.length) return `In dieser Runde werden genau ${R.slots.length} Kombination${R.slots.length === 1 ? '' : 'en'} ausgelegt: ${R.slots.map(slotLabel).join(' + ')}. Weitere Karten danach anlegen.`;
      const all = [].concat(...a.melds);
      const cards = takeFromHand(p, all);
      if (!cards) return 'Karten nicht auf der Hand';
      const meldCards = a.melds.map((ids) => ids.map((id) => cards.find((c) => c.id === id)));
      const types = matchContract(meldCards, R.slots);
      if (!types) return `Beim Auslegen genau die Vorgabe: ${R.slots.map(slotLabel).join(' + ')}. Weitere Karten danach anlegen – bei Gegenspielern sofort, bei dir erst im nächsten Zug.`;
      const left = p.hand.length - cards.length;
      if (R.fromHand && left > 1) return 'In dieser Runde muss komplett aus der Hand ausgemacht werden (höchstens 1 Karte zum Abwerfen übrig).';
      removeFromHand(p, cards);
      meldCards.forEach((mc, i) => {
        const arr = validMeld(mc, types[i]);
        s.melds.push({ id: ++s.meldSeq, owner: seat, t: types[i], cards: arr.map((x) => x.card), ranks: arr.map((x) => x.rank) });
      });
      p.down = true;
      p.downTurn = s.turn;
      log(s, `${p.name} legt aus: ${types.map((t) => TYPE_NAME[t]).join(', ')}.`);
      if (R.fromHand) {
        if (p.hand.length === 1) {
          const c = p.hand.pop();
          s.discard.push(c); s.discardBy = seat;
          log(s, `${p.name} wirft ${cardLabel(c)} ab.`);
        }
        endRound(s, seat);
        return null;
      }
      if (!p.hand.length) endRound(s, seat);
      return null;
    }

    if (a.type === 'layOff') {
      if (!p.down) return 'Erst die Vorgabe auslegen, dann anlegen';
      const m = s.melds.find((x) => x.id === a.meldId);
      if (!m) return 'Kombination nicht gefunden';
      if (m.owner === seat && p.downTurn === s.turn) return 'An deine eigenen Kombinationen darfst du erst ab deinem nächsten Zug anlegen – an die der Gegenspieler sofort.';
      const ids = a.cardIds || (a.cardId != null ? [a.cardId] : []);
      const cards = takeFromHand(p, ids);
      if (!cards || !cards.length) return 'Karten nicht auf der Hand';
      const arr = validMeld(m.cards.concat(cards), m.t);
      if (!arr) return 'Passt nicht an diese Kombination';
      removeFromHand(p, cards);
      m.cards = arr.map((x) => x.card);
      m.ranks = arr.map((x) => x.rank);
      log(s, `${p.name} legt ${cards.map(cardLabel).join(' ')} an.`);
      if (!p.hand.length) endRound(s, seat);
      return null;
    }

    if (a.type === 'discard') {
      const c = p.hand.find((h) => h.id === a.cardId);
      if (!c) return 'Karte nicht auf der Hand';
      removeFromHand(p, [c]);
      s.discard.push(c);
      s.discardBy = seat;
      log(s, `${p.name} wirft ${cardLabel(c)} ab.`);
      if (!p.hand.length) { endRound(s, seat); return null; }
      nextTurn(s);
      return null;
    }
    return 'Unbekannte Aktion';
  }

  // Sicht eines Spielers (versteckt fremde Karten)
  function view(s, seat) {
    const reveal = s.phase === 'roundEnd' || s.phase === 'gameEnd';
    return {
      seat,
      round: s.round,
      roundInfo: ROUNDS[s.round],
      phase: s.phase,
      current: s.current,
      dealer: s.dealer,
      players: s.players.map((p) => ({ name: p.name, bot: p.bot, down: p.down, handCount: p.hand.length, total: p.total, scores: p.scores.slice() })),
      hand: seat != null && s.players[seat] ? s.players[seat].hand.slice() : [],
      melds: s.melds.map((m) => ({ id: m.id, owner: m.owner, t: m.t, cards: m.cards.slice(), ranks: m.ranks.slice() })),
      discardTop: s.discard.length ? s.discard[s.discard.length - 1] : null,
      discardCount: s.discard.length,
      discardBy: s.discardBy,
      stockCount: s.stock.length,
      reshuffles: s.reshuffles,
      lastDrawn: seat === s.current ? s.lastDrawn : null,
      ownLocked: seat != null && s.players[seat] ? (s.players[seat].down && s.players[seat].downTurn === s.turn) : false,
      knock: {
        responses: Object.assign({}, s.knock.responses),
        first: firstKnocker(s),
        deadline: s.knock.deadline,
        canKnock: canKnock(s, seat),
        pending: s.phase === 'knock' ? knockPending(s) : [],
      },
      log: s.log.slice(-25),
      // Am Rundenende nur Punkte zeigen – fremde Karten bleiben verdeckt, nur die eigenen Restkarten sind sichtbar
      lastRound: reveal && s.lastRound ? {
        round: s.lastRound.round, winner: s.lastRound.winner, points: s.lastRound.points.slice(),
        hands: s.lastRound.hands.map((h, i) => (i === seat ? h.slice() : [])),
        counts: s.lastRound.hands.map((h) => h.length),
      } : null,
      seq: s.seq,
    };
  }

  // ---------- Bot ----------
  function dist(a, b) {
    // Abstand zweier Ränge, Ass zählt als 1 oder 14
    const ra = a === 14 ? [1, 14] : [a], rb = b === 14 ? [1, 14] : [b];
    let d = 99;
    for (const x of ra) for (const y of rb) d = Math.min(d, Math.abs(x - y));
    return d;
  }
  function usefulness(c, others, R) {
    if (c.joker) return 100;
    const types = new Set(R.slots.map((x) => x.t));
    let u = 0;
    if (types.has('G')) {
      const same = others.filter((o) => !o.joker && o.rank === c.rank).length;
      const pairs = R.slots.every((x) => x.min === 2);
      if (same) u += pairs ? 7 : same === 1 ? 3.5 : 5 + same;
    }
    if (types.has('S')) {
      const seen = new Set();
      for (const o of others) {
        if (o.joker || o.suit !== c.suit || seen.has(o.rank)) continue;
        const d = dist(c.rank, o.rank);
        if (d >= 1 && d <= 3) { u += 4 - d; seen.add(o.rank); }
      }
    }
    if (types.has('A')) {
      const seen = new Set();
      for (const o of others) {
        if (o.joker || seen.has(o.rank)) continue;
        const d = dist(c.rank, o.rank);
        if (d >= 1 && d <= 4 && (isRed(c) !== isRed(o)) === (d % 2 === 1)) { u += (5 - d) * 0.8; seen.add(o.rank); }
      }
    }
    return u;
  }

  function candidates(cards, slot) {
    const jokers = cards.filter((c) => c.joker);
    const nat = cards.filter((c) => !c.joker);
    const out = [];
    if (slot.t === 'G') {
      const by = {};
      for (const c of nat) (by[c.rank] = by[c.rank] || []).push(c);
      for (const r in by) {
        const arr = by[r];
        const t = Math.min(arr.length, slot.min);
        const need = slot.min - t;
        if (need <= jokers.length) out.push({ cards: arr.slice(0, t).concat(jokers.slice(0, need)), cost: need, val: +r });
      }
    } else {
      const span = slot.min;
      const variants = slot.t === 'S' ? SUITS.map((su) => ({ su })) : [{ par: 0 }, { par: 1 }];
      for (const v of variants) {
        for (let lo = 1; lo + span - 1 <= 14; lo++) {
          const chosen = [];
          let missing = 0;
          for (let p = lo; p < lo + span; p++) {
            const rk = p === 1 ? 14 : p;
            const c = nat.find((x) => x.rank === rk && !chosen.includes(x) &&
              (slot.t === 'S' ? x.suit === v.su : (isRed(x) ? 1 : 0) === (p + v.par) % 2));
            if (c) chosen.push(c); else missing++;
          }
          if (missing <= jokers.length && chosen.length) out.push({ cards: chosen.concat(jokers.slice(0, missing)), cost: missing, val: lo });
        }
      }
    }
    out.sort((a, b) => a.cost - b.cost || b.val - a.val);
    return out.slice(0, 30);
  }

  // Sucht eine Auslage für die Vorgabe. extend=true: Restkarten werden noch angelegt.
  function findContract(hand, R, extend, maxNodes) {
    maxNodes = maxNodes || 4000;
    const order = R.slots.map((sl, i) => ({ sl, i })).sort((a, b) => {
      const w = (x) => (x.sl.t === 'A' ? 0 : x.sl.t === 'S' ? 1 : 2);
      return w(a) - w(b) || b.sl.min - a.sl.min;
    });
    let best = null, nodes = 0;
    function finish(acc, rem) {
      let melds = acc.map((m) => ({ t: m.t, cards: m.cards.slice() }));
      let left = rem.slice();
      if (extend) {
        let changed = true;
        while (changed) {
          changed = false;
          for (const c of left.slice()) {
            for (const m of melds) {
              if (validMeld(m.cards.concat([c]), m.t)) { m.cards.push(c); left = left.filter((x) => x !== c); changed = true; break; }
            }
          }
        }
      }
      const score = left.length * 1000 + handPoints(left);
      if (!best || score < best.score) best = { score, melds, left };
    }
    function bt(k, rem, acc) {
      if (++nodes > maxNodes) return;
      if (best && !extend) return;
      if (best && best.left.length === 0) return;
      if (k === order.length) return finish(acc, rem);
      const sl = order[k].sl;
      for (const cand of candidates(rem, sl)) {
        bt(k + 1, rem.filter((c) => !cand.cards.includes(c)), acc.concat([{ t: sl.t, cards: cand.cards }]));
        if (nodes > maxNodes) return;
      }
    }
    bt(0, hand.slice(), []);
    return best;
  }

  // Wie weit ist die Hand von der Vorgabe entfernt? (kleiner = besser)
  const VJ = [0, 1, 2, 3].map((k) => ({ id: -100 - k, suit: null, rank: 0, joker: true, virtual: true }));
  function progress(hand, R) {
    for (let k = 0; k <= 3; k++) {
      const f = findContract(hand.concat(VJ.slice(0, k)), R, true, 1200);
      if (f) {
        const left = f.left.filter((c) => !c.virtual);
        return k * 20 + left.length * 3 + handPoints(left) / 60;
      }
    }
    return 80 - Math.min(10, hand.reduce((t, c) => t + usefulness(c, hand.filter((x) => x !== c), R), 0) / 10);
  }
  function bestDiscard(hand, R, lastDrawn, avoid) {
    let best = null, bestScore = Infinity;
    for (const c of hand) {
      if (c.id === avoid && hand.length > 1) continue;
      if (c.joker && hand.some((x) => !x.joker)) continue;
      const sc = progress(hand.filter((x) => x !== c), R) - cardPoints(c) / 200 + (c.id === lastDrawn ? 0.01 : 0);
      if (sc < bestScore) { bestScore = sc; best = c; }
    }
    return { card: best || hand[0], score: bestScore };
  }

  function canLayOffAny(s, c, seat) {
    const p = seat != null ? s.players[seat] : null;
    const locked = p && p.downTurn === s.turn;
    return s.melds.find((m) => !(locked && m.owner === seat) && validMeld(m.cards.concat([c]), m.t));
  }

  function botAction(s, seat) {
    const R = ROUNDS[s.round];
    const p = s.players[seat];
    if (s.phase === 'knock') {
      if (!knockPending(s).includes(seat)) return null;
      const c = s.discard[s.discard.length - 1];
      let want = false;
      // In "aus der Hand"-Runden macht jede Strafkarte das Ausmachen schwerer
      const maxHand = R.fromHand ? 11 : 13;
      if (c && !p.down && p.hand.length <= maxHand) {
        if (c.joker) want = true;
        else if (R.fromHand) {
          const f = findContract(p.hand.concat([c]), R, true);
          want = !!(f && f.left.length <= 2);
        } else {
          const u = usefulness(c, p.hand, R);
          if (u >= 6) want = true;
        }
      }
      return { type: want ? 'knock' : 'pass' };
    }
    if (seat !== s.current) return null;
    if (s.phase === 'draw') {
      const c = s.discard[s.discard.length - 1];
      if (!c) return { type: 'drawStock' };
      if ((s.taken[c.id] || 0) >= 2) return { type: 'drawStock' };
      if (c.joker) return { type: 'takeDiscard' };
      if (p.down) return canLayOffAny(s, c, seat) ? { type: 'takeDiscard' } : { type: 'drawStock' };
      const before = findContract(p.hand, R, R.fromHand);
      const okBefore = before && (!R.fromHand || before.left.length <= 1);
      if (!okBefore) {
        const after = findContract(p.hand.concat([c]), R, R.fromHand);
        if (after && (!R.fromHand || after.left.length <= 1)) return { type: 'takeDiscard' };
      }
      if (R.fromHand || R.slots[0].t === 'A') {
        const now = progress(p.hand, R);
        const withC = bestDiscard(p.hand.concat([c]), R).score;
        return withC < now - 0.5 ? { type: 'takeDiscard' } : { type: 'drawStock' };
      }
      const uNew = usefulness(c, p.hand, R);
      const minU = Math.min(...p.hand.map((h) => usefulness(h, p.hand.filter((x) => x !== h), R)));
      if (uNew >= 3 && uNew > minU + 1) return { type: 'takeDiscard' };
      return { type: 'drawStock' };
    }
    if (s.phase === 'play') {
      if (!p.down) {
        const f = findContract(p.hand, R, R.fromHand);
        if (f && (!R.fromHand || f.left.length <= 1)) return { type: 'layDown', melds: f.melds.map((m) => m.cards.map((c) => c.id)) };
      } else {
        for (const c of p.hand) {
          const m = canLayOffAny(s, c, seat);
          if (m) return { type: 'layOff', cardIds: [c.id], meldId: m.id };
        }
      }
      // Abwerfen
      if (!p.down && (R.fromHand || R.slots[0].t === 'A')) return { type: 'discard', cardId: bestDiscard(p.hand, R, s.lastDrawn, s.lastTaken).card.id };
      let best = null, bestKey = Infinity;
      for (const c of p.hand) {
        if (c.joker && p.hand.some((x) => !x.joker)) continue;
        if (c.id === s.lastTaken && p.hand.length > 1) continue;
        const key = p.down ? -cardPoints(c) : usefulness(c, p.hand.filter((x) => x !== c), R) - cardPoints(c) / 25 + (c.id === s.lastDrawn ? 0.5 : 0);
        if (key < bestKey) { bestKey = key; best = c; }
      }
      return { type: 'discard', cardId: (best || p.hand[0]).id };
    }
    return null;
  }

  // ---------- Spielleitung mit Timern (Browser & Server) ----------
  class GameHost {
    constructor(players, opts) {
      this.opts = Object.assign({ botDelay: 900, knockMs: 7000, onChange: () => {}, isAuto: null }, opts || {});
      this.s = newGame(players, { knockMs: this.opts.knockMs });
      this.timers = [];
      this._tick();
    }
    isAuto(seat) { return this.opts.isAuto ? this.opts.isAuto(seat, this.s) : this.s.players[seat].bot; }
    view(seat) { return view(this.s, seat); }
    act(seat, a) {
      const err = act(this.s, seat, a);
      if (!err) { this.opts.onChange(); this._tick(); }
      return err;
    }
    _clear() { this.timers.forEach(clearTimeout); this.timers = []; }
    _later(ms, fn) { this.timers.push(setTimeout(fn, ms)); }
    refresh() { this._tick(); }
    destroy() { this._clear(); this.dead = true; }
    _tick() {
      this._clear();
      if (this.dead) return;
      const s = this.s, seq = s.seq;
      if (s.phase === 'knock') {
        const pend = knockPending(s);
        const autos = pend.filter((i) => this.isAuto(i));
        const left = Math.max(200, s.knock.deadline - Date.now() - 400);
        for (const i of autos) {
          // Bots überlegen kurz – so haben Menschen eine faire Chance, zuerst zu klopfen
          const a = botAction(s, i) || { type: 'pass' };
          const d = a.type === 'knock' ? 900 + Math.random() * 1800 : 300 + Math.random() * 600;
          this._later(Math.min(d, left), () => {
            if (s.phase !== 'knock' || s.knock.responses[i] !== undefined) return;
            if (!act(s, i, a)) { this.opts.onChange(); this._tick(); }
          });
        }
        const ms = Math.max(0, s.knock.deadline - Date.now());
        this._later(ms + 50, () => { if (s.seq === seq && s.phase === 'knock') this.act(null, { type: 'knockTimeout' }); });
        return;
      }
      if ((s.phase === 'draw' || s.phase === 'play') && this.isAuto(s.current)) {
        const delay = s.phase === 'draw' ? this.opts.botDelay * 1.2 : this.opts.botDelay;
        this._later(delay, () => {
          if (s.seq !== seq) return;
          const cur = s.current;
          let a = botAction(s, cur);
          let err = a ? act(s, cur, a) : 'none';
          if (err) {
            // Sicherheitsnetz: niemals hängen bleiben
            if (s.phase === 'draw') err = act(s, cur, { type: 'drawStock' });
            else if (s.phase === 'play') err = act(s, cur, { type: 'discard', cardId: s.players[cur].hand[0].id });
          }
          this.opts.onChange(); this._tick();
        });
      }
    }
  }

  return {
    SUITS, SUIT_SYM, SUIT_NAME, ROUNDS, TYPE_NAME, isRed, rankLabel, cardLabel, cardPoints, handPoints,
    validMeld, matchContract, slotLabel, fitsSlot, newGame, act, view, botAction, findContract, GameHost, canKnock,
  };
});
