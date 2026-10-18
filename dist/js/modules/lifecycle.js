const instances = new Map();

export function findElements(root, selector) {
  const elements = root.matches?.(selector) ? [root] : [];
  elements.push(...root.querySelectorAll(selector));
  return elements.filter(element => !element.closest('[data-carousel-clone]'));
}

export function isMounted(element) {
  return instances.has(element);
}

export function mountElements(root, selector, setup) {
  for (const element of findElements(root, selector)) {
    if (instances.has(element)) continue;
    const controller = new AbortController();
    let cleanup;
    try {
      cleanup = setup(element, controller.signal);
    } catch (error) {
      controller.abort();
      throw error;
    }
    if (cleanup === false) {
      controller.abort();
      continue;
    }
    instances.set(element, () => {
      instances.delete(element);
      controller.abort();
      cleanup?.();
    });
  }
}

export function unmountElements(root) {
  for (const [element, cleanup] of instances) {
    if (element === root || root.contains(element)) cleanup();
  }
}
