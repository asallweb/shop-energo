import gsap from 'gsap';
import { mountElements } from './lifecycle.js';

const groupSelectors = [
  '.category-directory__list > li',
  '.services > .services__item',
  '.advantages__list > .advantages__item',
  '.news__list:not([hidden]) > .news__card',
  '.catalog-list > .catalog-product:not([hidden])',
  '.payment-methods__list > .payment-methods__card',
  '.payment-documents__list > .payment-documents__item',
  '.delivery-terms > .delivery-terms__item',
  '.delivery-regions__steps > .delivery-regions__step',
  '.delivery-receiving__list > .delivery-receiving__item',
  '.contacts-details > .contacts-details__card',
  '.numbered-cards__list > .numbered-cards__item',
  '.product-conditions__list > .product-conditions__card',
];

const blockSelectors = [
  '.sidebar > *',
  '.page__content > *',
  '.catalog__body > *',
  '.product-detail > *',
  '.product-detail__upper > *',
  '.product-detail__information > *',
  '.footer__content > *',
  '.footer__mobile > *',
];

export function initReveal(root = document) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  mountElements(root, '.site-page', (page, signal) => {
    const animated = new WeakSet();
    const pendingGroups = new Map();
    const tweens = new Set();

    const childElements = new Set();
    for (const selector of groupSelectors) {
      for (const el of page.querySelectorAll(selector)) {
        if (!el.hasAttribute('data-carousel-clone')) childElements.add(el);
      }
    }

    const targets = new Set();
    for (const selector of blockSelectors) {
      for (const el of page.querySelectorAll(selector)) {
        if (el.hasAttribute('hidden') || el.matches('template')) continue;
        targets.add(el);
      }
    }
    for (const el of childElements) {
      targets.add(el);
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const initialBatch = [];
    const scrollBatch = [];

    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.top < viewportHeight * 0.92 && rect.bottom > 0) {
        initialBatch.push(el);
      } else if (rect.top >= viewportHeight * 0.92) {
        scrollBatch.push(el);
      }
    }

    if (initialBatch.length) {
      for (const el of initialBatch) animated.add(el);
      const tween = gsap.fromTo(
        initialBatch,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
          overwrite: 'auto',
        }
      );
      tweens.add(tween);
    }

    for (const el of scrollBatch) {
      gsap.set(el, { autoAlpha: 0, y: 18 });
    }

    let frameId = 0;
    const queue = [];

    function flushQueue() {
      frameId = 0;
      if (!queue.length) return;
      const batch = queue.splice(0, queue.length);
      const tween = gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.055,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
        overwrite: 'auto',
      });
      tweens.add(tween);
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          observer.unobserve(el);
          if (animated.has(el)) continue;
          animated.add(el);
          queue.push(el);
        }
        if (queue.length && !frameId) {
          frameId = requestAnimationFrame(flushQueue);
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
    );

    for (const el of scrollBatch) {
      observer.observe(el);
    }

    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      pendingGroups.clear();
      for (const tween of tweens) tween.kill();
      for (const el of targets) {
        gsap.set(el, { clearProps: 'opacity,visibility,transform' });
      }
    });
  });
}
