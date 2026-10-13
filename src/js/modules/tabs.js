import { mountElements } from './lifecycle.js';

export function initTabs(root = document) {
  mountElements(root, '[data-tabs]', (section, signal) => {
    const tabs = Array.from(section.querySelectorAll('[role="tab"]')).filter(tab => tab.closest('[data-tabs]') === section);
    const panels = new Map(Array.from(section.querySelectorAll('[role="tabpanel"]')).filter(panel => panel.closest('[data-tabs]') === section).map(panel => [panel.id, panel]));
    if (!tabs.length || tabs.some(tab => !panels.has(tab.getAttribute('aria-controls')))) return false;

    function selectTab(selected) {
      for (const tab of tabs) {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels.get(tab.getAttribute('aria-controls')).hidden = !active;
      }
    }

    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab), { signal });
      tab.addEventListener('keydown', event => {
        const index = tabs.indexOf(tab);
        let next;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === 'Home') next = tabs[0];
        if (event.key === 'End') next = tabs.at(-1);
        if (!next) return;
        event.preventDefault();
        selectTab(next);
        next.focus();
      }, { signal });
    }
    selectTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  });
}
