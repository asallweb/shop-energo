# CMS integration

Load `js/app.min.js` once as an ES module and deploy its accompanying `js/chunks/` directory. Import paths are relative to the bundle, so the theme may use a different base URL if it preserves that directory structure. Static HTML loads the complete external page CSS in the head before scripts. For CMS themes, `css/<page>.min.css` includes the common and page CSS and uses asset URLs relative to the CSS file; load it once in the head before JavaScript. `app.min.css` is available separately for integrations that build their own component styles. Do not load it again alongside a complete page stylesheet. JavaScript does not fetch CSS on behalf of the CMS.

Behavior is discovered from component attributes, rather than the current page name:

| Component | Root attribute |
| --- | --- |
| Preloader | `data-preloader` |
| Page reveal animation (GSAP) | `.site-page` |
| Main navigation | `data-navigation` |
| Card/brand carousel | `data-slider` |
| Hero | `data-hero` |
| Product gallery | `data-product-gallery` |
| Product actions | `data-product-detail` |
| Catalog UI | `data-catalog` |
| Optional catalog demo filter | `data-catalog-filter` + `data-catalog-demo` |
| Publication tabs | `data-tabs` |
| Contact demo form | `data-contacts-form` |


Preserve the supplied component structure, control attributes and BEM classes. Give IDs unique values when rendering multiple instances and update their matching `aria-controls`, `aria-labelledby` and anchor references. Tab panels and catalog state are resolved within their own component.

See [catalog integration](catalog-integration.md) for disabling the demonstration filter or replacing it with AJAX. Keep the catalog UI root when switching filtering implementations.

## AJAX insertion and removal

An observer discovers inserted component roots and initializes them automatically. It also destroys detached roots, aborts their event listeners, disconnects carousel observers, cancels animations and removes generated slides. Moving a node within the same document keeps its current instance. Offscreen carousels retain their lazy initialization.

For explicit integration or when subsequent CMS code needs the widget immediately, await the public interface:

```js
container.insertAdjacentHTML('beforeend', html);
await window.ShopEnergo.init(container);
```

Repeated `init()` calls preserve the existing instance and do not create additional handlers, clones or pagination buttons. Initialization resolves after optional modules have loaded; individual offscreen sliders may still wait until they approach the viewport.

Before replacing a component's internal markup, explicitly destroy and initialize it:

```js
window.ShopEnergo.destroy(container);
container.innerHTML = html;
await window.ShopEnergo.init(container);
```

For an existing root whose internal markup has already changed, including adding/removing slides or replacing a gallery track, refresh it:

```js
await window.ShopEnergo.refresh(container);
```

`refresh()` destroys and initializes components inside the supplied container. It resets carousel position. AJAX callbacks must use it for changes inside an existing initialized widget; the automatic observer handles insertion and removal of whole component roots, and deliberately does not interpret every internal DOM mutation as a refresh.

Integrations using events may dispatch `shop-energo:init` or `shop-energo:destroy` on `document` with `detail: { root: container }`. Use the methods when awaiting completion is required. Do not repeatedly inject the application bundle in AJAX responses.

## Application-specific behavior

The lightbox uses one document-level delegated listener, so newly inserted photograph links work immediately. Removing its active trigger's container closes the popup. All component handlers are registered through a lifecycle controller; deleting a widget releases its handlers and retained state.

Catalog filtering, comparison selection and contact submission remain storefront demonstrations. Catalog filter and comparison handlers see newly appended product cards, but server filtering, cart actions, payment and actual form delivery belong to the CMS. Replace these demonstration handlers when wiring the backend. The contact demo prevents native submission and shows the existing explicit unavailable message.

This contract covers the supplied markup and current desktop browser APIs. CMS-specific routing, theme scripts and backend callbacks must be verified during that integration. The source and production HTML, JavaScript and CSS contain no explanatory comments or author/generator attribution; mandatory asset license files remain with the assets.
