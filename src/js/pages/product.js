import { initProductGallery } from '../modules/product-gallery.js';

export function initProduct() {
  const product = document.querySelector('[data-product-detail]');
  if (!product) return;

  initProductGallery(product.querySelector('[data-product-gallery]'));

  const compareButtons = product.querySelectorAll('[data-product-compare]');
  let compared = false;
  compareButtons.forEach(button => {
    button.addEventListener('click', () => {
      compared = !compared;
      compareButtons.forEach(control => {
        control.setAttribute('aria-pressed', String(compared));
        control.textContent = compared ? 'В сравнении' : 'Сравнить товар';
      });
    });
  });

  product.querySelector('[data-product-print]').addEventListener('click', () => window.print());

  const navigationLinks = product.querySelectorAll('.product-navigation__link');
  navigationLinks.forEach(link => {
    link.addEventListener('click', () => {
      navigationLinks.forEach(item => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'location');
    });
  });
}
