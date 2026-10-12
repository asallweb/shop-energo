export function initSliders() {
  for (const slider of document.querySelectorAll('[data-slider]')) {
    const viewport = slider.querySelector('.slider__viewport');
    const track = slider.querySelector('.slider__track');
    const slides = Array.from(track.children);
    let index = 0;

    track.append(...slides.map(slide => slide.cloneNode(true)));
    slider.dataset.sliderIndex = '0';

    function updateVisibility() {
      const bounds = viewport.getBoundingClientRect();
      for (const slide of track.children) {
        const rect = slide.getBoundingClientRect();
        slide.inert = rect.right <= bounds.left + 1 || rect.left >= bounds.right - 1;
      }
    }

    updateVisibility();

    function move(direction) {
      index = (index + direction + slides.length) % slides.length;
      const first = slides[0].getBoundingClientRect().left;
      viewport.scrollLeft = slides[index].getBoundingClientRect().left - first;
      slider.dataset.sliderIndex = String(index);
      updateVisibility();
    }

    slider.querySelector('[data-slider-previous]').addEventListener('click', () => move(-1));
    slider.querySelector('[data-slider-next]').addEventListener('click', () => move(1));
    slider.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
  }
}
