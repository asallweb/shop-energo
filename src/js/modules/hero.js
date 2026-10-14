import { createCarousel } from './carousel.js';
import { mountElements } from './lifecycle.js';

export function initHero(root = document) {
  mountElements(root, '[data-hero]', (hero, signal) => {
    const track = hero.querySelector('.slider__track');
    const pagination = hero.querySelector('[data-hero-pagination]');
    if (!track || !pagination) return false;
    const slides = Array.from(track.children).filter(item => !item.hasAttribute('data-carousel-clone'));
    const count = slides.length;
    if (!count) return false;
    pagination.replaceChildren();
    pagination.hidden = count < 2;
    for (let index = 0; index < count; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hero__dot';
      button.dataset.carouselGoTo = String(index);
      button.setAttribute('aria-label', `Показать предложение ${index + 1}`);
      pagination.append(button);
    }
    const mobile = matchMedia('(max-width: 767px)');
    let carousel;
    function update() {
      if (mobile.matches) {
        carousel?.destroy();
        carousel = undefined;
        return;
      }
      carousel ||= createCarousel(hero, {
      tracks: [track],
      onChange: ({ index }) => {
        pagination.querySelectorAll('button').forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
      },
      });
    }
    mobile.addEventListener('change', update, { signal });
    update();
    return () => {
      carousel?.destroy();
      pagination.replaceChildren();
    };
  });
}
