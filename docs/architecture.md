# Desktop storefront architecture

The eight pages share one desktop shell and retain the Pixso layout at 1440 px. Header, page and footer backgrounds fill the window; their content uses the centered 1440 px container. Mobile and tablet layouts and server-side commerce are outside the current implementation.

## Source and build

- `src/*.html` contains each page's unique content. `<!-- include: name -->` inserts a shared fragment from `src/partials/` during the build.
- `scripts/pages.mjs` declares page metadata, navigation state, category state and shared news variants. `scripts/templates.mjs` renders these values without a browser framework.
- `src/css/base/` owns tokens, fonts, typography and UI primitives. `.stack` supplies a column flex layout; `.panel` supplies a white surface with a configurable `--panel-line` border.
- `src/css/blocks/` owns visual components. Page-specific geometry stays in its component. Shared components use the same classes and fragments across pages.
- `src/css/app.css` imports the common shell. `src/css/pages/<page>.css` imports only components used by that page. Import base product cards before page-specific recommendation overrides.
- `src/js/main.js` initializes common sliders, tabs and the photo lightbox. It loads optional page behavior through dynamic imports keyed by `body[data-page]`.
- `src/js/pages/` owns page interactions; `src/js/modules/` owns reusable behavior.

`npm run build` renders HTML, minifies CSS, splits JavaScript into local ES modules and writes `dist/`. HTML uses only the generated bundles. Paths are relative and work under `/shop-energo/`. Source HTML is a template and must be previewed through the build, rather than served directly.

## Carousels and photo viewing

`createCarousel(root, { tracks, onChange })` is the shared carousel engine. Every track has the same number of original items in the same order, and each track sits inside its own viewport. It synchronizes tracks, loops through cloned items, queues rapid input, handles arrow keys, resize and reduced motion, and makes offscreen items inert. Clones must not contain IDs relied on by other components.

Controls inside the root use `data-carousel-next`, `data-carousel-previous` or a zero-based `data-carousel-go-to`. The callback receives `{ index, moving, count }`. The returned interface exposes `next()`, `previous()` and `goTo(index)` for valid original indices. Adapters in `slider.js`, `hero.js` and `product-gallery.js` handle component-specific labels and state. The hero derives its dots from the real slide count and hides pagination for a single slide. It has no automatic playback.

An `a[data-lightbox-open]` keeps its original image URL as a fallback. The shared lightbox creates one native dialog on demand, with an SVG close button, Escape handling and focus return. Optional `data-lightbox-caption` and `data-lightbox-width` configure the view without introducing a page-specific popup.

## Assets and performance

All assets, libraries and fonts are local. The build converts raster sources to WebP with content hashes, caps oversized images, and uses lossless encoding for maps, certificates and payment graphics. Original exports remain in `src/assets/`; generated image cache files live in ignored `.local/cache/`. SVGs stay SVGs. WOFF2 subsets retain the supplied font designs; original fonts and licenses remain available in the source tree. Unused TTFs are excluded from the published output.

Critical header imagery and Arimo fonts are preloaded. Main hero/product imagery has high fetch priority; other HTML images load lazily. Page CSS and JavaScript behavior are loaded only where needed. Performance changes must preserve the supplied palette, geometry and typography.

## Adding or extending a page

1. Add its source HTML and reuse the shared include markers and components.
2. Register metadata and navigation state in `scripts/pages.mjs`.
3. Add its CSS entry under `src/css/pages/`; create a block file only for a distinct visual component.
4. If behavior is required, add a page initializer under `src/js/pages/` and its loader in `src/js/main.js`. Prefer an existing module for tabs, carousels or photographs.
5. Build, run `npm run check`, and verify appearance and interactions on the local desktop preview.

`npm run dev -- --host 127.0.0.1 --port 4173 --base /shop-energo/ --strictPort` builds and watches the source. Stop the watcher before a separate manual build to avoid concurrent output cleanup.

`npm run check` validates rendered includes, IDs, local files, anchors and metadata. `npm run audit:desktop -- --base <URL> --output <folder>` runs desktop Lighthouse for all pages; `--pages index,product` limits the set. The runner accepts `CHROME_PATH`. Local Lighthouse is diagnostic; Google PageSpeed Insights results must be recorded separately for the published URLs.

Catalog filtering and comparison selection operate on the supplied demonstration products. The contact form validates locally and explicitly states that delivery is not connected. Unimplemented destinations retain the authorized `href="#"` placeholders. These behaviors do not claim backend integration.
