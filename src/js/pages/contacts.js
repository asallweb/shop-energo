export function initContacts() {
  const form = document.querySelector('[data-contacts-form]');
  if (!form) return;

  const code = form.elements.namedItem('code');
  const status = form.querySelector('[role="status"]');
  const originalStatus = status.textContent;

  code.addEventListener('input', () => {
    const value = code.value.trim().toLocaleUpperCase('ru-RU');
    code.setCustomValidity(value && value !== code.dataset.contactsCode ? 'Введите слово КОД, показанное слева.' : '');
  });
  form.addEventListener('input', () => {
    status.textContent = originalStatus;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = 'Отправка через форму пока не подключена. Напишите на shop-energo@mail.ru.';
  });

  document.querySelector('[data-contacts-addresses]').addEventListener('click', () => {
    form.elements.namedItem('message').focus({ preventScroll: true });
    form.scrollIntoView({ block: 'start' });
  });
}
