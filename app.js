'use strict';

// ventanas de elección de idioma: dosier informativo (descarga directa del PDF) y carta del fundador
[['[data-dossier]', 'dossier-dialog'], ['[data-carta]', 'carta-dialog']].forEach(([selector, id]) => {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  document.querySelectorAll(selector).forEach(button => {
    button.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      dialog.showModal();
    });
  });
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  // el idioma elegido queda marcado y, en la descarga, confirmado con una línea de texto
  const links = [...dialog.querySelectorAll('.lang-list a')];
  const status = dialog.querySelector('.dl-status');
  links.forEach(link => link.addEventListener('click', () => {
    links.forEach(other => other.classList.toggle('chosen', other === link));
    if (status) { status.textContent = `${status.dataset.msg} ${link.textContent.trim()}`; status.hidden = false; }
  }));
  dialog.addEventListener('close', () => {
    links.forEach(link => link.classList.remove('chosen'));
    if (status) { status.hidden = true; status.textContent = ''; }
  });
});

// enlaces internos de la página («Estudios a realizar», volver arriba): desplazan sin dejar «#…» en la dirección
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView();
    if (link.classList.contains('skip-link')) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
});
// quien llega con una dirección antigua terminada en «#…» ve la sección y la dirección queda limpia
if (location.hash && document.getElementById(location.hash.slice(1))) {
  window.addEventListener('load', () => history.replaceState(null, '', location.pathname + location.search));
}

// pase de fotografías de la sede: flechas y teclado sobre el desplazamiento nativo
document.querySelectorAll('.gal').forEach(gal => {
  const track = gal.querySelector('.gal-track');
  if (!gal.querySelector('.gal-prev')) return;
  const slides = [...track.children];
  const prev = gal.querySelector('.gal-prev');
  const next = gal.querySelector('.gal-next');
  let near = false;
  let cur = 0;
  const index = () => Math.round(track.scrollLeft / track.clientWidth);
  const warm = i => { const img = slides[i] && slides[i].querySelector('img'); if (img) img.loading = 'eager'; };
  const update = () => {
    const i = cur;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    if (near) { warm(i - 1); warm(i + 1); }
  };
  const go = i => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    cur = i;
    warm(i);
    update();
    track.scrollTo({ left: i * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  prev.hidden = next.hidden = false;
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(cur + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(cur - 1); }
  });
  let timer;
  track.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(() => { cur = index(); update(); }, 120); }, { passive: true });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { near = true; update(); io.disconnect(); }
    }, { rootMargin: '300px 0px' });
    io.observe(gal);
  } else { near = true; }
  update();
});
