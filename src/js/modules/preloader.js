import { mountElements } from './lifecycle.js';

export function initPreloader(root = document) {
  mountElements(root, '[data-preloader]', (preloader, signal) => {
    if (preloader.classList.contains('preloader--hidden') || preloader.hasAttribute('hidden')) return;

    const startTime = performance.now();
    const minDisplayMs = 500;
    const maxSafetyMs = 2500;
    let timerId = 0;
    let safetyId = 0;
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timerId);
      clearTimeout(safetyId);

      preloader.classList.add('preloader--loaded');
      preloader.setAttribute('aria-busy', 'false');

      const onTransitionEnd = () => {
        preloader.classList.add('preloader--hidden');
        preloader.setAttribute('hidden', '');
        preloader.removeEventListener('transitionend', onTransitionEnd);
      };

      preloader.addEventListener('transitionend', onTransitionEnd, { signal });
      timerId = setTimeout(onTransitionEnd, 600);
    }

    function scheduleDismiss() {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      timerId = setTimeout(dismiss, remaining);
    }

    if (document.readyState === 'complete') {
      scheduleDismiss();
    } else {
      window.addEventListener('load', scheduleDismiss, { once: true, signal });
      safetyId = setTimeout(scheduleDismiss, maxSafetyMs);
    }

    return () => {
      clearTimeout(timerId);
      clearTimeout(safetyId);
    };
  });
}
