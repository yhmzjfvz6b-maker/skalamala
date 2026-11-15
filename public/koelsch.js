/* Skalamala – Modus „op Kölsch“: übersetzt alle angezeigten Texte (auch Server-Meldungen) ins Kölsche. */
(function () {
  'use strict';

  // Ganze Sätze und Wendungen zuerst (Reihenfolge zählt)
  const PHRASES = [
    [/Los geht's/g, 'Loss jon!'],
    [/Bitte zuerst deinen Namen eingeben\./g, 'Bes esu jot un jif zoeets dinge Name en.'],
    [/Bitte erst eine Karte nehmen – vom Stapel oder von der Ablage\./g, 'Eets ens en Kaat nemme – vum Stapel oder vun dr Ablach.'],
    [/Du bist noch nicht dran\./g, 'Do bes noch nit dran.'],
    [/Du bist dran – zieh eine Karte \(Stapel oder Ablage\)/g, 'Do bes dran – treck en Kaat (Stapel oder Ablach)'],
    [/Dein Name/g, 'Dinge Name'],
    [/Raum erstellen/g, 'Raum opmaache'],
    [/Beitreten/g, 'Metmaache'],
    [/Spielregeln/g, 'Spillrejele'],
    [/8 Runden · wer am wenigsten Punkte hat, gewinnt!/g, '8 Runde · wä de winnichste Punkte hät, jewinnt!'],
    [/Wenigste Punkte gewinnen\./g, 'Wä de winnichste Punkte hät, jewinnt.'],
    [/die wenigsten Punkte/g, 'de winnichste Punkte'],
    [/Auslage: noch hat niemand ausgelegt\./g, 'Uslaach: noch hät keiner jet usjelaat.'],
    [/Deine Auslage/g, 'Ding Uslaach'],
    [/macht aus!/g, 'määt Schluss!'],
    [/macht aus\./g, 'määt Schluss.'],
    [/(\S+) wirft (\S+) ab\./g, '$1 schmieß $2 fott.'],
    [/Wirf (\S+) ab/g, 'Schmieß $1 fott'],
    [/wirf (\S+) ab/g, 'schmieß $1 fott'],
    [/nimmt (\S+) von der Ablage/g, 'nimmp $1 vun dr Ablach'],
    [/Nimm (\S+) von der Ablage/g, 'Nimm $1 vun dr Ablach'],
    [/zieht vom Stapel/g, 'treck vum Stapel'],
    [/Zieh vom Stapel/g, 'Treck vum Stapel'],
    [/Vom Stapel/g, 'Vum Stapel'],
    [/Ablage nehmen/g, 'Vun dr Ablach'],
    [/von der Ablage/g, 'vun dr Ablach'],
    [/klopft als Erste\(r\)!/g, 'kloppt als Eetste!'],
    [/klopft – zu spät\./g, 'kloppt – ze späd.'],
    [/lehnt das Klopfen ab\./g, 'säht Nä zom Kloppe.'],
    [/Runde beendet/g, 'Rund vörbei'],
    [/Spiel beendet/g, 'Spill vörbei'],
    [/Weiterspielen/g, 'Wiggerspille'],
    [/Ja, verlassen/g, 'Jo, ich jonn'],
    [/Spiel verlassen/g, 'Spill verlosse'],
    [/Raum verlassen/g, 'Raum verlosse'],
    [/Tisch ansehen/g, 'Desch aanluure'],
    [/Neues Spiel/g, 'Neu Spill'],
    [/Gesucht:/g, 'Jesöök:'],
    [/Übernehmen/g, 'Övvernemme'],
    [/ziehen zum Sortieren/g, 'trecke för ze sotteere'],
    [/Karten hierher ziehen/g, 'Kaate hee hin trecke'],
    [/Verbinde…/g, 'Verbinge…'],
    [/Es darf geklopft werden…/g, 'Et darf jekloppt wääde…'],
    [/Klopfen oder passen\?/g, 'Kloppe oder passe?'],
    [/Warte, bis der Gastgeber das Spiel startet…/g, 'Waat, bes dä Jastjeber et Spill aanfängk…'],
    [/Gegen Bots/g, 'Jäje de Bots'],
    [/Online gegen echte Gegner/g, 'Online jäje echte Minsche'],
    [/Anzahl Bots/g, 'Wie vill Bots'],
    [/Mit Tipps/g, 'Met Tipps'],
    [/alle spielen auf eigene Faust/g, 'jeder spillt op eije Fuus'],
    [/Link kopiert – jetzt an deine Mitspieler schicken!/g, 'Link kopeet – jetz an ding Metspiller scheck!'],
    [/Keine Verbindung zum Server möglich\./g, 'Kei Verbindung nohm Server.'],
    [/Nicht verbunden\./g, 'Nit verbunge.'],
    [/Verbindung unterbrochen – verbinde neu…/g, 'Verbindung fott – verbinge neu…'],
    [/Du wurdest aus dem Raum entfernt\./g, 'Do bes usem Raum erusjefloge.'],
    [/Spiel starten/g, 'Spill aanfange'],
    [/Weiter zu Runde/g, 'Wigger noh Rund'],
    [/Joker eingetauscht/g, 'Joker jetuusch'],
    [/Ohne Antwort wird automatisch zugestimmt\./g, 'Säht keiner jet, es et automatisch jot.'],
    [/Lieber passen/g, 'Leever passe'],
    [/Klopfen lohnt sich/g, 'Kloppe lohnt sich'],
    [/Du kannst ausmachen!/g, 'Do kanns Schluss maache!'],
    [/Du kannst die Vorgabe auslegen!/g, 'Do kanns de Vürjab uslääje!'],
    [/Der Stapel ist aufgebraucht/g, 'Dä Stapel es leddich'],
    [/Der Stapel ist leer/g, 'Dä Stapel es leddich'],
    [/Die Ablage ist leer/g, 'De Ablach es leddich'],
    [/Zuerst eine Karte ziehen/g, 'Zoeets en Kaat trecke'],
  ];

  // Einzelne Wörter (kleingeschrieben; Großschreibung wird übernommen)
  const WORDS = {
    ist: 'es', nicht: 'nit', nichts: 'nix', das: 'dat', dass: 'dat', was: 'wat', es: 'et', auch: 'och', aus: 'us', auf: 'op',
    kein: 'kei', keine: 'kein', keinen: 'keine', niemand: 'keiner', jemand: 'einer', du: 'do', bist: 'bes', hast: 'häs',
    hat: 'hät', haben: 'han', kannst: 'kanns', musst: 'muss', darfst: 'darfs', wird: 'weed', werden: 'wääde', sind: 'sin',
    mit: 'met', nach: 'noh', vom: 'vum', von: 'vun', zu: 'zo', zum: 'zom', zur: 'zor', die: 'de', der: 'dä', den: 'dä',
    dem: 'däm', und: 'un', aber: 'ävver', wer: 'wä', wenn: 'wann', sie: 'se', ein: 'ene', eine: 'en', einen: 'ene',
    dein: 'ding', deine: 'ding', deinen: 'dinge', deiner: 'dinge', deinem: 'dingem', mein: 'ming', meine: 'ming',
    jetzt: 'jetz', schon: 'ald', erst: 'eets', zuerst: 'zoeets', hier: 'hee', hierher: 'hee hin', gut: 'jot',
    gegen: 'jäje', gegner: 'Jäjner', gegenspieler: 'Jäjespiller', gegenspielern: 'Jäjespiller', spieler: 'Spiller',
    spielern: 'Spiller', mitspieler: 'Metspiller', mitspielern: 'Metspiller', spiel: 'Spill', spiels: 'Spills',
    spielen: 'spille', spielt: 'spillt', kartenspiel: 'Kaatespill', spielmodus: 'Spillmodus',
    karte: 'Kaat', karten: 'Kaate', strafkarte: 'Strofkaat', strafkarten: 'Strofkaate', handkarten: 'Handkaate',
    restkarten: 'Resskaate', runde: 'Rund', runden: 'Runde', rundenende: 'Rundeng', nimmt: 'nimmp', nehmen: 'nemme',
    zieh: 'treck', zieht: 'treck', ziehen: 'trecke', ziehe: 'treck', klopfen: 'kloppe', klopft: 'kloppt', geklopft: 'jekloppt',
    klopfer: 'Klopper', legt: 'läht', legen: 'lääje', lege: 'lääch', auslegen: 'uslääje', ausgelegt: 'usjelaat',
    anlegen: 'aanlääje', angelegt: 'aanjelaat', ausmachen: 'Schluss maache', macht: 'määt', machen: 'maache',
    weiter: 'wigger', warte: 'waat', gewinnt: 'jewinnt', gewinnen: 'jewenne', gewonnen: 'jewonne',
    verlassen: 'verlosse', vorgabe: 'Vürjab', gruppe: 'Jrupp', gruppen: 'Jruppe', ablage: 'Ablach', auslage: 'Uslaach',
    zustimmen: 'zostemme', ablehnen: 'avlehne', abgelehnt: 'avjelehnt', verdeckt: 'verdeck', verdeckte: 'verdeckte',
    offen: 'offe', offene: 'offe', gastgeber: 'Jastjeber', schließen: 'zomaache', ja: 'jo', nein: 'nä',
    beliebige: 'beliebije', beliebigen: 'beliebije', alle: 'all', allen: 'all', anderen: 'andere', gleiche: 'jlich',
    gleich: 'jlich', mehr: 'mieh', viel: 'vill', selbst: 'selvs', zurück: 'zoröck', sehen: 'sinn', zeigt: 'zeich',
    gibt: 'jitt', geht: 'jeit', kommt: 'kütt', bekommt: 'kritt', bekommst: 'kriss', bekommen: 'krieje', bringt: 'brängk',
    passt: 'pass', passen: 'passe', gilt: 'jilt', zug: 'Zoch', zuges: 'Zochs', zügen: 'Zöch', rechts: 'räächs',
    möglich: 'müjjelich', später: 'späder', wieder: 'widder', beendet: 'vörbei', bereit: 'parat', schick: 'scheck',
    lieber: 'leever', brauchst: 'bruchs', fehlt: 'fählt', ab: 'av', an: 'aan', um: 'öm', für: 'för', über: 'üvver',
    unter: 'unger', vor: 'vür', einmal: 'eimol', mal: 'mol', so: 'esu', heute: 'hück', weniger: 'winniger',
    wenigsten: 'winnichste', man: 'mer', wir: 'mer', euch: 'üch', danach: 'donoh', bevor: 'bevür', während: 'wiele',
    vorschläge: 'Vürschläch', vorschlag: 'Vürschlach', tauscht: 'tuusch', tauschen: 'tuusche', markierten: 'markeete',
    markierte: 'markeete', liegt: 'litt', liegen: 'lieje', eigene: 'eije', eigenen: 'eije', fragen: 'frooge', will: 'well',
    sortieren: 'sotteere', gemischt: 'jemisch', schiebt: 'schüvv', wirft: 'schmieß', wirf: 'schmieß',
    abwerfen: 'fottschmieße', könig: 'Künnich', zehnen: 'Zehne', farbe: 'Färv', farben: 'Färve', wert: 'Wäät',
    werte: 'Wääte', egal: 'ejal', sekunden: 'Sekunde', antwort: 'Antwood', punkte: 'Punkte', punktestand: 'Punkteschtand',
    menü: 'Menü', verlauf: 'Wat bes jetz passeet es', drin: 'dren', raum: 'Raum', neu: 'neu', bitte: 'bitte',
    tipps: 'Tipps', turnier: 'Turnier', eingeben: 'enjevve', wähle: 'wähl', tippe: 'tipp', tippen: 'tippe',
    antippen: 'aantippe', erscheint: 'kütt', bis: 'bes', noch: 'noch', dann: 'dann', oder: 'oder', dran: 'dran',
    starte: 'fang aan', startet: 'fängk aan', zieh: 'treck', sammeln: 'sammele', kostet: 'koss', kaum: 'kaum',
    hilft: 'hilf', näher: 'nöher', dich: 'dich', dir: 'dir', brauchen: 'bruche', echte: 'echte', echten: 'echte',
    nächste: 'nächste', nächsten: 'nächste', draußen: 'drusse', ins: 'en et', im: 'em', in: 'en', am: 'am',
    oben: 'bovve', unten: 'unge', links: 'links', mitte: 'Medde', erste: 'eetste', ersten: 'eetste', zweite: 'zweite',
    letztes: 'letzte', letzte: 'letzte', dieser: 'dä', diesem: 'däm', genau: 'jenau', wählen: 'wähle', ihre: 'ehr',
    ihr: 'ehr', zählen: 'zälle', zählt: 'zällt', fremden: 'fremde', wenig: 'winnich', ziehst: 'trecks', nimmst: 'nimms',
    ob: 'ov', gelegt: 'jelaat', gespielt: 'jespillt', jeder: 'jeder', jeden: 'jede', zeit: 'Zick', schnell: 'flöck',
    gewinner: 'Jewinner', gewinnerin: 'Jewinnerin', gesamt: 'insjesamp', ergebnis: 'Erjebnis', runde: 'Rund',
    sammelstapel: 'Sammelstapel', stapel: 'Stapel', sequenz: 'Sequenz', kombination: 'Kombination',
    sprache: 'Sproch', erstelle: 'maach', freie: 'frei', plätze: 'Plätz', auffüllen: 'opfülle', aufgedeckt: 'opjedeck',
    blättern: 'Blädder', oberste: 'bovverste', dürfen: 'dürfe', einigen: 'e paar', zugestimmt: 'zojestemmp',
    vorrang: 'Vürrang', selben: 'sellve', tisch: 'Desch', bringen: 'bränge', wählt: 'wählt', drücken: 'dröcke',
    drückt: 'dröck', beginnt: 'fängk aan', gültig: 'jöltich', grüner: 'jröne', haken: 'Hoke', zeigen: 'zeije',
    finale: 'Finale', vorbei: 'vörbei', sofort: 'sofott', immer: 'immer', ganz: 'janz', normal: 'normal',
  };
  const WORD_RE = /[A-Za-zÄÖÜäöüß]+/g;
  function tword(w) {
    if (w.length > 1 && w === w.toUpperCase()) return w; // JOKER, NEU, Raumcodes …
    const k = WORDS[w.toLowerCase()];
    if (!k) return w;
    if (w[0] !== w[0].toLowerCase()) return k[0].toUpperCase() + k.slice(1);
    return k;
  }
  function koelsch(s) {
    if (!s || !/[A-Za-zÄÖÜäöüß]{2}/.test(s)) return s;
    // Wendungen werden markiert (\u0001…\u0002), damit ihre kölschen Wörter nicht noch einmal ersetzt werden
    for (const [re, rep] of PHRASES) s = s.replace(re, '\u0001' + rep + '\u0002');
    let out = '', depth = 0, buf = '';
    const flush = () => { out += depth ? buf : buf.replace(WORD_RE, tword); buf = ''; };
    for (const ch of s) {
      if (ch === '\u0001') { flush(); depth++; }
      else if (ch === '\u0002') { flush(); depth = Math.max(0, depth - 1); }
      else buf += ch;
    }
    flush();
    return out;
  }

  // ---- DOM-Übersetzung ----
  const done = new WeakMap(); // Textknoten → zuletzt geschriebener Text
  const doneAttr = new WeakMap();
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  let on = false, obs = null;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
  function skipEl(el) { return !el || SKIP.has(el.nodeName) || (el.closest && el.closest('[data-nok], .code, .nm')); }
  function doText(n) {
    if (done.get(n) === n.data) return;
    if (skipEl(n.parentElement)) return;
    const out = koelsch(n.data);
    if (out !== n.data) n.data = out;
    done.set(n, n.data);
  }
  function doAttrs(el) {
    if (skipEl(el)) return;
    let m = doneAttr.get(el);
    if (!m) { m = {}; doneAttr.set(el, m); }
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null || m[a] === v) continue;
      const out = koelsch(v);
      if (out !== v) el.setAttribute(a, out);
      m[a] = out;
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (SKIP.has(root.nodeName)) return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function enable(v) {
    on = !!v;
    document.documentElement.lang = on ? 'ksh' : 'de';
    if (on) {
      walk(document.body);
      if (!obs) {
        obs = new MutationObserver((list) => {
          if (!on) return;
          for (const m of list) {
            if (m.type === 'childList') m.addedNodes.forEach(walk);
            else if (m.type === 'characterData') doText(m.target);
            else if (m.type === 'attributes') doAttrs(m.target);
          }
        });
      }
      obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    } else if (obs) obs.disconnect();
  }
  window.Koelsch = { enable, translate: koelsch, get on() { return on; } };
})();
