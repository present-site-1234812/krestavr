const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

function setMenuOpen(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('open', open);
}

menu.addEventListener('click', () => {
  setMenuOpen(menu.getAttribute('aria-expanded') !== 'true');
});
navigation.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    setMenuOpen(false);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) setMenuOpen(false);
});
window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
  if (event.matches) setMenuOpen(false);
});

const legalDetails = document.querySelector('#legal');
document.querySelectorAll('a[href="#legal"]').forEach(link => {
  link.addEventListener('click', () => { legalDetails.open = true; });
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#legal') legalDetails.open = true;
});
if (location.hash === '#legal') legalDetails.open = true;

const filters = document.querySelectorAll('[data-filter]');
const projectCards = document.querySelectorAll('.project-card');
filters.forEach(button => {
  button.addEventListener('click', () => {
    filters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    projectCards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' &&
        card.dataset.category !== button.dataset.filter;
    });
    const visibleCount = [...projectCards].filter(card => !card.hidden).length;
    document.querySelector('#filter-status').textContent =
      visibleCount === 1 ? 'Показана 1 концепция' : `Показаны ${visibleCount} концепции`;
    document.querySelector('.project-grid').classList.toggle(
      'is-filtered', button.dataset.filter !== 'all'
    );
  });
});

const projectDialog = document.querySelector('#project-dialog');
projectCards.forEach(card => {
  card.addEventListener('click', () => {
    const preview = document.querySelector('#dialog-image');
    const image = card.querySelector('img');
    preview.src = image.src;
    preview.alt = image.alt;
    preview.hidden = false;
    document.querySelector('#dialog-title').textContent = card.dataset.title;
    document.querySelector('#dialog-description').textContent = card.dataset.description;
    projectDialog.showModal();
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
});
document.querySelector('#dialog-contact').addEventListener('click', () => {
  projectDialog.close();
  // Move focus out of the closing dialog to the destination form.
  requestAnimationFrame(() => {
    document.querySelector('#name').focus({ preventScroll: true });
  });
});

const form = document.querySelector('#contact-form');
const fields = [...form.querySelectorAll('input, textarea')];
const requestFields = document.querySelector('#request-fields');

function clearPreparedRequest() {
  document.querySelector('#request-text').value = '';
  document.querySelector('#copy-status').textContent = '';
  fields.forEach(field => field.setCustomValidity(''));
}

form.addEventListener('reset', clearPreparedRequest);
window.addEventListener('pagehide', () => form.reset());
fields.forEach(field => {
  field.addEventListener('input', () => field.setCustomValidity(''));
});
form.addEventListener('submit', event => {
  event.preventDefault();
  for (const field of fields) {
    field.setCustomValidity(field.value.trim() ? '' : 'Заполните поле.');
  }
  const contact = document.querySelector('#contact-value');
  const value = contact.value.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validPhone = /^[+\d\s().-]+$/.test(value) &&
    value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15;
  if (value && !validEmail && !validPhone) {
    contact.setCustomValidity('Введите email или телефон с кодом страны.');
  }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  document.querySelector('#request-text').value =
    `Заявка на строительный проект\n\nИмя: ${data.get('name').trim()}\n` +
    `Контакт: ${data.get('contact').trim()}\n\nО проекте:\n${data.get('message').trim()}`;
  document.querySelector('#copy-status').textContent = '';
  document.querySelector('#request-dialog').showModal();
});
document.querySelector('#copy-request').addEventListener('click', async () => {
  const text = document.querySelector('#request-text');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(text.value);
    status.textContent = 'Текст заявки скопирован.';
  } catch {
    text.focus();
    text.select();
    status.textContent = 'Скопируйте выделенный текст вручную: Ctrl+C или меню копирования.';
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
// Keep the form inert if initialization fails or JavaScript is unavailable.
requestFields.disabled = false;
