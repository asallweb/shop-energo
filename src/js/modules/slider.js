import { createCarousel } from './carousel.js';

export function initSliders() {
  const observer = new IntersectionObserver(entries => {
    for (const { target: slider, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(slider);
      createCarousel(slider, {
        tracks: [slider.querySelector('.slider__track')],
        onChange: ({ index }) => { slider.dataset.sliderIndex = String(index); },
      });
    }
  }, { rootMargin: '300px' });
  document.querySelectorAll('[data-slider]').forEach(slider => observer.observe(slider));
}
