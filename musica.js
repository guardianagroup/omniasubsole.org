/* Omnia Sub Sole · música de fondo generada en el navegador (Web Audio).
   «Horizonte»: acordes suaves y consonantes que se funden despacio, sin melodía,
   sin ruidos ni golpes. Empieza con la primera interacción del visitante
   (norma de los navegadores) y se silencia con el botón de la esquina superior derecha. */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;

  function createEngine(ctx) {
    var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    var master = ctx.createGain(); master.gain.value = 0;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 55;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.knee.value = 14; comp.ratio.value = 2.5;
    comp.attack.value = 0.1; comp.release.value = 0.8;
    master.connect(hp); hp.connect(comp); comp.connect(ctx.destination);

    // Espacio amplio: reverberación larga y suave.
    function impulse(sec, decay) {
      var rate = ctx.sampleRate, len = Math.floor(rate * sec), b = ctx.createBuffer(2, len, rate);
      for (var c = 0; c < 2; c++) {
        var d = b.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return b;
    }
    var dry = ctx.createGain(); dry.gain.value = 0.5; dry.connect(master);
    var rev = ctx.createConvolver(); rev.buffer = impulse(6, 3);
    var revTone = ctx.createBiquadFilter(); revTone.type = 'lowpass'; revTone.frequency.value = 3500;
    var wet = ctx.createGain(); wet.gain.value = 0.85;
    rev.connect(revTone); revTone.connect(wet); wet.connect(master);
    function send(node, amount) {
      node.connect(dry);
      var s = ctx.createGain(); s.gain.value = amount; node.connect(s); s.connect(rev);
    }

    // Acordes abiertos y consonantes (fa, si bemol sobre fa, re menor, do sus2),
    // sin roces de semitono ni dentro de cada acorde ni al pasar de uno a otro.
    var CHORDS = [[41, 48, 55, 57, 60], [41, 46, 53, 60, 62], [38, 50, 57, 62, 65], [36, 48, 55, 62, 67]];
    var STEP = 22, OVERLAP = 10, ci = 0, nextChord = 0;

    function wash(n, t, dur) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.linearRampToValueAtTime(2200, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(1000, t + dur);
      var g = ctx.createGain(), peak = 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 9);
      g.gain.setValueAtTime(peak, t + dur - 10);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      n.forEach(function (m, i) {
        var vs = i === 0 ? [['sine', 0, 0.45, 0]] : [['sine', -7, 1, 0], ['sine', 7, 1, 0], ['triangle', 0, 0.7, 0]];
        if (i >= n.length - 3) vs.push(['sine', 4, 0.9, 12]);
        vs.forEach(function (v) {
          var o = ctx.createOscillator(), og = ctx.createGain();
          o.type = v[0]; o.frequency.value = mtof(m + v[3]); o.detune.value = v[1] + rnd(-2, 2);
          og.gain.value = v[2]; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.1);
        });
      });
      // brillo muy tenue dos octavas arriba que aparece y se va
      var sh = ctx.createOscillator(), sg = ctx.createGain();
      sh.type = 'sine'; sh.frequency.value = mtof(n[n.length - 1] + 24);
      sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(0.12, t + dur * 0.5); sg.gain.linearRampToValueAtTime(0.0001, t + dur);
      sh.connect(sg); sg.connect(g); sh.start(t); sh.stop(t + dur + 0.1);
      lp.connect(g); send(g, 0.7);
    }

    function schedule(until) {
      while (nextChord < until) { wash(CHORDS[ci % CHORDS.length], nextChord, STEP + OVERLAP); ci++; nextChord += STEP; }
    }
    function begin() { nextChord = ctx.currentTime + 0.1; schedule(ctx.currentTime + 10); }
    function fadeTo(v, sec) {
      var t = ctx.currentTime, g = master.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + sec);
    }
    return { ctx: ctx, begin: begin, schedule: schedule, fadeTo: fadeTo, begun: false };
  }

  if (window.__ossMusicaTest) { window.__ossMusicaTest = createEngine; return; }
  if (!AC) return;

  var KEY = 'oss-musica', VOL = 0.5;
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
