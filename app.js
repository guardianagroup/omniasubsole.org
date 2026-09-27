'use strict';

const root = document.documentElement;
const LABELS = {
  "es": [
    "Solicitud del dossier informativo · Omnia Sub Sole",
    "Nombre y apellidos",
    "Correo electrónico",
    "Ciudad y país",
    "Idioma del dossier",
    "Ámbito de interés",
    "Observaciones"
  ],
  "en": [
    "Request for the information dossier · Omnia Sub Sole",
    "Full name",
    "Email address",
    "City and country",
    "Language of the dossier",
    "Field of interest",
    "Remarks"
  ],
  "de": [
    "Anforderung des Informationsdossiers · Omnia Sub Sole",
    "Vor- und Nachname",
    "E-Mail-Adresse",
    "Stadt und Land",
    "Sprache des Dossiers",
    "Interessengebiet",
    "Anmerkungen"
  ],
  "ru": [
    "Запрос информационного досье · Omnia Sub Sole",
    "Имя и фамилия",
    "Адрес электронной почты",
    "Город / страна",
    "Язык досье",
    "Область интересов",
    "Примечания"
  ],
  "zh": [
    "信息手册索取申请 · Omnia Sub Sole",
    "姓名",
    "电子邮箱",
    "城市及国家",
    "手册语言",
    "关注领域",
    "备注"
  ],
  "ja": [
    "案内資料の請求 · Omnia Sub Sole",
    "氏名",
    "メールアドレス",
    "都市・国",
    "資料の言語",
    "関心分野",
    "備考"
  ],
  "ar": [
    "طلب الملف التعريفي · Omnia Sub Sole",
    "الاسم الكامل",
    "البريد الإلكتروني",
    "المدينة / البلد",
    "لغة الملف",
    "مجال الاهتمام",
    "ملاحظات"
  ]
};
const labels = LABELS[(root.lang || 'es').slice(0, 2)] || LABELS.es;
const dialog = document.getElementById('dossier-dialog');
const form = document.getElementById('dossier-form');
const result = document.getElementById('prepared-message');

document.querySelectorAll('[data-dossier]').forEach(button => {
  button.addEventListener('click', event => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    dialog.showModal();
  });
});
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const trim = key => String(data.get(key) || '').trim();
  if (!trim('name')) return;
  const chosen = name => { const option = form.elements[name].selectedOptions[0]; return option && option.value ? option.textContent.trim() : ''; };
  const lines = [labels[0], '', `${labels[1]}: ${trim('name')}`, `${labels[2]}: ${trim('email')}`];
  if (trim('location')) lines.push(`${labels[3]}: ${trim('location')}`);
  lines.push(`${labels[4]}: ${chosen('dlang')}`);
  if (chosen('interest')) lines.push(`${labels[5]}: ${chosen('interest')}`);
  if (trim('message')) lines.push('', `${labels[6]}:`, trim('message'));
  const message = lines.join('\n');
  document.getElementById('send-email').href = `mailto:contact@omniasubsole.org?subject=${encodeURIComponent(labels[0])}&body=${encodeURIComponent(message)}`;
  document.getElementById('send-whatsapp').href = `https://wa.me/34621024973?text=${encodeURIComponent(message)}`;
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'nearest' });
});
form.addEventListener('input', () => { result.hidden = true; });

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
