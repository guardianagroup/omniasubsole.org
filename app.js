'use strict';

const bar = document.querySelector('.topbar');
function syncBarHeight() {
  document.documentElement.style.setProperty('--bar-height', `${bar.offsetHeight}px`);
}
if ('ResizeObserver' in window) new ResizeObserver(syncBarHeight).observe(bar);
window.addEventListener('resize', syncBarHeight);
syncBarHeight();

const navLinks = [...document.querySelectorAll('.secnav a')];
function markSection(id) {
  for (const link of navLinks) {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
navLinks.forEach(link => link.addEventListener('click', () => markSection(link.hash.slice(1))));
let scheduled = false;
function updateSection() {
  let id = 'proposito';
  const edge = bar.offsetHeight + 90;
  for (const section of document.querySelectorAll('main > section[id]')) {
    if (section.getBoundingClientRect().top <= edge) id = section.id;
  }
  markSection(id);
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateSection); }
}, { passive: true });
updateSection();
document.querySelectorAll('.lang a').forEach(link => {
  link.addEventListener('click', () => {
    const url = new URL(link.href);
    url.hash = window.location.hash;
    link.href = url.href;
  });
});

const form = document.getElementById('participation-form');
const result = document.getElementById('prepared-message');
const en = document.documentElement.lang === 'en';
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const trim = key => String(data.get(key) || '').trim();
  if (!trim('name') || !trim('message')) return;
  const labels = en
    ? ['Application to participate · Omnia Sub Sole','Full name','Email','City / country','Field of interest','Statement']
    : ['Solicitud de participación · Omnia Sub Sole','Nombre y apellidos','Correo electrónico','Ciudad / país','Ámbito de interés','Exposición'];
  const interest = form.elements.interest.selectedOptions[0].textContent.trim();
  const message = [labels[0], '', `${labels[1]}: ${trim('name')}`, `${labels[2]}: ${trim('email')}`,
    ...(trim('location') ? [`${labels[3]}: ${trim('location')}`] : []),
    `${labels[4]}: ${interest}`, '', `${labels[5]}:`, trim('message')].join('\n');
  document.getElementById('send-email').href = `mailto:contacto@omniasubsole.org?subject=${encodeURIComponent(labels[0])}&body=${encodeURIComponent(message)}`;
  document.getElementById('send-whatsapp').href = `https://wa.me/34621024973?text=${encodeURIComponent(message)}`;
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
});
form.addEventListener('input', () => { result.hidden = true; });
