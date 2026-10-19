import { createCarousel } from './carousel.js?v=b6ce846ced1e';
import { mountElements } from './lifecycle.js?v=b6ce846ced1e';

function createMobileGrid(slider, track) {
  const items = Array.from(track.children);
  let index = 0;

  function move(direction) {
    if (items.length < 3) return;
    const current = Array.from(track.children);
    if (direction > 0) track.append(...current.slice(0, 2));
    else track.prepend(...current.slice(-2));
    index = (index + direction * 2 + items.length) % items.length;
    slider.dataset.sliderIndex = String(index);
  }

  function click(event) {
    const button = event.target.closest('[data-carousel-next], [data-carousel-previous]');
    if (button && slider.contains(button)) move(button.hasAttribute('data-carousel-next') ? 1 : -1);
  }

  function keydown(event) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  }

  slider.addEventListener('click', click);
  slider.addEventListener('keydown', keydown);
  slider.dataset.sliderIndex = '0';
  return {
    destroy() {
      slider.removeEventListener('click', click);
      slider.removeEventListener('keydown', keydown);
      track.append(...items);
      delete slider.dataset.sliderIndex;
    },
  };
}

export function initSliders(root = document) {
  mountElements(root, '[data-slider]', (slider, signal) => {
    const track = slider.querySelector('.slider__track');
    if (!track?.children.length) return false;
    let carousel;
    const mobile = matchMedia('(max-width: 767px)');
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) initialize();
    }, { rootMargin: '300px' });
    function initialize() {
      if (carousel || signal.aborted || !slider.isConnected || (slider.hasAttribute('data-static-mobile') && mobile.matches)) return;
      observer.disconnect();
      carousel = slider.hasAttribute('data-mobile-grid') && mobile.matches ? createMobileGrid(slider, track) : createCarousel(slider, {
        tracks: [track],
        onChange: ({ index }) => { slider.dataset.sliderIndex = String(index); },
      });
    }
    slider.addEventListener('click', initialize, { signal, capture: true });
    slider.addEventListener('keydown', initialize, { signal, capture: true });
    if (slider.hasAttribute('data-static-mobile') || slider.hasAttribute('data-mobile-grid')) mobile.addEventListener('change', () => {
      carousel?.destroy();
      carousel = undefined;
      delete slider.dataset.sliderIndex;
      initialize();
    }, { signal });
    observer.observe(slider);
    return () => {
      observer.disconnect();
      carousel?.destroy();
      delete slider.dataset.sliderIndex;
    };
  });
}
