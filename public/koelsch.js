/* Skalamala – Modus „op Kölsch“: übersetzt alle angezeigten Texte (auch Server-Meldungen) ins Kölsche. */
(function () {
  'use strict';

  // Ganze Sätze und Wendungen zuerst (Reihenfolge zählt)
  const KSH_PHRASES = [
    [/Los geht's/g, 'Loss jon!'],
    [/✋ noch ausgelegt/g, '✋ noch flöck usjelaat'],
    [/Geräusche/g, 'Jeräusche'], [/Musik/g, 'Musik'], [/^Ton$/g, 'Tön'],
    [/ – (.+?) gibt, (.+?) beginnt\./g, ' – $1 jitt, $2 fängk aan.'],
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
  const KSH_WORDS = {
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

  // ---------- English ----------
  const N = '(.+?)', C = '(\\S+)';
  const EN_PHRASES = [
    [new RegExp('✋ ' + N + ' legt noch die Vorgabe aus: ', 'g'), '✋ $1 still lays down the contract: '],
    [new RegExp('🎉 ' + N + ' hat ausgemacht! ✋ Noch ausgelegt: ', 'g'), '🎉 $1 went out! ✋ Still melded: '],
    [/✋ noch ausgelegt/g, '✋ still melded'],
    [new RegExp('🎉 ' + N + ' macht aus! Wer noch nicht ausgelegt hat, darf jetzt die Vorgabe auslegen\\.', 'g'), '🎉 $1 goes out! Anyone who hasn\'t melded may now lay down the contract.'],
    [new RegExp('🎉 ' + N + ' hat die Runde gewonnen!', 'g'), '🎉 $1 wins the round!'],
    [new RegExp(N + ' legt nichts mehr aus\\.', 'g'), '$1 lays nothing more.'],
    [new RegExp(N + ' legt noch schnell aus: ', 'g'), '$1 quickly melds: '],
    [new RegExp('🎉 ' + N + ' hat ausgemacht! Du darfst noch die Vorgabe auslegen – nur die Vorgabe, nichts anlegen\\.', 'g'), '🎉 $1 went out! You may still lay down the contract – only the contract, no laying off.'],
    [new RegExp('🎉 ' + N + ' hat ausgemacht – die anderen dürfen noch ihre Vorgabe auslegen…', 'g'), '🎉 $1 went out – the others may still lay down their contract…'],
    [/✓ Vorgabe auslegen/g, '✓ Meld contract'], [/^Nichts auslegen$/g, 'Lay nothing'],
    [/Die Runde ist vorbei – du darfst nichts mehr auslegen\./g, 'The round is over – you can\'t meld anything else.'],
    [/Jetzt darfst du nur noch die Vorgabe auslegen oder passen\./g, 'Now you may only lay down the contract or pass.'],
    [/Nur genau die Vorgabe auslegen: (.+?)\./g, 'Lay down exactly the contract: $1.'],
    [/Du kannst die Vorgabe noch auslegen – das spart Punkte! Vorschlag in die Sammelstapel legen\?/g, 'You can still meld the contract – that saves points! Put the suggestion into collect piles?'],
    [/Die Vorgabe hast du leider nicht zusammen – tippe auf „Nichts auslegen“\./g, 'You don\'t have the contract – tap „Lay nothing“.'],
    // Spielverlauf (Server/Engine)
    [/Der Stapel ist leer – die Ablage wird neu gemischt \(letztes Mal in dieser Runde\)\./g, 'The stock is empty – the discard pile is reshuffled (last time this round).'],
    [new RegExp('👊 ' + N + ' klopft und nimmt ' + C + ' \\+ 1 verdeckte Karte\\.', 'g'), '👊 $1 knocks and takes $2 + 1 face-down card.'],
    [new RegExp('👊 ' + N + ' klopft als Erste\\(r\\)!', 'g'), '👊 $1 knocks first!'],
    [new RegExp('👊 ' + N + ' klopft – zu spät\\.', 'g'), '👊 $1 knocks – too late.'],
    [new RegExp('👎 ' + N + ' lehnt das Klopfen ab und nimmt die Karte selbst\\.', 'g'), '👎 $1 rejects the knock and takes the card.'],
    [new RegExp('👎 ' + N + ' lehnt das Klopfen ab\\.', 'g'), '👎 $1 rejects the knock.'],
    [new RegExp('🔄 ' + N + ' tauscht ' + C + ' gegen den Joker – der Joker muss in diesem Zug wieder angelegt werden\\.', 'g'), '🔄 $1 swaps $2 for the joker – the joker must be laid off again this turn.'],
    [new RegExp('🎉 ' + N + ' macht aus!', 'g'), '🎉 $1 goes out!'],
    [new RegExp(N + ' nimmt ' + C + ' von der Ablage\\.', 'g'), '$1 takes $2 from the discard pile.'],
    [new RegExp(N + ' zieht vom Stapel\\.', 'g'), '$1 draws from the stock.'],
    [new RegExp(N + ' wirft ' + C + ' ab\\.', 'g'), '$1 discards $2.'],
    [new RegExp(N + ' legt aus:', 'g'), '$1 melds:'],
    [new RegExp(N + ' legt ' + N + ' an\\.', 'g'), '$1 lays off $2.'],
    [/Der Stapel ist aufgebraucht – Runde beendet, alle zählen ihre Handkarten\./g, 'The stock is used up – round over, everyone counts their hand.'],
    [/Der Stapel ist aufgebraucht\./g, 'The stock is used up.'],
    // Fehlermeldungen
    [/In dieser Runde werden genau (\d+) Kombinationen? ausgelegt: (.+?)\. Weitere Karten danach anlegen\./g, 'This round you meld exactly $1 combination(s): $2. Lay off further cards afterwards.'],
    [/Beim Auslegen genau die Vorgabe: (.+?)\. Anlegen erst ab deinem nächsten Zug\./g, 'Meld exactly the contract: $1. Laying off starts with your next turn.'],
    [/Im Zug des Auslegens wird nur die Vorgabe ausgelegt – anlegen \(bei dir und den Gegenspielern\) erst ab deinem nächsten Zug\./g, 'In the turn you meld, only the contract is laid down – laying off (yours and opponents\' melds) starts with your next turn.'],
    [/Anlegen erst ab deinem nächsten Zug – bei dir und bei den Gegenspielern\./g, 'Laying off starts with your next turn – on your own and opponents\' melds.'],
    [/Ausgelegt! Jetzt abwerfen – anlegen erst ab deinem nächsten Zug/g, 'Melded! Now discard – laying off starts with your next turn'],
    [/In dieser Runde muss komplett aus der Hand ausgemacht werden \(höchstens 1 Karte zum Abwerfen übrig\)\./g, 'This round you must go out entirely from your hand (at most 1 card left to discard).'],
    [/An deine eigenen Kombinationen darfst du erst ab deinem nächsten Zug anlegen – an die der Gegenspieler sofort\./g, 'You can lay off on your own melds from your next turn – on opponents\' melds right away.'],
    [/An deine eigenen Kombinationen erst ab deinem nächsten Zug anlegen\./g, 'You can lay off on your own melds from your next turn.'],
    [/Zu viele Joker: In jeder Kombination muss mindestens eine echte Karte mehr liegen als Joker\./g, 'Too many jokers: every meld needs at least one more real card than jokers.'],
    [/Den eingetauschten Joker musst du erst wieder anlegen – an eine beliebige Kombination\./g, 'You must first lay off the swapped joker – on any meld.'],
    [/Erst die Vorgabe auslegen, dann anlegen\.?/g, 'Meld the contract first, then lay off.'],
    [/Passt nicht an diese Kombination/g, 'Doesn\'t fit this meld'],
    [/Kombination nicht gefunden/g, 'Meld not found'],
    [/Karten? nicht auf der Hand/g, 'Card not in your hand'],
    [/Ungültige Aktion/g, 'Invalid action'], [/Unbekannte Aktion/g, 'Unknown action'],
    [/Runde läuft noch/g, 'Round still in progress'], [/Kein Klopfen offen/g, 'No knock pending'],
    [/Ungültiger Spieler/g, 'Invalid player'], [/Klopfen ist gerade nicht möglich/g, 'You can\'t knock right now'],
    [/Nichts zu passen/g, 'Nothing to pass'], [/Du hast schon entschieden/g, 'You have already decided'],
    [/Du bist nicht dran/g, 'It\'s not your turn'], [/Die Ablage ist leer/g, 'The discard pile is empty'],
    [/Niemand hat geklopft/g, 'Nobody knocked'], [/Zuerst eine Karte ziehen/g, 'Draw a card first'],
    [/Gerade nicht möglich/g, 'Not possible right now'], [/Du hast schon ausgelegt/g, 'You have already melded'],
    [/Du hast dich auf einem anderen Gerät angemeldet\./g, 'You signed in on another device.'],
    [/Du bist schon in einem Raum\./g, 'You are already in a room.'],
    [/Raum nicht gefunden\. Code prüfen!/g, 'Room not found. Check the code!'],
    [new RegExp('Der ' + N + ' ist nur für ' + N + '\\. Bitte deinen Namen genau so eingeben\\.', 'g'), '$1 is only for $2. Please enter your name exactly like that.'],
    [new RegExp('Der ' + N + ' ist nur für ' + N + ' – bitte oben deinen Namen genau so eingeben\\.', 'g'), '$1 is only for $2 – please enter your name exactly like that above.'],
    [/Das Spiel in diesem Raum läuft bereits\./g, 'The game in this room has already started.'],
    [/Der Raum ist voll\./g, 'The room is full.'],
    [/Mindestens 2 Spieler \(oder Bots\) nötig\./g, 'At least 2 players (or bots) needed.'],
    [/Keine Verbindung zum Server möglich\./g, 'Can\'t connect to the server.'],
    [/Du wurdest aus dem Raum entfernt\./g, 'You were removed from the room.'],
    [/Verbindung unterbrochen – verbinde neu…/g, 'Connection lost – reconnecting…'],
    [/Nicht verbunden\./g, 'Not connected.'],
    [/Bitte zuerst deinen Namen eingeben\./g, 'Please enter your name first.'],
    [/Bitte erst eine Karte nehmen – vom Stapel oder von der Ablage\./g, 'Please take a card first – from the stock or the discard pile.'],
    [/Du bist noch nicht dran\./g, 'It\'s not your turn yet.'],
    [/Wähle zuerst Karten aus deiner Hand\./g, 'Select cards from your hand first.'],
    [/Wähle genau eine Karte zum Abwerfen\./g, 'Select exactly one card to discard.'],
    [/Karten antippen und dann „＋ Sammelstapel“ – oder Karten auf das ＋ ziehen\./g, 'Tap cards, then „＋ Collect pile“ – or drag cards onto the ＋.'],
    [/Deine Sammelstapel erfüllen die Vorgabe noch nicht: /g, 'Your collect piles don\'t meet the contract yet: '],
    [/Der Raumcode hat 4 Buchstaben\./g, 'The room code has 4 letters.'],
    [/Link kopiert – jetzt an deine Mitspieler schicken!/g, 'Link copied – now send it to your friends!'],
    // Tipps
    [new RegExp('Klopfen lohnt sich – ' + C + ' bringt dich deiner Vorgabe näher\\.', 'g'), 'Knocking pays off – $1 brings you closer to the contract.'],
    [new RegExp('Lieber passen – ' + C + ' hilft dir kaum, und die Strafkarte kostet Punkte\\.', 'g'), 'Better pass – $1 barely helps and the penalty card costs points.'],
    [new RegExp('👎 ablehnen und ' + C + ' selbst von der Ablage nehmen – die Karte passt zu dir\\.', 'g'), '👎 reject and take $1 from the discard pile yourself – it suits you.'],
    [new RegExp('👍 zustimmen – ' + C + ' brauchst du nicht\\.', 'g'), '👍 approve – you don\'t need $1.'],
    [new RegExp('Nimm ' + C + ' von der Ablage – sie passt zu deinen Karten\\.', 'g'), 'Take $1 from the discard pile – it fits your cards.'],
    [new RegExp('Zieh vom Stapel – ' + C + ' bringt dir wenig\\.', 'g'), 'Draw from the stock – $1 is of little use to you.'],
    [/Zieh vom Stapel\./g, 'Draw from the stock.'],
    [/Du kannst ausmachen! Vorschlag in die Sammelstapel legen\?/g, 'You can go out! Put the suggestion into collect piles?'],
    [/Du kannst die Vorgabe auslegen! Vorschlag in die Sammelstapel legen\?/g, 'You can meld the contract! Put the suggestion into collect piles?'],
    [new RegExp(C + ' ersetzt einen Joker in der markierten Kombination – du bekommst den Joker zurück\\.', 'g'), '$1 replaces a joker in the highlighted meld – you get the joker back.'],
    [new RegExp(C + ' passt an die markierte Kombination\\.', 'g'), '$1 fits the highlighted meld.'],
    [new RegExp('Nichts mehr anzulegen – wirf ' + C + ' ab \\((\\d+) Punkte weniger auf der Hand\\)\\.', 'g'), 'Nothing left to lay off – discard $1 ($2 fewer points in hand).'],
    [new RegExp('Wirf ' + C + ' ab – dir fehlt nicht mehr viel\\.', 'g'), 'Discard $1 – you\'re almost there.'],
    [new RegExp('Wirf ' + C + ' ab\\.', 'g'), 'Discard $1.'],
    // Status
    [/Runde beendet/g, 'Round over'], [/Spiel beendet/g, 'Game over'],
    [/👊 Klopfen oder passen\?/g, '👊 Knock or pass?'],
    [/Es darf geklopft werden…/g, 'Players may knock…'],
    [/Du bist dran – zieh eine Karte \(Stapel oder Ablage\)/g, 'Your turn – draw a card (stock or discard pile)'],
    [/Ausmachen \(alles aus der Hand\) oder eine Karte abwerfen/g, 'Go out (all from your hand) or discard a card'],
    [/Genau die Vorgabe auslegen – oder abwerfen/g, 'Meld exactly the contract – or discard'],
    [/🔄 Joker eingetauscht – lege ihn jetzt an eine beliebige Kombination an/g, '🔄 Joker swapped – now lay it off on any meld'],
    [/Ausgelegt! Jetzt abwerfen – anlegen nur bei Gegenspielern, bei dir erst im nächsten Zug/g, 'Melded! Now discard – lay off only on opponents\' melds, on your own from your next turn'],
    [/Anlegen: Karte wählen, dann auf eine Kombination tippen – zum Schluss abwerfen/g, 'Lay off: pick a card, then tap a meld – discard to finish'],
    [new RegExp(N + ' ist dran \\(zieht\\)…', 'g'), '$1\'s turn (drawing)…'],
    [new RegExp(N + ' ist dran…', 'g'), '$1\'s turn…'],
    // Startseite / Lobby
    [/8 Runden · wer am wenigsten Punkte hat, gewinnt!/g, '8 rounds · fewest points wins!'],
    [/Dein Name/g, 'Your name'], [/^Sprache$/g, 'Language'], [/^Spielmodus$/g, 'Game mode'],
    [/Zeigt dir während des Spiels Vorschläge: welche Karte nehmen, auslegen, anlegen oder abwerfen\./g, 'Shows suggestions during the game: which card to take, meld, lay off or discard.'],
    [/Turnier: ohne Tipps – alle spielen auf eigene Faust\./g, 'Tournament: no tips – everyone is on their own.'],
    [/Turnier – ohne Tipps/g, 'Tournament – no tips'], [/Mit Tipps/g, 'With tips'], [/Turnier/g, 'Tournament'],
    [/Gegen Bots/g, 'Against bots'], [/Anzahl Bots/g, 'Number of bots'], [/Los geht's/g, 'Let\'s go!'],
    [/Bei fremden Zügen fragen, ob ich klopfen will/g, 'Ask me whether to knock on other players\' turns'],
    [/Online gegen echte Gegner/g, 'Online against real players'],
    [/Zurück in Raum (\w+)/g, 'Back to room $1'],
    [new RegExp(N + ' betreten', 'g'), 'Enter $1'],
    [new RegExp('Fester Raum für (.+)$', 'g'), 'Fixed room for $1'],
    [/Raum erstellen/g, 'Create room'], [/^Beitreten$/g, 'Join'],
    [/Erstelle einen Raum und schick deinen Mitspielern den 4-stelligen Code oder den Link\. Freie Plätze kannst du mit Bots auffüllen\./g, 'Create a room and send your friends the 4-letter code or the link. Empty seats can be filled with bots.'],
    [/Für Online-Spiele muss diese Seite über den Skalamala-Server geöffnet werden \(siehe Anleitung in der README\)\. Gegen Bots kannst du sofort spielen\./g, 'For online games this page must be opened via the Skalamala server (see README). You can play against bots right away.'],
    [/Spielregeln/g, 'Rules'], [/Verbinde…/g, 'Connecting…'], [/^Raumcode$/g, 'Room code'],
    [/Fehlt noch: /g, 'Still missing: '], [/Alle Mitglieder sind da!/g, 'All members are here!'],
    [/Einladungslink kopieren/g, 'Copy invite link'], [/\(du\)/g, '(you)'], [/^Gastgeber$/g, 'Host'],
    [/Spiel starten/g, 'Start game'],
    [/2–6 Spieler\. Warte, bis alle drin sind, und starte dann\./g, '2–6 players. Wait until everyone has joined, then start.'],
    [/Warte, bis der Gastgeber das Spiel startet…/g, 'Waiting for the host to start the game…'],
    [/Raum verlassen/g, 'Leave room'],
    [/Antippen: Tipp groß anzeigen/g, 'Tap: show tip large'], [/Antippen: Tipp klein machen/g, 'Tap: make tip small'],
    [/^Skalamala ([↑↓])$/g, 'Skalamala $1'], [/^Zug\s*$/g, 'Turn '], [/Vollbild ist hier nicht möglich – öffne das Spiel direkt im Browser\./g, 'Fullscreen is not possible here – open the game directly in the browser.'],
    [/🃏 Wofür steht der Joker\?/g, '🃏 What does the joker stand for?'], [/ – tippe die gewünschte Reihenfolge an\./g, ' – tap the order you want.'],
    [/Joker = /g, 'Joker = '], [/ \(rot\)/g, ' (red)'], [/ \(schwarz\)/g, ' (black)'], [/^Abbrechen$/g, 'Cancel'], [/\((\d) von (\d)\)/g, '($1 of $2)'],
    // Spielfläche
    [/^Übernehmen$/g, 'Apply'], [/✓ draußen/g, '✓ down'], [/du warst zuerst/g, 'you were first'], [/geklopft 👊/g, 'knocked 👊'],
    [/👊 Klopfen/g, '👊 Knock'], [/^Gesucht:$/g, 'Needed:'], [/Deine Auslage/g, 'Your melds'],
    [/Auslage: noch hat niemand ausgelegt\./g, 'Table: nobody has melded yet.'],
    [/^Vom Stapel$/g, 'From stock'], [/^Ablage nehmen$/g, 'Take discard'], [/🎉 Ausmachen!/g, '🎉 Go out!'], [/✓ Auslegen/g, '✓ Meld'],
    [/^Abwerfen$/g, 'Discard'], [/Endergebnis/g, 'Final result'], [/Rundenergebnis/g, 'Round result'], [/Neues Spiel/g, 'New game'],
    [/Sammelstapel – Karten hierher ziehen/g, 'Collect pile – drag cards here'], [/Sammelstapel/g, 'Collect pile'],
    [/(\d+) Karten · (\d+) Pkt/g, '$1 cards · $2 pts'], [/· ziehen zum Sortieren/g, '· drag to sort'],
    [/^Rot\/Schwarz$/g, 'Red/black'], [/^Farbe$/g, 'Suit'], [/^Wert$/g, 'Rank'], [/(\d+) Pkt/g, '$1 pts'],
    [/^Stapel \((\d+)\)$/g, 'Pile ($1)'], [/^Stapel$/g, 'Stock'], [/^Ablage( \(\d+\))?$/g, 'Discard$1'],
    [/: nur (\d+) Karten!/g, ': only $1 cards!'], [/ – noch (\d+)$/g, ' – $1 more'], [/^passt nicht$/g, 'doesn\'t fit'],
    [/10er-Sequenz abwechselnd rot – schwarz/g, '10-card run alternating red – black'],
    [/5 Paare – OHNE KLOPFEN!/g, '5 pairs – NO KNOCKING!'],
    [/aus der Hand ausmachen – Finale!/g, 'go out from your hand – finale!'],
    [/aus der Hand ausmachen/g, 'go out from your hand'],
    [/👍 Karte \+ Strafkarte für (.+?) · 👎 du nimmst die Karte selbst, ohne Strafkarte/g, '👍 card + penalty card for $1 · 👎 you take the card yourself, no penalty'],
    [new RegExp('^' + N + ' klopft!$', 'g'), '$1 knocks!'], [/^Klopfen\?$/g, 'Knock?'],
    [new RegExp(N + ' will sie nicht · du bekommst sie', 'g'), '$1 doesn\'t want it · you get it'],
    [/\+ 1 Strafkarte/g, '+ 1 penalty card'], [/^Passen$/g, 'Pass'],
    // Rundenende
    [/^Spieler$/g, 'Player'], [new RegExp('🏆 ' + N + ' gewinnt!', 'g'), '🏆 $1 wins!'], [/^Mit nur$/g, 'With only'],
    [/(\d+) Punkten/g, '$1 points'], [/nach 8 Runden\./g, 'after 8 rounds.'], [/Runde (\d+) vorbei/g, 'Round $1 over'],
    [/hat ausgemacht!/g, 'went out!'], [/(\d+) Karte übrig/g, '$1 card left'], [/(\d+) Karten übrig/g, '$1 cards left'],
    [/Der Gastgeber kann ein neues Spiel starten\./g, 'The host can start a new game.'], [/^Punktestand$/g, 'Scores'],
    [/Spiel verlassen\?/g, 'Leave game?'], [/Spiel verlassen/g, 'Leave game'], [/Tisch ansehen/g, 'View table'],
    [/Weiter zu Runde (\d+)/g, 'On to round $1'], [/✓ Bereit – warte auf /g, '✓ Ready – waiting for '], [/✓ Bereit/g, '✓ Ready'],
    [/Ein Bot spielt für dich weiter\. Mit demselben Namen kannst du später wieder einsteigen\./g, 'A bot keeps playing for you. Rejoin later with the same name.'],
    [/Das laufende Spiel gegen die Bots wird beendet\./g, 'The current game against the bots will end.'],
    [/Weiterspielen/g, 'Keep playing'], [/Ja, verlassen/g, 'Yes, leave'], [/Wenigste Punkte gewinnen\./g, 'Fewest points win.'],
    [/^Ton$/g, 'Sound'], [/Musik/g, 'Music'], [/Geräusche/g, 'Sound effects'], [/ Lautstärke/g, ' volume'],
    [/^Tippen zum Schließen$/g, 'Tap to close'],
    [/^Menü$/g, 'Menu'], [/^Verlauf$/g, 'History'], [/^Schließen$/g, 'Close'],
    [/ – (.+?) gibt, (.+?) beginnt\./g, ' – $1 deals, $2 starts.'], [/Runde (\d+):/g, 'Round $1:'], [/^Geber$/g, 'Dealer'],
    [new RegExp(N + ' legt aus: ', 'g'), '$1 melds: '],
    // Kartenbezeichnungen in Meldungen: B → J, D → Q
    [/([♠♥♦♣])B(?![A-Za-z])/g, '$1J'], [/([♠♥♦♣])D(?![A-Za-z])/g, '$1Q'],
  ];
  const EN_WORDS = {
    gruppe: 'group', gruppen: 'groups', sequenz: 'run', sequenzen: 'runs', karten: 'cards', karte: 'card', und: 'and',
    'à': 'of', paare: 'pairs', mind: 'min', rot: 'red', schwarz: 'black', stapel: 'stock', ablage: 'discard pile',
    runde: 'round', punkte: 'points', spieler: 'player', ohne: 'without', joker: 'joker', offline: 'offline',
  };

  const PACKS = { ksh: { phrases: KSH_PHRASES, words: KSH_WORDS }, en: { phrases: EN_PHRASES, words: EN_WORDS } };
  let pack = PACKS.ksh;
  const WORD_RE = /[A-Za-zÄÖÜäöüßà]+/g;
  function tword(w, off, str) {
    if (w.length > 1 && w === w.toUpperCase()) return w; // JOKER, NEU, Raumcodes …
    const k = pack.words[w.toLowerCase()];
    if (!k) return w;
    const first = typeof off !== 'number' || !/[A-Za-zÄÖÜäöüß]/.test(str.slice(0, off));
    if (w[0] !== w[0].toLowerCase() && (pack !== PACKS.en || first)) return k[0].toUpperCase() + k.slice(1);
    return k;
  }
  function koelsch(s) {
    if (!s || !pack || !/[A-Za-zÄÖÜäöüß]{1}/.test(s)) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[1] + core(m[2]) + m[3];
  }
  function core(s) {
    if (!s) return s;
    // Wendungen werden markiert (\u0001…\u0002), damit ihre kölschen Wörter nicht noch einmal ersetzt werden
    for (const [re, rep] of pack.phrases) s = s.replace(re, '\u0001' + rep + '\u0002');
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
  function setLang(lang) {
    pack = PACKS[lang] || null;
    enable(!!pack, lang);
  }
  function enable(v, lang) {
    on = !!v && !!pack;
    document.documentElement.lang = on ? (lang || 'ksh') : 'de';
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
  window.Koelsch = { enable: (v) => setLang(v ? 'ksh' : 'de'), translate: koelsch, get on() { return on; } };
  window.I18n = { setLang, translate: (t, lang) => { const old = pack; pack = PACKS[lang] || pack; const r = koelsch(t); pack = old; return r; } };
})();
