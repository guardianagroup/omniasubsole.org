/* Omnia Sub Sole · música de fondo generada en el navegador (Web Audio).
   Sin grabaciones: ambiente tranquilo y enigmático en re lidio, con pads cálidos
   y notas de cristal con eco. Empieza con la primera interacción del visitante
   (norma de los navegadores) y se silencia con el botón de la esquina superior derecha. */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;

  function createEngine(ctx) {
    var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

    var master = ctx.createGain(); master.gain.value = 0;
    var soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 5000; soft.Q.value = 0.4;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.knee.value = 14; comp.ratio.value = 2.5;
    comp.attack.value = 0.08; comp.release.value = 0.6;
    master.connect(soft); soft.connect(comp); comp.connect(ctx.destination);

    // Espacio amplio y suave: reverberación larga de caída tersa.
    function impulse(sec, decay) {
      var rate = ctx.sampleRate, len = Math.floor(rate * sec), b = ctx.createBuffer(2, len, rate);
      for (var c = 0; c < 2; c++) {
        var d = b.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return b;
    }
    var dry = ctx.createGain(); dry.gain.value = 0.6; dry.connect(master);
    var rev = ctx.createConvolver(); rev.buffer = impulse(6, 3.2);
    var revTone = ctx.createBiquadFilter(); revTone.type = 'lowpass'; revTone.frequency.value = 3200;
    var wet = ctx.createGain(); wet.gain.value = 0.75;
    rev.connect(revTone); revTone.connect(wet); wet.connect(master);
    function send(node, amount) {
      node.connect(dry);
      var s = ctx.createGain(); s.gain.value = amount; node.connect(s); s.connect(rev);
    }

    // Eco lejano para las notas de cristal.
    var echoIn = ctx.createGain(), delay = ctx.createDelay(2), fb = ctx.createGain(), echoTone = ctx.createBiquadFilter();
    delay.delayTime.value = 0.72; fb.gain.value = 0.38;
    echoTone.type = 'lowpass'; echoTone.frequency.value = 2200;
    echoIn.connect(delay); delay.connect(echoTone); echoTone.connect(fb); fb.connect(delay);
    var echoOut = ctx.createGain(); echoOut.gain.value = 0.5; echoTone.connect(echoOut); send(echoOut, 0.8);

    // Re lidio: acordes abiertos y consonantes; el sol sostenido da el aire enigmático.
    var CHORDS = [
      { bass: 38, pad: [50, 57, 64, 66, 73], mel: [66, 69, 71, 73, 76, 78] },  // re maj9
      { bass: 38, pad: [50, 59, 64, 68, 71], mel: [64, 68, 71, 73, 76, 80] },  // mi sobre re (lidio)
      { bass: 35, pad: [47, 54, 62, 66, 73], mel: [66, 69, 71, 73, 74, 78] },  // si menor 9
      { bass: 43, pad: [50, 59, 66, 69, 73], mel: [66, 69, 71, 73, 74, 78] }   // sol maj9 (#11)
    ];
    var STEP = 18, OVERLAP = 7, t0 = 0;

    function pad(c, t, dur) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.linearRampToValueAtTime(1900, t + dur * 0.55);
      lp.frequency.linearRampToValueAtTime(1100, t + dur);
      var g = ctx.createGain(), peak = 0.06;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 7);
      g.gain.setValueAtTime(peak, t + dur - 8);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      c.pad.forEach(function (m) {
        [['sine', -5, 1], ['triangle', 5, 0.55]].forEach(function (v) {
          var o = ctx.createOscillator(), og = ctx.createGain();
          o.type = v[0]; o.frequency.value = mtof(m); o.detune.value = v[1] + rnd(-2, 2);
          og.gain.value = v[2]; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.1);
        });
      });
      var b = ctx.createOscillator(), bg = ctx.createGain();
      b.type = 'sine'; b.frequency.value = mtof(c.bass); bg.gain.value = 1.3;
      b.connect(bg); bg.connect(lp); b.start(t); b.stop(t + dur + 0.1);
      // brillo muy tenue una octava arriba que aparece y se va
      var sh = ctx.createOscillator(), sg = ctx.createGain();
      sh.type = 'sine'; sh.frequency.value = mtof(c.pad[c.pad.length - 1] + 12);
      sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(0.12, t + dur * 0.5); sg.gain.linearRampToValueAtTime(0.0001, t + dur);
      sh.connect(sg); sg.connect(g); sh.start(t); sh.stop(t + dur + 0.1);
      lp.connect(g); send(g, 0.55);
    }

    function glass(m, t, v) {
      var f = mtof(m), g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      [[1, 1], [2, 0.12], [3, 0.05], [4, 0.03]].forEach(function (p) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * p[0]; og.gain.value = p[1];
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 3.7);
      });
      g.connect(echoIn); send(g, 0.6);
    }

    var ci = 0, nextChord = 0, nextNote = 0;
    function chordAt(t) {
      var k = Math.floor((t - t0) / STEP);
      return CHORDS[((k % CHORDS.length) + CHORDS.length) % CHORDS.length];
    }
    function schedule(until) {
      while (nextChord < until) {
        pad(CHORDS[ci % CHORDS.length], nextChord, STEP + OVERLAP);
        ci++; nextChord += STEP;
      }
      while (nextNote < until) {
        var c = chordAt(nextNote), m = pick(c.mel), n = Math.random() < 0.35 ? (Math.random() < 0.5 ? 2 : 3) : 1;
        for (var i = 0; i < n; i++) {
          glass(m, nextNote + i * rnd(0.7, 1.1), rnd(0.03, 0.045) * (1 - i * 0.2));
          var idx = c.mel.indexOf(m); m = c.mel[Math.max(0, idx - 1 - Math.floor(Math.random() * 2))];
        }
        nextNote += rnd(4, 9);
      }
    }
    function begin() {
      var t = ctx.currentTime;
      t0 = t + 0.1; nextChord = t0; nextNote = t + rnd(5, 8);
      schedule(t + 10);
    }
    function fadeTo(v, sec) {
      var t = ctx.currentTime, g = master.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + sec);
    }
    return { ctx: ctx, begin: begin, schedule: schedule, fadeTo: fadeTo, begun: false };
  }

  if (window.__ossMusicaTest) { window.__ossMusicaTest = createEngine; return; }
  if (!AC) return;

  var KEY = 'oss-musica', VOL = 0.65;
  var T = {
    es: ['Silenciar la música', 'Activar la música'],
    en: ['Mute the music', 'Play the music'],
    de: ['Musik stummschalten', 'Musik abspielen'],
    ru: ['Выключить музыку', 'Включить музыку'],
    zh: ['关闭音乐', '播放音乐'],
    ja: ['音楽を消す', '音楽を流す'],
    ar: ['كتم الموسيقى', 'تشغيل الموسيقى']
  };
  var L = T[(document.documentElement.lang || 'es').slice(0, 2)] || T.es;
  var pref = 'on';
  try { if (localStorage.getItem(KEY) === 'off') pref = 'off'; } catch (e) {}

  var svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'music-btn';
  btn.innerHTML =
    svg.replace('<svg ', '<svg class="i-on" ') + '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18.2 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>' +
    svg.replace('<svg ', '<svg class="i-off" ') + '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  document.body.appendChild(btn);

  var eng = null, timer = null, playing = false;
  var EVTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];

  function render() {
    btn.classList.toggle('is-off', !playing);
    btn.setAttribute('aria-label', playing ? L[0] : L[1]);
    btn.title = playing ? L[0] : L[1];
  }
  function save() {
    try { if (pref === 'off') localStorage.setItem(KEY, 'off'); else localStorage.removeItem(KEY); } catch (e) {}
  }
  function unlisten() { EVTS.forEach(function (n) { document.removeEventListener(n, onGesture, true); }); }

  function play() {
    if (!eng) eng = createEngine(new AC());
    var c = eng.ctx;
    function go() {
      if (c.state !== 'running' || pref !== 'on') return;
      if (!eng.begun) { eng.begin(); eng.begun = true; }
      eng.fadeTo(VOL, playing ? 1.5 : 5);
      if (!timer) timer = setInterval(function () { if (c.state === 'running') eng.schedule(c.currentTime + 10); }, 2000);
      playing = true; render(); unlisten();
    }
    if (c.state === 'running') go();
    else { var p = c.resume(); if (p && p.then) p.then(go, function () {}); }
  }
  function stop() {
    playing = false; render();
    if (!eng) return;
    eng.fadeTo(0, 1.2);
    var c = eng.ctx;
    setTimeout(function () { if (!playing && c.state === 'running') c.suspend(); }, 1400);
  }
  function onGesture(ev) {
    if (btn.contains(ev.target) || pref !== 'on' || playing) return;
    play();
  }

  btn.addEventListener('click', function () {
    if (playing) { pref = 'off'; save(); stop(); }
    else { pref = 'on'; save(); play(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (!eng) return;
    var c = eng.ctx;
    if (document.hidden) { if (c.state === 'running') c.suspend(); }
    else if (playing) c.resume();
  });
  if (pref === 'on') EVTS.forEach(function (n) { document.addEventListener(n, onGesture, { capture: true, passive: true }); });
  render();
})();
