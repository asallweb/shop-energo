import { initSliders } from './modules/slider.js?v=b8e23316de5e';
import { initLightbox, closeLightbox } from './modules/lightbox.js?v=b8e23316de5e';
import { initTabs } from './modules/tabs.js?v=b8e23316de5e';
import { initNavigation } from './modules/navigation.js?v=b8e23316de5e';
import { initPreloader } from './modules/preloader.js?v=b8e23316de5e';
import { initReveal } from './modules/reveal.js?v=b8e23316de5e';
import { findElements, isMounted, unmountElements } from './modules/lifecycle.js?v=b8e23316de5e';

const pending = new Map();
const modules = [
  { selector: '[data-hero]', load: () => import('./modules/hero.js?v=b8e23316de5e'), initialize: 'initHero' },
  { selector: '[data-catalog]', load: () => import('./pages/catalog.js?v=b8e23316de5e'), initialize: 'initCatalog' },
  { selector: '[data-catalog-filter][data-catalog-demo]', load: () => import('./pages/catalog-demo.js?v=b8e23316de5e'), initialize: 'initCatalogDemo' },
  { selector: '[data-product-gallery]', load: () => import('./modules/product-gallery.js?v=b8e23316de5e'), initialize: 'initProductGallery' },
];
const selector = ['.site-page', '[data-preloader]', '[data-navigation]', '[data-slider]', '[data-tabs]', ...modules.map(module => module.selector)].join(', ');

async function init(root = document) {
  if (!root?.querySelectorAll) throw new TypeError('Expected a DOM container.');
  initPreloader(root);
  initLightbox();
  initSliders(root);
  initTabs(root);
  initNavigation(root);
  initReveal(root);

  const tasks = [];
  for (const module of modules) {
    for (const element of findElements(root, module.selector)) {
      if (isMounted(element)) continue;
      if (pending.has(element)) {
        tasks.push(pending.get(element).promise);
        continue;
      }
      const ticket = {};
      ticket.promise = module.load().then(exports => {
        if (pending.get(element) === ticket && element.isConnected) exports[module.initialize](element);
      }).finally(() => {
        if (pending.get(element) === ticket) pending.delete(element);
      });
      pending.set(element, ticket);
      tasks.push(ticket.promise);
    }
  }
  await Promise.all(tasks);
}

function destroy(root = document) {
  if (!root?.querySelectorAll) throw new TypeError('Expected a DOM container.');
  for (const element of pending.keys()) {
    if (element === root || root.contains(element)) pending.delete(element);
  }
  closeLightbox(root);
  unmountElements(root);
}

function report(error) {
  console.error('SHOP-ENERGO initialization failed:', error);
}

function start() {
  if (window.ShopEnergo) return;
  window.ShopEnergo = Object.freeze({
    init,
    destroy,
    refresh(root = document) {
      destroy(root);
      return init(root);
    },
  });
  document.addEventListener('shop-energo:init', event => init(event.detail?.root || document).catch(report));
  document.addEventListener('shop-energo:destroy', event => destroy(event.detail?.root || document));
  const observer = new MutationObserver(records => {
    const added = new Set();
    const removed = new Set();
    for (const record of records) {
      for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE && node.isConnected) added.add(node);
      for (const node of record.removedNodes) if (node.nodeType === Node.ELEMENT_NODE && !node.isConnected) removed.add(node);
    }
    removed.forEach(destroy);
    for (const node of added) {
      if (findElements(node, selector).length) init(node).catch(report);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  init(document).catch(report);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
