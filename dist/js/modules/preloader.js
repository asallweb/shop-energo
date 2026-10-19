import { mountElements } from './lifecycle.js?v=b6ce846ced1e';

export function initPreloader(root = document) {
  mountElements(root, '[data-preloader]', (preloader, signal) => {
    if (preloader.classList.contains('preloader--hidden') || preloader.hasAttribute('hidden')) return;

    let timerId = 0;
    let frameId = 0;
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timerId);

      frameId = requestAnimationFrame(() => {
        preloader.classList.add('preloader--loaded');
        preloader.setAttribute('aria-busy', 'false');

        const onTransitionEnd = event => {
          if (event && event.target !== preloader) return;
          preloader.classList.add('preloader--hidden');
          preloader.setAttribute('hidden', '');
          preloader.removeEventListener('transitionend', onTransitionEnd);
        };

        preloader.addEventListener('transitionend', onTransitionEnd, { signal });
        timerId = setTimeout(onTransitionEnd, 400);
      });
    }

    timerId = setTimeout(dismiss, 400);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(frameId);
    };
  });
}


