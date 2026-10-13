import { mountElements } from '../modules/lifecycle.js';

export function initContacts(root = document) {
  mountElements(root, '[data-contacts-form]', (form, signal) => {

    const code = form.elements.namedItem('code');
    const status = form.querySelector('[role="status"]');
    if (!code || !status) return false;
    const originalStatus = status.textContent;

    code.addEventListener('input', () => {
      const value = code.value.trim().toLocaleUpperCase('ru-RU');
      code.setCustomValidity(value && value !== code.dataset.contactsCode ? 'Введите слово КОД, показанное слева.' : '');
    }, { signal });
    form.addEventListener('input', () => {
      status.textContent = originalStatus;
    }, { signal });
    form.addEventListener('submit', event => {
      event.preventDefault();
      status.textContent = 'Отправка через форму пока не подключена. Напишите на shop-energo@mail.ru.';
    }, { signal });
  });

  mountElements(root, '[data-contacts-addresses]', (button, signal) => {
    button.addEventListener('click', () => {
      const form = button.closest('.contacts')?.querySelector('[data-contacts-form]') || document.getElementById(button.getAttribute('aria-controls') || 'contacts-form');
      if (!form?.elements.namedItem('message')) return;
      form.elements.namedItem('message').focus({ preventScroll: true });
      form.scrollIntoView({ block: 'start' });
    }, { signal });
  });
}
