# Skalamala 🃏

Das Kartenspiel Skalamala als Web-App: läuft im Browser auf **PC, Handy und Tablet**.
Du kannst **gegen Bots** spielen oder **online gegen echte Gegner**.

## Schnellstart

Du brauchst nur [Node.js](https://nodejs.org) (Version 18 oder neuer). Es müssen keine weiteren Pakete installiert werden.

```bash
cd skalamala
node server.js
```

Dann im Browser öffnen: **http://localhost:3000**

- **Gegen Bots:** Namen eingeben, Anzahl Bots wählen, „Los geht's".
- **Online:** „Raum erstellen" → den 4-stelligen Code (oder den Einladungslink) an die Mitspieler schicken → die geben den Code ein und klicken „Beitreten" → der Gastgeber füllt bei Bedarf mit Bots auf und startet.

## Bedienung

- **Karten antippen** = auswählen (für Kombinationen, Anlegen oder Abwerfen).
- **Karten ziehen** = eigene Reihenfolge festlegen. Mit „Farbe" oder „Wert" wird wieder automatisch sortiert.
- Eine Karte auf die **Ablage ziehen** = abwerfen, auf eine **Kombination ziehen** = anlegen.
- **Sammelstapel:** Karten auf das ＋ ziehen (oder auswählen und „＋ Sammelstapel“ tippen), z. B. für einen Drilling oder eine Straße mit Joker. Grüner Haken = gültig. Ergeben die Stapel die Vorgabe der Runde, erscheint „Auslegen“.

## Mit Freunden übers Internet spielen

Damit andere mitspielen können, muss der Server für sie erreichbar sein. Drei Wege:

1. **Im selben WLAN:** Server auf deinem PC starten und die anderen öffnen `http://<IP-deines-PCs>:3000` (die IP findest du z. B. mit `ipconfig` unter Windows bzw. `ifconfig`/`ip a` auf Mac/Linux).
2. **Kostenloser/günstiger Hoster** (empfohlen fürs Internet): z. B. Render, Railway, Fly.io oder ein kleiner VPS. Den Ordner als Projekt hochladen (z. B. über GitHub), als Startbefehl `node server.js` angeben. Den Port übernimmt der Server automatisch aus der Umgebungsvariable `PORT`. Die Hoster stellen HTTPS bereit, die WebSocket-Verbindung läuft dann automatisch verschlüsselt (`wss://`).
3. **Zuhause mit Portfreigabe:** Port 3000 im Router auf deinen PC weiterleiten und die öffentliche IP weitergeben.

**Aufs Handy wie eine App:** Seite im Browser öffnen → „Zum Startbildschirm hinzufügen".

## Dateien

| Datei | Inhalt |
|---|---|
| `shared/engine.js` | Spielregeln, Punkte, Klopfen, Bot-KI, Spielleitung (läuft im Browser und auf dem Server) |
| `server.js` | Online-Server: Webseite ausliefern, WebSocket, Räume, Wiederverbinden |
| `public/` | Oberfläche (HTML, CSS, JavaScript), App-Manifest und Icon |
| `build.js` | `node build.js` erzeugt `dist/skalamala.html` – eine einzelne Datei nur für den Bot-Modus (ohne Server) |
| `test/sim.js` | `node test/sim.js 100` simuliert 100 komplette Bot-Partien zum Testen |

## Regeln (wie umgesetzt)

- 2 Blätter à 55 Karten (je 52 + 3 Joker = 110 Karten), 2–8 Spieler, jeder bekommt 11 Karten. Der Rest liegt verdeckt in der Mitte, eine Karte wird aufgedeckt. Der Geber wechselt jede Runde, links vom Geber wird begonnen.
- **Zug:** Karte ziehen (offene Ablage oder verdeckter Stapel) → ggf. auslegen / anlegen → eine Karte abwerfen.
- **Klopfen:** Bevor der Spieler am Zug vom Stapel zieht, können die anderen um die offene Karte klopfen. Es gilt: **wer zuerst klopft**, bekommt die Karte – der Spieler am Zug hat aber Vorrang. Zieht er vom Stapel, bekommt der erste Klopfer die Karte **plus eine verdeckte Strafkarte**, danach zieht der Spieler am Zug. Online hat man dafür ca. 7 Sekunden Zeit, man kann aber auch schon vorher auf „Klopfen" tippen.
- **Gruppe:** gleiche Werte (Farben egal). **Sequenz:** mind. 4 aufeinanderfolgende Karten in derselben Farbe. **Skalamala:** 10er-Sequenz abwechselnd rot/schwarz.
- **Punkte:** 2–9 = 5, 10–König = 10, Ass = 20, Joker = 50. Wer ausmacht, bekommt 0. Nach 8 Runden gewinnt die niedrigste Summe.
- Die 8 Runden:
  1. 1 Gruppe (3) + 1 Sequenz (4)
  2. 3 Gruppen à 3
  3. 2 Sequenzen (mind. 4)
  4. 2 Gruppen à 5
  5. Skalamala (10er-Sequenz rot-schwarz)
  6. 5 Gruppen à 2 – **ohne Klopfen**
  7. 2 Gruppen (mind. 3) + 1 Sequenz (mind. 4) – **aus der Hand ausmachen**
  8. 1 Gruppe (mind. 3) + 2 Sequenzen (mind. 4) – **aus der Hand ausmachen**

### Annahmen, wo die Regeln nichts sagen (leicht änderbar in `shared/engine.js`)

- **Die 9 zählt 5 Punkte** (Funktion `cardPoints`).
- **Ass** in Sequenzen hoch (D-K-A) oder niedrig (A-2-3), aber nicht „herum" (K-A-2).
- **Joker** sind beliebig einsetzbar, auch mehrere in einer Kombination. Joker können nicht aus Auslagen zurückgetauscht werden.
- Pro Runde wird **genau die Vorgabe** ausgelegt, keine weiteren Kombinationen.
- **Anlegen:** erst nach dem eigenen Auslegen, dann an alle Kombinationen auf dem Tisch, auch im selben Zug.
- **Ausmachen:** wer keine Karten mehr hat – durch Abwerfen der letzten Karte oder durch Anlegen.
- **Aus der Hand (Runde 7/8):** alles in einem Zug auslegen, höchstens eine Karte bleibt zum Abwerfen.
- **Klopfen dürfen** nur Spieler, die noch nicht ausgelegt haben, nicht der, der die Karte gerade abgeworfen hat, und nur solange noch genug Karten im Stapel sind.
- **Stapel leer:** Die Ablage wird einmal neu gemischt. Ist der Stapel ein zweites Mal leer, endet die Runde und alle zählen ihre Handkarten (sonst könnte eine Runde endlos laufen).
- Online übernimmt ein Bot den Platz, wenn ein Spieler länger als 20 Sekunden getrennt ist. Kommt er zurück (gleicher Name oder gleiches Gerät), spielt er sofort weiter.
