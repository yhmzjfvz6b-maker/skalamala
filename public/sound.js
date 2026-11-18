/* Skalamala – Musik (eigener Schunkelwalzer) und Geräusche, komplett im Browser erzeugt (Web Audio). */
(function () {
  'use strict';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('skalamala.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('skalamala.' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const cfg = {
    musicOn: store.get('musicOn', true), musicVol: store.get('musicVol', 30),
    sfxOn: store.get('sfxOn', true), sfxVol: store.get('sfxVol', 70),
  };
  let ac = null, musicBus = null, sfxBus = null, loopTimer = null, nextAt = 0, unlocked = false;

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      musicBus = ac.createGain(); musicBus.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.connect(ac.destination);
      applyVol();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function applyVol() {
    if (!ac) return;
    musicBus.gain.value = cfg.musicOn ? (cfg.musicVol / 100) * 0.6 : 0;
    sfxBus.gain.value = cfg.sfxOn ? (cfg.sfxVol / 100) * 0.9 : 0;
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function lp(f, bus) { const x = ac.createBiquadFilter(); x.type = 'lowpass'; x.frequency.value = f; x.connect(bus); return x; }
  function tone(t, m, d, type, vol, dest, det) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = hz(m); if (det) o.detune.value = det;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.03, d * 0.6)); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(t, d, vol, ftype, f, q) {
    const n = Math.max(1, Math.floor(ac.sampleRate * d)), b = ac.createBuffer(1, n, ac.sampleRate), c = b.getChannelData(0);
    for (let i = 0; i < n; i++) c[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = b;
    const fl = ac.createBiquadFilter(); fl.type = ftype; fl.frequency.value = f; fl.Q.value = q || 1;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(t);
  }

  // ---- Musik A: Schunkelwalzer (eigene Komposition) ----
  const CH = { F: [53, 57, 60], Bb: [58, 62, 65], C: [55, 60, 64], C7: [55, 58, 64], Gm: [55, 58, 62] };
  const BS = { F: 41, Bb: 46, C: 48, C7: 48, Gm: 43 };
  const MEL = [[72, 2], [69, 1], [77, 2], [76, 1], [74, 1.5], [72, 0.5], [70, 1], [69, 3], [70, 2], [74, 1], [79, 2], [77, 1], [76, 1], [74, 1], [76, 1], [72, 3],
    [72, 2], [69, 1], [77, 2], [81, 1], [79, 1.5], [77, 0.5], [74, 1], [72, 3], [70, 2], [67, 1], [72, 2], [76, 1], [76, 1], [79, 1], [76, 1], [77, 3]];
  const CHORDS = ['F', 'F', 'Bb', 'F', 'Bb', 'Gm', 'C', 'C', 'F', 'F', 'Bb', 'F', 'Gm', 'C', 'C7', 'F'];
  const BEAT = 60 / 150, BAR = 3 * BEAT, TOTAL = CHORDS.length * BAR;
  function schedule(t0) {
    const f = lp(1800, musicBus), f2 = lp(1200, musicBus);
    let t = t0;
    for (const [m, d] of MEL) { tone(t, m, d * BEAT * 0.95, 'sawtooth', 0.09, f, -7); tone(t, m, d * BEAT * 0.95, 'sawtooth', 0.09, f, 7); t += d * BEAT; }
    CHORDS.forEach((c, i) => {
      const bt = t0 + i * BAR;
      tone(bt, BS[c], BEAT * 0.8, 'triangle', 0.28, musicBus);
      for (let k = 1; k < 3; k++) CH[c].forEach((n) => tone(bt + k * BEAT, n, BEAT * 0.45, 'square', 0.025, f2));
    });
  }
  function startMusic() {
    if (!cfg.musicOn || loopTimer || !ctx()) return;
    nextAt = ac.currentTime + 0.1;
    schedule(nextAt); nextAt += TOTAL;
    loopTimer = setInterval(() => {
      if (ac.state !== 'running') return;
      if (nextAt < ac.currentTime) nextAt = ac.currentTime + 0.1; // nach Pause/Hintergrund wieder sauber einsetzen
      if (ac.currentTime > nextAt - 1.5) { schedule(nextAt); nextAt += TOTAL; }
    }, 300);
  }
  function stopMusic() {
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = null;
    if (ac) { musicBus.disconnect(); musicBus = ac.createGain(); musicBus.connect(ac.destination); applyVol(); }
  }

  // ---- Geräusche ----
  function tusch(t, big) {
    const f = lp(2400, sfxBus);
    const seq = big ? [[60, 64, 67], [60, 64, 67], [60, 64, 67], [65, 69, 72], [65, 69, 72], [65, 69, 72], [67, 72, 76]] : [[60, 64, 67], [65, 69, 72]]; // Auslegen: kurzes „ta-taa“
    seq.forEach((c, i) => {
      const last = i === seq.length - 1, d = last ? (big ? 1.6 : 1.1) : 0.12, st = t + i * 0.16;
      c.forEach((n) => { tone(st, n, d, 'sawtooth', 0.06, f); tone(st, n + 12, d, 'square', 0.03, f); });
      tone(st, c[0] - 24, d, 'triangle', 0.25, sfxBus);
    });
    noise(t + (seq.length - 1) * 0.16, big ? 1.4 : 1, 0.18, 'highpass', 5000);
  }
  const FX = {
    click() { const t = ac.currentTime; noise(t, 0.03, 0.35, 'highpass', 3000); },
    draw() {
      const t = ac.currentTime, n = Math.floor(ac.sampleRate * 0.25), b = ac.createBuffer(1, n, ac.sampleRate), c = b.getChannelData(0);
      for (let i = 0; i < n; i++) c[i] = Math.random() * 2 - 1;
      const s = ac.createBufferSource(); s.buffer = b;
      const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 1.5;
      fl.frequency.setValueAtTime(800, t); fl.frequency.linearRampToValueAtTime(4000, t + 0.22);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.24);
      s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(t);
    },
    discard() { const t = ac.currentTime; noise(t, 0.08, 0.5, 'lowpass', 900); tone(t, 45, 0.12, 'sine', 0.4, sfxBus); },
    knock() { const t = ac.currentTime; [0, 0.16].forEach((o) => { noise(t + o, 0.07, 0.7, 'bandpass', 420, 4); tone(t + o, 52, 0.08, 'sine', 0.5, sfxBus); }); },
    tusch() { tusch(ac.currentTime, false); },
    win() { tusch(ac.currentTime, true); },
  };
  let lastFx = {};
  function play(name) {
    if (!cfg.sfxOn || !unlocked || !ctx() || !FX[name]) return;
    const now = Date.now();
    if (lastFx[name] && now - lastFx[name] < 60) return; // keine Doppel-Auslösung
    lastFx[name] = now;
    try { FX[name](); } catch (e) {}
  }

  // Browser erlauben Ton erst nach einer Berührung/einem Klick
  // Bei jeder Berührung prüfen, ob der Ton (z. B. nach Sperrbildschirm, Tab-Wechsel, Vollbild) wieder geweckt werden muss
  function unlock() {
    unlocked = true;
    const a = ctx();
    if (a && a.state !== 'running') { try { a.resume(); } catch (e) {} }
    if (cfg.musicOn && cfg.musicVol > 0) startMusic();
  }
  ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'touchend', 'click'].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  // Wächter: hat der Browser den Ton angehalten (Kopfhörer gewechselt, Energiesparen, anderer Ton …), wieder wecken
  setInterval(() => {
    if (!unlocked || !ac || document.hidden) return;
    if (ac.state === 'closed') {
      if (loopTimer) clearInterval(loopTimer);
      loopTimer = null; ac = null;
      if (ctx() && cfg.musicOn && cfg.musicVol > 0) startMusic();
      return;
    }
    if (ac.state !== 'running') { try { ac.resume(); } catch (e) {} }
  }, 2000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && unlocked && ac && ac.state !== 'running') { try { ac.resume(); } catch (e) {} } });

  function set(k, v) {
    cfg[k] = v; store.set(k, v);
    applyVol();
    if (k === 'musicOn' || k === 'musicVol') { if (cfg.musicOn && cfg.musicVol > 0 && unlocked) startMusic(); if (!cfg.musicOn) stopMusic(); }
  }
  window.SkSound = { play, set, get: (k) => cfg[k], cfg };
})();
