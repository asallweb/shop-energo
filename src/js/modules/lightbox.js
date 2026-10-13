export function initLightbox() {
  let dialog;
  let image;
  let caption;
  let trigger;

  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.id = 'photo-lightbox';
    dialog.dataset.lightbox = '';
    dialog.setAttribute('aria-labelledby', 'photo-lightbox-caption');
    dialog.innerHTML = `
      <button class="lightbox__close" type="button" data-lightbox-close aria-label="Закрыть просмотр фотографии" autofocus>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <figure>
        <img class="lightbox__image" alt="">
        <figcaption class="lightbox__caption" id="photo-lightbox-caption"></figcaption>
      </figure>`;
    document.body.append(dialog);
    image = dialog.querySelector('.lightbox__image');
    caption = dialog.querySelector('.lightbox__caption');
    const closeButton = dialog.querySelector('[data-lightbox-close]');

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButton.focus();
      }
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-lightbox-open]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (!dialog) createDialog();
    trigger = link;
    const description = link.dataset.lightboxCaption || link.querySelector('img')?.alt || link.textContent.trim() || 'Просмотр фотографии';
    image.src = link.href;
    image.alt = description;
    caption.textContent = description;
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    dialog.showModal();
  });
}
