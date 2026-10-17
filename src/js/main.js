import { initSliders } from './modules/slider.js';
import { initLightbox, closeLightbox } from './modules/lightbox.js';
import { initTabs } from './modules/tabs.js';
import { initNavigation } from './modules/navigation.js';
import { findElements, isMounted, unmountElements } from './modules/lifecycle.js';

const pending = new Map();
const modules = [
  { selector: '[data-hero]', load: () => import('./modules/hero.js'), initialize: 'initHero' },
  { selector: '[data-catalog]', load: () => import('./pages/catalog.js'), initialize: 'initCatalog' },
  { selector: '[data-catalog-filter][data-catalog-demo]', load: () => import('./pages/catalog-demo.js'), initialize: 'initCatalogDemo' },
  { selector: '[data-product-detail]', load: () => import('./pages/product.js'), initialize: 'initProduct' },
  { selector: '[data-product-gallery]', load: () => import('./modules/product-gallery.js'), initialize: 'initProductGallery' },
  { selector: '[data-contacts-form], [data-contacts-addresses]', load: () => import('./pages/contacts.js'), initialize: 'initContacts' },
];
const selector = ['[data-navigation]', '[data-slider]', '[data-tabs]', ...modules.map(module => module.selector)].join(', ');

async function init(root = document) {
  if (!root?.querySelectorAll) throw new TypeError('Expected a DOM container.');
  initLightbox();
  initSliders(root);
  initTabs(root);
  initNavigation(root);
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
