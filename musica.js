/* Omnia Sub Sole · música de fondo generada en el navegador (Web Audio).
   Sin grabaciones: bordón grave, coro lejano y campana de claustro.
   Empieza con la primera interacción del visitante (norma de los navegadores)
   y se silencia con el botón fijo de la esquina superior derecha. */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;

  function createEngine(ctx) {
    var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    var master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3;
    comp.attack.value = 0.05; comp.release.value = 0.5;
    master.connect(comp); comp.connect(ctx.destination);

    // Reverberación de nave de piedra: respuesta de ruido con caída exponencial.
    function impulse(sec, decay) {
      var rate = ctx.sampleRate, len = Math.floor(rate * sec), b = ctx.createBuffer(2, len, rate);
      for (var c = 0; c < 2; c++) {
        var d = b.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return b;
    }
    var dry = ctx.createGain(); dry.gain.value = 0.55; dry.connect(master);
    var rev = ctx.createConvolver(); rev.buffer = impulse(5.5, 2.6);
    var wet = ctx.createGain(); wet.gain.value = 0.9; rev.connect(wet); wet.connect(master);
    function send(node, amount) {
      node.connect(dry);
      var s = ctx.createGain(); s.gain.value = amount; node.connect(s); s.connect(rev);
    }
    function lfo(freq, depth, param) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(param); o.start();
    }

    // Bordón: re grave, re y la, con una respiración muy lenta.
    (function () {
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 0.5;
      var g = ctx.createGain(); g.gain.value = 0.13;
      [[38, 'sine', 0.5, 0], [50, 'sine', 0.55, 0], [50, 'triangle', 0.3, 4], [57, 'sine', 0.35, -3]].forEach(function (v) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = v[1]; o.frequency.value = mtof(v[0]); o.detune.value = v[3];
        og.gain.value = v[2]; o.connect(og); og.connect(f); o.start();
      });
      lfo(0.043, 0.06, g.gain);
      lfo(0.017, 140, f.frequency);
      f.connect(g); send(g, 0.45);
    })();

    // Coro lejano: acordes modales (re dórico) con vocal «a».
    var CHORDS = [
      [50, 57, 62, 65, 69, 76],  // re menor con novena
      [46, 58, 62, 65, 69, 74],  // si bemol con séptima mayor
      [43, 55, 62, 65, 70, 74],  // sol menor con séptima
      [45, 57, 62, 64, 69, 76]   // la suspendido
    ];
    function chord(notes, t, dur) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
      lp.frequency.setValueAtTime(1300, t);
      lp.frequency.linearRampToValueAtTime(2600, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(1400, t + dur);
      var f1 = ctx.createBiquadFilter(); f1.type = 'peaking'; f1.frequency.value = 800; f1.Q.value = 2; f1.gain.value = 8;
      var f2 = ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 1200; f2.Q.value = 2.5; f2.gain.value = 6;
      var g = ctx.createGain(), peak = 0.022;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 7);
      g.gain.setValueAtTime(peak, t + dur - 8);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      notes.forEach(function (m) {
        [-8, 8].forEach(function (c) {
          var o = ctx.createOscillator();
          o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = c + rnd(-3, 3);
          o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
        });
      });
      lp.connect(f1); f1.connect(f2); f2.connect(g); send(g, 0.75);
    }

    // Campana de claustro: parciales inarmónicos y caída larga.
    var BELL = [69, 74, 77, 79, 81, 86];
    function bell(m, t, v) {
      var f0 = mtof(m);
      [[1, 1, 6], [2, 0.3, 3.5], [2.76, 0.2, 2.5], [5.4, 0.07, 1.2]].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f0 * p[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v * p[1], t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
        o.connect(g); send(g, 0.9); o.start(t); o.stop(t + p[2] + 0.05);
      });
    }

    var STEP = 18, OVERLAP = 5, ci = 0, nextChord = 0, nextBell = 0;
    function schedule(until) {
      while (nextChord < until) {
        chord(CHORDS[ci % CHORDS.length], nextChord, STEP + OVERLAP);
        ci++; nextChord += STEP;
      }
      while (nextBell < until) {
        var k = Math.floor(Math.random() * BELL.length);
        bell(BELL[k], nextBell, rnd(0.03, 0.05));
        if (Math.random() < 0.3 && k > 1) bell(BELL[k - 2], nextBell + rnd(1.2, 2.2), rnd(0.02, 0.032));
        nextBell += rnd(6, 13);
      }
    }
    function begin() {
      var t = ctx.currentTime;
      nextChord = t + 0.1; nextBell = t + rnd(4, 7);
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

  var KEY = 'oss-musica', VOL = 0.8;
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
