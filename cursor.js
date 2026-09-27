/* Omnia Sub Sole · cursor en ordenador: luz de sol (halo cálido que sigue al ratón)
   y anillo dorado que sustituye al puntero y crece sobre enlaces, botones y fotos.
   Solo con ratón; en pantallas táctiles no hace nada. Con el formulario abierto
   se vuelve al puntero normal. */
(function () {
  'use strict';
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var glow = null, ring = null, dot = null, on = false, placed = false, raf = 0;
  var tx = 0, ty = 0, gx = 0, gy = 0, rx = 0, ry = 0;
  var GROW = 'a,button,[role="button"],label,summary,select,.gal img,.site-photo img';

  function make(cls) {
    var d = document.createElement('div');
    d.className = cls; d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
    return d;
  }
  function enable() {
    if (on) return;
    if (!glow) { glow = make('cur-glow'); ring = make('cur-ring'); dot = make('cur-dot'); }
    on = true; root.classList.add('cur-on');
  }
  function disable() {
    if (!on) return;
    on = false; root.classList.remove('cur-on', 'cur-in');
  }
  function dialogOpen() { return !!document.querySelector('dialog[open]'); }

  function frame() {
    raf = 0;
    var kg = reduce.matches ? 1 : 0.12, kr = reduce.matches ? 1 : 0.24;
    gx += (tx - gx) * kg; gy += (ty - gy) * kg;
    rx += (tx - rx) * kr; ry += (ty - ry) * kr;
    glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
    if (Math.abs(tx - gx) + Math.abs(ty - gy) + Math.abs(tx - rx) + Math.abs(ty - ry) > 0.4) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !fine.matches) return;
    if (dialogOpen()) { disable(); return; }
    enable();
    tx = e.clientX; ty = e.clientY;
    if (!placed) { gx = rx = tx; gy = ry = ty; placed = true; }
    root.classList.add('cur-in');
    kick();
  }, { passive: true });

  document.addEventListener('pointerover', function (e) {
    if (!on || !e.target || !e.target.closest) return;
    ring.classList.toggle('big', !!e.target.closest(GROW));
  }, { passive: true });
  document.addEventListener('pointerdown', function () { if (on) ring.classList.add('press'); }, { passive: true });
  document.addEventListener('pointerup', function () { if (on) ring.classList.remove('press'); }, { passive: true });
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) { root.classList.remove('cur-in'); placed = false; }
  });
  window.addEventListener('blur', function () { root.classList.remove('cur-in'); placed = false; });
})();
