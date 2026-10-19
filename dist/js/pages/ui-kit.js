import { mountElements } from '../modules/lifecycle.js?v=b6ce846ced1e';

export function initUiKit(root = document) {
  mountElements(root, '[data-ui-kit]', (kit, signal) => {
    kit.addEventListener('submit', event => {
      if (event.target.matches('.contacts-form')) {
        event.preventDefault();
        event.target.querySelector('[role="status"]').textContent = 'Демонстрация формы — данные не отправляются.';
      }
    }, { signal });
  });
}
