import gsap from '../vendor/gsap.js?v=b6ce846ced1e';
import { mountElements } from '../modules/lifecycle.js?v=b6ce846ced1e';

export function initCatalogDemo(root = document) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  mountElements(root, '[data-catalog-filter][data-catalog-demo]', (form, signal) => {
    const catalog = form.closest('[data-catalog]');
    if (!catalog) return false;
    const snapshots = new Map();
    const count = catalog.querySelector('[data-catalog-count]');
    const empty = catalog.querySelector('[data-catalog-empty]');
    const originalCount = count?.textContent;
    const originalEmpty = empty?.hidden;
    let renderedCount;
    let renderedEmpty;
    let criteria = {};
    let generatedBrand;

    function inRange(value, min, max) {
      return (min === '' || min === undefined || value >= Number(min)) && (max === '' || max === undefined || value <= Number(max));
    }

    function matches(product) {
      const data = product.dataset;
      if (criteria.brands?.length && !criteria.brands.includes(data.brand)) return false;
      for (const field of ['fuel', 'voltage', 'start', 'housing', 'avr', 'welding']) {
        if (criteria[field] && criteria[field] !== data[field]) return false;
      }
      if (!inRange(Number(data.price), criteria['price-min'], criteria['price-max'])) return false;
      if (!inRange(Number(data.power), criteria['power-min'], criteria['power-max'])) return false;
      return true;
    }

    function render() {
      const list = catalog.querySelector('[data-catalog-list]');
      if (!list) return;
      const products = Array.from(list.children);
      if (!snapshots.has(list)) snapshots.set(list, []);
      const snapshot = snapshots.get(list);
      const recorded = new Set(snapshot.map(({ product }) => product));
      for (const product of products) {
        if (!recorded.has(product)) snapshot.push({ product, hidden: product.hidden });
      }
      const sort = catalog.querySelector('[name="catalog-sort"]:checked')?.value || 'price';
      products.sort((a, b) => {
        if (sort === 'name') return a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent, 'ru');
        if (sort === 'new') return Number(b.dataset.new) - Number(a.dataset.new) || Number(a.dataset.index) - Number(b.dataset.index);
        if (sort === 'power') return Number(a.dataset.power) - Number(b.dataset.power) || Number(a.dataset.index) - Number(b.dataset.index);
        return Number(a.dataset.price) - Number(b.dataset.price) || Number(a.dataset.index) - Number(b.dataset.index);
      });
      list.append(...products);
      let visible = 0;
      const visibleProducts = [];
      for (const product of products) {
        product.hidden = !matches(product);
        if (!product.hidden) {
          visible++;
          visibleProducts.push(product);
        }
      }
      if (visibleProducts.length && !reducedMotion.matches) {
        gsap.fromTo(
          visibleProducts,
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.035,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            overwrite: 'auto',
          }
        );
      }
      const empty = catalog.querySelector('[data-catalog-empty]');
      if (empty) {
        empty.hidden = visible !== 0;
        renderedEmpty = empty.hidden;
      }
      const count = catalog.querySelector('[data-catalog-count]');
      const word = { one: 'товар', few: 'товара', many: 'товаров', other: 'товара' }[new Intl.PluralRules('ru').select(visible)];
      if (count) {
        count.textContent = `Показано: ${visible} ${word}`;
        renderedCount = count.textContent;
      }
    }


    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      criteria = Object.fromEntries(data);
      criteria.brands = data.getAll('brand');
      for (const button of catalog.querySelectorAll('[data-catalog-power]')) button.setAttribute('aria-pressed', 'false');
      render();
      form.dispatchEvent(new CustomEvent('catalog:filter-applied', { bubbles: true }));
    }, { signal });
    form.addEventListener('catalog:power-change', () => {
      criteria['power-min'] = form.elements['power-min'].value;
      criteria['power-max'] = form.elements['power-max'].value;
      render();
    }, { signal });
    catalog.addEventListener('change', event => {
      if (event.target.matches('[name="catalog-sort"]')) render();
    }, { signal });
    catalog.addEventListener('click', event => {
      if (event.target.closest('[data-catalog-reset]')) {
        form.reset();
        for (const checkbox of form.querySelectorAll('[type="checkbox"]')) checkbox.checked = false;
        const all = form.querySelector('[data-catalog-all]');
        if (all) all.indeterminate = false;
        criteria = {};
        for (const button of catalog.querySelectorAll('[data-catalog-power]')) button.setAttribute('aria-pressed', 'false');
        render();
        form.dispatchEvent(new CustomEvent('catalog:filter-reset', { bubbles: true }));
      }
      const load = event.target.closest('[data-catalog-load]');
      if (!load || !form.contains(load)) return;
      if (generatedBrand) {
        generatedBrand.remove();
        generatedBrand = null;
        load.textContent = 'Загрузить все';
      } else {
        generatedBrand = document.createElement('label');
        generatedBrand.dataset.catalogLoadedBrand = '';
        generatedBrand.className = 'catalog-filter__brand';
        const checkbox = document.createElement('input');
        checkbox.className = 'catalog-filter__checkbox';
        checkbox.type = 'checkbox';
        checkbox.name = 'brand';
        checkbox.value = 'Ресанта';
        checkbox.checked = Boolean(form.querySelector('[data-catalog-all]')?.checked);
        generatedBrand.append(checkbox, 'Ресанта');
        load.before(generatedBrand);
        load.textContent = 'Скрыть';
      }
      form.dispatchEvent(new CustomEvent('catalog:brands-change', { bubbles: true }));
    }, { signal });

    return () => {
      for (const [list, snapshot] of snapshots) {
        if (!catalog.contains(list)) continue;
        for (const { product, hidden } of snapshot) {
          if (product.parentElement !== list) continue;
          product.hidden = hidden;
          list.append(product);
        }
      }
      if (count && catalog.contains(count) && count.textContent === renderedCount) count.textContent = originalCount;
      if (empty && catalog.contains(empty) && empty.hidden === renderedEmpty) empty.hidden = originalEmpty;
      if (generatedBrand) {
        generatedBrand.remove();
        const load = form.querySelector('[data-catalog-load]');
        if (load) load.textContent = 'Загрузить все';
        form.dispatchEvent(new CustomEvent('catalog:brands-change', { bubbles: true }));
      }
      snapshots.clear();
    };
  });
}
