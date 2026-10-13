import { createCarousel } from './carousel.js';
import { mountElements } from './lifecycle.js';

export function initSliders(root = document) {
  mountElements(root, '[data-slider]', (slider, signal) => {
    const track = slider.querySelector('.slider__track');
    if (!track?.children.length) return false;
    let carousel;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) initialize();
    }, { rootMargin: '300px' });
    function initialize() {
      if (carousel || signal.aborted || !slider.isConnected) return;
      observer.disconnect();
      carousel = createCarousel(slider, {
        tracks: [track],
        onChange: ({ index }) => { slider.dataset.sliderIndex = String(index); },
      });
    }
    slider.addEventListener('click', initialize, { signal, capture: true });
    slider.addEventListener('keydown', initialize, { signal, capture: true });
    observer.observe(slider);
    return () => {
      observer.disconnect();
      carousel?.destroy();
      delete slider.dataset.sliderIndex;
    };
  });
}
