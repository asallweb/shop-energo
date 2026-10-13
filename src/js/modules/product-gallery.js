import { createCarousel } from './carousel.js';
import { mountElements } from './lifecycle.js';

export function initProductGallery(root = document) {
  mountElements(root, '[data-product-gallery]', gallery => {
    const track = gallery.querySelector('[data-product-gallery-track]');
    const thumbnails = gallery.querySelector('[data-product-thumbnail-track]');
    const photo = gallery.querySelector('.product-gallery__photo');
    const status = gallery.querySelector('[data-product-photo-status]');
    if (!track || !thumbnails || !photo || !status) return false;
    const images = Array.from(track.children).filter(item => !item.hasAttribute('data-carousel-clone')).map(item => item.querySelector('img'));
    const thumbnailCount = Array.from(thumbnails.children).filter(item => !item.hasAttribute('data-carousel-clone')).length;
    if (!images.length || images.some(image => !image) || thumbnailCount !== images.length) return false;
    const carousel = createCarousel(gallery, {
      tracks: [track, thumbnails],
      onChange: ({ index, moving, count }) => {
        photo.href = images[index].src;
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
    return () => {
      carousel.destroy();
      delete gallery.dataset.productGalleryIndex;
      delete gallery.dataset.productGalleryMoving;
    };
  });
}
