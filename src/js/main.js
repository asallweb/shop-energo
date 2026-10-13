import { initSliders } from './modules/slider.js';
import { initLightbox } from './modules/lightbox.js';
import { initTabs } from './modules/tabs.js';

initSliders();
initLightbox();
initTabs();

const pages = {
  index: () => import('./modules/hero.js').then(({ initHero }) => initHero()),
  catalog: () => import('./pages/catalog.js').then(({ initCatalog }) => initCatalog()),
  product: () => import('./pages/product.js').then(({ initProduct }) => initProduct()),
  contacts: () => import('./pages/contacts.js').then(({ initContacts }) => initContacts()),
};
pages[document.body.dataset.page]?.();
