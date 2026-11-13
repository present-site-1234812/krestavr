// Runs in the head, before the embedded images are parsed.
(() => {
  'use strict';
  const root = document.documentElement;
  let finished = false;
  root.classList.add('is-loading');
  root.setAttribute('aria-busy', 'true');

  function reveal() {
    if (finished) return;
    finished = true;
    clearTimeout(failsafe);
    root.classList.remove('is-loading');
    root.setAttribute('aria-busy', 'false');
    const loader = document.querySelector('#page-loader');
    if (loader) {
      loader.setAttribute('aria-hidden', 'true');
      loader.classList.add('is-leaving');
      setTimeout(() => loader.remove(), 320);
    }
    document.dispatchEvent(new Event('site:ready'));
  }

  // A failed image/font or a stalled connection must never lock the page.
  const failsafe = setTimeout(reveal, 20000);
  async function resourcesReady() {
    try {
      const images = [...document.images].filter(image => image.hasAttribute('src'));
      const decoding = images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => {});
      });
      const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      await Promise.all([fonts, ...decoding]);
      // Let layout and the first Canvas frame finish before exposing the page.
      requestAnimationFrame(() => requestAnimationFrame(reveal));
    } catch {
      reveal();
    }
  }

  if (document.readyState === 'complete') resourcesReady();
  else window.addEventListener('load', resourcesReady, { once: true });
  window.addEventListener('pageshow', event => {
    if (event.persisted) reveal();
  });
})();
