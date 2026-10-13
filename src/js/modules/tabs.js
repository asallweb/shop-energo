export function initTabs() {
  for (const section of document.querySelectorAll('[data-tabs]')) {
    const tabs = Array.from(section.querySelectorAll('[role="tab"]'));

    function selectTab(selected) {
      for (const tab of tabs) {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
      }
    }

    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab));
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
      });
    }
  }
}
