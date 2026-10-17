import { createCarousel } from './carousel.js';
import { mountElements } from './lifecycle.js';

export function initProductGallery(root = document) {
  mountElements(root, '[data-product-gallery]', (gallery, signal) => {
    const track = gallery.querySelector('[data-product-gallery-track]');
    const thumbnails = gallery.querySelector('[data-product-thumbnail-track]');
    const photo = gallery.querySelector('.product-gallery__photo');
    const status = gallery.querySelector('[data-product-photo-status]');
    if (!track || !thumbnails || !photo || !status) return false;
    const images = Array.from(track.children).filter(item => !item.hasAttribute('data-carousel-clone')).map(item => item.querySelector('img'));
    const slides = Array.from(track.children).filter(item => !item.hasAttribute('data-carousel-clone'));
    const buttons = Array.from(thumbnails.children).filter(item => !item.hasAttribute('data-carousel-clone'));
    const thumbnailCount = buttons.length;
    if (!images.length || images.some(image => !image) || thumbnailCount !== images.length) return false;
    const mobile = matchMedia('(max-width: 767px)');
    const altTexts = images.map(image => image.alt);
    const labels = buttons.map(button => button.getAttribute('aria-label'));
    let carousel;

    function update() {
      carousel?.destroy();
      const count = mobile.matches ? Math.min(3, images.length) : images.length;
      slides.forEach((slide, index) => {
        if (index < count) {
          track.append(slide);
          thumbnails.append(buttons[index]);
        } else {
          slide.remove();
          buttons[index].remove();
        }
        images[index].alt = mobile.matches ? altTexts[0] : altTexts[index];
        buttons[index].setAttribute('aria-label', mobile.matches ? `Фото ${index + 1}: ${altTexts[0]}` : labels[index]);
      });
      carousel = createCarousel(gallery, {
        tracks: [track, thumbnails],
        onChange: ({ index, moving, count }) => {
          const source = mobile.matches && images[index].closest('picture')?.querySelector('source');
          photo.href = source ? source.srcset : images[index].src;
          photo.dataset.lightboxCaption = images[index].alt;
          photo.setAttribute('aria-label', 'Открыть фото ' + (index + 1) + ' в полном просмотре');
          status.textContent = 'Фото ' + (index + 1) + ' из ' + count;
          gallery.dataset.productGalleryIndex = String(index);
          gallery.dataset.productGalleryMoving = String(moving);
          gallery.querySelectorAll('[data-product-thumbnail]').forEach(thumbnail => {
            thumbnail.setAttribute('aria-pressed', String(Number(thumbnail.dataset.productThumbnail) === index));
          });
        },
      });
    }

    mobile.addEventListener('change', update, { signal });
    update();
    return () => {
      carousel.destroy();
      slides.forEach((slide, index) => {
        track.append(slide);
        thumbnails.append(buttons[index]);
        images[index].alt = altTexts[index];
        buttons[index].setAttribute('aria-label', labels[index]);
      });
      delete gallery.dataset.productGalleryIndex;
      delete gallery.dataset.productGalleryMoving;
    };
  });
}
