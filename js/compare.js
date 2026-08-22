/* Drag-to-compare before/after slider. No dependencies.
   A real <input type="range"> drives it, so pointer, touch, keyboard
   and assistive tech all work without us reimplementing any of it. */
(function () {
  'use strict';

  // The slider sits just below the fold, and its two photos are heavy enough
  // to starve the hero of bandwidth on a slow connection. Keeping their URLs
  // in data-* hides them from the preload scanner; we attach them once the
  // hero has finished loading. <noscript> covers the JS-off case.
  function hydrate() {
    var pending = document.querySelectorAll('[data-lazy] [data-srcset], [data-lazy] [data-src]');
    Array.prototype.forEach.call(pending, function (el) {
      if (el.dataset.srcset) el.srcset = el.dataset.srcset;
      if (el.dataset.src) el.src = el.dataset.src;
      el.removeAttribute('data-srcset');
      el.removeAttribute('data-src');
    });
  }

  if (document.readyState === 'complete') hydrate();
  else window.addEventListener('load', hydrate);

  var frames = document.querySelectorAll('[data-compare]');

  Array.prototype.forEach.call(frames, function (frame) {
    var range = frame.querySelector('.compare__range');
    if (!range) return;

    function paint() {
      frame.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', Math.round(range.value) + '% after');
    }

    range.addEventListener('input', paint);

    // step="0.1" keeps dragging smooth but makes arrow keys crawl.
    // Give the keyboard a usable stride of its own.
    range.addEventListener('keydown', function (e) {
      var jump = { ArrowLeft: -4, ArrowRight: 4, ArrowDown: -4, ArrowUp: 4, PageDown: -20, PageUp: 20 }[e.key];
      var value = null;

      if (jump !== undefined) value = Number(range.value) + jump;
      else if (e.key === 'Home') value = 0;
      else if (e.key === 'End') value = 100;
      else return;

      e.preventDefault();
      range.value = String(Math.min(100, Math.max(0, value)));
      paint();
    });

    // Dragging over the image shouldn't also drag the page sideways.
    frame.addEventListener(
      'touchmove',
      function (e) {
        if (e.cancelable && document.activeElement === range) e.preventDefault();
      },
      { passive: false }
    );

    paint();
    frame.classList.add('is-ready');
  });
})();
