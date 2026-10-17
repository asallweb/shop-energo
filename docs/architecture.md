# Storefront architecture

The pages share one shell and retain the Pixso layout at 1440 px. Header, page and footer backgrounds fill the window; their content uses a centered container capped at 1440 px. All layouts adapt down to 768 px. The homepage, catalog, delivery and product detail pages also have supplied mobile layouts from 320 px, with their exact references at 390 px. Other pages below 768 px and server-side commerce are outside the current implementation.

Below 1440 px, each component's stylesheet contains its responsive rules. The page uses a flexible content column; below 1100 px, the catalog, services and certificate move above the content in three columns. Below 1200 px, the header separates its logo and contact information into rows, discloses its navigation through a menu button, and the footer uses three columns. Product and news cards reflow. The shared carousel engine observes its viewport and recalculates positions on resize.

Below 768 px, the homepage follows the updated 390 px Pixso frame: mobile header, nine-category directory, company and service sections, two vertical product selections, tags, certificate, advantages, a two-column brand grid, news tabs and a stacked dark footer. `category-directory.css` and `certificate.css` own the mobile-only blocks; the remaining components retain their shared structures and component stylesheets. Product images use local responsive picture sources. `navigation.js` controls menu and search disclosure, Escape handling and focus return. The mobile menu overlays the page without changing its layout, including when search is open. On home, catalog, delivery and product detail below 768 px, `mobile-menu.css` styles the shared two-level navigation in the header partial: catalog and services expand independently through accessible buttons, links close the panel, and the close button returns focus to the menu toggle. The panel scrolls within the available viewport; tablet and desktop navigation retain their existing layouts. Hero, product and brand adapters destroy their carousels below 768 px and restore them when the viewport grows; mobile selections contain only original, accessible items.

The mobile catalog uses the same eight product records and semantic cards as desktop. Below 768 px, catalog-product.css stacks their image, title, availability, specifications, price, cart action, discount and comparison controls. The current 390 px design replaces the previous mobile assortment and article with search, category heading, disclosure button, eight cards, pagination, category tags, advantages, a vertical brand list, publication tabs and the shared footer. The open filter occupies the mobile content area, with two-column brand choices, full-width criteria, optional fields, quick power controls and sorting. Applying criteria closes it and updates the results; the close button and Escape preserve the selected values. catalog.js owns the disclosure UI, comparison counts and breakpoint changes; catalog-demo.js optionally filters and sorts local records only when the form has data-catalog-demo. Desktop rendering is preserved.

`pages.html` is a simple index of the eight completed layouts. Its basic styles live only in its inline `<style>` element; it loads no storefront CSS or JavaScript and is copied directly from `src/pages.html` during the build. The storefront homepage remains `index.html`.

The mobile payment page reuses its desktop content and icons. Below 768 px, payment component styles stack the four payment methods, document summaries and help block with the spacing and typography of the 390 px design. Advantages, the four vertical brands, publication tabs, header, two-level menu and footer reuse the shared mobile components. The main search and sidebar are hidden on this page; header search remains available. Desktop rendering is preserved.

The mobile contacts page stacks the existing contact cards, office information, reservation advice, pickup assistance and message form below 768 px. A local picture source supplies the map exported from the mobile design; desktop retains its original map and layout. The shared mobile header, two-level menu, advantages, brands, publication tabs and footer are reused. Existing form validation and its explicit notice that submission is not connected remain in contacts.js; the pickup button focuses the message field.

The mobile returns page reuses the desktop text and numbered icons. Below 768 px, its block styles stack the return conditions, repair guidance, contact links and assortment links with the dimensions of the 390 px design. Shared header, two-level menu, advantages, brands, publication tabs and footer are reused. The existing links remain semantic links; this informational page needs no additional JavaScript.

The mobile offers page follows the 390 px gray-background design below 768 px. The promo uses a grid for the full-width introduction and the term beside the percent graphic. offers-reasons.css adapts the shared numbered-card markup locally, including smaller text badges while preserving desktop icons. The empty offers state, stacked catalog/question actions and manager contacts reuse the existing content and links. Shared mobile header, menu, advantages, brands, tabs and footer are reused; no additional behavior is required.

## Source and build

Each storefront document embeds its complete minified page stylesheet in the head before the module script and body. The build prepends the common CSS entry to each page entry, resolves all imports, and embeds that generated bundle with asset URLs rebased relative to the HTML document. Rendering therefore does not depend on an external CSS request. Source styles remain in their component files; standalone page bundles and `app.min.css` remain available for CMS use. Font preloads and the mobile logo are discovered early; desktop header image preloads are restricted to desktop viewports.

All eight storefront documents share the `site-page` shell marker. Mobile header, navigation, footer and minimum width use that marker, so adding a page does not require changing a list of page names in CSS and JavaScript. Page-specific classes retain their content layouts and component variants. The informational payment, contacts, returns and offers headings use `page-heading--mobile` for their shared mobile typography and spacing.

The mobile delivery page reuses its desktop sections, search, navigation anchors, certificate, advantages, brands, news and footer. Its component styles provide mobile stacking and spacing; local picture sources supply the original van, maps and condition badges from the mobile design. On this page, `templates.mjs` selects the mobile brand-grid mode and the supplied small arrow asset. `slider.js` rotates two brand items per action below768px, restores the original order on teardown and uses the common carousel above that breakpoint. The homepage retains its static mobile brand grid. Restart the dev process after changing build modules under `scripts/`; its watcher observes `src/`.

The mobile product detail page reuses its desktop HTML and local assets. Its component styles place gallery, purchase controls, brief parameters, help, conditions, section navigation, specifications, description, documents, feedback and recommendations in the supplied mobile order. Header, two-level menu and dark footer are shared with the other mobile pages. Below 768 px, product-gallery.js mounts three original entries with the repeated product image supplied in the design; above that breakpoint it restores all five desktop demonstration photos. Resizing and teardown restore original nodes, labels and carousel handlers. Picture sources preserve the desktop images, and lightbox links follow the active source.

- `src/*.html` contains each page's unique content. `<template data-include="name"></template>` inserts a shared fragment from `src/partials/` during the build. These template elements are expanded out of the delivered HTML.
- `scripts/pages.mjs` declares page metadata, navigation state, category state and shared news variants. `scripts/templates.mjs` renders these values without a browser framework.
- `src/css/base/` owns tokens, fonts, typography and UI primitives. `.stack` supplies a column flex layout; `.panel` supplies a white surface with a configurable `--panel-line` border.
- `src/css/blocks/` owns visual components. Page-specific geometry stays in its component. Shared components use the same classes and fragments across pages.
- `src/css/app.css` imports the common shell. `src/css/pages/<page>.css` imports only components used by that page. Import base product cards before page-specific recommendation overrides.
- `src/js/main.js` initializes navigation, common sliders, tabs and the photo lightbox. It loads optional behavior through dynamic imports keyed by component data attributes, including AJAX fragments. `lifecycle.js` prevents duplicate initialization and releases handlers on removal.
- `src/js/pages/` owns page interactions; `src/js/modules/` owns reusable behavior.

`npm run build` renders HTML, minifies CSS, splits JavaScript into local ES modules and writes `dist/`. HTML uses only the generated bundles. Paths are relative and work under `/shop-energo/`. Source HTML is a template and must be previewed through the build, rather than served directly.

## Catalog integration

The form marker `data-catalog-demo` opts into the local demonstration adapter. Remove it to use native submission or backend AJAX while keeping the disclosure UI. Both modules use the existing lifecycle; handlers are aborted on destroy and repeated init is idempotent. Integration instructions, lifecycle examples and events are documented in [catalog-integration.md](catalog-integration.md).

## Carousels and photo viewing

`createCarousel(root, { tracks, onChange })` is the shared carousel engine. Every track has the same number of original items in the same order, and each track sits inside its own viewport. It synchronizes tracks, loops through cloned items, queues rapid input, handles arrow keys, resize and reduced motion, and makes offscreen items inert. Clones must not contain IDs relied on by other components.

Controls inside the root use `data-carousel-next`, `data-carousel-previous` or a zero-based `data-carousel-go-to`. The callback receives `{ index, moving, count }`. The returned interface exposes `next()`, `previous()`, `goTo(index)` and `destroy()`. Destruction cancels timers and observers and restores original track items. Clones have `data-carousel-clone` and are excluded from component discovery. Adapters in `slider.js`, `hero.js` and `product-gallery.js` handle component-specific labels and state. The hero derives its dots from the real slide count and hides pagination for a single slide. It has no automatic playback.

An `a[data-lightbox-open]` keeps its original image URL as a fallback. The shared lightbox creates one native dialog on demand, with an SVG close button, Escape handling and focus return. Optional `data-lightbox-caption` and `data-lightbox-width` configure the view without introducing a page-specific popup.

## Assets and performance

All assets, libraries and fonts are local. The build converts raster sources to WebP with content hashes, caps oversized images, and uses lossless encoding for maps, certificates and payment graphics. Used original exports remain in `src/assets/`; generated image cache files live in ignored `.local/cache/`. SVGs stay SVGs. WOFF2 subsets retain the supplied font designs and their licenses. Unreferenced exports and redundant TTF originals are removed from the source tree. Asset copying and conversion include only paths referenced by source HTML, CSS, JavaScript or build templates; license texts are retained. `npm run check` rejects unreferenced production assets. Complete standalone CSS bundles remain intentional CMS integration artifacts.

Critical header imagery and Arimo fonts are preloaded. Main hero/product imagery has high fetch priority; other HTML images load lazily. Page CSS and JavaScript behavior are loaded only where needed. Performance changes must preserve the supplied palette, geometry and typography.

Below-the-fold card and brand carousels initialize as they approach the viewport, avoiding cloned DOM and layout work during the initial render. The engine measures all tracks before writing their styles and visibility state.

## Adding or extending a page

1. Add its source HTML and reuse the shared include markers and components.
2. Register metadata and navigation state in `scripts/pages.mjs`.
3. Add its CSS entry under `src/css/pages/`; create a block file only for a distinct visual component.
4. If behavior is required, add a page initializer under `src/js/pages/` and its loader in `src/js/main.js`. Prefer an existing module for tabs, carousels or photographs.
5. Build, run `npm run check`, and verify appearance and interactions on the local preview from 768 px through desktop, including the unchanged 1440 px reference. Check homepage and catalog changes from 320 px as well, with comparisons to their mobile designs at 390 px.

`npm run dev -- --host 127.0.0.1 --port 4173 --base /shop-energo/ --strictPort` builds and watches the source. Stop the watcher before a separate manual build to avoid concurrent output cleanup.

`npm run check` validates rendered includes, IDs, local files, anchors, metadata and absence of HTML, JavaScript and CSS comments in source and output. JavaScript and CSS are parsed, so comment-like text inside strings or URLs is not mistaken for a comment. `npm run audit:desktop -- --base <URL> --output <folder>` runs desktop Lighthouse for all pages; `--pages index,product` limits the set. The runner accepts `CHROME_PATH`. Local Lighthouse is diagnostic; Google PageSpeed Insights results must be recorded separately for the published URLs. See `docs/cms-integration.md` for the JavaScript integration contract.

Catalog filtering and comparison selection operate on the supplied demonstration products. The contact form validates locally and explicitly states that delivery is not connected. Unimplemented destinations retain the authorized `href="#"` placeholders. These behaviors do not claim backend integration.
