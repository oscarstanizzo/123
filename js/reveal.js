/* Soft fade-in for gallery images. Nothing else on the page animates on scroll. */
(function () {
  'use strict';

  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  // Only now do we let CSS hide anything — if this script never ran, the
  // gallery renders normally instead of staying blank.
  document.documentElement.classList.add('js-reveal');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showAll() {
    Array.prototype.forEach.call(items, function (el) {
      el.classList.add('is-in');
    });
  }

  if (reduced.matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
  );

  Array.prototype.forEach.call(items, function (el) {
    io.observe(el);
  });

  // If the user flips the preference mid-visit, stop hiding things.
  var onChange = function () {
    if (reduced.matches) {
      io.disconnect();
      showAll();
    }
  };
  if (reduced.addEventListener) reduced.addEventListener('change', onChange);
})();
