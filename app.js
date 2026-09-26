'use strict';

const root = document.documentElement;

const LABELS = {
  "es": [
    "Solicitud de participación · Omnia Sub Sole",
    "Nombre y apellidos",
    "Correo electrónico",
    "Ciudad / país",
    "Ámbito de interés",
    "Exposición"
  ],
  "en": [
    "Application to participate · Omnia Sub Sole",
    "Full name",
    "Email",
    "City / country",
    "Field of interest",
    "Statement"
  ],
  "de": [
    "Antrag auf Mitwirkung · Omnia Sub Sole",
    "Vor- und Nachname",
    "E-Mail",
    "Stadt / Land",
    "Interessengebiet",
    "Darlegung"
  ],
  "ru": [
    "Заявка на участие · Omnia Sub Sole",
    "Имя и фамилия",
    "Электронная почта",
    "Город / страна",
    "Область интересов",
    "Изложение"
  ],
  "zh": [
    "参与申请 · Omnia Sub Sole",
    "姓名",
    "电子邮箱",
    "城市／国家",
    "关注领域",
    "说明"
  ],
  "ja": [
    "参加申込 · Omnia Sub Sole",
    "氏名",
    "メールアドレス",
    "都市／国",
    "関心分野",
    "内容"
  ],
  "ar": [
    "طلب مشاركة · Omnia Sub Sole",
    "الاسم الكامل",
    "البريد الإلكتروني",
    "المدينة / البلد",
    "مجال الاهتمام",
    "البيان"
  ]
};
const form = document.getElementById('participation-form');
const result = document.getElementById('prepared-message');
const labels = LABELS[(root.lang || 'es').slice(0, 2)] || LABELS.es;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const trim = key => String(data.get(key) || '').trim();
  if (!trim('name') || !trim('message')) return;
  const interest = form.elements.interest.selectedOptions[0].textContent.trim();
  const message = [labels[0], '', `${labels[1]}: ${trim('name')}`, `${labels[2]}: ${trim('email')}`,
    ...(trim('location') ? [`${labels[3]}: ${trim('location')}`] : []),
    `${labels[4]}: ${interest}`, '', `${labels[5]}:`, trim('message')].join('\n');
  document.getElementById('send-email').href = `mailto:contact@omniasubsole.org?subject=${encodeURIComponent(labels[0])}&body=${encodeURIComponent(message)}`;
  document.getElementById('send-whatsapp').href = `https://wa.me/34621024973?text=${encodeURIComponent(message)}`;
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
});
form.addEventListener('input', () => { result.hidden = true; });
