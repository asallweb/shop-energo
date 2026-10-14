# Storefront architecture

The eight pages share one shell and retain the Pixso layout at 1440 px. Header, page and footer backgrounds fill the window; their content uses a centered container capped at 1440 px. All layouts adapt down to 768 px. The homepage, catalog and delivery page also have supplied mobile layouts from 320 px, with their exact references at 390 px. Other pages below 768 px and server-side commerce are outside the current implementation.

Below 1440 px, each component's stylesheet contains its responsive rules. The page uses a flexible content column; below 1100 px, the catalog, services and certificate move above the content in three columns. Below 1200 px, the header separates its logo and contact information into rows, discloses its navigation through a menu button, and the footer uses three columns. Product and news cards reflow. The shared carousel engine observes its viewport and recalculates positions on resize.

Below 768 px, the homepage follows the updated 390 px Pixso frame: mobile header, nine-category directory, company and service sections, two vertical product selections, tags, certificate, advantages, a two-column brand grid, news tabs and a stacked dark footer. `category-directory.css` and `certificate.css` own the mobile-only blocks; the remaining components retain their shared structures and component stylesheets. Product images use local responsive picture sources. `navigation.js` controls menu and search disclosure, Escape handling and focus return. The mobile menu overlays the page without changing its layout, including when search is open. Hero, product and brand adapters destroy their carousels below 768 px and restore them when the viewport grows; mobile selections contain only original, accessible items.

The mobile catalog reuses that header and dark footer, the catalog heading, pagination and the existing filter form. A disclosure button shows the form below the heading. The supplied mobile assortment differs from the desktop demonstration list: `catalog-mobile-list.html` contains ten mobile products with their own local images, while the desktop list remains unchanged. `catalog.js` applies the same criteria to both lists and updates the visible summary on breakpoint changes. `catalog-mobile-product.css` owns these rows; `catalog-article.html` and `catalog-article.css` own the mobile article. Text and separators use normal flow to avoid overlaps present in the design, as approved by the user; the article, images and footer retain their reference positions at 390 px.

`pages.html` is a simple index of the eight completed layouts. Its basic styles live only in its inline `<style>` element; it loads no storefront CSS or JavaScript and is copied directly from `src/pages.html` during the build. The storefront homepage remains `index.html`.

## Source and build

The mobile delivery page reuses its desktop sections, search, navigation anchors, certificate, advantages, brands, news and footer. Its component styles provide mobile stacking and spacing; local picture sources supply the original van, maps and condition badges from the mobile design. On this page, `templates.mjs` selects the mobile brand-grid mode and the supplied small arrow asset. `slider.js` rotates two brand items per action below768px, restores the original order on teardown and uses the common carousel above that breakpoint. The homepage retains its static mobile brand grid. Restart the dev process after changing build modules under `scripts/`; its watcher observes `src/`.

- `src/*.html` contains each page's unique content. `<template data-include="name"></template>` inserts a shared fragment from `src/partials/` during the build. These template elements are expanded out of the delivered HTML.
- `scripts/pages.mjs` declares page metadata, navigation state, category state and shared news variants. `scripts/templates.mjs` renders these values without a browser framework.
- `src/css/base/` owns tokens, fonts, typography and UI primitives. `.stack` supplies a column flex layout; `.panel` supplies a white surface with a configurable `--panel-line` border.
- `src/css/blocks/` owns visual components. Page-specific geometry stays in its component. Shared components use the same classes and fragments across pages.
- `src/css/app.css` imports the common shell. `src/css/pages/<page>.css` imports only components used by that page. Import base product cards before page-specific recommendation overrides.
- `src/js/main.js` initializes navigation, common sliders, tabs and the photo lightbox. It loads optional behavior through dynamic imports keyed by component data attributes, including AJAX fragments. `lifecycle.js` prevents duplicate initialization and releases handlers on removal.
- `src/js/pages/` owns page interactions; `src/js/modules/` owns reusable behavior.

`npm run build` renders HTML, minifies CSS, splits JavaScript into local ES modules and writes `dist/`. HTML uses only the generated bundles. Paths are relative and work under `/shop-energo/`. Source HTML is a template and must be previewed through the build, rather than served directly.

## Carousels and photo viewing

`createCarousel(root, { tracks, onChange })` is the shared carousel engine. Every track has the same number of original items in the same order, and each track sits inside its own viewport. It synchronizes tracks, loops through cloned items, queues rapid input, handles arrow keys, resize and reduced motion, and makes offscreen items inert. Clones must not contain IDs relied on by other components.

Controls inside the root use `data-carousel-next`, `data-carousel-previous` or a zero-based `data-carousel-go-to`. The callback receives `{ index, moving, count }`. The returned interface exposes `next()`, `previous()`, `goTo(index)` and `destroy()`. Destruction cancels timers and observers and restores original track items. Clones have `data-carousel-clone` and are excluded from component discovery. Adapters in `slider.js`, `hero.js` and `product-gallery.js` handle component-specific labels and state. The hero derives its dots from the real slide count and hides pagination for a single slide. It has no automatic playback.

An `a[data-lightbox-open]` keeps its original image URL as a fallback. The shared lightbox creates one native dialog on demand, with an SVG close button, Escape handling and focus return. Optional `data-lightbox-caption` and `data-lightbox-width` configure the view without introducing a page-specific popup.

## Assets and performance

All assets, libraries and fonts are local. The build converts raster sources to WebP with content hashes, caps oversized images, and uses lossless encoding for maps, certificates and payment graphics. Original exports remain in `src/assets/`; generated image cache files live in ignored `.local/cache/`. SVGs stay SVGs. WOFF2 subsets retain the supplied font designs; original fonts and licenses remain available in the source tree. Unused TTFs are excluded from the published output.

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
