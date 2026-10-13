import { createCarousel } from './carousel.js';

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const track = hero.querySelector('.slider__track');
  const pagination = hero.querySelector('[data-hero-pagination]');
  const count = track.children.length;
  pagination.hidden = count < 2;
  for (let index = 0; index < count; index++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hero__dot';
    button.dataset.carouselGoTo = String(index);
    button.setAttribute('aria-label', `Показать предложение ${index + 1}`);
    pagination.append(button);
  }
  createCarousel(hero, {
    tracks: [track],
    onChange: ({ index }) => {
      pagination.querySelectorAll('button').forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
    },
  });
}
