import { mountElements } from '../modules/lifecycle.js';

export function initProduct(root = document) {
  mountElements(root, '[data-product-detail]', (product, signal) => {
    let compared = Boolean(product.querySelector('[data-product-compare][aria-pressed="true"]'));
    product.addEventListener('click', event => {
      const button = event.target.closest('[data-product-compare]');
      if (button && product.contains(button)) {
        event.preventDefault();
        compared = !compared;
        product.querySelectorAll('[data-product-compare]').forEach(control => {
          control.setAttribute('aria-pressed', String(compared));
          control.textContent = compared ? 'В сравнении' : 'Сравнить товар';
        });
      }
      if (event.target.closest('[data-product-print]')) {
        event.preventDefault();
        window.print();
      }
      const link = event.target.closest('.product-navigation__link');
      if (link && product.contains(link)) {
        product.querySelectorAll('.product-navigation__link').forEach(item => item.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'location');
      }
    }, { signal });
  });
}
