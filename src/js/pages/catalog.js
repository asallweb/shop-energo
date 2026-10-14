import { mountElements } from '../modules/lifecycle.js';

export function initCatalog(root = document) {
  mountElements(root, '[data-catalog]', (catalog, signal) => {

    const form = catalog.querySelector('[data-catalog-filter]');
    const list = catalog.querySelector('[data-catalog-list]');
    const mobileList = catalog.querySelector('[data-catalog-mobile-list]');
    const filterToggle = catalog.querySelector('[data-catalog-filter-toggle]');
    const mobile = matchMedia('(max-width: 767px)');
    const empty = catalog.querySelector('[data-catalog-empty]');
    const count = catalog.querySelector('[data-catalog-count]');
    const more = form?.querySelector('[data-catalog-more]');
    const extra = form?.querySelector('#catalog-extra');
    const all = form?.querySelector('[data-catalog-all]');
    const load = form?.querySelector('[data-catalog-load]');
    const powers = Array.from(catalog.querySelectorAll('[data-catalog-power]'));
    if (!form || !list || !empty || !more || !extra || !all || !load) return false;
    const compared = new Set(Array.from(catalog.querySelectorAll('[data-catalog-compare][aria-pressed="true"]')).map(button => button.closest('.catalog-product')));
    let criteria = {};
    const activePower = powers.find(button => button.getAttribute('aria-pressed') === 'true');
    let quickPower = activePower ? Number(activePower.dataset.catalogPower) : null;
    let loadedBrand = form.querySelector('[data-catalog-loaded-brand]');

    function setFilterOpen(open) {
      form.toggleAttribute('data-mobile-open', open);
      filterToggle?.setAttribute('aria-expanded', String(open));
    }

    filterToggle?.addEventListener('click', () => {
      setFilterOpen(!form.hasAttribute('data-mobile-open'));
    }, { signal });

    mobile.addEventListener('change', () => {
      setFilterOpen(false);
      render();
    }, { signal });

    function inRange(value, min, max) {
      return (min === '' || min === undefined || value >= Number(min)) && (max === '' || max === undefined || value <= Number(max));
    }

    function matches(product) {
      const data = product.dataset;
      if (criteria.brands?.length && !criteria.brands.includes(data.brand)) return false;
      for (const field of ['fuel', 'voltage', 'start', 'housing', 'avr']) {
        if (criteria[field] && criteria[field] !== data[field]) return false;
      }
      if (criteria.welding && criteria.welding !== data.welding) return false;
      if (!inRange(Number(data.price), criteria['price-min'], criteria['price-max'])) return false;
      if (!inRange(Number(data.power), criteria['power-min'], criteria['power-max'])) return false;
      return quickPower === null || (Number(data.power) >= quickPower && Number(data.power) < quickPower + 1);
    }

    function render() {
      const sort = catalog.querySelector('[name="catalog-sort"]:checked')?.value || 'price';
      let visible = 0;
      for (const productList of [list, mobileList].filter(Boolean)) {
        const products = Array.from(productList.children);
        const sorted = [...products].sort((a, b) => {
          if (sort === 'name') return a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent, 'ru');
          if (sort === 'new') return Number(b.dataset.new) - Number(a.dataset.new) || Number(a.dataset.index) - Number(b.dataset.index);
          if (sort === 'power') return Number(a.dataset.power) - Number(b.dataset.power) || Number(a.dataset.index) - Number(b.dataset.index);
          return Number(a.dataset.price) - Number(b.dataset.price) || Number(a.dataset.index) - Number(b.dataset.index);
        });
        productList.append(...sorted);
        for (const product of products) {
          product.hidden = !matches(product);
          if (!product.hidden && productList === (mobile.matches && mobileList ? mobileList : list)) visible++;
        }
      }
      empty.hidden = visible !== 0;
      const word = { one: 'товар', few: 'товара', many: 'товаров', other: 'товара' }[new Intl.PluralRules('ru').select(visible)];
      if (count) count.textContent = `Показано: ${visible} ${word}`;
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      criteria = Object.fromEntries(new FormData(form));
      criteria.brands = new FormData(form).getAll('brand');
      quickPower = null;
      for (const button of powers) button.setAttribute('aria-pressed', 'false');
      render();
      if (mobile.matches) setFilterOpen(false);
    }, { signal });

    catalog.querySelector('[data-catalog-reset]').addEventListener('click', () => {
      form.reset();
      for (const checkbox of form.querySelectorAll('[type="checkbox"]')) checkbox.checked = false;
      all.indeterminate = false;
      criteria = {};
      quickPower = null;
      for (const button of powers) button.setAttribute('aria-pressed', 'false');
      render();
      if (mobile.matches) setFilterOpen(true);
      form.querySelector('[name="power-min"]').focus({ preventScroll: true });
    }, { signal });

    for (const radio of catalog.querySelectorAll('[name="catalog-sort"]')) radio.addEventListener('change', render, { signal });
    for (const button of powers) {
      button.addEventListener('click', () => {
        const value = Number(button.dataset.catalogPower);
        quickPower = quickPower === value ? null : value;
        delete criteria['power-min'];
        delete criteria['power-max'];
        form.elements['power-min'].value = quickPower === null ? '' : String(quickPower);
        form.elements['power-max'].value = quickPower === null ? '' : String(quickPower + 1);
        for (const power of powers) power.setAttribute('aria-pressed', String(power === button && quickPower !== null));
        render();
      }, { signal });
    }

    all.addEventListener('change', () => {
      for (const checkbox of form.querySelectorAll('[name="brand"]')) checkbox.checked = all.checked;
    }, { signal });
    form.addEventListener('change', event => {
      if (event.target.name !== 'brand') return;
      const brands = Array.from(form.querySelectorAll('[name="brand"]'));
      all.checked = brands.every(checkbox => checkbox.checked);
      all.indeterminate = !all.checked && brands.some(checkbox => checkbox.checked);
    }, { signal });

    function updateExpanded() {
      form.classList.toggle('catalog-filter--expanded', !extra.hidden || Boolean(loadedBrand));
    }

    more.addEventListener('click', () => {
      extra.hidden = !extra.hidden;
      more.setAttribute('aria-expanded', String(!extra.hidden));
      more.querySelector('span').textContent = extra.hidden ? 'Больше параметров' : 'Меньше параметров';
      updateExpanded();
    }, { signal });

    load.addEventListener('click', () => {
      if (loadedBrand) {
        loadedBrand.remove();
        loadedBrand = null;
        load.textContent = 'Загрузить все';
      } else {
        loadedBrand = document.createElement('label');
        loadedBrand.dataset.catalogLoadedBrand = '';
        loadedBrand.className = 'catalog-filter__brand';
        const checkbox = document.createElement('input');
        checkbox.className = 'catalog-filter__checkbox';
        checkbox.type = 'checkbox';
        checkbox.name = 'brand';
        checkbox.value = 'Ресанта';
        checkbox.checked = all.checked;
        loadedBrand.append(checkbox, 'Ресанта');
        load.before(loadedBrand);
        load.textContent = 'Скрыть';
      }
      updateExpanded();
    }, { signal });

    catalog.addEventListener('click', event => {
      const button = event.target.closest('[data-catalog-compare]');
      if (!button || !catalog.contains(button)) return;
      const product = button.closest('.catalog-product');
      if (!product || !list.contains(product)) return;
      for (const selected of compared) if (!list.contains(selected)) compared.delete(selected);
      if (compared.has(product)) compared.delete(product);
      else compared.add(product);
      button.setAttribute('aria-pressed', String(compared.has(product)));
      const comparisonCount = catalog.querySelector('[data-catalog-compare-count]');
      if (comparisonCount) comparisonCount.textContent = String(compared.size);
    }, { signal });
    return () => compared.clear();
  });
}
