export function initCatalog() {
  const catalog = document.querySelector('[data-catalog]');
  if (!catalog) return;

  const form = catalog.querySelector('[data-catalog-filter]');
  const list = catalog.querySelector('[data-catalog-list]');
  const products = Array.from(list.children);
  const empty = catalog.querySelector('[data-catalog-empty]');
  const count = document.querySelector('[data-catalog-count]');
  const more = form.querySelector('[data-catalog-more]');
  const extra = form.querySelector('#catalog-extra');
  const all = form.querySelector('[data-catalog-all]');
  const load = form.querySelector('[data-catalog-load]');
  const powers = Array.from(catalog.querySelectorAll('[data-catalog-power]'));
  const compared = new Set();
  let criteria = {};
  let quickPower = null;
  let loadedBrand;

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
    const sort = catalog.querySelector('[name="catalog-sort"]:checked').value;
    const sorted = [...products].sort((a, b) => {
      if (sort === 'name') return a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent, 'ru');
      if (sort === 'new') return Number(b.dataset.new) - Number(a.dataset.new) || Number(a.dataset.index) - Number(b.dataset.index);
      if (sort === 'power') return Number(a.dataset.power) - Number(b.dataset.power) || Number(a.dataset.index) - Number(b.dataset.index);
      return Number(a.dataset.price) - Number(b.dataset.price) || Number(a.dataset.index) - Number(b.dataset.index);
    });
    list.append(...sorted);
    let visible = 0;
    for (const product of products) {
      product.hidden = !matches(product);
      if (!product.hidden) visible++;
    }
    empty.hidden = visible !== 0;
    const word = { one: 'товар', few: 'товара', many: 'товаров', other: 'товара' }[new Intl.PluralRules('ru').select(visible)];
    count.textContent = `Показано: ${visible} ${word}`;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    criteria = Object.fromEntries(new FormData(form));
    criteria.brands = new FormData(form).getAll('brand');
    quickPower = null;
    for (const button of powers) button.setAttribute('aria-pressed', 'false');
    render();
  });

  catalog.querySelector('[data-catalog-reset]').addEventListener('click', () => {
    form.reset();
    for (const checkbox of form.querySelectorAll('[type="checkbox"]')) checkbox.checked = false;
    all.indeterminate = false;
    criteria = {};
    quickPower = null;
    for (const button of powers) button.setAttribute('aria-pressed', 'false');
    render();
    form.querySelector('[name="power-min"]').focus({ preventScroll: true });
  });

  for (const radio of catalog.querySelectorAll('[name="catalog-sort"]')) radio.addEventListener('change', render);
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
    });
  }

  all.addEventListener('change', () => {
    for (const checkbox of form.querySelectorAll('[name="brand"]')) checkbox.checked = all.checked;
  });
  form.addEventListener('change', event => {
    if (event.target.name !== 'brand') return;
    const brands = Array.from(form.querySelectorAll('[name="brand"]'));
    all.checked = brands.every(checkbox => checkbox.checked);
    all.indeterminate = !all.checked && brands.some(checkbox => checkbox.checked);
  });

  function updateExpanded() {
    form.classList.toggle('catalog-filter--expanded', !extra.hidden || Boolean(loadedBrand));
  }

  more.addEventListener('click', () => {
    extra.hidden = !extra.hidden;
    more.setAttribute('aria-expanded', String(!extra.hidden));
    more.querySelector('span').textContent = extra.hidden ? 'Больше параметров' : 'Меньше параметров';
    updateExpanded();
  });

  load.addEventListener('click', () => {
    if (loadedBrand) {
      loadedBrand.remove();
      loadedBrand = null;
      load.textContent = 'Загрузить все';
    } else {
      loadedBrand = document.createElement('label');
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
  });

  for (const button of catalog.querySelectorAll('[data-catalog-compare]')) {
    button.addEventListener('click', () => {
      const product = button.closest('.catalog-product');
      if (compared.has(product)) compared.delete(product);
      else compared.add(product);
      button.setAttribute('aria-pressed', String(compared.has(product)));
      document.querySelector('[data-catalog-compare-count]').textContent = String(compared.size);
    });
  }
}
