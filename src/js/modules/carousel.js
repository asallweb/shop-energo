const instances = new WeakMap();

export function createCarousel(root, { tracks, onChange = () => {} }) {
  if (instances.has(root)) return instances.get(root);
  const count = tracks[0].children.length;
  if (!count) return { goTo() {}, next() {}, previous() {} };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = tracks.map(track => {
    const originals = Array.from(track.children);
    if (count > 1) {
      const clone = item => {
        const copy = item.cloneNode(true);
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        return copy;
      };
      track.prepend(...originals.map(clone));
      track.append(...originals.map(clone));
    }
    return { track, viewport: track.parentElement, items: Array.from(track.children) };
  });
  const queue = [];
  let position = count > 1 ? count : 0;
  let moving = false;
  let timer;

  function render(animate) {
    for (const { track, viewport, items } of rows) {
      const start = items[position].offsetLeft;
      track.classList.toggle('slider__track--reset', !animate);
      track.style.transform = `translateX(-${start}px)`;
      for (const item of items) {
        item.inert = item.offsetLeft + item.offsetWidth <= start + 1 || item.offsetLeft >= start + viewport.clientWidth - 1;
        item.setAttribute('aria-hidden', String(item.inert));
        if (item.inert && item.contains(document.activeElement)) {
          const replacement = items[position].querySelector('a, button') || root.querySelector('[data-carousel-next], [data-carousel-go-to]');
          replacement?.focus({ preventScroll: true });
        }
      }
    }
    root.dataset.carouselIndex = String(position % count);
    root.dataset.carouselMoving = String(moving);
    root.dataset.carouselPending = String(queue.length);
    onChange({ index: position % count, moving, count });
  }

  function finish() {
    if (!moving) return;
    clearTimeout(timer);
    moving = false;
    position = count + (position % count);
    render(false);
    requestAnimationFrame(() => {
      if (queue.length) {
        const request = queue.shift();
        root.dataset.carouselPending = String(queue.length);
        move(request);
      }
    });
  }

  function move(request) {
    if (count < 2) return;
    if (moving) {
      if (queue.length < 10) queue.push(request);
      root.dataset.carouselPending = String(queue.length);
      return;
    }
    let distance = request.direction;
    if (request.index !== undefined) {
      distance = (request.index - (position % count) + count) % count;
      if (distance > count / 2) distance -= count;
    }
    if (!distance) {
      root.dataset.carouselPending = String(queue.length);
      if (queue.length) move(queue.shift());
      return;
    }
    moving = true;
    position += distance;
    render(!reducedMotion.matches);
    if (reducedMotion.matches) finish();
    else timer = setTimeout(finish, 450);
  }

  root.addEventListener('click', event => {
    const control = event.target.closest('[data-carousel-previous], [data-carousel-next], [data-carousel-go-to]');
    if (!control || !root.contains(control) || control.inert) return;
    if (control.hasAttribute('data-carousel-go-to')) move({ index: Number(control.dataset.carouselGoTo) });
    else move({ direction: control.hasAttribute('data-carousel-next') ? 1 : -1 });
  });
  root.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move({ direction: event.key === 'ArrowLeft' ? -1 : 1 });
  });
  rows[0].track.addEventListener('transitionend', event => {
    if (event.target === rows[0].track && event.propertyName === 'transform') finish();
  });
  const observer = new ResizeObserver(() => { if (!moving) render(false); });
  rows.forEach(({ viewport }) => observer.observe(viewport));
  const controls = { goTo: index => move({ index }), next: () => move({ direction: 1 }), previous: () => move({ direction: -1 }) };
  instances.set(root, controls);
  render(false);
  return controls;
}
