import gsap from '../vendor/gsap.js?v=b6ce846ced1e';
import { mountElements } from './lifecycle.js?v=b6ce846ced1e';

export function initTabs(root = document) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  mountElements(root, '[data-tabs]', (section, signal) => {
    const tabs = Array.from(section.querySelectorAll('[role="tab"]')).filter(tab => tab.closest('[data-tabs]') === section);
    const panels = new Map(Array.from(section.querySelectorAll('[role="tabpanel"]')).filter(panel => panel.closest('[data-tabs]') === section).map(panel => [panel.id, panel]));
    if (!tabs.length || tabs.some(tab => !panels.has(tab.getAttribute('aria-controls')))) return false;

    function selectTab(selected, animate = false) {
      for (const tab of tabs) {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = panels.get(tab.getAttribute('aria-controls'));
        panel.hidden = !active;
        if (active && animate && !reducedMotion.matches) {
          const items = Array.from(panel.children);
          if (items.length) {
            gsap.fromTo(
              items,
              { autoAlpha: 0, y: 10 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.04,
                ease: 'power2.out',
                clearProps: 'opacity,visibility,transform',
                overwrite: 'auto',
              }
            );
          }
        }
      }
    }

    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab, true), { signal });
      tab.addEventListener('keydown', event => {
        const index = tabs.indexOf(tab);
        let next;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === 'Home') next = tabs[0];
        if (event.key === 'End') next = tabs.at(-1);
        if (!next) return;
        event.preventDefault();
        selectTab(next, true);
        next.focus();
      }, { signal });
    }
    selectTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0], false);
  });
}

