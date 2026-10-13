import { createCarousel } from './carousel.js';

export function initProductGallery(gallery) {
  const track = gallery.querySelector('[data-product-gallery-track]');
  const images = Array.from(track.querySelectorAll('img'));
  const photo = gallery.querySelector('.product-gallery__photo');
  const status = gallery.querySelector('[data-product-photo-status]');
  createCarousel(gallery, {
    tracks: [track, gallery.querySelector('[data-product-thumbnail-track]')],
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
}
