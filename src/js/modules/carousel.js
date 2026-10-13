const instances = new WeakMap();

export function createCarousel(root, { tracks, onChange = () => {} }) {
  if (instances.has(root)) return instances.get(root);
  if (!tracks.length || tracks.some(track => !track)) return { goTo() {}, next() {}, previous() {}, destroy() {} };
  tracks.forEach(track => Array.from(track.children).filter(item => item.hasAttribute('data-carousel-clone')).forEach(item => item.remove()));
  const count = tracks[0].children.length;
  if (!count || tracks.some(track => track.children.length !== count)) return { goTo() {}, next() {}, previous() {}, destroy() {} };
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = tracks.map(track => {
    const originals = Array.from(track.children);
    const originalState = originals.map(item => ({ item, inert: item.inert, hidden: item.getAttribute('aria-hidden') }));
    const transform = track.style.transform;
    const reset = track.classList.contains('slider__track--reset');
    const clones = [];
    if (count > 1) {
      const clone = item => {
        const copy = item.cloneNode(true);
        copy.dataset.carouselClone = '';
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        clones.push(copy);
        return copy;
      };
      track.prepend(...originals.map(clone));
      track.append(...originals.map(clone));
    }
    return { track, viewport: track.parentElement, items: Array.from(track.children), clones, originalState, transform, reset };
  });
  const queue = [];
  let position = count > 1 ? count : 0;
  let moving = false;
  let timer;
  let frame;
  let destroyed = false;

  function render(animate) {
    if (destroyed) return;
    const measurements = rows.map(({ track, viewport, items }) => {
      const trackLeft = track.getBoundingClientRect().left;
      const bounds = items.map(item => item.getBoundingClientRect());
      const start = bounds[position].left - trackLeft;
      const end = start + viewport.clientWidth - 1;
      const hidden = bounds.map(rect => rect.right - trackLeft <= start + 1 || rect.left - trackLeft >= end);
      return { track, items, start, hidden };
    });
    for (const { track, items, start, hidden } of measurements) {
      track.classList.toggle('slider__track--reset', !animate);
      track.style.transform = `translateX(-${start}px)`;
      for (const [index, item] of items.entries()) {
        item.inert = hidden[index];
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
    if (destroyed || !moving) return;
    clearTimeout(timer);
    moving = false;
    position = count + (position % count);
    render(false);
    frame = requestAnimationFrame(() => {
      if (destroyed) return;
      if (queue.length) {
        const request = queue.shift();
        root.dataset.carouselPending = String(queue.length);
        move(request);
      }
    });
  }

  function move(request) {
    if (destroyed || count < 2 || !root.isConnected) return;
    if (request.index !== undefined && (!Number.isInteger(request.index) || request.index < 0 || request.index >= count)) return;
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
    if (!control || !root.contains(control) || control.inert || control.closest('[data-slider], [data-hero], [data-product-gallery]') !== root) return;
    if (control.hasAttribute('data-carousel-go-to')) move({ index: Number(control.dataset.carouselGoTo) });
    else move({ direction: control.hasAttribute('data-carousel-next') ? 1 : -1 });
  }, { signal });
  root.addEventListener('keydown', event => {
    if (event.target.closest('[data-slider], [data-hero], [data-product-gallery]') !== root) return;
    if (event.target.matches('input, textarea, select') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move({ direction: event.key === 'ArrowLeft' ? -1 : 1 });
  }, { signal });
  rows[0].track.addEventListener('transitionend', event => {
    if (event.target === rows[0].track && event.propertyName === 'transform') finish();
  }, { signal });
  const observer = new ResizeObserver(() => { if (!moving) render(false); });
  rows.forEach(({ viewport }) => observer.observe(viewport));
  const controls = {
    goTo: index => move({ index }),
    next: () => move({ direction: 1 }),
    previous: () => move({ direction: -1 }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controller.abort();
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      queue.length = 0;
      for (const { track, clones, originalState, transform, reset } of rows) {
        clones.forEach(item => item.remove());
        track.style.transform = transform;
        track.classList.toggle('slider__track--reset', reset);
        for (const { item, inert, hidden } of originalState) {
          item.inert = inert;
          if (hidden === null) item.removeAttribute('aria-hidden');
          else item.setAttribute('aria-hidden', hidden);
        }
      }
      delete root.dataset.carouselIndex;
      delete root.dataset.carouselMoving;
      delete root.dataset.carouselPending;
      instances.delete(root);
    },
  };
  instances.set(root, controls);
  render(false);
  return controls;
}
