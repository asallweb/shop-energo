export function initSliders() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const slider of document.querySelectorAll('[data-slider]')) {
    const viewport = slider.querySelector('.slider__viewport');
    const track = slider.querySelector('.slider__track');
    const slides = Array.from(track.children);
    const count = slides.length;
    if (count < 2) continue;
    let position = count;
    let moving = false;
    let timer;
    const queue = [];
    const previous = slider.querySelector('[data-slider-previous]');
    const next = slider.querySelector('[data-slider-next]');

    track.prepend(...slides.map(slide => slide.cloneNode(true)));
    track.append(...slides.map(slide => slide.cloneNode(true)));
    const allSlides = Array.from(track.children);
    slider.dataset.sliderIndex = '0';

    function updateVisibility() {
      const start = allSlides[position].offsetLeft;
      for (const slide of allSlides) {
        slide.inert = slide.offsetLeft + slide.offsetWidth <= start + 1 || slide.offsetLeft >= start + viewport.clientWidth - 1;
        if (slide.inert && slide.contains(document.activeElement)) {
          next.focus({ preventScroll: true });
        }
      }
    }

    function render(animate) {
      track.classList.toggle('slider__track--reset', !animate);
      track.style.transform = `translateX(-${allSlides[position].offsetLeft}px)`;
      slider.dataset.sliderIndex = String(position % count);
      updateVisibility();
    }

    function finish() {
      if (!moving) return;
      clearTimeout(timer);
      moving = false;
      if (position < count || position >= count * 2) {
        position = count + (position % count);
        render(false);
      }
      requestAnimationFrame(() => {
        if (queue.length) move(queue.shift());
      });
    }

    function move(direction) {
      if (moving) {
        if (queue.length < 10) queue.push(direction);
        return;
      }
      moving = true;
      position += direction;
      render(!reducedMotion.matches);
      if (reducedMotion.matches) finish();
      else timer = window.setTimeout(finish, 450);
    }

    render(false);
    track.addEventListener('transitionend', event => {
      if (event.target === track && event.propertyName === 'transform') finish();
    });
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    slider.addEventListener('keydown', event => {
      if (event.target.matches('input, textarea, select')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    new ResizeObserver(() => {
      if (!moving) render(false);
    }).observe(viewport);
  }
}
