import { createCarousel } from './carousel.js';

export function initSliders() {
  for (const slider of document.querySelectorAll('[data-slider]')) {
    createCarousel(slider, {
      tracks: [slider.querySelector('.slider__track')],
      onChange: ({ index }) => { slider.dataset.sliderIndex = String(index); },
    });
  }
}
