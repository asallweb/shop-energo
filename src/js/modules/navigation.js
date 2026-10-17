import { mountElements } from './lifecycle.js';

export function initNavigation(root = document) {
  mountElements(root, '[data-navigation]', (header, signal) => {
    const menu = header.querySelector('[data-menu-toggle]');
    const search = header.querySelector('[data-search-toggle]');
    const compact = matchMedia('(max-width: 1199px)');
    const mobile = matchMedia('(max-width: 767px)');
    const hasMobileLayout = header.closest('.site-page');
    const mobileMenu = header.querySelector('.mobile-menu');

    function updateMenuTarget() {
      menu.setAttribute('aria-controls', mobile.matches && hasMobileLayout ? 'mobile-navigation' : 'main-navigation');
    }

    updateMenuTarget();
    mobileMenu.querySelector('[data-menu-close]').addEventListener('click', () => {
      close(menu, 'data-menu-open', 'Открыть меню');
      menu.focus();
    }, { signal });

    mobileMenu.querySelectorAll('[data-menu-section]').forEach(control => {
      control.addEventListener('click', () => {
        const open = control.getAttribute('aria-expanded') !== 'true';
        control.setAttribute('aria-expanded', String(open));
        mobileMenu.querySelector(`#${control.getAttribute('aria-controls')}`).hidden = !open;
      }, { signal });
    });

    mobileMenu.addEventListener('click', event => {
      if (event.target.closest('a')) close(menu, 'data-menu-open', 'Открыть меню');
    }, { signal });

    function close(control, attribute, label) {
      header.removeAttribute(attribute);
      control.setAttribute('aria-expanded', 'false');
      control.setAttribute('aria-label', label);
    }

    menu.addEventListener('click', () => {
      const open = header.toggleAttribute('data-menu-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      if (!mobile.matches) close(search, 'data-search-open', 'Открыть поиск');
    }, { signal });

    search.addEventListener('click', () => {
      const open = header.toggleAttribute('data-search-open');
      search.setAttribute('aria-expanded', String(open));
      search.setAttribute('aria-label', open ? 'Закрыть поиск' : 'Открыть поиск');
      close(menu, 'data-menu-open', 'Открыть меню');
      if (open) header.querySelector('.header__search-input').focus();
    }, { signal });

    header.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (header.hasAttribute('data-menu-open')) {
        close(menu, 'data-menu-open', 'Открыть меню');
        menu.focus();
      } else if (header.hasAttribute('data-search-open')) {
        close(search, 'data-search-open', 'Открыть поиск');
        search.focus();
      }
    }, { signal });

    header.querySelector('.header__nav').addEventListener('click', event => {
      if (event.target.closest('a')) close(menu, 'data-menu-open', 'Открыть меню');
    }, { signal });

    document.addEventListener('click', event => {
      if (mobile.matches && !header.contains(event.target)) close(menu, 'data-menu-open', 'Открыть меню');
    }, { signal });

    compact.addEventListener('change', () => close(menu, 'data-menu-open', 'Открыть меню'), { signal });
    mobile.addEventListener('change', () => {
      close(menu, 'data-menu-open', 'Открыть меню');
      close(search, 'data-search-open', 'Открыть поиск');
      updateMenuTarget();
    }, { signal });
    return () => {
      close(menu, 'data-menu-open', 'Открыть меню');
      close(search, 'data-search-open', 'Открыть поиск');
    };
  });
}
