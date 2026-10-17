import { mountElements } from '../modules/lifecycle.js';

export function initCatalog(root = document) {
  mountElements(root, '[data-catalog]', (catalog, signal) => {
    const mobile = matchMedia('(max-width: 767px)');
    const compared = new Set(Array.from(catalog.querySelectorAll('[data-catalog-compare][aria-pressed="true"]')).map(button => button.closest('.catalog-product')));
    const getForm = () => catalog.querySelector('[data-catalog-filter]');
    const getToggle = () => catalog.querySelector('[data-catalog-filter-toggle]');

    function setOpen(open) {
      const form = getForm();
      form?.toggleAttribute('data-mobile-open', open);
      catalog.toggleAttribute('data-filter-open', open && Boolean(form));
      getToggle()?.setAttribute('aria-expanded', String(open && Boolean(form)));
      if (!open && mobile.matches && form?.contains(document.activeElement)) getToggle()?.focus({ preventScroll: true });
    }

    function updateExpanded(form) {
      const extra = form.querySelector('#catalog-extra');
      form.classList.toggle('catalog-filter--expanded', Boolean(extra && !extra.hidden) || Boolean(form.querySelector('[data-catalog-loaded-brand]')));
    }

    catalog.addEventListener('click', event => {
      const control = event.target.closest('button');
      if (!control || !catalog.contains(control)) return;
      const form = getForm();
      if (!form) return;
      if (control.matches('[data-catalog-filter-toggle]')) setOpen(!form.hasAttribute('data-mobile-open'));
      if (control.matches('[data-catalog-filter-close]')) {
        setOpen(false);
        getToggle()?.focus({ preventScroll: true });
      }
      if (control.matches('[data-catalog-more]')) {
        const extra = form.querySelector('#catalog-extra');
        if (!extra) return;
        extra.hidden = !extra.hidden;
        control.setAttribute('aria-expanded', String(!extra.hidden));
        control.querySelector('span').textContent = extra.hidden ? 'Больше параметров' : 'Меньше параметров';
        updateExpanded(form);
      }
      if (control.matches('[data-catalog-power]')) {
        const power = control.getAttribute('aria-pressed') === 'true' ? null : Number(control.dataset.catalogPower);
        form.elements['power-min'].value = power === null ? '' : String(power);
        form.elements['power-max'].value = power === null ? '' : String(power + 1);
        for (const button of catalog.querySelectorAll('[data-catalog-power]')) button.setAttribute('aria-pressed', String(button === control && power !== null));
        form.dispatchEvent(new CustomEvent('catalog:power-change', { bubbles: true, detail: { power } }));
      }
      if (control.matches('[data-catalog-compare]')) {
        const list = catalog.querySelector('[data-catalog-list]');
        const product = control.closest('.catalog-product');
        if (!product || !list?.contains(product)) return;
        for (const selected of compared) if (!list.contains(selected)) compared.delete(selected);
        if (control.getAttribute('aria-pressed') === 'true') compared.delete(product);
        else compared.add(product);
        control.setAttribute('aria-pressed', String(compared.has(product)));
        for (const count of catalog.querySelectorAll('[data-catalog-compare-count]')) count.textContent = String(compared.size);
      }
    }, { signal });

    catalog.addEventListener('change', event => {
      const form = getForm();
      if (!form?.contains(event.target)) return;
      const all = form.querySelector('[data-catalog-all]');
      if (!all) return;
      const brands = Array.from(form.querySelectorAll('[name="brand"]'));
      if (event.target === all) for (const checkbox of brands) checkbox.checked = all.checked;
      if (event.target.name === 'brand') {
        all.checked = brands.every(checkbox => checkbox.checked);
        all.indeterminate = !all.checked && brands.some(checkbox => checkbox.checked);
      }
    }, { signal });

    catalog.addEventListener('keydown', event => {
      if (event.key === 'Escape' && catalog.hasAttribute('data-filter-open')) {
        setOpen(false);
        getToggle()?.focus({ preventScroll: true });
      }
    }, { signal });
    catalog.addEventListener('catalog:filter-applied', () => {
      if (mobile.matches) setOpen(false);
    }, { signal });
    catalog.addEventListener('catalog:filter-reset', () => {
      if (mobile.matches) setOpen(true);
      getForm()?.querySelector('[name="power-min"]')?.focus({ preventScroll: true });
    }, { signal });
    catalog.addEventListener('catalog:brands-change', () => {
      const form = getForm();
      if (form) updateExpanded(form);
    }, { signal });
    mobile.addEventListener('change', () => setOpen(false), { signal });
    return () => {
      setOpen(false);
      compared.clear();
    };
  });
}
